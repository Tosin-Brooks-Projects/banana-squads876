'use client';

import { motion } from 'framer-motion';

interface ChartSkeletonProps {
  type?: 'bar' | 'donut' | 'line' | 'rating' | 'stats';
  height?: number;
  className?: string;
}

// Shimmer overlay component
function ShimmerOverlay() {
  return (
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
      animate={{
        translateX: ['100%', '-100%'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

export default function ChartSkeleton({ type = 'bar', height = 200, className = '' }: ChartSkeletonProps) {
  if (type === 'donut') {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="relative w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
          <div className="absolute inset-4 rounded-full bg-white" />
          <ShimmerOverlay />
        </div>
      </div>
    );
  }

  if (type === 'rating') {
    return (
      <div className={`flex flex-col items-center ${className}`} style={{ height }}>
        <div className="relative w-20 h-12 bg-gray-200 rounded-lg mb-3 overflow-hidden">
          <ShimmerOverlay />
        </div>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative w-6 h-6 bg-gray-200 rounded overflow-hidden"
            >
              <ShimmerOverlay />
            </motion.div>
          ))}
        </div>
        <div className="relative w-full h-16 bg-gray-200 rounded-lg overflow-hidden">
          <ShimmerOverlay />
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`} style={{ height }}>
        <div className="absolute inset-0 bg-gray-100">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
            <motion.path
              d="M 0 80 Q 50 60, 100 70 T 200 50 T 300 60 T 400 40"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </svg>
        </div>
        <ShimmerOverlay />
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg overflow-hidden"
          >
            <div className="w-16 h-10 bg-gray-200 rounded mb-2" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
            <ShimmerOverlay />
          </motion.div>
        ))}
      </div>
    );
  }

  // Default bar chart skeleton with staggered animation
  const barWidths = [85, 60, 75, 45]; // Fixed widths to avoid random flash on re-render

  return (
    <div className={`space-y-3 ${className}`} style={{ minHeight: height }}>
      {barWidths.map((width, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-24 h-4 bg-gray-200 rounded overflow-hidden">
            <ShimmerOverlay />
          </div>
          <div
            className="relative h-8 bg-gray-200 rounded overflow-hidden"
            style={{ width: `${width}%` }}
          >
            <ShimmerOverlay />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Additional skeleton for question analytics cards
export function QuestionCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-xl p-5 border border-gray-100 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="relative w-24 h-5 bg-gray-200 rounded-full mb-2 overflow-hidden">
            <ShimmerOverlay />
          </div>
          <div className="relative w-full h-5 bg-gray-200 rounded mb-1 overflow-hidden">
            <ShimmerOverlay />
          </div>
          <div className="relative w-2/3 h-5 bg-gray-200 rounded overflow-hidden">
            <ShimmerOverlay />
          </div>
        </div>
      </div>
      <ChartSkeleton type="bar" height={150} />
    </motion.div>
  );
}

// Skeleton for the overview metrics section
export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="relative h-6 w-32 bg-gray-200 rounded overflow-hidden">
        <ShimmerOverlay />
      </div>
      <ChartSkeleton type="stats" />
      <div className="mt-8">
        <div className="relative h-5 w-40 bg-gray-200 rounded mb-4 overflow-hidden">
          <ShimmerOverlay />
        </div>
        <ChartSkeleton type="line" height={200} />
      </div>
    </div>
  );
}
