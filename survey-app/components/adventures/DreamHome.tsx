'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Answer, OnProgressCallback } from '@/lib/types';
import FinalThoughts from './shared/FinalThoughts';

interface DreamHomeInitialState {
  currentStage: number;
  selectedChoices: SelectedChoices;
  placedItems: PlacedItems;
  answerMap: AnswerMap;
  formData: FormData;
}

interface DreamHomeProps {
  questions: Question[];
  onComplete: (responses: Answer[]) => void;
  onProgress?: OnProgressCallback;
  initialState?: DreamHomeInitialState;
}

interface FormData {
  name: string;
  email: string;
}

interface SelectedChoices {
  foundation: string;
  walls: string;
  roof: string;
  windows: string;
  door: string;
  color: string;
  landscape: string;
}

interface PlacedItems {
  windows: { x: number; y: number }[];
  door: { x: number; y: number } | null;
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
const foundationOptions = [
  { id: 'concrete', name: 'Concrete Slab', color: 'bg-gray-400', height: 16 },
  { id: 'basement', name: 'Basement', color: 'bg-gray-500', height: 32 },
  { id: 'raised', name: 'Raised', color: 'bg-amber-700', height: 24 },
];

const wallOptions = [
  { id: 'brick', name: 'Brick', color: 'bg-red-400', pattern: 'brick' },
  { id: 'wood', name: 'Wood', color: 'bg-amber-600', pattern: 'wood' },
  { id: 'stone', name: 'Stone', color: 'bg-gray-500', pattern: 'stone' },
];

const roofOptions = [
  { id: 'roof1', name: 'Roof 1', color: 'rgb(51 65 85)' },    // slate-700
  { id: 'roof2', name: 'Roof 2', color: 'rgb(120 53 15)' },   // amber-900
  { id: 'roof3', name: 'Roof 3', color: 'rgb(127 29 29)' },   // red-900
];

const windowOptions = [
  { id: 'square', name: 'Square', shape: 'rounded-sm' },
  { id: 'arched', name: 'Arched', shape: 'rounded-t-full' },
  { id: 'bay', name: 'Bay', shape: 'rounded-lg' },
];

const doorOptions = [
  { id: 'classic', name: 'Classic', style: 'classic' },
  { id: 'modern', name: 'Modern', style: 'modern' },
  { id: 'double', name: 'Double', style: 'double' },
];

const colorOptions = [
  { id: 'white', name: 'White', color: 'bg-white', border: 'border-gray-300' },
  { id: 'blue', name: 'Blue', color: 'bg-blue-200', border: 'border-blue-400' },
  { id: 'yellow', name: 'Yellow', color: 'bg-yellow-100', border: 'border-yellow-400' },
  { id: 'green', name: 'Green', color: 'bg-green-200', border: 'border-green-400' },
];

const landscapeOptions = [
  { id: 'tree', name: 'Tree', emoji: '🌳' },
  { id: 'flowers', name: 'Flowers', emoji: '🌸' },
  { id: 'garden', name: 'Garden', emoji: '🌻' },
];

const confettiColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#4ade80', '#fbbf24', '#f97316'];

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

// House Display Component
function HouseDisplay({
  currentStage,
  selectedChoices,
  placedItems,
  lightsOn,
}: {
  currentStage: number;
  selectedChoices: SelectedChoices;
  placedItems: PlacedItems;
  lightsOn: boolean;
}) {
  const foundation = foundationOptions.find(f => f.id === selectedChoices.foundation);
  const walls = wallOptions.find(w => w.id === selectedChoices.walls);
  const roof = roofOptions.find(r => r.id === selectedChoices.roof);
  const houseColor = colorOptions.find(c => c.id === selectedChoices.color);
  const landscape = landscapeOptions.find(l => l.id === selectedChoices.landscape);

  // Get wall color - use selected paint color or default wall material color
  const getWallColor = () => {
    if (currentStage >= 5 && houseColor) {
      return houseColor.color;
    }
    return walls?.color || 'bg-amber-200';
  };

  // Layout constants (in pixels)
  const _groundHeight = 64; // h-16 (reserved for future use)
  void _groundHeight;
  const foundationBase = 56; // bottom-14 (sits slightly into ground)
  const foundationHeight = foundation?.height || 16;
  const wallHeight = 96; // h-24

  // Calculated positions
  const wallBase = foundationBase + foundationHeight; // Walls sit on top of foundation
  const roofBase = wallBase + wallHeight; // Roof sits on top of walls

  // Render roof - simple triangle, color varies based on selection
  const renderRoof = () => {
    const roofColor = roof?.color || 'rgb(51 65 85)';

    // Triangle roof matching wall width (128px = w-32)
    // Using 64px on each side for the triangle base
    return (
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '64px solid transparent',
            borderRight: '64px solid transparent',
            borderBottom: `48px solid ${roofColor}`,
          }}
        />
      </motion.div>
    );
  };

  // Render wall pattern overlay
  const renderWallPattern = () => {
    if (!walls) return null;

    if (walls.pattern === 'brick') {
      return (
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="flex h-4">
              {Array.from({ length: 8 }).map((_, col) => (
                <div
                  key={col}
                  className="border border-gray-600"
                  style={{
                    width: '16px',
                    marginLeft: row % 2 === 0 ? '0' : '8px',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (walls.pattern === 'wood') {
      return (
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-b border-amber-900" style={{ height: '12px' }} />
          ))}
        </div>
      );
    }

    if (walls.pattern === 'stone') {
      return (
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-4 gap-0.5 h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-700 rounded-sm"
                style={{
                  height: `${20 + Math.random() * 10}px`,
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative w-80 h-64 mx-auto">
      {/* Sky background */}
      <div className={`absolute inset-0 rounded-2xl overflow-hidden transition-colors duration-1000 ${
        lightsOn ? 'bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-800' : 'bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100'
      }`}>
        {/* Stars (visible when lights on) */}
        {lightsOn && (
          <div className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 40}%`,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </div>
        )}

        {/* Sun/Moon */}
        <motion.div
          className={`absolute top-4 right-6 w-8 h-8 rounded-full ${
            lightsOn ? 'bg-gray-200' : 'bg-yellow-300'
          }`}
          animate={lightsOn ? { x: -20 } : { x: 0 }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Ground */}
      <div className={`absolute bottom-0 w-full h-16 rounded-b-2xl ${
        lightsOn ? 'bg-green-900' : 'bg-green-400'
      } transition-colors duration-1000`} />

      {/* Foundation */}
      <AnimatePresence>
        {currentStage >= 1 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`absolute left-1/2 -translate-x-1/2 w-32 ${foundation?.color || 'bg-gray-400'} rounded-sm shadow-md`}
            style={{
              bottom: `${foundationBase}px`,
              height: `${foundationHeight}px`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Walls */}
      <AnimatePresence>
        {currentStage >= 2 && (
          <motion.div
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className={`absolute left-1/2 -translate-x-1/2 w-32 ${getWallColor()} shadow-lg overflow-hidden transition-colors duration-500`}
            style={{
              bottom: `${wallBase}px`,
              height: `${wallHeight}px`,
            }}
          >
            {currentStage < 5 && renderWallPattern()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roof */}
      <AnimatePresence>
        {currentStage >= 3 && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: `${roofBase}px` }}
          >
            {renderRoof()}
          </div>
        )}
      </AnimatePresence>

      {/* Windows */}
      <AnimatePresence>
        {currentStage >= 4 && placedItems.windows.map((window, index) => {
          const windowStyle = windowOptions.find(w => w.id === selectedChoices.windows);
          // Position windows in upper portion of wall
          const windowBottom = wallBase + (wallHeight * 0.55);
          // Wall is 128px wide (w-32). Windows are 24px wide (w-6).
          // Place windows at 25% and 75% of wall width from center
          // Left window: center - 32px, Right window: center + 32px
          // Subtract half window width (12px) to center each window on that point
          const windowLeft = index === 0 ? 'calc(50% - 44px)' : 'calc(50% + 20px)';
          return (
            <motion.div
              key={`window-${index}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: index * 0.1 }}
              className={`absolute w-6 h-8 bg-sky-200 border-2 border-amber-800 ${windowStyle?.shape || 'rounded-sm'} overflow-hidden`}
              style={{
                left: windowLeft,
                bottom: `${windowBottom}px`,
              }}
            >
              {/* Window panes */}
              <div className="absolute inset-0 border border-amber-700 opacity-50" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-700 opacity-50" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-700 opacity-50" />

              {/* Window glow when lights on */}
              {lightsOn && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-yellow-300"
                  style={{ boxShadow: '0 0 20px 5px rgba(253, 224, 71, 0.5)' }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Door */}
      <AnimatePresence>
        {currentStage >= 4 && placedItems.door && (
          <motion.div
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: `${wallBase}px`,
            }}
          >
            {selectedChoices.door === 'double' ? (
              <div className="flex">
                <div className="w-6 h-12 bg-amber-800 border-2 border-amber-900 rounded-t-sm">
                  <div className="absolute top-1/2 right-1 w-1 h-1 bg-yellow-600 rounded-full" />
                </div>
                <div className="w-6 h-12 bg-amber-800 border-2 border-l-0 border-amber-900 rounded-t-sm">
                  <div className="absolute top-1/2 left-1 w-1 h-1 bg-yellow-600 rounded-full" />
                </div>
              </div>
            ) : selectedChoices.door === 'modern' ? (
              <div className="w-8 h-12 bg-slate-700 border-2 border-slate-800 rounded-sm">
                <div className="absolute top-2 left-1 right-1 h-6 bg-sky-200 rounded-sm" />
                <div className="absolute bottom-2 right-2 w-1 h-3 bg-gray-400 rounded-full" />
              </div>
            ) : (
              <div className="w-8 h-12 bg-amber-800 border-2 border-amber-900 rounded-t-lg">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-amber-900 rounded-full" />
                <div className="absolute top-1/2 right-1 w-1.5 h-1.5 bg-yellow-600 rounded-full" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Landscape */}
      <AnimatePresence>
        {currentStage >= 6 && landscape && (
          <>
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
              className="absolute bottom-12 left-8 text-3xl"
            >
              {landscape.emoji}
            </motion.div>
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
              className="absolute bottom-12 right-8 text-3xl"
            >
              {landscape.emoji}
            </motion.div>
            {landscape.id !== 'tree' && (
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.6 }}
                className="absolute bottom-12 right-16 text-2xl"
              >
                {landscape.emoji}
              </motion.div>
            )}
          </>
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
            <p className="text-gray-500 text-sm text-center bg-white/80 px-4 py-2 rounded-lg">
              Your dream home will<br />appear here!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DreamHome({ questions, onComplete, onProgress, initialState }: DreamHomeProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? {
      foundation: '',
      walls: '',
      roof: '',
      windows: '',
      door: '',
      color: '',
      landscape: '',
    }
  );
  const [placedItems, setPlacedItems] = useState<PlacedItems>(
    initialState?.placedItems ?? {
      windows: [],
      door: null,
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
  const [lightsOn, setLightsOn] = useState(false);
  const [_placementMode, setPlacementMode] = useState<'windows' | 'door' | null>(null);
  void _placementMode;
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
      totalStages: 8,
      answers,
      adventureState: {
        currentStage,
        selectedChoices,
        placedItems,
        answerMap,
        formData,
      },
      respondentName: formData.name || undefined,
      respondentEmail: formData.email || undefined,
    });
  }, [onProgress, currentStage, questions, answerMap, selectedChoices, placedItems, formData]);

  useEffect(() => {
    reportProgress();
  }, [currentStage, reportProgress]);

  const mappedFoundationOptions = mapQuestionToVisualOptions(questions[0], foundationOptions);
  const mappedWallOptions = mapQuestionToVisualOptions(questions[1], wallOptions);
  const mappedRoofOptions = mapQuestionToVisualOptions(questions[2], roofOptions);
  const mappedWindowOptions = mapQuestionToVisualOptions(questions[3], windowOptions);
  const mappedDoorOptions = mapQuestionToVisualOptions(questions[3], doorOptions);
  const mappedColorOptions = mapQuestionToVisualOptions(questions[4], colorOptions);
  const mappedLandscapeOptions = mapQuestionToVisualOptions(questions[4], landscapeOptions);

  const handleFoundationSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, foundation: visualId }));
    if (questions[0]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[0].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(1);
  };

  const handleWallsSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, walls: visualId }));
    if (questions[1]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[1].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(2);
  };

  const handleRoofSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, roof: visualId }));
    if (questions[2]) {
      setAnswerMap(prev => ({
        ...prev,
        [questions[2].id]: { visualId, answerValue },
      }));
    }
    setCurrentStage(3);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      setCurrentStage(4);
      setPlacementMode('windows');
      // Pre-place default windows and door
      setPlacedItems({
        windows: [
          { x: -20, y: 145 },
          { x: 20, y: 145 },
        ],
        door: { x: 0, y: 118 },
      });
    }
  };

  const handleWindowStyleSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, windows: visualId }));
    if (questions[3]) {
      setAnswerMap(prev => ({
        ...prev,
        [`${questions[3].id}_windows`]: { visualId, answerValue },
      }));
    }
  };

  const handleDoorStyleSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, door: visualId }));
    if (questions[3]) {
      setAnswerMap(prev => ({
        ...prev,
        [`${questions[3].id}_door`]: { visualId, answerValue },
      }));
    }
  };

  const handleWindowsDoorComplete = () => {
    setPlacementMode(null);
    setCurrentStage(5);
  };

  const handleColorSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, color: visualId }));
    if (questions[4]) {
      setAnswerMap(prev => ({
        ...prev,
        [`${questions[4].id}_color`]: { visualId, answerValue },
      }));
    }
  };

  const handleLandscapeSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, landscape: visualId }));
    if (questions[4]) {
      setAnswerMap(prev => ({
        ...prev,
        [`${questions[4].id}_landscape`]: { visualId, answerValue },
      }));
    }
  };

  // Go to final thoughts stage
  const handleGoToFinalThoughts = () => {
    setCurrentStage(6);
  };

  const handleComplete = () => {
    setCurrentStage(7);
    setLightsOn(true);
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
          <FoundationSelection
            question={questions[0]}
            options={mappedFoundationOptions}
            onSelect={handleFoundationSelect}
          />
        );
      case 1:
        return (
          <WallsSelection
            question={questions[1]}
            options={mappedWallOptions}
            onSelect={handleWallsSelect}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <RoofSelection
            question={questions[2]}
            options={mappedRoofOptions}
            onSelect={handleRoofSelect}
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
          <WindowsDoorSelection
            windowOptions={mappedWindowOptions}
            doorOptions={mappedDoorOptions}
            selectedWindows={selectedChoices.windows}
            selectedDoor={selectedChoices.door}
            onWindowSelect={handleWindowStyleSelect}
            onDoorSelect={handleDoorStyleSelect}
            onComplete={handleWindowsDoorComplete}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <PaintLandscapeSelection
            colorOptions={mappedColorOptions}
            landscapeOptions={mappedLandscapeOptions}
            selectedColor={selectedChoices.color}
            selectedLandscape={selectedChoices.landscape}
            onColorSelect={handleColorSelect}
            onLandscapeSelect={handleLandscapeSelect}
            onComplete={handleGoToFinalThoughts}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <FinalThoughts
            value={additionalThoughts}
            onChange={setAdditionalThoughts}
            onContinue={handleComplete}
            onBack={handleBack}
            theme="home"
            respondentName={formData.name}
          />
        );
      case 7:
        return <CompletionStage name={formData.name} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-green-100 flex flex-col items-center justify-start md:justify-center p-3 sm:p-6 lg:p-8">
      <Confetti isActive={showConfetti} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 sm:mb-4 pt-2 sm:pt-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 mb-1 sm:mb-2">
          Build Your Dream Home!
        </h1>
        {currentStage < 7 && (
          <motion.p
            className="text-gray-600 text-sm sm:text-base"
            key={currentStage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Stage {currentStage + 1} of 7
          </motion.p>
        )}
      </motion.div>

      {/* Main content */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 lg:gap-8">
        {/* House Display */}
        <motion.div
          className="flex-shrink-0 bg-white/50 rounded-2xl p-3 sm:p-4 lg:p-6 backdrop-blur-sm w-full md:w-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <HouseDisplay
            currentStage={currentStage}
            selectedChoices={selectedChoices}
            placedItems={placedItems}
            lightsOn={lightsOn}
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

// Stage 0: Foundation Selection
function FoundationSelection({
  question,
  options,
  onSelect,
}: {
  question?: Question;
  options: Array<typeof foundationOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
        {question?.question || 'Lay the Foundation'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="min-h-[5rem] p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer
              active:bg-blue-100 active:border-blue-500
              [@media(hover:hover)]:hover:border-blue-400 [@media(hover:hover)]:hover:bg-blue-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`w-full ${option.height} ${option.color} rounded-sm mb-3`} />
            <div className="font-medium text-gray-700 text-sm sm:text-base">{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 1: Walls Selection
function WallsSelection({
  question,
  options,
  onSelect,
  onBack,
}: {
  question?: Question;
  options: Array<typeof wallOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
  onBack?: () => void;
}) {
  const renderPattern = (pattern: string, color: string) => {
    if (pattern === 'brick') {
      return (
        <div className={`w-full h-16 ${color} rounded-sm relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-40">
            {Array.from({ length: 4 }).map((_, row) => (
              <div key={row} className="flex h-4">
                {Array.from({ length: 6 }).map((_, col) => (
                  <div
                    key={col}
                    className="border border-gray-600"
                    style={{
                      width: '20px',
                      marginLeft: row % 2 === 0 ? '0' : '10px',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (pattern === 'wood') {
      return (
        <div className={`w-full h-16 ${color} rounded-sm relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-amber-900 h-3" />
            ))}
          </div>
        </div>
      );
    }
    return <div className={`w-full h-16 ${color} rounded-sm`} />;
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
        {question?.question || 'Build the Walls'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="min-h-[6rem] p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer
              active:bg-blue-100 active:border-blue-500
              [@media(hover:hover)]:hover:border-blue-400 [@media(hover:hover)]:hover:bg-blue-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {renderPattern(option.pattern, option.color)}
            <div className="font-medium text-gray-700 text-sm sm:text-base mt-3">{option.answerValue}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Stage 2: Roof Selection
function RoofSelection({
  question,
  options,
  onSelect,
  onBack,
}: {
  question?: Question;
  options: Array<typeof roofOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
  onBack?: () => void;
}) {
  // All roofs are the same triangle shape, just different colors
  const renderRoofPreview = (color: string) => {
    return (
      <div
        className="w-0 h-0 mx-auto"
        style={{
          borderLeft: '50px solid transparent',
          borderRight: '50px solid transparent',
          borderBottom: `35px solid ${color}`,
        }}
      />
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
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
        {question?.question || 'Add the Roof'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id, option.answerValue)}
            className="min-h-[6rem] p-4 sm:p-6 rounded-xl border-2 border-gray-200
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer
              active:bg-blue-100 active:border-blue-500
              [@media(hover:hover)]:hover:border-blue-400 [@media(hover:hover)]:hover:bg-blue-50"
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="mb-3">{renderRoofPreview(option.color)}</div>
            <div className="font-medium text-gray-700 text-sm sm:text-base">{option.answerValue}</div>
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
        Before we add the details...
      </h2>
      <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Who&apos;s building this dream home?</p>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            Name <span className="text-blue-500">*</span>
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
                : 'border-gray-200 focus:border-blue-400'
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
                : 'border-gray-200 focus:border-blue-400'
              }`}
            placeholder="your@email.com"
          />
          <AnimatePresence>
            {errors.email && touched.email && <InlineFormError message={errors.email} />}
          </AnimatePresence>
        </motion.div>
        <motion.button
          type="submit"
          className="w-full py-3 px-6 min-h-[48px] bg-blue-500 text-white font-semibold rounded-lg
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
            cursor-pointer touch-manipulation active:bg-blue-700
            [@media(hover:hover)]:hover:bg-blue-600"
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

// Stage 4: Windows & Door Selection
function WindowsDoorSelection({
  windowOptions: windowOpts,
  doorOptions: doorOpts,
  selectedWindows,
  selectedDoor,
  onWindowSelect,
  onDoorSelect,
  onComplete,
  onBack,
}: {
  windowOptions: Array<{ id: string; name: string; shape: string; answerValue: string }>;
  doorOptions: Array<{ id: string; name: string; style: string; answerValue: string }>;
  selectedWindows: string;
  selectedDoor: string;
  onWindowSelect: (visualId: string, answerValue: string) => void;
  onDoorSelect: (visualId: string, answerValue: string) => void;
  onComplete: () => void;
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
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
        Add Windows & Door
      </h2>

      {/* Window Style Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Window Style</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {windowOpts.map((option, index) => (
            <motion.button
              key={option.id}
              onClick={() => onWindowSelect(option.id, option.answerValue)}
              className={`p-3 rounded-xl border-2 transition-colors focus:outline-none cursor-pointer
                ${selectedWindows === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 [@media(hover:hover)]:hover:border-blue-300'
                }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={`w-8 h-10 mx-auto bg-sky-200 border-2 border-amber-700 ${option.shape} mb-2`} />
              <div className="text-xs font-medium text-gray-600">{option.answerValue}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Door Style Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Door Style</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {doorOpts.map((option, index) => (
            <motion.button
              key={option.id}
              onClick={() => onDoorSelect(option.id, option.answerValue)}
              className={`p-3 rounded-xl border-2 transition-colors focus:outline-none cursor-pointer
                ${selectedDoor === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 [@media(hover:hover)]:hover:border-blue-300'
                }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="h-12 flex justify-center mb-2">
                {option.style === 'double' ? (
                  <div className="flex">
                    <div className="w-4 h-10 bg-amber-800 border border-amber-900 rounded-t-sm" />
                    <div className="w-4 h-10 bg-amber-800 border-y border-r border-amber-900 rounded-t-sm" />
                  </div>
                ) : option.style === 'modern' ? (
                  <div className="w-6 h-10 bg-slate-700 border border-slate-800 rounded-sm relative">
                    <div className="absolute top-1 left-0.5 right-0.5 h-5 bg-sky-200 rounded-sm" />
                  </div>
                ) : (
                  <div className="w-6 h-10 bg-amber-800 border border-amber-900 rounded-t-lg relative">
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border border-amber-900 rounded-full" />
                  </div>
                )}
              </div>
              <div className="text-xs font-medium text-gray-600">{option.answerValue}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={onComplete}
        disabled={!selectedWindows || !selectedDoor}
        className="w-full py-3 px-6 min-h-[48px] bg-blue-500 text-white font-semibold rounded-lg
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
          cursor-pointer touch-manipulation disabled:bg-gray-300 disabled:cursor-not-allowed
          active:bg-blue-700 [@media(hover:hover)]:hover:bg-blue-600"
        whileHover={{ scale: selectedWindows && selectedDoor ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
      >
        Continue to Paint & Landscape
      </motion.button>
    </div>
  );
}

// Stage 5: Paint & Landscape Selection
function PaintLandscapeSelection({
  colorOptions: colorOpts,
  landscapeOptions: landscapeOpts,
  selectedColor,
  selectedLandscape,
  onColorSelect,
  onLandscapeSelect,
  onComplete,
  onBack,
}: {
  colorOptions: Array<{ id: string; name: string; color: string; border: string; answerValue: string }>;
  landscapeOptions: Array<{ id: string; name: string; emoji: string; answerValue: string }>;
  selectedColor: string;
  selectedLandscape: string;
  onColorSelect: (visualId: string, answerValue: string) => void;
  onLandscapeSelect: (visualId: string, answerValue: string) => void;
  onComplete: () => void;
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
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
        Paint & Landscape
      </h2>

      {/* Color Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">House Color</h3>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {colorOpts.map((option, index) => (
            <motion.button
              key={option.id}
              onClick={() => onColorSelect(option.id, option.answerValue)}
              className={`p-3 rounded-xl border-2 transition-colors focus:outline-none cursor-pointer
                ${selectedColor === option.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 [@media(hover:hover)]:hover:border-blue-300'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: 'spring' }}
            >
              <div className={`w-full h-8 ${option.color} ${option.border} border-2 rounded-md mb-2`} />
              <div className="text-xs font-medium text-gray-600">{option.answerValue}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Landscape Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Landscaping</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {landscapeOpts.map((option, index) => (
            <motion.button
              key={option.id}
              onClick={() => onLandscapeSelect(option.id, option.answerValue)}
              className={`p-4 rounded-xl border-2 transition-colors focus:outline-none cursor-pointer
                ${selectedLandscape === option.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 [@media(hover:hover)]:hover:border-green-300'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="text-3xl mb-2">{option.emoji}</div>
              <div className="text-xs font-medium text-gray-600">{option.answerValue}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={onComplete}
        disabled={!selectedColor || !selectedLandscape}
        className="w-full py-3 px-6 min-h-[48px] bg-green-500 text-white font-semibold rounded-lg
          transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
          flex items-center justify-center gap-2 cursor-pointer touch-manipulation
          disabled:bg-gray-300 disabled:cursor-not-allowed
          active:bg-green-700 [@media(hover:hover)]:hover:bg-green-600"
        whileHover={{ scale: selectedColor && selectedLandscape ? 1.02 : 1, boxShadow: selectedColor && selectedLandscape ? '0 10px 25px -5px rgba(34, 197, 94, 0.4)' : 'none' }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
        >
          💡
        </motion.span>
        <span className="text-sm sm:text-base">Turn On the Lights!</span>
      </motion.button>
    </div>
  );
}

// Stage 6: Completion
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
        🏠
      </motion.div>
      <motion.h2
        className="text-xl sm:text-2xl font-bold text-blue-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Home Complete!
      </motion.h2>
    </motion.div>
  );
}
