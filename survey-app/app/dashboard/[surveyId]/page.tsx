'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CSVLink } from 'react-csv';
import Button from '@/components/ui/AnimatedButton';
import { Card } from '@/components/ui/card';
import { Shimmer, TableSkeleton } from '@/components/ui/LoadingStates';
import { QuestionCardSkeleton, OverviewSkeleton } from '@/components/charts/ChartSkeleton';
import { useAuthContext } from '@/contexts/AuthContext';
import { getSurvey, getSurveyResponses, deleteSurvey, updateSurvey } from '@/lib/firebase/firestore';
import { formatDate, formatDateTime, formatDuration, getAdventureEmoji, getAdventureLabel, aggregateAllQuestions, getResponsesOverTime, calculateAverageCompletionTime, QuestionAggregation } from '@/lib/utils/helpers';
import { Survey, SurveyResponse, Answer, PricingTier, PRICING_TIERS } from '@/lib/types';
import ResponseCapBanner from '@/components/pricing/ResponseCapBanner';
import { BarChartComponent, LineChartComponent, RatingDisplay, CompletionRateChart, TextResponsesList, AIInsights } from '@/components/charts';
import html2canvas from 'html2canvas';

const ITEMS_PER_PAGE = 50;

// Tiers that can export CSV
const CSV_EXPORT_TIERS: PricingTier[] = ['starter', 'pro', 'business', 'enterprise'];

function formatResponsesForCSV(survey: Survey, responses: SurveyResponse[]) {
  const headers = [
    'Timestamp',
    'Name',
    'Email',
    ...survey.questions.map((q) => q.question),
  ];

  const rows = responses.map((response) => {
    const getAnswerValue = (questionId: string): string => {
      if (Array.isArray(response.answers)) {
        const answer = response.answers.find((a: Answer) => a.questionId === questionId);
        if (!answer) return '';
        if (Array.isArray(answer.value)) return answer.value.join(', ');
        return String(answer.value);
      } else {
        const value = (response.answers as Record<string, string>)[questionId];
        return value || '';
      }
    };

    return [
      formatDateTime(response.completedAt),
      response.respondentName || 'Anonymous',
      response.respondentEmail || '',
      ...survey.questions.map((q) => getAnswerValue(q.id)),
    ];
  });

  return [headers, ...rows];
}

function Toast({ message, show, onClose }: { message: string; show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
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

function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Shimmer className="w-14 h-5 bg-gray-200 rounded" />
              <Shimmer className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="space-y-2">
                <Shimmer className="w-48 h-6 bg-gray-200 rounded" />
                <Shimmer className="w-36 h-4 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shimmer className="w-24 h-10 bg-gray-200 rounded-lg" />
              <Shimmer className="w-28 h-10 bg-gray-200 rounded-lg" />
              <Shimmer className="w-16 h-10 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Metadata Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <Shimmer className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="space-y-2">
                    <Shimmer className="w-16 h-3 bg-gray-200 rounded" />
                    <Shimmer className="w-20 h-5 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Survey URL Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-2">
                <Shimmer className="w-20 h-3 bg-gray-200 rounded" />
                <Shimmer className="w-64 h-7 bg-gray-200 rounded" />
              </div>
              <Shimmer className="w-20 h-9 bg-gray-200 rounded-lg" />
            </div>
          </Card>
        </motion.div>

        {/* Analytics Overview Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <Card>
            <OverviewSkeleton />
          </Card>
        </motion.div>

        {/* Question Results Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <Card>
            <Shimmer className="w-40 h-6 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <QuestionCardSkeleton />
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Responses Table Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <TableSkeleton rows={5} columns={4} showHeader={true} />
        </motion.div>
      </main>
    </motion.div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function ExpandedResponseRow({ response, questions }: { response: SurveyResponse; questions: Survey['questions'] }) {
  const getAnswerValue = (questionId: string): string => {
    if (Array.isArray(response.answers)) {
      const answer = response.answers.find((a: Answer) => a.questionId === questionId);
      if (!answer) return '-';
      if (Array.isArray(answer.value)) return answer.value.join(', ');
      return String(answer.value);
    } else {
      const value = (response.answers as Record<string, string>)[questionId];
      return value || '-';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gray-50 border-t border-gray-100"
    >
      <div className="p-4 sm:p-6 space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">Response Details</h4>
        <div className="grid gap-3">
          {questions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{question.question}</p>
              <p className="text-sm font-medium text-gray-900">{getAnswerValue(question.id)}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser } = useAuthContext();
  const surveyId = params.surveyId as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingExpiration, setUpdatingExpiration] = useState(false);
  const [, setVerifyingPayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPaymentTier, setSelectedPaymentTier] = useState<PricingTier | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<SurveyResponse | null>(null);
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const [isSavingWinnerImage, setIsSavingWinnerImage] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const winnerCardRef = useRef<HTMLDivElement>(null);
  const expirationInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Define fetchData early so it can be used in payment verification
  const fetchData = useCallback(async () => {
    if (!surveyId) return;

    try {
      const [surveyData, responsesData] = await Promise.all([
        getSurvey(surveyId),
        getSurveyResponses(surveyId),
      ]);

      if (!surveyData) {
        setError('Survey not found');
        return;
      }

      setSurvey(surveyData);
      setResponses(responsesData);
    } catch (err) {
      console.error('Error fetching survey data:', err);
      setError('Failed to load survey data');
    }
  }, [surveyId]);

  // Check for payment success redirect and verify with Stripe
  const paymentVerifiedRef = useRef(false);
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId && !paymentVerifiedRef.current && firebaseUser) {
      paymentVerifiedRef.current = true;
      setVerifyingPayment(true);

      // Verify the payment with Stripe and update survey
      (async () => {
        try {
          const authToken = await firebaseUser.getIdToken();
          const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });
          const data = await res.json();

          if (data.status === 'paid' && data.surveyId === surveyId) {
            // Payment verified - the webhook handles updating the survey with
            // all payment details (pricingTier, responseLimit, paymentId, etc.)
            // We just refresh the data to show the updated state.
            setToastMessage('Payment successful! Your survey is now live.');
            setShowToast(true);
            // Remove query params from URL
            router.replace(`/dashboard/${surveyId}`);
            // Refresh data to get webhook updates
            fetchData();
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          paymentVerifiedRef.current = false;
        } finally {
          setVerifyingPayment(false);
        }
      })();
    } else if (paymentStatus === 'cancelled') {
      setToastMessage('Payment was cancelled. Your survey is saved as a draft.');
      setShowToast(true);
      router.replace(`/dashboard/${surveyId}`);
    }
  }, [searchParams, surveyId, firebaseUser, router, fetchData]);

  const handleStatusToggle = async () => {
    if (!survey || updatingStatus) return;

    const previousStatus = survey.status;
    const newStatus = previousStatus === 'published' ? 'closed' : 'published';

    setUpdatingStatus(true);
    setSurvey({ ...survey, status: newStatus });

    try {
      await updateSurvey(surveyId, { status: newStatus });
      setToastMessage(newStatus === 'closed' ? 'Survey deactivated' : 'Survey activated');
      setShowToast(true);
    } catch (err) {
      console.error('Error updating survey status:', err);
      setSurvey({ ...survey, status: previousStatus });
      setToastMessage('Failed to update survey status');
      setShowToast(true);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExpirationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!survey || updatingExpiration) return;

    const value = e.target.value;
    const previousSettings = survey.settings;

    // Validate the date
    let newExpiresAt: Date | undefined;
    if (value) {
      const parsedDate = new Date(value);
      if (isNaN(parsedDate.getTime())) {
        setToastMessage('Invalid date format');
        setShowToast(true);
        return;
      }
      newExpiresAt = parsedDate;
    }

    const updatedSettings = {
      ...survey.settings,
      expiresAt: newExpiresAt,
    };

    setUpdatingExpiration(true);
    setSurvey({ ...survey, settings: updatedSettings });

    try {
      await updateSurvey(surveyId, { settings: updatedSettings });
      setToastMessage(value ? 'Expiration date set' : 'Expiration date removed');
      setShowToast(true);
    } catch (err) {
      console.error('Error updating expiration:', err);
      setSurvey({ ...survey, settings: previousSettings });
      setToastMessage('Failed to update expiration date');
      setShowToast(true);
    } finally {
      setUpdatingExpiration(false);
    }
  };

  const handleClearExpiration = async () => {
    if (!survey || updatingExpiration) return;

    const previousSettings = survey.settings;
    // Create new settings without expiresAt (use destructuring to exclude it)
    const { expiresAt: _expiresAt, ...settingsWithoutExpiration } = survey.settings || {};
    void _expiresAt;
    const updatedSettings = settingsWithoutExpiration;

    setUpdatingExpiration(true);
    setSurvey({ ...survey, settings: updatedSettings });

    try {
      // Pass null to Firestore to delete the field (undefined doesn't work)
      // Type assertion needed since Firestore accepts null to delete fields
      await updateSurvey(surveyId, {
        settings: { ...updatedSettings, expiresAt: null as unknown as undefined }
      });
      setToastMessage('Expiration date removed');
      setShowToast(true);
    } catch (err) {
      console.error('Error clearing expiration:', err);
      setSurvey({ ...survey, settings: previousSettings });
      setToastMessage('Failed to clear expiration date');
      setShowToast(true);
    } finally {
      setUpdatingExpiration(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [surveyId, fetchData]);

  // Start editing title
  const handleEditTitle = () => {
    if (survey) {
      setEditedTitle(survey.title);
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  // Save edited title
  const handleSaveTitle = async () => {
    if (!survey || savingTitle) return;
    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle || trimmedTitle === survey.title) {
      setIsEditingTitle(false);
      return;
    }

    setSavingTitle(true);
    const previousSurvey = { ...survey };
    setSurvey({ ...survey, title: trimmedTitle });

    try {
      await updateSurvey(surveyId, { title: trimmedTitle });
      setToastMessage('Title updated');
      setShowToast(true);
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Error updating title:', err);
      setSurvey(previousSurvey);
      setToastMessage('Failed to update title');
      setShowToast(true);
    } finally {
      setSavingTitle(false);
    }
  };

  // Cancel editing title
  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  // Start editing description
  const handleEditDescription = () => {
    if (survey) {
      setEditedDescription(survey.description || '');
      setIsEditingDescription(true);
    }
  };

  // Save edited description
  const handleSaveDescription = async () => {
    if (!survey || savingDescription) return;
    const trimmedDescription = editedDescription.trim();
    if (trimmedDescription === (survey.description || '')) {
      setIsEditingDescription(false);
      return;
    }

    setSavingDescription(true);
    const previousSurvey = { ...survey };
    setSurvey({ ...survey, description: trimmedDescription || undefined });

    try {
      await updateSurvey(surveyId, { description: trimmedDescription || '' });
      setToastMessage('Description updated');
      setShowToast(true);
      setIsEditingDescription(false);
    } catch (err) {
      console.error('Error updating description:', err);
      setSurvey(previousSurvey);
      setToastMessage('Failed to update description');
      setShowToast(true);
    } finally {
      setSavingDescription(false);
    }
  };

  // Cancel editing description
  const handleCancelDescriptionEdit = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    setToastMessage('Data refreshed!');
    setShowToast(true);
  };

  const handleCompletePayment = async (tierOverride?: PricingTier) => {
    if (!survey || !firebaseUser || processingPayment) return;

    const tierToUse = tierOverride || selectedPaymentTier || survey.pricingTier;
    if (!tierToUse || tierToUse === 'free') return;

    setProcessingPayment(true);
    try {
      const authToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tier: tierToUse,
          surveyId: survey.id,
          surveyTitle: survey.title,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setToastMessage('Failed to start payment. Please try again.');
      setShowToast(true);
      setProcessingPayment(false);
    }
  };

  const surveyUrl = useMemo(() => {
    if (!survey || !user) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/${user.username}/${survey.slug}`;
  }, [survey, user]);

  const sortedResponses = useMemo(() => {
    return [...responses].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }, [responses]);

  const paginatedResponses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedResponses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedResponses, currentPage]);

  const totalPages = Math.ceil(sortedResponses.length / ITEMS_PER_PAGE);

  const csvData = useMemo(() => {
    if (!survey) return [];
    return formatResponsesForCSV(survey, sortedResponses);
  }, [survey, sortedResponses]);

  const csvFilename = useMemo(() => {
    if (!survey) return 'responses.csv';
    const date = new Date().toISOString().split('T')[0];
    const slug = survey.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug}-responses-${date}.csv`;
  }, [survey]);

  const questionAggregations = useMemo(() => {
    if (!survey) return [];
    return aggregateAllQuestions(survey.questions, responses);
  }, [survey, responses]);

  const responsesOverTime = useMemo(() => {
    return getResponsesOverTime(responses, 'day');
  }, [responses]);

  const averageCompletionTime = useMemo(() => {
    return calculateAverageCompletionTime(responses);
  }, [responses]);

  const handlePickWinner = () => {
    if (responses.length === 0) return;

    setShowWinnerModal(true);
    setIsPickingWinner(true);
    setSelectedWinner(null);

    // Animate through random responses before landing on the winner
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * responses.length);
      setSelectedWinner(responses[randomIndex]);
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        // Final random selection
        const winnerIndex = Math.floor(Math.random() * responses.length);
        setSelectedWinner(responses[winnerIndex]);
        setIsPickingWinner(false);
      }
    }, 100);
  };

  const handleDownloadWinnerImage = async () => {
    if (!winnerCardRef.current || !selectedWinner) return;

    setIsSavingWinnerImage(true);
    try {
      const canvas = await html2canvas(winnerCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `winner-${survey?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'survey'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setToastMessage('Winner image downloaded!');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to download image:', err);
      setToastMessage('Failed to download image. Please try again.');
      setShowToast(true);
    } finally {
      setIsSavingWinnerImage(false);
    }
  };

  const handleCopyWinnerText = async () => {
    if (!selectedWinner || !survey) return;

    const winnerName = selectedWinner.respondentName || 'Anonymous';
    const text = `🏆 Winner Announcement!\n\nCongratulations to ${winnerName} for winning our "${survey.title}" survey giveaway!\n\n#Winner #Giveaway`;

    try {
      await navigator.clipboard.writeText(text);
      setToastMessage('Winner text copied to clipboard!');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
      setToastMessage('Failed to copy. Please try again.');
      setShowToast(true);
    }
  };

  const toggleRowExpansion = (responseId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(responseId)) {
        newSet.delete(responseId);
      } else {
        newSet.add(responseId);
      }
      return newSet;
    });
  };

  const handleDelete = async () => {
    if (!surveyId) return;

    try {
      setDeleting(true);
      await deleteSurvey(surveyId);
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting survey:', err);
      setError('Failed to delete survey');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <div className="text-center py-8 px-4">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {error || 'Survey not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The survey you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back
              </Link>
              <div className="text-3xl sm:text-4xl">{getAdventureEmoji(survey.adventureType)}</div>
              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelTitleEdit();
                      }}
                      className="text-lg sm:text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-full max-w-xs"
                      disabled={savingTitle}
                    />
                    <button
                      onClick={handleSaveTitle}
                      disabled={savingTitle}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelTitleEdit}
                      disabled={savingTitle}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Cancel"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{survey.title}</h1>
                    <button
                      onClick={handleEditTitle}
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit title"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-gray-500 text-xs sm:text-sm">
                  {getAdventureLabel(survey.adventureType)} • {responses.length} responses
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                loadingText="Refreshing..."
                className="relative"
              >
                <span className="inline-flex items-center">
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </span>
              </Button>
              {responses.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handlePickWinner}>
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <span className="hidden sm:inline">Pick Winner</span>
                      <span className="sm:hidden">Winner</span>
                    </span>
                  </Button>
                  {CSV_EXPORT_TIERS.includes(survey.pricingTier || 'free') ? (
                    <CSVLink
                      data={csvData}
                      filename={csvFilename}
                      onClick={() => {
                        setToastMessage('CSV exported successfully!');
                        setShowToast(true);
                      }}
                      className="inline-flex"
                    >
                      <Button variant="outline" size="sm">
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="hidden sm:inline">Download CSV</span>
                          <span className="sm:hidden">CSV</span>
                        </span>
                      </Button>
                    </CSVLink>
                  ) : (
                    <div className="relative group">
                      <Button variant="outline" size="sm" disabled className="opacity-60">
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="hidden sm:inline">CSV</span>
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                      </Button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        CSV export requires a paid plan
                      </div>
                    </div>
                  )}
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)}>
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Payment Required Banner for Unpaid Drafts */}
        {survey.paymentStatus === 'unpaid' && survey.pricingTier && survey.pricingTier !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Payment Required</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Complete your payment to publish this survey and start collecting responses.
                  </p>
                </div>
              </div>

              {/* Tier Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.values(PRICING_TIERS) as Array<{ id: PricingTier; name: string; price: number; responseLimit: number }>)
                  .filter(tier => tier.id !== 'free')
                  .map((tier) => {
                    const isSelected = (selectedPaymentTier || survey.pricingTier) === tier.id;
                    return (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedPaymentTier(tier.id)}
                        disabled={processingPayment}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${isSelected
                            ? 'border-amber-500 bg-white shadow-sm'
                            : 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
                          } ${processingPayment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="font-semibold text-amber-900">${tier.price}</div>
                        <div className="text-xs text-amber-700">{tier.name}</div>
                        <div className="text-xs text-amber-600 mt-1">
                          {tier.responseLimit.toLocaleString()} responses
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                <p className="text-sm text-amber-700">
                  Selected: <span className="font-medium">{PRICING_TIERS[selectedPaymentTier || survey.pricingTier].name}</span>
                  {' '}&bull;{' '}
                  Up to {PRICING_TIERS[selectedPaymentTier || survey.pricingTier].responseLimit.toLocaleString()} responses
                </p>
                <Button
                  onClick={() => handleCompletePayment()}
                  isLoading={processingPayment}
                  loadingText="Redirecting..."
                  className="flex-shrink-0"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pay ${PRICING_TIERS[selectedPaymentTier || survey.pricingTier].price}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Response Cap Warning Banner */}
        {survey.responseLimit && survey.pricingTier && user && firebaseUser && survey.paymentStatus !== 'unpaid' && (
          <ResponseCapBanner
            currentResponses={responses.length}
            responseLimit={survey.responseLimit}
            currentTier={survey.pricingTier as PricingTier}
            surveyId={surveyId}
            surveyTitle={survey.title}
            getAuthToken={() => firebaseUser.getIdToken()}
          />
        )}

        {/* Survey Metadata Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl">
                  📋
                </div>
                <div className="min-w-0">
                  <p className="text-gray-500 text-xs">Title</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{survey.title}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-xl">
                  📊
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Responses</p>
                  <p className="text-sm font-semibold text-gray-900">{responses.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-xl">
                  📅
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Created</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(survey.createdAt)}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${survey.status === 'published' ? 'bg-green-50' : survey.status === 'closed' ? 'bg-gray-50' : 'bg-yellow-50'
                  }`}>
                  {survey.status === 'published' ? '🟢' : survey.status === 'closed' ? '🔴' : '🟡'}
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Status</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{survey.status}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Survey URL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs mb-1">Survey URL</p>
                <div className="flex items-center">
                  <code className="text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded truncate block">
                    {surveyUrl}
                  </code>
                  <CopyButton text={surveyUrl} />
                </div>
              </div>
              <Link href={surveyUrl} target="_blank">
                <Button variant="outline" size="sm">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </span>
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="mb-6 sm:mb-8"
        >
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-gray-500 text-xs mb-1">Description</p>
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Add a description for your survey..."
                      rows={3}
                      className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                      disabled={savingDescription}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveDescription}
                        disabled={savingDescription}
                        isLoading={savingDescription}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelDescriptionEdit}
                        disabled={savingDescription}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group flex items-start gap-2">
                    {survey.description ? (
                      <p className="text-sm text-gray-700">{survey.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No description</p>
                    )}
                    <button
                      onClick={handleEditDescription}
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Edit description"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Link Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-6 sm:mb-8"
        >
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Link Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Active/Inactive Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Survey Active</p>
                  <p className="text-xs text-gray-500">When inactive, link won&apos;t work</p>
                </div>
                <button
                  onClick={handleStatusToggle}
                  disabled={updatingStatus || survey.status === 'draft'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${survey.status === 'published'
                      ? 'bg-indigo-600'
                      : 'bg-gray-200'
                    } ${updatingStatus || survey.status === 'draft' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={survey.status === 'draft' ? 'Publish the survey first to enable this control' : ''}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${survey.status === 'published' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Expiration Date */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">Expiration Date</p>
                  <p className="text-xs text-gray-500 truncate">
                    {survey.settings?.expiresAt
                      ? (new Date(survey.settings.expiresAt) < new Date()
                        ? `Expired ${formatDateTime(new Date(survey.settings.expiresAt))}`
                        : `Expires ${formatDateTime(new Date(survey.settings.expiresAt))}`)
                      : 'No expiration set'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={expirationInputRef}
                    type="datetime-local"
                    value={survey.settings?.expiresAt
                      ? (() => {
                        const d = new Date(survey.settings.expiresAt);
                        const offset = d.getTimezoneOffset();
                        const local = new Date(d.getTime() - offset * 60000);
                        return local.toISOString().slice(0, 16);
                      })()
                      : ''
                    }
                    onChange={handleExpirationChange}
                    disabled={updatingExpiration}
                    min={new Date().toISOString().slice(0, 16)}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => expirationInputRef.current?.showPicker()}
                    disabled={updatingExpiration}
                    className={`w-9 h-9 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${updatingExpiration ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Set expiration date"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {survey.settings?.expiresAt && (
                    <button
                      type="button"
                      onClick={handleClearExpiration}
                      disabled={updatingExpiration}
                      className={`w-9 h-9 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer ${updatingExpiration ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Clear expiration date"
                    >
                      <svg className="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Analytics Section */}
        {responses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 sm:mb-8 space-y-6"
          >
            {/* Overall Metrics */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Completion Rate */}
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <CompletionRateChart
                    completedCount={responses.length}
                    totalCount={responses.length}
                    size={120}
                  />
                  <p className="text-sm text-gray-600 mt-2">Completion Rate</p>
                </div>

                {/* Total Responses */}
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-4xl font-bold text-indigo-600">{responses.length}</div>
                  <p className="text-sm text-gray-600 mt-2">Total Responses</p>
                </div>

                {/* Average Completion Time */}
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-4xl font-bold text-purple-600">
                    {formatDuration(averageCompletionTime)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Avg. Completion Time</p>
                </div>

                {/* Questions Answered */}
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-4xl font-bold text-teal-600">{survey?.questions.length || 0}</div>
                  <p className="text-sm text-gray-600 mt-2">Questions</p>
                </div>
              </div>

              {/* Responses Over Time */}
              {responsesOverTime.length > 1 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Responses Over Time</h3>
                  <LineChartComponent
                    data={responsesOverTime.map(({ name, value }) => ({ name, value }))}
                    height={200}
                  />
                </div>
              )}
            </Card>

            {/* Question Analytics */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Question Results</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {questionAggregations.map((aggregation: QuestionAggregation, index: number) => (
                  <motion.div
                    key={aggregation.questionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-2 capitalize"
                          style={{
                            backgroundColor: aggregation.type === 'rating' ? '#fef3c7' : aggregation.type === 'text' ? '#e0e7ff' : '#d1fae5',
                            color: aggregation.type === 'rating' ? '#92400e' : aggregation.type === 'text' ? '#3730a3' : '#065f46',
                          }}
                        >
                          {aggregation.type === 'multiple_choice' ? 'Multiple Choice' : aggregation.type === 'rating' ? 'Rating' : 'Text'}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {aggregation.questionText}
                        </h3>
                      </div>
                    </div>

                    {/* Rating Question Display */}
                    {aggregation.type === 'rating' && aggregation.average !== undefined && (
                      <RatingDisplay
                        average={aggregation.average}
                        data={aggregation.data}
                        totalResponses={aggregation.totalResponses}
                        maxRating={aggregation.maxRating || 5}
                      />
                    )}

                    {/* Multiple Choice Question Display */}
                    {aggregation.type === 'multiple_choice' && (
                      <BarChartComponent
                        data={aggregation.data}
                        height={Math.max(180, aggregation.data.length * 45)}
                        layout="horizontal"
                        showPercentages={true}
                        showCounts={true}
                      />
                    )}

                    {/* Text Question Display */}
                    {aggregation.type === 'text' && aggregation.textResponses && (
                      <TextResponsesList
                        responses={aggregation.textResponses}
                        maxVisible={3}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* AI Insights Section */}
        {firebaseUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: responses.length > 0 ? 0.55 : 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <AIInsights
              surveyId={surveyId}
              responseCount={responses.length}
              pricingTier={survey.pricingTier || 'free'}
              getAuthToken={() => firebaseUser.getIdToken()}
            />
          </motion.div>
        )}

        {/* Responses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: responses.length > 0 ? 0.6 : 0.5 }}
        >
          <Card >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Responses</h2>
              <p className="text-gray-500 text-sm mt-1">
                {responses.length === 0
                  ? 'No responses yet'
                  : `Showing ${paginatedResponses.length} of ${responses.length} responses`}
              </p>
            </div>

            {responses.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-indigo-50 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No responses yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Share your survey link with your audience to start collecting valuable feedback.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(surveyUrl);
                      setToastMessage('Survey link copied!');
                      setShowToast(true);
                    }}
                  >
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Survey Link
                    </span>
                  </Button>
                  <Link href={surveyUrl} target="_blank">
                    <Button variant="outline">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Preview Survey
                      </span>
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Your survey URL</p>
                  <code className="text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block max-w-full truncate">
                    {surveyUrl}
                  </code>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-600 text-sm">Respondent</th>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-600 text-sm">Email</th>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-600 text-sm">Completed At</th>
                        <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedResponses.map((response, index) => (
                        <motion.tr
                          key={response.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-indigo-50/50 transition-colors cursor-pointer`}
                          onClick={() => toggleRowExpansion(response.id)}
                        >
                          <td className="py-3 px-4 sm:px-6 text-gray-900 text-sm">
                            {response.respondentName || 'Anonymous'}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-gray-600 text-sm">
                            {response.respondentEmail || '-'}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-gray-600 text-sm">
                            {formatDateTime(response.completedAt)}
                          </td>
                          <td className="py-3 px-4 sm:px-6">
                            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                              {expandedRows.has(response.id) ? 'Hide' : 'View'} Details
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List */}
                <div className="md:hidden divide-y divide-gray-100">
                  {paginatedResponses.map((response, index) => (
                    <div key={response.id}>
                      <button
                        onClick={() => toggleRowExpansion(response.id)}
                        className={`w-full text-left p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-indigo-50/50 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {response.respondentName || 'Anonymous'}
                            </p>
                            <p className="text-gray-500 text-xs truncate">
                              {response.respondentEmail || 'No email'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {formatDateTime(response.completedAt)}
                            </p>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedRows.has(response.id) ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedRows.has(response.id) && (
                          <ExpandedResponseRow response={response} questions={survey.questions} />
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Desktop Expanded Rows */}
                <div className="hidden md:block">
                  <AnimatePresence>
                    {paginatedResponses.map((response) =>
                      expandedRows.has(response.id) ? (
                        <ExpandedResponseRow key={`expanded-${response.id}`} response={response} questions={survey.questions} />
                      ) : null
                    )}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded text-sm font-medium ${currentPage === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </motion.div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Delete Survey</h3>
                <p className="text-gray-600 mb-2">
                  Are you sure you want to delete this survey?
                </p>
                <p className="font-medium text-gray-800 mb-3 break-words">
                  &quot;{survey.title}&quot;
                </p>
                <p className="text-sm text-red-600 mb-6">
                  This cannot be undone. All responses will be permanently lost.
                </p>
                <div className="flex items-center gap-3 justify-center">
                  <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    isLoading={deleting}
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

      {/* Random Winner Picker Modal */}
      <AnimatePresence>
        {showWinnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => !isPickingWinner && setShowWinnerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {isPickingWinner ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <span className="text-3xl">🎰</span>
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Picking a Winner...</h3>
                    <motion.div
                      key={selectedWinner?.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <p className="text-gray-700 font-medium">
                        {selectedWinner?.respondentName || selectedWinner?.respondentEmail || 'Anonymous'}
                      </p>
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Shareable Winner Card */}
                    <div
                      ref={winnerCardRef}
                      className="p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 rounded-xl mb-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                        className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                      >
                        <span className="text-4xl">🏆</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h3 className="text-xl font-bold text-gray-900 mb-1">We Have a Winner!</h3>
                        <p className="text-sm text-gray-500 mb-3">from &quot;{survey?.title}&quot;</p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="p-4 bg-white border-2 border-yellow-300 rounded-xl shadow-sm"
                      >
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedWinner?.respondentName || 'Anonymous'}
                        </p>
                        {selectedWinner?.respondentEmail && (
                          <p className="text-sm text-gray-600 mt-1">{selectedWinner.respondentEmail}</p>
                        )}
                      </motion.div>
                      <p className="text-xs text-gray-400 mt-3">
                        Selected on {new Date().toLocaleDateString()}
                      </p>
                    </div>

                    {/* Share Buttons */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center justify-center gap-2 mb-4"
                    >
                      <button
                        onClick={handleDownloadWinnerImage}
                        disabled={isSavingWinnerImage}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSavingWinnerImage ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        Save Image
                      </button>
                      <button
                        onClick={handleCopyWinnerText}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Text
                      </button>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 justify-center">
                      <Button variant="outline" onClick={() => setShowWinnerModal(false)}>
                        Close
                      </Button>
                      <Button onClick={handlePickWinner}>
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Pick Again
                        </span>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <Toast
        message={toastMessage}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
