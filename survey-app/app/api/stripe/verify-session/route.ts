import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { verifyAuthToken, getSurveyAdmin, updateSurveyAdmin } from '@/lib/firebase/admin';
import { checkServerRateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/utils/serverRateLimit';
import { PricingTier, PRICING_TIERS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }
  // Check rate limit
  const rateLimitResult = checkServerRateLimit(request, RATE_LIMIT_CONFIGS.default);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult.resetAt);
  }

  // Verify authentication
  const authHeader = request.headers.get('authorization');
  const user = await verifyAuthToken(authHeader);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id parameter' },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the session belongs to the authenticated user
    if (session.metadata?.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    const surveyId = session.metadata?.surveyId;
    const tier = session.metadata?.tier as PricingTier | undefined;

    // If payment is successful, update the survey directly
    // This handles the case where webhooks can't reach localhost during development
    if (session.payment_status === 'paid' && surveyId && tier && PRICING_TIERS[tier]) {
      const paymentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      // Check if already processed (idempotency)
      const existingSurvey = await getSurveyAdmin(surveyId);
      if (existingSurvey && existingSurvey.paymentId !== paymentId) {
        const tierConfig = PRICING_TIERS[tier];
        const dataExpiresAt = new Date();
        dataExpiresAt.setDate(dataExpiresAt.getDate() + tierConfig.retentionDays);

        const updated = await updateSurveyAdmin(surveyId, {
          pricingTier: tier,
          responseLimit: tierConfig.responseLimit,
          paymentStatus: 'paid',
          paymentId,
          dataExpiresAt,
          status: 'published',
          publishedAt: new Date(),
        });

        if (updated) {
          console.log(`Survey ${surveyId} upgraded to ${tier} tier via verify-session`);
        } else {
          console.error(`Failed to update survey ${surveyId} via verify-session`);
        }
      }
    }

    return NextResponse.json({
      status: session.payment_status,
      surveyId: session.metadata?.surveyId,
      tier: session.metadata?.tier,
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
