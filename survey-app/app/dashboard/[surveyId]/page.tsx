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
import { formatDate, formatDateTime, formatDuration, getAdventureEmoji, getAdventureImage, getAdventureLabel, aggregateAllQuestions, getResponsesOverTime, calculateAverageCompletionTime, QuestionAggregation } from '@/lib/utils/helpers';
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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-orange-200 blur-3xl opacity-30 rounded-full" />
        <img 
          src="/orange-kea-mascot.png" 
          alt="Loading..." 
          className="w-32 h-32 relative z-10 drop-shadow-2xl"
        />
      </motion.div>
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Gathering your results...</h2>
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2.5 h-2.5 bg-orange-500 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
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
      className="bg-gray-50 border-t-2 border-gray-100"
    >
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-black text-orange-600 border-2 border-orange-200">
            📊
          </span>
          <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest">Full Response Data</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((question, i) => (
            <div key={question.id} className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm group hover:border-orange-200 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-2 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-gray-50 flex items-center justify-center text-[8px] border border-gray-100">{i + 1}</span>
                {question.question}
              </p>
              <p className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{getAnswerValue(question.id)}</p>
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
    <div className="w-full bg-gray-50/50">
      {/* Survey nav bar */}
      <div className="bg-white border-b-4 border-gray-100 rounded-2xl mb-4">
        <div className="w-full py-3 sm:py-5">

          {/* Mobile layout */}
          <div className="sm:hidden">
            {/* Nav row: back + status badge + delete */}
            <div className="flex items-center justify-between mb-4">
              <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-500 font-bold text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Link>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                survey.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' :
                survey.status === 'closed' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-yellow-100 text-yellow-700 border-yellow-200'
              }`}>
                {survey.status}
              </span>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 border-2 border-red-100 text-red-400 active:bg-red-500 active:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Centered survey identity */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-20 h-20 rounded-3xl bg-orange-50 border-4 border-orange-100 flex items-center justify-center mb-3 shadow-[0_4px_0_rgba(249,115,22,0.15)]">
                <img
                  src={getAdventureImage(survey.adventureType)}
                  alt={survey.adventureType}
                  className="w-14 h-14 object-contain drop-shadow-md"
                />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider border border-orange-200 mb-2">
                {getAdventureLabel(survey.adventureType)}
              </span>
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5 w-full max-w-xs">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelTitleEdit();
                    }}
                    className="text-base font-black text-gray-900 bg-white border-2 border-orange-500 rounded-xl px-3 py-1.5 focus:outline-none flex-1 text-center"
                    disabled={savingTitle}
                  />
                  <button onClick={handleSaveTitle} disabled={savingTitle} className="p-1.5 text-green-600 bg-green-50 rounded-lg border border-green-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button onClick={handleCancelTitleEdit} disabled={savingTitle} className="p-1.5 text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button onClick={handleEditTitle} className="group flex items-center gap-1.5 mb-1">
                  <h1 className="text-xl font-black text-gray-900 leading-tight group-active:text-orange-600 transition-colors">
                    {survey.title || 'Untitled Survey'}
                  </h1>
                  <svg className="w-3.5 h-3.5 text-gray-300 group-active:text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              <p className="text-gray-500 text-sm font-medium">
                <span className="text-gray-900 font-black">{responses.length}</span> responses collected
              </p>
            </div>

            {/* Action buttons — centered row */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                className="flex-shrink-0 bg-white border-2 border-gray-200 text-xs h-9 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              {responses.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePickWinner}
                    className="flex-shrink-0 bg-white border-2 border-orange-200 text-orange-600 text-xs h-9 px-3"
                  >
                    🏆 Winner
                  </Button>
                  {CSV_EXPORT_TIERS.includes(survey.pricingTier || 'free') ? (
                    <CSVLink data={csvData} filename={csvFilename} className="inline-flex flex-shrink-0">
                      <Button variant="outline" className="bg-white border-2 border-indigo-200 text-indigo-600 text-xs h-9 px-3">
                        ↓ CSV
                      </Button>
                    </CSVLink>
                  ) : (
                    <Button variant="outline" disabled className="flex-shrink-0 opacity-40 border-2 border-gray-200 text-xs h-9 px-3">
                      🔒 CSV
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Desktop layout (sm+) */}
          <div className="hidden sm:flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-5">
              <Link
                href="/dashboard"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
              >
                ←
              </Link>
              <div className="relative group">
                <div className="absolute inset-0 bg-orange-100 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={getAdventureImage(survey.adventureType)}
                  alt={survey.adventureType}
                  className="w-20 h-20 object-contain relative z-10 drop-shadow-md"
                />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider border border-orange-200">
                    {getAdventureLabel(survey.adventureType)}
                  </span>
                </div>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelTitleEdit();
                      }}
                      className="text-2xl font-black text-gray-900 bg-white border-4 border-orange-500 rounded-xl px-3 py-1 focus:outline-none w-full shadow-[4px_4px_0px_0px_rgba(249,115,22,0.2)]"
                      disabled={savingTitle}
                    />
                    <div className="flex gap-1">
                      <button onClick={handleSaveTitle} disabled={savingTitle} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors border-2 border-transparent hover:border-green-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button onClick={handleCancelTitleEdit} disabled={savingTitle} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors border-2 border-transparent hover:border-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group flex items-center gap-3">
                    <h1 className="text-3xl font-black text-gray-900 truncate tracking-tight">{survey.title}</h1>
                    <button onClick={handleEditTitle} className="p-1.5 text-gray-300 hover:text-orange-500 transition-colors" title="Edit title">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3, responses.length))].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px]">👤</div>
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    <span className="text-gray-900 font-bold">{responses.length}</span> responses collected
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button variant="outline" onClick={handleRefresh} isLoading={isRefreshing} className="bg-white border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[-2px] active:translate-y-[0px] transition-all">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              {responses.length > 0 && (
                <>
                  <Button variant="outline" onClick={handlePickWinner} className="bg-white border-2 border-orange-200 text-orange-600 shadow-[2px_2px_0px_0px_rgba(249,115,22,0.1)] hover:border-orange-500 hover:translate-y-[-2px] active:translate-y-[0px] transition-all">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    Pick Winner
                  </Button>
                  {CSV_EXPORT_TIERS.includes(survey.pricingTier || 'free') ? (
                    <CSVLink data={csvData} filename={csvFilename} className="inline-flex">
                      <Button variant="outline" className="bg-white border-2 border-indigo-200 text-indigo-600 shadow-[2px_2px_0px_0px_rgba(79,70,229,0.1)] hover:border-indigo-500 hover:translate-y-[-2px] active:translate-y-[0px] transition-all">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                      </Button>
                    </CSVLink>
                  ) : (
                    <div className="relative group">
                      <Button variant="outline" disabled className="opacity-50 border-2 border-gray-200">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Export CSV
                      </Button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        UPGRADE TO UNLOCK
                      </div>
                    </div>
                  )}
                </>
              )}
              <button onClick={() => setShowDeleteModal(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 border-2 border-red-100 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all hover:translate-y-[-2px]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      <main className="w-full">
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

        {/* Survey Overview Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Survey Title & Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-2 md:col-span-2 lg:col-span-2 p-4 sm:p-6 rounded-3xl bg-white border-4 border-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.03)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-4 min-w-0">
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border-2 ${
                  survey.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' :
                  survey.status === 'closed' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}>
                  {survey.status}
                </span>
                <span className="text-gray-400 text-[10px] font-bold truncate min-w-0">ID: {survey.id.slice(0, 8)}…</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{survey.title}</h3>
              {survey.description ? (
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{survey.description}</p>
              ) : (
                <p className="text-gray-400 text-sm italic mb-4">No description provided yet.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleEditDescription}
                className="px-4 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold border-2 border-gray-100 hover:bg-white hover:border-orange-500 hover:text-orange-600 transition-all"
              >
                Edit Description
              </button>
            </div>
          </motion.div>

          {/* Response Count Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 sm:p-6 rounded-3xl bg-indigo-600 border-4 border-indigo-700 shadow-[8px_8px_0px_0px_rgba(79,70,229,0.2)] text-white relative overflow-hidden group"
          >
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-indigo-100 text-[9px] sm:text-xs font-black uppercase tracking-widest mb-1">Responses</p>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-3xl sm:text-5xl font-black">{responses.length}</span>
                <span className="text-indigo-200 text-xs sm:text-sm font-bold mb-1">Total</span>
              </div>
              <div className="mt-2 sm:mt-4 h-1.5 w-full bg-indigo-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: survey.responseLimit ? `${(responses.length / survey.responseLimit) * 100}%` : '100%' }}
                  className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                />
              </div>
              {survey.responseLimit && (
                <p className="text-[9px] text-indigo-200 mt-1 font-bold uppercase">
                  {survey.responseLimit - responses.length} left
                </p>
              )}
            </div>
          </motion.div>

          {/* Creation Date Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 sm:p-6 rounded-3xl bg-white border-4 border-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.03)] flex flex-col justify-between"
          >
            <div>
              <p className="text-gray-400 text-[9px] sm:text-xs font-black uppercase tracking-widest mb-2 sm:mb-4">Launch Date</p>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center text-lg sm:text-2xl">
                  📅
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 font-black leading-tight text-sm sm:text-base truncate">{formatDate(survey.createdAt)}</p>
                  <p className="text-gray-500 text-[9px] font-bold uppercase">Mission Start</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Survey Link Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-2 md:col-span-3 lg:col-span-4 p-4 sm:p-6 rounded-3xl bg-[#FFFBF0] border-4 border-[#FFE0A3] shadow-[8px_8px_0px_0px_rgba(255,184,0,0.1)]"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 flex-shrink-0 rounded-2xl bg-white border-2 border-[#FFE0A3] shadow-sm flex items-center justify-center text-xl">
                  🔗
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#855D00] text-[10px] font-black uppercase tracking-wide mb-1">Public Survey Link</p>
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-sm font-bold text-[#D97706] truncate block bg-white/50 px-2 py-1 rounded-xl border-2 border-[#FFE0A3]/50 flex-1 min-w-0">
                      {surveyUrl}
                    </code>
                    <CopyButton text={surveyUrl} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Link href={surveyUrl} target="_blank" className="flex-1">
                  <Button className="w-full bg-[#D97706] hover:bg-[#B45309] text-white border-b-4 border-[#92400E] active:border-b-0 active:translate-y-[4px] transition-all">
                    Open Survey
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: survey.title, url: surveyUrl });
                    } else {
                      navigator.clipboard.writeText(surveyUrl);
                      setToastMessage('Link copied!');
                      setShowToast(true);
                    }
                  }}
                  className="flex-1 bg-white border-2 border-[#FFE0A3] text-[#D97706] hover:bg-[#FFF8E6]"
                >
                  Share
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Link Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8"
        >
          <div className="bg-white rounded-[32px] border-4 border-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.03)] p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center text-xl">
                ⚙️
              </div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Link Controls</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active/Inactive Toggle */}
              <div className="p-4 sm:p-6 bg-gray-50/50 rounded-2xl border-2 border-gray-100 flex items-center gap-3 justify-between transition-all hover:bg-white hover:border-orange-200 group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-xl transition-all ${
                    survey.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {survey.status === 'published' ? '🚀' : '🛑'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-wide truncate">Survey Status</p>
                    <p className="text-[11px] font-bold text-gray-400 truncate">
                      {survey.status === 'published' ? 'Live!' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStatusToggle}
                  disabled={updatingStatus || survey.status === 'draft'}
                  className={`flex-shrink-0 relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none border-2 ${
                    survey.status === 'published'
                      ? 'bg-orange-500 border-orange-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                      : 'bg-gray-200 border-gray-300'
                  } ${updatingStatus || survey.status === 'draft' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:translate-y-0.5 active:shadow-none'}`}
                  title={survey.status === 'draft' ? 'Publish the survey first to enable this control' : ''}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all ${
                    survey.status === 'published' ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Expiration Date */}
              <div className="p-4 sm:p-6 bg-gray-50/50 rounded-2xl border-2 border-gray-100 flex items-center gap-3 justify-between transition-all hover:bg-white hover:border-orange-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-xl transition-all ${
                    survey.settings?.expiresAt ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    ⌛
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-wide truncate">Expiration</p>
                    <p className="text-[11px] font-bold text-gray-400 truncate">
                      {survey.settings?.expiresAt
                        ? (new Date(survey.settings.expiresAt) < new Date()
                          ? `Expired`
                          : `Expires ${formatDateTime(new Date(survey.settings.expiresAt))}`)
                        : 'No expiration set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    ref={expirationInputRef}
                    type="datetime-local"
                    value={survey.settings?.expiresAt
                      ? (() => {
                        const d = new Date(survey.settings.expiresAt);
                        const offset = d.getTimezoneOffset();
                        const local = new Date(d.getTime() - offset * 60000);
                        local.setSeconds(0);
                        local.setMilliseconds(0);
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
                    className={`w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-100 rounded-xl hover:border-orange-500 hover:text-orange-500 transition-all cursor-pointer ${updatingExpiration ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-0.5'}`}
                    title="Set expiration date"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {survey.settings?.expiresAt && (
                    <button
                      type="button"
                      onClick={handleClearExpiration}
                      disabled={updatingExpiration}
                      className={`w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-100 rounded-xl hover:border-red-500 hover:text-red-500 transition-all cursor-pointer ${updatingExpiration ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-0.5'}`}
                      title="Clear expiration date"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Section */}
        {responses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 space-y-8"
          >
            {/* Overall Metrics */}
            <div className="bg-white rounded-[32px] border-4 border-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.03)] p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">Response Overview</h2>
                  <p className="text-gray-500 font-medium text-sm">Deep dive into your survey performance</p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-2xl border-2 border-green-100 flex-shrink-0">
                  <img src="/orange-kea-mascot.png" alt="Mascot" className="w-8 h-8 object-contain" />
                  <p className="text-green-700 text-xs font-bold leading-tight">
                    {responses.length > 10 ? "Taking off! 🚀" : "Keep it up! ✨"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* Completion Rate */}
                <div className="p-4 sm:p-6 rounded-2xl bg-gray-50 border-2 border-gray-100 flex flex-col items-center justify-center text-center group hover:border-indigo-200 transition-colors">
                  <CompletionRateChart
                    completedCount={responses.length}
                    totalCount={responses.length}
                    size={100}
                  />
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-4">Completion Rate</p>
                  <p className="text-xl font-black text-gray-900">100%</p>
                </div>

                {/* Total Responses */}
                <div className="p-4 sm:p-6 rounded-2xl bg-gray-50 border-2 border-gray-100 flex flex-col items-center justify-center text-center group hover:border-indigo-200 transition-colors">
                  <div className="text-5xl font-black text-indigo-600 mb-2">{responses.length}</div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Responses</p>
                  <p className="text-indigo-900/40 text-xs font-bold">Updated just now</p>
                </div>

                {/* Average Completion Time */}
                <div className="p-4 sm:p-6 rounded-2xl bg-gray-50 border-2 border-gray-100 flex flex-col items-center justify-center text-center group hover:border-purple-200 transition-colors">
                  <div className="text-4xl font-black text-purple-600 mb-2">
                    {formatDuration(averageCompletionTime)}
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Avg. Time</p>
                  <p className="text-purple-900/40 text-xs font-bold">Per respondent</p>
                </div>

                {/* Questions Answered */}
                <div className="p-4 sm:p-6 rounded-2xl bg-gray-50 border-2 border-gray-100 flex flex-col items-center justify-center text-center group hover:border-teal-200 transition-colors">
                  <div className="text-5xl font-black text-teal-600 mb-2">{survey?.questions.length || 0}</div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Questions</p>
                  <p className="text-teal-900/40 text-xs font-bold">Total in survey</p>
                </div>
              </div>

              {/* Responses Over Time */}
              {responsesOverTime.length > 1 && (
                <div className="mt-6 sm:mt-12 p-4 sm:p-6 rounded-3xl bg-gray-50/50 border-2 border-gray-100">
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">Response Velocity</h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" /> Responses
                    </div>
                  </div>
                  <LineChartComponent
                    data={responsesOverTime.map(({ name, value }) => ({ name, value }))}
                    height={200}
                  />
                </div>
              )}
            </div>

            {/* Question Analytics */}
            <div className="bg-white rounded-[32px] border-4 border-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.03)] p-4 sm:p-8">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">Question Analysis</h2>
                <p className="text-gray-500 font-medium text-sm">How your audience answered each question</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {questionAggregations.map((aggregation: QuestionAggregation, index: number) => (
                  <motion.div
                    key={aggregation.questionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="bg-white rounded-3xl p-6 border-4 border-gray-50 hover:border-orange-100 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">
                            {index + 1}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border-2 ${
                            aggregation.type === 'rating' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            aggregation.type === 'text' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                            'bg-green-50 text-green-600 border-green-100'
                          }`}>
                            {aggregation.type.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">
                          {aggregation.questionText}
                        </h3>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100/50">
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
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] border-4 border-gray-100 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.03)] p-12 text-center mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <img src={getAdventureImage(survey.adventureType)} className="w-64 h-64 rotate-12" alt="" />
            </div>
            
            <div className="relative z-10 max-w-lg mx-auto">
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-48 h-48 mx-auto mb-8 bg-orange-50 rounded-[48px] border-4 border-orange-100 p-8 flex items-center justify-center relative shadow-xl"
              >
                <div className="absolute inset-4 bg-orange-200 blur-2xl opacity-30 rounded-full" />
                <img src="/orange-kea-mascot.png" alt="Waiting..." className="w-full h-full object-contain relative z-10" />
              </motion.div>
              
              <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">Waiting for your first respondent!</h2>
              <p className="text-gray-500 font-medium text-lg mb-8">
                Your survey is live and ready for action. Share the link with your audience to start the adventure!
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(surveyUrl);
                    setToastMessage('Link copied to clipboard!');
                    setShowToast(true);
                  }}
                  size="lg"
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white border-b-4 border-orange-700 px-8 py-4 h-auto text-lg font-black active:border-b-0 active:translate-y-1 transition-all"
                >
                  Copy Survey Link
                </Button>
                <Link href={surveyUrl} target="_blank" className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full sm:w-auto bg-white border-4 border-gray-100 px-8 py-4 h-auto text-lg font-black hover:border-orange-200 hover:text-orange-600 transition-all"
                  >
                    Preview Survey
                  </Button>
                </Link>
              </div>

              <div className="mt-12 pt-8 border-t-2 border-gray-50">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Direct Survey URL</p>
                <code className="bg-gray-50 text-indigo-600 px-6 py-3 rounded-2xl border-2 border-gray-100 font-bold text-sm block truncate">
                  {surveyUrl}
                </code>
              </div>
            </div>
          </motion.div>
        )}

        {/* Responses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-[32px] border-4 border-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.03)] overflow-hidden"
        >
          <div className="p-4 sm:p-8 border-b-4 border-gray-50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Respondent Log</h2>
              <p className="text-gray-500 font-medium">
                {responses.length === 0
                  ? 'No data points yet'
                  : `Reviewing ${paginatedResponses.length} entries of ${responses.length}`}
              </p>
            </div>
            {responses.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border-2 border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Real-time Sync</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left py-3 px-4 sm:px-8 font-black text-gray-400 text-[10px] uppercase tracking-wide">Respondent</th>
                  <th className="text-left py-3 px-4 sm:px-8 font-black text-gray-400 text-[10px] uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left py-3 px-4 sm:px-8 font-black text-gray-400 text-[10px] uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="text-right py-3 px-4 sm:px-8 font-black text-gray-400 text-[10px] uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-50">
                {paginatedResponses.map((response, index) => (
                  <motion.tr
                    key={response.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group hover:bg-orange-50/30 transition-all cursor-pointer"
                    onClick={() => toggleRowExpansion(response.id)}
                  >
                    <td className="py-4 px-4 sm:px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-xs group-hover:border-orange-200 transition-colors">
                          👤
                        </div>
                        <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {response.respondentName || 'Anonymous'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-8 hidden md:table-cell">
                      <span className="text-sm font-medium text-gray-500">{response.respondentEmail || '-'}</span>
                    </td>
                    <td className="py-4 px-8 hidden sm:table-cell">
                      <span className="text-sm font-medium text-gray-400">{formatDateTime(response.completedAt)}</span>
                    </td>
                    <td className="py-4 px-4 sm:px-8 text-right">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-2 transition-all ${
                        expandedRows.has(response.id) 
                        ? 'bg-orange-500 text-white border-orange-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]' 
                        : 'bg-white text-gray-400 border-gray-100 group-hover:border-orange-200 group-hover:text-orange-500'
                      }`}>
                        {expandedRows.has(response.id) ? 'Close' : 'View'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
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
                  <div className="p-4 sm:p-8 border-t-4 border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
                      Mission Phase <span className="text-gray-900">{currentPage}</span> of {totalPages}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="bg-white border-2 border-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] disabled:opacity-30"
                      >
                        Previous
                      </Button>
                      <div className="hidden sm:flex items-center gap-2">
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
                              className={`w-10 h-10 rounded-xl text-sm font-black transition-all border-2 ${
                                currentPage === pageNum
                                  ? 'bg-orange-500 text-white border-orange-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                                  : 'bg-white text-gray-400 border-gray-100 hover:border-orange-200 hover:text-orange-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.03)]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="bg-white border-2 border-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] disabled:opacity-30"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] border-4 border-red-100 shadow-2xl max-w-md w-full p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl border-4 border-red-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Delete Survey?</h3>
              <p className="text-gray-500 font-medium mb-6">
                Are you sure you want to delete <span className="text-gray-900 font-bold">&quot;{survey.title}&quot;</span>? This action is permanent and all responses will be lost forever.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleDelete}
                  isLoading={deleting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white border-b-4 border-red-800 h-12 text-lg font-black active:border-b-0 active:translate-y-1 transition-all"
                >
                  Delete Mission
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteModal(false)} 
                  disabled={deleting}
                  className="w-full border-2 border-gray-100 font-bold"
                >
                  Keep Survey
                </Button>
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
            className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => !isPickingWinner && setShowWinnerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, rotate: 5 }}
              className="bg-white rounded-[40px] border-4 border-indigo-100 shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Confetti Background would go here if we had a component */}
              <div className="relative z-10">
                {isPickingWinner ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity }
                      }}
                      className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border-4 border-white"
                    >
                      <span className="text-5xl">🎰</span>
                    </motion.div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-widest">Spinning...</h3>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-tighter">Selecting from {responses.length} heroes</p>
                    <motion.div
                      key={selectedWinner?.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100"
                    >
                      <p className="text-gray-800 font-black text-lg">
                        {selectedWinner?.respondentName || 'Searching...'}
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="relative mb-8">
                      <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute -top-12 -right-4 w-24 h-24 z-20"
                      >
                        <img src="/orange-kea-mascot.png" alt="Happy Mascot" className="w-full h-full object-contain" />
                      </motion.div>
                      
                      <div
                        ref={winnerCardRef}
                        className="p-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-indigo-50 rounded-[32px] border-4 border-yellow-200 shadow-inner relative overflow-hidden"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', damping: 12 }}
                          className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg border-2 border-yellow-300"
                        >
                          <span className="text-4xl">🏆</span>
                        </motion.div>
                        
                        <h3 className="text-3xl font-black text-gray-900 mb-1 leading-tight tracking-tight uppercase">Winner!</h3>
                        <p className="text-orange-600 font-bold text-xs uppercase tracking-widest mb-6">Survey Mission Complete</p>
                        
                        <div className="p-6 bg-white rounded-2xl border-4 border-indigo-100 shadow-sm mb-4">
                          <p className="text-2xl font-black text-gray-900 leading-tight">
                            {selectedWinner?.respondentName || 'Anonymous Hero'}
                          </p>
                          {selectedWinner?.respondentEmail && (
                            <p className="text-sm font-bold text-indigo-400 mt-1">{selectedWinner.respondentEmail}</p>
                          )}
                        </div>
                        
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Drawn on {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        onClick={handleDownloadWinnerImage}
                        disabled={isSavingWinnerImage}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          📸
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-500">Save Card</span>
                      </button>
                      <button
                        onClick={handleCopyWinnerText}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          ✍️
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-500">Copy Text</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={handlePickWinner}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-b-4 border-indigo-800 h-14 text-lg font-black active:border-b-0 active:translate-y-1 transition-all"
                      >
                        Redraw Winner
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowWinnerModal(false)}
                        className="font-bold text-gray-400 hover:text-gray-600"
                      >
                        Close Portal
                      </Button>
                    </div>
                  </div>
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
