'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';
import {
  Sparkles,
  ChevronLeft,
  Check,
  Rocket,
  Lock,
  Zap,
  Target,
  Database,
  BarChart3,
  List,
  GitBranch,
  MessageSquare,
  EyeOff,
  User,
  Globe,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/LoadingStates';
import SurveySuccessModal from '@/components/SurveySuccessModal';
import { AdventureType, Question, PricingTier, FREE_TIER_THEMES } from '@/lib/types';
import { getAdventureLabel, getAdventureImage } from '@/lib/utils/helpers';
import {
  createFreeSurveyAtomic,
  checkSlugExists,
  getSuggestedSlugs,
  getUser,
} from '@/lib/firebase/firestore';
import TierSelector from '@/components/pricing/TierSelector';
import AIUpgradeModal from '@/components/AIUpgradeModal';
import {
  checkRateLimit,
  recordRequest,
  RATE_LIMITS,
  formatResetTime,
} from '@/lib/utils/rateLimit';

type QuestionCountRange = '3-5' | '5-10' | '10-15' | '15+';
type QuestionStyle = 'mostly-options' | 'balanced' | 'mostly-open';
type AnonymityPreference = 'anonymous' | 'collect-info';

interface SurveyPreferences {
  questionCount: QuestionCountRange;
  questionStyle: QuestionStyle;
  anonymity: AnonymityPreference;
}

interface FormData {
  context: string;
  theme: AdventureType;
  preferences: SurveyPreferences;
  questions: Question[];
  title: string;
  slug: string;
  thankYouMessage: string;
  pricingTier: PricingTier | null;
}

const STORAGE_KEY = 'survey-draft';

const THEMES: { value: AdventureType; label: string; description: string; image: string; isPremium?: boolean }[] = [
  { value: 'classic',          label: 'Classic',  description: 'Clean and minimal for any goal.',   image: '/theme-classic.png' },
  { value: 'ice-cream-sundae', label: 'Sundae',   description: 'Build a delicious reward.',         image: '/theme-sundae.png' },
  { value: 'pizza-builder',    label: 'Pizza',    description: 'Craft the perfect slice.',           image: '/theme-pizza-2d.svg', isPremium: true },
  { value: 'garden-grower',    label: 'Garden',   description: 'Watch your responses bloom.',        image: '/theme-garden.png',   isPremium: true },
  { value: 'dream-home',       label: 'Home',     description: 'Design a home of feedback.',         image: '/theme-home.png',     isPremium: true },
  { value: 'coffee-brewer',    label: 'Coffee',   description: 'Brew deep insights.',               image: '/theme-coffee.png',   isPremium: true },
];

const DEFAULT_PREFERENCES: SurveyPreferences = {
  questionCount: '5-10',
  questionStyle: 'balanced',
  anonymity: 'anonymous',
};

const DEFAULT_FORM_DATA: FormData = {
  context: '',
  theme: 'classic',
  preferences: DEFAULT_PREFERENCES,
  questions: [],
  title: '',
  slug: '',
  thankYouMessage: '',
  pricingTier: null,
};

const EXAMPLE_PROMPTS = [
  { label: 'Product feedback', text: 'I want to collect feedback on my product from existing customers to understand what features to build next.' },
  { label: 'Employee satisfaction', text: 'I want to run an employee satisfaction survey to understand team morale and identify areas for improvement.' },
  { label: 'Event feedback', text: 'I want to collect feedback after our event to understand what went well and what to improve for next time.' },
  { label: 'NPS survey', text: 'I want to measure customer loyalty and likelihood to recommend our product to others.' },
];

const QUESTION_COUNT_OPTIONS: { value: QuestionCountRange; label: string; description: string; icon: React.ElementType }[] = [
  { value: '3-5',   label: '3–5 questions',   description: 'Quick, high completion rate.',   icon: Zap },
  { value: '5-10',  label: '5–10 questions',  description: 'Balanced for most surveys.',     icon: Target },
  { value: '10-15', label: '10–15 questions', description: 'Detailed data collection.',      icon: BarChart3 },
  { value: '15+',   label: '15+ questions',   description: 'Comprehensive research.',         icon: Database },
];

const QUESTION_STYLE_OPTIONS: { value: QuestionStyle; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'mostly-options', label: 'Multiple choice', description: 'Mostly choice questions. Low friction.',    icon: List },
  { value: 'balanced',       label: 'Mixed',           description: 'Mix of choice and open-ended questions.',   icon: GitBranch },
  { value: 'mostly-open',    label: 'Open-ended',      description: 'Mostly free-text responses.',               icon: MessageSquare },
];

const ANONYMITY_OPTIONS: { value: AnonymityPreference; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'anonymous',    label: 'Anonymous',        description: '100% anonymous. No personal data collected.',  icon: EyeOff },
  { value: 'collect-info', label: 'Collect contact',  description: 'Capture respondent names and email addresses.', icon: User },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const AI_GENERATION_STATES = [
  { text: 'Analyzing your survey context…' },
  { text: 'Structuring question flow…' },
  { text: 'Generating question options…' },
  { text: 'Validating question logic…' },
  { text: 'Finalizing your survey…' },
];

const STEPS = [
  { id: 1, label: 'Context' },
  { id: 2, label: 'Theme' },
  { id: 3, label: 'Settings' },
  { id: 4, label: 'Review' },
];

// ── Reusable option row ──────────────────────────────────────────────────────
function OptionRow<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: { value: T; label: string; description: string; icon: React.ElementType };
  selected: boolean;
  onSelect: (v: T) => void;
}) {
  const Icon = option.icon;
  return (
    <button
      onClick={() => onSelect(option.value)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer ${
        selected
          ? 'bg-orange-50 border-orange-400'
          : 'bg-white border-[#e5e5e5] hover:border-[#c8c8c8]'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'bg-orange-100' : 'bg-[#f5f5f5]'
      }`}>
        <Icon className={`w-4 h-4 ${selected ? 'text-orange-500' : 'text-[#afafaf]'}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold font-outfit ${selected ? 'text-orange-600' : 'text-[#3c3c3c]'}`}>
          {option.label}
        </p>
        <p className="text-[11px] font-outfit text-[#afafaf] leading-tight mt-0.5">{option.description}</p>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
        selected ? 'border-orange-500 bg-orange-500' : 'border-[#e5e5e5]'
      }`}>
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}

export default function CreateSurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, setSlugSuggestions] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSurvey, setCreatedSurvey] = useState<{ id: string; url: string } | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [, setHasUsedFreeTier] = useState(false);
  const [showAIUpgradeModal, setShowAIUpgradeModal] = useState(false);
  const [paidForAI, setPaidForAI] = useState(false);
  const [paidTier, setPaidTier] = useState<PricingTier | null>(null);
  const [, setShouldAutoGenerate] = useState(false);

  useEffect(() => {
    async function checkFreeTierUsage() {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        setHasUsedFreeTier(userData?.hasUsedFreeTier || false);
      }
    }
    checkFreeTierUsage();
  }, [firebaseUser]);

  const upgradeCheckedRef = useRef(false);
  useEffect(() => {
    if (upgradeCheckedRef.current) return;
    upgradeCheckedRef.current = true;
    const upgraded = searchParams.get('upgraded');
    const tier = searchParams.get('tier') as PricingTier | null;
    if (upgraded === 'true' && tier) {
      setPaidForAI(true);
      setPaidTier(tier);
      setShouldAutoGenerate(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    if (paidForAI && paidTier) setFormData(prev => ({ ...prev, pricingTier: paidTier }));
  }, [paidForAI, paidTier]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || DEFAULT_FORM_DATA);
        setCurrentStep(parsed.currentStep || 1);
        if (parsed.paidForAI) { setPaidForAI(true); setPaidTier(parsed.paidTier); }
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep, paidForAI, paidTier }));
  }, [formData, currentStep, paidForAI, paidTier]);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 50);

  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || !firebaseUser) return;
    setIsCheckingSlug(true);
    try {
      const exists = await checkSlugExists(firebaseUser.uid, slug);
      setSlugAvailable(!exists);
      if (exists) {
        const suggestions = await getSuggestedSlugs(firebaseUser.uid, slug);
        setSlugSuggestions(suggestions);
      }
    } catch { setSlugAvailable(true); }
    finally { setIsCheckingSlug(false); }
  }, [firebaseUser]);

  useEffect(() => {
    const t = setTimeout(() => { if (formData.slug) checkSlugAvailability(formData.slug); }, 500);
    return () => clearTimeout(t);
  }, [formData.slug, checkSlugAvailability]);

  const generateQuestionsWithAI = async () => {
    const result = checkRateLimit(RATE_LIMITS.questionGeneration);
    if (!result.allowed) { setErrors({ general: `Rate limited. Try in ${formatResetTime(result.resetIn)}.` }); return; }
    setErrors({});
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: formData.context, theme: formData.theme, preferences: formData.preferences }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      recordRequest(RATE_LIMITS.questionGeneration);
      setFormData(prev => ({
        ...prev,
        questions: data.questions.map((q: Question, i: number) => ({ ...q, id: generateId(), order: i })),
      }));
      setCurrentStep(4);
    } catch { setErrors({ general: 'Failed to generate questions. Please try again.' }); }
    finally { setIsGenerating(false); }
  };

  const handleCreateSurvey = async () => {
    if (!firebaseUser) return;
    setIsCreating(true);
    try {
      const surveyData: Omit<import('@/lib/types').Survey, 'id'> = {
        userId: firebaseUser.uid,
        title: formData.title,
        slug: formData.slug,
        adventureType: formData.theme,
        questions: formData.questions,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
        pricingTier: formData.pricingTier || 'free',
        settings: {
          allowAnonymous: formData.preferences.anonymity !== 'collect-info',
          showProgressBar: true,
          randomizeQuestions: false,
        },
      };
      const id = await createFreeSurveyAtomic(firebaseUser.uid, surveyData);
      setCreatedSurvey({ id, url: `${user?.username}/${formData.slug}` });
      setShowSuccessModal(true);
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
      setErrors({ general: 'Failed to create survey. Please try again.' });
    } finally { setIsCreating(false); }
  };

  const handleCreateAnother = () => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); };
  const handleGoToDashboard = () => router.push('/dashboard');
  const handleContinueManually = () => { setShowAIUpgradeModal(false); setCurrentStep(4); };

  const selectedTheme = THEMES.find(t => t.value === formData.theme) ?? THEMES[0];

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-10">

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-3 mb-10">
        <button
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/dashboard')}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#e5e5e5] text-[#777777] hover:text-[#3c3c3c] hover:border-[#c8c8c8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>

        <div className="flex items-center flex-1 gap-0">
          {STEPS.map((step, i) => {
            const isDone    = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isCurrent ? 'bg-[#3c3c3c] text-white shadow-[0_2px_0_#1a1a1a]' :
                    isDone    ? 'bg-orange-500 text-white' :
                                'bg-white border border-[#e5e5e5] text-[#afafaf]'
                  }`}>
                    {isDone
                      ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      : <span className="text-[11px] font-bold font-outfit">{step.id}</span>
                    }
                  </div>
                  <span className={`text-[10px] font-outfit font-bold hidden sm:block transition-colors ${
                    isCurrent ? 'text-[#3c3c3c]' : isDone ? 'text-orange-500' : 'text-[#c8c8c8]'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${isDone ? 'bg-orange-300' : 'bg-[#e5e5e5]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Steps ── */}
      <AnimatePresence mode="wait">

        {/* ── Step 1: Context ── */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#3c3c3c] font-outfit mb-1.5">
                What is this survey about?
              </h1>
              <p className="text-[#777777] font-outfit text-sm">
                Describe your goal and audience — AI will generate tailored questions.
              </p>
            </div>

            <div className="relative">
              <textarea
                value={formData.context}
                onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                placeholder="e.g. I want to collect feedback on our new ice cream flavors from kids aged 5–12, focusing on taste, texture, and packaging preferences…"
                className="w-full h-44 px-4 py-3.5 bg-white border border-[#e5e5e5] rounded-2xl focus:border-orange-400 focus:outline-none text-sm font-outfit text-[#3c3c3c] placeholder:text-[#c8c8c8] resize-none transition-colors leading-relaxed"
              />
              {formData.context.length > 0 && (
                <span className="absolute bottom-3 right-4 text-[10px] font-outfit text-[#c8c8c8] tabular-nums">
                  {formData.context.length} chars
                </span>
              )}
            </div>

            {/* Example prompts */}
            <div className="space-y-2">
              <p className="text-[11px] font-outfit text-[#afafaf] uppercase tracking-widest font-bold">Try an example</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setFormData(prev => ({ ...prev, context: p.text }))}
                    className="px-3 py-1.5 bg-white border border-[#e5e5e5] rounded-xl text-[12px] font-outfit font-bold text-[#777777] hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <p className="text-[11px] font-outfit text-[#afafaf]">AI generates questions from your description</p>
              </div>
              <button
                onClick={() => formData.context.trim() && setCurrentStep(2)}
                disabled={!formData.context.trim()}
                className={`px-6 py-2.5 rounded-xl font-bold font-outfit text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                  formData.context.trim()
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none cursor-pointer'
                    : 'bg-[#f5f5f5] text-[#c8c8c8] cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Theme ── */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#3c3c3c] font-outfit mb-1.5">
                Choose a theme
              </h1>
              <p className="text-[#777777] font-outfit text-sm">
                Each theme gives respondents a unique interactive experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Theme list */}
              <div className="md:col-span-2 space-y-1.5">
                {THEMES.map((theme) => {
                  const isSelected = formData.theme === theme.value;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => setFormData(prev => ({ ...prev, theme: theme.value }))}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer ${
                        isSelected
                          ? 'bg-orange-50 border-orange-400'
                          : 'bg-white border-[#e5e5e5] hover:border-[#c8c8c8]'
                      }`}
                    >
                      <div className="w-9 h-9 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                        <img src={theme.image} alt={theme.label} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold font-outfit ${isSelected ? 'text-orange-600' : 'text-[#3c3c3c]'}`}>
                          {theme.label}
                        </p>
                        <p className="text-[11px] font-outfit text-[#afafaf] truncate leading-tight">{theme.description}</p>
                      </div>
                      {theme.isPremium ? (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#3c3c3c] text-white rounded-md text-[9px] font-bold font-outfit tracking-wide flex-shrink-0">
                          <Lock className="w-2.5 h-2.5" strokeWidth={2.5} />Pro
                        </span>
                      ) : (
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-[#e5e5e5]'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Preview panel */}
              <div className="md:col-span-3 bg-white border border-[#e5e5e5] rounded-2xl flex flex-col items-center justify-center p-8 gap-5 min-h-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={formData.theme}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="flex flex-col items-center gap-4 text-center"
                  >
                    <div className="w-24 h-24 bg-[#f5f5f5] border border-[#e5e5e5] rounded-2xl flex items-center justify-center p-3">
                      <img
                        src={selectedTheme.image}
                        alt={selectedTheme.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-outfit text-[#3c3c3c] tracking-tight">{selectedTheme.label}</p>
                      <p className="text-sm font-outfit text-[#777777] mt-0.5">{selectedTheme.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <span className="px-2.5 py-1 bg-[#f5f5f5] border border-[#e5e5e5] rounded-full text-[11px] font-outfit font-bold text-[#777777]">
                        Interactive
                      </span>
                      {selectedTheme.isPremium && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full text-[11px] font-outfit font-bold text-orange-600">
                          <Lock className="w-2.5 h-2.5" strokeWidth={2.5} /> Pro theme
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-outfit text-[#afafaf]">This is what respondents will experience</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold font-outfit text-sm shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 cursor-pointer"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Settings ── */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-7"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#3c3c3c] font-outfit mb-1.5">
                Configure your survey
              </h1>
              <p className="text-[#777777] font-outfit text-sm">
                Set the length, format, and privacy before generating questions.
              </p>
            </div>

            {/* Length */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest">Length</p>
              <div className="space-y-1.5">
                {QUESTION_COUNT_OPTIONS.map((opt) => (
                  <OptionRow
                    key={opt.value}
                    option={opt}
                    selected={formData.preferences.questionCount === opt.value}
                    onSelect={(v) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, questionCount: v } }))}
                  />
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest">Format</p>
              <div className="space-y-1.5">
                {QUESTION_STYLE_OPTIONS.map((opt) => (
                  <OptionRow
                    key={opt.value}
                    option={opt}
                    selected={formData.preferences.questionStyle === opt.value}
                    onSelect={(v) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, questionStyle: v } }))}
                  />
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest">Privacy</p>
              <div className="space-y-1.5">
                {ANONYMITY_OPTIONS.map((opt) => (
                  <OptionRow
                    key={opt.value}
                    option={opt}
                    selected={formData.preferences.anonymity === opt.value}
                    onSelect={(v) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, anonymity: v } }))}
                  />
                ))}
              </div>
            </div>

            {errors.general && (
              <p className="text-red-500 text-sm font-outfit bg-red-50 border border-red-100 rounded-xl p-3">{errors.general}</p>
            )}

            {isGenerating ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-9 h-9 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-outfit text-[#777777]">Generating questions…</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 py-2.5 bg-white border border-[#e5e5e5] hover:border-[#c8c8c8] text-[#777777] hover:text-[#3c3c3c] rounded-xl font-bold font-outfit text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 cursor-pointer"
                >
                  Skip — add manually
                </button>
                <button
                  onClick={generateQuestionsWithAI}
                  className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold font-outfit text-sm shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 4: Review & Publish ── */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-6 pb-12"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#3c3c3c] font-outfit mb-1.5">
                Review &amp; publish
              </h1>
              <p className="text-[#777777] font-outfit text-sm">
                Add a title and URL, then choose a plan to publish.
              </p>
            </div>

            {/* Survey preview card */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
              {/* Banner */}
              <div className="bg-orange-50 border-b border-orange-100 p-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-white border border-orange-100 rounded-2xl flex items-center justify-center p-2 flex-shrink-0 shadow-sm">
                  <img
                    src={getAdventureImage(formData.theme)}
                    alt={getAdventureLabel(formData.theme)}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold font-outfit text-orange-400 uppercase tracking-widest mb-1">
                    {getAdventureLabel(formData.theme)} theme
                  </p>
                  <p className="text-base font-bold font-outfit text-[#3c3c3c] truncate">
                    {formData.title || <span className="text-[#c8c8c8] font-normal">Untitled survey</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="px-2 py-0.5 bg-white border border-orange-100 rounded-full text-[10px] font-outfit font-bold text-[#777777] tabular-nums">
                    {formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-[#e5e5e5] rounded-full text-[10px] font-outfit text-[#afafaf]">
                    {formData.preferences.anonymity === 'anonymous' ? 'Anonymous' : 'Collects contact'}
                  </span>
                </div>
              </div>

              {/* Fields */}
              <div className="p-5 space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest">
                    Survey title
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        title,
                        slug: slugManuallyEdited ? prev.slug : generateSlug(title),
                      }));
                    }}
                    placeholder="Enter a title…"
                    className="w-full px-4 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl focus:bg-white focus:border-orange-400 focus:outline-none text-sm font-outfit font-bold text-[#3c3c3c] placeholder:text-[#c8c8c8] transition-colors"
                  />
                </div>

                {/* URL */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest">
                    Public URL
                  </label>
                  <div className="flex items-center bg-[#f5f5f5] border border-transparent rounded-xl focus-within:bg-white focus-within:border-orange-400 transition-colors overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-[#e5e5e5] flex-shrink-0">
                      <Globe className="w-3.5 h-3.5 text-[#afafaf]" />
                      <span className="text-sm font-outfit text-[#afafaf]">{user?.username}/</span>
                    </div>
                    <input
                      value={formData.slug}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                        setSlugManuallyEdited(true);
                      }}
                      className="flex-1 px-3 py-2.5 bg-transparent focus:outline-none text-sm font-outfit text-[#3c3c3c] min-w-0"
                    />
                    <div className="px-3 flex-shrink-0">
                      {isCheckingSlug ? (
                        <Spinner size="sm" />
                      ) : slugAvailable === true ? (
                        <Check className="w-4 h-4 text-green-500" strokeWidth={2.5} />
                      ) : slugAvailable === false ? (
                        <span className="text-[10px] font-outfit text-red-400 font-bold">Taken</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold font-outfit text-[#afafaf] uppercase tracking-widest">Publishing plan</p>
              <TierSelector
                selectedTier={formData.pricingTier}
                onTierSelect={(tier) => setFormData(prev => ({ ...prev, pricingTier: tier }))}
              />
            </div>

            {errors.general && (
              <p className="text-red-500 text-sm font-outfit bg-red-50 border border-red-100 rounded-xl p-3">{errors.general}</p>
            )}

            {/* Publish */}
            <button
              onClick={handleCreateSurvey}
              disabled={isCreating || !formData.pricingTier}
              className={`w-full py-3 rounded-xl font-bold font-outfit text-sm flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                isCreating || !formData.pricingTier
                  ? 'bg-[#f5f5f5] text-[#c8c8c8] cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none cursor-pointer'
              }`}
            >
              <Rocket className="w-4 h-4" />
              {isCreating ? 'Publishing…' : 'Publish survey'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SurveySuccessModal
        isOpen={showSuccessModal}
        surveyUrl={createdSurvey?.url || ''}
        surveyId={createdSurvey?.id || ''}
        onClose={() => setShowSuccessModal(false)}
        onCreateAnother={handleCreateAnother}
        onGoToDashboard={handleGoToDashboard}
      />

      <AIUpgradeModal
        isOpen={showAIUpgradeModal}
        onClose={() => setShowAIUpgradeModal(false)}
        onContinueManually={handleContinueManually}
        isPremiumTheme={!FREE_TIER_THEMES.includes(formData.theme)}
        onSwitchToFreeTheme={() => {
          setFormData(prev => ({ ...prev, theme: 'classic' as AdventureType }));
          setShowAIUpgradeModal(false);
        }}
      />

      <MultiStepLoader
        loadingStates={AI_GENERATION_STATES}
        loading={isGenerating}
        duration={1500}
        loop={true}
      />
    </div>
  );
}
