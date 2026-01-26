'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRICING_TIERS, PricingTier } from '@/lib/types';

interface ResponseCapBannerProps {
  currentResponses: number;
  responseLimit: number;
  currentTier: PricingTier;
  surveyId: string;
  surveyTitle: string;
  getAuthToken: () => Promise<string>;
  onUpgradeClick?: () => void;
}

export default function ResponseCapBanner({
  currentResponses,
  responseLimit,
  currentTier,
  surveyId,
  surveyTitle,
  getAuthToken,
}: ResponseCapBannerProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const percentage = Math.round((currentResponses / responseLimit) * 100);
  const remaining = responseLimit - currentResponses;
  const isAtLimit = currentResponses >= responseLimit;
  const isNearLimit = percentage >= 80;

  // Don't show if not near limit or dismissed
  if (!isNearLimit || dismissed) return null;

  // Find the next tier
  const tierOrder: PricingTier[] = ['free', 'starter', 'pro', 'business', 'enterprise'];
  const currentTierIndex = tierOrder.indexOf(currentTier);
  const nextTier = currentTierIndex < tierOrder.length - 1
    ? tierOrder[currentTierIndex + 1]
    : null;

  const handleUpgrade = async () => {
    if (!nextTier) return;

    setIsUpgrading(true);
    try {
      const authToken = await getAuthToken();
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tier: nextTier,
          surveyId,
          surveyTitle,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      setIsUpgrading(false);
    }
  };

  const nextTierConfig = nextTier ? PRICING_TIERS[nextTier] : null;
  const currentTierConfig = PRICING_TIERS[currentTier];
  const upgradeCost = nextTierConfig
    ? nextTierConfig.price - currentTierConfig.price
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`mb-6 rounded-lg border-2 p-4 ${
          isAtLimit
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isAtLimit ? 'bg-red-100' : 'bg-amber-100'
              }`}
            >
              {isAtLimit ? (
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isAtLimit ? 'text-red-900' : 'text-amber-900'
                }`}
              >
                {isAtLimit
                  ? 'Response Limit Reached'
                  : `${percentage}% of Response Limit Used`}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  isAtLimit ? 'text-red-700' : 'text-amber-700'
                }`}
              >
                {isAtLimit
                  ? 'New responses are being held. Upgrade to unlock them.'
                  : `${remaining.toLocaleString()} responses remaining out of ${responseLimit.toLocaleString()}`}
              </p>

              {/* Progress bar */}
              <div className="mt-3 w-64 bg-white rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  className={`h-full rounded-full ${
                    isAtLimit
                      ? 'bg-red-500'
                      : percentage >= 90
                      ? 'bg-amber-500'
                      : 'bg-amber-400'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {nextTier && nextTierConfig && (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isAtLimit
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                } ${isUpgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUpgrading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Upgrading...
                  </span>
                ) : (
                  `Upgrade to ${nextTierConfig.name} ($${nextTierConfig.price})`
                )}
              </button>
            )}
            {!isAtLimit && (
              <button
                onClick={() => setDismissed(true)}
                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
