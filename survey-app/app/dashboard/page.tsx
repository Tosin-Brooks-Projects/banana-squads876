'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/ui/AnimatedButton';
import Card from '@/components/ui/Card';
import {
  SurveyCardSkeleton,
  StatCardSkeleton,
  PageHeaderSkeleton,
} from '@/components/ui/LoadingStates';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscribeToUserSurveys, getSurveyQuickStats, deleteSurvey } from '@/lib/firebase/firestore';
import { getAdventureEmoji, getAdventureLabel, formatDate, formatDuration } from '@/lib/utils/helpers';
import { Survey, SurveyQuickStats } from '@/lib/types';

interface SurveyWithStats extends Survey {
  stats: SurveyQuickStats;
}

function getCompletionRateBadge(rate: number) {
  if (rate >= 70) {
    return { bg: 'bg-green-100', text: 'text-green-700', label: 'High' };
  } else if (rate >= 40) {
    return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' };
  } else {
    return { bg: 'bg-red-100', text: 'text-red-700', label: 'Low' };
  }
}

function formatRelativeDate(date: Date | null): string {
  if (!date) return 'No responses';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

// Skeletons are now imported from LoadingStates

// Toast notification component
function Toast({ message, show, onClose, variant = 'success' }: {
  message: string;
  show: boolean;
  onClose: () => void;
  variant?: 'success' | 'error';
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const bgColor = variant === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50`}
        >
          {variant === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{message}</span>
          <button onClick={onClose} className="ml-2 hover:opacity-80">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Delete confirmation modal
function DeleteConfirmModal({
  isOpen,
  surveyTitle,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  surveyTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Delete Survey</h3>
              <p className="text-neutral-600 mb-2">
                Are you sure you want to delete this survey?
              </p>
              <p className="font-medium text-neutral-800 mb-3 break-words">
                &quot;{surveyTitle}&quot;
              </p>
              <p className="text-sm text-red-600 mb-6">
                This cannot be undone. All responses will be permanently lost.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  isLoading={isDeleting}
                  loadingText="Deleting..."
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                >
                  Delete Survey
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Loading error state with retry
function LoadingError({ onRetry }: { onRetry: () => void }) {
  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">My Challenges</h1>
          <p className="text-neutral-600 mt-1">Create and manage your survey adventures</p>
        </div>
      </div>

      {/* Error State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="text-7xl sm:text-8xl mb-6">📡</div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3">
              Couldn&apos;t Load Surveys
            </h2>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              We&apos;re having trouble connecting. Please check your internet connection and try again.
            </p>
            <Button onClick={onRetry}>
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const { firebaseUser } = useAuthContext();
  const [surveys, setSurveys] = useState<SurveyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<SurveyWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

  const showSuccessToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVariant('success');
    setShowToast(true);
  }, []);

  const showErrorToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVariant('error');
    setShowToast(true);
  }, []);

  const loadSurveys = useCallback(() => {
    if (!firebaseUser) return () => {};

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToUserSurveys(firebaseUser.uid, async (fetchedSurveys) => {
        // Fetch stats for all surveys
        const surveysWithStats = await Promise.all(
          fetchedSurveys.map(async (survey) => {
            try {
              const stats = await getSurveyQuickStats(survey.id);
              return { ...survey, stats };
            } catch {
              return {
                ...survey,
                stats: {
                  totalResponses: 0,
                  completedResponses: 0,
                  startedResponses: 0,
                  completionRate: 0,
                  averageCompletionTime: 0,
                  lastResponseDate: null,
                },
              };
            }
          })
        );

        setSurveys(surveysWithStats);
        setLoading(false);
        setError(null);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Error loading surveys:', err);
      setError('Failed to load surveys');
      setLoading(false);
      return () => {};
    }
  }, [firebaseUser]);

  useEffect(() => {
    const unsubscribe = loadSurveys();
    return unsubscribe;
  }, [loadSurveys]);

  // Handle delete survey
  const handleDeleteClick = useCallback((e: React.MouseEvent, survey: SurveyWithStats) => {
    e.preventDefault();
    e.stopPropagation();
    setSurveyToDelete(survey);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!surveyToDelete) return;

    const surveyTitle = surveyToDelete.title;
    const surveyId = surveyToDelete.id;

    setIsDeleting(true);
    try {
      await deleteSurvey(surveyId);
      setDeleteModalOpen(false);
      setSurveyToDelete(null);
      showSuccessToast(`"${surveyTitle}" has been deleted`);
    } catch (err) {
      console.error('Error deleting survey:', err);
      showErrorToast('Failed to delete survey. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [surveyToDelete, showSuccessToast, showErrorToast]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setSurveyToDelete(null);
  }, []);

  const totalResponses = surveys.reduce((acc, s) => acc + s.stats.totalResponses, 0);
  const activeSurveys = surveys.filter((s) => s.status === 'published').length;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Page Header Skeleton */}
        <PageHeaderSkeleton />

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <StatCardSkeleton />
            </motion.div>
          ))}
        </div>

        {/* Surveys List Skeleton */}
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <SurveyCardSkeleton />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return <LoadingError onRetry={loadSurveys} />;
  }

  if (surveys.length === 0) {
    return (
      <div>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">My Challenges</h1>
            <p className="text-neutral-600 mt-1">Create and manage your survey adventures</p>
          </div>
        </div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="flex justify-center gap-3 mb-6">
                {['🍨', '🍕', '🌻', '🏠', '☕'].map((emoji, i) => (
                  <motion.div
                    key={emoji}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-4xl sm:text-5xl"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3">
                You haven&apos;t created any challenges yet!
              </h2>
              <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                Transform boring surveys into fun, interactive adventures that people actually want to complete.
              </p>
              <Link
                href="/dashboard/create?new=true"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Challenge
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">My Challenges</h1>
          <p className="text-neutral-600 mt-1">Create and manage your survey adventures</p>
        </div>
        <Link
          href="/dashboard/create?new=true"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[
          { label: 'Total Challenges', value: surveys.length, icon: '📋', color: 'bg-brand-50' },
          { label: 'Total Responses', value: totalResponses, icon: '📊', color: 'bg-emerald-50' },
          { label: 'Active Challenges', value: activeSurveys, icon: '✅', color: 'bg-sky-50' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-neutral-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Surveys List */}
      <div className="space-y-4">
        {surveys.map((survey, index) => {
          const completionBadge = getCompletionRateBadge(survey.stats.completionRate);

          return (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/${survey.id}`}>
                <Card hover>
                  {/* Main content */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-50 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                        {getAdventureEmoji(survey.adventureType)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">
                          {survey.title}
                        </h3>
                        <p className="text-neutral-500 text-xs sm:text-sm truncate">
                          {getAdventureLabel(survey.adventureType)} • {formatDate(survey.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2">
                      <div className="text-center hidden sm:block">
                        <p className="text-xl sm:text-2xl font-bold text-neutral-900">{survey.stats.totalResponses}</p>
                        <p className="text-neutral-500 text-xs sm:text-sm">responses</p>
                      </div>
                      <div className="sm:hidden text-right">
                        <p className="text-sm font-semibold text-neutral-900">{survey.stats.totalResponses}</p>
                      </div>
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          survey.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : survey.status === 'closed'
                            ? 'bg-neutral-100 text-neutral-700'
                            : survey.paymentStatus === 'unpaid'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {survey.status === 'published'
                          ? 'Active'
                          : survey.status === 'closed'
                          ? 'Closed'
                          : survey.paymentStatus === 'unpaid'
                          ? <><span className="sm:hidden">Unpaid</span><span className="hidden sm:inline">Payment Required</span></>
                          : 'Draft'}
                      </span>
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteClick(e, survey)}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete survey"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Stats footer */}
                  {survey.stats.totalResponses > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {/* Completion Rate */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-neutral-600">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${completionBadge.bg} ${completionBadge.text}`}>
                              {survey.stats.completionRate}%
                            </span>
                            <span className="hidden sm:inline ml-1">completion</span>
                          </span>
                        </div>

                        {/* Average Time */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-neutral-600">
                            {survey.stats.averageCompletionTime > 0
                              ? formatDuration(survey.stats.averageCompletionTime)
                              : '--'
                            }
                            <span className="hidden sm:inline ml-1">avg</span>
                          </span>
                        </div>

                        {/* Completed / Started */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-neutral-600">
                            {survey.stats.completedResponses}/{survey.stats.totalResponses}
                            <span className="hidden sm:inline ml-1">completed</span>
                          </span>
                        </div>

                        {/* Last Response */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-neutral-600 truncate">
                            {formatRelativeDate(survey.stats.lastResponseDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        surveyTitle={surveyToDelete?.title || ''}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        show={showToast}
        onClose={() => setShowToast(false)}
        variant={toastVariant}
      />
    </div>
  );
}
