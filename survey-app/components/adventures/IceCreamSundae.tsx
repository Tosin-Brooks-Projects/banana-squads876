'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Answer, OnProgressCallback } from '@/lib/types';
import FinalThoughts from './shared/FinalThoughts';

interface IceCreamSundaeInitialState {
  currentStage: number;
  selectedChoices: SelectedChoices;
  answerMap: AnswerMap;
  formData: FormData;
}

interface IceCreamSundaeProps {
  questions: Question[];
  onComplete: (responses: Answer[]) => void;
  onProgress?: OnProgressCallback;
  initialState?: IceCreamSundaeInitialState;
}

interface FormData {
  name: string;
  email: string;
}

interface SelectedChoices {
  bowl: string;
  scoop: string;
  sauce: string;
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

const bowlVariants = {
  hidden: { scale: 0, y: 20 },
  visible: {
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20
    }
  }
};

const scoopVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 15,
      delay: 0.1
    }
  }
};

const sauceVariants = {
  hidden: { opacity: 0, y: -20, scaleY: 0 },
  visible: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const
    }
  }
};

const toppingVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 15,
      delay: i * 0.1
    }
  })
};

const cherryVariants = {
  hidden: { y: -50, opacity: 0, rotate: -45 },
  visible: {
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 10
    }
  }
};

const confettiColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];

// SVG Bowl Icon component - renders a bowl with customizable colors
function BowlIcon({ fillColor, borderColor, size = 48 }: { fillColor: string; borderColor: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bowl body */}
      <path
        d="M6 18C6 18 8 34 24 34C40 34 42 18 42 18"
        fill={fillColor}
        stroke={borderColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Bowl rim */}
      <ellipse cx="24" cy="18" rx="18" ry="4" fill={fillColor} stroke={borderColor} strokeWidth="3" />
      {/* Bowl base */}
      <ellipse cx="24" cy="36" rx="6" ry="2" fill={borderColor} />
    </svg>
  );
}

// Visual options - bowls in different colors (using SVG)
const bowlOptions = [
  { id: 'blue', name: 'Blue Bowl', fillColor: '#DBEAFE', borderColor: '#3B82F6', color: 'bg-blue-100 border-blue-500' },
  { id: 'pink', name: 'Pink Bowl', fillColor: '#FCE7F3', borderColor: '#EC4899', color: 'bg-pink-100 border-pink-500' },
  { id: 'green', name: 'Green Bowl', fillColor: '#D1FAE5', borderColor: '#10B981', color: 'bg-green-100 border-green-500' },
  { id: 'purple', name: 'Purple Bowl', fillColor: '#EDE9FE', borderColor: '#8B5CF6', color: 'bg-purple-100 border-purple-500' },
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

const toppingOptions = [
  { id: 'banana', name: 'Banana', emoji: '🍌', color: 'bg-yellow-300' },
  { id: 'nuts', name: 'Nuts', emoji: '🥜', color: 'bg-amber-600' },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', color: 'bg-red-400' },
  { id: 'cookie', name: 'Cookie', emoji: '🍪', color: 'bg-amber-700' },
  { id: 'cherry', name: 'Cherry', emoji: '🍒', color: 'bg-red-600' },
  { id: 'whippedcream', name: 'Whipped Cream', emoji: '🍦', color: 'bg-white border border-gray-200' },
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
): Array<T & { answerValue: string; id: string }> {
  const questionOptions = getQuestionOptions(question);

  // If no question options, return empty - don't use visual names as answers
  if (questionOptions.length === 0) {
    return [];
  }

  // Map question options to visual options, cycling through visuals if needed
  // Use unique IDs based on index to avoid duplicates when cycling
  return questionOptions.map((option, index) => {
    const visualOption = visualOptions[index % visualOptions.length];
    return {
      ...visualOption,
      id: `${visualOption.id}-${index}`, // Unique ID for each option
      answerValue: option,
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
            y: window.innerHeight + 50,
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

// Sundae Display Component
function SundaeDisplay({
  currentStage,
  selectedChoices,
}: {
  currentStage: number;
  selectedChoices: SelectedChoices;
}) {
  const bowl = bowlOptions.find(b => b.id === selectedChoices.bowl);
  const scoop = scoopOptions.find(s => s.id === selectedChoices.scoop);
  const sauce = sauceOptions.find(s => s.id === selectedChoices.sauce);

  return (
    <div className="relative w-36 h-48 sm:w-44 sm:h-56 md:w-48 md:h-64">
      {/* Shadow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 mx-auto w-24 sm:w-28 md:w-32 h-3 sm:h-4 bg-gray-300 rounded-full"
        initial={{ opacity: 0.3, scaleX: 0.5 }}
        animate={{
          opacity: currentStage >= 1 ? 0.5 : 0.3,
          scaleX: currentStage >= 1 ? 1 : 0.5
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Bowl */}
      <AnimatePresence>
        {currentStage >= 1 && (
          <motion.div
            className="absolute bottom-2 left-0 right-0 mx-auto w-fit"
            variants={bowlVariants}
            initial="hidden"
            animate="visible"
          >
            <div
              className={`w-20 h-12 sm:w-24 sm:h-14 md:w-28 md:h-16 ${bowl?.color || 'bg-amber-200 border-amber-400'} border-2 sm:border-4 rounded-b-full rounded-t-lg shadow-md`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scoop */}
      <AnimatePresence>
        {currentStage >= 2 && (
          <motion.div
            className="absolute bottom-10 sm:bottom-12 md:bottom-14 left-0 right-0 mx-auto w-fit"
            variants={scoopVariants}
            initial="hidden"
            animate="visible"
          >
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 ${scoop?.color || 'bg-amber-50'} ${scoop?.borderColor || 'border-amber-200'} border-2 sm:border-4 rounded-full shadow-lg`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sauce */}
      <AnimatePresence>
        {currentStage >= 4 && (
          <motion.div
            className="absolute bottom-20 sm:bottom-24 md:bottom-28 left-0 right-0 mx-auto w-fit origin-top"
            variants={sauceVariants}
            initial="hidden"
            animate="visible"
          >
            <div className={`w-12 sm:w-14 md:w-16 h-2 sm:h-3 ${sauce?.color || 'bg-amber-400'} rounded-full shadow-sm`} />
            <div className="flex justify-between px-1 -mt-1">
              <motion.div
                className={`w-1.5 sm:w-2 h-3 sm:h-4 ${sauce?.color || 'bg-amber-400'} rounded-b-full`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              />
              <motion.div
                className={`w-1.5 sm:w-2 h-4 sm:h-6 ${sauce?.color || 'bg-amber-400'} rounded-b-full`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              />
              <motion.div
                className={`w-1.5 sm:w-2 h-2 sm:h-3 ${sauce?.color || 'bg-amber-400'} rounded-b-full`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toppings */}
      <AnimatePresence>
        {currentStage >= 5 && selectedChoices.toppings.length > 0 && (
          <div className="absolute bottom-26 sm:bottom-32 md:bottom-36 left-0 right-0 mx-auto w-fit">
            <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1 w-18 sm:w-20 md:w-24">
              {selectedChoices.toppings.map((t, index) => {
                const topping = toppingOptions.find(opt => opt.id === t);
                return (
                  <motion.div
                    key={t}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${topping?.color || 'bg-gray-400'} rounded-full shadow-sm`}
                    variants={toppingVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    title={topping?.name}
                  />
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Cherry */}
      <AnimatePresence>
        {currentStage >= 6 && (
          <motion.div
            className="absolute bottom-32 sm:bottom-40 md:bottom-44 left-0 right-0 mx-auto w-fit"
            variants={cherryVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 w-0.5 sm:w-1 h-3 sm:h-4 bg-green-600 rounded-full" />
            <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-500 rounded-full shadow-md border sm:border-2 border-red-600 relative">
              <div className="absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full opacity-60" />
            </div>
          </motion.div>
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
              Your sundae will<br />appear here!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function IceCreamSundae({ questions, onComplete, onProgress, initialState }: IceCreamSundaeProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? {
      bowl: '',
      scoop: '',
      sauce: '',
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
  const [additionalThoughts, setAdditionalThoughts] = useState('');

  const reportProgress = useCallback(() => {
    if (!onProgress || currentStage === 0 || currentStage >= 5) return;

    const answers: Answer[] = questions.map((question) => {
      const entry = answerMap[question.id];
      return {
        questionId: question.id,
        value: entry?.answerValue || '',
      };
    });

    onProgress({
      currentStage,
      totalStages: 7,
      answers,
      adventureState: {
        currentStage,
        selectedChoices,
        answerMap,
        formData,
      },
      respondentName: formData.name || undefined,
      respondentEmail: formData.email || undefined,
    });
  }, [onProgress, currentStage, questions, answerMap, selectedChoices, formData]);

  useEffect(() => {
    reportProgress();
  }, [currentStage, reportProgress]);

  const mappedBowlOptions = mapQuestionToVisualOptions(questions[0], bowlOptions);
  const mappedScoopOptions = mapQuestionToVisualOptions(questions[1], scoopOptions);
  const mappedSauceOptions = mapQuestionToVisualOptions(questions[2], sauceOptions);
  const mappedToppingOptions = mapQuestionToVisualOptions(questions[3], toppingOptions);

  const handleBowlSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, bowl: visualId }));
    if (questions[0]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[0].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(1);
  };

  const handleScoopSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, scoop: visualId }));
    if (questions[1]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[1].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(2);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      setCurrentStage(3);
    }
  };

  const handleSauceSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, sauce: visualId }));
    if (questions[2]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[2].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(4);
  };

  // Check if the toppings question allows multiple selections
  const toppingsAllowMultiple = questions[3] && 'allowMultiple' in questions[3]
    ? (questions[3] as { allowMultiple?: boolean }).allowMultiple ?? true
    : true;

  const handleToppingToggle = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => {
      if (toppingsAllowMultiple) {
        // Multi-select: toggle the selection
        const newToppings = prev.toppings.includes(visualId)
          ? prev.toppings.filter(t => t !== visualId)
          : [...prev.toppings, visualId];
        return { ...prev, toppings: newToppings };
      } else {
        // Single-select: replace the selection
        const newToppings = prev.toppings.includes(visualId) ? [] : [visualId];
        return { ...prev, toppings: newToppings };
      }
    });

    if (questions[3]) {
      setAnswerMap(prev => {
        if (toppingsAllowMultiple) {
          // Multi-select logic
          const currentEntry = prev[questions[3].id];
          const currentVisualIds = (currentEntry?.visualId as string[]) || [];
          const currentAnswerValues = (currentEntry?.answerValue as string[]) || [];

          const visualIndex = currentVisualIds.indexOf(visualId);
          let newVisualIds: string[];
          let newAnswerValues: string[];

          if (visualIndex > -1) {
            newVisualIds = currentVisualIds.filter((_, i) => i !== visualIndex);
            newAnswerValues = currentAnswerValues.filter((_, i) => i !== visualIndex);
          } else {
            newVisualIds = [...currentVisualIds, visualId];
            newAnswerValues = [...currentAnswerValues, answerValue];
          }

          return {
            ...prev,
            [questions[3].id]: {
              visualId: newVisualIds,
              answerValue: newAnswerValues,
            },
          };
        } else {
          // Single-select logic
          const currentEntry = prev[questions[3].id];
          const isCurrentlySelected = (currentEntry?.visualId as string[])?.includes(visualId);

          return {
            ...prev,
            [questions[3].id]: {
              visualId: isCurrentlySelected ? [] : [visualId],
              answerValue: isCurrentlySelected ? [] : [answerValue],
            },
          };
        }
      });
    }
  };

  // Go to final thoughts stage
  const handleGoToFinalThoughts = () => {
    setCurrentStage(5);
  };

  const handleComplete = () => {
    setCurrentStage(6);
    setShowConfetti(true);

    const answers: Answer[] = questions.map((question) => {
      const entry = answerMap[question.id];
      return {
        questionId: question.id,
        value: entry?.answerValue || '',
      };
    });

    answers.push(
      { questionId: 'respondent_name', value: formData.name },
      { questionId: 'respondent_email', value: formData.email },
      { questionId: 'additional_thoughts', value: additionalThoughts }
    );

    onComplete(answers);

    // Stop confetti after animation
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleBack = () => {
    if (currentStage > 0) {
      setCurrentStage(prev => prev - 1);
    }
  };

  const renderStage = () => {
    switch (currentStage) {
      case 0:
        return (
          <BowlSelection
            question={questions[0]}
            options={mappedBowlOptions}
            onSelect={handleBowlSelect}
          />
        );
      case 1:
        return (
          <BaseScoops
            question={questions[1]}
            options={mappedScoopOptions}
            onSelect={handleScoopSelect}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <FormCapture
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <SauceSelection
            question={questions[2]}
            options={mappedSauceOptions}
            onSelect={handleSauceSelect}
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
            onComplete={handleGoToFinalThoughts}
            onBack={handleBack}
            allowMultiple={toppingsAllowMultiple}
          />
        );
      case 5:
        return (
          <FinalThoughts
            value={additionalThoughts}
            onChange={setAdditionalThoughts}
            onContinue={handleComplete}
            onBack={handleBack}
            theme="ice-cream"
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
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-blue-100 flex flex-col items-center justify-start md:justify-center p-3 sm:p-6 lg:p-8">
      <Confetti isActive={showConfetti} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 sm:mb-4 pt-2 sm:pt-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-600 mb-1 sm:mb-2">
          Build Your Perfect Sundae!
        </h1>
        {currentStage < 6 && (
          <motion.p
            className="text-gray-600 text-sm sm:text-base"
            key={currentStage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Stage {currentStage + 1} of 6
          </motion.p>
        )}
      </motion.div>

      {/* Main content - stacks vertically on mobile, side-by-side on desktop */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 lg:gap-8">
        {/* Sundae Display - above choices on mobile, side on desktop */}
        <motion.div
          className="flex-shrink-0 bg-white/50 rounded-2xl p-3 sm:p-4 lg:p-6 backdrop-blur-sm w-full md:w-auto flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <SundaeDisplay
            currentStage={currentStage}
            selectedChoices={selectedChoices}
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

      {/* Branding */}
      <div className="mt-8 text-center text-sm text-gray-400">
        Powered by{' '}
        <a
          href="https://unboringsurveys.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-500 hover:text-pink-600 transition-colors"
        >
          Unboring Surveys
        </a>
      </div>
    </div>
  );
}

// Stage 0: Bowl Selection
function BowlSelection({
  question,
  options,
  onSelect,
}: {
  question?: Question;
  options: Array<typeof bowlOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        {question?.question || 'Choose Your Bowl'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="min-h-[4rem] sm:min-h-0 p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer
              active:bg-pink-100 active:border-pink-500
              [@media(hover:hover)]:hover:border-pink-400 [@media(hover:hover)]:hover:bg-pink-50
              flex flex-col items-center justify-center"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="mb-1 sm:mb-2">
              <BowlIcon fillColor={option.fillColor} borderColor={option.borderColor} size={48} />
            </div>
            <div className="font-medium text-gray-700 text-sm sm:text-base text-center">{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 1: Base Scoops
function BaseScoops({
  question,
  options,
  onSelect,
  onBack,
}: {
  question?: Question;
  options: Array<typeof scoopOptions[0] & { answerValue: string }>;
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
        {question?.question || 'Pick Your Scoop'}
      </h2>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full ${option.color} ${option.borderColor}
              border-2 sm:border-4 flex flex-col items-center justify-center shadow-lg
              focus:outline-none focus:ring-4 focus:ring-pink-300 p-2 cursor-pointer
              active:ring-4 active:ring-pink-400 active:scale-95`}
            title={option.answerValue}
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
          >
            <span
              className="text-xs sm:text-sm font-medium text-center px-1 drop-shadow-sm leading-tight"
              style={{ color: option.id === 'chocolate' ? 'white' : 'inherit' }}
            >
              {option.answerValue}
            </span>
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

// Stage 2: Form Capture with validation
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
    if (!value) return undefined; // Email is optional
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

    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);

    setErrors({ name: nameError, email: emailError });
    setTouched({ name: true, email: true });

    // Only submit if no errors
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
        Before we add the good stuff...
      </h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">What should we call you?</p>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            Name <span className="text-pink-500">*</span>
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
                : 'border-gray-200 focus:border-pink-400'
              }`}
            placeholder="Your name"
            aria-invalid={errors.name && touched.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
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
                : 'border-gray-200 focus:border-pink-400'
              }`}
            placeholder="your@email.com"
            aria-invalid={errors.email && touched.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          <AnimatePresence>
            {errors.email && touched.email && (
              <InlineFormError message={errors.email} />
            )}
          </AnimatePresence>
        </motion.div>
        <motion.button
          type="submit"
          className="w-full py-3 sm:py-3 px-6 min-h-[48px] bg-pink-500 text-white font-semibold rounded-lg
            transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2
            cursor-pointer touch-manipulation
            active:bg-pink-700
            [@media(hover:hover)]:hover:bg-pink-600"
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

// Stage 3: Sauce Selection
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
        {question?.question || 'Drizzle Some Sauce'}
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="p-3 sm:p-4 min-h-[5rem] sm:min-h-0 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer touch-manipulation
              active:bg-pink-100 active:border-pink-500
              [@media(hover:hover)]:hover:border-pink-400 [@media(hover:hover)]:hover:bg-pink-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={`w-6 h-12 sm:w-8 sm:h-16 mx-auto rounded-b-full ${option.color} mb-1 sm:mb-2`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
              style={{ originY: 0 }}
            />
            <div className="font-medium text-gray-700 text-xs sm:text-sm">{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 4: Toppings Selection
function ToppingsSelection({
  question,
  options,
  selectedToppings,
  onToggle,
  onComplete,
  onBack,
  allowMultiple = true,
}: {
  question?: Question;
  options: Array<typeof toppingOptions[0] & { answerValue: string }>;
  selectedToppings: string[];
  onToggle: (visualId: string, answerValue: string) => void;
  onComplete: () => void;
  onBack?: () => void;
  allowMultiple?: boolean;
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
      <p className="text-sm text-gray-500 mb-4 sm:mb-6">
        {allowMultiple ? 'Pick your toppings (select all that apply)' : 'Pick a topping'}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {options.map((option, index) => {
          const isSelected = selectedToppings.includes(option.id);
          return (
            <motion.button
              key={option.id}
              onClick={() => onToggle(option.id, option.answerValue)}
              className={`p-3 sm:p-4 min-h-[3.5rem] sm:min-h-0 rounded-xl border-2 transition-colors
                focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer touch-manipulation
                active:scale-95 ${
                isSelected
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 [@media(hover:hover)]:hover:border-pink-300'
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
                      ? 'bg-pink-500 border-pink-500'
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
                <span className="font-medium text-gray-700 text-xs sm:text-sm">{option.answerValue}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
      <motion.button
        onClick={onComplete}
        className="w-full py-3 px-6 min-h-[48px] bg-pink-500 text-white font-semibold rounded-lg
          transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2
          flex items-center justify-center gap-2 cursor-pointer touch-manipulation
          active:bg-pink-700
          [@media(hover:hover)]:hover:bg-pink-600"
        whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.4)' }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.span
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          🍒
        </motion.span>
        <span className="text-sm sm:text-base">Add Cherry on Top</span>
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
          rotate: [0, -10, 10, -10, 0]
        }}
        transition={{
          duration: 0.6,
          repeat: 2,
          repeatDelay: 0.5
        }}
      >
        🎉
      </motion.div>
      <motion.h2
        className="text-xl sm:text-2xl font-bold text-pink-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Challenge Complete!
      </motion.h2>
    </motion.div>
  );
}
