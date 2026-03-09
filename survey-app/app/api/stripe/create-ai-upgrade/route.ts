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
    const { tier } = body as { tier: PricingTier };

    // Validate tier - must be a paid tier with AI access
    if (!tier || tier === 'free' || !PRICING_TIERS[tier]) {
      return NextResponse.json(
        { error: 'Invalid pricing tier' },
        { status: 400 }
      );
    }

    const tierConfig = PRICING_TIERS[tier];
    const priceInCents = tierConfig.price * 100;

    // Create Stripe Checkout session for AI upgrade
    // This returns user to create page with upgrade confirmation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Unboring Surveys - ${tierConfig.name} Plan`,
              description: `AI-powered question generation, ${tierConfig.responseLimit} responses, ${tierConfig.features.join(', ')}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/create?upgraded=true&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/create?upgrade_cancelled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.uid,
        tier,
        type: 'ai_upgrade', // Distinguish from survey payment
        responseLimit: tierConfig.responseLimit.toString(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe AI upgrade checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
