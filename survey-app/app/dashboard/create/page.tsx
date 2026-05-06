'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronLeft,
  Zap,
  Layout,
  Check,
  Rocket
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/LoadingStates';
import SurveySuccessModal from '@/components/SurveySuccessModal';
import { AdventureType, Question, PricingTier, FREE_TIER_THEMES } from '@/lib/types';
import { getAdventureLabel } from '@/lib/utils/helpers';
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

// Survey preferences types
type QuestionCountRange = '3-5' | '5-10' | '10-15' | '15+';
type QuestionStyle = 'mostly-options' | 'balanced' | 'mostly-open';
type AnonymityPreference = 'anonymous' | 'collect-info';

interface SurveyPreferences {
  questionCount: QuestionCountRange;
  questionStyle: QuestionStyle;
  anonymity: AnonymityPreference;
}

// Types for form state
interface FormData {
  // Step 1
  context: string;
  theme: AdventureType;
  // Step 1.5 - Survey Preferences
  preferences: SurveyPreferences;
  // Step 2
  questions: Question[];
  // Step 3
  title: string;
  slug: string;
  thankYouMessage: string;
  // Pricing
  pricingTier: PricingTier | null;
}

const STORAGE_KEY = 'survey-draft';

const THEMES: { value: AdventureType; label: string; description: string; image: string; color: string; isPremium?: boolean }[] = [
  { value: 'classic', label: 'Classic', description: 'Clean and minimal for any goal.', image: '/theme-classic.png', color: 'bg-neutral-100' },
  { value: 'ice-cream-sundae', label: 'Sundae', description: 'Build a delicious reward.', image: '/theme-sundae.png', color: 'bg-pink-50' },
  { value: 'pizza-builder', label: 'Pizza', description: 'Craft the perfect slice.', image: '/theme-pizza-2d.svg', color: 'bg-orange-50', isPremium: true },
  { value: 'garden-grower', label: 'Garden', description: 'Watch your responses bloom.', image: '/theme-garden.png', color: 'bg-green-50', isPremium: true },
  { value: 'dream-home', label: 'Home', description: 'Design a home of feedback.', image: '/theme-home.png', color: 'bg-blue-50', isPremium: true },
  { value: 'coffee-brewer', label: 'Coffee', image: '/theme-coffee.png', description: 'Brew deep insights.', color: 'bg-amber-50', isPremium: true },
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

const QUESTION_COUNT_OPTIONS: { value: QuestionCountRange; label: string; description: string }[] = [
  { value: '3-5', label: 'Quick Sprint', description: '3-5 questions. High speed, high completion.' },
  { value: '5-10', label: 'Balanced Journey', description: '5-10 questions. Perfect for most needs.' },
  { value: '10-15', label: 'Deep Expedition', description: '10-15 questions. Detailed data points.' },
  { value: '15+', label: 'Grand Odyssey', description: '15+ questions. Comprehensive research.' },
];

const QUESTION_STYLE_OPTIONS: { value: QuestionStyle; label: string; description: string }[] = [
  { value: 'mostly-options', label: 'Point & Click', description: 'Mostly multiple choice. Low friction.' },
  { value: 'balanced', label: 'Hybrid Mix', description: 'Equal choice and open feedback.' },
  { value: 'mostly-open', label: 'Voice of User', description: 'Mostly open-ended text questions.' },
];

const ANONYMITY_OPTIONS: { value: AnonymityPreference; label: string; description: string }[] = [
  { value: 'anonymous', label: 'Stealth Mode', description: '100% anonymous responses.' },
  { value: 'collect-info', label: 'Lead Generation', description: 'Collect names and emails.' },
];

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

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
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (paidForAI && paidTier) {
      setFormData(prev => ({ ...prev, pricingTier: paidTier }));
    }
  }, [paidForAI, paidTier]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || DEFAULT_FORM_DATA);
        setCurrentStep(parsed.currentStep || 1);
        if (parsed.paidForAI) {
          setPaidForAI(true);
          setPaidTier(parsed.paidTier);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const draft = { formData, currentStep, paidForAI, paidTier };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [formData, currentStep, paidForAI, paidTier]);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 50);
  };

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
    } catch {
      setSlugAvailable(true);
    } finally {
      setIsCheckingSlug(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.slug) checkSlugAvailability(formData.slug);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.slug, checkSlugAvailability]);

  const generateQuestionsWithAI = async () => {
    const rateLimitResult = checkRateLimit(RATE_LIMITS.questionGeneration);
    if (!rateLimitResult.allowed) {
      setErrors({ general: `Rate limited. Try in ${formatResetTime(rateLimitResult.resetIn)}.` });
      return;
    }
    setErrors({});
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: formData.context, 
          theme: formData.theme, 
          preferences: formData.preferences 
        }),
      });
      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      recordRequest(RATE_LIMITS.questionGeneration);
      const generatedQuestions: Question[] = data.questions.map((q: Question, index: number) => ({
        ...q,
        id: generateId(),
        order: index,
      }));
      setFormData(prev => ({ ...prev, questions: generatedQuestions }));
      setCurrentStep(4); // Go to launch/review
    } catch {
      setErrors({ general: 'Failed to generate questions.' });
    } finally {
      setIsGenerating(false);
    }
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
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateAnother = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleContinueManually = () => {
    setShowAIUpgradeModal(false);
    setCurrentStep(4);
  };

  // Step Indicators
  const steps = [
    { id: 1, name: 'Concept', icon: Sparkles },
    { id: 2, name: 'Adventure', icon: Zap },
    { id: 3, name: 'Quest', icon: Layout },
    { id: 4, name: 'Launch', icon: Rocket },
  ];

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-12">
      {/* Header / Progress */}
      <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-16">
        <button
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/dashboard')}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-duo-gray shadow-[0_4px_0_#e5e5e5] text-duo-graphite transition-all active:translate-y-[2px] active:shadow-none"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={3} />
        </button>
        
        <div className="flex-1 h-4 bg-duo-gray rounded-full overflow-hidden border-2 border-duo-gray">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${(currentStep / steps.length) * 100}%` }}
             className="h-full bg-duo-green"
           />
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-duo-gray text-duo-black font-fredoka font-bold text-xs uppercase tracking-wider">
           Step {currentStep} of 4
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Concept & Context */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12 relative"
          >
            {/* Mascot Peeking */}
            <div className="absolute -top-12 -left-16 w-32 h-32 opacity-30 pointer-events-none transform rotate-[-15deg] hidden lg:block">
               <img src="/orange-kea-mascot.png" alt="" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl sm:text-4xl font-fredoka font-bold tracking-tight text-duo-black text-center md:text-left">
                What&apos;s the goal of this <span className="text-duo-green">Quest?</span>
              </h1>
              <p className="text-duo-graphite text-base sm:text-lg font-fredoka font-medium text-center md:text-left">
                Describe your project. Our AI will build the entire adventure for you.
              </p>
            </div>

            <div className="relative group">
              <textarea
                value={formData.context}
                onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                placeholder="e.g. I want to collect feedback on our new ice cream flavors from kids aged 5-12..."
                className="w-full h-48 sm:h-64 p-5 sm:p-8 bg-white rounded-[2rem] border-2 border-duo-gray focus:border-duo-blue focus:ring-0 text-base sm:text-xl font-fredoka font-medium placeholder:text-duo-silver resize-none shadow-[0_6px_0_#e5e5e5] transition-all outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-duo-blue/10 flex items-center justify-center text-duo-blue">
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-wider text-duo-silver max-w-[160px] leading-tight">AI will generate questions based on this prompt</p>
              </div>

              <button 
                onClick={() => formData.context.trim() && setCurrentStep(2)}
                disabled={!formData.context.trim()}
                className={`
                  px-12 py-5 rounded-2xl font-fredoka font-bold text-lg uppercase tracking-widest transition-all
                  ${formData.context.trim() 
                    ? 'bg-duo-green text-white border-b-4 border-[#46a302] active:translate-y-[2px] active:border-b-0' 
                    : 'bg-duo-gray text-duo-silver cursor-not-allowed'}
                `}
              >
                Choose Adventure
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Theme Selection */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-4xl font-fredoka font-bold tracking-tight text-duo-black text-center md:text-left">
                Select your <span className="text-duo-blue">World</span>
              </h1>
              <p className="text-duo-graphite text-lg font-fredoka font-medium text-center md:text-left">
                Each world has unique visuals and rewards for your respondents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {THEMES.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setFormData(prev => ({ ...prev, theme: theme.value }))}
                  className={`
                    group relative p-6 text-left transition-all rounded-[2.5rem] border-2 flex flex-col items-start
                    ${formData.theme === theme.value 
                      ? 'bg-white border-duo-blue shadow-[0_8px_0_#1cb0f6]' 
                      : 'bg-white border-duo-gray shadow-[0_6px_0_#e5e5e5] hover:bg-duo-gray/10 hover:translate-y-[2px] hover:shadow-[0_4px_0_#e5e5e5]'}
                  `}
                >
                  {theme.isPremium && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-duo-yellow text-[8px] text-white font-black rounded-lg tracking-widest uppercase shadow-[0_2px_0_#cca000]">
                      Premium
                    </div>
                  )}
                  <div className={`w-16 h-16 bg-white border-2 border-duo-gray rounded-2xl flex items-center justify-center mb-6 shadow-[0_4px_0_#e5e5e5] group-hover:scale-105 transition-all p-2`}>
                    <img src={theme.image} alt={theme.label} className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-lg font-fredoka font-bold text-duo-black mb-1">{theme.label}</h3>
                  <p className="text-duo-graphite text-[10px] font-black uppercase tracking-wider leading-tight">{theme.description}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 pt-6">
              <button 
                onClick={() => setCurrentStep(3)}
                className="w-full max-w-sm py-5 bg-duo-blue text-white rounded-2xl font-fredoka font-bold text-lg uppercase tracking-widest border-b-4 border-[#1890cc] transition-all active:translate-y-[2px] active:border-b-0 shadow-[0_6px_0_#1890cc]"
              >
                Confirm Adventure
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preferences & Magic Generation */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-4xl font-fredoka font-bold tracking-tight text-duo-black text-center md:text-left">
                Configure your <span className="text-duo-purple">Quest</span>
              </h1>
              <p className="text-duo-graphite text-lg font-fredoka font-medium text-center md:text-left">
                Fine-tune the complexity and privacy of your adventure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Question Count */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-duo-silver">Quest Length</h3>
                <div className="space-y-3">
                  {QUESTION_COUNT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, questionCount: opt.value } }))}
                      className={`
                        w-full p-4 rounded-2xl text-left transition-all border-2
                        ${formData.preferences.questionCount === opt.value 
                          ? 'bg-white border-duo-purple shadow-[0_4px_0_#a570ff]' 
                          : 'bg-white border-duo-gray shadow-[0_4px_0_#e5e5e5] hover:bg-duo-gray/10 hover:translate-y-[2px] hover:shadow-[0_2px_0_#e5e5e5]'}
                      `}
                    >
                      <p className="font-fredoka font-bold text-duo-black text-sm">{opt.label}</p>
                      <p className="text-[9px] text-duo-graphite font-black uppercase tracking-wider leading-tight mt-1">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-duo-silver">Difficulty</h3>
                <div className="space-y-3">
                  {QUESTION_STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, questionStyle: opt.value } }))}
                      className={`
                        w-full p-4 rounded-2xl text-left transition-all border-2
                        ${formData.preferences.questionStyle === opt.value 
                          ? 'bg-white border-duo-green shadow-[0_4px_0_#58cc02]' 
                          : 'bg-white border-duo-gray shadow-[0_4px_0_#e5e5e5] hover:bg-duo-gray/10 hover:translate-y-[2px] hover:shadow-[0_2px_0_#e5e5e5]'}
                      `}
                    >
                      <p className="font-fredoka font-bold text-duo-black text-sm">{opt.label}</p>
                      <p className="text-[9px] text-duo-graphite font-black uppercase tracking-wider leading-tight mt-1">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymity */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-duo-silver">Identity</h3>
                <div className="space-y-3">
                  {ANONYMITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, anonymity: opt.value } }))}
                      className={`
                        w-full p-4 rounded-2xl text-left transition-all border-2
                        ${formData.preferences.anonymity === opt.value 
                          ? 'bg-white border-duo-blue shadow-[0_4px_0_#1cb0f6]' 
                          : 'bg-white border-duo-gray shadow-[0_4px_0_#e5e5e5] hover:bg-duo-gray/10 hover:translate-y-[2px] hover:shadow-[0_2px_0_#e5e5e5]'}
                      `}
                    >
                      <p className="font-fredoka font-bold text-duo-black text-sm">{opt.label}</p>
                      <p className="text-[9px] text-duo-graphite font-black uppercase tracking-wider leading-tight mt-1">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Generation State */}
            <div className="flex flex-col items-center justify-center pt-8">
              {isGenerating ? (
                <div className="text-center space-y-6">
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
                      className="w-32 h-32 mx-auto relative mb-8"
                    >
                      <div className="absolute inset-0 bg-orange-200 blur-3xl opacity-30 rounded-full" />
                      <img src="/orange-kea-mascot.png" alt="Brewing..." className="w-full h-full object-contain relative z-10" />
                    </motion.div>
                  <h3 className="text-2xl font-fredoka font-bold text-duo-black animate-pulse uppercase tracking-tight">Brewing your quest...</h3>
                  <p className="text-duo-graphite text-xs font-black uppercase tracking-wider">Our AI is crafting custom challenges for your audience.</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                  <button 
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 px-8 py-5 bg-white text-duo-graphite rounded-2xl font-fredoka font-bold text-lg uppercase tracking-widest border-2 border-duo-gray shadow-[0_4px_0_#e5e5e5] transition-all active:translate-y-[2px] active:border-b-0"
                  >
                    Skip to Review
                  </button>
                  <button 
                    onClick={generateQuestionsWithAI}
                    className="flex-[2] px-12 py-5 bg-duo-green text-white rounded-2xl font-fredoka font-bold text-lg uppercase tracking-widest border-b-4 border-[#46a302] transition-all active:translate-y-[2px] active:border-b-0 shadow-xl shadow-duo-green/20 flex items-center justify-center gap-3"
                  >
                    <Sparkles className="w-6 h-6" />
                    Generate Questions
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Launch */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-16 pb-24 max-w-4xl mx-auto"
          >
            <div className="text-center space-y-4">
              <h1 className="text-2xl sm:text-5xl font-fredoka font-bold tracking-tight text-duo-black">
                Your Quest is <span className="text-duo-green">Ready!</span>
              </h1>
              <p className="text-duo-graphite text-lg font-fredoka font-medium">
                Double check the details and choose your publishing plan.
              </p>
            </div>

            {/* Integrated Review Card */}
            <div className="bg-white border-2 border-duo-gray rounded-[3rem] shadow-[0_8px_0_#e5e5e5] overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Left: Identity */}
                  <div className="p-10 border-b-2 md:border-b-0 md:border-r-2 border-duo-gray space-y-8">
                     <div className="space-y-2">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-duo-silver ml-2">Quest Identity</h3>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-duo-silver ml-4">Title</label>
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
                                placeholder="Enter a catchy title..."
                                className="w-full p-4 bg-duo-gray/20 rounded-2xl border-2 border-transparent focus:border-duo-blue focus:bg-white focus:ring-0 text-lg font-fredoka font-bold text-duo-black transition-all outline-none"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-duo-silver ml-4">URL Path</label>
                              <div className="flex items-center gap-2 p-4 bg-duo-gray/20 rounded-2xl border-2 border-transparent focus-within:border-duo-blue focus-within:bg-white transition-all">
                                 <span className="text-duo-silver font-fredoka font-bold text-sm">{user?.username}/</span>
                                 <input
                                   value={formData.slug}
                                   onChange={(e) => {
                                     setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                                     setSlugManuallyEdited(true);
                                   }}
                                   className="flex-1 bg-transparent border-none focus:ring-0 p-0 font-fredoka font-bold text-duo-black text-sm"
                                 />
                                 {isCheckingSlug ? <Spinner size="sm" /> : slugAvailable ? <Check className="text-duo-green w-4 h-4" strokeWidth={4} /> : null}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right: Visual Preview */}
                  <div className="p-10 bg-duo-gray/5 flex flex-col justify-center relative overflow-hidden group">
                     {/* Mascot Illustration */}
                     <div className="absolute -bottom-4 -right-4 w-48 h-48 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity z-0">
                        <img 
                          src="/orange-kea-mascot.png" 
                          alt={getAdventureLabel(formData.theme)}
                          className="w-full h-full object-contain relative z-10 drop-shadow-xl"
                        />
                     </div>

                     {/* Decorative Mesh Background */}
                     <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-duo-green rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-duo-blue rounded-full blur-3xl" />
                     </div>

                     <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-duo-silver mb-6 ml-2 relative z-10">Quest Preview</h3>
                     
                     <div className="bg-white border-2 border-duo-gray p-8 rounded-[2.5rem] shadow-[0_4px_0_#e5e5e5] relative overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_0_#e5e5e5] z-10">
                        {/* World Icon Floating */}
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white border-2 border-duo-gray rounded-full shadow-[0_4px_0_#e5e5e5] flex items-center justify-center text-4xl animate-float">
                           {{'classic':'📋','ice-cream-sundae':'🍨','pizza-builder':'🍕','garden-grower':'🌱','dream-home':'🏠','coffee-brewer':'☕'}[formData.theme] || '📋'}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                           <div className="w-2.5 h-2.5 rounded-full bg-duo-green shadow-[0_0_10px_rgba(88,204,2,0.4)]" />
                           <p className="text-duo-green font-black uppercase tracking-widest text-[9px]">Active World: {formData.theme}</p>
                        </div>

                        <h4 className="text-2xl font-fredoka font-bold text-duo-black mb-6 leading-tight max-w-[80%]">
                           {formData.title || "Untiled Quest"}
                        </h4>
                        
                        <div className="flex flex-wrap gap-3">
                           <div className="px-4 py-2 bg-duo-gray/30 border-b-2 border-duo-gray/50 rounded-xl text-[10px] font-black uppercase text-duo-graphite flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-duo-blue" />
                              {formData.questions.length} Steps
                           </div>
                           <div className="px-4 py-2 bg-duo-gray/30 border-b-2 border-duo-gray/50 rounded-xl text-[10px] font-black uppercase text-duo-graphite flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-duo-purple" />
                              {formData.preferences.anonymity}
                           </div>
                        </div>

                        {/* Quest Badge Accent */}
                        <div className="absolute bottom-0 right-0 p-4 opacity-10">
                           <div className="w-12 h-12 border-4 border-duo-blue rounded-full flex items-center justify-center font-fredoka font-bold text-duo-blue text-xs rotate-12">
                              QS
                           </div>
                        </div>
                     </div>

                     {/* Encouragement Text */}
                     <p className="mt-6 text-center text-[10px] font-black text-duo-silver uppercase tracking-[0.2em] animate-pulse relative z-10">
                        Respondents will love this adventure!
                     </p>
                  </div>
               </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-8">
               <div className="text-center">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-duo-silver">Choose your publishing plan</h3>
               </div>
               <TierSelector
                 selectedTier={formData.pricingTier}
                 onTierSelect={(tier) => setFormData(prev => ({ ...prev, pricingTier: tier }))}
               />
            </div>
            
            {errors.general && (
              <p className="text-red-500 text-center text-[10px] font-black uppercase tracking-wider bg-red-50 p-4 rounded-2xl border-2 border-red-100 max-w-md mx-auto">{errors.general}</p>
            )}

            {/* Final Launch Button */}
            <div className="flex justify-center pt-8">
               <button 
                 onClick={handleCreateSurvey}
                 disabled={isCreating || !formData.pricingTier}
                 className={`
                   w-full max-w-md py-6 rounded-2xl font-fredoka font-bold text-2xl uppercase tracking-widest transition-all
                   ${isCreating || !formData.pricingTier 
                     ? 'bg-duo-gray text-duo-silver cursor-not-allowed border-b-4 border-duo-gray' 
                     : 'bg-duo-green text-white border-b-4 border-[#46a302] shadow-[0_8px_0_#46a302] hover:translate-y-[-2px] hover:shadow-[0_10px_0_#46a302] active:translate-y-[2px] active:shadow-none'}
                 `}
               >
                 {isCreating ? 'Launching Quest...' : 'Launch Quest!'}
               </button>
            </div>
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
    </div>
  );
}
