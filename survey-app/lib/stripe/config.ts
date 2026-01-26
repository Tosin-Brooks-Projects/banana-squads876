import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Stripe Price IDs - these will be created in your Stripe Dashboard
// For now, we'll use dynamic pricing with Stripe Checkout
export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || null,
  pro: process.env.STRIPE_PRICE_PRO || null,
  business: process.env.STRIPE_PRICE_BUSINESS || null,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || null,
} as const;
