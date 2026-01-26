'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width ?? '100%',
    height: height ?? (variant === 'text' ? '1rem' : '100%'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Survey page loading skeleton
export function SurveySkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center">
            {/* Emoji placeholder */}
            <Skeleton
              variant="circular"
              width={80}
              height={80}
              className="mx-auto mb-6"
            />

            {/* Title */}
            <Skeleton
              variant="text"
              width="70%"
              height={32}
              className="mx-auto mb-3"
            />

            {/* Description */}
            <Skeleton
              variant="text"
              width="90%"
              height={20}
              className="mx-auto mb-2"
            />
            <Skeleton
              variant="text"
              width="60%"
              height={20}
              className="mx-auto mb-6"
            />

            {/* Info box */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <Skeleton variant="text" width="100%" height={16} className="mb-2" />
              <Skeleton variant="text" width="80%" height={16} />
            </div>

            {/* Button */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height={48}
              className="mb-4"
            />

            {/* Question count */}
            <Skeleton
              variant="text"
              width={100}
              height={16}
              className="mx-auto"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Ice cream sundae adventure loading skeleton
export function IceCreamSundaeSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-blue-100 flex flex-col items-center justify-start md:justify-center p-3 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-3 sm:mb-4 pt-2 sm:pt-0"
      >
        {/* Title */}
        <Skeleton
          variant="text"
          width={280}
          height={36}
          className="mx-auto mb-2"
        />
        {/* Stage indicator */}
        <Skeleton
          variant="text"
          width={100}
          height={20}
          className="mx-auto"
        />
      </motion.div>

      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 lg:gap-8">
        {/* Sundae display skeleton */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-shrink-0 bg-white/50 rounded-2xl p-3 sm:p-4 lg:p-6 backdrop-blur-sm w-full md:w-auto"
        >
          <div className="relative w-36 h-48 sm:w-44 sm:h-56 md:w-48 md:h-64 mx-auto">
            {/* Bowl skeleton */}
            <Skeleton
              variant="rectangular"
              className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-b-full rounded-t-lg"
              width={112}
              height={64}
            />
          </div>
        </motion.div>

        {/* Stage content skeleton */}
        <div className="w-full md:max-w-lg flex-grow">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
            {/* Heading */}
            <Skeleton variant="text" width="60%" height={28} className="mb-2" />
            <Skeleton variant="text" width="80%" height={20} className="mb-6" />

            {/* Option buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={100}
                  className="rounded-xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic card skeleton for dashboard/lists
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={24} className="mb-2" />
          <Skeleton variant="text" width="40%" height={16} />
        </div>
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="text" width="100%" height={16} className="mb-2" />
      <Skeleton variant="text" width="80%" height={16} />
    </div>
  );
}

export default Skeleton;
