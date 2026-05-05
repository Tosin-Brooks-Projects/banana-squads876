'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { 
  PlusCircle, 
  Trash2, 
  ChevronRight, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Users, 
  RefreshCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';
import { BentoGrid, BentoCard } from '@/components/ui/BentoGrid';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscribeToUserSurveys, getSurveyQuickStats, deleteSurvey } from '@/lib/firebase/firestore';
import { getAdventureImage, getAdventureLabel, formatDate, formatDuration } from '@/lib/utils/helpers';
import { Survey, SurveyQuickStats } from '@/lib/types';

interface SurveyWithStats extends Survey {
  stats: SurveyQuickStats;
}

// Premium Status Badge
function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus?: string }) {
  const isPublished = status === 'published';
  const isClosed = status === 'closed';
  const isUnpaid = paymentStatus === 'unpaid';

  return (
    <span className={`
      px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5
      ${isPublished ? 'bg-green-500/10 text-green-600' : 
        isClosed ? 'bg-neutral-200 text-neutral-600' : 
        isUnpaid ? 'bg-amber-500/10 text-amber-600' : 'bg-brand-500/10 text-brand-600'}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500 animate-pulse' : 'bg-current opacity-40'}`} />
      {isPublished ? 'Live' : isClosed ? 'Closed' : isUnpaid ? 'Unpaid' : 'Draft'}
    </span>
  );
}

// Tactile Survey Item
function SurveyItem({ survey, index, onDelete }: { survey: SurveyWithStats; index: number; onDelete: (e: React.MouseEvent, s: SurveyWithStats) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/dashboard/${survey.id}`}>
        <div className="relative p-4 sm:p-6 flex items-center gap-3 sm:gap-6 transition-all duration-300 bg-white border-4 border-gray-100 rounded-2xl sm:rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.03)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.03)] hover:shadow-none hover:translate-y-[4px] hover:border-orange-200">
          {/* Icon */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all p-1.5 sm:p-2 group-hover:border-orange-100">
            <img
              src={getAdventureImage(survey.adventureType)}
              alt={survey.adventureType}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm sm:text-xl font-black text-gray-900 truncate tracking-tight group-hover:text-orange-600 transition-colors">
                {survey.title}
              </h3>
              <StatusBadge status={survey.status} paymentStatus={survey.paymentStatus} />
            </div>
            <p className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">
              {getAdventureLabel(survey.adventureType)} · {formatDate(survey.createdAt)}
            </p>
          </div>

          {/* Stats + actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-black text-gray-900 tabular-nums leading-none">{survey.stats.totalResponses}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Responses</p>
            </div>
            <div className="text-right sm:hidden">
              <p className="text-lg font-black text-gray-900 tabular-nums">{survey.stats.totalResponses}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase">resp.</p>
            </div>
            <button
              onClick={(e) => onDelete(e, survey)}
              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-orange-500 text-white shadow-[0_4px_0_#c2410c] group-hover:bg-orange-600 transition-all">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={4} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { firebaseUser, user } = useAuthContext();
  const [surveys, setSurveys] = useState<SurveyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Toast State
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
    } catch (err) {
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalResponses = surveys.reduce((acc, s) => acc + s.stats.totalResponses, 0);
  const activeSurveys = surveys.filter((s) => s.status === 'published').length;

  if (loading) {
    return (
      <div className="space-y-12 py-10">
        <div className="h-10 w-64 bg-neutral-200 rounded-full animate-pulse" />
        <BentoGrid>
          <BentoCard className="col-span-2 h-40 bg-neutral-100/50 border-dashed animate-pulse" />
          <BentoCard className="h-40 bg-neutral-100/50 border-dashed animate-pulse" />
        </BentoGrid>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 w-full bg-neutral-100/50 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 sm:w-48 sm:h-48 bg-orange-50 rounded-[40px] border-4 border-orange-100 p-6 sm:p-8 flex items-center justify-center mb-8 sm:mb-10 shadow-xl relative"
        >
          <div className="absolute inset-4 bg-orange-200 blur-2xl opacity-20 rounded-full" />
          <img src="/orange-kea-mascot.png" alt="Mascot" className="w-full h-full object-contain relative z-10" />
        </motion.div>
        
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 mb-3 sm:mb-4">
          No adventures yet!
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-md mb-8 sm:mb-10 font-medium">
          Ready to turn boring forms into engaging quests? Create your first survey adventure in seconds.
        </p>
        <Link href="/dashboard/create?new=true">
          <button className="px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl font-black text-xl border-b-8 border-orange-700 active:border-b-0 active:translate-y-2 transition-all flex items-center gap-3 shadow-xl">
            Start First Quest <PlusCircle className="w-6 h-6" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 sm:space-y-12 sm:py-10">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Command Center</span>
           </div>
           <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-gray-900">
             Quest <span className="text-orange-500">Board</span>
           </h1>
        </div>
        <Link href="/dashboard/create?new=true">
          <button className="flex-shrink-0 px-4 sm:px-8 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest border-b-4 border-orange-700 transition-all active:border-b-0 active:translate-y-1 shadow-lg shadow-orange-500/20 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">New Mission</span>
            <span className="sm:hidden">New</span>
          </button>
        </Link>
      </header>

      {/* Stats Tactile Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Responses */}
        <div className="bg-white border-4 border-gray-100 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.02)] group hover:border-indigo-100 transition-all">
           <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 border-2 border-indigo-100">
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest hidden sm:block">Global XP</span>
           </div>
           <div>
              <p className="text-3xl sm:text-5xl font-black text-gray-900 tabular-nums leading-none">
                {totalResponses}
              </p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 sm:mt-3">Total Responses</p>
           </div>
        </div>

        {/* Active Surveys */}
        <div className="bg-white border-4 border-gray-100 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.02)] group hover:border-green-100 transition-all">
           <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-green-50 text-green-600 border-2 border-green-100">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] font-black text-green-300 uppercase tracking-widest hidden sm:block">Active Quests</span>
           </div>
           <div>
              <p className="text-3xl sm:text-5xl font-black text-gray-900 tabular-nums leading-none">
                {activeSurveys}
              </p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 sm:mt-3">Currently Live</p>
           </div>
        </div>

        {/* Total Surveys */}
        <div className="bg-white border-4 border-gray-100 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.02)] group hover:border-orange-100 transition-all">
           <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 border-2 border-orange-100">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] font-black text-orange-300 uppercase tracking-widest hidden sm:block">Mission History</span>
           </div>
           <div>
              <p className="text-3xl sm:text-5xl font-black text-gray-900 tabular-nums leading-none">
                {surveys.length}
              </p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 sm:mt-3">Total Created</p>
           </div>
        </div>

        {/* Mascot Card */}
        <div className="bg-gray-900 border-4 border-gray-900 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute bottom-[-15%] right-[-10%] w-32 h-32 opacity-30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 pointer-events-none">
              <img src="/orange-kea-mascot.png" alt="" className="w-full h-full object-contain" />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                 <p className="text-white font-black text-[10px] uppercase tracking-widest">Elite Surveyor</p>
              </div>
              <p className="text-white font-black text-lg leading-tight mb-1">Master League</p>
              <p className="text-white/40 text-[10px] font-bold uppercase">Top 5% Global ✨</p>
           </div>
           <div className="mt-4 flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 w-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Surveys List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-duo-graphite">Daily Challenges</h2>
          <div className="flex items-center gap-2 text-[10px] font-black text-duo-silver uppercase tracking-wider">
             <RefreshCcw className="w-3 h-3" />
             Synced
          </div>
        </div>
        <div className="space-y-4">
          {surveys.map((survey, index) => (
            <SurveyItem 
              key={survey.id} 
              survey={survey} 
              index={index} 
              onDelete={handleDeleteClick} 
            />
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[100]"
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                <Trash2 className="text-red-500 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">Delete adventure?</h3>
              <p className="text-neutral-500 mb-8 font-medium">
                Are you sure you want to delete <span className="text-neutral-900 font-bold">&quot;{surveyToDelete?.title}&quot;</span>? This action is permanent.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
