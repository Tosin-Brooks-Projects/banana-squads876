'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Answer, OnProgressCallback } from '@/lib/types';
import FinalThoughts from './shared/FinalThoughts';

interface GardenGrowerInitialState {
  currentStage: number;
  selectedChoices: SelectedChoices;
  answerMap: AnswerMap;
  formData: FormData;
}

interface GardenGrowerProps {
  questions: Question[];
  onComplete: (responses: Answer[]) => void;
  onProgress?: OnProgressCallback;
  initialState?: GardenGrowerInitialState;
}

interface FormData {
  name: string;
  email: string;
}

interface SelectedChoices {
  soil: string;
  seed: string;
  watered: boolean;
  sunlight: number;
}

interface AnswerMap {
  [questionId: string]: {
    visualId: string;
    answerValue: string;
  };
}

// Animation variants
const stageVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  },
  exit: {
    opacity: 0,
    y: -30,
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

const confettiColors = ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f97316', '#ec4899', '#8b5cf6'];

// Visual options
const soilOptions = [
  { id: 'rich', name: 'Rich Soil', color: 'bg-amber-900', description: 'Dark and nutrient-rich' },
  { id: 'sandy', name: 'Sandy Soil', color: 'bg-amber-300', description: 'Light and well-draining' },
  { id: 'clay', name: 'Clay Soil', color: 'bg-orange-700', description: 'Dense and moisture-holding' },
];

const seedOptions = [
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', color: 'bg-yellow-400', petalColor: '#facc15', centerColor: '#92400e' },
  { id: 'rose', name: 'Rose', emoji: '🌹', color: 'bg-red-500', petalColor: '#ef4444', centerColor: '#fcd34d' },
  { id: 'daisy', name: 'Daisy', emoji: '🌼', color: 'bg-white', petalColor: '#ffffff', centerColor: '#facc15' },
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
): Array<T & { answerValue: string }> {
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

// Garden Display Component
function GardenDisplay({
  currentStage,
  selectedChoices,
  growthProgress,
  isGrowing: _isGrowing,
}: {
  currentStage: number;
  selectedChoices: SelectedChoices;
  growthProgress: number;
  isGrowing: boolean;
}) {
  void _isGrowing;
  const soil = soilOptions.find(s => s.id === selectedChoices.soil) || soilOptions[0];
  const seed = seedOptions.find(s => s.id === selectedChoices.seed);
  const sunPosition = selectedChoices.sunlight; // 0-100

  return (
    <div className="relative w-full h-64 sm:h-72 md:h-80 mx-auto overflow-hidden rounded-2xl bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100">
      {/* Clouds */}
      <motion.div
        className="absolute top-4 left-10 text-4xl opacity-80"
        animate={{ x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        ☁️
      </motion.div>
      <motion.div
        className="absolute top-8 right-16 text-3xl opacity-70"
        animate={{ x: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      >
        ☁️
      </motion.div>

      {/* Sun */}
      <motion.div
        className="absolute text-5xl sm:text-6xl"
        style={{
          top: '10%',
          left: `${20 + sunPosition * 0.6}%`,
        }}
        animate={{
          scale: currentStage >= 4 ? [1, 1.1, 1] : 1,
          filter: currentStage >= 4 ? 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.8))' : 'none',
        }}
        transition={{ duration: 2, repeat: currentStage >= 4 ? Infinity : 0 }}
      >
        ☀️
      </motion.div>

      {/* Ground / Soil */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Grass line */}
        <div className="h-4 bg-gradient-to-b from-green-500 to-green-600" />

        {/* Soil layer */}
        <AnimatePresence>
          {currentStage >= 1 && (
            <motion.div
              className={`h-16 sm:h-20 ${soil.color}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Soil texture */}
              <div className="w-full h-full relative overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-black/10"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Water droplets animation */}
      <AnimatePresence>
        {currentStage === 2 && selectedChoices.watered && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute text-blue-500 text-lg"
                style={{ left: `${-20 + i * 10}px` }}
                initial={{ y: -60, opacity: 1 }}
                animate={{ y: 0, opacity: 0 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  repeat: 3,
                }}
              >
                💧
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Plant growth stages */}
      <AnimatePresence>
        {currentStage >= 2 && seed && (
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2">
            {/* Seed in ground */}
            {growthProgress < 10 && (
              <motion.div
                className="w-4 h-4 bg-amber-800 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              />
            )}

            {/* Sprout */}
            {growthProgress >= 10 && growthProgress < 40 && (
              <motion.div
                className="relative"
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="w-1 h-8 bg-green-500 mx-auto rounded-full" />
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <div className="w-3 h-4 bg-green-400 rounded-full transform -rotate-45 -translate-x-1" />
                  <div className="w-3 h-4 bg-green-400 rounded-full transform rotate-45 translate-x-1 -mt-3" />
                </div>
              </motion.div>
            )}

            {/* Stem with leaves */}
            {growthProgress >= 40 && growthProgress < 70 && (
              <motion.div
                className="relative"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
              >
                <motion.div
                  className="w-2 bg-green-600 mx-auto rounded-full"
                  initial={{ height: 20 }}
                  animate={{ height: 60 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Leaves */}
                <motion.div
                  className="absolute top-4 -left-4 w-6 h-3 bg-green-500 rounded-full transform -rotate-30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                />
                <motion.div
                  className="absolute top-8 -right-4 w-6 h-3 bg-green-500 rounded-full transform rotate-30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                />
              </motion.div>
            )}

            {/* Full flower */}
            {growthProgress >= 70 && (
              <motion.div
                className="relative"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 150 }}
              >
                {/* Stem */}
                <div className="w-2 h-20 sm:h-24 bg-green-600 mx-auto rounded-full" />

                {/* Leaves */}
                <div className="absolute top-6 -left-5 w-8 h-4 bg-green-500 rounded-full transform -rotate-30" />
                <div className="absolute top-12 -right-5 w-8 h-4 bg-green-500 rounded-full transform rotate-30" />

                {/* Flower head */}
                <motion.div
                  className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  {/* Petals */}
                  {seed.id === 'sunflower' && (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-4 h-8 sm:w-5 sm:h-10 rounded-full"
                          style={{
                            backgroundColor: seed.petalColor,
                            left: '50%',
                            top: '50%',
                            transformOrigin: 'center bottom',
                            transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.05 }}
                        />
                      ))}
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        style={{ backgroundColor: seed.centerColor }}
                      />
                    </div>
                  )}

                  {seed.id === 'rose' && (
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            backgroundColor: seed.petalColor,
                            width: `${60 - i * 6}%`,
                            height: `${60 - i * 6}%`,
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                            opacity: 1 - i * 0.08,
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.08 }}
                        />
                      ))}
                    </div>
                  )}

                  {seed.id === 'daisy' && (
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-3 h-6 sm:w-4 sm:h-8 bg-white rounded-full border border-gray-200"
                          style={{
                            left: '50%',
                            top: '50%',
                            transformOrigin: 'center bottom',
                            transform: `translate(-50%, -100%) rotate(${i * 36}deg)`,
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.05 }}
                        />
                      ))}
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                        style={{ backgroundColor: seed.centerColor }}
                      />
                    </div>
                  )}
                </motion.div>

                {/* Butterfly */}
                {growthProgress >= 100 && (
                  <motion.div
                    className="absolute -top-16 sm:-top-20 -right-8 text-2xl sm:text-3xl"
                    initial={{ x: 50, y: 50, opacity: 0 }}
                    animate={{
                      x: [50, 0, -10, 0],
                      y: [50, 0, -5, 0],
                      opacity: 1,
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  >
                    <motion.span
                      animate={{ rotateY: [0, 180, 0] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    >
                      🦋
                    </motion.span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
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
            <p className="text-gray-600 text-sm sm:text-base text-center bg-white/50 px-4 py-2 rounded-lg">
              Your garden will<br />grow here!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GardenGrower({ questions, onComplete, onProgress, initialState }: GardenGrowerProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? {
      soil: '',
      seed: '',
      watered: false,
      sunlight: 50,
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
  const [growthProgress, setGrowthProgress] = useState(0);
  const [isGrowing, setIsGrowing] = useState(false);
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

  const mappedSoilOptions = mapQuestionToVisualOptions(questions[0], soilOptions);
  const mappedSeedOptions = mapQuestionToVisualOptions(questions[1], seedOptions);

  const handleSoilSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, soil: visualId }));
    if (questions[0]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[0].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(1);
  };

  const handleSeedSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, seed: visualId }));
    if (questions[1]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[1].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(2);
  };

  const handleWater = () => {
    setSelectedChoices(prev => ({ ...prev, watered: true }));
    if (questions[2]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[2].id]: { visualId: 'watered', answerValue: 'Watered' },
      }));
    }
    // Wait for water animation then proceed
    setTimeout(() => {
      setCurrentStage(3);
    }, 2500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      setCurrentStage(4);
    }
  };

  const handleSunlightChange = (value: number) => {
    setSelectedChoices(prev => ({ ...prev, sunlight: value }));
  };

  const handleSunlightConfirm = () => {
    if (questions[3]) {
      const sunlightLevel = selectedChoices.sunlight < 33 ? 'Low' : selectedChoices.sunlight < 66 ? 'Medium' : 'High';
      setAnswerMap(prev => ({
        ...prev,
        [questions[3].id]: { visualId: sunlightLevel.toLowerCase(), answerValue: sunlightLevel },
      }));
    }
    setCurrentStage(5); // Go to final thoughts
  };

  // Go from final thoughts to growth animation
  const handleGoToGrowth = () => {
    setCurrentStage(6);
    startGrowth();
  };

  const startGrowth = () => {
    setIsGrowing(true);
    setGrowthProgress(0);

    const interval = setInterval(() => {
      setGrowthProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGrowing(false);
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

            answers.push(
              { questionId: 'respondent_name', value: formData.name },
              { questionId: 'respondent_email', value: formData.email },
              { questionId: 'additional_thoughts', value: additionalThoughts }
            );

            onComplete(answers);
          }, 2500);

          setTimeout(() => setShowConfetti(false), 4000);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
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
          <SoilSelection
            question={questions[0]}
            options={mappedSoilOptions}
            onSelect={handleSoilSelect}
          />
        );
      case 1:
        return (
          <SeedSelection
            question={questions[1]}
            options={mappedSeedOptions}
            onSelect={handleSeedSelect}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <WateringStage
            question={questions[2]}
            watered={selectedChoices.watered}
            onWater={handleWater}
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
          <SunlightStage
            question={questions[3]}
            sunlight={selectedChoices.sunlight}
            onChange={handleSunlightChange}
            onConfirm={handleSunlightConfirm}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <FinalThoughts
            value={additionalThoughts}
            onChange={setAdditionalThoughts}
            onContinue={handleGoToGrowth}
            onBack={handleBack}
            theme="garden"
            respondentName={formData.name}
          />
        );
      case 6:
        return (
          <GrowthStage
            isGrowing={isGrowing}
            progress={growthProgress}
            name={formData.name}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 via-emerald-50 to-amber-50 flex flex-col items-center justify-start md:justify-center p-3 sm:p-6 lg:p-8">
      <Confetti isActive={showConfetti} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 sm:mb-4 pt-2 sm:pt-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700 mb-1 sm:mb-2">
          Grow Your Garden! 🌱
        </h1>
        {currentStage < 5 && (
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

      {/* Main content */}
      <div className="w-full max-w-4xl flex flex-col gap-4 md:gap-6">
        {/* Garden Display */}
        <motion.div
          className="bg-white/30 rounded-2xl p-2 sm:p-3 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <GardenDisplay
            currentStage={currentStage}
            selectedChoices={selectedChoices}
            growthProgress={growthProgress}
            isGrowing={isGrowing}
          />
        </motion.div>

        {/* Stage content */}
        <div className="w-full max-w-lg mx-auto">
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

// Stage 0: Soil Selection
function SoilSelection({
  question,
  options,
  onSelect,
}: {
  question?: Question;
  options: Array<typeof soilOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        {question?.question || 'Prepare Your Soil'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="min-h-[5rem] sm:min-h-0 p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer
              active:bg-green-100 active:border-green-500
              [@media(hover:hover)]:hover:border-green-400 [@media(hover:hover)]:hover:bg-green-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Soil visual with tilling animation */}
            <motion.div
              className={`w-16 h-8 mx-auto rounded-md ${option.color} mb-2 relative overflow-hidden`}
              whileHover={{
                scaleY: [1, 1.1, 1],
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Soil texture lines */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-0.5 bg-black/20"
                  style={{
                    width: '80%',
                    left: '10%',
                    top: `${25 + i * 25}%`,
                  }}
                />
              ))}
            </motion.div>
            <div className="font-medium text-gray-700 text-sm sm:text-base">{option.answerValue}</div>
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 1: Seed Selection
function SeedSelection({
  question,
  options,
  onSelect,
  onBack,
}: {
  question?: Question;
  options: Array<typeof seedOptions[0] & { answerValue: string }>;
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
        {question?.question || 'Plant Your Seed'}
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="p-3 sm:p-4 min-h-[6rem] sm:min-h-0 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer touch-manipulation
              active:bg-green-100 active:border-green-500
              [@media(hover:hover)]:hover:border-green-400 [@media(hover:hover)]:hover:bg-green-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
          >
            <motion.div
              className="text-4xl sm:text-5xl mb-2"
              whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.3 }}
            >
              {option.emoji}
            </motion.div>
            <div className="font-medium text-gray-700 text-xs sm:text-sm">{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 2: Watering Stage
function WateringStage({
  question,
  watered,
  onWater,
  onBack,
}: {
  question?: Question;
  watered: boolean;
  onWater: () => void;
  onBack?: () => void;
}) {
  const [isPouring, setIsPouring] = useState(false);
  const canRef = useRef<HTMLDivElement>(null);

  const handlePour = () => {
    if (!watered && !isPouring) {
      setIsPouring(true);
      setTimeout(() => {
        onWater();
      }, 500);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 text-center">
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
        {question?.question || 'Water Your Plant'}
      </h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
        {watered ? 'Nice! Your plant is well watered!' : 'Click the watering can to pour water'}
      </p>

      {/* Watering can */}
      <motion.div
        ref={canRef}
        className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 cursor-pointer select-none"
        onClick={handlePour}
        animate={{
          rotate: isPouring ? -45 : 0,
        }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: watered ? 1 : 1.05 }}
        whileTap={{ scale: watered ? 1 : 0.95 }}
      >
        {/* Can body */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-16 sm:w-24 sm:h-20 bg-green-500 rounded-lg rounded-t-xl shadow-lg">
          {/* Handle */}
          <div className="absolute -right-3 top-2 w-4 h-10 sm:w-5 sm:h-12 bg-green-600 rounded-full" />
          {/* Spout */}
          <div className="absolute -left-6 top-0 w-8 h-3 bg-green-600 rounded-l-full transform -rotate-12" />
        </div>

        {/* Water pouring */}
        <AnimatePresence>
          {isPouring && (
            <motion.div
              className="absolute -left-4 top-8 w-2 rounded-full bg-blue-400"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 60, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {watered && (
        <motion.p
          className="text-green-600 font-medium mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ✓ Plant watered! Moving to next step...
        </motion.p>
      )}
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
        Who&apos;s the gardener?
      </h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Let us know who&apos;s growing this beautiful garden</p>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            Name <span className="text-green-500">*</span>
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
                : 'border-gray-200 focus:border-green-400'
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
                : 'border-gray-200 focus:border-green-400'
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
          className="w-full py-3 sm:py-3 px-6 min-h-[48px] bg-green-500 text-white font-semibold rounded-lg
            transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
            cursor-pointer touch-manipulation
            active:bg-green-700
            [@media(hover:hover)]:hover:bg-green-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Continue Growing
        </motion.button>
      </form>
    </div>
  );
}

// Stage 4: Sunlight Stage
function SunlightStage({
  question,
  sunlight,
  onChange,
  onConfirm,
  onBack,
}: {
  question?: Question;
  sunlight: number;
  onChange: (value: number) => void;
  onConfirm: () => void;
  onBack?: () => void;
}) {
  const sunlightLevel = sunlight < 33 ? 'Low' : sunlight < 66 ? 'Medium' : 'High';

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
        {question?.question || 'Adjust Sunlight'}
      </h2>

      {/* Sun visual */}
      <div className="relative h-20 mb-6 bg-gradient-to-r from-sky-200 via-sky-100 to-amber-100 rounded-xl overflow-hidden">
        <motion.div
          className="absolute text-4xl sm:text-5xl"
          style={{
            top: '20%',
            left: `${10 + sunlight * 0.7}%`,
          }}
          animate={{
            filter: `drop-shadow(0 0 ${10 + sunlight / 5}px rgba(250, 204, 21, ${0.5 + sunlight / 200}))`,
          }}
        >
          ☀️
        </motion.div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max="100"
          value={sunlight}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:bg-yellow-400 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-0"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>🌑 Shade</span>
          <span className="font-medium text-amber-600">{sunlightLevel} Sun</span>
          <span>☀️ Full Sun</span>
        </div>
      </div>

      <motion.button
        onClick={onConfirm}
        className="w-full py-3 px-6 min-h-[48px] bg-green-500 text-white font-semibold rounded-lg
          transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
          flex items-center justify-center gap-2 cursor-pointer touch-manipulation
          active:bg-green-700
          [@media(hover:hover)]:hover:bg-green-600"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>🌱</span>
        <span>Watch It Grow!</span>
      </motion.button>
    </div>
  );
}

// Stage 5: Growth Stage
function GrowthStage({
  isGrowing: _isGrowingParam,
  progress,
  name,
}: {
  isGrowing: boolean;
  progress: number;
  name: string;
}) {
  void _isGrowingParam;
  const growthLabel = progress < 20 ? 'Germinating...' : progress < 50 ? 'Sprouting...' : progress < 80 ? 'Growing leaves...' : progress < 100 ? 'Blooming...' : 'Fully grown!';

  if (progress >= 100) {
    void name;
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
            duration: 0.8,
            repeat: 2,
            repeatDelay: 0.3
          }}
        >
          🌸
        </motion.div>
        <motion.h2
          className="text-xl sm:text-2xl font-bold text-green-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Beautiful Garden!
        </motion.h2>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 text-center">
      <motion.div
        className="text-4xl sm:text-5xl mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {progress < 20 ? '🌰' : progress < 50 ? '🌱' : progress < 80 ? '🌿' : '🌷'}
      </motion.div>

      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
        {growthLabel}
      </h2>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <p className="text-gray-500 text-sm">{Math.round(progress)}% grown</p>
    </div>
  );
}
