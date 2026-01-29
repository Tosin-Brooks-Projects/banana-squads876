'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Answer, OnProgressCallback, isMultipleChoiceQuestion } from '@/lib/types';
import FinalThoughts from './shared/FinalThoughts';

interface CoffeeBrewerInitialState {
  currentStage: number;
  selectedChoices: SelectedChoices;
  answerMap: AnswerMap;
  formData: FormData;
}

interface CoffeeBrewerProps {
  questions: Question[];
  onComplete: (responses: Answer[]) => void;
  onProgress?: OnProgressCallback;
  initialState?: CoffeeBrewerInitialState;
  allowAnonymous?: boolean;
}

interface FormData {
  name: string;
  email: string;
}

interface SelectedChoices {
  beans: string;
  grind: string;
  method: string;
  finishing: string | string[]; // Can be array if allowMultiple is true
}

interface AnswerMap {
  [questionId: string]: {
    visualId: string | string[];
    answerValue: string | string[];
  };
}

// Animation variants
const stageVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const }
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: { duration: 0.3, ease: 'easeIn' as const }
  }
};

const buttonHoverVariants = {
  hover: {
    scale: 1.05,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

// Visual options
const beanOptions = [
  { id: 'light', name: 'Light Roast', color: 'bg-amber-400', beanColor: '#d97706' },
  { id: 'medium', name: 'Medium Roast', color: 'bg-amber-600', beanColor: '#92400e' },
  { id: 'dark', name: 'Dark Roast', color: 'bg-amber-900', beanColor: '#451a03' },
];

const grindOptions = [
  { id: 'fine', name: 'Fine', particleSize: 'w-0.5 h-0.5' },
  { id: 'medium', name: 'Medium', particleSize: 'w-1 h-1' },
  { id: 'coarse', name: 'Coarse', particleSize: 'w-1.5 h-1.5' },
];

const methodOptions = [
  { id: 'drip', name: 'Drip', icon: '☕' },
  { id: 'frenchpress', name: 'French Press', icon: '🫖' },
  { id: 'espresso', name: 'Espresso', icon: '☕' },
];

const finishingOptions = [
  { id: 'option1', name: 'Option 1' },
  { id: 'option2', name: 'Option 2' },
  { id: 'option3', name: 'Option 3' },
  { id: 'option4', name: 'Option 4' },
];

const confettiColors = ['#92400e', '#d97706', '#fbbf24', '#f59e0b', '#b45309', '#78350f'];

function getQuestionOptions(question: Question | undefined): string[] {
  if (!question) return [];

  // Multiple choice questions have options array
  if ('options' in question && question.options) {
    return question.options;
  }

  // Rating questions need generated options based on scale
  if (question.type === 'rating' && 'scale' in question) {
    const scale = question.scale || 5;
    return Array.from({ length: scale }, (_, i) => {
      const value = i + 1;
      if (value === 1 && question.startLabel) return question.startLabel;
      if (value === scale && question.endLabel) return question.endLabel;
      return String(value);
    });
  }

  // Emoji slider questions - use scale with optional labels
  if (question.type === 'emoji-slider' && 'scale' in question) {
    const scale = question.scale || 5;
    return Array.from({ length: scale }, (_, i) => {
      const value = i + 1;
      if (value === 1 && question.labels?.start) return question.labels.start;
      if (value === scale && question.labels?.end) return question.labels.end;
      return String(value);
    });
  }

  return [];
}

function mapQuestionToVisualOptions<T extends { id: string; name: string }>(
  question: Question | undefined,
  visualOptions: T[]
): Array<T & { answerValue: string; id: string }> {
  const questionOptions = getQuestionOptions(question);

  // If no question options, return empty - don't use visual names as answers
  if (questionOptions.length === 0) {
    return [];
  }

  // Map question options to visual options, cycling through visuals if needed
  // IMPORTANT: Use unique index-based IDs to prevent duplicate selection bugs
  return questionOptions.map((option, index) => {
    const visualOption = visualOptions[index % visualOptions.length];
    return {
      ...visualOption,
      id: `option-${index}`, // Unique ID based on index, not visual option
      answerValue: option,
    };
  });
}

// Steam Particle Component
function SteamParticles({ isActive, intensity = 1 }: { isActive: boolean; intensity?: number }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    delay: number;
    duration: number;
    size: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const count = Math.floor(8 * intensity);
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 1.5,
        size: 4 + Math.random() * 8,
      }));
      setParticles(newParticles);
    }
  }, [isActive, intensity]);

  if (!isActive) return null;

  return (
    <div className="absolute -top-16 left-0 right-0 h-20 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/60"
          style={{
            left: `${particle.x}%`,
            bottom: 0,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [-10, -60],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1.2],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// Confetti Component
function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }));
      setParticles(newParticles);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${particle.x}%`,
            top: -20,
            backgroundColor: particle.color,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Coffee Counter Display Component
function CoffeeDisplay({
  currentStage,
  selectedChoices,
  isPouringCoffee,
  isGrinding,
  showLatteArt,
}: {
  currentStage: number;
  selectedChoices: SelectedChoices;
  isPouringCoffee: boolean;
  isGrinding: boolean;
  showLatteArt: boolean;
}) {
  const beans = beanOptions.find(b => b.id === selectedChoices.beans);
  const grind = grindOptions.find(g => g.id === selectedChoices.grind);
  const method = methodOptions.find(m => m.id === selectedChoices.method);
  const _finishing = finishingOptions.find(f => f.id === selectedChoices.finishing);
  void _finishing;

  // Get coffee color based on roast (toppings don't change coffee color)
  const getCoffeeColor = () => {
    return beans?.color || 'bg-amber-700';
  };

  return (
    <div className="relative w-80 h-72 mx-auto">
      {/* Warm gradient background */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200">
        {/* Cozy morning light effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/40 rounded-full blur-3xl" />
      </div>

      {/* Counter/table surface */}
      <div className="absolute bottom-0 w-full h-20 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-2xl">
        <div className="absolute top-0 w-full h-2 bg-amber-700" />
        {/* Wood grain lines */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-amber-950/30" style={{ marginTop: `${i * 4}px` }} />
          ))}
        </div>
      </div>

      {/* Bean bag - Stage 0 */}
      <AnimatePresence>
        {currentStage >= 0 && currentStage < 2 && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute left-4 bottom-20"
          >
            <div className="relative">
              {/* Bag */}
              <div className={`w-16 h-20 ${beans?.color || 'bg-amber-700'} rounded-t-lg rounded-b-sm shadow-lg`}>
                <div className="absolute top-2 left-2 right-2 h-2 bg-white/20 rounded-full" />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-white/80 font-medium">
                  ☕
                </div>
              </div>
              {/* Beans falling animation */}
              {currentStage === 0 && beans && (
                <motion.div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-3 rounded-full"
                      style={{ backgroundColor: beans.beanColor }}
                      animate={{
                        y: [0, 30, 0],
                        opacity: [1, 0.5, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grinder - Stage 1 */}
      <AnimatePresence>
        {currentStage >= 1 && currentStage < 3 && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-20"
          >
            <div className="relative">
              {/* Grinder body */}
              <div className="w-20 h-24 bg-slate-700 rounded-lg shadow-lg">
                {/* Hopper */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-8 bg-slate-600 rounded-t-lg border-b-2 border-slate-500" />
                {/* Display */}
                <div className="absolute top-4 left-2 right-2 h-6 bg-slate-900 rounded flex items-center justify-center">
                  <span className="text-xs text-green-400 font-mono">{grind?.name || '---'}</span>
                </div>
                {/* Portafilter area */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-slate-500 rounded" />
              </div>
              {/* Grinding animation */}
              {isGrinding && grind && (
                <motion.div
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap gap-0.5 w-8 justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={`${grind.particleSize} rounded-full`}
                      style={{ backgroundColor: beans?.beanColor || '#92400e' }}
                      animate={{
                        y: [0, 20],
                        opacity: [1, 0],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brewing Equipment - Stage 2+ */}
      <AnimatePresence>
        {currentStage >= 2 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute left-8 bottom-20"
          >
            {method?.id === 'drip' && (
              <div className="relative">
                {/* Drip coffee maker */}
                <div className="w-14 h-20 bg-slate-800 rounded-lg shadow-lg">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-6 bg-slate-600 rounded" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-100 rounded border-2 border-amber-200" />
                </div>
              </div>
            )}
            {method?.id === 'frenchpress' && (
              <div className="relative">
                {/* French press */}
                <div className="w-12 h-20 bg-amber-100 rounded-lg border-2 border-amber-300 shadow-lg overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-6 bg-slate-600 rounded-b" />
                  <div className={`absolute bottom-0 w-full h-12 ${beans?.color || 'bg-amber-700'}`} />
                </div>
              </div>
            )}
            {method?.id === 'espresso' && (
              <div className="relative">
                {/* Espresso machine */}
                <div className="w-16 h-20 bg-slate-700 rounded-lg shadow-lg">
                  <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <div className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-500 rounded" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-2 bg-slate-600 rounded-full" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coffee Cup - Always visible from stage 2 */}
      <AnimatePresence>
        {currentStage >= 2 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: showLatteArt ? [1, 1.1, 1] : 1,
              rotate: showLatteArt ? [0, -5, 5, -3, 3, 0] : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: 0.2,
              scale: { duration: 0.5, delay: 0 },
              rotate: { duration: 0.6, delay: 0.1 },
            }}
            className="absolute right-8 bottom-20"
          >
            <div className="relative">
              {/* Cup */}
              <div className="w-16 h-14 bg-white rounded-b-2xl border-4 border-gray-200 overflow-hidden shadow-lg">
                {/* Coffee fill */}
                <AnimatePresence>
                  {currentStage >= 4 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: '85%' }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className={`absolute bottom-0 w-full ${getCoffeeColor()}`}
                    >
                      {/* Whipped cream topping - shows on completion */}
                      {showLatteArt && (
                        <motion.div
                          className="absolute -top-6 left-1/2 -translate-x-1/2"
                          initial={{ opacity: 0, scale: 0, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 200 }}
                        >
                          {/* Main whipped cream swirl */}
                          <div className="relative">
                            <div className="w-10 h-5 bg-white rounded-t-full shadow-md" />
                            <div className="w-8 h-4 bg-white rounded-t-full mx-auto -mt-2 shadow-sm" />
                            <div className="w-5 h-3 bg-white rounded-t-full mx-auto -mt-1" />
                            {/* Cherry on top */}
                            <motion.div
                              className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-sm"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
                            >
                              <div className="absolute -top-1 left-1/2 w-0.5 h-2 bg-green-600 rounded-full" />
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cup handle */}
              <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-8 border-4 border-gray-200 rounded-r-full bg-transparent" />

              {/* Steam */}
              <SteamParticles isActive={currentStage >= 4} intensity={showLatteArt ? 1.5 : 1} />

              {/* Pour animation */}
              <AnimatePresence>
                {isPouringCoffee && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 40, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute -top-10 left-1/2 -translate-x-1/2 w-2 ${beans?.color || 'bg-amber-700'} rounded-full`}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saucer under cup */}
      <AnimatePresence>
        {currentStage >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
            className="absolute right-4 bottom-18 w-20 h-3 bg-white rounded-full shadow-md border border-gray-100"
            style={{ bottom: '72px' }}
          />
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {currentStage === 0 && !beans && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-amber-700 text-sm text-center bg-white/80 px-4 py-2 rounded-lg">
              Your perfect coffee<br />starts here!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CoffeeBrewer({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: CoffeeBrewerProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? {
      beans: '',
      grind: '',
      method: '',
      finishing: '',
    }
  );
  const [answerMap, setAnswerMap] = useState<AnswerMap>(initialState?.answerMap ?? {});
  const [formData, setFormData] = useState<FormData>(
    initialState?.formData ?? {
      name: '',
      email: '',
    }
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPouringCoffee, setIsPouringCoffee] = useState(false);
  const [isGrinding, setIsGrinding] = useState(false);
  const [showLatteArt, setShowLatteArt] = useState(false);
  const [additionalThoughts, setAdditionalThoughts] = useState('');

  const reportProgress = useCallback(() => {
    if (!onProgress || currentStage === 0 || currentStage >= 6) return;

    const answers: Answer[] = questions.map((question) => {
      const entry = answerMap[question.id];
      return {
        questionId: question.id,
        value: entry?.answerValue || '',
      };
    });

    onProgress({
      currentStage,
      totalStages: allowAnonymous ? 6 : 7,
      answers,
      adventureState: {
        currentStage,
        selectedChoices,
        answerMap,
        formData,
      },
      respondentName: allowAnonymous ? undefined : (formData.name || undefined),
      respondentEmail: allowAnonymous ? undefined : (formData.email || undefined),
    });
  }, [onProgress, currentStage, questions, answerMap, selectedChoices, formData, allowAnonymous]);

  useEffect(() => {
    reportProgress();
  }, [currentStage, reportProgress]);

  const mappedBeanOptions = mapQuestionToVisualOptions(questions[0], beanOptions);
  const mappedGrindOptions = mapQuestionToVisualOptions(questions[1], grindOptions);
  const mappedMethodOptions = mapQuestionToVisualOptions(questions[2], methodOptions);
  const mappedFinishingOptions = mapQuestionToVisualOptions(questions[3], finishingOptions);

  const handleBeansSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, beans: visualId }));
    if (questions[0]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[0].id]: { visualId, answerValue },
      }));
    }
    setTimeout(() => setCurrentStage(1), 500);
  };

  const handleGrindSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, grind: visualId }));
    if (questions[1]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[1].id]: { visualId, answerValue },
      }));
    }
    setIsGrinding(true);
    setTimeout(() => {
      setIsGrinding(false);
      setCurrentStage(2);
    }, 1500);
  };

  const handleMethodSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, method: visualId }));
    if (questions[2]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[2].id]: { visualId, answerValue },
      }));
    }
    // Skip FormCapture stage if anonymous
    if (allowAnonymous) {
      setCurrentStage(4);
      // Trigger pour animation
      setIsPouringCoffee(true);
      setTimeout(() => setIsPouringCoffee(false), 1500);
    } else {
      setCurrentStage(3);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      setCurrentStage(4);
      // Trigger pour animation
      setIsPouringCoffee(true);
      setTimeout(() => setIsPouringCoffee(false), 1500);
    }
  };

  // Check if the finishing question allows multiple selections
  const finishingQuestion = questions[3];
  const allowMultipleFinishing = finishingQuestion &&
    isMultipleChoiceQuestion(finishingQuestion) &&
    finishingQuestion.allowMultiple === true;

  const handleFinishingSelect = (visualId: string, answerValue: string) => {
    if (allowMultipleFinishing) {
      // Multi-select mode: toggle the selection
      setSelectedChoices(prev => {
        const currentFinishing = Array.isArray(prev.finishing) ? prev.finishing :
          (prev.finishing ? [prev.finishing] : []);
        const isSelected = currentFinishing.includes(visualId);
        const newFinishing = isSelected
          ? currentFinishing.filter(id => id !== visualId)
          : [...currentFinishing, visualId];
        return { ...prev, finishing: newFinishing };
      });
      if (questions[3]) {
        setAnswerMap(prev => {
          const currentEntry = prev[questions[3].id];
          const currentIds = Array.isArray(currentEntry?.visualId) ? currentEntry.visualId :
            (currentEntry?.visualId ? [currentEntry.visualId] : []);
          const currentValues = Array.isArray(currentEntry?.answerValue) ? currentEntry.answerValue :
            (currentEntry?.answerValue ? [currentEntry.answerValue] : []);

          const isSelected = currentIds.includes(visualId);
          const newIds = isSelected
            ? currentIds.filter(id => id !== visualId)
            : [...currentIds, visualId];
          const newValues = isSelected
            ? currentValues.filter(v => v !== answerValue)
            : [...currentValues, answerValue];

          return {
            ...prev,
            [questions[3].id]: { visualId: newIds, answerValue: newValues },
          };
        });
      }
    } else {
      // Single-select mode: replace the selection
      setSelectedChoices(prev => ({ ...prev, finishing: visualId }));
      if (questions[3]) {
        setAnswerMap(prev => ({
          ...prev,
          [questions[3].id]: { visualId, answerValue },
        }));
      }
    }
  };

  const handleGoToFinalThoughts = () => {
    setCurrentStage(5);
  };

  const handleComplete = () => {
    setCurrentStage(6);
    setShowLatteArt(true);
    setShowConfetti(true);

    const answers: Answer[] = questions.map((question) => {
      const entry = answerMap[question.id];
      return {
        questionId: question.id,
        value: entry?.answerValue || '',
      };
    });

    // Only include name/email if not anonymous
    if (!allowAnonymous) {
      answers.push(
        { questionId: 'respondent_name', value: formData.name },
        { questionId: 'respondent_email', value: formData.email }
      );
    }
    answers.push({ questionId: 'additional_thoughts', value: additionalThoughts });

    onComplete(answers);

    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleBack = () => {
    if (currentStage > 0) {
      // Skip FormCapture stage (3) when going back if anonymous
      if (allowAnonymous && currentStage === 4) {
        setCurrentStage(2);
      } else {
        setCurrentStage(prev => prev - 1);
      }
    }
  };

  const renderStage = () => {
    switch (currentStage) {
      case 0:
        return (
          <BeansSelection
            question={questions[0]}
            options={mappedBeanOptions}
            onSelect={handleBeansSelect}
          />
        );
      case 1:
        return (
          <GrindSelection
            question={questions[1]}
            options={mappedGrindOptions}
            selectedBeans={selectedChoices.beans}
            onSelect={handleGrindSelect}
            isGrinding={isGrinding}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <MethodSelection
            question={questions[2]}
            options={mappedMethodOptions}
            onSelect={handleMethodSelect}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <FormCapture
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <FinishingSelection
            question={questions[3]}
            options={mappedFinishingOptions}
            selectedFinishing={selectedChoices.finishing}
            allowMultiple={allowMultipleFinishing}
            onSelect={handleFinishingSelect}
            onComplete={handleGoToFinalThoughts}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <FinalThoughts
            value={additionalThoughts}
            onChange={setAdditionalThoughts}
            onContinue={handleComplete}
            onBack={handleBack}
            theme="coffee"
            respondentName={formData.name}
          />
        );
      case 6:
        return <CompletionStage name={formData.name} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 flex flex-col items-center justify-start md:justify-center p-3 sm:p-6 lg:p-8">
      <Confetti isActive={showConfetti} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 sm:mb-4 pt-2 sm:pt-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-800 mb-1 sm:mb-2">
          Brew Your Perfect Coffee!
        </h1>
        {currentStage < 6 && (
          <motion.p
            className="text-amber-600 text-sm sm:text-base"
            key={currentStage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {(() => {
              const totalStages = allowAnonymous ? 5 : 6;
              // Adjust displayed stage number when anonymous (skip stage 3)
              const displayStage = allowAnonymous && currentStage >= 4 ? currentStage : currentStage + 1;
              return `Stage ${displayStage} of ${totalStages}`;
            })()}
          </motion.p>
        )}
      </motion.div>

      {/* Main content */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 lg:gap-8">
        {/* Coffee Display */}
        <motion.div
          className="flex-shrink-0 bg-white/50 rounded-2xl p-3 sm:p-4 lg:p-6 backdrop-blur-sm w-full md:w-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <CoffeeDisplay
            currentStage={currentStage}
            selectedChoices={selectedChoices}
            isPouringCoffee={isPouringCoffee}
            isGrinding={isGrinding}
            showLatteArt={showLatteArt}
          />
        </motion.div>

        {/* Stage content */}
        <div className="w-full md:max-w-lg flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              variants={stageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {renderStage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Stage 0: Beans Selection
function BeansSelection({
  question,
  options,
  onSelect,
}: {
  question?: Question;
  options: Array<typeof beanOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        {question?.question || 'Choose Your Beans'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="min-h-[6rem] p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer
              active:bg-amber-100 active:border-amber-500
              [@media(hover:hover)]:hover:border-amber-400 [@media(hover:hover)]:hover:bg-amber-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Coffee bag illustration */}
            <div className={`w-12 h-14 mx-auto ${option.color} rounded-t-lg rounded-b-sm mb-3 relative shadow-md`}>
              <div className="absolute top-2 left-1 right-1 h-1.5 bg-white/30 rounded-full" />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-lg">☕</div>
            </div>
            <div className="font-medium text-gray-700 text-[11px] sm:text-sm text-center leading-snug line-clamp-3" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 1: Grind Selection
function GrindSelection({
  question,
  options,
  selectedBeans,
  onSelect,
  isGrinding,
  onBack,
}: {
  question?: Question;
  options: Array<typeof grindOptions[0] & { answerValue: string }>;
  selectedBeans: string;
  onSelect: (visualId: string, answerValue: string) => void;
  isGrinding: boolean;
  onBack?: () => void;
}) {
  const beans = beanOptions.find(b => b.id === selectedBeans);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-3 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        {question?.question || 'Select Grind Setting'}
      </h2>

      {isGrinding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-amber-50 rounded-xl text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block text-3xl mb-2"
          >
            ⚙️
          </motion.div>
          <p className="text-amber-700 font-medium">Grinding your beans...</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => !isGrinding && onSelect(option.id, option.answerValue)}
            disabled={isGrinding}
            className={`min-h-[6rem] p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer
              ${isGrinding ? 'opacity-50 cursor-not-allowed' : ''}
              active:bg-amber-100 active:border-amber-500
              [@media(hover:hover)]:hover:border-amber-400 [@media(hover:hover)]:hover:bg-amber-50`}
            variants={buttonHoverVariants}
            whileHover={isGrinding ? {} : 'hover'}
            whileTap={isGrinding ? {} : 'tap'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Grind particles illustration */}
            <div className="flex justify-center gap-1 mb-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`${option.particleSize} rounded-full`}
                  style={{ backgroundColor: beans?.beanColor || '#92400e' }}
                />
              ))}
            </div>
            <div className="font-medium text-gray-700 text-[11px] sm:text-sm text-center leading-snug line-clamp-3" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 2: Brewing Method Selection
function MethodSelection({
  question,
  options,
  onSelect,
  onBack,
}: {
  question?: Question;
  options: Array<typeof methodOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
  onBack?: () => void;
}) {
  const renderMethodIcon = (id: string) => {
    if (id === 'drip') {
      return (
        <div className="w-12 h-16 mx-auto mb-3 relative">
          <div className="w-10 h-12 bg-slate-700 rounded-lg mx-auto">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-4 bg-slate-500 rounded" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-amber-100 rounded border border-amber-200" />
          </div>
        </div>
      );
    }
    if (id === 'frenchpress') {
      return (
        <div className="w-10 h-16 mx-auto mb-3 relative">
          <div className="w-8 h-14 bg-amber-100 rounded-lg border-2 border-amber-300 mx-auto overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-slate-600" />
            <div className="absolute bottom-0 w-full h-8 bg-amber-700" />
          </div>
        </div>
      );
    }
    // Espresso
    return (
      <div className="w-14 h-16 mx-auto mb-3 relative">
        <div className="w-12 h-12 bg-slate-700 rounded-lg mx-auto">
          <div className="absolute top-1 left-2 w-2 h-2 bg-red-500 rounded-full" />
          <div className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-slate-500 rounded" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-3 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        {question?.question || 'Choose Brewing Method'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="min-h-[7rem] p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer
              active:bg-amber-100 active:border-amber-500
              [@media(hover:hover)]:hover:border-amber-400 [@media(hover:hover)]:hover:bg-amber-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {renderMethodIcon(option.id)}
            <div className="font-medium text-gray-700 text-[11px] sm:text-sm text-center leading-snug line-clamp-3" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Inline error component
function InlineFormError({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="text-red-500 text-sm mt-1 flex items-center gap-1"
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </motion.p>
  );
}

// Stage 3: Form Capture
function FormCapture({
  formData,
  setFormData,
  onSubmit,
  onBack,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
}) {
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});

  const validateName = (value: string) => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return undefined;
  };

  const validateEmail = (value: string) => {
    if (!value) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return undefined;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
    if (touched.name) {
      setErrors(prev => ({ ...prev, name: validateName(value) }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }));
    setErrors(prev => ({ ...prev, name: validateName(formData.name) }));
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    setErrors(prev => ({ ...prev, email: validateEmail(formData.email) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    setErrors({ name: nameError, email: emailError });
    setTouched({ name: true, email: true });
    if (!nameError && !emailError) {
      onSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-3 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
        While your coffee brews...
      </h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Who should we make this for?</p>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            Name <span className="text-amber-600">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            className={`w-full px-4 py-3 text-base rounded-lg border-2
              focus:outline-none transition-colors min-h-[48px] touch-manipulation
              ${errors.name && touched.name
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-200 focus:border-amber-400'
              }`}
            placeholder="Your name"
          />
          <AnimatePresence>
            {errors.name && touched.name && <InlineFormError message={errors.name} />}
          </AnimatePresence>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-3 text-base rounded-lg border-2
              focus:outline-none transition-colors min-h-[48px] touch-manipulation
              ${errors.email && touched.email
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-200 focus:border-amber-400'
              }`}
            placeholder="your@email.com"
          />
          <AnimatePresence>
            {errors.email && touched.email && <InlineFormError message={errors.email} />}
          </AnimatePresence>
        </motion.div>
        <motion.button
          type="submit"
          className="w-full py-3 px-6 min-h-[48px] bg-amber-600 text-white font-semibold rounded-lg
            transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
            cursor-pointer touch-manipulation active:bg-amber-800
            [@media(hover:hover)]:hover:bg-amber-700"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Pour My Coffee ☕
        </motion.button>
      </form>
    </div>
  );
}

// Stage 4: Finishing Touches Selection
function FinishingSelection({
  question,
  options,
  selectedFinishing,
  allowMultiple = false,
  onSelect,
  onComplete,
  onBack,
}: {
  question?: Question;
  options: Array<typeof finishingOptions[0] & { answerValue: string; id: string }>;
  selectedFinishing: string | string[];
  allowMultiple?: boolean;
  onSelect: (visualId: string, answerValue: string) => void;
  onComplete: () => void;
  onBack?: () => void;
}) {
  // Helper to check if an option is selected (works for both single and multi-select)
  const isOptionSelected = (optionId: string) => {
    if (Array.isArray(selectedFinishing)) {
      return selectedFinishing.includes(optionId);
    }
    return selectedFinishing === optionId;
  };

  // Check if at least one option is selected
  const hasSelection = Array.isArray(selectedFinishing)
    ? selectedFinishing.length > 0
    : Boolean(selectedFinishing);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-3 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
        {question?.question || 'One last question...'}
      </h2>
      {allowMultiple && (
        <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
      )}
      {!allowMultiple && <div className="mb-4" />}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        {options.map((option, index) => {
          const isSelected = isOptionSelected(option.id);
          return (
            <motion.button
              key={option.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(option.id, option.answerValue);
              }}
              className={`relative p-4 rounded-xl border-2 transition-all focus:outline-none cursor-pointer
                ${isSelected
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300'
                  : 'border-gray-200 bg-white [@media(hover:hover)]:hover:border-amber-300'
                }`}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="text-[11px] sm:text-sm font-medium text-gray-700 py-2 text-center leading-snug line-clamp-3" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>{option.answerValue}</div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={onComplete}
        disabled={!hasSelection}
        className="w-full py-3 px-6 min-h-[48px] bg-amber-600 text-white font-semibold rounded-lg
          transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
          flex items-center justify-center gap-2 cursor-pointer touch-manipulation
          disabled:bg-gray-300 disabled:cursor-not-allowed
          active:bg-amber-800 [@media(hover:hover)]:hover:bg-amber-700"
        whileHover={{ scale: hasSelection ? 1.02 : 1, boxShadow: hasSelection ? '0 10px 25px -5px rgba(217, 119, 6, 0.4)' : 'none' }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.span
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          ☕
        </motion.span>
        <span className="text-sm sm:text-base">Enjoy Your Coffee!</span>
      </motion.button>
    </div>
  );
}

// Stage 5: Completion
function CompletionStage({ name }: { name: string }) {
  void name; // Unused but kept for API compatibility
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 text-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.div
        className="text-5xl sm:text-6xl mb-4"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, -5, 5, 0]
        }}
        transition={{
          duration: 0.6,
          repeat: 2,
          repeatDelay: 0.5
        }}
      >
        ☕
      </motion.div>
      <motion.h2
        className="text-xl sm:text-2xl font-bold text-amber-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Coffee&apos;s Ready!
      </motion.h2>
    </motion.div>
  );
}
