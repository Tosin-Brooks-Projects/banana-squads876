'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { PRICING_TIERS, PricingTier, PricingTierConfig } from '@/lib/types';
import PricingCard from './PricingCard';

interface TierSelectorProps {
  selectedTier: PricingTier | null;
  onTierSelect: (tier: PricingTier) => void;
  hasUsedFreeTier?: boolean;
  isLoading?: boolean;
}

export default function TierSelector({
  selectedTier,
  onTierSelect,
  isLoading = false,
}: TierSelectorProps) {
  const [showAllTiers, setShowAllTiers] = useState(false);

  const tiers = Object.values(PRICING_TIERS);
  const mainTiers = tiers.filter((t) => ['free', 'starter', 'pro'].includes(t.id));

  const handleSelect = (tier: PricingTierConfig) => {
    onTierSelect(tier.id);
    if (showAllTiers) setShowAllTiers(false);
  };

  useEffect(() => {
    document.body.style.overflow = showAllTiers ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showAllTiers]);

  return (
    <div className="w-full space-y-4">
      {/* Main tier cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid gap-3 grid-cols-1 md:grid-cols-3 items-stretch"
      >
        {mainTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            isPopular={tier.id === 'pro'}
            isSelected={selectedTier === tier.id}
            onSelect={handleSelect}
            disabled={isLoading}
            compact={true}
          />
        ))}
      </motion.div>

      {/* See all plans */}
      <div className="text-center">
        <button
          onClick={() => setShowAllTiers(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold font-outfit text-[#afafaf] hover:text-orange-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer"
        >
          See all plans
          <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>

      {/* All plans modal */}
      <AnimatePresence>
        {showAllTiers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAllTiers(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl border border-[#e5e5e5] shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal header */}
              <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-outfit text-[#3c3c3c]">All plans</h2>
                  <p className="text-[11px] font-outfit text-[#afafaf] mt-0.5">One-time payment per survey. No subscriptions.</p>
                </div>
                <button
                  onClick={() => setShowAllTiers(false)}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#e5e5e5] text-[#afafaf] hover:text-red-400 hover:border-red-100 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal content */}
              <div className="p-6 overflow-y-auto bg-[#f5f5f5]/50">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {tiers.map((tier) => (
                    <PricingCard
                      key={tier.id}
                      tier={tier}
                      isPopular={tier.id === 'pro'}
                      isSelected={selectedTier === tier.id}
                      onSelect={handleSelect}
                      disabled={isLoading}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
