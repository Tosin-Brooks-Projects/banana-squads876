'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Spinner } from '@/components/ui/LoadingStates';
import QuestionEditor, { isQuestionValid } from '@/components/QuestionEditor';
import SurveySuccessModal from '@/components/SurveySuccessModal';
import { AdventureType, Question, MultipleChoiceQuestion, PricingTier, PRICING_TIERS, FREE_TIER_THEMES, SurveySettings } from '@/lib/types';
import {
  createSurvey as createSurveyInFirestore,
  createFreeSurveyAtomic,
  checkSlugExists,
  getSuggestedSlugs,
  getUser,
} from '@/lib/firebase/firestore';
import TierSelector from '@/components/pricing/TierSelector';
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

const THEMES: { value: AdventureType; label: string; icon: string; color: string; isPremium?: boolean }[] = [
  { value: 'classic', label: 'Classic', icon: '📋', color: 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200' },
  { value: 'ice-cream-sundae', label: 'Sundae', icon: '🍨', color: 'bg-pink-100 border-pink-300 hover:bg-pink-200' },
  { value: 'pizza-builder', label: 'Pizza', icon: '🍕', color: 'bg-orange-100 border-orange-300 hover:bg-orange-200', isPremium: true },
  { value: 'garden-grower', label: 'Garden', icon: '🌱', color: 'bg-green-100 border-green-300 hover:bg-green-200', isPremium: true },
  { value: 'dream-home', label: 'Home', icon: '🏠', color: 'bg-blue-100 border-blue-300 hover:bg-blue-200', isPremium: true },
  { value: 'coffee-brewer', label: 'Coffee', icon: '☕', color: 'bg-amber-100 border-amber-300 hover:bg-amber-200', isPremium: true },
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
  { value: '3-5', label: '3-5 questions', description: 'Quick survey, higher completion' },
  { value: '5-10', label: '5-10 questions', description: 'Balanced depth & engagement' },
  { value: '10-15', label: '10-15 questions', description: 'Detailed insights' },
  { value: '15+', label: '15+ questions', description: 'Comprehensive analysis' },
];

const QUESTION_STYLE_OPTIONS: { value: QuestionStyle; label: string; description: string }[] = [
  { value: 'mostly-options', label: 'Multiple choice focused', description: 'Easy to answer, great for quantitative data' },
  { value: 'balanced', label: 'Mix of both', description: 'Balance of structured & open-ended questions' },
  { value: 'mostly-open', label: 'Open-ended focused', description: 'Rich qualitative feedback' },
];

const ANONYMITY_OPTIONS: { value: AnonymityPreference; label: string; description: string }[] = [
  { value: 'anonymous', label: 'Anonymous', description: 'No personal info collected' },
  { value: 'collect-info', label: 'Collect contact info', description: 'Ask for name/email at the end' },
];

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function CreateSurveyPage() {
  const router = useRouter();
  const { user, firebaseUser } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSurvey, setCreatedSurvey] = useState<{ id: string; url: string } | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [hasUsedFreeTier, setHasUsedFreeTier] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Check if user has used their free tier
  useEffect(() => {
    async function checkFreeTierUsage() {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        setHasUsedFreeTier(userData?.hasUsedFreeTier || false);
      }
    }
    checkFreeTierUsage();
  }, [firebaseUser]);

  // Load draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || DEFAULT_FORM_DATA);
        setCurrentStep(parsed.currentStep || 1);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    const draft = { formData, currentStep };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [formData, currentStep]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(DEFAULT_FORM_DATA);
    setCurrentStep(1);
    setSlugManuallyEdited(false);
  }, []);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  };

  // Check slug availability with Firestore
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || !firebaseUser) {
      setSlugAvailable(null);
      setSlugSuggestions([]);
      return;
    }

    // Check reserved slugs first
    const reserved = ['test', 'demo', 'admin', 'dashboard', 'settings', 'profile', 'api'];
    if (reserved.includes(slug.toLowerCase())) {
      setSlugAvailable(false);
      setSlugSuggestions([`my-${slug}`, `${slug}-survey`, `${slug}-${new Date().getFullYear()}`]);
      setIsCheckingSlug(false);
      return;
    }

    setIsCheckingSlug(true);
    setSlugSuggestions([]);

    try {
      const exists = await checkSlugExists(firebaseUser.uid, slug);
      setSlugAvailable(!exists);

      if (exists) {
        // Get suggestions if slug is taken
        const suggestions = await getSuggestedSlugs(firebaseUser.uid, slug);
        setSlugSuggestions(suggestions);
      } else {
        // Clear any slug error when slug is available
        setErrors(prev => ({ ...prev, slug: '' }));
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      // On error, assume available to not block the user
      setSlugAvailable(true);
      setErrors(prev => ({ ...prev, slug: '' }));
    } finally {
      setIsCheckingSlug(false);
    }
  }, [firebaseUser]);

  // Debounced slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.slug) {
        checkSlugAvailability(formData.slug);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.slug, checkSlugAvailability]);

  // Generate questions from context (mock AI - replace with real API)
  const generateQuestions = async () => {
    // Check rate limit for question generation (max 10 per hour)
    const rateLimitResult = checkRateLimit(RATE_LIMITS.questionGeneration);
    if (!rateLimitResult.allowed) {
      setErrors({
        general: `You've reached the question generation limit. Please try again in ${formatResetTime(rateLimitResult.resetIn)}.`,
      });
      return;
    }

    setErrors({});
    setIsGenerating(true);

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Record the request for rate limiting
    recordRequest(RATE_LIMITS.questionGeneration);

    // Generate questions based on preferences
    const { questionCount, questionStyle, anonymity } = formData.preferences;

    // Determine target question count
    const targetCounts: Record<QuestionCountRange, number> = {
      '3-5': 4,
      '5-10': 7,
      '10-15': 12,
      '15+': 18,
    };
    const targetCount = targetCounts[questionCount];

    // Build questions array based on style preference
    const mockQuestions: Question[] = [];
    let order = 0;

    // Always start with a multiple choice question
    mockQuestions.push({
      id: generateId(),
      type: 'multiple-choice',
      question: 'How often do you visit us?',
      options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
      required: true,
      order: order++,
    });

    // Add rating question
    mockQuestions.push({
      id: generateId(),
      type: 'rating',
      question: 'How would you rate your overall experience?',
      scale: 5,
      startLabel: 'Poor',
      endLabel: 'Excellent',
      required: true,
      order: order++,
    });

    // Add questions based on style preference
    if (questionStyle === 'mostly-options' || questionStyle === 'balanced') {
      mockQuestions.push({
        id: generateId(),
        type: 'multiple-choice',
        question: 'What is the main reason for your visits?',
        options: ['Quality', 'Price', 'Location', 'Atmosphere', 'Other'],
        required: true,
        order: order++,
      });

      mockQuestions.push({
        id: generateId(),
        type: 'multiple-choice',
        question: 'What could we improve?',
        options: ['Service speed', 'Product quality', 'Pricing', 'Variety', 'Cleanliness'],
        required: false,
        order: order++,
      });
    }

    if (questionStyle === 'mostly-open' || questionStyle === 'balanced') {
      mockQuestions.push({
        id: generateId(),
        type: 'text',
        question: 'What do you like most about your experience with us?',
        placeholder: 'Tell us what you enjoy...',
        maxLength: 500,
        required: questionStyle === 'mostly-open',
        order: order++,
      });
    }

    // Fill remaining questions based on target count
    while (mockQuestions.length < targetCount) {
      const shouldBeOpenEnded = questionStyle === 'mostly-open' ||
        (questionStyle === 'balanced' && mockQuestions.length % 3 === 0);

      if (shouldBeOpenEnded) {
        mockQuestions.push({
          id: generateId(),
          type: 'text',
          question: `Additional feedback question ${mockQuestions.length + 1}?`,
          placeholder: 'Share your thoughts...',
          maxLength: 500,
          required: false,
          order: order++,
        });
      } else {
        mockQuestions.push({
          id: generateId(),
          type: 'multiple-choice',
          question: `Survey question ${mockQuestions.length + 1}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          required: false,
          order: order++,
        });
      }
    }

    // Always end with open feedback
    if (mockQuestions[mockQuestions.length - 1].type !== 'text') {
      mockQuestions.push({
        id: generateId(),
        type: 'text',
        question: 'Any additional feedback you would like to share?',
        placeholder: 'Tell us more about your experience...',
        maxLength: 500,
        required: false,
        order: order++,
      });
    }

    // Add contact info collection if requested
    if (anonymity === 'collect-info') {
      mockQuestions.push({
        id: generateId(),
        type: 'text',
        question: 'Would you like to leave your email for follow-up? (Optional)',
        placeholder: 'your@email.com',
        maxLength: 100,
        required: false,
        order: order++,
      });
    }

    setFormData(prev => ({ ...prev, questions: mockQuestions }));
    setIsGenerating(false);
    setCurrentStep(3);
  };

  // Question editing functions
  const updateQuestion = (id: string, updatedQuestion: Question) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === id ? updatedQuestion : q
      ),
    }));
  };

  const deleteQuestion = (id: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id),
    }));
  };

  const addQuestion = () => {
    const newQuestion: MultipleChoiceQuestion = {
      id: generateId(),
      type: 'multiple-choice',
      question: '',
      options: ['Option 1', 'Option 2'],
      required: false,
      order: formData.questions.length,
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  // Check if all questions are valid
  const areAllQuestionsValid = () => {
    return formData.questions.length > 0 && formData.questions.every(isQuestionValid);
  };

  const updateQuestionOrder = (reorderedQuestions: Question[]) => {
    setFormData(prev => ({
      ...prev,
      questions: reorderedQuestions.map((q, i) => ({ ...q, order: i })),
    }));
  };

  // Scroll to first error
  const scrollToFirstError = (errorKeys: string[]) => {
    const errorOrder = ['title', 'slug', 'questions'];
    const firstErrorKey = errorOrder.find(key => errorKeys.includes(key));

    if (firstErrorKey && formRef.current) {
      const errorElement = formRef.current.querySelector(`[data-field="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Create survey with Firestore
  const handleCreateSurvey = async () => {
    if (!firebaseUser || !user) {
      setErrors({ general: 'You must be logged in to create a survey' });
      return;
    }

    // Check rate limit for survey creation (max 20 per hour)
    const rateLimitResult = checkRateLimit(RATE_LIMITS.surveyCreation);
    if (!rateLimitResult.allowed) {
      setErrors({
        general: `You've reached the survey creation limit. Please try again in ${formatResetTime(rateLimitResult.resetIn)}.`,
      });
      return;
    }

    // Clear previous errors
    setErrors({});
    setNetworkError(null);

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Survey title is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (slugAvailable === false) {
      newErrors.slug = 'This slug is not available. Try one of the suggestions below.';
    }
    if (formData.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }
    if (!formData.questions.every(isQuestionValid)) {
      newErrors.questions = 'Please fix validation errors in your questions';
    }
    if (!formData.pricingTier) {
      newErrors.pricing = 'Please select a pricing tier';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToFirstError(Object.keys(newErrors));
      return;
    }

    const selectedTier = formData.pricingTier!;
    const tierConfig = PRICING_TIERS[selectedTier];
    const isFree = selectedTier === 'free';

    // For paid tiers, show payment overlay immediately for smoother UX
    if (!isFree) {
      setIsProcessingPayment(true);
    } else {
      setIsCreating(true);
    }

    try {
      // Double-check slug availability right before creating
      const slugTaken = await checkSlugExists(firebaseUser.uid, formData.slug);
      if (slugTaken) {
        const suggestions = await getSuggestedSlugs(firebaseUser.uid, formData.slug);
        setSlugSuggestions(suggestions);
        setSlugAvailable(false);
        setErrors({ slug: 'This slug was just taken. Please choose another.' });
        setIsCreating(false);
        setIsProcessingPayment(false);
        return;
      }

      // Calculate data expiration date
      const dataExpiresAt = new Date();
      dataExpiresAt.setDate(dataExpiresAt.getDate() + tierConfig.retentionDays);

      // Create the survey data
      const surveyData = {
        userId: firebaseUser.uid,
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.context.trim() || '',
        adventureType: formData.theme,
        questions: formData.questions,
        settings: {
          allowAnonymous: true,
          showProgressBar: true,
          randomizeQuestions: false,
          thankYouMessage: formData.thankYouMessage.trim() || '',
        } as SurveySettings, // Extended settings
        status: (isFree ? 'published' : 'draft') as 'published' | 'draft' | 'closed',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(isFree ? { publishedAt: new Date() } : {}),
        // Pricing fields
        pricingTier: selectedTier,
        responseLimit: tierConfig.responseLimit,
        paymentStatus: (isFree ? 'free' : 'unpaid') as 'unpaid' | 'paid' | 'free',
        dataExpiresAt,
      };

      let surveyId: string;

      // Create the survey (free tier now allows unlimited surveys)
      if (isFree) {
        surveyId = await createFreeSurveyAtomic(firebaseUser.uid, surveyData);
      } else {
        surveyId = await createSurveyInFirestore(surveyData);
      }

      // Record the request for rate limiting
      recordRequest(RATE_LIMITS.surveyCreation);

      // If paid tier, redirect to Stripe checkout
      if (!isFree) {
        try {
          const authToken = await firebaseUser.getIdToken();
          const response = await fetch('/api/stripe/create-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              tier: selectedTier,
              surveyId,
              surveyTitle: formData.title.trim(),
            }),
          });

          const data = await response.json();
          if (data.url) {
            // Clear localStorage only (not React state) since we're redirecting away
            localStorage.removeItem(STORAGE_KEY);
            // Redirect to Stripe - keep overlay showing, don't reset any state
            // The page will navigate away, so we don't need cleanup
            window.location.href = data.url;
            // Don't return here - let the function end naturally
            // The page navigation will happen and React state changes won't matter
            return;
          } else {
            throw new Error('Failed to create checkout session');
          }
        } catch (error) {
          console.error('Payment error:', error);
          // Payment failed - DO NOT show success modal
          // Show error and inform user they need to complete payment from dashboard
          setErrors({
            general: 'Failed to redirect to payment. Your survey has been saved as a draft. Please complete payment from your dashboard to publish it.'
          });
          setIsProcessingPayment(false);
          setIsCreating(false);
          // Do NOT show success modal - user needs to pay first
          return;
        }
        // If we reach here after setting window.location.href,
        // we're about to navigate away, so don't reset state
        return;
      }

      // Free tier flow - clear draft and show success
      clearDraft();
      const surveyUrl = `${user.username}/${formData.slug}`;
      setCreatedSurvey({ id: surveyId, url: surveyUrl });
      setShowSuccessModal(true);
      setIsCreating(false);
      setIsProcessingPayment(false);

    } catch (error) {
      console.error('Error creating survey:', error);

      // Handle different error types
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('offline')) {
          setNetworkError('Network error. Please check your connection and try again.');
        } else if (error.message.includes('permission')) {
          setErrors({ general: 'You do not have permission to create surveys. Please try logging in again.' });
        } else {
          setErrors({ general: `Failed to create survey: ${error.message}` });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
      setIsCreating(false);
      setIsProcessingPayment(false);
    }
    // No finally block - we handle state reset explicitly in each branch
  };

  // Handle success modal actions
  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setCreatedSurvey(null);
    setFormData(DEFAULT_FORM_DATA);
    setCurrentStep(1);
    setErrors({});
    setSlugAvailable(null);
    setSlugSuggestions([]);
    setSlugManuallyEdited(false);
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    router.push('/dashboard');
  };

  // Retry after network error
  const handleRetry = () => {
    setNetworkError(null);
    handleCreateSurvey();
  };

  // Step navigation
  const goToStep = (step: number) => {
    if (step < currentStep || (step === 4 && formData.questions.length > 0)) {
      setCurrentStep(step);
    }
  };

  // Proceed to preferences step
  const goToPreferences = () => {
    if (!formData.context.trim()) {
      setErrors({ context: 'Please describe your survey goal first' });
      return;
    }
    setErrors({});
    setCurrentStep(2);
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step, index) => (
        <div key={step} className="flex items-center">
          <button
            onClick={() => goToStep(step)}
            disabled={step > currentStep && !(step === 4 && formData.questions.length > 0)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
              ${currentStep === step
                ? 'bg-indigo-600 text-white shadow-lg scale-110'
                : step < currentStep
                  ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {step < currentStep ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step
            )}
          </button>
          {index < 3 && (
            <div
              className={`w-12 h-1 mx-1 rounded ${
                step < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        {(formData.context || formData.questions.length > 0) && (
          <button
            onClick={clearDraft}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear Draft
          </button>
        )}
      </div>

      <Card padding="lg">
        <StepIndicator />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you want to learn?</h2>
                <p className="text-gray-600">Describe your survey goal and we&apos;ll generate questions for you</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Context / Goal
                </label>
                <textarea
                  value={formData.context}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, context: e.target.value }));
                    if (errors.context) setErrors(prev => ({ ...prev, context: '' }));
                  }}
                  placeholder="I run a coffee shop and want to know why morning regulars stopped coming. I'd like to understand if it's about the coffee quality, wait times, prices, or something else entirely..."
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-colors min-h-[160px] resize-none
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${errors.context
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    }
                  `}
                  rows={6}
                />
                {errors.context && (
                  <p className="mt-1 text-sm text-red-600">{errors.context}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose a Theme
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {THEMES.map((theme) => {
                    const isFreeTheme = FREE_TIER_THEMES.includes(theme.value);
                    const isSelected = formData.theme === theme.value;

                    return (
                      <div key={theme.value} className="relative group">
                        <button
                          onClick={() => {
                            if (theme.isPremium && formData.pricingTier === 'free') {
                              // Show upgrade message - they can still select, but will need to upgrade
                              setFormData(prev => ({ ...prev, theme: theme.value, pricingTier: null }));
                            } else {
                              setFormData(prev => ({ ...prev, theme: theme.value }));
                            }
                          }}
                          className={`
                            w-full p-4 rounded-lg border-2 transition-all text-center relative
                            ${isSelected
                              ? `${theme.color} border-2 ring-2 ring-offset-2 ring-indigo-500`
                              : theme.isPremium
                                ? `bg-gray-50 border-gray-200 hover:bg-gray-100`
                                : `bg-gray-50 border-gray-200 hover:bg-gray-100`
                            }
                          `}
                        >
                          <span className="text-2xl block mb-1 h-8 flex items-center justify-center">{theme.icon}</span>
                          <span className="text-sm font-medium">{theme.label}</span>
                          {theme.isPremium && (
                            <span className="absolute top-1 right-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                              Pro
                            </span>
                          )}
                          {isFreeTheme && !theme.isPremium && (
                            <span className="absolute top-1 right-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                              Free
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Classic and Ice Cream themes are free. Other themes require a paid tier.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={goToPreferences}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Your Survey</h2>
                <p className="text-gray-600">A few quick preferences to help us generate better questions</p>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How many questions would you like?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {QUESTION_COUNT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, questionCount: option.value }
                      }))}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${formData.preferences.questionCount === option.value
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="block font-medium text-gray-900">{option.label}</span>
                      <span className="text-sm text-gray-500">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of questions do you prefer?
                </label>
                <div className="space-y-3">
                  {QUESTION_STYLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, questionStyle: option.value }
                      }))}
                      className={`
                        w-full p-4 rounded-lg border-2 transition-all text-left
                        ${formData.preferences.questionStyle === option.value
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="block font-medium text-gray-900">{option.label}</span>
                      <span className="text-sm text-gray-500">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Should the survey be anonymous?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ANONYMITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, anonymity: option.value }
                      }))}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${formData.preferences.anonymity === option.value
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="block font-medium text-gray-900">{option.label}</span>
                      <span className="text-sm text-gray-500">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-700">{errors.general}</p>
                </motion.div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={generateQuestions}
                  isLoading={isGenerating}
                  loadingText="Generating..."
                >
                  Generate Questions
                </Button>
              </div>

              {/* Generating overlay */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4"
                    >
                      <div className="mb-6">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, -5, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                          className="inline-block"
                        >
                          <svg
                            className="w-16 h-16 text-brand-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="#FFF7ED" />
                            <path d="M9 7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M9 15H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <rect x="8" y="1" width="8" height="4" rx="1" fill="currentColor" />
                          </svg>
                        </motion.div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Generating Questions...
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Our AI is crafting the perfect questions for your survey
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Spinner size="sm" />
                        <span className="text-sm text-gray-500">This may take a moment</span>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Questions</h2>
                <p className="text-gray-600">Edit, reorder, or add questions as needed</p>
              </div>

              <Reorder.Group
                axis="y"
                values={formData.questions}
                onReorder={updateQuestionOrder}
                className="space-y-4"
              >
                {formData.questions.map((question, index) => (
                  <Reorder.Item key={question.id} value={question} id={question.id}>
                    <QuestionEditor
                      question={question}
                      index={index}
                      onChange={(updatedQuestion) => updateQuestion(question.id, updatedQuestion)}
                      onDelete={() => deleteQuestion(question.id)}
                      showDragHandle={true}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              <button
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Question
              </button>

              {formData.questions.filter(q => !isQuestionValid(q)).length > 0 && (
                <p className="text-sm text-amber-600 text-center">
                  {formData.questions.filter(q => !isQuestionValid(q)).length} question{formData.questions.filter(q => !isQuestionValid(q)).length > 1 ? 's need' : ' needs'} attention before proceeding
                </p>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={!areAllQuestionsValid()}
                >
                  Looks Good!
                </Button>
              </div>
            </motion.div>
          )}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              ref={formRef}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Details</h2>
                <p className="text-gray-600">Give your survey a name and customize settings</p>
              </div>

              {/* General error */}
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-700">{errors.general}</p>
                </motion.div>
              )}

              {/* Network error with retry */}
              {networkError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-700">{networkError}</p>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                  >
                    Retry
                  </button>
                </motion.div>
              )}

              <div className="space-y-4">
                <div data-field="title">
                  <Input
                    label="Survey Title *"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        title,
                        slug: slugManuallyEdited ? prev.slug : generateSlug(title),
                      }));
                      if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                    }}
                    placeholder="My Customer Feedback Survey"
                    error={errors.title}
                  />
                </div>

                <div data-field="slug">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom URL Slug
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm whitespace-nowrap">
                      {user?.username || 'username'}/
                    </span>
                    <div className="flex-1 relative">
                      <input
                        value={formData.slug}
                        onChange={(e) => {
                          const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setFormData(prev => ({ ...prev, slug }));
                          setSlugManuallyEdited(true);
                          setSlugAvailable(null);
                          setSlugSuggestions([]);
                          if (errors.slug) setErrors(prev => ({ ...prev, slug: '' }));
                        }}
                        placeholder="my-survey"
                        className={`
                          w-full px-4 py-2 rounded-lg border transition-colors
                          focus:outline-none focus:ring-2 focus:ring-offset-0
                          ${errors.slug
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : slugAvailable === true
                              ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                              : slugAvailable === false
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                          }
                        `}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingSlug && (
                          <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {!isCheckingSlug && slugAvailable === true && (
                          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {!isCheckingSlug && slugAvailable === false && (
                          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                  )}
                  {!errors.slug && slugAvailable === true && (
                    <p className="mt-1 text-sm text-green-600">This slug is available!</p>
                  )}
                  {!errors.slug && slugAvailable === false && (
                    <p className="mt-1 text-sm text-red-600">This slug is already taken</p>
                  )}

                  {/* Slug suggestions */}
                  {slugSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      <p className="text-xs text-gray-500 mb-1.5">Try one of these:</p>
                      <div className="flex flex-wrap gap-2">
                        {slugSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, slug: suggestion }));
                              setSlugAvailable(null);
                              setSlugSuggestions([]);
                              setErrors(prev => ({ ...prev, slug: '' }));
                            }}
                            className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thank You Message (Optional)
                  </label>
                  <textarea
                    value={formData.thankYouMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                    placeholder="Thank you for taking the time to share your feedback! Your responses help us improve."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-colors min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-indigo-500 focus:ring-indigo-200"
                    rows={3}
                  />
                </div>
              </div>

              {/* Premium theme warning */}
              {!FREE_TIER_THEMES.includes(formData.theme) && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✨</span>
                    <div>
                      <p className="font-medium text-amber-800">
                        Premium Theme Selected: {THEMES.find(t => t.value === formData.theme)?.label}
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        This theme requires a paid tier (Starter or above). Select a plan below to continue.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Tier Selection */}
              <div className="mt-8 pt-8 border-t border-gray-200" data-field="pricing">
                <TierSelector
                  selectedTier={formData.pricingTier}
                  onTierSelect={(tier) => {
                    // Prevent free tier selection if premium theme is selected
                    if (tier === 'free' && !FREE_TIER_THEMES.includes(formData.theme)) {
                      setErrors(prev => ({
                        ...prev,
                        pricing: `The ${THEMES.find(t => t.value === formData.theme)?.label} theme requires a paid tier. Please select Starter or above, or go back and choose Classic or Ice Cream.`
                      }));
                      return;
                    }
                    setFormData(prev => ({ ...prev, pricingTier: tier }));
                    if (errors.pricing) setErrors(prev => ({ ...prev, pricing: '' }));
                  }}
                  hasUsedFreeTier={hasUsedFreeTier}
                  isLoading={isCreating || isProcessingPayment}
                />
                {errors.pricing && (
                  <p className="mt-2 text-sm text-red-600 text-center">{errors.pricing}</p>
                )}
              </div>

              {errors.questions && (
                <p className="text-sm text-red-600 text-center" data-field="questions">{errors.questions}</p>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button
                  onClick={handleCreateSurvey}
                  isLoading={isCreating || isProcessingPayment}
                  loadingText={isProcessingPayment ? "Redirecting to payment..." : "Creating..."}
                  disabled={isCreating || isCheckingSlug || isProcessingPayment || !formData.pricingTier}
                >
                  {formData.pricingTier === 'free'
                    ? 'Create Free Survey'
                    : formData.pricingTier
                      ? `Create & Pay $${PRICING_TIERS[formData.pricingTier].price}`
                      : 'Select a Plan'}
                </Button>
              </div>

              {/* Creating/Payment overlay */}
              <AnimatePresence>
                {(isCreating || isProcessingPayment) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="mb-6">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                              className="inline-block"
                            >
                              <span className="text-5xl">💳</span>
                            </motion.div>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Redirecting to Payment...
                          </h3>
                          <p className="text-gray-600 mb-4">
                            You&apos;ll be taken to our secure checkout
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <Spinner size="sm" />
                            <span className="text-sm text-gray-500">Please wait...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-6">
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                              className="inline-block"
                            >
                              <span className="text-5xl">🚀</span>
                            </motion.div>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Creating Your Challenge...
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Setting up your survey adventure
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <Spinner size="sm" />
                            <span className="text-sm text-gray-500">Almost there!</span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Success Modal */}
      <SurveySuccessModal
        isOpen={showSuccessModal}
        surveyUrl={createdSurvey?.url || ''}
        surveyId={createdSurvey?.id || ''}
        onClose={() => setShowSuccessModal(false)}
        onCreateAnother={handleCreateAnother}
        onGoToDashboard={handleGoToDashboard}
      />
    </div>
  );
}
