'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Footer from '@/components/Footer';

const adventures = [
  { emoji: '🍨', name: 'Ice Cream Sundae', color: 'from-pink-400 to-pink-600' },
  { emoji: '🍕', name: 'Pizza Builder', color: 'from-orange-400 to-red-500' },
  { emoji: '🌻', name: 'Garden Grower', color: 'from-green-400 to-emerald-600' },
  { emoji: '🏠', name: 'Dream Home', color: 'from-purple-400 to-indigo-600' },
  { emoji: '☕', name: 'Coffee Brewer', color: 'from-amber-500 to-amber-700' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xl font-bold text-neutral-900">Unboring Surveys</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link href="/pricing" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6"
          >
            Surveys that people{' '}
            <span className="relative inline-block">
              <span className="relative z-10">actually complete</span>
              <span className="absolute bottom-2 left-0 w-full h-3 bg-brand-200 -z-0"></span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-neutral-600 mb-6 max-w-2xl mx-auto"
          >
            Gamified surveys that boost completion rates by 3x.
          </motion.p>

          {/* Compact adventure icons strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex justify-center gap-3 mb-8"
          >
            {adventures.map((adventure, index) => (
              <motion.div
                key={adventure.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="text-2xl"
                title={adventure.name}
              >
                {adventure.emoji}
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Start for Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Why Choose Unboring Surveys?
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Interactive adventures make data collection fun.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎮',
                title: 'Gamified Experience',
                description: 'Interactive adventures that keep respondents engaged.',
              },
              {
                icon: '📊',
                title: 'Rich Analytics',
                description: 'Beautiful charts and exportable reports.',
              },
              {
                icon: '🚀',
                title: 'Higher Completion Rates',
                description: '3x higher completion rates vs. traditional forms.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-neutral-50 rounded-2xl p-8 text-center border border-neutral-100"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-neutral-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Ready to Make Surveys Fun?
            </h2>
            <p className="text-neutral-600 mb-8">
              Start transforming how you collect feedback.
            </p>
            <Link href="/login">
              <Button size="lg">
                Start Creating for Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
