'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, LogOut, ArrowRight, Sparkles, Layout, Zap, Database } from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';
import { BentoGrid, BentoCard } from '@/components/ui/BentoGrid';
import { useAuthContext } from '@/contexts/AuthContext';
import { updateUser, createUser, checkUsernameExists, isUsernameReserved } from '@/lib/firebase/firestore';
import { signOut } from '@/lib/firebase/auth';

// Username validation rules
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9-]+$/;

function validateUsername(username: string) {
  if (!username) return { isValid: false, message: '' };
  if (username.length < USERNAME_MIN_LENGTH) return { isValid: false, message: `Min ${USERNAME_MIN_LENGTH} characters` };
  if (username.length > USERNAME_MAX_LENGTH) return { isValid: false, message: `Max ${USERNAME_MAX_LENGTH} characters` };
  if (!USERNAME_REGEX.test(username)) return { isValid: false, message: 'Alphanumeric and hyphens only' };
  if (username.startsWith('-') || username.endsWith('-')) return { isValid: false, message: 'No hyphens at start/end' };
  if (username.includes('--')) return { isValid: false, message: 'No consecutive hyphens' };
  if (isUsernameReserved(username)) return { isValid: false, message: 'Reserved username' };
  return { isValid: true, message: '' };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, user, loading, refreshUser } = useAuthContext();

  const [username, setUsername] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [validationError, setValidationError] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) router.push('/login');
      else if (user?.username) router.push('/dashboard');
    }
  }, [firebaseUser, user, loading, router]);

  useEffect(() => {
    if (user?.email) {
      const base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const emailSuggestions = [base, `${base}-surveys`, `${base}-pro`].slice(0, 3);
      setSuggestions(emailSuggestions);
    }
  }, [user?.email]);

  const checkAvailability = useCallback(async (usernameToCheck: string) => {
    const validation = validateUsername(usernameToCheck);
    if (!validation.isValid) {
      setValidationError(validation.message);
      setAvailabilityStatus('idle');
      return;
    }
    setValidationError('');
    setAvailabilityStatus('checking');
    try {
      const exists = await checkUsernameExists(usernameToCheck.toLowerCase());
      setAvailabilityStatus(exists ? 'taken' : 'available');
    } catch {
      setAvailabilityStatus('idle');
      setError('Failed to check availability');
    }
  }, []);

  useEffect(() => {
    if (!username) {
      setAvailabilityStatus('idle');
      setValidationError('');
      return;
    }
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setValidationError(validation.message);
      setAvailabilityStatus('idle');
      return;
    }
    setValidationError('');
    const timeoutId = setTimeout(() => checkAvailability(username), 500);
    return () => clearTimeout(timeoutId);
  }, [username, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = user?.id || firebaseUser?.uid;
    if (!userId || availabilityStatus !== 'available') return;

    setIsSubmitting(true);
    setError(null);
    try {
      if (!user) {
        await createUser({
          id: userId,
          email: firebaseUser!.email!,
          username: username.toLowerCase(),
          displayName: username,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await updateUser(userId, {
          username: username.toLowerCase(),
          displayName: username,
        });
      }
      await refreshUser();
      router.push('/dashboard/create');
    } catch (err) {
      setError('Failed to save. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !firebaseUser || user?.username) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-50 noise-overlay">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-50 noise-overlay flex flex-col md:flex-row overflow-hidden">
      {/* Visual Side - Feature Spotlight */}
      <div className="hidden md:flex md:w-1/2 bg-neutral-100/50 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(circle_at_30%_30%,rgba(230,115,72,0.1),transparent_50%)]" />
        
        <div className="relative z-10 space-y-6 max-w-lg mx-auto">
          {/* Main Hero Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="glass-morphism rounded-[3rem] p-10 border-white/40 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 rounded-3xl bg-brand-500 shadow-lg shadow-brand-500/20">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-neutral-200" />
                ))}
              </div>
            </div>
            <h3 className="font-outfit text-3xl font-bold tracking-tighter text-neutral-900 leading-tight">
              Feedback that feels <br/> like a <span className="text-brand-500 italic">game.</span>
            </h3>
            <p className="text-neutral-500 mt-4 text-lg font-medium leading-relaxed">
              Transform dry questions into immersive adventures. 3x higher completion rates, guaranteed.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            {/* Secondary Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="glass-morphism rounded-[2.5rem] p-8 border-white/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                <Zap className="text-brand-500 w-6 h-6 fill-brand-500" />
              </div>
              <h4 className="font-bold text-neutral-900 tracking-tight">Instant Deployment</h4>
              <p className="text-xs text-neutral-400 mt-2 font-medium">Ready in under 60 seconds.</p>
            </motion.div>

            {/* Secondary Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="bg-neutral-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl group-hover:bg-brand-500/20 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                <Layout className="text-white w-6 h-6" />
              </div>
              <h4 className="font-bold text-white tracking-tight">Custom Skins</h4>
              <p className="text-xs text-neutral-400 mt-2 font-medium">10+ Immersive themes.</p>
            </motion.div>
          </div>

          {/* Floating Detail */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 px-6 py-4 glass-morphism rounded-full w-max border-white/10 self-center mx-auto"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Live Preview Active</span>
          </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <header className="mb-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-500/20"
            >
              <Layout className="text-white w-6 h-6" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-outfit font-bold tracking-tighter leading-tight text-neutral-900">
              Claim your space.
            </h1>
            <p className="text-neutral-500 mt-4 text-lg">
              Choose a username for your unique survey link.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold tracking-wide text-neutral-900 uppercase">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="the-best-surveys"
                  className={`
                    w-full px-6 py-4 rounded-2xl bg-white border-2 transition-all duration-300 outline-none
                    font-medium text-lg
                    ${validationError || availabilityStatus === 'taken'
                      ? 'border-red-100 focus:border-red-200 bg-red-50/10'
                      : availabilityStatus === 'available'
                        ? 'border-green-100 focus:border-green-200 bg-green-50/10'
                        : 'border-neutral-100 focus:border-brand-200'
                    }
                  `}
                  maxLength={USERNAME_MAX_LENGTH}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {isChecking ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                      </motion.div>
                    ) : availabilityStatus === 'available' ? (
                      <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-1 rounded-full bg-green-500">
                        <Check className="w-3 h-3 text-white" strokeWidth={4} />
                      </motion.div>
                    ) : availabilityStatus === 'taken' ? (
                      <motion.div key="error" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-1 rounded-full bg-red-500">
                        <X className="w-3 h-3 text-white" strokeWidth={4} />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              {/* Status Messages */}
              <AnimatePresence>
                {(validationError || availabilityStatus === 'taken' || availabilityStatus === 'available') && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-sm font-medium ${
                      validationError || availabilityStatus === 'taken' ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {validationError || (availabilityStatus === 'taken' ? 'Already taken' : 'Available!')}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* URL Preview */}
            <div className="glass-morphism rounded-3xl p-6 border-neutral-100">
              <div className="flex items-center gap-3 text-neutral-400 mb-2">
                <Database className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Public URL</span>
              </div>
              <p className="text-neutral-900 font-medium break-all">
                unboring.com/<span className="text-brand-500">{username || 'your-name'}</span>
              </p>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !username && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUsername(s)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-neutral-100 rounded-xl hover:border-brand-200 hover:text-brand-500 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <MagneticButton
              disabled={availabilityStatus !== 'available' || isSubmitting}
              className={`
                w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300
                ${availabilityStatus === 'available' && !isSubmitting
                  ? 'bg-neutral-900 text-white shadow-xl shadow-neutral-900/10'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
                <ArrowRight className="w-5 h-5" />
              </div>
            </MagneticButton>

            {error && (
              <p className="text-center text-sm text-red-500 font-medium">{error}</p>
            )}
          </form>

          <footer className="mt-12 pt-8 border-t border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200" />
              <div className="text-xs">
                <p className="text-neutral-400 font-medium">Logged in as</p>
                <p className="text-neutral-900 font-bold">{firebaseUser?.email}</p>
              </div>
            </div>
            <button
              onClick={async () => { await signOut(); router.push('/login'); }}
              className="p-2 rounded-xl hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
