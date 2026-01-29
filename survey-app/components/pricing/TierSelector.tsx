'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRICING_TIERS, PricingTier, PricingTierConfig } from '@/lib/types';
import PricingCard from './PricingCard';

interface TierSelectorProps {
  selectedTier: PricingTier | null;
  onTierSelect: (tier: PricingTier) => void;
  hasUsedFreeTier?: boolean; // Deprecated - free tier is now unlimited
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
    // Close modal after selection if in expanded view
    if (showAllTiers) {
      setShowAllTiers(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAllTiers) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAllTiers]);

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">
          Choose Your Survey Plan
        </h2>
        <p className="mt-2 text-neutral-600">
          Pay once per survey. No subscriptions.
        </p>
      </div>

      {/* Main tier cards (Free, Starter & Pro) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 items-stretch grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto"
      >
        {mainTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            isPopular={tier.id === 'pro'}
            isSelected={selectedTier === tier.id}
            onSelect={handleSelect}
            disabled={isLoading}
            compact={false}
          />
        ))}
      </motion.div>

      {/* Toggle to show all tiers */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowAllTiers(true)}
          className="text-sm text-neutral-600 hover:text-brand-600 transition-colors"
        >
          Show all pricing options
        </button>
      </div>

      {/* Full-page modal for all tiers */}
      <AnimatePresence>
        {showAllTiers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAllTiers(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    Choose Your Survey Plan
                  </h2>
                  <p className="text-sm text-neutral-600">
                    Pay once per survey. No subscriptions.
                  </p>
                </div>
                <button
                  onClick={() => setShowAllTiers(false)}
                  className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal content */}
              <div className="p-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

              {/* Modal footer */}
              <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-center">
                <button
                  onClick={() => setShowAllTiers(false)}
                  className="text-sm text-neutral-600 hover:text-brand-600 transition-colors"
                >
                  Show fewer options
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected tier summary */}
      {selectedTier && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-brand-50 border border-brand-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-brand-900">
                Selected: {PRICING_TIERS[selectedTier].name}
              </p>
              <p className="text-sm text-brand-700">
                Up to {PRICING_TIERS[selectedTier].responseLimit.toLocaleString()} responses
                {PRICING_TIERS[selectedTier].price > 0 &&
                  ` • $${PRICING_TIERS[selectedTier].price}`}
              </p>
            </div>
            {selectedTier !== 'free' && (
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-900">
                  ${PRICING_TIERS[selectedTier].price}
                </p>
                <p className="text-xs text-brand-600">one-time payment</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
