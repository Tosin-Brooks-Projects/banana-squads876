'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

interface FormData { name: string; email: string }

interface SelectedChoices {
  beans: string;
  grind: string;
  method: string;
  finishing: string | string[];
}

interface AnswerMap {
  [questionId: string]: { visualId: string | string[]; answerValue: string | string[] };
}

// ── Visual data ───────────────────────────────────────────────────────────────

const beanOptions = [
  { id: 'light',  name: 'Light Roast',  emoji: '☀️', desc: 'Bright & fruity',  roastColor: '#d4a055', cupLiquid: '#e8c882' },
  { id: 'medium', name: 'Medium Roast', emoji: '🌅', desc: 'Balanced & smooth', roastColor: '#8b4513', cupLiquid: '#8b4513' },
  { id: 'dark',   name: 'Dark Roast',   emoji: '🌑', desc: 'Bold & intense',    roastColor: '#2c1a0e', cupLiquid: '#1a0d05' },
  { id: 'decaf',  name: 'Decaf',        emoji: '😴', desc: 'All the taste',     roastColor: '#6b4c2a', cupLiquid: '#6b4c2a' },
];

const grindOptions = [
  { id: 'fine',   name: 'Fine',   emoji: '🔬', desc: 'Espresso-ready',  dotSize: 2, dots: 9 },
  { id: 'medium', name: 'Medium', emoji: '⚖️', desc: 'Pour-over perfect', dotSize: 3, dots: 6 },
  { id: 'coarse', name: 'Coarse', emoji: '🪨', desc: 'French press',     dotSize: 5, dots: 4 },
  { id: 'whole',  name: 'Whole Bean', emoji: '🫘', desc: 'Grind-your-own', dotSize: 7, dots: 3 },
];

const methodOptions = [
  { id: 'espresso',    name: 'Espresso',     emoji: '⚡', desc: 'Fast & punchy',    steamCount: 5 },
  { id: 'pourover',    name: 'Pour-over',    emoji: '🫗', desc: 'Clean & precise',  steamCount: 3 },
  { id: 'frenchpress', name: 'French Press', emoji: '🫖', desc: 'Rich & full-body', steamCount: 4 },
  { id: 'coldbrew',    name: 'Cold Brew',    emoji: '🧊', desc: 'Smooth & cold',    steamCount: 0 },
  { id: 'drip',        name: 'Drip',         emoji: '☕', desc: 'Classic & easy',   steamCount: 2 },
];

const finishingOptions = [
  { id: 'black',    name: 'Black',        emoji: '☕', desc: 'Pure & unadulterated' },
  { id: 'milk',     name: 'Milk',         emoji: '🥛', desc: 'Creamy & mellow' },
  { id: 'oat',      name: 'Oat Milk',     emoji: '🌾', desc: 'Plant-based smooth' },
  { id: 'sugar',    name: 'Sugar',        emoji: '🍬', desc: 'A touch of sweet' },
  { id: 'honey',    name: 'Honey',        emoji: '🍯', desc: 'Natural sweetness' },
  { id: 'caramel',  name: 'Caramel',      emoji: '🍮', desc: 'Indulgent drizzle' },
];

const COMBO_PHRASES = [
  'Barista approved! ☕', 'Great taste! 🤌', 'Coffee connoisseur! 🏆',
  'Brewing perfection! ✨', 'Bold choice! 💪', 'Nice pick! 🌟',
];

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
  question: Question | undefined, visualOptions: T[]
): Array<T & { answerValue: string; uniqueId: string }> {
  const opts = getQuestionOptions(question);
  if (opts.length === 0) return [];
  return opts.map((option, index) => {
    const v = visualOptions[index % visualOptions.length];
    return { ...v, answerValue: option, uniqueId: `${v.id}-${index}` };
  });
}

// ── XP float particle ─────────────────────────────────────────────────────────

function XPParticle({ id: _id, onDone }: { id: number; onDone: () => void }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50 font-fredoka font-bold text-amber-600 text-lg select-none"
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
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; duration: number }>>([]);
  useEffect(() => {
    if (isActive) {
      setParticles(Array.from({ length: 60 }, (_, i) => ({
        id: i, x: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.6, duration: 2 + Math.random() * 2,
      })));
    }
  }, [isActive]);
  if (!isActive) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map(p => (
        <motion.div key={p.id} className="absolute w-3 h-3 rounded-sm"
          style={{ left: `${p.x}%`, top: -20, backgroundColor: p.color }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 60 : 900, rotate: 540, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ── Coffee cup scene ──────────────────────────────────────────────────────────

function CoffeeScene({ selectedChoices, stage }: { selectedChoices: SelectedChoices; stage: number }) {
  const beanId = selectedChoices.beans.replace(/-\d+$/, '');
  const methodId = selectedChoices.method.replace(/-\d+$/, '');
  const bean = beanOptions.find(b => b.id === beanId);
  const method = methodOptions.find(m => m.id === methodId);

  const isCold = method?.id === 'coldbrew';
  const steamCount = method?.steamCount ?? 0;
  const liquidColor = bean?.cupLiquid ?? '#8b4513';
  const fillPct = stage >= 3 ? 70 : stage >= 2 ? 40 : stage >= 1 ? 15 : 0;

  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto select-none flex items-end justify-center pb-4">

      {/* Steam wisps above cup */}
      <AnimatePresence>
        {stage >= 3 && !isCold && steamCount > 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2">
            {Array.from({ length: steamCount }, (_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ height: 24, background: 'rgba(200,200,200,0.5)' }}
                animate={{ opacity: [0, 0.8, 0], y: [0, -18], scaleX: [1, 1.5, 0.5] }}
                transition={{ duration: 1.8, delay: i * 0.3, repeat: Infinity, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Ice cubes for cold brew */}
      <AnimatePresence>
        {stage >= 3 && isCold && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-4 h-4 rounded-sm border border-sky-200"
                style={{ background: 'rgba(186,230,253,0.7)' }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Cup body */}
      <div className="relative w-28 h-32">
        {/* Cup shape (trapezoid via clip) */}
        <div
          className="absolute inset-0 rounded-b-[2.5rem] rounded-t-lg overflow-hidden border-4 shadow-[0_6px_0_rgba(0,0,0,0.1)]"
          style={{ borderColor: '#d6b896', background: '#f5f0e8' }}
        >
          {/* Liquid fill */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-b-[2rem]"
            style={{ background: liquidColor }}
            animate={{ height: `${fillPct}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          />

          {/* Foam / crema on top of liquid */}
          <AnimatePresence>
            {stage >= 2 && fillPct > 0 && (
              <motion.div
                className="absolute left-0 right-0 h-3 rounded-full"
                style={{
                  bottom: `${fillPct}%`,
                  background: isCold ? 'rgba(186,230,253,0.5)' : 'rgba(255,220,160,0.7)',
                  marginBottom: -6,
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              />
            )}
          </AnimatePresence>

          {/* Empty hint */}
          {stage === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-20">☕</div>
          )}
        </div>

        {/* Handle */}
        <div
          className="absolute right-[-14px] top-6 w-5 h-9 rounded-r-full border-4"
          style={{ borderColor: '#d6b896', borderLeft: 'none', background: 'transparent' }}
        />

        {/* Saucer */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-36 h-4 rounded-full border-2"
          style={{ borderColor: '#d6b896', background: '#f5f0e8' }}
        />
      </div>

      {/* Method badge floating above */}
      <AnimatePresence>
        {method && stage >= 2 && (
          <motion.div
            className="absolute top-8 right-4 text-2xl"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            {method.emoji}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CoffeeBrewer({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: CoffeeBrewerProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? { beans: '', grind: '', method: '', finishing: '' }
  );
  const [answerMap, setAnswerMap] = useState<AnswerMap>(initialState?.answerMap ?? {});
  const [formData, setFormData] = useState<FormData>(initialState?.formData ?? { name: '', email: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [additionalThoughts, setAdditionalThoughts] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [xpParticles, setXpParticles] = useState<number[]>([]);
  const [comboText, setComboText] = useState('');
  const particleCounter = useRef(0);

  const reportProgress = useCallback(() => {
    if (!onProgress || currentStage === 0 || currentStage >= 6) return;
    const answers: Answer[] = questions.map((q) => {
      const entry = answerMap[q.id];
      return { questionId: q.id, value: entry?.answerValue || '' };
    });
    onProgress({
      currentStage, totalStages: allowAnonymous ? 6 : 7, answers,
      adventureState: { currentStage, selectedChoices, answerMap, formData },
      respondentName: allowAnonymous ? undefined : (formData.name || undefined),
      respondentEmail: allowAnonymous ? undefined : (formData.email || undefined),
    });
  }, [onProgress, currentStage, questions, answerMap, selectedChoices, formData, allowAnonymous]);

  useEffect(() => { reportProgress(); }, [currentStage, reportProgress]);

  const addXp = () => {
    setXp(prev => prev + 10);
    const id = ++particleCounter.current;
    setXpParticles(prev => [...prev, id]);
    setComboText(COMBO_PHRASES[Math.floor(Math.random() * COMBO_PHRASES.length)]);
    setTimeout(() => setComboText(''), 1800);
  };

  const removeParticle = (id: number) => setXpParticles(prev => prev.filter(p => p !== id));

  const pickWithBadge = (uniqueId: string, advance: () => void) => {
    setPickedId(uniqueId);
    addXp();
    setTimeout(() => { setPickedId(null); advance(); }, 650);
  };

  const mappedBeanOptions    = mapQuestionToVisualOptions(questions[0], beanOptions);
  const mappedGrindOptions   = mapQuestionToVisualOptions(questions[1], grindOptions);
  const mappedMethodOptions  = mapQuestionToVisualOptions(questions[2], methodOptions);
  const mappedFinishingOptions = mapQuestionToVisualOptions(questions[3], finishingOptions);

  const handleBeansSelect  = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, beans: uniqueId }));
    if (questions[0]) setAnswerMap(prev => ({ ...prev, [questions[0].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(1));
  };

  const handleGrindSelect  = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, grind: uniqueId }));
    if (questions[1]) setAnswerMap(prev => ({ ...prev, [questions[1].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(2));
  };

  const handleMethodSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, method: uniqueId }));
    if (questions[2]) setAnswerMap(prev => ({ ...prev, [questions[2].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(allowAnonymous ? 4 : 3));
  };

  const finishingQuestion = questions[3];
  const allowMultipleFinishing = finishingQuestion && isMultipleChoiceQuestion(finishingQuestion) && finishingQuestion.allowMultiple === true;

  const handleFinishingToggle = (uniqueId: string, answerValue: string) => {
    if (allowMultipleFinishing) {
      setSelectedChoices(prev => {
        const cur = Array.isArray(prev.finishing) ? prev.finishing : (prev.finishing ? [prev.finishing] : []);
        const isSelected = cur.includes(uniqueId);
        if (!isSelected) addXp();
        return { ...prev, finishing: isSelected ? cur.filter(id => id !== uniqueId) : [...cur, uniqueId] };
      });
      if (questions[3]) {
        setAnswerMap(prev => {
          const entry = prev[questions[3].id];
          const ids  = Array.isArray(entry?.visualId)    ? entry.visualId    : (entry?.visualId    ? [entry.visualId]    : []);
          const vals = Array.isArray(entry?.answerValue) ? entry.answerValue : (entry?.answerValue ? [entry.answerValue] : []);
          const isSelected = ids.includes(uniqueId);
          return { ...prev, [questions[3].id]: {
            visualId:    isSelected ? ids.filter(id => id !== uniqueId)      : [...ids, uniqueId],
            answerValue: isSelected ? vals.filter(v => v !== answerValue)    : [...vals, answerValue],
          }};
        });
      }
    } else {
      setSelectedChoices(prev => ({ ...prev, finishing: uniqueId }));
      if (questions[3]) setAnswerMap(prev => ({ ...prev, [questions[3].id]: { visualId: uniqueId, answerValue } }));
      pickWithBadge(uniqueId, () => setCurrentStage(5));
    }
  };

  const handleComplete = () => {
    setCurrentStage(6);
    setShowConfetti(true);
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
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleBack = () => {
    if (currentStage > 0) {
      if (allowAnonymous && currentStage === 4) setCurrentStage(2);
      else setCurrentStage(prev => prev - 1);
    }
  };

  const totalDisplayStages = allowAnonymous ? 5 : 6;
  const progressPct = Math.min((currentStage / totalDisplayStages) * 100, 100);
  const showTopBar = currentStage >= 1 && currentStage < 6;

  const finishingSelected = Array.isArray(selectedChoices.finishing)
    ? selectedChoices.finishing
    : (selectedChoices.finishing ? [selectedChoices.finishing] : []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #fdf6ec 0%, #fffbf5 100%)' }}>
      <Confetti isActive={showConfetti} />
      {xpParticles.map(id => <XPParticle key={id} id={id} onDone={() => removeParticle(id)} />)}

      {/* ── HUD ── */}
      {showTopBar && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full px-4 pt-5 pb-3 max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handleBack}
              disabled={currentStage <= 1}
              className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-amber-100 bg-white shadow-[0_3px_0_#fde68a] flex items-center justify-center text-graphite disabled:opacity-20 active:translate-y-[2px] active:shadow-none transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 h-4 bg-white rounded-full overflow-hidden border-2 border-amber-100 shadow-inner">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #92400e 0%, #d97706 100%)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </div>

            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border-2 border-amber-200 rounded-2xl">
              <span className="text-xs">☕</span>
              <span className="font-fredoka font-bold text-sm text-almost-black"><motion.span key={xp} initial={{ scale: 1.4, color: '#f59e0b' }} animate={{ scale: 1, color: '#1a1a1a' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP</span>
            </div>
          </div>

          <div className="h-5 flex justify-center">
            <AnimatePresence mode="wait">
              {comboText && (
                <motion.p
                  key={comboText}
                  initial={{ opacity: 0, y: -8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-xs font-black text-amber-700 uppercase tracking-widest"
                >
                  {comboText}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Coffee scene ── */}
      {currentStage < 6 && (
        <div className="flex justify-center pt-2 pb-2">
          <CoffeeScene selectedChoices={selectedChoices} stage={currentStage} />
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
              <CoffeeStageWrapper emoji="🫘" label="Stage 1 · Beans">
                <StageQuestion question={questions[0]} fallback="Pick your beans" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedBeanOptions.map((opt, i) => {
                    const visual = beanOptions.find(b => opt.uniqueId.startsWith(b.id)) || beanOptions[0];
                    return (
                      <CoffeeCard
                        key={opt.uniqueId}
                        emoji={visual.emoji}
                        name={opt.answerValue}
                        desc={visual.desc}
                        accentColor={visual.roastColor}
                        index={i}
                        isPicked={pickedId === opt.uniqueId}
                        isSelected={false}
                        onClick={() => handleBeansSelect(opt.uniqueId, opt.answerValue)}
                      />
                    );
                  })}
                </div>
              </CoffeeStageWrapper>
            )}

            {currentStage === 1 && (
              <CoffeeStageWrapper emoji="⚙️" label="Stage 2 · Grind">
                <StageQuestion question={questions[1]} fallback="Choose your grind size" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedGrindOptions.map((opt, i) => {
                    const visual = grindOptions.find(g => opt.uniqueId.startsWith(g.id)) || grindOptions[0];
                    return (
                      <GrindCard
                        key={opt.uniqueId}
                        visual={visual}
                        name={opt.answerValue}
                        index={i}
                        isPicked={pickedId === opt.uniqueId}
                        onClick={() => handleGrindSelect(opt.uniqueId, opt.answerValue)}
                      />
                    );
                  })}
                </div>
              </CoffeeStageWrapper>
            )}

            {currentStage === 2 && (
              <CoffeeStageWrapper emoji="🫖" label="Stage 3 · Method">
                <StageQuestion question={questions[2]} fallback="How do you brew?" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedMethodOptions.map((opt, i) => {
                    const visual = methodOptions.find(m => opt.uniqueId.startsWith(m.id)) || methodOptions[0];
                    return (
                      <CoffeeCard
                        key={opt.uniqueId}
                        emoji={visual.emoji}
                        name={opt.answerValue}
                        desc={visual.desc}
                        accentColor="#92400e"
                        index={i}
                        isPicked={pickedId === opt.uniqueId}
                        isSelected={false}
                        onClick={() => handleMethodSelect(opt.uniqueId, opt.answerValue)}
                      />
                    );
                  })}
                </div>
              </CoffeeStageWrapper>
            )}

            {currentStage === 3 && !allowAnonymous && (
              <FormCapture formData={formData} setFormData={setFormData} onSubmit={() => setCurrentStage(4)} />
            )}

            {currentStage === 4 && (
              <FinishingStage
                question={questions[3]}
                options={mappedFinishingOptions}
                selected={finishingSelected}
                allowMultiple={!!allowMultipleFinishing}
                pickedId={pickedId}
                onToggle={handleFinishingToggle}
                onContinue={() => { addXp(); setCurrentStage(5); }}
              />
            )}

            {currentStage === 5 && (
              <FinalThoughts
                value={additionalThoughts}
                onChange={setAdditionalThoughts}
                onContinue={handleComplete}
                onBack={handleBack}
                theme="coffee"
                respondentName={formData.name}
              />
            )}

            {currentStage === 6 && <CompletionStage xp={xp} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {currentStage < 6 && (
        <div className="py-4 text-center">
          <a href="https://unboringsurveys.com" target="_blank" rel="noopener noreferrer"
            className="font-fredoka text-sm font-bold text-silver hover:text-amber-600 transition-colors">
            Unboring<span className="text-amber-600">.</span>
          </a>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CoffeeStageWrapper({ emoji, label, children }: { emoji: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-amber-100 rounded-2xl shadow-[0_2px_0_#fde68a]"
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

function CoffeeCard({
  emoji, name, desc, accentColor, index, isPicked, isSelected, onClick,
}: {
  emoji: string; name: string; desc: string; accentColor: string;
  index: number; isPicked: boolean; isSelected: boolean; onClick: () => void;
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
          ? 'border-amber-500 bg-amber-50 shadow-[0_4px_0_#d97706]'
          : 'border-amber-100 bg-white shadow-[0_4px_0_#fde68a] hover:border-amber-400 active:translate-y-[3px] active:shadow-none'
      }`}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] opacity-10" style={{ background: accentColor }} />

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
      </div>

      <AnimatePresence>
        {(isPicked || isSelected) && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2.5 right-2.5 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow-md"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Grind card shows dot pattern to visualise grind size
function GrindCard({
  visual, name, index, isPicked, onClick,
}: {
  visual: typeof grindOptions[0]; name: string; index: number; isPicked: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative p-4 rounded-3xl border-2 text-left transition-all overflow-hidden ${
        isPicked
          ? 'border-amber-500 bg-amber-50 shadow-[0_4px_0_#d97706]'
          : 'border-amber-100 bg-white shadow-[0_4px_0_#fde68a] hover:border-amber-400 active:translate-y-[3px] active:shadow-none'
      }`}
    >
      {/* Dot pattern visualising grind size */}
      <div className="flex flex-wrap gap-1 mb-3 w-14 h-10 items-center">
        {Array.from({ length: visual.dots }, (_, i) => (
          <motion.div
            key={i}
            className="rounded-full bg-amber-800"
            style={{ width: visual.dotSize, height: visual.dotSize }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.07 + i * 0.04, type: 'spring' }}
          />
        ))}
      </div>
      <div className="font-fredoka font-bold text-almost-black text-base leading-tight">{name}</div>
      <div className="font-bold text-graphite text-xs mt-0.5">{visual.desc}</div>

      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2.5 right-2.5 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow-md"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function FinishingStage({
  question, options, selected, allowMultiple, pickedId, onToggle, onContinue,
}: {
  question?: Question;
  options: Array<typeof finishingOptions[0] & { answerValue: string; uniqueId: string }>;
  selected: string[];
  allowMultiple: boolean;
  pickedId: string | null;
  onToggle: (id: string, val: string) => void;
  onContinue: () => void;
}) {
  const count = selected.length;
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="flex items-center gap-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-amber-100 rounded-2xl shadow-[0_2px_0_#fde68a]">
          <span>✨</span>
          <span className="font-fredoka font-bold text-sm text-almost-black uppercase tracking-wide">Stage 4 · Finishing</span>
        </div>
        <AnimatePresence mode="wait">
          {allowMultiple && count > 0 && (
            <motion.div
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-md"
            >
              <span className="font-fredoka font-bold text-white text-sm">{count}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight">
        {question?.question || 'Any finishing touches?'}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const visual = finishingOptions.find(f => opt.uniqueId.startsWith(f.id)) || finishingOptions[0];
          const isSelected = selected.includes(opt.uniqueId);
          const isPicked = !allowMultiple && pickedId === opt.uniqueId;
          return (
            <CoffeeCard
              key={opt.uniqueId}
              emoji={visual.emoji}
              name={opt.answerValue}
              desc={visual.desc}
              accentColor="#92400e"
              index={i}
              isPicked={isPicked || isSelected}
              isSelected={isSelected}
              onClick={() => onToggle(opt.uniqueId, opt.answerValue)}
            />
          );
        })}
      </div>

      {allowMultiple && (
        <motion.button
          onClick={onContinue}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 bg-amber-700 text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-3xl border-b-4 border-amber-900 shadow-[0_5px_0_#78350f] transition-all hover:brightness-110 active:translate-y-[4px] active:shadow-none active:border-b-0 flex items-center justify-center gap-2"
        >
          <motion.span
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            style={{ display: 'inline-block' }}
          >
            ☕
          </motion.span>
          Brew It!
        </motion.button>
      )}
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
          ☕
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Almost brewed…</h2>
        <p className="text-graphite font-bold text-sm">Who&apos;s ordering this coffee?</p>
      </div>

      <div className="space-y-4 mb-8">
        {(['name', 'email'] as const).map(field => (
          <div key={field}>
            <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
              {field === 'name' ? 'Name' : 'Email'} <span className="text-silver">(optional)</span>
            </label>
            <input
              type={field === 'email' ? 'email' : 'text'}
              value={formData[field]}
              onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={field === 'email' ? 'your@email.com' : 'Your name'}
              className="w-full p-4 rounded-2xl border-2 border-amber-100 bg-white focus:border-amber-500 focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#fde68a] focus:shadow-[0_3px_0_#d97706]"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-5 bg-amber-700 text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-3xl border-b-4 border-amber-900 shadow-[0_5px_0_#78350f] transition-all hover:brightness-110 active:translate-y-[4px] active:shadow-none active:border-b-0"
      >
        Finishing Touches ✨
      </button>
    </div>
  );
}

function CompletionStage({ xp }: { xp: number }) {
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
        ☕
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-fredoka text-5xl font-bold text-amber-700 mb-2"
      >
        Coffee Ready!
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
        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 border-2 border-amber-200 rounded-2xl"
      >
        <span className="text-xl">☕</span>
        <span className="font-fredoka font-bold text-almost-black text-lg"><motion.span key={xp} initial={{ scale: 1.3, color: '#f59e0b' }} animate={{ scale: 1, color: '#1a1a1a' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP Earned!</span>
      </motion.div>
    </motion.div>
  );
}
