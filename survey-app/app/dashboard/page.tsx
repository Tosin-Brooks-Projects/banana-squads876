'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  PlusCircle,
  Trash2,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscribeToUserSurveys, getSurveyQuickStats, deleteSurvey } from '@/lib/firebase/firestore';
import { getAdventureImage, getAdventureLabel, formatDate } from '@/lib/utils/helpers';
import { Survey, SurveyQuickStats } from '@/lib/types';

interface SurveyWithStats extends Survey {
  stats: SurveyQuickStats;
}

type FilterStatus = 'all' | 'published' | 'draft' | 'closed';

function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus?: string }) {
  const isPublished = status === 'published';
  const isClosed = status === 'closed';
  const isUnpaid = paymentStatus === 'unpaid';

  return (
    <span className={`
      px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0
      ${isPublished ? 'bg-green-50 text-green-600 border border-green-100' :
        isClosed ? 'bg-[#f5f5f5] text-[#777777] border border-[#e5e5e5]' :
        isUnpaid ? 'bg-amber-50 text-amber-600 border border-amber-100' :
        'bg-orange-50 text-orange-600 border border-orange-100'}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPublished ? 'bg-green-500 animate-pulse' : 'bg-current opacity-40'}`} />
      {isPublished ? 'Live' : isClosed ? 'Closed' : isUnpaid ? 'Unpaid' : 'Draft'}
    </span>
  );
}

function CompletionBar({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.max(0, rate));
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-orange-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[11px] font-outfit text-[#afafaf] tabular-nums w-[28px] text-right flex-shrink-0">{pct}%</span>
    </div>
  );
}

function LastSeen({ date }: { date: Date | null | undefined }) {
  if (!date) return <span className="text-[11px] font-outfit text-[#e5e5e5]">—</span>;
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  let label: string;
  if (mins < 60) label = `${mins}m ago`;
  else if (hours < 24) label = `${hours}h ago`;
  else if (days === 1) label = 'yesterday';
  else if (days < 30) label = `${days}d ago`;
  else label = formatDate(date);
  return <span className="text-[11px] font-outfit text-[#afafaf]">{label}</span>;
}

function SurveyItem({ survey, index, onDelete }: { survey: SurveyWithStats; index: number; onDelete: (e: React.MouseEvent, s: SurveyWithStats) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="group"
    >
      <Link href={`/dashboard/${survey.id}`}>
        <div className="relative px-4 py-3.5 flex items-center gap-3 transition-colors duration-150 bg-white border border-[#e5e5e5] rounded-2xl hover:border-orange-200 hover:bg-orange-50/30">
          {/* Icon */}
          <div className="w-9 h-9 flex-shrink-0 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl flex items-center justify-center p-1.5">
            <img
              src={getAdventureImage(survey.adventureType)}
              alt={survey.adventureType}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-[#3c3c3c] font-outfit truncate flex-1 min-w-0">
                {survey.title}
              </h3>
              <StatusBadge status={survey.status} paymentStatus={survey.paymentStatus} />
            </div>
            <p className="text-[11px] font-outfit text-[#afafaf] truncate">
              {getAdventureLabel(survey.adventureType)}
            </p>
          </div>

          {/* Completion bar — hidden on mobile */}
          <div className="hidden md:block w-[120px] flex-shrink-0">
            <p className="text-[10px] font-outfit text-[#c8c8c8] mb-1">Completion</p>
            <CompletionBar rate={Math.round(survey.stats.completionRate ?? 0)} />
          </div>

          {/* Response count */}
          <div className="text-right flex-shrink-0 w-[52px]">
            <p className="text-base font-bold text-[#3c3c3c] font-outfit tabular-nums leading-none">{survey.stats.totalResponses}</p>
            <p className="text-[10px] font-outfit text-[#afafaf] mt-0.5">resp.</p>
          </div>

          {/* Last response — hidden on smaller screens */}
          <div className="hidden lg:flex flex-col items-end flex-shrink-0 w-[72px] gap-0.5">
            <div className="flex items-center gap-1 text-[#c8c8c8]">
              <Clock className="w-2.5 h-2.5" />
              <span className="text-[10px] font-outfit">last</span>
            </div>
            <LastSeen date={survey.stats.lastResponseDate} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => onDelete(e, survey)}
              aria-label={`Delete ${survey.title}`}
              className="p-2 text-[#e5e5e5] hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-[0_3px_0_#c2410c] group-hover:bg-orange-600 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const FILTER_TABS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Live', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
];

export default function DashboardPage() {
  const { firebaseUser } = useAuthContext();
  const [surveys, setSurveys] = useState<SurveyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<SurveyWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSurveys = useCallback(() => {
    if (!firebaseUser) return () => { };
    setLoading(true);
    try {
      const unsubscribe = subscribeToUserSurveys(firebaseUser.uid, async (fetchedSurveys) => {
        const surveysWithStats = await Promise.all(
          fetchedSurveys.map(async (survey) => {
            try {
              const stats = await getSurveyQuickStats(survey.id);
              return { ...survey, stats };
            } catch {
              return { ...survey, stats: { totalResponses: 0, completedResponses: 0, startedResponses: 0, completionRate: 0, averageCompletionTime: 0, lastResponseDate: null } };
            }
          })
        );
        setSurveys(surveysWithStats);
        setLoading(false);
      });
      return unsubscribe;
    } catch {
      setError('Connection failed');
      setLoading(false);
      return () => { };
    }
  }, [firebaseUser]);

  useEffect(() => {
    const unsubscribe = loadSurveys();
    return unsubscribe;
  }, [loadSurveys]);

  const handleDeleteClick = (e: React.MouseEvent, survey: SurveyWithStats) => {
    e.preventDefault();
    e.stopPropagation();
    setSurveyToDelete(survey);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!surveyToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSurvey(surveyToDelete.id);
      setDeleteModalOpen(false);
      setSurveyToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalResponses = surveys.reduce((acc, s) => acc + s.stats.totalResponses, 0);
  const activeSurveys = surveys.filter((s) => s.status === 'published').length;
  const avgCompletionRate = surveys.length > 0
    ? Math.round(surveys.reduce((acc, s) => acc + (s.stats.completionRate ?? 0), 0) / surveys.length)
    : 0;

  const filteredSurveys = filter === 'all'
    ? surveys
    : surveys.filter((s) => s.status === filter);

  if (loading) {
    return (
      <div className="space-y-6 py-2">
        <div className="h-8 w-48 bg-[#e5e5e5] rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-[#f5f5f5] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 w-full bg-[#f5f5f5] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mb-6">
          <FileText className="w-9 h-9 text-orange-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-[#3c3c3c] font-outfit mb-2 tracking-tight">
          No surveys yet
        </h2>
        <p className="text-[#afafaf] font-outfit text-sm max-w-xs mb-8">
          Create your first survey and start collecting responses.
        </p>
        <Link
          href="/dashboard/create?new=true"
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold font-outfit text-sm shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          <PlusCircle className="w-4 h-4" />
          Create survey
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-[#3c3c3c] font-outfit tracking-tight">
          Your surveys
        </h1>
        <Link
          href="/dashboard/create?new=true"
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold font-outfit text-sm shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New survey</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Stats grid — hero + 3 supports */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Hero: total responses */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col gap-3 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-orange-600 font-outfit tabular-nums leading-none tracking-tight">{totalResponses}</p>
            <p className="text-[11px] font-outfit text-orange-400 mt-1">Total responses</p>
          </div>
        </div>

        {/* Live surveys */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#3c3c3c] font-outfit tabular-nums leading-none">{activeSurveys}</p>
            <p className="text-[11px] font-outfit text-[#afafaf] mt-1">Live surveys</p>
          </div>
        </div>

        {/* Total surveys */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#777777]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#3c3c3c] font-outfit tabular-nums leading-none">{surveys.length}</p>
            <p className="text-[11px] font-outfit text-[#afafaf] mt-1">Total surveys</p>
          </div>
        </div>

        {/* Avg completion */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#3c3c3c] font-outfit tabular-nums leading-none">{avgCompletionRate}%</p>
            <p className="text-[11px] font-outfit text-[#afafaf] mt-1">Avg. completion</p>
          </div>
        </div>
      </div>

      {/* Filter tabs + survey list */}
      <div className="space-y-3">
        {/* Filter row */}
        <div className="flex items-center gap-1.5">
          {FILTER_TABS.map((tab) => {
            const count = tab.value === 'all' ? surveys.length : surveys.filter(s => s.status === tab.value).length;
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold font-outfit transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer ${
                  isActive
                    ? 'bg-[#3c3c3c] text-white'
                    : 'bg-white border border-[#e5e5e5] text-[#777777] hover:border-[#c8c8c8] hover:text-[#3c3c3c]'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-bold tabular-nums ${isActive ? 'text-white/60' : 'text-[#afafaf]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Survey list */}
        <AnimatePresence mode="popLayout">
          {filteredSurveys.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <p className="text-[#afafaf] font-outfit text-sm">No {filter === 'all' ? '' : filter} surveys yet.</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredSurveys.map((survey, index) => (
                <SurveyItem
                  key={survey.id}
                  survey={survey}
                  index={index}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-[100]"
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mb-4">
                <Trash2 className="text-red-500 w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#3c3c3c] font-outfit mb-1">Delete survey?</h3>
              <p className="text-[#777777] font-outfit text-sm mb-6">
                <span className="text-[#3c3c3c] font-bold">&quot;{surveyToDelete?.title}&quot;</span> and all its responses will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#777777] font-bold font-outfit text-sm rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#afafaf] focus-visible:ring-offset-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold font-outfit text-sm rounded-xl shadow-[0_3px_0_#b91c1c] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
