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
    <div className="w-full space-y-8">
      {/* Main tier cards (Free, Starter & Pro) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 items-stretch grid-cols-1 md:grid-cols-3"
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

      {/* Toggle to show all tiers */}
      <div className="text-center">
        <button
          onClick={() => setShowAllTiers(true)}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 mx-auto group"
        >
          <span className="group-hover:translate-x-1 transition-transform">Explore all mission realms</span>
          <svg className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Full-page modal for all tiers */}
      <AnimatePresence>
        {showAllTiers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAllTiers(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[48px] border-4 border-gray-100 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal header */}
              <div className="bg-white border-b-4 border-gray-50 px-10 py-8 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">The Armory</span>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">
                    Choose Your <span className="text-orange-500">Mission Realm</span>
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    One-time unlock per mission. No recurring tolls.
                  </p>
                </div>
                <button
                  onClick={() => setShowAllTiers(false)}
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border-4 border-gray-100 shadow-[4px_4px_0_0_#f3f4f6] text-gray-300 hover:text-red-500 hover:border-red-100 transition-all active:translate-y-1 active:shadow-none"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal content */}
              <div className="p-10 overflow-y-auto bg-gray-50/30">
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              <div className="bg-white border-t-4 border-gray-50 px-10 py-6 flex justify-center">
                <div className="flex items-center gap-3">
                  <img src="/orange-kea-mascot.png" alt="Mascot" className="w-8 h-8 object-contain" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     Select your gear to begin the adventure
                  </p>
                </div>
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
          className="p-8 bg-white border-4 border-gray-100 rounded-[40px] shadow-[8px_8px_0_0_rgba(0,0,0,0.02)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-orange-500 border-b-4 border-orange-700 flex items-center justify-center text-white text-3xl shadow-lg">
                  {selectedTier === 'free' ? '🌱' : '🚀'}
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Mission Ready</p>
                 </div>
                 <p className="font-black text-gray-900 text-2xl uppercase tracking-tight">
                    {PRICING_TIERS[selectedTier].name} Realm
                 </p>
               </div>
            </div>
            <div className="text-left sm:text-right bg-gray-50 px-6 py-4 rounded-3xl border-2 border-gray-100">
              <p className="font-black text-gray-900 text-3xl">
                {selectedTier === 'free' ? 'Free' : `$${PRICING_TIERS[selectedTier].price}`}
              </p>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">One-time Unlock</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
