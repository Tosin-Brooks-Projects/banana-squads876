'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthContext } from '@/contexts/AuthContext';
import { updateUser, createUser, checkUsernameExists, isUsernameReserved } from '@/lib/firebase/firestore';
import { signOut } from '@/lib/firebase/auth';

// Username validation rules
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9-]+$/;

interface ValidationResult {
  isValid: boolean;
  message: string;
}

function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { isValid: false, message: '' };
  }

  if (username.length < USERNAME_MIN_LENGTH) {
    return { isValid: false, message: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return { isValid: false, message: `Username must be at most ${USERNAME_MAX_LENGTH} characters` };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, message: 'Only letters, numbers, and hyphens allowed' };
  }

  if (username.startsWith('-') || username.endsWith('-')) {
    return { isValid: false, message: 'Username cannot start or end with a hyphen' };
  }

  if (username.includes('--')) {
    return { isValid: false, message: 'Username cannot contain consecutive hyphens' };
  }

  if (isUsernameReserved(username)) {
    return { isValid: false, message: 'This username is reserved' };
  }

  return { isValid: true, message: '' };
}

function generateSuggestions(email: string): string[] {
  const baseUsername = email.split('@')[0].toLowerCase();
  const sanitized = baseUsername.replace(/[^a-z0-9]/g, '');

  const suggestions: string[] = [];

  // Base suggestion
  if (sanitized.length >= USERNAME_MIN_LENGTH && !isUsernameReserved(sanitized)) {
    suggestions.push(sanitized);
  }

  // With hyphen variant
  const parts = baseUsername.split(/[._]/);
  if (parts.length > 1) {
    const hyphenated = parts.join('-').replace(/[^a-z0-9-]/g, '');
    if (hyphenated.length >= USERNAME_MIN_LENGTH && !isUsernameReserved(hyphenated)) {
      suggestions.push(hyphenated);
    }
  }

  // First initial + last name style
  if (parts.length > 1 && parts[0].length > 0 && parts[1].length > 0) {
    const initialStyle = `${parts[0][0]}-${parts[1]}`.replace(/[^a-z0-9-]/g, '');
    if (initialStyle.length >= USERNAME_MIN_LENGTH && !isUsernameReserved(initialStyle)) {
      suggestions.push(initialStyle);
    }
  }

  return suggestions.slice(0, 3);
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

  // Redirect if not logged in or already has username
  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.push('/login');
      } else if (user?.username) {
        router.push('/dashboard');
      }
    }
  }, [firebaseUser, user, loading, router]);

  // Generate suggestions based on email
  useEffect(() => {
    if (user?.email) {
      const emailSuggestions = generateSuggestions(user.email);
      setSuggestions(emailSuggestions);
    }
  }, [user?.email]);

  // Check username availability with debounce
  const checkAvailability = useCallback(async (usernameToCheck: string) => {
    const validation = validateUsername(usernameToCheck);

    if (!validation.isValid) {
      setValidationError(validation.message);
      setAvailabilityStatus('idle');
      return;
    }

    setValidationError('');
    setAvailabilityStatus('checking');
    setIsChecking(true);

    try {
      const exists = await checkUsernameExists(usernameToCheck.toLowerCase());
      setAvailabilityStatus(exists ? 'taken' : 'available');
    } catch {
      setAvailabilityStatus('idle');
      setError('Failed to check username availability');
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Debounced availability check
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
    const timeoutId = setTimeout(() => {
      checkAvailability(username);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Submit clicked', { user, firebaseUser, availabilityStatus, username });

    // Use firebaseUser.uid if user document doesn't exist yet
    const userId = user?.id || firebaseUser?.uid;

    if (!userId || availabilityStatus !== 'available') {
      console.log('Submit blocked:', { userId, availabilityStatus });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Updating user:', userId);

      // If user document doesn't exist, create it first
      if (!user) {
        console.log('Creating new user document...');
        await createUser({
          id: userId,
          email: firebaseUser!.email!,
          username: username.toLowerCase(),
          displayName: username,
          photoURL: firebaseUser!.photoURL || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await updateUser(userId, {
          username: username.toLowerCase(),
          displayName: username,
        });
      }

      console.log('User saved, refreshing...');
      // Refresh user data in context before navigating
      await refreshUser();
      console.log('Navigating to dashboard...');
      router.push('/dashboard/create');
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save username. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion);
  };

  if (loading || !firebaseUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (availabilityStatus) {
      case 'checking':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
        );
      case 'available':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'taken':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">Welcome!</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            Choose your username
          </h1>
          <p className="text-gray-600">
            This will be your unique URL for sharing surveys
          </p>
        </div>

        <Card padding="lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="your-username"
                  className={`
                    w-full px-4 py-2 pr-10 rounded-lg border transition-colors
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${validationError || availabilityStatus === 'taken'
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : availabilityStatus === 'available'
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    }
                  `}
                  maxLength={USERNAME_MAX_LENGTH}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {getStatusIcon()}
                </div>
              </div>

              {/* Validation/status messages */}
              {validationError && (
                <p className="mt-1 text-sm text-red-600">{validationError}</p>
              )}
              {!validationError && availabilityStatus === 'available' && (
                <p className="mt-1 text-sm text-green-600">Username is available!</p>
              )}
              {!validationError && availabilityStatus === 'taken' && (
                <p className="mt-1 text-sm text-red-600">Username is already taken</p>
              )}
            </div>

            {/* URL Preview */}
            {username && !validationError && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Your survey URL will be:</p>
                <p className="text-sm font-mono text-indigo-600 break-all">
                  playthis.co/<span className="font-semibold">{username}</span>/your-survey
                </p>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && !username && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Suggestions based on your email:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Username rules:</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li className="flex items-center gap-2">
                  <span className={username.length >= USERNAME_MIN_LENGTH && username.length <= USERNAME_MAX_LENGTH ? 'text-green-500' : 'text-gray-400'}>
                    {username.length >= USERNAME_MIN_LENGTH && username.length <= USERNAME_MAX_LENGTH ? '✓' : '○'}
                  </span>
                  {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters
                </li>
                <li className="flex items-center gap-2">
                  <span className={username && USERNAME_REGEX.test(username) ? 'text-green-500' : 'text-gray-400'}>
                    {username && USERNAME_REGEX.test(username) ? '✓' : '○'}
                  </span>
                  Letters, numbers, and hyphens only
                </li>
                <li className="flex items-center gap-2">
                  <span className={username && !username.includes(' ') ? 'text-green-500' : 'text-gray-400'}>
                    {username && !username.includes(' ') ? '✓' : '○'}
                  </span>
                  No spaces or special characters
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
              disabled={availabilityStatus !== 'available' || isChecking || isSubmitting}
            >
              Continue
            </Button>
          </form>

          {/* Sign out option for users who need to use a different account */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Signed in as {firebaseUser?.email}
            </p>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Sign out and use a different account
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
