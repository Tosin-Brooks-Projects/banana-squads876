import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { getSurvey, updateSurvey } from '@/lib/firebase/firestore';
import { PricingTier, PRICING_TIERS } from '@/lib/types';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook endpoint not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      const surveyId = session.metadata?.surveyId;
      const tier = session.metadata?.tier as PricingTier | undefined;
      const responseLimit = session.metadata?.responseLimit;

      // Validate that tier is a valid PricingTier
      if (surveyId && tier && PRICING_TIERS[tier]) {
        const paymentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? undefined;

        try {
          // Check if this payment has already been processed (idempotency)
          const existingSurvey = await getSurvey(surveyId);
          if (existingSurvey?.paymentId === paymentId) {
            console.log(`Payment ${paymentId} already processed for survey ${surveyId}, skipping`);
            break;
          }

          const tierConfig = PRICING_TIERS[tier];
          const dataExpiresAt = new Date();
          dataExpiresAt.setDate(dataExpiresAt.getDate() + tierConfig.retentionDays);

          await updateSurvey(surveyId, {
            pricingTier: tier,
            responseLimit: responseLimit ? parseInt(responseLimit, 10) : tierConfig.responseLimit,
            paymentStatus: 'paid',
            paymentId,
            dataExpiresAt,
            status: 'published',
            publishedAt: new Date(),
          });

          console.log(`Survey ${surveyId} upgraded to ${tier} tier`);
        } catch (dbError) {
          console.error(`Failed to update survey ${surveyId}:`, dbError);
          // Return 500 so Stripe retries the webhook
          return NextResponse.json(
            { error: 'Database update failed' },
            { status: 500 }
          );
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', paymentIntent.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
