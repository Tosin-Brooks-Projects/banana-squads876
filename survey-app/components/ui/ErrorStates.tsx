'use client';

import { motion } from 'framer-motion';
import Button from './Button';
import Card from './Card';

interface ErrorStateProps {
  title?: string;
  message?: string;
  emoji?: string;
  onRetry?: () => void;
  onBack?: () => void;
  showCreateLink?: boolean;
}

// Survey not found (404)
export function SurveyNotFound({
  title = 'Survey Not Found',
  message = "The survey you're looking for doesn't exist or has been removed.",
  onBack,
  showCreateLink = true,
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card padding="lg">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="text-6xl sm:text-7xl mb-6"
            >
              🔍
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-600 text-sm sm:text-base mb-6"
            >
              {message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {onBack && (
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={onBack}
                >
                  Go Back
                </Button>
              )}
              {showCreateLink && (
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Create Your Own Survey
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Network/connection error
export function NetworkError({
  title = "Couldn't Load Survey",
  message = "We're having trouble connecting. Please check your internet connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card padding="lg">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="text-6xl sm:text-7xl mb-6"
            >
              📡
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-600 text-sm sm:text-base mb-6"
            >
              {message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {onRetry && (
                <Button size="md" className="w-full" onClick={onRetry}>
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </span>
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Survey expired
export function SurveyExpired({
  title = 'Survey Has Expired',
  message = 'This survey is no longer accepting responses.',
  onBack,
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card padding="lg">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="text-6xl sm:text-7xl mb-6"
            >
              ⏰
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-600 text-sm sm:text-base mb-6"
            >
              {message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {onBack && (
                <Button variant="outline" size="md" className="w-full" onClick={onBack}>
                  Go Back
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Survey response limit reached
export function ResponseLimitReached({
  title = 'Survey Full',
  message = 'This survey has reached its maximum number of responses and is no longer accepting new submissions.',
  onBack,
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card padding="lg">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="text-6xl sm:text-7xl mb-6"
            >
              📊
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-600 text-sm sm:text-base mb-6"
            >
              {message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {onBack && (
                <Button variant="outline" size="md" className="w-full" onClick={onBack}>
                  Go Back
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Survey not published/unavailable
export function SurveyUnavailable({
  title = 'Survey Not Available',
  message = 'This survey is currently not accepting responses. It may be in draft mode or paused.',
  onBack,
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card padding="lg">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="text-6xl sm:text-7xl mb-6"
            >
              🚧
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-600 text-sm sm:text-base mb-6"
            >
              {message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {onBack && (
                <Button variant="outline" size="md" className="w-full" onClick={onBack}>
                  Go Back
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Submission error
export function SubmissionError({
  title = 'Failed to Save Response',
  message = "We couldn't save your response. Your answers are safe - please try again.",
  onRetry,
  onSkip,
}: ErrorStateProps & { onSkip?: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card padding="lg">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="text-6xl sm:text-7xl mb-6"
            >
              😟
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-600 text-sm sm:text-base mb-6"
            >
              {message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {onRetry && (
                <Button size="md" className="w-full" onClick={onRetry}>
                  Try Again
                </Button>
              )}
              {onSkip && (
                <Button variant="ghost" size="md" className="w-full" onClick={onSkip}>
                  Skip and Continue
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Inline form validation error
export function InlineError({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="text-red-500 text-sm mt-1 flex items-center gap-1"
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </motion.p>
  );
}

// Success indicator (for saving states)
export function SavingIndicator({ message = 'Saving...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          className="relative w-16 h-16 mx-auto mb-4"
        >
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="absolute inset-0 border-4 border-brand-200 border-t-brand-500 rounded-full"
          />
          {/* Inner pulse */}
          <motion.div
            animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-3 bg-brand-100 rounded-full"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-neutral-600 font-medium"
        >
          {message}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-neutral-400 text-sm mt-1"
        >
          Please wait a moment
        </motion.p>
      </motion.div>
    </div>
  );
}

// Compact saving indicator for inline use
export function InlineSavingIndicator({ message = 'Saving...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-brand-500"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-4 h-4 border-2 border-brand-200 border-t-brand-500 rounded-full"
      />
      <span className="text-sm">{message}</span>
    </motion.div>
  );
}

export default {
  SurveyNotFound,
  NetworkError,
  SurveyExpired,
  SurveyUnavailable,
  ResponseLimitReached,
  SubmissionError,
  InlineError,
  SavingIndicator,
  InlineSavingIndicator,
};
