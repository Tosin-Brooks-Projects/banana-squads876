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
            className="fixed inset-0 bg-duo-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-[3rem] border-4 border-duo-gray shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
              {/* Success animation header */}
              <div className="bg-white px-10 pt-12 pb-8 text-center relative overflow-hidden">
                {/* Celebratory Mascot */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-48 h-48 mx-auto mb-6"
                >
                  <img 
                    src="/orange-kea-mascot-success.png"
                    alt="Celebration!" 
                    className="w-full h-full object-contain"
                  />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-fredoka font-bold text-duo-black"
                >
                  Quest <span className="text-duo-green">Launched!</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-duo-silver text-sm font-black uppercase tracking-widest mt-2"
                >
                  Your adventure is now live
                </motion.p>
              </div>

              {/* Content */}
              <div className="px-10 pb-12 space-y-8">
                {/* Survey URL */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-duo-silver ml-4">
                    Share your quest link
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-5 py-4 bg-duo-gray/20 rounded-2xl border-2 border-transparent text-duo-graphite font-fredoka font-bold text-sm truncate">
                      {fullUrl}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className={`
                        px-6 py-4 rounded-2xl font-fredoka font-bold uppercase tracking-widest text-[10px] transition-all
                        ${copied
                          ? 'bg-duo-green text-white border-b-4 border-[#46a302]'
                          : 'bg-white border-2 border-duo-gray text-duo-graphite shadow-[0_4px_0_#e5e5e5] hover:bg-duo-gray/10 active:translate-y-[2px] active:shadow-none'
                        }
                      `}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={openSurvey}
                    className="flex-1 py-5 rounded-2xl bg-white border-2 border-duo-gray text-duo-graphite font-fredoka font-bold uppercase tracking-widest text-xs shadow-[0_4px_0_#e5e5e5] hover:bg-duo-gray/5 transition-all active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>View Quest</span>
                  </button>
                  <button
                    onClick={onGoToDashboard}
                    className="flex-1 py-5 rounded-2xl bg-duo-green text-white font-fredoka font-bold uppercase tracking-widest text-xs border-b-4 border-[#46a302] transition-all hover:translate-y-[-2px] hover:shadow-[0_4px_0_#46a302] active:translate-y-[2px] active:border-b-0 flex items-center justify-center"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
