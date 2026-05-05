'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CSVLink } from 'react-csv';
import { useAuthContext } from '@/contexts/AuthContext';
import { getSurvey, getSurveyResponses, deleteSurvey, updateSurvey } from '@/lib/firebase/firestore';
import {
  formatDate, formatDateTime, formatDuration,
  getAdventureImage, getAdventureLabel,
  aggregateAllQuestions, getResponsesOverTime,
  calculateAverageCompletionTime, QuestionAggregation,
} from '@/lib/utils/helpers';
import { Survey, SurveyResponse, Answer, PricingTier, PRICING_TIERS } from '@/lib/types';
import ResponseCapBanner from '@/components/pricing/ResponseCapBanner';
import { BarChartComponent, LineChartComponent, RatingDisplay, CompletionRateChart, TextResponsesList } from '@/components/charts';
import html2canvas from 'html2canvas';

const ITEMS_PER_PAGE = 50;
const CSV_EXPORT_TIERS: PricingTier[] = ['starter', 'pro', 'business', 'enterprise'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatResponsesForCSV(survey: Survey, responses: SurveyResponse[]) {
  const headers = ['Timestamp', 'Name', 'Email', ...survey.questions.map(q => q.question)];
  const rows = responses.map(response => {
    const val = (qId: string): string => {
      if (Array.isArray(response.answers)) {
        const a = response.answers.find((a: Answer) => a.questionId === qId);
        if (!a) return '';
        return Array.isArray(a.value) ? a.value.join(', ') : String(a.value);
      }
      return (response.answers as Record<string, string>)[qId] || '';
    };
    return [
      formatDateTime(response.completedAt),
      response.respondentName || 'Anonymous',
      response.respondentEmail || '',
      ...survey.questions.map(q => val(q.id)),
    ];
  });
  return [headers, ...rows];
}

function getAnswerValue(response: SurveyResponse, questionId: string): string {
  if (Array.isArray(response.answers)) {
    const a = response.answers.find((a: Answer) => a.questionId === questionId);
    if (!a) return '-';
    return Array.isArray(a.value) ? a.value.join(', ') : String(a.value);
  }
  return (response.answers as Record<string, string>)[questionId] || '-';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toast({ message, show, onClose }: { message: string; show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-xl"
        >
          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs">✓</span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <motion.div
        animate={{ y: [0, -16, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src="/orange-kea-mascot.png" alt="Loading" className="w-24 h-24 drop-shadow-xl" />
      </motion.div>
      <div className="text-center">
        <p className="font-black text-gray-900 text-lg">Gathering your results…</p>
        <div className="flex gap-1.5 justify-center mt-3">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-orange-500 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-green-100 text-green-700 border-green-200',
    closed:    'bg-red-100 text-red-700 border-red-200',
    draft:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border-2 ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-300 transition-all">
      {copied
        ? <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      }
    </button>
  );
}

function IconButton({ onClick, title, children, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all active:translate-y-0.5 ${
        danger
          ? 'bg-red-50 border-red-100 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500'
          : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

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

  // UI state
  const [toast, setToast] = useState({ show: false, msg: '' });
  const showToast = (msg: string) => setToast({ show: true, msg });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Action state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingExpiration, setUpdatingExpiration] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPaymentTier, setSelectedPaymentTier] = useState<PricingTier | null>(null);

  // Winner picker
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<SurveyResponse | null>(null);
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const [isSavingWinnerImage, setIsSavingWinnerImage] = useState(false);
  const winnerCardRef = useRef<HTMLDivElement>(null);

  // Inline editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const expirationInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!surveyId) return;
    try {
      const [surveyData, responsesData] = await Promise.all([
        getSurvey(surveyId),
        getSurveyResponses(surveyId),
      ]);
      if (!surveyData) { setError('Survey not found'); return; }
      setSurvey(surveyData);
      setResponses(responsesData);
    } catch {
      setError('Failed to load survey data');
    }
  }, [surveyId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Payment redirect handling
  const paymentVerifiedRef = useRef(false);
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    if (paymentStatus === 'success' && sessionId && !paymentVerifiedRef.current && firebaseUser) {
      paymentVerifiedRef.current = true;
      (async () => {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.status === 'paid' && data.surveyId === surveyId) {
            showToast('Payment successful! Survey is now live.');
            router.replace(`/dashboard/${surveyId}`);
            fetchData();
          }
        } catch { paymentVerifiedRef.current = false; }
      })();
    } else if (paymentStatus === 'cancelled') {
      showToast('Payment cancelled. Survey saved as draft.');
      router.replace(`/dashboard/${surveyId}`);
    }
  }, [searchParams, surveyId, firebaseUser, router, fetchData]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    showToast('Refreshed!');
  };

  const handleStatusToggle = async () => {
    if (!survey || updatingStatus) return;
    const prev = survey.status;
    const next = prev === 'published' ? 'closed' : 'published';
    setUpdatingStatus(true);
    setSurvey({ ...survey, status: next });
    try {
      await updateSurvey(surveyId, { status: next });
      showToast(next === 'closed' ? 'Survey deactivated' : 'Survey activated');
    } catch {
      setSurvey({ ...survey, status: prev });
      showToast('Failed to update status');
    } finally { setUpdatingStatus(false); }
  };

  const handleExpirationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!survey || updatingExpiration) return;
    const value = e.target.value;
    const prev = survey.settings;
    const parsed = value ? new Date(value) : undefined;
    if (parsed && isNaN(parsed.getTime())) { showToast('Invalid date'); return; }
    const updated = { ...survey.settings, expiresAt: parsed };
    setUpdatingExpiration(true);
    setSurvey({ ...survey, settings: updated });
    try {
      await updateSurvey(surveyId, { settings: updated });
      showToast(value ? 'Expiration set' : 'Expiration removed');
    } catch {
      setSurvey({ ...survey, settings: prev });
      showToast('Failed to update expiration');
    } finally { setUpdatingExpiration(false); }
  };

  const handleClearExpiration = async () => {
    if (!survey || updatingExpiration) return;
    const prev = survey.settings;
    const { expiresAt: _, ...rest } = survey.settings || {};
    void _;
    setUpdatingExpiration(true);
    setSurvey({ ...survey, settings: rest });
    try {
      await updateSurvey(surveyId, { settings: { ...rest, expiresAt: null as unknown as undefined } });
      showToast('Expiration removed');
    } catch {
      setSurvey({ ...survey, settings: prev });
      showToast('Failed to clear expiration');
    } finally { setUpdatingExpiration(false); }
  };

  const handleSaveTitle = async () => {
    if (!survey || savingTitle) return;
    const title = editedTitle.trim();
    if (!title || title === survey.title) { setIsEditingTitle(false); return; }
    setSavingTitle(true);
    const prev = { ...survey };
    setSurvey({ ...survey, title });
    try {
      await updateSurvey(surveyId, { title });
      showToast('Title updated');
      setIsEditingTitle(false);
    } catch {
      setSurvey(prev);
      showToast('Failed to update title');
    } finally { setSavingTitle(false); }
  };

  const handleSaveDescription = async () => {
    if (!survey || savingDescription) return;
    const description = editedDescription.trim();
    if (description === (survey.description || '')) { setIsEditingDescription(false); return; }
    setSavingDescription(true);
    const prev = { ...survey };
    setSurvey({ ...survey, description: description || undefined });
    try {
      await updateSurvey(surveyId, { description: description || '' });
      showToast('Description updated');
      setIsEditingDescription(false);
    } catch {
      setSurvey(prev);
      showToast('Failed to update description');
    } finally { setSavingDescription(false); }
  };

  const handleDelete = async () => {
    if (!surveyId) return;
    setDeleting(true);
    try {
      await deleteSurvey(surveyId);
      router.push('/dashboard');
    } catch {
      showToast('Failed to delete survey');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!survey || !firebaseUser || processingPayment) return;
    const tier = selectedPaymentTier || survey.pricingTier;
    if (!tier || tier === 'free') return;
    setProcessingPayment(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier, surveyId: survey.id, surveyTitle: survey.title }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error('No checkout URL');
    } catch {
      showToast('Failed to start payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handlePickWinner = () => {
    if (!responses.length) return;
    setShowWinnerModal(true);
    setIsPickingWinner(true);
    setSelectedWinner(null);
    let i = 0;
    const interval = setInterval(() => {
      setSelectedWinner(responses[Math.floor(Math.random() * responses.length)]);
      if (++i >= 20) {
        clearInterval(interval);
        setSelectedWinner(responses[Math.floor(Math.random() * responses.length)]);
        setIsPickingWinner(false);
      }
    }, 100);
  };

  const handleDownloadWinnerImage = async () => {
    if (!winnerCardRef.current || !selectedWinner) return;
    setIsSavingWinnerImage(true);
    try {
      const canvas = await html2canvas(winnerCardRef.current, { backgroundColor: '#fff', scale: 2, useCORS: true });
      const a = document.createElement('a');
      a.download = `winner-${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      showToast('Image downloaded!');
    } catch { showToast('Failed to download image'); }
    finally { setIsSavingWinnerImage(false); }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const surveyUrl = useMemo(() => {
    if (!survey || !user) return '';
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/${user.username}/${survey.slug}`;
  }, [survey, user]);

  const sortedResponses = useMemo(() =>
    [...responses].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()),
  [responses]);

  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedResponses.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedResponses, currentPage]);

  const totalPages = Math.ceil(sortedResponses.length / ITEMS_PER_PAGE);

  const csvData = useMemo(() => survey ? formatResponsesForCSV(survey, sortedResponses) : [], [survey, sortedResponses]);
  const csvFilename = useMemo(() => {
    if (!survey) return 'responses.csv';
    const slug = survey.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${slug}-responses-${new Date().toISOString().split('T')[0]}.csv`;
  }, [survey]);

  const questionAggregations = useMemo(() =>
    survey ? aggregateAllQuestions(survey.questions, responses) : [],
  [survey, responses]);

  const responsesOverTime = useMemo(() => getResponsesOverTime(responses, 'day'), [responses]);
  const avgCompletionTime = useMemo(() => calculateAverageCompletionTime(responses), [responses]);

  // ── Render guards ──────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />;

  if (error || !survey) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-xl font-black text-gray-900">{error || 'Survey not found'}</h2>
        <p className="text-gray-500 text-sm">This survey doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/dashboard" className="mt-2 px-6 py-3 bg-orange-500 text-white font-black rounded-xl border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-3">

      {/* ── Hero card ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">

        {/* Top row: back + status + actions */}
        <div className="flex items-center gap-2 mb-4">
          <Link href="/dashboard" className="flex items-center gap-1 text-gray-500 font-bold text-sm mr-auto min-w-0">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">Back</span>
          </Link>
          <StatusBadge status={survey.status} />
          <IconButton onClick={handleRefresh} title="Refresh">
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </IconButton>
          <IconButton onClick={() => setShowDeleteModal(true)} title="Delete survey" danger>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </IconButton>
        </div>

        {/* Survey identity — centered */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-orange-50 border-4 border-orange-100 flex items-center justify-center shadow-[0_4px_0_rgba(249,115,22,0.2)]">
            <img src={getAdventureImage(survey.adventureType)} alt="" className="w-14 h-14 object-contain" />
          </div>
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wide border border-orange-200">
            {getAdventureLabel(survey.adventureType)}
          </span>

          {isEditingTitle ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                ref={titleInputRef}
                autoFocus
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setIsEditingTitle(false); }}
                className="flex-1 text-center text-lg font-black bg-white border-2 border-orange-400 rounded-xl px-3 py-1.5 focus:outline-none min-w-0"
                disabled={savingTitle}
              />
              <button onClick={handleSaveTitle} disabled={savingTitle} className="p-1.5 bg-green-100 text-green-600 rounded-lg border border-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </button>
              <button onClick={() => setIsEditingTitle(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg border border-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditedTitle(survey.title); setIsEditingTitle(true); }}
              className="group flex items-center gap-2"
            >
              <h1 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                {survey.title || 'Untitled Survey'}
              </h1>
              <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}

          <p className="text-gray-500 text-sm">
            <span className="text-gray-900 font-black text-xl">{responses.length}</span>
            {' '}responses collected
          </p>

          {/* Action pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {responses.length > 0 && (
              <button onClick={handlePickWinner} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border-2 border-orange-200 text-orange-600 font-black text-xs rounded-xl hover:bg-orange-100 transition-all">
                🏆 Pick Winner
              </button>
            )}
            {responses.length > 0 && (
              CSV_EXPORT_TIERS.includes(survey.pricingTier || 'free') ? (
                <CSVLink data={csvData} filename={csvFilename} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border-2 border-indigo-200 text-indigo-600 font-black text-xs rounded-xl hover:bg-indigo-100 transition-all">
                  ↓ Export CSV
                </CSVLink>
              ) : (
                <button disabled className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border-2 border-gray-200 text-gray-400 font-black text-xs rounded-xl opacity-60 cursor-not-allowed">
                  🔒 CSV
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Survey URL card ───────────────────────────────────────────────── */}
      <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-4">
        <p className="text-amber-700 text-[10px] font-black uppercase tracking-wide mb-2">Public Survey Link</p>
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 min-w-0 text-sm font-bold text-amber-700 truncate bg-white/80 px-3 py-2 rounded-xl border-2 border-amber-200/50">
            {surveyUrl}
          </code>
          <CopyButton text={surveyUrl} />
        </div>
        <div className="flex gap-2">
          <Link href={surveyUrl} target="_blank" className="flex-1">
            <button className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-xl border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all">
              Open Survey
            </button>
          </Link>
          <button
            onClick={() => {
              if (navigator.share) navigator.share({ title: survey.title, url: surveyUrl });
              else { navigator.clipboard.writeText(surveyUrl); showToast('Link copied!'); }
            }}
            className="flex-1 py-2.5 bg-white border-2 border-amber-200 text-amber-700 font-black text-sm rounded-xl hover:bg-amber-100 transition-all"
          >
            Share
          </button>
        </div>
      </div>

      {/* ── Payment banner ─────────────────────────────────────────────────── */}
      {survey.paymentStatus === 'unpaid' && survey.pricingTier && survey.pricingTier !== 'free' && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">💳</div>
            <div className="min-w-0">
              <p className="font-black text-gray-900 text-sm">Payment Required</p>
              <p className="text-xs text-gray-500">Complete payment to publish this survey.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(Object.values(PRICING_TIERS) as Array<{ id: PricingTier; name: string; price: number; responseLimit: number }>)
              .filter(t => t.id !== 'free')
              .map(tier => {
                const selected = (selectedPaymentTier || survey.pricingTier) === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedPaymentTier(tier.id)}
                    disabled={processingPayment}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                  >
                    <div className="font-black text-gray-900">${tier.price}</div>
                    <div className="text-xs text-gray-500">{tier.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{tier.responseLimit.toLocaleString()} responses</div>
                  </button>
                );
              })}
          </div>
          <button
            onClick={handleCompletePayment}
            disabled={processingPayment}
            className="w-full py-3 bg-orange-500 text-white font-black text-sm rounded-xl border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
          >
            {processingPayment ? 'Redirecting…' : `Pay $${PRICING_TIERS[selectedPaymentTier || survey.pricingTier!]?.price}`}
          </button>
        </div>
      )}

      {/* ── Response cap banner ───────────────────────────────────────────── */}
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

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Responses */}
        <div className="bg-indigo-600 rounded-2xl p-4 text-white overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-wide mb-1 relative z-10">Responses</p>
          <p className="text-4xl font-black relative z-10">{responses.length}</p>
          {survey.responseLimit && (
            <>
              <div className="mt-2 h-1.5 w-full bg-indigo-800 rounded-full overflow-hidden relative z-10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((responses.length / survey.responseLimit) * 100, 100)}%` }}
                  className="h-full bg-white rounded-full"
                />
              </div>
              <p className="text-[9px] text-indigo-300 mt-1 font-bold relative z-10">{survey.responseLimit - responses.length} left</p>
            </>
          )}
        </div>

        {/* Launch date */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-wide mb-2">Launch Date</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div className="min-w-0">
              <p className="font-black text-gray-900 text-sm leading-tight truncate">{formatDate(survey.createdAt)}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase">Mission Start</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 divide-y-2 divide-gray-100">
        {/* Status toggle */}
        <div className="flex items-center gap-3 p-4">
          <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg ${survey.status === 'published' ? 'bg-green-100' : 'bg-gray-100'}`}>
            {survey.status === 'published' ? '🚀' : '🛑'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900">Survey Status</p>
            <p className="text-xs text-gray-400 truncate">{survey.status === 'published' ? 'Live — accepting responses' : 'Inactive'}</p>
          </div>
          <button
            onClick={handleStatusToggle}
            disabled={updatingStatus || survey.status === 'draft'}
            className={`flex-shrink-0 relative h-7 w-12 rounded-full border-2 transition-all ${
              survey.status === 'published' ? 'bg-orange-500 border-orange-600' : 'bg-gray-200 border-gray-300'
            } ${updatingStatus || survey.status === 'draft' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${survey.status === 'published' ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Expiration */}
        <div className="flex items-center gap-3 p-4">
          <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg ${survey.settings?.expiresAt ? 'bg-indigo-100' : 'bg-gray-100'}`}>⌛</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900">Expiration</p>
            <p className="text-xs text-gray-400 truncate">
              {survey.settings?.expiresAt
                ? (new Date(survey.settings.expiresAt) < new Date() ? 'Expired' : `Expires ${formatDateTime(new Date(survey.settings.expiresAt))}`)
                : 'No expiration set'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input
              ref={expirationInputRef}
              type="datetime-local"
              className="sr-only"
              value={survey.settings?.expiresAt ? (() => {
                const d = new Date(survey.settings.expiresAt!);
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                local.setSeconds(0); local.setMilliseconds(0);
                return local.toISOString().slice(0, 16);
              })() : ''}
              onChange={handleExpirationChange}
              disabled={updatingExpiration}
              min={new Date().toISOString().slice(0, 16)}
            />
            <button
              onClick={() => expirationInputRef.current?.showPicker()}
              disabled={updatingExpiration}
              className="w-9 h-9 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:text-orange-500 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {survey.settings?.expiresAt && (
              <button
                onClick={handleClearExpiration}
                disabled={updatingExpiration}
                className="w-9 h-9 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:text-red-500 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="p-4">
          {isEditingDescription ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={editedDescription}
                onChange={e => setEditedDescription(e.target.value)}
                rows={3}
                className="w-full border-2 border-orange-400 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
                disabled={savingDescription}
                placeholder="Describe your survey…"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveDescription} disabled={savingDescription} className="flex-1 py-2 bg-orange-500 text-white font-black text-xs rounded-xl border-b-4 border-orange-700 active:border-b-0 active:translate-y-0.5 transition-all">
                  {savingDescription ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setIsEditingDescription(false)} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {survey.description || <span className="italic text-gray-400">No description yet.</span>}
              </p>
              <button
                onClick={() => { setEditedDescription(survey.description || ''); setIsEditingDescription(true); }}
                className="text-xs font-black text-orange-500 hover:text-orange-600 transition-colors"
              >
                {survey.description ? 'Edit description' : '+ Add description'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Analytics ─────────────────────────────────────────────────────── */}
      {responses.length > 0 ? (
        <>
          {/* Overview metrics */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
            <h2 className="text-base font-black text-gray-900 mb-4">Response Overview</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center border-2 border-gray-100">
                <CompletionRateChart completedCount={responses.length} totalCount={responses.length} size={72} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mt-2">Completion</p>
                <p className="font-black text-gray-900">100%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border-2 border-gray-100">
                <p className="text-3xl font-black text-purple-600">{formatDuration(avgCompletionTime)}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mt-2">Avg. Time</p>
                <p className="text-xs text-gray-400">per respondent</p>
              </div>
            </div>

            {responsesOverTime.length > 1 && (
              <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide mb-3">Response Velocity</p>
                <LineChartComponent data={responsesOverTime.map(({ name, value }) => ({ name, value }))} height={160} />
              </div>
            )}
          </div>

          {/* Question analysis */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
            <h2 className="text-base font-black text-gray-900 mb-4">Question Analysis</h2>
            <div className="space-y-4">
              {questionAggregations.map((agg: QuestionAggregation, i: number) => (
                <motion.div
                  key={agg.questionId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <span className="w-5 h-5 flex-shrink-0 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
                        agg.type === 'rating' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        agg.type === 'text' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                        'bg-green-50 text-green-600 border-green-200'
                      }`}>{agg.type.replace('_', ' ')}</span>
                      <h3 className="font-black text-gray-900 text-sm leading-tight mt-1">{agg.questionText}</h3>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    {agg.type === 'rating' && agg.average !== undefined && (
                      <RatingDisplay average={agg.average} data={agg.data} totalResponses={agg.totalResponses} maxRating={agg.maxRating || 5} />
                    )}
                    {agg.type === 'multiple_choice' && (
                      <BarChartComponent data={agg.data} height={Math.max(140, agg.data.length * 40)} layout="horizontal" showPercentages showCounts />
                    )}
                    {agg.type === 'text' && agg.textResponses && (
                      <TextResponsesList responses={agg.textResponses} maxVisible={3} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 mx-auto mb-4 bg-orange-50 rounded-3xl border-4 border-orange-100 flex items-center justify-center"
          >
            <img src="/orange-kea-mascot.png" alt="" className="w-16 h-16 object-contain" />
          </motion.div>
          <h2 className="text-lg font-black text-gray-900 mb-2">Waiting for responses!</h2>
          <p className="text-gray-500 text-sm mb-6">Share the link below to start collecting answers.</p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <button
              onClick={() => { navigator.clipboard.writeText(surveyUrl); showToast('Link copied!'); }}
              className="w-full py-3 bg-orange-500 text-white font-black text-sm rounded-xl border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all"
            >
              Copy Survey Link
            </button>
            <Link href={surveyUrl} target="_blank">
              <button className="w-full py-3 bg-white border-2 border-gray-200 text-gray-600 font-black text-sm rounded-xl hover:border-orange-300 transition-all">
                Preview Survey
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Respondent log ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
        <div className="p-4 border-b-2 border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-black text-gray-900">Respondent Log</h2>
            <p className="text-xs text-gray-400">
              {responses.length === 0 ? 'No responses yet' : `${responses.length} total · page ${currentPage} of ${Math.max(1, totalPages)}`}
            </p>
          </div>
          {responses.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border-2 border-indigo-100 rounded-xl flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wide">Live</span>
            </span>
          )}
        </div>

        {paginatedResponses.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No responses yet</div>
        ) : (
          <div className="divide-y-2 divide-gray-50">
            {paginatedResponses.map((response) => (
              <div key={response.id}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50/40 transition-colors text-left"
                  onClick={() => setExpandedRows(prev => {
                    const next = new Set(prev);
                    next.has(response.id) ? next.delete(response.id) : next.add(response.id);
                    return next;
                  })}
                >
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-sm">👤</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{response.respondentName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400 truncate">{formatDateTime(response.completedAt)}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg border-2 transition-all ${
                    expandedRows.has(response.id)
                      ? 'bg-orange-500 text-white border-orange-600'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}>
                    {expandedRows.has(response.id) ? '▲' : '▼'}
                  </span>
                </button>

                <AnimatePresence>
                  {expandedRows.has(response.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-4 border-t-2 border-gray-100">
                        {response.respondentEmail && (
                          <p className="text-xs text-gray-500 mb-3 font-medium">✉ {response.respondentEmail}</p>
                        )}
                        <div className="grid grid-cols-1 gap-2">
                          {survey.questions.map((q, qi) => (
                            <div key={q.id} className="bg-white rounded-xl p-3 border-2 border-gray-100">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center text-[8px] font-black">{qi + 1}</span>
                                <span className="truncate">{q.question}</span>
                              </p>
                              <p className="text-sm font-bold text-gray-900">{getAnswerValue(response, q.id)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-gray-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-black bg-white border-2 border-gray-200 rounded-xl disabled:opacity-30 hover:border-orange-300 transition-all"
            >
              ← Prev
            </button>
            <span className="text-xs font-black text-gray-400">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-black bg-white border-2 border-gray-200 rounded-xl disabled:opacity-30 hover:border-orange-300 transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl border-2 border-red-100 max-w-sm w-full p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl border-2 border-red-100 flex items-center justify-center mx-auto mb-4 text-3xl">🗑</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete Survey?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Delete <span className="font-bold text-gray-900">&quot;{survey.title}&quot;</span>? This is permanent — all responses will be lost.
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={handleDelete} disabled={deleting} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
                <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="w-full py-3 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-all">
                  Keep it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Winner modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showWinnerModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-indigo-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => !isPickingWinner && setShowWinnerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.85 }}
              className="bg-white rounded-3xl border-2 border-indigo-100 max-w-sm w-full p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              {isPickingWinner ? (
                <div className="py-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="text-5xl mb-4">🎲</motion.div>
                  <p className="font-black text-gray-900 text-xl">{selectedWinner?.respondentName || '…'}</p>
                  <p className="text-gray-400 text-sm mt-1">Picking winner…</p>
                </div>
              ) : selectedWinner ? (
                <div ref={winnerCardRef} className="py-4">
                  <div className="text-5xl mb-4">🏆</div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wide mb-2">Winner!</p>
                  <p className="text-2xl font-black text-gray-900 mb-1">{selectedWinner.respondentName || 'Anonymous'}</p>
                  {selectedWinner.respondentEmail && <p className="text-sm text-gray-500 mb-4">{selectedWinner.respondentEmail}</p>}
                  <p className="text-xs text-gray-400">Responded {formatDateTime(selectedWinner.completedAt)}</p>
                </div>
              ) : null}

              {!isPickingWinner && selectedWinner && (
                <div className="flex flex-col gap-2 mt-4">
                  <button onClick={handleDownloadWinnerImage} disabled={isSavingWinnerImage} className="w-full py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all">
                    {isSavingWinnerImage ? 'Saving…' : 'Download Image'}
                  </button>
                  <button onClick={handlePickWinner} className="w-full py-2.5 bg-orange-50 border-2 border-orange-200 text-orange-600 font-black text-sm rounded-xl hover:bg-orange-100 transition-all">
                    Pick Again
                  </button>
                  <button onClick={() => setShowWinnerModal(false)} className="w-full py-2.5 bg-gray-100 text-gray-500 font-bold text-sm rounded-xl">
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.msg} show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} />
    </div>
  );
}
