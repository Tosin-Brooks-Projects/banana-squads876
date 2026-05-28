'use client';

import React from 'react';
import { Check, Leaf, Rocket, Gem, Flame, Crown } from 'lucide-react';
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

const TIER_ICON: Record<string, React.ReactNode> = {
  free:       <Leaf   className="w-4 h-4" />,
  starter:    <Rocket className="w-4 h-4" />,
  pro:        <Gem    className="w-4 h-4" />,
  business:   <Flame  className="w-4 h-4" />,
  enterprise: <Crown  className="w-4 h-4" />,
};

export default function PricingCard({
  tier,
  isPopular = false,
  isSelected = false,
  onSelect,
  disabled = false,
  isLoading = false,
}: PricingCardProps) {
  const isFree = tier.price === 0;

  return (
    <div className="relative flex flex-col h-full">
      {/* Popular badge — sits above the card */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-orange-500 text-white text-[10px] font-bold font-outfit px-3 py-1 rounded-full shadow-[0_2px_0_#c2410c] whitespace-nowrap tracking-wide">
            Most popular
          </span>
        </div>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-pressed={isSelected}
        onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) onSelect(tier); }}
        onClick={() => !disabled && onSelect(tier)}
        className={`relative flex flex-col h-full rounded-2xl border bg-white transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 p-5
          ${isSelected
            ? 'border-orange-500 bg-orange-50/40 shadow-[0_4px_0_#c2410c]'
            : isPopular
            ? 'border-orange-200 hover:border-orange-300'
            : 'border-[#e5e5e5] hover:border-[#c8c8c8]'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors
              ${isSelected || isPopular
                ? 'bg-orange-50 border-orange-100 text-orange-500'
                : 'bg-[#f5f5f5] border-[#e5e5e5] text-[#777777]'}`}>
              {TIER_ICON[tier.id] ?? <Gem className="w-4 h-4" />}
            </div>
            <h3 className="text-sm font-bold font-outfit text-[#3c3c3c] uppercase tracking-widest">
              {tier.name}
            </h3>
          </div>

          {/* Price */}
          {isFree ? (
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-4xl font-bold font-outfit tabular-nums text-[#3c3c3c] tracking-tight">
                Free
              </span>
              <span className="px-2.5 py-1 bg-[#f5f5f5] border border-[#e5e5e5] rounded-full text-[10px] font-bold font-outfit text-[#777777] tracking-wide whitespace-nowrap">
                {tier.responseLimit.toLocaleString()} responses
              </span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-outfit tabular-nums text-[#3c3c3c] tracking-tight">
                  ${tier.price}
                </span>
              </div>
              <p className="text-[11px] font-outfit text-[#afafaf] mt-0.5 uppercase tracking-widest">
                One-time payment
              </p>
              <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold font-outfit tracking-wide whitespace-nowrap
                ${isSelected || isPopular
                  ? 'bg-orange-50 border-orange-100 text-orange-600'
                  : 'bg-[#f5f5f5] border-[#e5e5e5] text-[#777777]'}`}>
                {tier.responseLimit.toLocaleString()} responses
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="flex-grow mb-5 space-y-2">
          {tier.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <Check
                className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isSelected || isPopular ? 'text-orange-500' : 'text-[#c8c8c8]'}`}
                strokeWidth={2.5}
              />
              <span className="text-[13px] font-outfit text-[#555] leading-snug">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          disabled={disabled || isLoading}
          onClick={(e) => { e.stopPropagation(); if (!disabled && !isLoading) onSelect(tier); }}
          className={`w-full py-2.5 rounded-xl font-bold font-outfit text-sm transition-all
            ${isSelected
              ? 'bg-orange-500 text-white shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none'
              : isPopular
              ? 'bg-orange-500 text-white shadow-[0_3px_0_#c2410c] hover:bg-orange-600 active:translate-y-[2px] active:shadow-none'
              : isFree
              ? 'bg-white border border-[#e5e5e5] text-[#777777] hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
              : 'bg-[#3c3c3c] text-white shadow-[0_3px_0_#1a1a1a] hover:bg-[#4b4b4b] active:translate-y-[2px] active:shadow-none'}
            ${disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          {isLoading
            ? 'Loading…'
            : isSelected
            ? '✓ Selected'
            : isFree
            ? 'Start free'
            : `Choose ${tier.name}`}
        </button>
      </div>
    </div>
  );
}
