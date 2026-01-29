'use client';

import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PRICING_TIERS, PricingTier } from '@/lib/types';
import PricingCard from '@/components/pricing/PricingCard';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { useAuthContext } from '@/contexts/AuthContext';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser } = useAuthContext();
  const [checkoutLoading, setCheckoutLoading] = useState<PricingTier | null>(null);

  const tiers = Object.values(PRICING_TIERS);
  const fromCreate = searchParams.get('from') === 'create';

  const handleTierSelect = async (tierId: PricingTier) => {
    // If not coming from create flow, just redirect to login
    if (!fromCreate) {
      router.push('/login');
      return;
    }

    // If free tier selected, go back to create page
    if (tierId === 'free') {
      router.push('/dashboard/create');
      return;
    }

    // If not logged in, redirect to login with return URL
    if (!firebaseUser) {
      router.push(`/login?redirect=/pricing?from=create`);
      return;
    }

    // User is logged in and selected a paid tier - initiate checkout
    setCheckoutLoading(tierId);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/stripe/create-ai-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: tierId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicHeader />

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-neutral-900"
          >
            Simple,{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Per-Survey</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-brand-200 -z-0"></span>
            </span>{' '}
            Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-2xl md:text-3xl text-neutral-600"
          >
            Pay once per survey.{' '}
            <span className="relative inline-block">
              <span className="relative z-10">No subscriptions.</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-brand-200 -z-0"></span>
            </span>
            {' '}No hidden fees.
          </motion.p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PricingCard
                  tier={tier}
                  isPopular={tier.id === 'pro'}
                  isSelected={false}
                  isLoading={checkoutLoading === tier.id}
                  onSelect={() => handleTierSelect(tier.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-neutral-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="How does per-survey pricing work?"
              answer="You pay once when you create a survey, based on how many responses you expect. Choose a tier that fits your needs."
            />
            <FaqItem
              question="What happens if I reach my response limit?"
              answer="When you reach 80% of your limit, we'll notify you. At 100%, new responses are held (not lost!) until you upgrade to a higher tier. You can upgrade anytime and all pending responses will be released."
            />
            <FaqItem
              question="Can I use it for free?"
              answer="Yes! Create unlimited surveys for free, each with up to 25 responses. Upgrade anytime to unlock AI features, CSV export, and more responses."
            />
            <FaqItem
              question="How long is my data stored?"
              answer="Free tier data is stored for 30 days. Starter tier includes 90-day retention. Pro and above include 1-year data retention. Paid tiers can export data anytime as CSV."
            />
            <FaqItem
              question="What payment methods do you accept?"
              answer="We accept all major credit and debit cards through Stripe, including Visa, Mastercard, American Express, and Discover."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Ready to Make Surveys Fun?
          </h2>
          <p className="text-neutral-600 mb-8">
            Join thousands of creators who are transforming the way they collect feedback.
          </p>
          <Link
            href="/login"
            className="inline-block bg-brand-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors"
          >
            Start Creating for Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-neutral-200 pb-6">
      <h3 className="text-lg font-semibold text-neutral-900">{question}</h3>
      <p className="mt-2 text-neutral-600">{answer}</p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
