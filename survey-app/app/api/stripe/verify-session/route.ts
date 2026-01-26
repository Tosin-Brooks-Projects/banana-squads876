import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { verifyAuthToken } from '@/lib/firebase/admin';
import { checkServerRateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/utils/serverRateLimit';

export async function GET(request: NextRequest) {
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
