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

// Visual options
const crustOptions = [
  { id: 'thin', name: 'Thin', emoji: '🪶', color: 'bg-amber-100', thickness: 'h-1.5' },
  { id: 'regular', name: 'Regular', emoji: '⚖️', color: 'bg-amber-200', thickness: 'h-3' },
  { id: 'thick', name: 'Thick', emoji: '🏔️', color: 'bg-amber-300', thickness: 'h-5' },
];

const sauceOptions = [
  { id: 'tomato', name: 'Tomato', emoji: '🍅', color: 'bg-red-500' },
  { id: 'white', name: 'White', emoji: '🧄', color: 'bg-yellow-50 border border-amber-200' },
  { id: 'pesto', name: 'Pesto', emoji: '🌿', color: 'bg-green-600' },
];

const cheeseOptions = [
  { id: 'mozzarella', name: 'Mozzarella', emoji: '🧀', color: 'bg-yellow-100' },
  { id: 'cheddar', name: 'Cheddar', emoji: '🟡', color: 'bg-orange-200' },
  { id: 'none', name: 'No Cheese', emoji: '🚫', color: 'bg-gray-100' },
];

const toppingOptions = [
  { id: 'pepperoni', name: 'Pepperoni', emoji: '🥩', color: 'bg-red-700' },
  { id: 'mushrooms', name: 'Mushrooms', emoji: '🍄', color: 'bg-stone-300' },
  { id: 'peppers', name: 'Peppers', emoji: '🫑', color: 'bg-green-500' },
  { id: 'olives', name: 'Olives', emoji: '🫒', color: 'bg-neutral-900' },
  { id: 'onions', name: 'Onions', emoji: '🧅', color: 'bg-purple-200' },
];

const STAGE_EMOJIS = ['🍕', '🥣', '🍅', '🧀', '🥓'];

const confettiColors = ['#58cc02', '#ffc700', '#1cb0f6', '#a570ff', '#cc348d', '#e67348'];

function getQuestionOptions(question: Question | undefined): string[] {
  if (!question) return [];
  if ('options' in question && question.options) return question.options;
  if (question.type === 'rating' && 'scale' in question) {
    const scale = question.scale || 5;
    return Array.from({ length: scale }, (_, i) => {
      const value = i + 1;
      if (value === 1 && question.startLabel) return question.startLabel;
      if (value === scale && question.endLabel) return question.endLabel;
      return String(value);
    });
  }
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
  if (questionOptions.length === 0) return [];
  return questionOptions.map((option, index) => {
    const visualOption = visualOptions[index % visualOptions.length];
    return { ...visualOption, answerValue: option, uniqueId: `${visualOption.id}-${index}` };
  });
}

// PickedBadge micro-feedback
function PickedBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, scale: 0.7, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7 }}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-duo-green text-white text-[10px] font-black uppercase tracking-wider rounded-full"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          Picked!
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Confetti
function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (isActive) {
      setParticles(Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      })));
    }
  }, [isActive]);

  if (!isActive) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{ left: `${p.x}%`, top: -20, backgroundColor: p.color }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800, rotate: 360, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// Pizza visual preview
function PizzaDisplay({ selectedChoices, stage }: { selectedChoices: SelectedChoices; stage: number }) {
  const crust = crustOptions.find(c => c.id === selectedChoices.crust.replace(/-\d+$/, ''));
  const sauce = sauceOptions.find(s => s.id === selectedChoices.sauce.replace(/-\d+$/, ''));
  const cheese = cheeseOptions.find(c => c.id === selectedChoices.cheese.replace(/-\d+$/, ''));

  const toppingPositions = selectedChoices.toppings.flatMap((uniqueId, toppingIndex) => {
    const baseId = uniqueId.replace(/-\d+$/, '');
    const topping = toppingOptions.find(t => t.id === baseId) || toppingOptions[toppingIndex % toppingOptions.length];
    return Array.from({ length: 5 }, (_, i) => {
      const angle = ((toppingIndex * 5 + i) * 137.5) % 360;
      const radius = 10 + ((toppingIndex * 5 + i) % 3) * 10;
      return {
        id: `${uniqueId}-${i}`,
        emoji: topping ? toppingOptions.find(t => t.id === topping.id)?.emoji || '🍕' : '🍕',
        x: 50 + radius * Math.cos(angle * Math.PI / 180),
        y: 50 + radius * Math.sin(angle * Math.PI / 180),
      };
    });
  });

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pizza circle */}
      <div className="relative w-36 h-36 mx-auto">
        {/* Base */}
        <div className={`absolute inset-0 rounded-full ${crust ? crust.color : 'bg-amber-50 border-2 border-dashed border-cloud-gray'} border-4 border-amber-900/20 shadow-[0_4px_0_rgba(0,0,0,0.08)]`} />

        {/* Sauce */}
        {sauce && stage >= 1 && (
          <motion.div
            className={`absolute inset-4 rounded-full ${sauce.color}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
          />
        )}

        {/* Cheese */}
        {cheese && cheese.id !== 'none' && stage >= 2 && (
          <motion.div
            className={`absolute inset-7 rounded-full ${cheese.color}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
          />
        )}

        {/* Toppings */}
        {stage >= 4 && toppingPositions.map((t) => (
          <motion.div
            key={t.id}
            className="absolute text-[10px] leading-none"
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            {t.emoji}
          </motion.div>
        ))}

        {/* Empty hint */}
        {!crust && stage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl opacity-30">🍕</span>
          </div>
        )}
      </div>

      {/* Stage breadcrumb */}
      <div className="flex items-center gap-1.5">
        {STAGE_EMOJIS.map((emoji, i) => (
          <span key={i} className={`text-sm transition-all ${i < stage ? 'opacity-100' : 'opacity-20'}`}>
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PizzaBuilder({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: PizzaBuilderProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? { crust: '', sauce: '', cheese: '', toppings: [] }
  );
  const [answerMap, setAnswerMap] = useState<AnswerMap>(initialState?.answerMap ?? {});
  const [formData, setFormData] = useState<FormData>(initialState?.formData ?? { name: '', email: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isBaking, setIsBaking] = useState(false);
  const [bakingProgress, setBakingProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [additionalThoughts, setAdditionalThoughts] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const reportProgress = useCallback(() => {
    if (!onProgress || currentStage === 0 || currentStage >= 6) return;
    const answers: Answer[] = questions.map((q) => {
      const entry = answerMap[q.id];
      return { questionId: q.id, value: entry?.answerValue || '' };
    });
    onProgress({
      currentStage,
      totalStages: allowAnonymous ? 6 : 7,
      answers,
      adventureState: { currentStage, selectedChoices, answerMap, formData },
      respondentName: allowAnonymous ? undefined : (formData.name || undefined),
      respondentEmail: allowAnonymous ? undefined : (formData.email || undefined),
    });
  }, [onProgress, currentStage, questions, answerMap, selectedChoices, formData, allowAnonymous]);

  useEffect(() => { reportProgress(); }, [currentStage, reportProgress]);

  const mappedCrustOptions = mapQuestionToVisualOptions(questions[0], crustOptions);
  const mappedSauceOptions = mapQuestionToVisualOptions(questions[1], sauceOptions);
  const mappedCheeseOptions = mapQuestionToVisualOptions(questions[2], cheeseOptions);
  const mappedToppingOptions = mapQuestionToVisualOptions(questions[3], toppingOptions);

  const pickWithBadge = (uniqueId: string, advance: () => void) => {
    setPickedId(uniqueId);
    setTimeout(() => {
      setPickedId(null);
      advance();
    }, 600);
  };

  const handleCrustSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, crust: uniqueId }));
    if (questions[0]) setAnswerMap(prev => ({ ...prev, [questions[0].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(1));
  };

  const handleSauceSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, sauce: uniqueId }));
    if (questions[1]) setAnswerMap(prev => ({ ...prev, [questions[1].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(2));
  };

  const handleCheeseSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, cheese: uniqueId }));
    if (questions[2]) setAnswerMap(prev => ({ ...prev, [questions[2].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(allowAnonymous ? 4 : 3));
  };

  const handleFormSubmit = () => {
    setCurrentStage(4);
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
        const entry = prev[questions[3].id];
        const vids = (entry?.visualId as string[]) || [];
        const avals = (entry?.answerValue as string[]) || [];
        const idx = vids.indexOf(uniqueId);
        return {
          ...prev,
          [questions[3].id]: {
            visualId: idx > -1 ? vids.filter((_, i) => i !== idx) : [...vids, uniqueId],
            answerValue: idx > -1 ? avals.filter((_, i) => i !== idx) : [...avals, answerValue],
          },
        };
      });
    }
  };

  const handleBack = () => {
    if (currentStage > 0) {
      if (allowAnonymous && currentStage === 4) setCurrentStage(2);
      else setCurrentStage(prev => prev - 1);
    }
  };

  const handleBake = () => {
    setCurrentStage(6);
    setIsBaking(true);
    setBakingProgress(0);
    const interval = setInterval(() => {
      setBakingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBaking(false);
          setIsDone(true);
          setShowConfetti(true);
          setTimeout(() => {
            const answers: Answer[] = questions.map((q) => {
              const entry = answerMap[q.id];
              return { questionId: q.id, value: entry?.answerValue || '' };
            });
            if (!allowAnonymous) {
              answers.push({ questionId: 'respondent_name', value: formData.name });
              answers.push({ questionId: 'respondent_email', value: formData.email });
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

  // Progress bar (stages 1-5 only)
  const totalDisplayStages = allowAnonymous ? 5 : 6;
  const displayStage = allowAnonymous && currentStage >= 4 ? currentStage : currentStage;
  const progressPct = Math.min((displayStage / totalDisplayStages) * 100, 100);
  const showTopBar = currentStage >= 1 && currentStage < 6;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Confetti isActive={showConfetti} />

      {/* Top bar */}
      {showTopBar && (
        <div className="w-full px-4 pt-6 pb-4 max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              disabled={currentStage <= 1}
              className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-cloud-gray shadow-[0_3px_0_#e5e5e5] flex items-center justify-center text-graphite disabled:opacity-30 transition-all active:translate-y-[2px] active:shadow-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 h-4 bg-cloud-gray rounded-full overflow-hidden border-2 border-cloud-gray">
              <motion.div
                className="h-full bg-duo-green rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span className="flex-shrink-0 text-[10px] font-black text-graphite uppercase tracking-wider">
              {Math.min(currentStage, totalDisplayStages)}/{totalDisplayStages}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 max-w-lg mx-auto w-full pb-8">
        {/* Pizza display (stages 0-5) */}
        {currentStage < 6 && (
          <div className="py-6 flex justify-center">
            <PizzaDisplay selectedChoices={selectedChoices} stage={currentStage} />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {currentStage === 0 && (
              <CrustSelection
                question={questions[0]}
                options={mappedCrustOptions}
                onSelect={handleCrustSelect}
                pickedId={pickedId}
              />
            )}
            {currentStage === 1 && (
              <SauceSelection
                question={questions[1]}
                options={mappedSauceOptions}
                onSelect={handleSauceSelect}
                pickedId={pickedId}
              />
            )}
            {currentStage === 2 && (
              <CheeseSelection
                question={questions[2]}
                options={mappedCheeseOptions}
                onSelect={handleCheeseSelect}
                pickedId={pickedId}
              />
            )}
            {currentStage === 3 && !allowAnonymous && (
              <FormCapture
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleFormSubmit}
              />
            )}
            {currentStage === 4 && (
              <ToppingsSelection
                question={questions[3]}
                options={mappedToppingOptions}
                selectedToppings={selectedChoices.toppings}
                onToggle={handleToppingToggle}
                onBake={() => setCurrentStage(5)}
              />
            )}
            {currentStage === 5 && (
              <FinalThoughts
                value={additionalThoughts}
                onChange={setAdditionalThoughts}
                onContinue={handleBake}
                onBack={handleBack}
                theme="pizza"
                respondentName={formData.name}
              />
            )}
            {currentStage === 6 && (
              <BakingStage
                isBaking={isBaking}
                progress={bakingProgress}
                isDone={isDone}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      {currentStage < 6 && (
        <div className="py-6 text-center">
          <a href="https://unboringsurveys.com" target="_blank" rel="noopener noreferrer"
            className="font-fredoka text-sm font-bold text-silver hover:text-duo-green transition-colors">
            Unboring<span className="text-duo-green">.</span>
          </a>
        </div>
      )}
    </div>
  );
}

// Stage 0: Crust Selection
function CrustSelection({
  question,
  options,
  onSelect,
  pickedId,
}: {
  question?: Question;
  options: Array<typeof crustOptions[0] & { answerValue: string; uniqueId: string }>;
  onSelect: (uniqueId: string, answerValue: string) => void;
  pickedId: string | null;
}) {
  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          🍕 Crust First
        </span>
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
        {question?.question || 'Pick your crust'}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option, index) => {
          const isPicked = pickedId === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => onSelect(option.uniqueId, option.answerValue)}
              whileTap={{ scale: 0.97 }}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                isPicked
                  ? 'bg-duo-green/10 border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'bg-white border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              <div className="flex justify-center mb-2">
                <div className={`w-14 ${option.thickness} ${option.color} rounded-full`} />
              </div>
              <div className="font-fredoka font-bold text-almost-black text-sm leading-snug">{option.answerValue}</div>
              <div className="mt-1.5 h-5 flex justify-center">
                <PickedBadge show={isPicked} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Stage 1: Sauce Selection
function SauceSelection({
  question,
  options,
  onSelect,
  pickedId,
}: {
  question?: Question;
  options: Array<typeof sauceOptions[0] & { answerValue: string; uniqueId: string }>;
  onSelect: (uniqueId: string, answerValue: string) => void;
  pickedId: string | null;
}) {
  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          🍅 Sauce Time
        </span>
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
        {question?.question || 'Spread the sauce'}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option, index) => {
          const isPicked = pickedId === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => onSelect(option.uniqueId, option.answerValue)}
              whileTap={{ scale: 0.97 }}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                isPicked
                  ? 'bg-duo-green/10 border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'bg-white border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              <motion.div
                className={`w-12 h-12 mx-auto rounded-full ${option.color} mb-2`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15 + index * 0.06, type: 'spring' }}
              />
              <div className="font-fredoka font-bold text-almost-black text-sm leading-snug">{option.answerValue}</div>
              <div className="mt-1.5 h-5 flex justify-center">
                <PickedBadge show={isPicked} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Stage 2: Cheese Selection
function CheeseSelection({
  question,
  options,
  onSelect,
  pickedId,
}: {
  question?: Question;
  options: Array<typeof cheeseOptions[0] & { answerValue: string; uniqueId: string }>;
  onSelect: (uniqueId: string, answerValue: string) => void;
  pickedId: string | null;
}) {
  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          🧀 Cheese Layer
        </span>
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
        {question?.question || 'Add the cheese'}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option, index) => {
          const isPicked = pickedId === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06, type: 'spring' }}
              onClick={() => onSelect(option.uniqueId, option.answerValue)}
              whileTap={{ scale: 0.97 }}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                isPicked
                  ? 'bg-duo-green/10 border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'bg-white border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              <div className="text-3xl mb-2">{option.emoji}</div>
              <div className="font-fredoka font-bold text-almost-black text-sm leading-snug">{option.answerValue}</div>
              <div className="mt-1.5 h-5 flex justify-center">
                <PickedBadge show={isPicked} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Stage 3: Form Capture
function FormCapture({
  formData,
  setFormData,
  onSubmit,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="w-20 h-20 bg-duo-green/10 rounded-[1.5rem] border-2 border-duo-green/20 flex items-center justify-center mx-auto mb-5"
        >
          <span className="text-4xl">🍕</span>
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">
          Before the toppings…
        </h2>
        <p className="text-graphite text-sm font-medium">Who&apos;s building this pizza?</p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
            Name <span className="text-silver">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Your name"
            className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
            Email <span className="text-silver">(optional)</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
            className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0"
      >
        Add Toppings 🥓
      </button>
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
}: {
  question?: Question;
  options: Array<typeof toppingOptions[0] & { answerValue: string; uniqueId: string }>;
  selectedToppings: string[];
  onToggle: (uniqueId: string, answerValue: string) => void;
  onBake: () => void;
}) {
  const count = selectedToppings.length;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          🥓 Toppings
        </span>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center px-2.5 py-1 bg-duo-green text-white text-[10px] font-black uppercase tracking-wider rounded-full"
          >
            {count} picked
          </motion.span>
        )}
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
        {question?.question || 'Pick your toppings'}
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((option, index) => {
          const isSelected = selectedToppings.includes(option.uniqueId);
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onToggle(option.uniqueId, option.answerValue)}
              whileTap={{ scale: 0.97 }}
              className={`p-4 rounded-2xl border-2 text-left transition-all active:translate-y-[2px] ${
                isSelected
                  ? 'bg-duo-green/10 border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'bg-white border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  isSelected ? 'border-duo-green bg-duo-green' : 'border-cloud-gray'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-xl">{option.emoji}</span>
                <span className="font-bold text-almost-black text-xs leading-snug">{option.answerValue}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={onBake}
        whileTap={{ scale: 0.97 }}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0 flex items-center justify-center gap-2"
      >
        <motion.span
          animate={{ rotate: [0, -10, 10, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
        >
          🔥
        </motion.span>
        Put in Oven!
      </motion.button>
    </div>
  );
}

// Stage 6: Baking Stage
function BakingStage({ isBaking, progress, isDone }: { isBaking: boolean; progress: number; isDone: boolean }) {
  if (isDone) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.div
          className="text-7xl mb-6"
          animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.6, repeat: 2, repeatDelay: 0.5 }}
        >
          🍕
        </motion.div>
        <h2 className="font-fredoka text-4xl font-bold text-duo-green mb-2">Pizza Ready!</h2>
        <p className="text-graphite font-bold text-sm uppercase tracking-widest">Quest Complete!</p>
      </motion.div>
    );
  }

  return (
    <div className="text-center py-12">
      <motion.div
        className="text-6xl mb-6"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        🔥
      </motion.div>
      <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-6">
        Baking your pizza…
      </h2>
      <div className="w-full h-4 bg-cloud-gray rounded-full overflow-hidden border-2 border-cloud-gray mb-3">
        <motion.div
          className="h-full bg-duo-green rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <p className="font-black text-graphite text-sm uppercase tracking-widest">
        {isBaking ? `${Math.round(progress)}% done` : 'Almost there…'}
      </p>
    </div>
  );
}
