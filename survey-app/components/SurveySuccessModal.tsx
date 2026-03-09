'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/AnimatedButton';

interface SurveySuccessModalProps {
  isOpen: boolean;
  surveyUrl: string;
  surveyId: string;
  onClose: () => void;
  onCreateAnother: () => void;
  onGoToDashboard: () => void;
}

export default function SurveySuccessModal({
  isOpen,
  surveyUrl,
  surveyId: _surveyId,
  onClose,
  onCreateAnother: _onCreateAnother,
  onGoToDashboard,
}: SurveySuccessModalProps) {
  void _surveyId;
  void _onCreateAnother;
  const [copied, setCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://unboringsurveys.com';
  const fullUrl = `${baseUrl}/${surveyUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openSurvey = () => {
    window.open(fullUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Success animation header */}
              <div className="bg-neutral-50 px-6 py-8 text-center border-b border-neutral-100">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="w-16 h-16 bg-brand-500 rounded-full mx-auto flex items-center justify-center"
                >
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-neutral-900 mt-4"
                >
                  Survey Created!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-neutral-600 mt-1"
                >
                  Your survey is ready to share
                </motion.p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Survey URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Survey Link
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 font-mono text-sm truncate">
                      {fullUrl}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className={`
                        px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2
                        ${copied
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                        }
                      `}
                    >
                      {copied ? (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={openSurvey}
                      variant="outline"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </span>
                    </Button>
                    <Button
                      onClick={onGoToDashboard}
                      variant="primary"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
