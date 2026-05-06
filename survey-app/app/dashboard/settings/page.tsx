'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import Button from '@/components/ui/AnimatedButton';
import { useAuthContext } from '@/contexts/AuthContext';
import { updateUser, checkUsernameExists, isUsernameReserved } from '@/lib/firebase/firestore';
import { signOut } from '@/lib/firebase/auth';
import { PreviousUsername } from '@/lib/types';

// Username validation rules (same as onboarding)
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

// Warning Modal Component
function WarningModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Warning header */}
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg"
                >
                  <svg
                    className="w-8 h-8 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold text-white mt-4"
                >
                  Change Username?
                </motion.h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Changing your username will update all your survey URLs.</strong>
                  </p>
                  <p className="text-amber-700 text-sm mt-2">
                    Old links will automatically redirect to your new URL for 30 days. After that, the old links will stop working.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={onConfirm}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Delete Account Confirmation Modal
function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmValid = confirmText === 'DELETE';

  // Reset confirm text when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isDeleting ? undefined : onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Danger header */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg"
                >
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold text-white mt-4"
                >
                  Delete Account?
                </motion.h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm font-semibold">
                    This action is permanent and cannot be undone.
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    All your data will be permanently deleted:
                  </p>
                  <ul className="text-red-700 text-sm mt-2 list-disc list-inside space-y-1">
                    <li>Your account and profile</li>
                    <li>All surveys you created</li>
                    <li>All responses to your surveys</li>
                    <li>All survey analytics and data</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    disabled={isDeleting}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={onConfirm}
                    disabled={!isConfirmValid || isDeleting}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${isConfirmValid && !isDeleting
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {isDeleting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Deleting...
                      </span>
                    ) : (
                      'Delete My Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Success Message Component
function SuccessMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-700 font-medium">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-green-600 hover:text-green-800">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, refreshUser, firebaseUser } = useAuthContext();

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'same'>('idle');
  const [validationError, setValidationError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Export data state
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Check username availability with debounce
  const checkAvailability = useCallback(async (usernameToCheck: string) => {
    if (!user) return;

    // Check if it's the same as current username
    if (usernameToCheck.toLowerCase() === user.username?.toLowerCase()) {
      setAvailabilityStatus('same');
      setValidationError('This is your current username');
      return;
    }

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
  }, [user]);

  // Debounced availability check
  useEffect(() => {
    if (!newUsername) {
      setAvailabilityStatus('idle');
      setValidationError('');
      return;
    }

    if (!user) return;

    // Check if it's the same as current username
    if (newUsername.toLowerCase() === user.username?.toLowerCase()) {
      setAvailabilityStatus('same');
      setValidationError('This is your current username');
      return;
    }

    const validation = validateUsername(newUsername);
    if (!validation.isValid) {
      setValidationError(validation.message);
      setAvailabilityStatus('idle');
      return;
    }

    setValidationError('');
    const timeoutId = setTimeout(() => {
      checkAvailability(newUsername);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newUsername, checkAvailability, user]);

  const handleChangeUsernameClick = () => {
    setShowWarningModal(true);
  };

  const handleWarningConfirm = () => {
    setShowWarningModal(false);
    setShowUsernameForm(true);
    setNewUsername('');
    setAvailabilityStatus('idle');
    setValidationError('');
    setError(null);
  };

  const handleCancelUsernameChange = () => {
    setShowUsernameForm(false);
    setNewUsername('');
    setAvailabilityStatus('idle');
    setValidationError('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || availabilityStatus !== 'available' || !user.username) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create the previous username entry
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const newPreviousUsername: PreviousUsername = {
        username: user.username,
        changedAt: now,
        expiresAt: expiresAt,
      };

      // Get existing previous usernames or start with empty array
      const existingPreviousUsernames = user.previousUsernames || [];

      // Update user with new username and add old one to previousUsernames
      await updateUser(user.id, {
        username: newUsername.toLowerCase(),
        displayName: newUsername,
        previousUsernames: [
          ...existingPreviousUsernames,
          newPreviousUsername,
        ] as unknown as PreviousUsername[],
      });

      // Refresh user data in context
      await refreshUser();

      // Show success and close form
      setSuccessMessage(`Username changed to "${newUsername}" successfully! Old links will redirect for 30 days.`);
      setShowUsernameForm(false);
      setNewUsername('');
    } catch {
      setError('Failed to update username. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle data export
  const handleExportData = async () => {
    if (!firebaseUser) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const authToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/user/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export data');
      }

      // Get the blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setSuccessMessage('Your data has been exported successfully!');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!firebaseUser) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const authToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect to home
      await signOut();
      router.push('/?deleted=true');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

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
      case 'same':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-8">
           <div className="w-12 h-12 rounded-2xl bg-orange-500 border-b-4 border-orange-700 flex items-center justify-center text-white shadow-lg">
              <Settings className="w-6 h-6" />
           </div>
           <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900">
             Command <span className="text-orange-500">Center</span>
           </h1>
        </div>

        <AnimatePresence>
          {successMessage && (
            <SuccessMessage
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            />
          )}
        </AnimatePresence>

        {/* Account Settings Card */}
        <div className="bg-white rounded-2xl sm:rounded-[32px] border-4 border-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.02)] p-5 sm:p-10 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-xl">
              👤
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">Identity</h2>
          </div>

          {/* Current Username Display */}
          <div className="mb-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Codename</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center gap-3">
                <span className="text-gray-900 font-black text-lg">@{user.username || 'unknown'}</span>
              </div>
              {!showUsernameForm && user.username && (
                <button
                  onClick={handleChangeUsernameClick}
                  className="px-6 py-4 bg-white border-2 border-gray-100 hover:border-orange-200 hover:text-orange-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.03)]"
                >
                  Change Identity
                </button>
              )}
            </div>
            {user.username && (
              <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border-2 border-indigo-50 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Quest Portal: <span className="font-black">unboringsurveys.com/{user.username}/...</span>
                </p>
              </div>
            )}
          </div>

          {/* Username Change Form */}
          <AnimatePresence>
            {showUsernameForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-8"
              >
                <div className="border-4 border-orange-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 bg-orange-50/30">
                  <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">New Codename Selection</h3>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 font-bold text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">New Username</p>
                      <div className="relative">
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                          placeholder="your-new-username"
                          className={`
                            w-full px-6 py-4 pr-12 rounded-2xl border-4 transition-all font-black text-lg
                            focus:outline-none shadow-inner
                            ${validationError || availabilityStatus === 'taken' || availabilityStatus === 'same'
                              ? 'border-red-200 bg-red-50 text-red-600'
                              : availabilityStatus === 'available'
                                ? 'border-green-200 bg-green-50 text-green-600'
                                : 'border-gray-100 bg-white focus:border-orange-200'
                            }
                          `}
                          maxLength={USERNAME_MAX_LENGTH}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {getStatusIcon()}
                        </div>
                      </div>

                      {/* Validation/status messages */}
                      {validationError && (
                        <p className="mt-2 ml-1 text-xs font-bold text-red-500">{validationError}</p>
                      )}
                      {!validationError && availabilityStatus === 'available' && (
                        <p className="mt-2 ml-1 text-xs font-bold text-green-600">Quest name available! 🚀</p>
                      )}
                      {!validationError && availabilityStatus === 'taken' && (
                        <p className="mt-2 ml-1 text-xs font-bold text-red-500">Identity already claimed</p>
                      )}
                    </div>

                    {/* URL Preview */}
                    {newUsername && !validationError && availabilityStatus === 'available' && (
                      <div className="bg-white rounded-2xl p-5 border-4 border-gray-50 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">New Portal URL:</p>
                        <p className="text-xs font-black text-orange-600 break-all bg-orange-50 px-3 py-2 rounded-lg border-2 border-orange-100">
                          unboringsurveys.com/<span className="underline">{newUsername}</span>/your-quest
                        </p>
                      </div>
                    )}

                    {/* Username Rules */}
                    <div className="bg-gray-100/50 rounded-2xl p-6 border-2 border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Identity Rules:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <li className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] border-2 ${newUsername.length >= USERNAME_MIN_LENGTH && newUsername.length <= USERNAME_MAX_LENGTH ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                            {newUsername.length >= USERNAME_MIN_LENGTH && newUsername.length <= USERNAME_MAX_LENGTH ? '✓' : ''}
                          </div>
                          <span className="text-xs font-bold text-gray-500">3-20 Characters</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] border-2 ${newUsername && USERNAME_REGEX.test(newUsername) ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                            {newUsername && USERNAME_REGEX.test(newUsername) ? '✓' : ''}
                          </div>
                          <span className="text-xs font-bold text-gray-500">Alphanumeric & Hyphens</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] border-2 ${newUsername && !newUsername.includes(' ') ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                            {newUsername && !newUsername.includes(' ') ? '✓' : ''}
                          </div>
                          <span className="text-xs font-bold text-gray-500">No Spaces</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        type="button"
                        onClick={handleCancelUsernameChange}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-white border-4 border-gray-100 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-all active:translate-y-1"
                      >
                        Abort
                      </button>
                      <button
                        type="submit"
                        disabled={availabilityStatus !== 'available' || isChecking || isSubmitting}
                        className="flex-1 py-4 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                      >
                        {isSubmitting ? 'Updating Realm...' : 'Claim Identity'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Display (read-only) */}
          <div className="border-t-4 border-gray-50 pt-8 mt-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Recovery Scroll (Email)</p>
            <div className="px-6 py-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100 flex items-center justify-between group">
              <span className="text-gray-500 font-bold">{user.email}</span>
              <div className="px-3 py-1 bg-white border-2 border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-tighter group-hover:border-indigo-100 group-hover:text-indigo-400 transition-all">
                Locked
              </div>
            </div>
            <p className="mt-3 ml-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-60">
              Identity email is bound to your account realm.
            </p>
          </div>
        </div>

        {/* Data & Privacy Card */}
        <div className="bg-white rounded-2xl sm:rounded-[32px] border-4 border-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.02)] p-5 sm:p-10 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 rounded-xl bg-green-50 border-2 border-green-100 flex items-center justify-center text-xl">
              📦
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">Mission Data</h2>
          </div>

          {exportError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 font-bold text-sm">
              {exportError}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-8 bg-gray-50 rounded-2xl sm:rounded-[32px] border-4 border-gray-100 group hover:border-indigo-100 transition-all">
            <div className="max-w-md">
              <p className="text-lg font-black text-gray-900 leading-tight uppercase tracking-tight mb-1">Archive Mission History</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-relaxed">
                Download a complete record of all your adventures, responses, and identity metadata in a portable JSON format.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-8 py-4 bg-white border-4 border-indigo-100 text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(79,70,229,0.05)] hover:border-indigo-500 hover:translate-y-[-2px] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 shrink-0"
            >
              {isExporting ? (
                <span className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                   Archiving...
                </span>
              ) : 'Export Data'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50/30 rounded-2xl sm:rounded-[32px] border-4 border-red-50 p-5 sm:p-10 mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 rounded-xl bg-red-100 border-2 border-red-200 flex items-center justify-center text-xl">
              ⚠️
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-red-600 leading-tight uppercase tracking-tight">Danger Zone</h2>
          </div>

          {deleteError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 font-bold text-sm">
              {deleteError}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-8 bg-white rounded-2xl sm:rounded-[32px] border-4 border-red-100 shadow-[8px_8px_0px_0px_rgba(239,68,68,0.05)]">
            <div className="max-w-md">
              <p className="text-lg font-black text-gray-900 leading-tight uppercase tracking-tight mb-1">Erase account realm</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-relaxed">
                Permanently delete your account, all missions, and every respondent response. This cannot be reversed by any magic.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-8 py-4 bg-red-50 text-red-600 border-4 border-red-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-700 transition-all active:translate-y-1 active:shadow-none shrink-0"
            >
              Self-Destruct
            </button>
          </div>
        </div>
      </motion.div>

      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleWarningConfirm}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
      />
    </div>
  );
}
