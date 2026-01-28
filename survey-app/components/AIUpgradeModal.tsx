'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const sampleQuestions = [
    "How often do you visit our coffee shop?",
    "What's your favorite drink to order?",
    "How would you rate the speed of service?",
    "What could we improve about your experience?",
  ];

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
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
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

            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="inline-block mb-4"
              >
                <span className="text-5xl">✨</span>
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Unlock AI-Powered Questions</h2>
              <p className="text-indigo-100">
                Let our AI craft the perfect questions for your survey
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
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

              {/* What you get */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  What AI Generation Does
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Analyzes your survey goal to generate relevant questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Creates a mix of question types for better insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Saves time - get a complete survey in seconds</span>
                  </li>
                </ul>
              </div>

              {/* Sample questions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Example AI-Generated Questions
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {sampleQuestions.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      {question}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Pricing callout */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Starter Plan</p>
                    <p className="text-sm text-gray-600">AI questions + 100 responses + CSV export</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">$9</p>
                    <p className="text-xs text-gray-500">per survey</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleUpgrade('starter')}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {isProcessing ? 'Processing...' : 'Upgrade to Starter - $9'}
                </Button>
                <button
                  onClick={onContinueManually}
                  disabled={isProcessing}
                  className="w-full py-2.5 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  No thanks, I&apos;ll write my own questions
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
