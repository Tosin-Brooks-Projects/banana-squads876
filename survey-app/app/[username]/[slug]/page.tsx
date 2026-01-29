'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ClassicSurvey from '@/components/adventures/ClassicSurvey';
import IceCreamSundae from '@/components/adventures/IceCreamSundae';
import PizzaBuilder from '@/components/adventures/PizzaBuilder';
import GardenGrower from '@/components/adventures/GardenGrower';
import DreamHome from '@/components/adventures/DreamHome';
import CoffeeBrewer from '@/components/adventures/CoffeeBrewer';
import ResumeDialog from '@/components/survey/ResumeDialog';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { SurveySkeleton } from '@/components/ui/Skeleton';
import {
  SurveyNotFound,
  NetworkError,
  SurveyExpired,
  SurveyUnavailable,
  ResponseLimitReached,
  SubmissionError,
  SavingIndicator,
} from '@/components/ui/ErrorStates';
import { Survey, Answer, PartialResponse, ProgressUpdate } from '@/lib/types';
import {
  getUserByUsername,
  getPublicSurveyBySlug,
  createResponse,
  ResponseLimitExceededError,
  getUserByPreviousUsername,
  savePartialResponse,
  getPartialResponse,
  deletePartialResponse,
  getResponseCountFast,
} from '@/lib/firebase/firestore';
import {
  checkRateLimit,
  recordRequest,
  RATE_LIMITS,
  detectSpamSubmission,
  formatResetTime,
} from '@/lib/utils/rateLimit';
import { getAdventureEmoji, getAdventureLabel } from '@/lib/utils/helpers';
import { getOrCreateSessionId, clearSession } from '@/lib/utils/sessionManager';
import { calculateMilestone, getAdventureTotalStages } from '@/lib/utils/milestones';

// Error types for better error handling
type ErrorType = 'not_found' | 'network' | 'expired' | 'unavailable' | 'response_limit_reached' | null;

// Visual options for sundae display (matching IceCreamSundae component)
const bowlOptions = [
  { id: 'waffle', name: 'Waffle Cone', color: 'bg-amber-200 border-amber-400' },
  { id: 'glass', name: 'Glass Bowl', color: 'bg-blue-100 border-blue-300' },
  { id: 'banana', name: 'Banana Split Boat', color: 'bg-yellow-200 border-yellow-400' },
];

const scoopOptions = [
  { id: 'vanilla', name: 'Vanilla', color: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'chocolate', name: 'Chocolate', color: 'bg-amber-800', borderColor: 'border-amber-900' },
  { id: 'strawberry', name: 'Strawberry', color: 'bg-pink-300', borderColor: 'border-pink-400' },
];

const sauceOptions = [
  { id: 'chocolate', name: 'Chocolate', color: 'bg-amber-900' },
  { id: 'caramel', name: 'Caramel', color: 'bg-amber-400' },
  { id: 'strawberry', name: 'Strawberry', color: 'bg-pink-400' },
];

const toppingEmojis: Record<string, string> = {
  nuts: '🥜',
  sprinkles: '✨',
  gummybears: '🐻',
  whippedcream: '☁️',
};

interface FinalSelections {
  bowl?: string;
  scoop?: string;
  sauce?: string;
  toppings?: string[];
  respondentName?: string;
}

// Demo surveys for testing without Firestore
const demoSurveys: Record<string, Survey> = {
  'test-survey': {
    id: 'demo-123',
    userId: 'demo-user',
    slug: 'test-survey',
    title: 'Coffee Shop Feedback',
    description: 'Help us make your coffee experience even better!',
    adventureType: 'ice-cream-sundae',
    status: 'published',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice' as const,
        question: 'How often do you visit coffee shops?',
        options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
        required: true,
        order: 0,
      },
      {
        id: 'q2',
        type: 'multiple-choice' as const,
        question: 'What\'s your favorite type of coffee?',
        options: ['Espresso', 'Latte', 'Cappuccino', 'Cold Brew'],
        required: true,
        order: 1,
      },
      {
        id: 'q3',
        type: 'multiple-choice' as const,
        question: 'How important is ambiance to you?',
        options: ['Very Important', 'Somewhat Important', 'Not Important'],
        required: true,
        order: 2,
      },
      {
        id: 'q4',
        type: 'multiple-choice' as const,
        question: 'What extras do you enjoy?',
        options: ['Free WiFi', 'Outdoor Seating', 'Live Music', 'Board Games'],
        required: false,
        order: 3,
      },
    ],
    settings: {
      allowAnonymous: true,
      showProgressBar: true,
      randomizeQuestions: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  },
  'pizza-test': {
    id: 'demo-456',
    userId: 'demo-user',
    slug: 'pizza-test',
    title: 'Pizza Preferences Survey',
    description: 'Build your dream pizza while sharing your preferences!',
    adventureType: 'pizza-builder',
    status: 'published',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice' as const,
        question: 'What\'s your preferred crust?',
        options: ['Thin & Crispy', 'Deep Dish', 'Stuffed Crust', 'Gluten-Free'],
        required: true,
        order: 0,
      },
      {
        id: 'q2',
        type: 'multiple-choice' as const,
        question: 'Favorite topping category?',
        options: ['Meats', 'Vegetables', 'Cheeses', 'Mixed'],
        required: true,
        order: 1,
      },
      {
        id: 'q3',
        type: 'multiple-choice' as const,
        question: 'How spicy do you like it?',
        options: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
        required: true,
        order: 2,
      },
    ],
    settings: {
      allowAnonymous: true,
      showProgressBar: true,
      randomizeQuestions: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  },
  'garden-test': {
    id: 'demo-789',
    userId: 'demo-user',
    slug: 'garden-test',
    title: 'Garden Planning Survey',
    description: 'Help us understand your gardening preferences!',
    adventureType: 'garden-grower',
    status: 'published',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice' as const,
        question: 'What type of garden do you prefer?',
        options: ['Flower Garden', 'Vegetable Garden', 'Herb Garden', 'Mixed'],
        required: true,
        order: 0,
      },
      {
        id: 'q2',
        type: 'multiple-choice' as const,
        question: 'How much time can you dedicate to gardening?',
        options: ['Daily', 'Weekly', 'Monthly', 'Minimal'],
        required: true,
        order: 1,
      },
      {
        id: 'q3',
        type: 'multiple-choice' as const,
        question: 'What\'s your experience level?',
        options: ['Beginner', 'Intermediate', 'Expert'],
        required: true,
        order: 2,
      },
    ],
    settings: {
      allowAnonymous: true,
      showProgressBar: true,
      randomizeQuestions: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  },
};

// Mini sundae display for completion screen (reserved for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _MiniSundaeDisplay({ selections }: { selections: FinalSelections }) {
  const bowl = bowlOptions.find(b => b.name.toLowerCase().includes(selections.bowl?.toLowerCase() || '')) || bowlOptions[0];
  const scoop = scoopOptions.find(s => s.name.toLowerCase().includes(selections.scoop?.toLowerCase() || '')) || scoopOptions[0];
  const sauce = sauceOptions.find(s => s.name.toLowerCase().includes(selections.sauce?.toLowerCase() || '')) || sauceOptions[0];

  return (
    <div className="relative w-32 h-44 mx-auto mb-4">
      {/* Cherry on top */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      >
        <span className="text-2xl">🍒</span>
      </motion.div>

      {/* Toppings */}
      {selections.toppings && selections.toppings.length > 0 && (
        <motion.div
          className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1 z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          {selections.toppings.slice(0, 3).map((topping, i) => (
            <span key={i} className="text-lg">
              {toppingEmojis[topping.toLowerCase()] || '✨'}
            </span>
          ))}
        </motion.div>
      )}

      {/* Sauce */}
      <motion.div
        className="absolute top-12 left-1/2 -translate-x-1/2"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className={`w-12 h-2 ${sauce.color} rounded-full`} />
      </motion.div>

      {/* Scoop */}
      <motion.div
        className="absolute top-14 left-1/2 -translate-x-1/2"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <div className={`w-14 h-14 ${scoop.color} ${scoop.borderColor} border-2 rounded-full shadow-md`} />
      </motion.div>

      {/* Bowl */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
      >
        <div className={`w-20 h-12 ${bowl.color} border-2 rounded-b-full rounded-t-lg shadow-md`} />
      </motion.div>
    </div>
  );
}

// Redirect toast component
function RedirectToast({
  newUsername,
  onDismiss,
}: {
  newUsername: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
    >
      <div className="bg-white rounded-lg shadow-lg border border-indigo-200 p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            This survey has moved
          </p>
          <p className="text-sm text-gray-500 truncate">
            New location: <span className="font-mono text-indigo-600">{newUsername}</span>
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const slug = params.slug as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [finalSelections, setFinalSelections] = useState<FinalSelections>({});
  const [, setCopied] = useState(false);

  // Check if we were redirected from a previous username (passed via query param)
  const redirectedFromParam = searchParams.get('moved_from');
  const [redirectedFrom, setRedirectedFrom] = useState<string | null>(redirectedFromParam);

  // Check if this is demo mode
  const isDemoMode = username === 'demo';

  // Partial response tracking state
  const [sessionId, setSessionId] = useState<string>('');
  const [existingPartial, setExistingPartial] = useState<PartialResponse | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [initialAdventureState, setInitialAdventureState] = useState<Record<string, unknown> | undefined>(undefined);
  const lastSavedMilestoneRef = useRef<number>(0);

  // Handle progress updates from adventure components for partial saves
  const handleProgress = useCallback(async (progress: ProgressUpdate) => {
    if (!survey || isDemoMode) return;

    const totalStages = getAdventureTotalStages(survey.adventureType);
    const milestoneInfo = calculateMilestone(
      progress.currentStage,
      totalStages,
      lastSavedMilestoneRef.current
    );

    // Only save if we've reached a new milestone
    if (!milestoneInfo.shouldSave || !milestoneInfo.reachedMilestone) return;

    const currentSessionId = sessionId || getOrCreateSessionId(survey.id);
    if (!sessionId) {
      setSessionId(currentSessionId);
    }

    try {
      await savePartialResponse({
        surveyId: survey.id,
        sessionId: currentSessionId,
        answers: progress.answers,
        currentStage: progress.currentStage,
        totalStages,
        percentComplete: milestoneInfo.currentPercent,
        lastMilestone: milestoneInfo.reachedMilestone,
        respondentName: progress.respondentName,
        respondentEmail: progress.respondentEmail,
        adventureState: progress.adventureState,
      });

      lastSavedMilestoneRef.current = milestoneInfo.reachedMilestone;
      console.log(`[Partial Save] Saved at ${milestoneInfo.reachedMilestone}% milestone`);
    } catch (err) {
      console.error('Failed to save partial response:', err);
      // Don't interrupt the user's experience for partial save failures
    }
  }, [survey, isDemoMode, sessionId]);

  // Check for existing partial response when survey loads
  useEffect(() => {
    async function checkForPartialResponse() {
      if (!survey || isDemoMode) return;

      const currentSessionId = getOrCreateSessionId(survey.id);
      setSessionId(currentSessionId);

      try {
        const partial = await getPartialResponse(survey.id, currentSessionId);
        if (partial) {
          setExistingPartial(partial);
          setShowResumeDialog(true);
          lastSavedMilestoneRef.current = partial.lastMilestone;
        }
      } catch (err) {
        console.error('Failed to check for partial response:', err);
        // Continue without resume functionality
      }
    }

    checkForPartialResponse();
  }, [survey, isDemoMode]);

  // Handle resume from partial response
  const handleResume = () => {
    if (existingPartial?.adventureState) {
      setInitialAdventureState(existingPartial.adventureState);
    }
    setShowResumeDialog(false);
    setStarted(true);
    setStartTime(Date.now());
  };

  // Handle start fresh (delete partial and start over)
  const handleStartFresh = async () => {
    if (survey && existingPartial && sessionId) {
      try {
        await deletePartialResponse(survey.id, sessionId);
      } catch (err) {
        console.error('Failed to delete partial response:', err);
      }
    }
    setExistingPartial(null);
    lastSavedMilestoneRef.current = 0;
    setShowResumeDialog(false);
  };

  // Retry fetching survey
  const retryFetch = () => {
    setError(null);
    setErrorType(null);
    setLoading(true);
    fetchSurvey();
  };

  // Fetch survey data
  async function fetchSurvey() {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);

      // Demo mode: use hardcoded survey data
      if (isDemoMode) {
        const demoSurvey = demoSurveys[slug];
        if (!demoSurvey) {
          setError(`Demo survey "${slug}" not found. Try: test-survey, pizza-test, or garden-test`);
          setErrorType('not_found');
          setLoading(false);
          return;
        }
        console.log('[Demo Mode] Using hardcoded survey:', demoSurvey.title);
        setSurvey(demoSurvey);
        setLoading(false);
        return;
      }

      // Production mode: fetch from Firestore
      // First, get the user by username
      const user = await getUserByUsername(username);

      // If user not found, check if this is a previous username that should redirect
      if (!user) {
        const redirectResult = await getUserByPreviousUsername(username);
        if (redirectResult) {
          // Found a user who previously had this username - redirect to new URL with query param
          const newUrl = `/${redirectResult.currentUsername}/${slug}?moved_from=${username}`;
          router.replace(newUrl);
          return;
        }

        // No user found with current or previous username
        setError('User not found');
        setErrorType('not_found');
        setLoading(false);
        return;
      }

      // Then, get the published survey by userId and slug
      // Using getPublicSurveyBySlug which includes status='published' in the query
      // This is required for Firestore security rules to allow anonymous access
      const surveyData = await getPublicSurveyBySlug(user.id, slug);
      if (!surveyData) {
        // Survey not found or not published
        setError('Survey not found');
        setErrorType('not_found');
        setLoading(false);
        return;
      }

      // Check if survey has expired
      if (surveyData.settings.expiresAt && new Date() > surveyData.settings.expiresAt) {
        setError('This survey has expired');
        setErrorType('expired');
        setLoading(false);
        return;
      }

      // Check if survey has reached response limit
      if (surveyData.responseLimit && surveyData.paymentStatus !== 'unpaid') {
        const responseCount = await getResponseCountFast(surveyData.id);
        if (responseCount >= surveyData.responseLimit) {
          setError('This survey has reached its response limit');
          setErrorType('response_limit_reached');
          setLoading(false);
          return;
        }
      }

      setSurvey(surveyData);
    } catch (err) {
      console.error('Error fetching survey:', err);
      setError('Failed to load survey. Please check your connection and try again.');
      setErrorType('network');
    } finally {
      setLoading(false);
    }
  }

  // Fetch survey data on mount
  useEffect(() => {
    if (username && slug) {
      fetchSurvey();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, slug, isDemoMode]);

  const handleStart = () => {
    setStarted(true);
    setStartTime(Date.now());
  };

  // Handle completion from adventure components
  // Some components return Answer[], others return Record<string, string>
  const handleComplete = async (data: Answer[] | Record<string, string>) => {
    if (!survey) return;

    const completionTimeMs = Date.now() - startTime;
    const completionTime = Math.round(completionTimeMs / 1000);

    let respondentName: string | undefined;
    let respondentEmail: string | undefined;
    let surveyAnswers: Answer[] = [];

    // Check if data is Answer[] or Record<string, string>
    if (Array.isArray(data)) {
      // IceCreamSundae returns Answer[]
      for (const answer of data) {
        if (answer.questionId === 'respondent_name') {
          respondentName = answer.value as string;
        } else if (answer.questionId === 'respondent_email') {
          respondentEmail = answer.value as string;
        } else {
          surveyAnswers.push(answer);
        }
      }
    } else {
      // Other components return Record<string, string>
      surveyAnswers = Object.entries(data).map(([questionId, value]) => ({
        questionId,
        value,
      }));
    }

    // Extract visual selections for completion screen
    const selections: FinalSelections = {
      respondentName,
    };

    // Try to extract visual choices from answers
    surveyAnswers.forEach((answer, index) => {
      const value = Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value);
      if (index === 0) selections.bowl = value;
      if (index === 1) selections.scoop = value;
      if (index === 2) selections.sauce = value;
      if (index === 3) selections.toppings = Array.isArray(answer.value) ? answer.value as string[] : [value];
    });

    setFinalSelections(selections);

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Rate limiting check (skip for demo mode)
      if (!isDemoMode) {
        const rateLimitResult = checkRateLimit(RATE_LIMITS.surveySubmission, survey.id);
        if (!rateLimitResult.allowed) {
          setSubmitError(
            `Too many submissions. Please wait ${formatResetTime(rateLimitResult.resetIn)} before trying again.`
          );
          setSubmitting(false);
          return;
        }

        // Spam detection
        const spamCheck = detectSpamSubmission({
          answers: surveyAnswers,
          completionTimeMs,
          surveyQuestionCount: survey.questions.length,
        });

        if (spamCheck.isSpam) {
          console.warn('Spam submission detected:', spamCheck.reason);
          // Still allow submission but log it - could add more aggressive blocking later
        }
      }

      // Demo mode: log to console instead of saving to Firestore
      if (isDemoMode) {
        const responseData = {
          surveyId: survey.id,
          surveyTitle: survey.title,
          respondentName,
          respondentEmail,
          answers: surveyAnswers,
          metadata: {
            completionTime,
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
          },
          completedAt: new Date().toISOString(),
        };

        console.log('═══════════════════════════════════════════════════════');
        console.log('[Demo Mode] Survey Response Data:');
        console.log('═══════════════════════════════════════════════════════');
        console.log(JSON.stringify(responseData, null, 2));
        console.log('═══════════════════════════════════════════════════════');
        console.log('In production, this would be saved to Firestore.');
        console.log('═══════════════════════════════════════════════════════');

        // Simulate a small delay like a real API call
        await new Promise(resolve => setTimeout(resolve, 500));

        setCompleted(true);
        return;
      }

      // Production mode: Save response to Firestore with atomic limit check
      await createResponse(
        survey.id,
        {
          respondentName,
          respondentEmail,
          answers: surveyAnswers,
        },
        {
          completionTime,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        },
        survey.responseLimit
      );

      // Record successful submission for rate limiting
      recordRequest(RATE_LIMITS.surveySubmission, survey.id);

      // Delete partial response on successful completion
      if (sessionId) {
        try {
          await deletePartialResponse(survey.id, sessionId);
          clearSession(survey.id);
          console.log('[Partial Response] Deleted on completion');
        } catch (deleteErr) {
          console.error('Failed to delete partial response:', deleteErr);
          // Don't fail the submission for cleanup errors
        }
      }

      setCompleted(true);
    } catch (err) {
      console.error('Error saving response:', err);
      if (err instanceof ResponseLimitExceededError) {
        setSubmitError('This survey has reached its response limit. Your response could not be saved.');
      } else {
        setSubmitError('Failed to save your response. Please try again.');
      }
      // Don't mark as completed if there was an error - let user retry
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    // Retry submission with cached data
    if (survey && finalSelections.respondentName !== undefined) {
      handleComplete([
        { questionId: 'respondent_name', value: finalSelections.respondentName || '' },
        { questionId: 'respondent_email', value: '' },
        ...(survey.questions.map((q, i) => ({
          questionId: q.id,
          value: i === 0 ? finalSelections.bowl || '' :
                 i === 1 ? finalSelections.scoop || '' :
                 i === 2 ? finalSelections.sauce || '' :
                 finalSelections.toppings || [],
        }))),
      ]);
    }
  };

  const _handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  void _handleShare;

  // Render the appropriate adventure component based on type
  const renderAdventure = () => {
    if (!survey) return null;

    // IceCreamSundae expects Answer[], others expect Record<string, string>
    // Our handleComplete handles both types
    const questions = survey.questions;

    // Only pass initialState if we're resuming from a partial response
    // Validate that it's an object before passing to prevent runtime errors
    const adventureInitialState = initialAdventureState && typeof initialAdventureState === 'object'
      ? initialAdventureState
      : undefined;

    switch (survey.adventureType) {
      case 'classic':
        return (
          <ClassicSurvey
            questions={questions}
            onComplete={(responses: Answer[]) => handleComplete(responses)}
            onProgress={handleProgress}
            initialState={adventureInitialState as Parameters<typeof ClassicSurvey>[0]['initialState']}
            allowAnonymous={survey.settings?.allowAnonymous}
          />
        );
      case 'ice-cream-sundae':
        return (
          <IceCreamSundae
            questions={questions}
            onComplete={(responses: Answer[]) => handleComplete(responses)}
            onProgress={handleProgress}
            initialState={adventureInitialState as Parameters<typeof IceCreamSundae>[0]['initialState']}
            allowAnonymous={survey.settings?.allowAnonymous}
          />
        );
      case 'pizza-builder':
        return (
          <PizzaBuilder
            questions={questions}
            onComplete={(responses: Answer[]) => handleComplete(responses)}
            onProgress={handleProgress}
            initialState={adventureInitialState as Parameters<typeof PizzaBuilder>[0]['initialState']}
            allowAnonymous={survey.settings?.allowAnonymous}
          />
        );
      case 'garden-grower':
        return (
          <GardenGrower
            questions={questions}
            onComplete={(responses: Answer[]) => handleComplete(responses)}
            onProgress={handleProgress}
            initialState={adventureInitialState as Parameters<typeof GardenGrower>[0]['initialState']}
            allowAnonymous={survey.settings?.allowAnonymous}
          />
        );
      case 'dream-home':
        return (
          <DreamHome
            questions={questions}
            onComplete={(responses: Answer[]) => handleComplete(responses)}
            onProgress={handleProgress}
            initialState={adventureInitialState as Parameters<typeof DreamHome>[0]['initialState']}
            allowAnonymous={survey.settings?.allowAnonymous}
          />
        );
      case 'coffee-brewer':
        return (
          <CoffeeBrewer
            questions={questions}
            onComplete={(responses: Answer[]) => handleComplete(responses)}
            onProgress={handleProgress}
            initialState={adventureInitialState as Parameters<typeof CoffeeBrewer>[0]['initialState']}
            allowAnonymous={survey.settings?.allowAnonymous}
          />
        );
      default:
        return (
          <ClassicSurvey
            questions={questions}
            onComplete={(responses: Answer[]) => handleComplete(responses)}
            onProgress={handleProgress}
            initialState={adventureInitialState as Parameters<typeof ClassicSurvey>[0]['initialState']}
            allowAnonymous={survey.settings?.allowAnonymous}
          />
        );
    }
  };

  // Loading state - use skeleton loader
  if (loading) {
    return <SurveySkeleton />;
  }

  // Error states - use specific error components based on error type
  if (error || !survey) {
    const handleBack = () => window.history.back();

    switch (errorType) {
      case 'network':
        return (
          <NetworkError
            message={error || undefined}
            onRetry={retryFetch}
          />
        );
      case 'expired':
        return (
          <SurveyExpired
            message={error || undefined}
            onBack={handleBack}
          />
        );
      case 'unavailable':
        return (
          <SurveyUnavailable
            message={error || undefined}
            onBack={handleBack}
          />
        );
      case 'response_limit_reached':
        return (
          <ResponseLimitReached
            message={error || undefined}
            onBack={handleBack}
          />
        );
      case 'not_found':
      default:
        return (
          <SurveyNotFound
            message={error || undefined}
            onBack={handleBack}
            showCreateLink={true}
          />
        );
    }
  }

  // Welcome screen before starting
  if (!started) {
    const emoji = getAdventureEmoji(survey.adventureType);

    // Show resume dialog if there's an existing partial response
    if (showResumeDialog && existingPartial) {
      return (
        <ResumeDialog
          milestone={existingPartial.lastMilestone}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
        />
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 flex items-center justify-center p-6">
        {/* Redirect toast notification */}
        <AnimatePresence>
          {redirectedFrom && (
            <RedirectToast
              newUsername={redirectedFrom}
              onDismiss={() => setRedirectedFrom(null)}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card padding="lg">
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-6"
              >
                {emoji}
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {survey.title}
              </h1>
              {survey.description && (
                <p className="text-gray-600 mb-6">{survey.description}</p>
              )}
              <Button size="lg" className="w-full" onClick={handleStart}>
                Start Adventure
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Submission error state - use SubmissionError component
  if (submitError) {
    return (
      <SubmissionError
        message={submitError}
        onRetry={handleRetry}
        onSkip={() => {
          setSubmitError(null);
          setCompleted(true);
        }}
      />
    );
  }

  // Completion screen with final visual
  if (completed) {
    const _isIceCream = survey.adventureType === 'ice-cream-sundae';
    const _adventureLabel = getAdventureLabel(survey.adventureType);
    void _isIceCream;
    void _adventureLabel;

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card padding="lg">
            <div className="text-center">
              {/* Show celebration icon with adventure-specific emoji */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="text-6xl mb-6"
              >
                {getAdventureEmoji(survey.adventureType)}
              </motion.div>

              <motion.h1
                className="text-2xl font-bold text-gray-900 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Thanks for completing this challenge!
              </motion.h1>

              <motion.p
                className="text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Your response has been recorded.
              </motion.p>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-sm text-gray-500">
                  You can safely close this tab now.
                </p>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show submitting overlay if saving - use SavingIndicator component
  if (submitting) {
    return <SavingIndicator message="Saving your response..." />;
  }

  // The actual adventure/survey
  return renderAdventure();
}
