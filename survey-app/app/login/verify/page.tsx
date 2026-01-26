'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Spinner } from '@/components/ui/LoadingStates';
import { isEmailLink, completeSignInWithEmailLink } from '@/lib/firebase/auth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handleEmailLink = async () => {
      // Check if this is a sign-in link
      if (typeof window === 'undefined') return;

      const url = window.location.href;
      if (!isEmailLink(url)) {
        setError('Invalid sign-in link. Please request a new one.');
        setIsLoading(false);
        return;
      }

      // Try to get email from localStorage
      let storedEmail = window.localStorage.getItem('emailForSignIn');

      if (!storedEmail) {
        // User opened link on different device/browser
        setNeedsEmail(true);
        setIsLoading(false);
        return;
      }

      try {
        await completeSignInWithEmailLink(storedEmail, url);
        router.push('/dashboard');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    handleEmailLink();
  }, [router]);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = window.location.href;
      await completeSignInWithEmailLink(email, url);
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoading && !needsEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Signing you in...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">Unboring Surveys</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-6 mb-2">
            {error ? 'Sign-in failed' : 'Confirm your email'}
          </h2>
        </div>

        <Card padding="lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {needsEmail && !error && (
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                Please enter the email address you used to request the sign-in link.
              </p>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                loadingText="Signing in..."
              >
                Complete Sign In
              </Button>
            </form>
          )}

          {error && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push('/login')}
            >
              Back to Login
            </Button>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
