'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Answer, OnProgressCallback } from '@/lib/types';
import FinalThoughts from './shared/FinalThoughts';

interface PizzaBuilderInitialState {
  currentStage: number;
  selectedChoices: SelectedChoices;
  answerMap: AnswerMap;
  formData: FormData;
}

interface PizzaBuilderProps {
  questions: Question[];
  onComplete: (responses: Answer[]) => void;
  onProgress?: OnProgressCallback;
  initialState?: PizzaBuilderInitialState;
  allowAnonymous?: boolean;
}

interface FormData {
  name: string;
  email: string;
}

interface SelectedChoices {
  crust: string;
  sauce: string;
  cheese: string;
  toppings: string[];
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

const pizzaBaseVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 20
    }
  }
};

const sauceSpreadVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const
    }
  }
};

const cheeseVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const
    }
  }
};

const toppingVariants = {
  hidden: { scale: 0, opacity: 0, y: -30 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
      delay: i * 0.08
    }
  })
};

const steamVariants = {
  hidden: { opacity: 0, y: 0 },
  visible: {
    opacity: [0, 0.6, 0],
    y: -40,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeOut' as const
    }
  }
};

const confettiColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

// Visual options
const crustOptions = [
  { id: 'thin', name: 'Thin', color: 'bg-amber-200', borderColor: 'border-amber-400', thickness: 'h-2' },
  { id: 'regular', name: 'Regular', color: 'bg-amber-300', borderColor: 'border-amber-500', thickness: 'h-3' },
  { id: 'thick', name: 'Thick', color: 'bg-amber-400', borderColor: 'border-amber-600', thickness: 'h-4' },
];

const sauceOptions = [
  { id: 'tomato', name: 'Tomato', color: 'bg-red-500' },
  { id: 'white', name: 'White', color: 'bg-red-500' },
  { id: 'pesto', name: 'Pesto', color: 'bg-red-500' },
];

const cheeseOptions = [
  { id: 'mozzarella', name: 'Mozzarella', color: 'bg-orange-300', dots: 'bg-orange-400' },
  { id: 'cheddar', name: 'Cheddar', color: 'bg-orange-300', dots: 'bg-orange-400' },
  { id: 'none', name: 'No Cheese', color: 'bg-orange-300', dots: 'bg-orange-400' },
];

const toppingOptions = [
  { id: 'pepperoni', name: 'Pepperoni', emoji: '🥓', color: 'bg-red-600', shape: 'rounded-full' },
  { id: 'mushrooms', name: 'Mushrooms', emoji: '🍄', color: 'bg-amber-100', shape: 'rounded-md' },
  { id: 'peppers', name: 'Peppers', emoji: '🫑', color: 'bg-green-500', shape: 'rounded-sm' },
  { id: 'olives', name: 'Olives', emoji: '🫒', color: 'bg-gray-800', shape: 'rounded-full' },
  { id: 'onions', name: 'Onions', emoji: '🧅', color: 'bg-purple-200', shape: 'rounded-full' },
];

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
): Array<T & { answerValue: string; uniqueId: string }> {
  const questionOptions = getQuestionOptions(question);

  // If no question options, return empty - don't use visual names as answers
  if (questionOptions.length === 0) {
    return [];
  }

  // Map question options to visual options, cycling through visuals if needed
  return questionOptions.map((option, index) => {
    const visualOption = visualOptions[index % visualOptions.length];
    return {
      ...visualOption,
      answerValue: option,
      // Use unique ID combining index to prevent collisions when options > visual options
      uniqueId: `${visualOption.id}-${index}`,
    };
  });
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

// Pizza Display Component
function PizzaDisplay({
  currentStage,
  selectedChoices,
  isBaking,
  isDone,
}: {
  currentStage: number;
  selectedChoices: SelectedChoices;
  isBaking: boolean;
  isDone: boolean;
}) {
  const crust = crustOptions.find(c => c.id === selectedChoices.crust) || crustOptions[1];
  const sauce = sauceOptions.find(s => s.id === selectedChoices.sauce);
  const cheese = cheeseOptions.find(c => c.id === selectedChoices.cheese);

  // Generate random positions for toppings - using deterministic positions based on topping id
  // Keep toppings within the circular sauce area (not square bounds)
  const toppingPositions = selectedChoices.toppings.flatMap((uniqueId, toppingIndex) => {
    // Extract base visual ID from uniqueId (e.g., "pepperoni-0" -> "pepperoni")
    const baseVisualId = uniqueId.replace(/-\d+$/, '');
    const topping = toppingOptions.find(t => t.id === baseVisualId);
    if (!topping) return [];

    // Generate 4-6 pieces per topping with deterministic positions
    const pieces = 5;
    return Array.from({ length: pieces }, (_, i) => {
      // Use deterministic positioning based on indices
      const angle = ((toppingIndex * pieces + i) * 137.5) % 360; // Golden angle distribution
      // Radius ranges from 8-38% from center, keeping toppings within the sauce circle
      const radius = 8 + ((toppingIndex * pieces + i) % 4) * 10;
      const x = 50 + radius * Math.cos(angle * Math.PI / 180);
      const y = 50 + radius * Math.sin(angle * Math.PI / 180);

      return {
        id: `${uniqueId}-piece-${i}`,
        topping,
        x,
        y,
        rotation: (toppingIndex * 45 + i * 72) % 360,
        index: toppingIndex * pieces + i,
      };
    });
  });

  return (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 mx-auto">
      {/* Shadow */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 sm:w-40 md:w-48 h-4 bg-gray-300 rounded-full blur-sm"
        initial={{ opacity: 0.3, scaleX: 0.5 }}
        animate={{
          opacity: currentStage >= 1 ? 0.5 : 0.3,
          scaleX: currentStage >= 1 ? 1 : 0.5
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Steam when done */}
      <AnimatePresence>
        {isDone && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute -top-4 text-2xl"
                style={{ left: `${25 + i * 25}%` }}
                variants={steamVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: i * 0.3 }}
              >
                ♨️
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Pizza Base (Crust) */}
      <AnimatePresence>
        {currentStage >= 1 && (
          <motion.div
            className="absolute inset-2 sm:inset-3 md:inset-4"
            variants={pizzaBaseVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Outer crust ring */}
            <div
              className={`absolute inset-0 rounded-full ${crust.color} ${crust.borderColor} border-4 sm:border-6 shadow-lg`}
              style={{
                background: isDone
                  ? 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)'
                  : undefined
              }}
            />

            {/* Inner dough area */}
            <div
              className={`absolute inset-3 sm:inset-4 md:inset-5 rounded-full ${
                isDone ? 'bg-amber-600' : 'bg-amber-100'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sauce */}
      <AnimatePresence>
        {currentStage >= 2 && sauce && (
          <motion.div
            className="absolute inset-6 sm:inset-8 md:inset-10"
            variants={sauceSpreadVariants}
            initial="hidden"
            animate="visible"
          >
            <div className={`w-full h-full rounded-full ${sauce.color} shadow-inner`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cheese */}
      <AnimatePresence>
        {currentStage >= 3 && cheese && cheese.id !== 'none' && (
          <motion.div
            className="absolute inset-7 sm:inset-9 md:inset-11"
            variants={cheeseVariants}
            initial="hidden"
            animate="visible"
          >
            <div className={`w-full h-full rounded-full ${cheese.color} shadow-inner relative overflow-hidden`}>
              {/* Cheese texture dots */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full ${cheese.dots}`}
                  style={{
                    left: `${15 + (i % 4) * 22}%`,
                    top: `${15 + Math.floor(i / 4) * 28}%`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toppings - show as soon as they're selected (stage 4+) */}
      <AnimatePresence>
        {currentStage >= 4 && selectedChoices.toppings.length > 0 && (
          <div className="absolute inset-6 sm:inset-8 md:inset-10">
            {toppingPositions.map((item) => (
              <motion.div
                key={item.id}
                className={`absolute w-3 h-3 sm:w-4 sm:h-4 ${item.topping.color} ${item.topping.shape} shadow-sm flex items-center justify-center`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                }}
                variants={toppingVariants}
                initial="hidden"
                animate="visible"
                exit={{ scale: 0, opacity: 0 }}
                custom={item.index}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Baking overlay */}
      <AnimatePresence>
        {isBaking && (
          <motion.div
            className="absolute inset-0 bg-orange-500/30 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {currentStage === 0 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-gray-400 text-xs sm:text-sm text-center">
              Your pizza will<br />appear here!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PizzaBuilder({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: PizzaBuilderProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? {
      crust: '',
      sauce: '',
      cheese: '',
      toppings: [],
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
  const [isBaking, setIsBaking] = useState(false);
  const [bakingProgress, setBakingProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
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

  const mappedCrustOptions = mapQuestionToVisualOptions(questions[0], crustOptions);
  const mappedSauceOptions = mapQuestionToVisualOptions(questions[1], sauceOptions);
  const mappedCheeseOptions = mapQuestionToVisualOptions(questions[2], cheeseOptions);
  const mappedToppingOptions = mapQuestionToVisualOptions(questions[3], toppingOptions);

  const handleCrustSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, crust: visualId }));
    if (questions[0]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[0].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(1);
  };

  const handleSauceSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, sauce: visualId }));
    if (questions[1]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[1].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(2);
  };

  const handleCheeseSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, cheese: visualId }));
    if (questions[2]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[2].id]: { visualId, answerValue },
      }));
    }
    // Skip FormCapture stage if anonymous
    setCurrentStage(allowAnonymous ? 4 : 3);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      setCurrentStage(4);
    }
  };

  const handleToppingToggle = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => {
      const newToppings = prev.toppings.includes(uniqueId)
        ? prev.toppings.filter(t => t !== uniqueId)
        : [...prev.toppings, uniqueId];
      return { ...prev, toppings: newToppings };
    });

    if (questions[3]) {
      setAnswerMap(prev => {
        const currentEntry = prev[questions[3].id];
        const currentVisualIds = (currentEntry?.visualId as string[]) || [];
        const currentAnswerValues = (currentEntry?.answerValue as string[]) || [];

        const visualIndex = currentVisualIds.indexOf(uniqueId);
        let newVisualIds: string[];
        let newAnswerValues: string[];

        if (visualIndex > -1) {
          newVisualIds = currentVisualIds.filter((_, i) => i !== visualIndex);
          newAnswerValues = currentAnswerValues.filter((_, i) => i !== visualIndex);
        } else {
          newVisualIds = [...currentVisualIds, uniqueId];
          newAnswerValues = [...currentAnswerValues, answerValue];
        }

        return {
          ...prev,
          [questions[3].id]: {
            visualId: newVisualIds,
            answerValue: newAnswerValues,
          },
        };
      });
    }
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

  // Go to final thoughts stage
  const handleGoToFinalThoughts = () => {
    setCurrentStage(5);
  };

  // Actually start baking (after final thoughts)
  const handleBake = () => {
    setCurrentStage(6);
    setIsBaking(true);
    setBakingProgress(0);

    // Simulate baking progress
    const interval = setInterval(() => {
      setBakingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBaking(false);
          setIsDone(true);
          setShowConfetti(true);

          // Complete after showing done state
          setTimeout(() => {
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
          }, 2000);

          setTimeout(() => setShowConfetti(false), 4000);
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  };

  const renderStage = () => {
    switch (currentStage) {
      case 0:
        return (
          <CrustSelection
            question={questions[0]}
            options={mappedCrustOptions}
            onSelect={handleCrustSelect}
          />
        );
      case 1:
        return (
          <SauceSelection
            question={questions[1]}
            options={mappedSauceOptions}
            onSelect={handleSauceSelect}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <CheeseSelection
            question={questions[2]}
            options={mappedCheeseOptions}
            onSelect={handleCheeseSelect}
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
          <ToppingsSelection
            question={questions[3]}
            options={mappedToppingOptions}
            selectedToppings={selectedChoices.toppings}
            onToggle={handleToppingToggle}
            onBake={handleGoToFinalThoughts}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <FinalThoughts
            value={additionalThoughts}
            onChange={setAdditionalThoughts}
            onContinue={handleBake}
            onBack={handleBack}
            theme="pizza"
            respondentName={formData.name}
          />
        );
      case 6:
        return (
          <BakingStage
            isBaking={isBaking}
            progress={bakingProgress}
            isDone={isDone}
            name={formData.name}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-red-50 to-yellow-100 flex flex-col items-center justify-start md:justify-center p-3 sm:p-6 lg:p-8">
      <Confetti isActive={showConfetti} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 sm:mb-4 pt-2 sm:pt-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600 mb-1 sm:mb-2">
          Build Your Perfect Pizza! 🍕
        </h1>
        {currentStage < 6 && (
          <motion.p
            className="text-gray-600 text-sm sm:text-base"
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
        {/* Pizza Display */}
        <motion.div
          className="flex-shrink-0 bg-white/50 rounded-2xl p-3 sm:p-4 lg:p-6 backdrop-blur-sm w-full md:w-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <PizzaDisplay
            currentStage={currentStage}
            selectedChoices={selectedChoices}
            isBaking={isBaking}
            isDone={isDone}
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

// Stage 0: Crust Selection
function CrustSelection({
  question,
  options,
  onSelect,
}: {
  question?: Question;
  options: Array<typeof crustOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        {question?.question || 'Choose Your Crust'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="min-h-[5rem] sm:min-h-0 p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer
              active:bg-orange-100 active:border-orange-500
              [@media(hover:hover)]:hover:border-orange-400 [@media(hover:hover)]:hover:bg-orange-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Crust visual */}
            <div className="flex justify-center mb-2">
              <div className={`w-16 ${option.thickness} ${option.color} ${option.borderColor} border-2 rounded-full`} />
            </div>
            <div className="font-medium text-gray-700 text-xs sm:text-sm text-center break-words leading-tight">{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 1: Sauce Selection
function SauceSelection({
  question,
  options,
  onSelect,
  onBack,
}: {
  question?: Question;
  options: Array<typeof sauceOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
  onBack?: () => void;
}) {
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
        {question?.question || 'Spread the Sauce'}
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="p-3 sm:p-4 min-h-[5rem] sm:min-h-0 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer touch-manipulation
              active:bg-orange-100 active:border-orange-500
              [@media(hover:hover)]:hover:border-orange-400 [@media(hover:hover)]:hover:bg-orange-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Sauce spread animation */}
            <motion.div
              className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full ${option.color} mb-1 sm:mb-2 shadow-inner`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.3, type: 'spring' }}
            />
            <div className="font-medium text-gray-700 text-xs sm:text-sm text-center break-words leading-tight">{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 2: Cheese Selection
function CheeseSelection({
  question,
  options,
  onSelect,
  onBack,
}: {
  question?: Question;
  options: Array<typeof cheeseOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
  onBack?: () => void;
}) {
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
        {question?.question || 'Add the Cheese'}
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="p-3 sm:p-4 min-h-[5rem] sm:min-h-0 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer touch-manipulation
              active:bg-orange-100 active:border-orange-500
              [@media(hover:hover)]:hover:border-orange-400 [@media(hover:hover)]:hover:bg-orange-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
          >
            {/* Cheese visual with melting effect */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1 sm:mb-2">
              <motion.div
                className={`w-full h-full rounded-full ${option.color} border-2 border-orange-400 relative overflow-hidden`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Cheese dots/texture */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${option.dots}`}
                    style={{
                      left: `${20 + (i % 3) * 25}%`,
                      top: `${20 + Math.floor(i / 3) * 35}%`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  />
                ))}
              </motion.div>
            </div>
            <div className="font-medium text-gray-700 text-xs sm:text-sm text-center break-words leading-tight">{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Inline error component for form validation
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
          type="button"
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
        Before we add toppings...
      </h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Who&apos;s making this pizza?</p>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            Name <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            className={`w-full px-4 py-3 sm:py-3 text-base rounded-lg border-2
              focus:outline-none transition-colors
              min-h-[48px] touch-manipulation
              ${errors.name && touched.name
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-200 focus:border-orange-400'
              }`}
            placeholder="Your name"
            aria-invalid={errors.name && touched.name ? 'true' : 'false'}
          />
          <AnimatePresence>
            {errors.name && touched.name && (
              <InlineFormError message={errors.name} />
            )}
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
            className={`w-full px-4 py-3 sm:py-3 text-base rounded-lg border-2
              focus:outline-none transition-colors
              min-h-[48px] touch-manipulation
              ${errors.email && touched.email
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : 'border-gray-200 focus:border-orange-400'
              }`}
            placeholder="your@email.com"
            aria-invalid={errors.email && touched.email ? 'true' : 'false'}
          />
          <AnimatePresence>
            {errors.email && touched.email && (
              <InlineFormError message={errors.email} />
            )}
          </AnimatePresence>
        </motion.div>
        <motion.button
          type="submit"
          className="w-full py-3 sm:py-3 px-6 min-h-[48px] bg-orange-500 text-white font-semibold rounded-lg
            transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2
            cursor-pointer touch-manipulation
            active:bg-orange-700
            [@media(hover:hover)]:hover:bg-orange-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Continue Building
        </motion.button>
      </form>
    </div>
  );
}

// Stage 4: Toppings Selection
function ToppingsSelection({
  question,
  options,
  selectedToppings,
  onToggle,
  onBake,
  onBack,
}: {
  question?: Question;
  options: Array<typeof toppingOptions[0] & { answerValue: string; uniqueId: string }>;
  selectedToppings: string[];
  onToggle: (uniqueId: string, answerValue: string) => void;
  onBake: () => void;
  onBack?: () => void;
}) {
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
        {question?.question || 'Add Your Toppings'}
      </h2>
      <p className="text-sm text-gray-500 mb-4 sm:mb-6">Select all that apply</p>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {options.map((option, index) => {
          const isSelected = selectedToppings.includes(option.uniqueId);
          return (
            <motion.button
              key={option.uniqueId}
              onClick={() => onToggle(option.uniqueId, option.answerValue)}
              className={`p-3 sm:p-4 min-h-[3.5rem] sm:min-h-0 rounded-xl border-2 transition-colors
                focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer touch-manipulation
                active:scale-95 ${
                isSelected
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 [@media(hover:hover)]:hover:border-orange-300'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300'
                  }`}
                  animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isSelected && (
                    <motion.svg
                      className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </motion.svg>
                  )}
                </motion.div>
                <span className="text-xl sm:text-2xl">{option.emoji}</span>
                <span className="font-medium text-gray-700 text-xs sm:text-sm break-words leading-tight">{option.answerValue}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
      <motion.button
        onClick={onBake}
        className="w-full py-3 px-6 min-h-[48px] bg-orange-500 text-white font-semibold rounded-lg
          transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2
          flex items-center justify-center gap-2 cursor-pointer touch-manipulation
          active:bg-orange-700
          [@media(hover:hover)]:hover:bg-orange-600"
        whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.4)' }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
        >
          🔥
        </motion.span>
        <span className="text-sm sm:text-base">Put in Oven!</span>
      </motion.button>
    </div>
  );
}

// Stage 5: Baking Stage
function BakingStage({
  isBaking,
  progress,
  isDone,
  name,
}: {
  isBaking: boolean;
  progress: number;
  isDone: boolean;
  name: string;
}) {
  if (isDone) {
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
            rotate: [0, -10, 10, -10, 0]
          }}
          transition={{
            duration: 0.6,
            repeat: 2,
            repeatDelay: 0.5
          }}
        >
          🍕
        </motion.div>
        <motion.h2
          className="text-xl sm:text-2xl font-bold text-orange-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Pizza Ready!
        </motion.h2>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 text-center">
      {/* Oven visualization */}
      <div className="relative w-48 h-40 sm:w-56 sm:h-48 mx-auto mb-4">
        {/* Oven body */}
        <div className="absolute inset-0 bg-gray-800 rounded-lg shadow-lg">
          {/* Oven window */}
          <motion.div
            className="absolute top-4 left-4 right-4 bottom-12 bg-orange-500/80 rounded-md overflow-hidden"
            animate={{
              backgroundColor: isBaking
                ? ['rgba(249, 115, 22, 0.8)', 'rgba(239, 68, 68, 0.9)', 'rgba(249, 115, 22, 0.8)']
                : 'rgba(249, 115, 22, 0.8)'
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {/* Flames at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-6 bg-yellow-400 rounded-t-full"
                  animate={{
                    height: [24, 32, 24],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 0.3 + i * 0.05,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Oven controls */}
          <div className="absolute bottom-2 left-4 right-4 flex justify-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <div className="w-4 h-4 rounded-full bg-gray-600" />
            <div className="w-4 h-4 rounded-full bg-gray-600" />
          </div>
        </div>
      </div>

      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
        Baking Your Pizza...
      </h2>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <p className="text-gray-500 text-sm">{Math.round(progress)}% done</p>

      {/* Timer countdown */}
      <motion.p
        className="text-2xl font-bold text-orange-600 mt-3"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {Math.ceil((100 - progress) * 0.03)}s
      </motion.p>
    </div>
  );
}
