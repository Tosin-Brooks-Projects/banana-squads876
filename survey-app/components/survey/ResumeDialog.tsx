'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/AnimatedButton';
import Card from '@/components/ui/Card';

interface ResumeDialogProps {
  milestone: number;
  onResume: () => void;
  onStartFresh: () => void;
}

export default function ResumeDialog({
  milestone,
  onResume,
  onStartFresh,
}: ResumeDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card padding="lg">
          <div className="text-center">
            <div className="text-5xl mb-4">
              {milestone >= 75 ? '🏃' : milestone >= 50 ? '🚶' : '👋'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-600 mb-6">
              You were <span className="font-semibold text-indigo-600">{milestone}%</span> through this survey.
              Would you like to continue where you left off?
            </p>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <motion.div
                className="bg-indigo-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${milestone}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                onClick={onResume}
              >
                Continue ({milestone}% complete)
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={onStartFresh}
              >
                Start Fresh
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
