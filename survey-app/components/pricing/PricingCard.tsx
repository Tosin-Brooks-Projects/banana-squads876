'use client';

import { motion } from 'framer-motion';
import { PricingTierConfig } from '@/lib/types';

interface PricingCardProps {
  tier: PricingTierConfig;
  isPopular?: boolean;
  isSelected?: boolean;
  onSelect: (tier: PricingTierConfig) => void;
  disabled?: boolean;
  disabledReason?: string;
  compact?: boolean;
  isLoading?: boolean;
}

export default function PricingCard({
  tier,
  isPopular = false,
  isSelected = false,
  onSelect,
  disabled = false,
  disabledReason,
  compact = false,
  isLoading = false,
}: PricingCardProps) {
  const isFree = tier.price === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      className={`relative flex flex-col h-full rounded-2xl border-2 transition-all ${
        compact
          ? (isPopular ? 'p-4 z-10' : 'p-4')
          : (isPopular ? 'p-7 scale-105 z-10' : 'p-6')
      } ${
        isSelected
          ? 'border-brand-500 bg-brand-50 shadow-lg'
          : isPopular
          ? 'border-brand-400 bg-gradient-to-b from-brand-50 to-white shadow-xl'
          : 'border-neutral-200 bg-white'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !disabled && onSelect(tier)}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}

      <div className={compact ? 'mb-3' : 'mb-4'}>
        <h3 className={`font-bold text-neutral-900 ${compact ? 'text-base' : 'text-xl'}`}>{tier.name}</h3>
        <div className="mt-2 flex items-baseline">
          {isFree ? (
            <span className={`font-bold text-neutral-900 ${compact ? 'text-2xl' : 'text-4xl'}`}>Free</span>
          ) : (
            <div className="flex flex-col">
              <span className={`font-bold text-neutral-900 ${compact ? 'text-2xl' : 'text-4xl'}`}>${tier.price}</span>
              <span className={`mt-1 font-medium text-neutral-700 ${compact ? 'text-xs' : 'text-sm'}`}>
                <span className="relative inline-block">
                  <span className="relative z-10">one-time</span>
                  <span className="absolute bottom-0 left-0 w-full h-1.5 bg-brand-200 -z-0"></span>
                </span>
                {' '}cost
              </span>
            </div>
          )}
        </div>
        <p className={compact ? 'mt-2' : 'mt-3'}>
          <span className="relative inline-block">
            <span className={`relative z-10 font-semibold text-neutral-800 ${compact ? 'text-xs' : 'text-sm'}`}>
              Up to {tier.responseLimit.toLocaleString()} responses
            </span>
            <span className="absolute bottom-0 left-0 w-full h-1.5 bg-brand-100 -z-0"></span>
          </span>
        </p>
      </div>

      <ul className={`flex-grow ${compact ? 'mb-3 space-y-1.5' : 'mb-6 space-y-3'}`}>
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className={`flex-shrink-0 text-brand-500 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className={`ml-2 text-neutral-700 ${compact ? 'text-xs leading-tight' : 'text-sm'}`}>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        disabled={disabled || isLoading}
        className={`w-full rounded-lg font-semibold transition-colors ${
          compact ? 'py-2 text-sm' : 'py-3'
        } ${
          isSelected
            ? 'bg-brand-500 text-white'
            : isFree
            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            : 'bg-brand-500 text-white hover:bg-brand-600'
        } ${disabled || isLoading ? 'cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </span>
        ) : disabled
          ? disabledReason || 'Unavailable'
          : isSelected
          ? 'Selected'
          : isFree
          ? 'Start Free'
          : `Select ${tier.name}`}
      </button>
    </motion.div>
  );
}
