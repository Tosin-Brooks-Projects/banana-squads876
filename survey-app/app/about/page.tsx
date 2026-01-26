'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xl font-bold text-neutral-900">Unboring Surveys</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-neutral-900"
          >
            About{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Unboring Surveys</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-brand-200 -z-0"></span>
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl text-neutral-600"
          >
            Making surveys less painful, one question at a time.
          </motion.p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-neutral-200">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">The Inspiration</h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-neutral-600 text-lg leading-relaxed mb-6">
                Unboring Surveys was born from a hackathon competition where businesses
                present real problems they're facing and participants have two weeks to build actual solutions.
              </p>
              <p className="text-neutral-600 text-lg leading-relaxed mb-6">
                As a business owner myself, I knew that reducing friction and making it easier for people
                to take surveys would be extremely helpful. I also knew firsthand how painful surveys can be
                &mdash; I avoided them like the plague. Even when I tried to complete surveys to help out
                organizations I care about, I would often abandon them if they were too long or not well thought out.
              </p>
              <p className="text-neutral-600 text-lg leading-relaxed">
                That frustration became the fuel for this project. What if surveys could actually be...
                enjoyable? What if responding to a survey felt more like a mini-adventure than a chore?
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meet the Creator */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-shrink-0">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-neutral-200 border-4 border-brand-200">
                <Image
                  src="/images/brooks-profile.png"
                  alt="Brooks Conkle"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Brooks Conkle</h2>
              <p className="text-brand-600 font-medium mb-4">Creator & Developer</p>
              <p className="text-neutral-600 leading-relaxed mb-6">
                Business owner, survey-abandoner-turned-fixer, and believer that
                even the most mundane tasks can be made a little more fun.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://x.com/brooksconkle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-700 hover:text-brand-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/brooksconkle/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-700 hover:text-brand-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Connect CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-neutral-200">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Have Questions or Ideas?
            </h2>
            <p className="text-neutral-600 mb-6">
              I'd love to hear from you! Whether you have feedback, feature requests,
              or just want to say hi, feel free to reach out on X.
            </p>
            <a
              href="https://x.com/brooksconkle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Connect on X
            </a>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Ready to Try It Out?
          </h2>
          <p className="text-neutral-600 mb-8">
            Create your first unboring survey in minutes. It's free to start.
          </p>
          <Link
            href="/login"
            className="inline-block bg-brand-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors"
          >
            Start Creating for Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
