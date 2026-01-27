'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PRICING_TIERS } from '@/lib/types';
import PricingCard from '@/components/pricing/PricingCard';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const router = useRouter();
  const tiers = Object.values(PRICING_TIERS);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xl font-bold text-neutral-900">Unboring Surveys</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

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
                  onSelect={() => {
                    router.push('/login');
                  }}
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
