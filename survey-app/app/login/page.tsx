'use client';

import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, RotateCcw, Sparkles, Gamepad2, Zap, Palette, Gift } from 'lucide-react';
import { signInWithGoogle, sendMagicLink } from '@/lib/firebase/auth';
import { useAuthContext } from '@/contexts/AuthContext';

// ─── Google wordmark SVG ──────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ─── Decorative left panel ────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react';

const PERKS: { Icon: LucideIcon; label: string }[] = [
  { Icon: Gamepad2, label: 'Surveys that play like games' },
  { Icon: Zap,      label: 'Live results, instantly' },
  { Icon: Palette,  label: 'Beautiful adventure themes' },
  { Icon: Gift,     label: 'Free to start — always' },
];

function LeftPanel() {
  const prefersReduced = useReducedMotion();

  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-[#3c3c3c] text-white relative overflow-hidden">
      {/* Subtle decorative circles */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-orange-500/10 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-orange-500/8 pointer-events-none" />

      {/* Brand */}
      <Link href="/" className="relative z-10 flex items-center gap-2 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3c3c3c] rounded-lg">
        <span className="font-fredoka font-bold text-2xl tracking-tight">
          Unboring <span className="text-orange-400">Surveys</span>
        </span>
      </Link>

      {/* Hero copy */}
      <div className="relative z-10 space-y-6">
        <motion.h2
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 28 }}
          className="font-fredoka font-bold text-4xl xl:text-5xl leading-tight text-balance"
        >
          Make surveys people{' '}
          <span className="text-orange-400">actually enjoy.</span>
        </motion.h2>

        <motion.ul
          initial="hidden"
          animate="visible"
          variants={prefersReduced ? {} : {
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
          }}
          className="space-y-4"
        >
          {PERKS.map(({ Icon, label }) => (
            <motion.li
              key={label}
              variants={prefersReduced ? {} : {
                hidden: { opacity: 0, x: -16 },
                visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
              }}
              className="flex items-center gap-3 text-base font-outfit font-medium text-white/80"
            >
              <span className="flex-shrink-0 w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center" aria-hidden="true">
                <Icon className="w-4 h-4 text-orange-400" />
              </span>
              {label}
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* Footer note */}
      <p className="relative z-10 text-[11px] font-black uppercase tracking-widest text-white/30 font-outfit">
        No credit card required · Free forever
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading, needsOnboarding } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const emailId = useId();

  useEffect(() => {
    if (!authLoading && firebaseUser) {
      router.push(needsOnboarding ? '/onboarding' : '/dashboard');
    }
  }, [firebaseUser, authLoading, needsOnboarding, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    setIsLoading(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const anyLoading = isLoading || googleLoading;
  const prefersReduced = useReducedMotion();
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    if (!val.trim()) { setEmailError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setEmailError('Enter a valid email address'); return false; }
    setEmailError(null);
    return true;
  };

  // ── Auth loading skeleton ──
  if (authLoading) {
    return (
      <div className="min-h-dvh bg-neutral-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 rounded-2xl border-4 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-[11px] font-black uppercase tracking-widest text-[#afafaf] font-outfit">Loading…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr]">
      <LeftPanel />

      {/* ── Right: form panel ── */}
      <div className="flex flex-col bg-white">

        {/* Mobile-only top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b-2 border-[#e5e5e5]">
          <Link href="/" className="font-fredoka font-bold text-xl text-[#3c3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg">
            Unboring <span className="text-orange-500">Surveys</span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.05 }}
            className="w-full max-w-sm"
          >
            {/* Header */}
            <AnimatePresence mode="wait">
              {emailSent ? (
                <motion.div
                  key="sent-header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8 text-center"
                >
                  <div className="w-16 h-16 bg-orange-50 border-2 border-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-[0_4px_0_#fed7aa]">
                    <Mail className="w-7 h-7 text-orange-500" />
                  </div>
                  <h1 className="font-fredoka font-bold text-3xl text-[#3c3c3c] mb-2">Check your inbox</h1>
                  <p className="text-sm text-[#777777] font-outfit leading-relaxed">
                    We sent a sign-in link to{' '}
                    <span className="font-semibold text-[#3c3c3c] break-all">{email}</span>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="default-header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border-2 border-orange-100 rounded-full mb-5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 font-outfit">Free to start</span>
                  </div>
                  <h1 className="font-fredoka font-bold text-4xl text-[#3c3c3c] leading-tight mb-2">
                    Welcome back.
                  </h1>
                  <p className="text-sm text-[#777777] font-outfit">
                    Sign in or create an account — it takes 10 seconds.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="mb-5 px-4 py-3 bg-red-50 border-2 border-red-200 rounded-2xl text-sm text-red-700 font-outfit font-medium shadow-[0_2px_0_#fecaca]"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Email sent state ── */}
            <AnimatePresence mode="wait">
              {emailSent ? (
                <motion.div
                  key="sent-body"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-4"
                >
                  <div className="px-5 py-4 bg-[#fafafa] border-2 border-[#e5e5e5] rounded-2xl shadow-[0_3px_0_#e5e5e5]">
                    <p className="text-sm text-[#777777] font-outfit leading-relaxed">
                      Click the link in the email to sign in. You can safely close this tab once sent.
                    </p>
                  </div>

                  <button
                    onClick={() => { setEmailSent(false); setEmail(''); setError(null); setEmailError(null); }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-[#e5e5e5] text-sm font-semibold font-outfit text-[#777777] hover:text-[#3c3c3c] hover:border-[#c8c8c8] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Use a different email
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form-body"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-4"
                >
                  {/* Google button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={anyLoading}
                    className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white border-2 border-[#e5e5e5] rounded-2xl text-sm font-semibold font-outfit text-[#3c3c3c] shadow-[0_3px_0_#e5e5e5] hover:border-[#c8c8c8] hover:shadow-[0_3px_0_#c8c8c8] transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    aria-busy={googleLoading}
                  >
                    {googleLoading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#e5e5e5] border-t-[#777777] animate-spin" aria-hidden="true" />
                    ) : (
                      <GoogleIcon />
                    )}
                    Continue with Google
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#e5e5e5]" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#afafaf] font-outfit flex-shrink-0">or</span>
                    <div className="flex-1 h-px bg-[#e5e5e5]" />
                  </div>

                  {/* Email form */}
                  <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                    <div>
                      <label
                        htmlFor={emailId}
                        className="block text-[11px] font-black uppercase tracking-widest text-[#777777] font-outfit mb-2"
                      >
                        Email address
                      </label>
                      <input
                        id={emailId}
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                        onBlur={(e) => { if (e.target.value) validateEmail(e.target.value); }}
                        required
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? `${emailId}-error` : undefined}
                        disabled={anyLoading}
                        className={`w-full px-4 py-3.5 bg-white border-2 rounded-2xl text-sm font-outfit text-[#3c3c3c] placeholder:text-[#c0c0c0] shadow-[0_3px_0_#e5e5e5] transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                          ${emailError
                            ? 'border-red-300 focus:border-red-400 focus:shadow-[0_3px_0_#fecaca]'
                            : 'border-[#e5e5e5] focus:border-orange-400 focus:shadow-[0_3px_0_#fed7aa]'
                          }`}
                      />
                      <AnimatePresence>
                        {emailError && (
                          <motion.p
                            id={`${emailId}-error`}
                            role="alert"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="mt-1.5 text-xs font-outfit font-medium text-red-600"
                          >
                            {emailError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="submit"
                      disabled={anyLoading || !email.trim()}
                      aria-busy={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 text-white font-fredoka font-bold text-base uppercase tracking-widest rounded-2xl border-b-[3px] border-orange-700 shadow-[0_4px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-orange-300 border-t-white animate-spin" aria-hidden="true" />
                          Sending link…
                        </>
                      ) : (
                        <>
                          Send magic link
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <p className="mt-8 text-center text-[11px] text-[#afafaf] font-outfit font-medium leading-relaxed">
              By continuing you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-[#777777] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-[#777777] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded">
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
