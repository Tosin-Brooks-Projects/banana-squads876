import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  console.warn('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
}) : null as unknown as Stripe;

// Stripe Price IDs - these will be created in your Stripe Dashboard
// For now, we'll use dynamic pricing with Stripe Checkout
export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || null,
  pro: process.env.STRIPE_PRICE_PRO || null,
  business: process.env.STRIPE_PRICE_BUSINESS || null,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || null,
} as const;
