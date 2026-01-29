'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/LoadingStates';
import { PricingTier } from '@/lib/types';

interface AIUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueManually: () => void;
}

export default function AIUpgradeModal({ isOpen, onClose, onContinueManually }: AIUpgradeModalProps) {
  const { firebaseUser } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tier: PricingTier = 'starter') => {
    if (!firebaseUser) {
      setError('Please sign in to upgrade');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let authToken: string;
      try {
        authToken = await firebaseUser.getIdToken();
      } catch (tokenError) {
        console.error('Failed to get auth token:', tokenError);
        throw new Error('Authentication failed. Please try signing in again.');
      }

      const response = await fetch('/api/stripe/create-ai-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={isProcessing ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Processing overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl"
                >
                  <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-600 font-medium">Redirecting to checkout...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header with brand gradient */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-6 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="inline-block mb-3"
              >
                <span className="text-4xl">✨</span>
              </motion.div>
              <h2 className="text-xl font-bold">Let AI Write Your Questions</h2>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              {/* Benefits - simplified */}
              <ul className="space-y-2 mb-5">
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generates relevant questions instantly
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mix of question types for better insights
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Edit and customize as needed
                </li>
              </ul>

              {/* Pricing callout */}
              <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Starter Plan</p>
                    <p className="text-sm text-gray-600">AI + 100 responses + export</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-600">$9</p>
                    <p className="text-xs text-gray-500">per survey</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleUpgrade('starter')}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Upgrade - $9'}
                </Button>
                <div className="flex items-center justify-between">
                  <button
                    onClick={onContinueManually}
                    disabled={isProcessing}
                    className="text-gray-500 hover:text-gray-700 text-sm transition-colors disabled:opacity-50"
                  >
                    Write my own
                  </button>
                  <Link
                    href="/pricing"
                    className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
                    onClick={onClose}
                  >
                    See all plans
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
