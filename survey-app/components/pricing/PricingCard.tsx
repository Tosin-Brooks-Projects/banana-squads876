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
      className={`relative flex flex-col h-full rounded-[40px] border-4 transition-all ${
        compact ? 'p-6' : 'p-10'
      } ${
        isSelected
          ? 'border-orange-500 bg-white shadow-[12px_12px_0px_0px_rgba(249,115,22,0.1)]'
          : isPopular
          ? 'border-indigo-500 bg-white shadow-[12px_12px_0px_0px_rgba(79,70,229,0.1)]'
          : 'border-gray-100 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,0.02)]'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${!isSelected && !disabled ? 'active:translate-y-1 active:shadow-none' : ''}`}
      onClick={() => !disabled && onSelect(tier)}
    >
      {isPopular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-orange-500 text-white text-[10px] font-black px-6 py-2.5 rounded-2xl whitespace-nowrap uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(194,65,12,1)] border-2 border-orange-600">
            Most Popular
          </span>
        </div>
      )}

      <div className={compact ? 'mb-6' : 'mb-8'}>
        <div className="flex items-center gap-3 mb-4">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 ${
             isSelected ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'
           }`}>
              {isFree ? '🌱' : tier.id === 'starter' ? '🚀' : tier.id === 'pro' ? '💎' : '🔥'}
           </div>
           <h3 className={`font-black text-gray-900 uppercase tracking-tight ${compact ? 'text-xl' : 'text-3xl'}`}>{tier.name}</h3>
        </div>

        <div className="mt-6 flex items-baseline gap-1">
          {isFree ? (
            <span className={`font-black text-gray-900 ${compact ? 'text-4xl' : 'text-6xl'}`}>Free</span>
          ) : (
            <div className="flex flex-col">
              <span className={`font-black text-gray-900 ${compact ? 'text-4xl' : 'text-6xl'}`}>${tier.price}</span>
              <span className={`mt-1 font-black text-gray-400 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
                One-time Payment
              </span>
            </div>
          )}
        </div>
        
        <div className={`mt-6 inline-flex items-center px-4 py-2 bg-gray-50 rounded-2xl border-2 border-gray-100`}>
           <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none">
              {tier.responseLimit.toLocaleString()} Mission Capacity
           </p>
        </div>
      </div>

      <ul className={`flex-grow ${compact ? 'mb-6 space-y-3' : 'mb-10 space-y-5'}`}>
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start group">
            <div className={`flex-shrink-0 mt-1 transition-transform group-hover:scale-125 ${isSelected ? 'text-orange-500' : 'text-gray-300'}`}>
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
               </svg>
            </div>
            <span className={`ml-3 text-gray-600 font-bold leading-tight ${compact ? 'text-xs' : 'text-base'}`}>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <button
          disabled={disabled || isLoading}
          className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest transition-all text-[11px] border-b-4 ${
            isSelected
              ? 'bg-orange-500 text-white border-orange-700'
              : isFree
              ? 'bg-white border-2 border-gray-100 text-gray-500 shadow-[0_4px_0_0_rgba(0,0,0,0.03)] hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600'
              : isPopular
              ? 'bg-indigo-600 text-white border-indigo-800'
              : 'bg-gray-900 text-white border-gray-950'
          } ${disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'active:border-b-0 active:translate-y-1'}`}
        >
          {isLoading ? (
            'Gathering...'
          ) : isSelected
            ? 'Active Realm'
            : isFree
            ? 'Start Journey'
            : `Unlock ${tier.name}`}
        </button>
      </div>
    </motion.div>
  );
}
