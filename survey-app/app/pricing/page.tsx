'use client';

import { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Check, ArrowRight } from 'lucide-react';
import { PRICING_TIERS, PricingTier } from '@/lib/types';
import PricingCard from '@/components/pricing/PricingCard';
import { FooterLinks } from '@/components/ui/cta-3';
import { Navbar1 } from '@/components/ui/navbar-1';
import { useAuthContext } from '@/contexts/AuthContext';

const FAQS = [
  {
    question: "How does per-survey pricing work?",
    answer: "You pay once when you create a survey, based on how many responses you expect. Choose a tier that fits your needs — no recurring charges.",
  },
  {
    question: "What happens if I reach my response limit?",
    answer: "At 80% we notify you. At 100%, new responses are held (not lost!) until you upgrade. All pending responses release immediately on upgrade.",
  },
  {
    question: "Can I use it for free?",
    answer: "Yes! Create unlimited surveys for free, each with up to 25 responses. Upgrade anytime to unlock AI generation, CSV export, and higher limits.",
  },
  {
    question: "How long is my data stored?",
    answer: "Free tier: 30 days. Starter: 90 days. Pro and above: 1 year. Paid tiers can export data as CSV at any time.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "All major credit and debit cards via Stripe — Visa, Mastercard, American Express, and Discover.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-2 border-[#e5e5e5] rounded-2xl overflow-hidden bg-white shadow-[0_4px_0_#e5e5e5] transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-orange-50/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
      >
        <span className="font-fredoka font-bold text-[#3c3c3c] text-base">{question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-[#afafaf]"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-5 text-sm text-[#777777] font-outfit leading-relaxed border-t border-[#e5e5e5]">
              <p className="pt-4">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser } = useAuthContext();
  const [checkoutLoading, setCheckoutLoading] = useState<PricingTier | null>(null);

  const tiers = Object.values(PRICING_TIERS);
  const fromCreate = searchParams.get('from') === 'create';

  const handleTierSelect = async (tierId: PricingTier) => {
    if (!fromCreate) { router.push('/login'); return; }
    if (tierId === 'free') { router.push('/dashboard/create'); return; }
    if (!firebaseUser) { router.push(`/login?redirect=/pricing?from=create`); return; }

    setCheckoutLoading(tierId);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/stripe/create-ai-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tier: tierId }),
      });
      if (!response.ok) throw new Error('Failed to create checkout session');
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar1 />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b-2 border-[#e5e5e5]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border-2 border-orange-100 rounded-full mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 font-outfit">No subscriptions. Ever.</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-fredoka font-bold text-5xl md:text-6xl text-[#3c3c3c] leading-tight tracking-tight mb-4"
          >
            Simple,{' '}
            <span className="text-orange-500 relative">
              per-survey
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-orange-200 rounded-full" />
            </span>{' '}
            pricing.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#777777] font-outfit max-w-xl mx-auto"
          >
            Pay once per survey. Pick the tier that matches your audience size. All features included — no upsells mid-quest.
          </motion.p>
        </div>
      </section>

      {/* Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
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

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[11px] font-black uppercase tracking-widest text-[#afafaf] font-outfit"
          >
            {['Secure checkout via Stripe', 'One-time payment only', 'Cancel anytime', 'Responses never lost'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-orange-400" strokeWidth={3} />
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-2 border-[#e5e5e5] bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#afafaf] font-outfit">Compare plans</span>
            <h2 className="font-fredoka font-bold text-3xl md:text-4xl text-[#3c3c3c] mt-2">
              Everything included
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border-2 border-[#e5e5e5] shadow-[0_6px_0_#e5e5e5]">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-[#e5e5e5]">
                  <th className="text-left px-6 py-4 font-fredoka font-bold text-[#3c3c3c] text-base w-1/3">Feature</th>
                  {[{id:'free',label:'Free'},{id:'starter',label:'Starter'},{id:'pro',label:'Pro'},{id:'business',label:'Business'},{id:'enterprise',label:'Enterprise'}].map(({id, label}) => (
                    <th key={id} className={`px-4 py-4 text-center font-fredoka font-bold text-sm uppercase tracking-wide ${id === 'pro' ? 'text-orange-500 bg-orange-50/60' : 'text-[#777777]'}`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {[
                  { feature: 'Responses per survey', vals: ['25', '500', '2,500', '10,000', 'Unlimited'] },
                  { feature: 'AI survey generation', vals: [false, true, true, true, true] },
                  { feature: 'CSV export', vals: [false, true, true, true, true] },
                  { feature: 'Custom branding', vals: [false, false, true, true, true] },
                  { feature: 'Logic branching', vals: [false, false, true, true, true] },
                  { feature: 'Priority support', vals: [false, false, false, true, true] },
                  { feature: 'Data retention', vals: ['30 days', '90 days', '1 year', '1 year', 'Unlimited'] },
                  { feature: 'Team seats', vals: ['1', '1', '3', '10', 'Unlimited'] },
                ].map(({ feature, vals }, rowIdx) => (
                  <tr key={feature} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                    <td className="px-6 py-3.5 text-sm font-outfit font-medium text-[#4b4b4b]">{feature}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={`px-4 py-3.5 text-center text-sm font-outfit ${i === 2 ? 'bg-orange-50/40' : ''}`}>
                        {typeof v === 'boolean'
                          ? v
                            ? <Check className="w-4 h-4 text-orange-500 mx-auto" strokeWidth={3} />
                            : <span className="block w-4 h-0.5 bg-[#e5e5e5] mx-auto rounded-full" />
                          : <span className="font-medium tabular-nums text-[#3c3c3c]">{v}</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-2 border-[#e5e5e5]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#afafaf] font-outfit">Got Questions?</span>
            <h2 className="font-fredoka font-bold text-3xl md:text-4xl text-[#3c3c3c] mt-2">
              Frequently asked
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50 border-t-2 border-[#e5e5e5]">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 bg-orange-50 border-2 border-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_4px_0_#fed7aa]">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="font-fredoka font-bold text-3xl md:text-4xl text-[#3c3c3c] mb-3">
            Ready to make surveys <span className="text-orange-500">fun?</span>
          </h2>
          <p className="text-[#777777] font-outfit mb-8">
            Join thousands of creators transforming how they collect feedback.
          </p>
          <Link href="/login">
            <button className="inline-flex items-center gap-2 px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white font-fredoka font-bold text-lg uppercase tracking-widest rounded-2xl border-b-4 border-orange-700 shadow-[0_6px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all">
              Start for Free <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="mt-4 text-[11px] text-[#afafaf] font-outfit font-black uppercase tracking-wider">No credit card required</p>
        </div>
      </section>

      <FooterLinks />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl border-4 border-orange-200 border-t-orange-500 animate-spin" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
