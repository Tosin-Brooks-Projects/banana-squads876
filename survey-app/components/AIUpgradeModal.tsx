'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/ui/AnimatedButton';

interface AIUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueManually: () => void;
  isPremiumTheme?: boolean;
  onSwitchToFreeTheme?: () => void;
}

export default function AIUpgradeModal({
  isOpen,
  onClose,
  onContinueManually,
  isPremiumTheme = false,
  onSwitchToFreeTheme,
}: AIUpgradeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with brand gradient */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-6 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="inline-block mb-3"
              >
                <span className="text-4xl">{isPremiumTheme ? '🎨' : '✨'}</span>
              </motion.div>
              <h2 className="text-xl font-bold">
                {isPremiumTheme ? 'Premium Theme Selected' : 'Want Extra Features?'}
              </h2>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-gray-600 text-center mb-5">
                {isPremiumTheme
                  ? 'This theme requires a paid plan. Upgrade to unlock premium themes, AI-generated questions, more responses, and CSV export.'
                  : 'Upgrade to a paid plan to unlock AI-generated questions, more responses, and CSV export.'}
              </p>

              {/* Two button actions */}
              <div className="space-y-3">
                <Link href="/pricing?from=create" onClick={onClose} className="block">
                  <Button className="w-full">
                    View Plans
                  </Button>
                </Link>
                {isPremiumTheme && onSwitchToFreeTheme ? (
                  <Button
                    onClick={onSwitchToFreeTheme}
                    variant="outline"
                    className="w-full"
                  >
                    Switch to Free Theme
                  </Button>
                ) : (
                  <Button
                    onClick={onContinueManually}
                    variant="outline"
                    className="w-full"
                  >
                    Continue Free
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
