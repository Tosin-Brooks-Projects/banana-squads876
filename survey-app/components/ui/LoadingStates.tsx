'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Spinner component for inline loading states
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  const colors = {
    primary: 'text-brand-500',
    white: 'text-white',
    gray: 'text-neutral-400',
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
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
  );
}

// Loading text with spinner
interface LoadingTextProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingText({ text, size = 'md', className = '' }: LoadingTextProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const spinnerSizes = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Spinner size={spinnerSizes[size]} />
      <span className={`${textSizes[size]} text-neutral-600`}>{text}</span>
    </div>
  );
}

// Shimmer effect for skeleton loading
interface ShimmerProps {
  className?: string;
  children?: ReactNode;
}

export function Shimmer({ className = '', children }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{
          translateX: ['100%', '-100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Enhanced Card Skeleton with shimmer
interface CardSkeletonProps {
  showAvatar?: boolean;
  showFooter?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showAvatar = true,
  showFooter = false,
  lines = 2,
  className = '',
}: CardSkeletonProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-100 p-6 ${className}`}>
      <div className="flex items-start gap-4">
        {showAvatar && (
          <Shimmer className="w-12 h-12 bg-neutral-200 rounded-xl flex-shrink-0" />
        )}
        <div className="flex-1 space-y-3">
          <Shimmer className="h-5 bg-neutral-200 rounded w-3/4" />
          {Array.from({ length: lines }).map((_, i) => (
            <Shimmer
              key={i}
              className={`h-4 bg-neutral-200 rounded ${i === lines - 1 ? 'w-1/2' : 'w-full'}`}
            />
          ))}
        </div>
      </div>
      {showFooter && (
        <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-4 bg-neutral-200 rounded" />
          ))}
        </div>
      )}
    </div>
  );
}

// Table Skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}: TableSkeletonProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden ${className}`}>
      {showHeader && (
        <div className="p-4 border-b border-neutral-200">
          <Shimmer className="h-6 bg-neutral-200 rounded w-40" />
        </div>
      )}
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <motion.div
            key={rowIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: rowIndex * 0.05 }}
            className="p-4 flex items-center gap-4"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Shimmer
                key={colIndex}
                className={`h-5 bg-neutral-200 rounded ${
                  colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-20' : 'flex-1'
                }`}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Stat Card Skeleton
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Shimmer className="w-12 h-12 bg-neutral-200 rounded-xl" />
        <div className="space-y-2">
          <Shimmer className="h-4 bg-neutral-200 rounded w-20" />
          <Shimmer className="h-7 bg-neutral-200 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

// Survey Card Skeleton (enhanced version)
export function SurveyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Shimmer className="w-12 h-12 bg-neutral-200 rounded-xl" />
          <div className="space-y-2">
            <Shimmer className="h-5 bg-neutral-200 rounded w-44" />
            <Shimmer className="h-4 bg-neutral-200 rounded w-56" />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-center space-y-2">
            <Shimmer className="h-7 bg-neutral-200 rounded w-10 mx-auto" />
            <Shimmer className="h-3 bg-neutral-200 rounded w-16" />
          </div>
          <Shimmer className="h-7 bg-neutral-200 rounded-full w-20" />
        </div>
      </div>
      <div className="pt-4 border-t border-neutral-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-4 bg-neutral-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div className="space-y-2">
        <Shimmer className="h-8 bg-neutral-200 rounded w-48" />
        <Shimmer className="h-5 bg-neutral-200 rounded w-72" />
      </div>
      <Shimmer className="h-11 bg-neutral-200 rounded-lg w-40" />
    </div>
  );
}

// Loading Overlay for smooth transitions
interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  skeleton?: ReactNode;
  className?: string;
  minHeight?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  skeleton,
  className = '',
  minHeight = 'min-h-[200px]',
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${minHeight} ${className}`}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {skeleton || (
              <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Full page loading overlay
interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = 'Loading...' }: FullPageLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-neutral-600 font-medium">{message}</p>
      </div>
    </motion.div>
  );
}

// Inline loading state for buttons/actions
interface InlineLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function InlineLoading({ isLoading, loadingText, children }: InlineLoadingProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.span
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-2"
        >
          <Spinner size="xs" color="white" />
          {loadingText && <span>{loadingText}</span>}
        </motion.span>
      ) : (
        <motion.span
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Progress indicator for multi-step processes
interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressIndicator({ current, total, label }: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-neutral-600 mb-2">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Pulse dot indicator
export function PulseDot({ className = '' }: { className?: string }) {
  return (
    <span className={`relative flex h-3 w-3 ${className}`}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
    </span>
  );
}
