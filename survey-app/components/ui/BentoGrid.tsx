'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 ${className}`}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function BentoCard({ children, className = '', delay = 0 }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay,
      }}
      className={`relative overflow-hidden rounded-5xl bg-white border border-neutral-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] group ${className}`}
    >
      <div className="relative z-10">{children}</div>
      
      {/* Subtle background shimmer */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-transparent via-brand-50/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
}
