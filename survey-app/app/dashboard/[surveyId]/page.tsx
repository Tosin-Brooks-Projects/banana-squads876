'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Copy, Trophy, Lock, Mail, RefreshCw, Trash2, Frown, CreditCard, Rocket, CircleStop, Timer, User, Dice5, Globe, ExternalLink, Share2, ChevronLeft, Pencil, X } from 'lucide-react';
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
type TabId = 'overview' | 'questions' | 'responses';

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
    <div aria-live="polite" aria-atomic="true" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="flex items-center gap-2 bg-[#3c3c3c] text-white text-sm font-bold font-outfit px-4 py-3 rounded-2xl shadow-xl pointer-events-auto"
          >
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </span>
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 lg:px-0 pt-8 space-y-4 animate-pulse">
      <div className="h-8 bg-[#f0f0f0] rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#f0f0f0] rounded-2xl" />)}
      </div>
      <div className="h-14 bg-[#f0f0f0] rounded-2xl" />
      <div className="flex gap-4">
        <div className="w-72 shrink-0 space-y-3">
          <div className="h-48 bg-[#f0f0f0] rounded-2xl" />
          <div className="h-32 bg-[#f0f0f0] rounded-2xl" />
        </div>
        <div className="flex-1 h-96 bg-[#f0f0f0] rounded-2xl" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-green-50 text-green-700 border-green-200',
    closed:    'bg-red-50 text-red-600 border-red-200',
    draft:     'bg-[#f5f5f5] text-[#777777] border-[#e5e5e5]',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-outfit uppercase tracking-widest border ${styles[status] ?? styles.draft}`}>
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
    <button
      onClick={copy}
      aria-label={copied ? 'Copied!' : 'Copy link'}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold font-outfit transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-white border border-[#e5e5e5] text-[#777777] hover:border-orange-300 hover:text-orange-500'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={2} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function IconBtn({ onClick, title, children, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
        danger
          ? 'bg-white border-[#e5e5e5] text-[#afafaf] hover:bg-red-50 hover:text-red-500 hover:border-red-200 focus-visible:ring-red-400'
          : 'bg-white border-[#e5e5e5] text-[#afafaf] hover:border-orange-300 hover:text-orange-500 focus-visible:ring-orange-500'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SurveyDetailPage() {
  const reducedMotion = useReducedMotion();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser } = useAuthContext();
  const surveyId = params.surveyId as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('overview');

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

  // Expiration date picker
  const [showExpirationEdit, setShowExpirationEdit] = useState(false);
  const [expirationDateInput, setExpirationDateInput] = useState('');
  const [expirationTimeInput, setExpirationTimeInput] = useState('');

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

  const openExpirationEdit = () => {
    if (survey?.settings?.expiresAt) {
      const d = new Date(survey.settings.expiresAt);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      setExpirationDateInput(local.toISOString().slice(0, 10));
      setExpirationTimeInput(local.toISOString().slice(11, 16));
    } else {
      setExpirationDateInput('');
      setExpirationTimeInput('23:59');
    }
    setShowExpirationEdit(true);
  };

  const handleSaveExpiration = async () => {
    if (!survey || !expirationDateInput || updatingExpiration) return;
    const combined = `${expirationDateInput}T${expirationTimeInput || '23:59'}`;
    const parsed = new Date(combined);
    if (isNaN(parsed.getTime())) { showToast('Invalid date'); return; }
    const prev = survey.settings;
    const updated = { ...survey.settings, expiresAt: parsed };
    setUpdatingExpiration(true);
    setSurvey({ ...survey, settings: updated });
    setShowExpirationEdit(false);
    try {
      await updateSurvey(surveyId, { settings: updated });
      showToast('Expiration set');
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
        <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center mx-auto">
          <Frown className="w-8 h-8 text-[#afafaf]" />
        </div>
        <h2 className="text-xl font-bold font-outfit text-[#3c3c3c]">{error || 'Survey not found'}</h2>
        <p className="text-[#777777] text-sm font-outfit">This survey doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/dashboard" className="mt-2 px-6 py-3 bg-orange-500 text-white font-bold font-outfit rounded-xl shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'questions',  label: 'Questions', count: survey.questions.length },
    { id: 'responses',  label: 'Responses', count: responses.length },
  ];

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto px-4 lg:px-0 pb-16 space-y-4">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-2 min-w-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-[#afafaf] hover:text-[#3c3c3c] font-outfit text-sm transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">All surveys</span>
        </Link>

        <span className="text-[#e5e5e5] flex-shrink-0">/</span>

        {/* Editable title */}
        {isEditingTitle ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              ref={titleInputRef}
              autoFocus
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setIsEditingTitle(false); }}
              className="flex-1 text-sm font-bold font-outfit bg-white border border-orange-400 rounded-xl px-3 py-1.5 focus:outline-none min-w-0 focus-visible:ring-2 focus-visible:ring-orange-500"
              disabled={savingTitle}
            />
            <button onClick={handleSaveTitle} disabled={savingTitle} className="w-7 h-7 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer">
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
            <button onClick={() => setIsEditingTitle(false)} className="w-7 h-7 bg-[#f5f5f5] border border-[#e5e5e5] text-[#afafaf] rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditedTitle(survey.title); setIsEditingTitle(true); }}
            className="group flex items-center gap-1.5 min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
          >
            <h1 className="text-sm font-bold font-outfit text-[#3c3c3c] truncate group-hover:text-orange-600 transition-colors">
              {survey.title || 'Untitled survey'}
            </h1>
            <Pencil className="w-3 h-3 text-[#c8c8c8] group-hover:text-orange-400 flex-shrink-0 transition-colors" />
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={survey.status} />
          <IconBtn onClick={handleRefresh} title="Refresh data">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </IconBtn>
          <IconBtn onClick={() => setShowDeleteModal(true)} title="Delete survey" danger>
            <Trash2 className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Responses — hero metric */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 relative overflow-hidden border-l-[3px] border-l-orange-400">
          <p className="text-[10px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest mb-2">Responses</p>
          <p className="text-3xl font-bold text-orange-500 tabular-nums leading-none">{responses.length}</p>
          {survey.responseLimit ? (
            <div className="mt-2.5 space-y-1">
              <div className="h-1 w-full bg-[#f0f0f0] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((responses.length / survey.responseLimit) * 100, 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-orange-400 rounded-full"
                />
              </div>
              <p className="text-[10px] text-[#afafaf] font-outfit tabular-nums">{survey.responseLimit - responses.length} of {survey.responseLimit} remaining</p>
            </div>
          ) : (
            <p className="text-[10px] text-[#afafaf] font-outfit mt-1">total collected</p>
          )}
        </div>

        {/* Completion rate */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4">
          <p className="text-[10px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest mb-2">Completion</p>
          <p className="text-3xl font-bold text-[#3c3c3c] tabular-nums leading-none">100%</p>
          <p className="text-[10px] text-[#afafaf] font-outfit mt-1">of started surveys</p>
        </div>

        {/* Avg time */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4">
          <p className="text-[10px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest mb-2">Avg. time</p>
          <p className="text-3xl font-bold text-[#3c3c3c] tabular-nums leading-none">{responses.length > 0 ? formatDuration(avgCompletionTime) : '—'}</p>
          <p className="text-[10px] text-[#afafaf] font-outfit mt-1">per respondent</p>
        </div>

        {/* Created */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4">
          <p className="text-[10px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest mb-2">Created</p>
          <p className="text-sm font-bold text-[#3c3c3c] leading-tight">{formatDate(survey.createdAt)}</p>
          <p className="text-[10px] text-[#afafaf] font-outfit mt-1">launch date</p>
        </div>
      </div>

      {/* ── Share strip ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl px-4 py-3 flex items-center gap-3">
        <Globe className="w-4 h-4 text-[#afafaf] flex-shrink-0" />
        <code className="flex-1 min-w-0 text-[13px] font-outfit text-[#3c3c3c] truncate">{surveyUrl}</code>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CopyButton text={surveyUrl} />
          <Link
            href={surveyUrl}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e5e5] text-[#777777] hover:border-orange-300 hover:text-orange-500 rounded-lg text-[12px] font-bold font-outfit transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Open</span>
          </Link>
          <button
            onClick={() => {
              if (navigator.share) navigator.share({ title: survey.title, url: surveyUrl });
              else { navigator.clipboard.writeText(surveyUrl); showToast('Link copied!'); }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e5e5] text-[#777777] hover:border-orange-300 hover:text-orange-500 rounded-lg text-[12px] font-bold font-outfit transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
          >
            <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* ── Two-column body ───────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* LEFT SIDEBAR */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-3">

          {/* Survey identity */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 text-center space-y-3">
            <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto">
              <img src={getAdventureImage(survey.adventureType)} alt="" className="w-10 h-10 object-contain" />
            </div>
            <span className="inline-block px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold font-outfit uppercase tracking-widest border border-orange-100">
              {getAdventureLabel(survey.adventureType)}
            </span>

            {/* Description */}
            <div className="text-left">
              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={editedDescription}
                    onChange={e => setEditedDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-orange-400 rounded-xl px-3 py-2 text-sm font-outfit resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    disabled={savingDescription}
                    placeholder="Describe your survey…"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveDescription} disabled={savingDescription} className="flex-1 py-2 bg-orange-500 text-white font-bold font-outfit text-xs rounded-xl shadow-[0_2px_0_#c2410c] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer">
                      {savingDescription ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setIsEditingDescription(false)} className="px-3 py-2 bg-[#f5f5f5] text-[#777777] font-bold font-outfit text-xs rounded-xl cursor-pointer">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-[#777777] font-outfit leading-relaxed mb-1.5">
                    {survey.description || <span className="italic text-[#c8c8c8]">No description.</span>}
                  </p>
                  <button
                    onClick={() => { setEditedDescription(survey.description || ''); setIsEditingDescription(true); }}
                    className="text-xs font-bold font-outfit text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    {survey.description ? 'Edit' : '+ Add description'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl divide-y divide-[#f5f5f5]">
            {/* Status toggle */}
            <div className="flex items-center gap-3 p-4">
              <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center ${survey.status === 'published' ? 'bg-green-50' : 'bg-[#f5f5f5]'}`}>
                {survey.status === 'published'
                  ? <Rocket className="w-4 h-4 text-green-600" />
                  : <CircleStop className="w-4 h-4 text-[#afafaf]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold font-outfit text-[#3c3c3c]">Survey status</p>
                <p className="text-xs text-[#afafaf] font-outfit truncate">
                  {survey.status === 'published' ? 'Live — accepting responses' : 'Inactive'}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={survey.status === 'published'}
                aria-label="Toggle survey active"
                onClick={handleStatusToggle}
                disabled={updatingStatus || survey.status === 'draft'}
                className={`flex-shrink-0 relative h-6 w-11 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 ${
                  survey.status === 'published' ? 'bg-orange-500' : 'bg-[#e5e5e5]'
                } ${updatingStatus || survey.status === 'draft' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${survey.status === 'published' ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Expiration */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center ${survey.settings?.expiresAt ? 'bg-orange-50' : 'bg-[#f5f5f5]'}`}>
                  <Timer className={`w-4 h-4 ${survey.settings?.expiresAt ? 'text-orange-500' : 'text-[#afafaf]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold font-outfit text-[#3c3c3c]">Expiration</p>
                  <p className="text-xs font-outfit truncate">
                    {survey.settings?.expiresAt
                      ? (new Date(survey.settings.expiresAt) < new Date()
                        ? <span className="text-red-500">Expired</span>
                        : <span className="text-[#afafaf]">{formatDateTime(new Date(survey.settings.expiresAt))}</span>)
                      : <span className="text-[#c8c8c8]">No expiration set</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!showExpirationEdit && (
                    <button
                      onClick={openExpirationEdit}
                      disabled={updatingExpiration}
                      className="text-xs font-bold font-outfit text-orange-500 hover:text-orange-600 px-2.5 py-1.5 rounded-lg hover:bg-orange-50 transition-all cursor-pointer"
                    >
                      {survey.settings?.expiresAt ? 'Edit' : 'Set'}
                    </button>
                  )}
                  {survey.settings?.expiresAt && !showExpirationEdit && (
                    <button
                      onClick={handleClearExpiration}
                      disabled={updatingExpiration}
                      aria-label="Remove expiration"
                      className="w-7 h-7 flex items-center justify-center text-[#c8c8c8] hover:text-red-400 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline date/time picker panel */}
              <AnimatePresence>
                {showExpirationEdit && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest block">Date</label>
                          <input
                            type="date"
                            value={expirationDateInput}
                            onChange={e => setExpirationDateInput(e.target.value)}
                            min={new Date().toISOString().slice(0, 10)}
                            className="w-full px-3 py-2 text-sm font-outfit text-[#3c3c3c] bg-white border border-[#e5e5e5] rounded-xl focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition-all cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest block">Time</label>
                          <input
                            type="time"
                            value={expirationTimeInput}
                            onChange={e => setExpirationTimeInput(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-outfit text-[#3c3c3c] bg-white border border-[#e5e5e5] rounded-xl focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition-all cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveExpiration}
                          disabled={!expirationDateInput || updatingExpiration}
                          className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold font-outfit text-xs rounded-xl shadow-[0_2px_0_#c2410c] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
                        >
                          {updatingExpiration ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setShowExpirationEdit(false)}
                          className="px-4 py-2 bg-white border border-[#e5e5e5] text-[#777777] font-bold font-outfit text-xs rounded-xl hover:bg-[#f5f5f5] transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action pills */}
          <div className="flex flex-wrap gap-2">
            {responses.length > 0 && (
              <button
                onClick={handlePickWinner}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5e5e5] text-[#777777] hover:border-orange-300 hover:text-orange-500 font-bold font-outfit text-xs rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
              >
                <Trophy className="w-3.5 h-3.5" /> Pick winner
              </button>
            )}
            {responses.length > 0 && (
              CSV_EXPORT_TIERS.includes(survey.pricingTier || 'free') ? (
                <CSVLink
                  data={csvData}
                  filename={csvFilename}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5e5e5] text-[#777777] hover:border-orange-300 hover:text-orange-500 font-bold font-outfit text-xs rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
                >
                  ↓ Export CSV
                </CSVLink>
              ) : (
                <button disabled className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] border border-[#e5e5e5] text-[#c8c8c8] font-bold font-outfit text-xs rounded-xl opacity-60 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" /> CSV
                </button>
              )
            )}
          </div>

          {/* Payment banner */}
          {survey.paymentStatus === 'unpaid' && survey.pricingTier && survey.pricingTier !== 'free' && (
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold font-outfit text-[#3c3c3c] text-sm">Payment required</p>
                  <p className="text-xs text-[#afafaf] font-outfit">Complete to publish.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.values(PRICING_TIERS) as Array<{ id: PricingTier; name: string; price: number; responseLimit: number }>)
                  .filter(t => t.id !== 'free')
                  .map(tier => {
                    const selected = (selectedPaymentTier || survey.pricingTier) === tier.id;
                    return (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedPaymentTier(tier.id)}
                        disabled={processingPayment}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 ${selected ? 'border-orange-400 bg-orange-50' : 'border-[#e5e5e5] bg-[#f5f5f5] hover:border-[#c8c8c8]'}`}
                      >
                        <div className="font-bold font-outfit text-[#3c3c3c] text-sm">${tier.price}</div>
                        <div className="text-xs text-[#afafaf] font-outfit">{tier.name}</div>
                        <div className="text-[10px] text-[#c8c8c8] font-outfit mt-0.5">{tier.responseLimit.toLocaleString()} responses</div>
                      </button>
                    );
                  })}
              </div>
              <button
                onClick={handleCompletePayment}
                disabled={processingPayment}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold font-outfit text-sm rounded-xl shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {processingPayment ? 'Redirecting…' : `Pay $${PRICING_TIERS[selectedPaymentTier || survey.pricingTier!]?.price}`}
              </button>
            </div>
          )}

          {/* Response cap banner */}
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
        </div>

        {/* RIGHT: Tab panel */}
        <div className="flex-1 min-w-0">

          {/* Tab bar */}
          <div className="flex items-center gap-0.5 border-b border-[#e5e5e5] mb-5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold font-outfit border-b-2 -mb-px transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-[#3c3c3c] text-[#3c3c3c]'
                    : 'border-transparent text-[#afafaf] hover:text-[#555555] hover:border-[#e5e5e5]'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#3c3c3c] text-white'
                      : 'bg-[#f0f0f0] text-[#c8c8c8]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Overview tab ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            responses.length === 0 ? (
              <div className="bg-white border border-[#e5e5e5] rounded-2xl p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Share2 className="w-7 h-7 text-orange-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-outfit text-[#3c3c3c] mb-1">No responses yet</h2>
                  <p className="text-sm text-[#afafaf] font-outfit">Share your survey link to start collecting answers.</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(surveyUrl); showToast('Link copied!'); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold font-outfit text-sm rounded-xl shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" /> Copy survey link
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Velocity chart */}
                {responsesOverTime.length > 1 && (
                  <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
                    <p className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest mb-4">Response velocity</p>
                    <LineChartComponent data={responsesOverTime.map(({ name, value }) => ({ name, value }))} height={180} />
                  </div>
                )}

                {/* Completion + avg time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 flex items-center gap-4">
                    <CompletionRateChart completedCount={responses.length} totalCount={responses.length} size={72} />
                    <div>
                      <p className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest">Completion rate</p>
                      <p className="text-2xl font-bold text-[#3c3c3c] tabular-nums">100%</p>
                      <p className="text-xs text-[#afafaf] font-outfit">{responses.length} completed</p>
                    </div>
                  </div>
                  <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 flex flex-col justify-center">
                    <p className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest mb-1">Avg. completion time</p>
                    <p className="text-2xl font-bold text-orange-500 tabular-nums">{formatDuration(avgCompletionTime)}</p>
                    <p className="text-xs text-[#afafaf] font-outfit mt-0.5">per respondent</p>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ── Questions tab ─────────────────────────────────────────────── */}
          {activeTab === 'questions' && (
            <div className="space-y-3">
              {questionAggregations.length === 0 ? (
                <div className="bg-white border border-[#e5e5e5] rounded-2xl p-10 text-center">
                  <p className="text-sm text-[#afafaf] font-outfit">No responses yet — question breakdowns will appear here.</p>
                </div>
              ) : (
                questionAggregations.map((agg: QuestionAggregation, i: number) => (
                  <motion.div
                    key={agg.questionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white border border-[#e5e5e5] rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="w-6 h-6 flex-shrink-0 rounded-lg bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center text-[11px] font-bold font-outfit text-[#afafaf]">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <span className={`inline-block text-[9px] font-bold font-outfit uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1.5 ${
                          agg.type === 'rating'         ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          agg.type === 'text'           ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                          'bg-[#f5f5f5] text-[#777777] border-[#e5e5e5]'
                        }`}>{agg.type.replace('_', ' ')}</span>
                        <h3 className="font-bold font-outfit text-[#3c3c3c] text-sm leading-snug">{agg.questionText}</h3>
                      </div>
                    </div>
                    <div className="bg-[#fafafa] rounded-xl p-4 border border-[#f0f0f0]">
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
                ))
              )}
            </div>
          )}

          {/* ── Responses tab ─────────────────────────────────────────────── */}
          {activeTab === 'responses' && (
            <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#f5f5f5] flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold font-outfit text-[#3c3c3c]">Respondent log</p>
                  <p className="text-xs text-[#afafaf] font-outfit">
                    {responses.length === 0
                      ? 'No responses yet'
                      : `${responses.length} total · page ${currentPage} of ${Math.max(1, totalPages)}`}
                  </p>
                </div>
                {responses.length > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-xl flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-bold font-outfit text-orange-500 uppercase tracking-widest">Live</span>
                  </span>
                )}
              </div>

              {paginatedResponses.length === 0 ? (
                <div className="p-10 text-center text-[#afafaf] text-sm font-outfit">No responses yet</div>
              ) : (
                <div className="divide-y divide-[#f5f5f5]">
                  {paginatedResponses.map((response) => (
                    <div key={response.id}>
                      <button
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition-colors text-left cursor-pointer"
                        onClick={() => setExpandedRows(prev => {
                          const next = new Set(prev);
                          if (next.has(response.id)) { next.delete(response.id); } else { next.add(response.id); }
                          return next;
                        })}
                      >
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center">
                          <User className="w-4 h-4 text-[#afafaf]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold font-outfit text-sm text-[#3c3c3c] truncate">{response.respondentName || 'Anonymous'}</p>
                          <p className="text-xs text-[#afafaf] font-outfit truncate">{formatDateTime(response.completedAt)}</p>
                        </div>
                        <span className={`flex-shrink-0 text-[10px] font-bold font-outfit px-2 py-1 rounded-lg border transition-all ${
                          expandedRows.has(response.id)
                            ? 'bg-[#3c3c3c] text-white border-[#3c3c3c]'
                            : 'bg-white text-[#afafaf] border-[#e5e5e5]'
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
                            <div className="bg-[#fafafa] px-5 py-4 border-t border-[#f0f0f0] space-y-2">
                              {response.respondentEmail && (
                                <p className="text-xs text-[#777777] font-outfit mb-3 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 flex-shrink-0 text-[#afafaf]" />
                                  {response.respondentEmail}
                                </p>
                              )}
                              {survey.questions.map((q, qi) => (
                                <div key={q.id} className="bg-white rounded-xl p-3 border border-[#e5e5e5]">
                                  <p className="text-[10px] font-bold font-outfit text-[#afafaf] uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-[#f5f5f5] flex items-center justify-center text-[8px] font-bold">{qi + 1}</span>
                                    <span className="truncate">{q.question}</span>
                                  </p>
                                  <p className="text-sm font-bold font-outfit text-[#3c3c3c]">{getAnswerValue(response, q.id)}</p>
                                </div>
                              ))}
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
                <div className="px-5 py-4 border-t border-[#f5f5f5] flex items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-bold font-outfit bg-white border border-[#e5e5e5] text-[#777777] rounded-xl disabled:opacity-30 hover:border-orange-300 hover:text-orange-500 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs font-bold font-outfit text-[#afafaf] tabular-nums">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-bold font-outfit bg-white border border-[#e5e5e5] text-[#777777] rounded-xl disabled:opacity-30 hover:border-orange-300 hover:text-orange-500 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-[#e5e5e5] max-w-sm w-full p-6 text-center shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold font-outfit text-[#3c3c3c] mb-2">Delete survey?</h3>
              <p className="text-[#777777] font-outfit text-sm mb-6">
                Delete <span className="font-bold text-[#3c3c3c]">&quot;{survey.title}&quot;</span>? This is permanent — all responses will be lost.
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={handleDelete} disabled={deleting} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold font-outfit text-sm rounded-xl shadow-[0_3px_0_#b91c1c] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer">
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="w-full py-2.5 bg-[#f5f5f5] text-[#777777] font-bold font-outfit text-sm rounded-xl hover:bg-[#ebebeb] transition-all cursor-pointer">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isPickingWinner && setShowWinnerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-[#e5e5e5] max-w-sm w-full p-6 text-center shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              {isPickingWinner ? (
                <div className="py-8">
                  <motion.div
                    animate={reducedMotion ? {} : { rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <Dice5 className="w-7 h-7 text-orange-500" />
                  </motion.div>
                  <p className="font-bold font-outfit text-[#3c3c3c] text-lg">{selectedWinner?.respondentName || '…'}</p>
                  <p className="text-[#afafaf] font-outfit text-sm mt-1">Picking winner…</p>
                </div>
              ) : selectedWinner ? (
                <div ref={winnerCardRef} className="py-4">
                  <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-7 h-7 text-orange-500" />
                  </div>
                  <p className="text-[11px] font-bold font-outfit text-orange-500 uppercase tracking-widest mb-2">Winner</p>
                  <p className="text-2xl font-bold font-outfit text-[#3c3c3c] mb-1">{selectedWinner.respondentName || 'Anonymous'}</p>
                  {selectedWinner.respondentEmail && <p className="text-sm text-[#777777] font-outfit mb-4">{selectedWinner.respondentEmail}</p>}
                  <p className="text-xs text-[#afafaf] font-outfit">Responded {formatDateTime(selectedWinner.completedAt)}</p>
                </div>
              ) : null}

              {!isPickingWinner && selectedWinner && (
                <div className="flex flex-col gap-2 mt-4">
                  <button onClick={handleDownloadWinnerImage} disabled={isSavingWinnerImage} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold font-outfit text-sm rounded-xl shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
                    {isSavingWinnerImage ? 'Saving…' : 'Download image'}
                  </button>
                  <button onClick={handlePickWinner} className="w-full py-2.5 bg-[#f5f5f5] border border-[#e5e5e5] text-[#777777] hover:text-orange-500 hover:border-orange-200 font-bold font-outfit text-sm rounded-xl transition-all cursor-pointer">
                    Pick again
                  </button>
                  <button onClick={() => setShowWinnerModal(false)} className="w-full py-2.5 bg-white border border-[#e5e5e5] text-[#afafaf] font-bold font-outfit text-sm rounded-xl hover:bg-[#f5f5f5] transition-all cursor-pointer">
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
