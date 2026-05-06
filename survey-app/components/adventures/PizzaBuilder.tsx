'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

interface FormData { name: string; email: string }

interface SelectedChoices {
  crust: string;
  sauce: string;
  cheese: string;
  toppings: string[];
}

interface AnswerMap {
  [questionId: string]: { visualId: string | string[]; answerValue: string | string[] };
}

// ── Visual option data ────────────────────────────────────────────────────────

const crustOptions = [
  { id: 'thin', name: 'Thin', emoji: '🪶', desc: 'Crispy & light', crustWidth: 6 },
  { id: 'regular', name: 'Classic', emoji: '⚖️', desc: 'The OG', crustWidth: 12 },
  { id: 'thick', name: 'Thick', emoji: '🏔️', desc: 'Pillowy & deep', crustWidth: 20 },
  { id: 'stuffed', name: 'Stuffed', emoji: '🧇', desc: 'Cheese inside!', crustWidth: 16 },
];

const sauceOptions = [
  { id: 'tomato', name: 'Tomato', emoji: '🍅', bg: '#e63030', desc: 'Classic red' },
  { id: 'white', name: 'Garlic', emoji: '🧄', bg: '#f5f0dc', desc: 'White & creamy' },
  { id: 'pesto', name: 'Pesto', emoji: '🌿', bg: '#3d8c45', desc: 'Fresh & herby' },
  { id: 'bbq', name: 'BBQ', emoji: '🫙', bg: '#7a2a00', desc: 'Smoky & sweet' },
];

const cheeseOptions = [
  { id: 'mozzarella', name: 'Mozz', emoji: '🧀', bg: '#f5e08a', desc: 'Melty classic' },
  { id: 'cheddar', name: 'Cheddar', emoji: '🟠', bg: '#f0862a', desc: 'Sharp & bold' },
  { id: 'ricotta', name: 'Ricotta', emoji: '☁️', bg: '#fafafa', desc: 'Soft & fluffy' },
  { id: 'none', name: 'None', emoji: '🚫', bg: 'transparent', desc: 'Dairy-free' },
];

const toppingOptions = [
  { id: 'pepperoni', name: 'Pepperoni', emoji: '🥩', color: '#b22222' },
  { id: 'mushrooms', name: 'Mushrooms', emoji: '🍄', color: '#8b6914' },
  { id: 'peppers', name: 'Peppers', emoji: '🫑', color: '#2d8c2d' },
  { id: 'olives', name: 'Olives', emoji: '🫒', color: '#1a1a1a' },
  { id: 'onions', name: 'Onions', emoji: '🧅', color: '#7c3f7c' },
  { id: 'pineapple', name: 'Pineapple', emoji: '🍍', color: '#e6b800', controversial: true },
];

const COMBO_PHRASES = ['Chef\'s choice! 👨‍🍳', 'Nice pick! ✨', 'Ooh, classic! 🔥', 'Bold move! 💪', 'Perfecto! 🤌', 'Great taste! 🌟'];

const confettiColors = ['#58cc02', '#ffc700', '#1cb0f6', '#a570ff', '#cc348d', '#e67348'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getQuestionOptions(question: Question | undefined): string[] {
  if (!question) return [];
  if ('options' in question && question.options) return question.options;
  if (question.type === 'rating' && 'scale' in question) {
    return Array.from({ length: question.scale || 5 }, (_, i) => String(i + 1));
  }
  return [];
}

function mapQuestionToVisualOptions<T extends { id: string; name: string }>(
  question: Question | undefined,
  visualOptions: T[]
): Array<T & { answerValue: string; uniqueId: string }> {
  const opts = getQuestionOptions(question);
  if (opts.length === 0) return [];
  return opts.map((option, index) => {
    const v = visualOptions[index % visualOptions.length];
    return { ...v, answerValue: option, uniqueId: `${v.id}-${index}` };
  });
}

// ── XP Float particle ─────────────────────────────────────────────────────────

function XPParticle({ id: _id, onDone }: { id: number; onDone: () => void }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50 font-fredoka font-bold text-duo-green text-lg select-none"
      style={{ right: 56, top: 20 }}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      +10 XP
    </motion.div>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────

function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; duration: number; shape: string }>>([]);
  useEffect(() => {
    if (isActive) {
      setParticles(Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.6,
        duration: 2 + Math.random() * 2,
        shape: Math.random() > 0.5 ? 'rounded-sm' : 'rounded-full',
      })));
    }
  }, [isActive]);
  if (!isActive) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute w-3 h-3 ${p.shape}`}
          style={{ left: `${p.x}%`, top: -20, backgroundColor: p.color }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 60 : 900, rotate: Math.random() > 0.5 ? 720 : -720, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ── Pizza Display ─────────────────────────────────────────────────────────────

interface PizzaDisplayProps {
  selectedChoices: SelectedChoices;
  stage: number;
}

function PizzaDisplay({ selectedChoices, stage }: PizzaDisplayProps) {
  const crustId = selectedChoices.crust.replace(/-\d+$/, '');
  const sauceId = selectedChoices.sauce.replace(/-\d+$/, '');
  const cheeseId = selectedChoices.cheese.replace(/-\d+$/, '');
  const crust = crustOptions.find(c => c.id === crustId);
  const sauce = sauceOptions.find(s => s.id === sauceId);
  const cheese = cheeseOptions.find(c => c.id === cheeseId);

  // Topping positions using golden angle
  const toppingDots = selectedChoices.toppings.flatMap((uniqueId, ti) => {
    const baseId = uniqueId.replace(/-\d+$/, '');
    const topping = toppingOptions.find(t => t.id === baseId) || toppingOptions[ti % toppingOptions.length];
    return Array.from({ length: 4 }, (_, i) => {
      const angle = ((ti * 4 + i) * 137.5) % 360;
      const radius = 16 + ((ti * 4 + i) % 3) * 12;
      return {
        id: `${uniqueId}-${i}`,
        emoji: topping.emoji,
        x: 50 + radius * Math.cos((angle * Math.PI) / 180),
        y: 50 + radius * Math.sin((angle * Math.PI) / 180),
        delay: i * 0.08,
      };
    });
  });

  const crustBorder = crust ? crust.crustWidth : 0;
  const isEmpty = stage === 0 && !crust;

  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto select-none">
      {/* Outer glow when something is selected */}
      {crust && (
        <motion.div
          className="absolute -inset-3 rounded-full"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, rgba(255,160,0,0.15) 0%, transparent 70%)' }}
        />
      )}

      {/* Crust (base circle) */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: crust ? 'radial-gradient(circle at 40% 35%, #f5d48a 0%, #d4882a 60%, #b8620d 100%)' : 'transparent',
          border: isEmpty ? '3px dashed #e5e5e5' : 'none',
        }}
        initial={false}
        animate={{ scale: crust ? 1 : 0.85, opacity: crust ? 1 : 0.4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* Sauce layer */}
      <AnimatePresence>
        {sauce && stage >= 1 && (
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: crustBorder,
              background: sauce.id === 'white'
                ? 'radial-gradient(circle at 40% 35%, #faf5e4 0%, #ede8d0 100%)'
                : sauce.id === 'pesto'
                ? 'radial-gradient(circle at 40% 35%, #4db855 0%, #2d6e33 100%)'
                : sauce.id === 'bbq'
                ? 'radial-gradient(circle at 40% 35%, #a03000 0%, #5a1500 100%)'
                : 'radial-gradient(circle at 40% 35%, #ff4444 0%, #cc1a1a 100%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          />
        )}
      </AnimatePresence>

      {/* Cheese layer */}
      <AnimatePresence>
        {cheese && cheese.id !== 'none' && stage >= 2 && (
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: crustBorder + 12,
              background: cheese.id === 'cheddar'
                ? 'radial-gradient(circle at 40% 35%, #ffb347 0%, #e06a00 100%)'
                : cheese.id === 'ricotta'
                ? 'radial-gradient(circle at 40% 35%, #ffffff 0%, #f0eedd 100%)'
                : 'radial-gradient(circle at 40% 35%, #ffe87a 0%, #e6c200 100%)',
              opacity: 0.9,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.9 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          />
        )}
      </AnimatePresence>

      {/* Toppings */}
      <AnimatePresence>
        {stage >= 4 && toppingDots.map((t) => (
          <motion.div
            key={t.id}
            className="absolute text-sm leading-none pointer-events-none"
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)' }}
            initial={{ scale: 0, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18, delay: t.delay }}
          >
            {t.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state hint */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-5xl"
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            🍕
          </motion.span>
        </div>
      )}
    </div>
  );
}

// ── Animated XP counter ───────────────────────────────────────────────────────

function XPCounter({ xp }: { xp: number }) {
  return (
    <motion.span
      key={xp}
      initial={{ scale: 1.4, color: '#f59e0b' }}
      animate={{ scale: 1, color: '#1a1a1a' }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {xp}
    </motion.span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
  const [xp, setXp] = useState(0);
  const [xpParticles, setXpParticles] = useState<number[]>([]);
  const [comboText, setComboText] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const particleCounter = useRef(0);

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

  const addXp = (amount = 10) => {
    setXp(prev => prev + amount);
    const id = ++particleCounter.current;
    setXpParticles(prev => [...prev, id]);
    setComboText(COMBO_PHRASES[Math.floor(Math.random() * COMBO_PHRASES.length)]);
    setTimeout(() => setComboText(''), 1800);
  };

  const removeParticle = (id: number) => setXpParticles(prev => prev.filter(p => p !== id));

  const pickWithBadge = (uniqueId: string, advance: () => void) => {
    setPickedId(uniqueId);
    addXp(10);
    setTimeout(() => { setPickedId(null); advance(); }, 650);
  };

  const mappedCrustOptions = mapQuestionToVisualOptions(questions[0], crustOptions);
  const mappedSauceOptions = mapQuestionToVisualOptions(questions[1], sauceOptions);
  const mappedCheeseOptions = mapQuestionToVisualOptions(questions[2], cheeseOptions);
  const mappedToppingOptions = mapQuestionToVisualOptions(questions[3], toppingOptions);

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

  const handleFormSubmit = () => setCurrentStage(4);

  const handleToppingToggle = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => {
      const newToppings = prev.toppings.includes(uniqueId)
        ? prev.toppings.filter(t => t !== uniqueId)
        : [...prev.toppings, uniqueId];
      if (!prev.toppings.includes(uniqueId)) addXp(10);
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
          }, 2500);
          setTimeout(() => setShowConfetti(false), 5000);
          return 100;
        }
        return prev + 1.5;
      });
    }, 50);
  };

  const totalDisplayStages = allowAnonymous ? 5 : 6;
  const progressPct = Math.min((currentStage / totalDisplayStages) * 100, 100);
  const showTopBar = currentStage >= 1 && currentStage < 6;

  return (
    <div className="min-h-screen bg-[#fffbf5] flex flex-col">
      <Confetti isActive={showConfetti} />
      {xpParticles.map(id => <XPParticle key={id} id={id} onDone={() => removeParticle(id)} />)}

      {/* ── Top HUD ── */}
      {showTopBar && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full px-4 pt-5 pb-3 max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 mb-3">
            {/* Back */}
            <button
              onClick={handleBack}
              disabled={currentStage <= 1}
              className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-cloud-gray bg-white shadow-[0_3px_0_#e5e5e5] flex items-center justify-center text-graphite disabled:opacity-20 active:translate-y-[2px] active:shadow-none transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Progress bar */}
            <div className="flex-1 h-4 bg-white rounded-full overflow-hidden border-2 border-cloud-gray shadow-inner">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #58cc02 0%, #78e02a 100%)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </div>

            {/* XP badge */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-sunshine-yellow/20 border-2 border-sunshine-yellow rounded-2xl">
              <span className="text-xs">⭐</span>
              <span className="font-fredoka font-bold text-sm text-almost-black">
                <XPCounter xp={xp} />
              </span>
            </div>
          </div>

          {/* Combo text */}
          <div className="h-5 flex justify-center">
            <AnimatePresence mode="wait">
              {comboText && (
                <motion.p
                  key={comboText}
                  initial={{ opacity: 0, y: -8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-xs font-black text-duo-green uppercase tracking-widest"
                >
                  {comboText}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Pizza canvas ── */}
      {currentStage < 6 && (
        <div className="flex justify-center pt-4 pb-2">
          <PizzaDisplay selectedChoices={selectedChoices} stage={currentStage} />
        </div>
      )}

      {/* ── Stage content ── */}
      <div className="flex-1 flex flex-col px-4 max-w-lg mx-auto w-full pb-8 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {currentStage === 0 && (
              <StageWrapper emoji="🍕" label="Stage 1 · Crust">
                <StageQuestion question={questions[0]} fallback="Pick your crust style" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedCrustOptions.map((opt, i) => (
                    <IngredientCard
                      key={opt.uniqueId}
                      emoji={opt.emoji}
                      name={opt.answerValue}
                      desc={opt.desc}
                      index={i}
                      isPicked={pickedId === opt.uniqueId}
                      isSelected={false}
                      onClick={() => handleCrustSelect(opt.uniqueId, opt.answerValue)}
                    />
                  ))}
                </div>
              </StageWrapper>
            )}

            {currentStage === 1 && (
              <StageWrapper emoji="🍅" label="Stage 2 · Sauce">
                <StageQuestion question={questions[1]} fallback="Slather on the sauce" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedSauceOptions.map((opt, i) => (
                    <IngredientCard
                      key={opt.uniqueId}
                      emoji={opt.emoji}
                      name={opt.answerValue}
                      desc={opt.desc}
                      color={opt.bg}
                      index={i}
                      isPicked={pickedId === opt.uniqueId}
                      isSelected={false}
                      onClick={() => handleSauceSelect(opt.uniqueId, opt.answerValue)}
                    />
                  ))}
                </div>
              </StageWrapper>
            )}

            {currentStage === 2 && (
              <StageWrapper emoji="🧀" label="Stage 3 · Cheese">
                <StageQuestion question={questions[2]} fallback="Layer on the cheese" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedCheeseOptions.map((opt, i) => (
                    <IngredientCard
                      key={opt.uniqueId}
                      emoji={opt.emoji}
                      name={opt.answerValue}
                      desc={opt.desc}
                      color={opt.bg}
                      index={i}
                      isPicked={pickedId === opt.uniqueId}
                      isSelected={false}
                      onClick={() => handleCheeseSelect(opt.uniqueId, opt.answerValue)}
                    />
                  ))}
                </div>
              </StageWrapper>
            )}

            {currentStage === 3 && !allowAnonymous && (
              <FormCapture formData={formData} setFormData={setFormData} onSubmit={handleFormSubmit} />
            )}

            {currentStage === 4 && (
              <ToppingsStage
                question={questions[3]}
                options={mappedToppingOptions}
                selectedToppings={selectedChoices.toppings}
                onToggle={handleToppingToggle}
                onDone={() => setCurrentStage(5)}
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
              <BakingStage isBaking={isBaking} progress={bakingProgress} isDone={isDone} xp={xp} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {currentStage < 6 && (
        <div className="py-4 text-center">
          <a href="https://unboringsurveys.com" target="_blank" rel="noopener noreferrer"
            className="font-fredoka text-sm font-bold text-silver hover:text-duo-green transition-colors">
            Unboring<span className="text-duo-green">.</span>
          </a>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StageWrapper({ emoji, label, children }: { emoji: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-cloud-gray rounded-2xl shadow-[0_2px_0_#e5e5e5]"
      >
        <span>{emoji}</span>
        <span className="font-fredoka font-bold text-sm text-almost-black uppercase tracking-wide">{label}</span>
      </motion.div>
      {children}
    </div>
  );
}

function StageQuestion({ question, fallback }: { question?: Question; fallback: string }) {
  return (
    <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight">
      {question?.question || fallback}
    </h2>
  );
}

function IngredientCard({
  emoji, name, desc, color, index, isPicked, isSelected, onClick,
}: {
  emoji: string; name: string; desc: string; color?: string; index: number;
  isPicked: boolean; isSelected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative p-4 rounded-3xl border-2 text-left transition-all overflow-hidden ${
        isPicked || isSelected
          ? 'border-duo-green bg-duo-green/8 shadow-[0_4px_0_#46a302]'
          : 'border-cloud-gray bg-white shadow-[0_4px_0_#e5e5e5] hover:border-duo-green/50 active:translate-y-[3px] active:shadow-none'
      }`}
    >
      {/* Color swatch bg */}
      {color && color !== 'transparent' && (
        <div
          className="absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] opacity-15"
          style={{ background: color }}
        />
      )}

      <div className="flex flex-col gap-2">
        <motion.span
          className="text-4xl"
          animate={isPicked ? { rotate: [0, -15, 15, -8, 0], scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {emoji}
        </motion.span>
        <div>
          <div className="font-fredoka font-bold text-almost-black text-base leading-tight">{name}</div>
          <div className="font-bold text-graphite text-xs mt-0.5">{desc}</div>
        </div>

        {/* Pick indicator */}
        <AnimatePresence>
          {isPicked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-2.5 right-2.5 w-7 h-7 bg-duo-green rounded-full flex items-center justify-center shadow-md"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

function ToppingsStage({
  question, options, selectedToppings, onToggle, onDone,
}: {
  question?: Question;
  options: Array<typeof toppingOptions[0] & { answerValue: string; uniqueId: string }>;
  selectedToppings: string[];
  onToggle: (id: string, val: string) => void;
  onDone: () => void;
}) {
  const count = selectedToppings.length;
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="flex items-center gap-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-cloud-gray rounded-2xl shadow-[0_2px_0_#e5e5e5]">
          <span>🧄</span>
          <span className="font-fredoka font-bold text-sm text-almost-black uppercase tracking-wide">Stage 4 · Toppings</span>
        </div>
        <AnimatePresence mode="wait">
          {count > 0 && (
            <motion.div
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className="w-8 h-8 bg-duo-green rounded-full flex items-center justify-center shadow-md"
            >
              <span className="font-fredoka font-bold text-white text-sm">{count}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight">
        {question?.question || 'Load up the toppings!'}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isSelected = selectedToppings.includes(opt.uniqueId);
          return (
            <motion.button
              key={opt.uniqueId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onToggle(opt.uniqueId, opt.answerValue)}
              className={`relative p-4 rounded-3xl border-2 text-left transition-all overflow-hidden ${
                isSelected
                  ? 'border-duo-green bg-duo-green/8 shadow-[0_4px_0_#46a302]'
                  : 'border-cloud-gray bg-white shadow-[0_4px_0_#e5e5e5] hover:border-duo-green/50 active:translate-y-[3px] active:shadow-none'
              }`}
            >
              {/* Color accent */}
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] opacity-10"
                style={{ background: opt.color }}
              />

              <div className="flex flex-col gap-2">
                <motion.span
                  className="text-4xl"
                  animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {opt.emoji}
                </motion.span>
                <div>
                  <div className="font-fredoka font-bold text-almost-black text-base leading-tight">{opt.answerValue}</div>
                  {'controversial' in opt && opt.controversial && (
                    <div className="text-[10px] font-black text-bubblegum-pink uppercase tracking-widest mt-0.5">Controversial 👀</div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-duo-green rounded-full flex items-center justify-center shadow-md"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={onDone}
        whileTap={{ scale: 0.97 }}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-3xl border-b-4 border-[#46a302] shadow-[0_5px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[4px] active:shadow-none active:border-b-0 flex items-center justify-center gap-2"
      >
        <motion.span
          animate={{ rotate: [0, -12, 12, -6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1 }}
        >
          🔥
        </motion.span>
        {count === 0 ? 'Skip Toppings' : `Into the Oven! (${count} toppings)`}
      </motion.button>
    </div>
  );
}

function FormCapture({
  formData, setFormData, onSubmit,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="text-6xl mb-5"
        >
          🍕
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Before the toppings…</h2>
        <p className="text-graphite font-bold text-sm">Who&apos;s building this pizza?</p>
      </div>

      <div className="space-y-4 mb-8">
        {(['name', 'email'] as const).map((field) => (
          <div key={field}>
            <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
              {field === 'name' ? 'Name' : 'Email'} <span className="text-silver">(optional)</span>
            </label>
            <input
              type={field === 'email' ? 'email' : 'text'}
              value={formData[field]}
              onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={field === 'email' ? 'your@email.com' : 'Your name'}
              className="w-full p-4 rounded-2xl border-2 border-cloud-gray bg-white focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-3xl border-b-4 border-[#46a302] shadow-[0_5px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[4px] active:shadow-none active:border-b-0"
      >
        Add Toppings 🥓
      </button>
    </div>
  );
}

function BakingStage({ isBaking: _isBaking, progress, isDone, xp }: { isBaking: boolean; progress: number; isDone: boolean; xp: number }) {
  const flameCount = 6;

  if (isDone) {
    return (
      <motion.div
        className="text-center py-10"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.div
          className="text-8xl mb-6"
          animate={{ scale: [1, 1.18, 0.95, 1.08, 1], rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          🍕
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-fredoka text-5xl font-bold text-duo-green mb-2"
        >
          Pizza Ready!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-graphite font-black text-sm uppercase tracking-widest mb-6"
        >
          Quest Complete!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-sunshine-yellow/20 border-2 border-sunshine-yellow rounded-2xl"
        >
          <span className="text-xl">⭐</span>
          <span className="font-fredoka font-bold text-almost-black text-lg">{xp} XP Earned!</span>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="text-center py-8">
      {/* Oven illustration */}
      <div className="relative w-40 h-40 mx-auto mb-8">
        {/* Oven body */}
        <div className="absolute inset-0 bg-gray-800 rounded-[2rem] border-4 border-gray-700 shadow-2xl" />

        {/* Oven window */}
        <div className="absolute inset-4 bg-gray-900 rounded-xl border-2 border-gray-600 overflow-hidden flex items-center justify-center">
          {/* Glow */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ background: 'radial-gradient(circle, rgba(255,140,0,0.6) 0%, rgba(200,40,0,0.3) 60%, transparent 100%)' }}
          />
          {/* Pizza inside */}
          <motion.span
            className="relative text-4xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🍕
          </motion.span>
        </div>

        {/* Flames at bottom */}
        <div className="absolute -bottom-4 left-0 right-0 flex justify-center gap-1">
          {Array.from({ length: flameCount }, (_, i) => (
            <motion.span
              key={i}
              className="text-xl"
              animate={{ y: [0, -6, 0], scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{
                duration: 0.6 + i * 0.1,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            >
              🔥
            </motion.span>
          ))}
        </div>
      </div>

      <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-6">
        {progress < 40 ? 'Preheating oven… 🌡️' : progress < 70 ? 'Baking your pizza…' : 'Almost done! 🤩'}
      </h2>

      {/* Progress bar */}
      <div className="w-full h-5 bg-white rounded-full overflow-hidden border-2 border-cloud-gray shadow-inner mb-3 max-w-sm mx-auto">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #ff6600 0%, #ffc700 100%)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <p className="font-black text-graphite text-sm uppercase tracking-widest">
        {Math.round(progress)}% done
      </p>

      {/* Heat wave lines */}
      <div className="mt-6 flex justify-center gap-3">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1 h-8 rounded-full bg-orange-300/60"
            animate={{ scaleY: [1, 1.6, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
