'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, ExternalLink, LayoutDashboard } from 'lucide-react';

interface SurveySuccessModalProps {
  isOpen: boolean;
  surveyUrl: string;
  surveyId: string;
  onClose: () => void;
  onCreateAnother: () => void;
  onGoToDashboard: () => void;
}

const CONFETTI_DOTS = [
  { x: -60, y: -50, color: '#f97316', size: 6, delay: 0 },
  { x: 60,  y: -60, color: '#fb923c', size: 5, delay: 0.05 },
  { x: -80, y: -20, color: '#fdba74', size: 4, delay: 0.08 },
  { x: 80,  y: -30, color: '#f97316', size: 7, delay: 0.03 },
  { x: -40, y: -80, color: '#fb923c', size: 5, delay: 0.1 },
  { x: 40,  y: -75, color: '#fdba74', size: 4, delay: 0.06 },
  { x: 0,   y: -90, color: '#f97316', size: 6, delay: 0.02 },
];

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

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://unboringsurveys.com').replace(/\/$/, '');
  const fullUrl = `${baseUrl}/${surveyUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = fullUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-xl max-w-md w-full overflow-hidden">

              {/* Header */}
              <div className="px-6 pt-8 pb-6 text-center">
                {/* Success icon + confetti burst */}
                <div className="relative flex items-center justify-center mb-5">
                  {CONFETTI_DOTS.map((dot, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full pointer-events-none"
                      style={{ width: dot.size, height: dot.size, backgroundColor: dot.color }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                      animate={{ x: dot.x, y: dot.y, opacity: 0, scale: 1 }}
                      transition={{ duration: 0.6, delay: dot.delay, ease: 'easeOut' }}
                    />
                  ))}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
                    className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_4px_0_#c2410c]"
                  >
                    <Check className="w-8 h-8 text-white" strokeWidth={3} />
                  </motion.div>
                </div>

                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="text-xl font-bold font-outfit text-[#3c3c3c] tracking-tight"
                >
                  Survey published!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  className="text-[13px] font-outfit text-[#777777] mt-1"
                >
                  Your survey is live and ready to share.
                </motion.p>
              </div>

              {/* URL section */}
              <div className="px-6 pb-6 space-y-5">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest">
                    Share link
                  </p>
                  <div className="flex items-center gap-2 p-1 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
                    <p className="flex-1 px-3 py-2 text-[13px] font-outfit text-[#3c3c3c] truncate min-w-0">
                      {fullUrl}
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold font-outfit text-[12px] transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer ${
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-white border border-[#e5e5e5] text-[#777777] hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 shadow-sm'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${copied ? 'block' : 'hidden'}`} strokeWidth={2.5} />
                      <Copy className={`w-3.5 h-3.5 ${copied ? 'hidden' : 'block'}`} strokeWidth={2} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(fullUrl, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-[#e5e5e5] hover:border-[#c8c8c8] text-[#777777] hover:text-[#3c3c3c] rounded-xl font-bold font-outfit text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" strokeWidth={2} />
                    View survey
                  </button>
                  <button
                    onClick={onGoToDashboard}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold font-outfit text-sm shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
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
