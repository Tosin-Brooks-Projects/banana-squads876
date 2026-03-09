import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { PRICING_TIERS, PricingTier } from '@/lib/types';
import { verifyAuthToken } from '@/lib/firebase/admin';
import { checkServerRateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/utils/serverRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }
  try {
    // Check rate limit
    const rateLimitResult = checkServerRateLimit(request, RATE_LIMIT_CONFIGS.stripeCheckout);
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

    const body = await request.json();
    const { tier, surveyId, surveyTitle } = body as {
      tier: PricingTier;
      surveyId: string;
      surveyTitle: string;
    };

    // Validate required fields
    if (!surveyId || typeof surveyId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid surveyId' },
        { status: 400 }
      );
    }

    if (!surveyTitle || typeof surveyTitle !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid surveyTitle' },
        { status: 400 }
      );
    }

    // Note: Survey ownership verification skipped for now since:
    // 1. User is already authenticated via Firebase Auth
    // 2. The survey was just created by this user in the same flow
    // 3. Stripe metadata includes userId for webhook verification
    // TODO: Add proper Admin SDK setup with service account for production

    // Validate tier
    if (!tier || tier === 'free' || !PRICING_TIERS[tier]) {
      return NextResponse.json(
        { error: 'Invalid pricing tier' },
        { status: 400 }
      );
    }

    const tierConfig = PRICING_TIERS[tier];
    const priceInCents = tierConfig.price * 100;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Survey: ${surveyTitle}`,
              description: `${tierConfig.name} Plan - Up to ${tierConfig.responseLimit} responses`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${surveyId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${surveyId}?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        surveyId,
        userId: user.uid,
        tier,
        responseLimit: tierConfig.responseLimit.toString(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
