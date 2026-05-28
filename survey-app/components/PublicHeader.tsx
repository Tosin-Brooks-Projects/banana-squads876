'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b-2 border-[#e5e5e5] sticky top-0 z-50">
      <nav className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="font-fredoka font-black text-xl select-none">
          <span className="text-[#3c3c3c]">Unboring </span>
          <span className="text-orange-500">Surveys</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {[['Pricing', '/pricing'], ['Docs', '#'], ['About', '/about']].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-semibold text-[#777777] hover:text-[#3c3c3c] transition-colors font-outfit"
            >
              {label}
            </Link>
          ))}
          <Link href="/login">
            <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl font-fredoka border-b-[3px] border-orange-700 shadow-[0_2px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all">
              Get started
            </button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[#3c3c3c] hover:bg-orange-50 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="sm:hidden border-t border-[#e5e5e5] bg-white px-6 py-4 space-y-1"
          >
            {[['Pricing', '/pricing'], ['Docs', '#'], ['About', '/about'], ['Log in', '/login']].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-[#3c3c3c] hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors font-outfit"
              >
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
