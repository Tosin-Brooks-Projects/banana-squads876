'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  allowAnonymous?: boolean;
}

interface FormData { name: string; email: string }

interface SelectedChoices {
  bowl: string;
  scoop: string;
  sauce: string;
  toppings: string[];
}

interface AnswerMap {
  [questionId: string]: { visualId: string | string[]; answerValue: string | string[] };
}

// ── Visual data ───────────────────────────────────────────────────────────────

const bowlOptions = [
  { id: 'blue',   name: 'Blue Bowl',   fillColor: '#DBEAFE', borderColor: '#3B82F6', desc: 'Cool & classic' },
  { id: 'pink',   name: 'Pink Bowl',   fillColor: '#FCE7F3', borderColor: '#EC4899', desc: 'Sweet & pretty' },
  { id: 'green',  name: 'Green Bowl',  fillColor: '#D1FAE5', borderColor: '#10B981', desc: 'Fresh & minty' },
  { id: 'purple', name: 'Purple Bowl', fillColor: '#EDE9FE', borderColor: '#8B5CF6', desc: 'Bold & dreamy' },
];

const scoopOptions = [
  { id: 'vanilla',      name: 'Vanilla',       bg: '#FEF9C3', border: '#EAB308', text: '#78350F', desc: 'Classic & creamy' },
  { id: 'chocolate',    name: 'Chocolate',     bg: '#7C2D12', border: '#92400E', text: '#FFFFFF', desc: 'Rich & indulgent' },
  { id: 'strawberry',   name: 'Strawberry',    bg: '#FBCFE8', border: '#EC4899', text: '#831843', desc: 'Sweet & fruity' },
  { id: 'mint',         name: 'Mint Chip',     bg: '#D1FAE5', border: '#059669', text: '#064E3B', desc: 'Cool & refreshing' },
  { id: 'cookies',      name: 'Cookies & Cream', bg: '#E5E7EB', border: '#374151', text: '#111827', desc: 'Crunchy & sweet' },
];

const sauceOptions = [
  { id: 'chocolate', name: 'Chocolate',  color: '#5C2C06', light: '#92400e', desc: 'Rich fudge drizzle' },
  { id: 'caramel',   name: 'Caramel',    color: '#B45309', light: '#D97706', desc: 'Golden & buttery' },
  { id: 'strawberry',name: 'Strawberry', color: '#BE185D', light: '#EC4899', desc: 'Fruity & vibrant' },
  { id: 'rainbow',   name: 'Rainbow',    color: '#7C3AED', light: '#A78BFA', desc: 'Extra fun!' },
];

const toppingOptions = [
  { id: 'sprinkles',    name: 'Sprinkles',    emoji: '🌈', desc: 'Colourful fun' },
  { id: 'nuts',         name: 'Nuts',         emoji: '🥜', desc: 'Crunchy crunch' },
  { id: 'strawberry',   name: 'Strawberry',   emoji: '🍓', desc: 'Fresh & sweet' },
  { id: 'cookie',       name: 'Cookie',       emoji: '🍪', desc: 'Crumbled goodness' },
  { id: 'cherry',       name: 'Cherry',       emoji: '🍒', desc: 'The classic top' },
  { id: 'whippedcream', name: 'Whipped Cream',emoji: '🍦', desc: 'Fluffy cloud' },
  { id: 'banana',       name: 'Banana',       emoji: '🍌', desc: 'Tropical twist' },
  { id: 'gummies',      name: 'Gummies',      emoji: '🐻', desc: 'Chewy & cute' },
];

const COMBO_PHRASES = [
  'Scooped! 🍨', 'Delicious choice! 🤌', 'Sweet pick! 🍬',
  'Ice cream royalty! 👑', 'Yummy! 😋', 'Sundae goals! ✨',
];

const confettiColors = ['#ec4899', '#ffc700', '#1cb0f6', '#a570ff', '#58cc02', '#f97316', '#fd79a8'];

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
      className="fixed pointer-events-none z-50 font-fredoka font-bold text-pink-500 text-lg select-none"
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
      setParticles(Array.from({ length: 70 }, (_, i) => ({
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

// ── Sundae scene ──────────────────────────────────────────────────────────────

function SundaeScene({ selectedChoices, stage }: { selectedChoices: SelectedChoices; stage: number }) {
  const bowlId  = selectedChoices.bowl.replace(/-\d+$/, '');
  const scoopId = selectedChoices.scoop.replace(/-\d+$/, '');
  const sauceId = selectedChoices.sauce.replace(/-\d+$/, '');
  const bowl  = bowlOptions.find(b => b.id === bowlId);
  const scoop = scoopOptions.find(s => s.id === scoopId);
  const sauce = sauceOptions.find(s => s.id === sauceId);

  return (
    <div className="relative w-48 h-56 sm:w-56 sm:h-64 mx-auto select-none flex items-end justify-center">

      {/* Ambient glow */}
      {bowl && (
        <motion.div
          className="absolute -inset-4 rounded-full pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ background: `radial-gradient(circle, ${bowl.fillColor}88 0%, transparent 70%)` }}
        />
      )}

      {/* Cherry on top */}
      <AnimatePresence>
        {stage >= 4 && selectedChoices.toppings.length > 0 && (
          <motion.div
            className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center"
            initial={{ y: -30, opacity: 0, rotate: -20 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <div className="w-0.5 h-5 bg-green-600 rounded-full" />
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-red-600 shadow-md relative">
              <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-60" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toppings scattered */}
      <AnimatePresence>
        {stage >= 4 && selectedChoices.toppings.slice(0, 6).map((tid, i) => {
          const top = toppingOptions.find(t => t.id === tid.replace(/-\d+$/, '')) || toppingOptions[i % toppingOptions.length];
          const angle = (i / 6) * 360;
          const r = 22 + (i % 2) * 10;
          const x = 50 + r * Math.cos((angle * Math.PI) / 180);
          const y = 30 + r * Math.sin((angle * Math.PI) / 180);
          return (
            <motion.div
              key={tid}
              className="absolute text-lg pointer-events-none"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
              initial={{ scale: 0, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: i * 0.06 }}
            >
              {top.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Sauce drizzle */}
      <AnimatePresence>
        {stage >= 3 && sauce && (
          <motion.div
            className="absolute"
            style={{ top: '28%', left: '50%', transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex gap-1.5 justify-center mb-1">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-b-full"
                  style={{ height: 16 + i % 2 * 8, background: sauce.color }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                />
              ))}
            </div>
            <div className="w-20 h-2.5 rounded-full" style={{ background: sauce.light }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scoop */}
      <AnimatePresence>
        {stage >= 1 && scoop && (
          <motion.div
            className="absolute rounded-full shadow-[0_8px_0_rgba(0,0,0,0.12)] flex items-center justify-center"
            style={{
              width: 80, height: 80,
              bottom: '38%',
              left: '50%', transform: 'translateX(-50%)',
              background: scoop.bg,
              border: `4px solid ${scoop.border}`,
            }}
            initial={{ y: -60, scale: 0, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
          >
            {/* Shine */}
            <div className="absolute top-3 left-4 w-4 h-4 rounded-full opacity-40" style={{ background: 'white' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bowl */}
      <AnimatePresence>
        {stage >= 0 && (
          <motion.div
            className="relative flex-shrink-0"
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            <svg width={120} height={72} viewBox="0 0 120 72" fill="none">
              {/* Bowl body */}
              <path d="M10 24C10 24 16 60 60 60C104 60 110 24 110 24" fill={bowl?.fillColor ?? '#FCE7F3'} stroke={bowl?.borderColor ?? '#EC4899'} strokeWidth="5" strokeLinecap="round" />
              {/* Bowl rim ellipse */}
              <ellipse cx="60" cy="24" rx="50" ry="10" fill={bowl?.fillColor ?? '#FCE7F3'} stroke={bowl?.borderColor ?? '#EC4899'} strokeWidth="5" />
              {/* Foot */}
              <ellipse cx="60" cy="62" rx="16" ry="4" fill={bowl?.borderColor ?? '#EC4899'} opacity="0.5" />
            </svg>

            {/* Empty hint inside bowl */}
            {stage === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pt-2">
                <motion.span
                  className="text-3xl opacity-20"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  🍨
                </motion.span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ground shadow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-3 bg-pink-100 rounded-full blur-sm" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IceCreamSundae({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: IceCreamSundaeProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? { bowl: '', scoop: '', sauce: '', toppings: [] }
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

  const totalStages = allowAnonymous ? 6 : 7;

  const reportProgress = useCallback(() => {
    if (!onProgress || currentStage === 0 || currentStage >= 5) return;
    const answers: Answer[] = questions.map(q => ({ questionId: q.id, value: answerMap[q.id]?.answerValue || '' }));
    onProgress({
      currentStage, totalStages, answers,
      adventureState: { currentStage, selectedChoices, answerMap, formData },
      respondentName: allowAnonymous ? undefined : (formData.name || undefined),
      respondentEmail: allowAnonymous ? undefined : (formData.email || undefined),
    });
  }, [onProgress, currentStage, questions, answerMap, selectedChoices, formData, allowAnonymous, totalStages]);

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

  const mappedBowlOptions    = mapQuestionToVisualOptions(questions[0], bowlOptions);
  const mappedScoopOptions   = mapQuestionToVisualOptions(questions[1], scoopOptions);
  const mappedSauceOptions   = mapQuestionToVisualOptions(questions[2], sauceOptions);
  const mappedToppingOptions = mapQuestionToVisualOptions(questions[3], toppingOptions);

  const handleBowlSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(p => ({ ...p, bowl: uniqueId }));
    if (questions[0]) setAnswerMap(p => ({ ...p, [questions[0].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(1));
  };

  const handleScoopSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(p => ({ ...p, scoop: uniqueId }));
    if (questions[1]) setAnswerMap(p => ({ ...p, [questions[1].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(allowAnonymous ? 3 : 2));
  };

  const handleFormSubmit = () => setCurrentStage(3);

  const handleSauceSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(p => ({ ...p, sauce: uniqueId }));
    if (questions[2]) setAnswerMap(p => ({ ...p, [questions[2].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(4));
  };

  const toppingsAllowMultiple = questions[3] && 'allowMultiple' in questions[3]
    ? (questions[3] as { allowMultiple?: boolean }).allowMultiple ?? true : true;

  const handleToppingToggle = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(p => {
      const newT = toppingsAllowMultiple
        ? (p.toppings.includes(uniqueId) ? p.toppings.filter(t => t !== uniqueId) : [...p.toppings, uniqueId])
        : (p.toppings.includes(uniqueId) ? [] : [uniqueId]);
      if (!p.toppings.includes(uniqueId)) addXp();
      return { ...p, toppings: newT };
    });
    if (questions[3]) {
      setAnswerMap(p => {
        const cur = p[questions[3].id];
        const curIds  = (cur?.visualId    as string[]) || [];
        const curVals = (cur?.answerValue as string[]) || [];
        if (toppingsAllowMultiple) {
          const i = curIds.indexOf(uniqueId);
          return { ...p, [questions[3].id]: {
            visualId:    i > -1 ? curIds.filter((_,j) => j !== i)  : [...curIds, uniqueId],
            answerValue: i > -1 ? curVals.filter((_,j) => j !== i) : [...curVals, answerValue],
          }};
        }
        const isSel = curIds.includes(uniqueId);
        return { ...p, [questions[3].id]: { visualId: isSel ? [] : [uniqueId], answerValue: isSel ? [] : [answerValue] } };
      });
    }
  };

  const handleComplete = () => {
    setCurrentStage(6);
    setShowConfetti(true);
    const answers: Answer[] = questions.map(q => ({ questionId: q.id, value: answerMap[q.id]?.answerValue || '' }));
    if (!allowAnonymous) {
      answers.push({ questionId: 'respondent_name', value: formData.name });
      answers.push({ questionId: 'respondent_email', value: formData.email });
    }
    answers.push({ questionId: 'additional_thoughts', value: additionalThoughts });
    onComplete(answers);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleBack = () => {
    if (currentStage > 0) setCurrentStage(allowAnonymous && currentStage === 3 ? 1 : currentStage - 1);
  };

  const progressPct = Math.round((currentStage / (totalStages - 1)) * 100);
  const showTopBar  = currentStage > 0 && currentStage < 6;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #fff0f6 0%, #fffbfd 100%)' }}>
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
              className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-pink-100 bg-white shadow-[0_3px_0_#fce7f3] flex items-center justify-center text-graphite disabled:opacity-20 active:translate-y-[2px] active:shadow-none transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 h-4 bg-white rounded-full overflow-hidden border-2 border-pink-100 shadow-inner">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </div>

            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border-2 border-pink-200 rounded-2xl">
              <span className="text-xs">🍨</span>
              <span className="font-fredoka font-bold text-sm text-almost-black"><motion.span key={xp} initial={{ scale: 1.4, color: '#ec4899' }} animate={{ scale: 1, color: '#1a1a1a' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP</span>
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
                  className="text-xs font-black text-pink-500 uppercase tracking-widest"
                >
                  {comboText}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Sundae scene ── */}
      {currentStage < 6 && (
        <div className="flex justify-center pt-2 pb-2">
          <SundaeScene selectedChoices={selectedChoices} stage={currentStage} />
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
              <IceCreamWrapper emoji="🥣" label="Stage 1 · Bowl">
                <StageQuestion question={questions[0]} fallback="Pick your bowl!" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedBowlOptions.map((opt, i) => {
                    const v = bowlOptions.find(b => opt.uniqueId.startsWith(b.id)) || bowlOptions[0];
                    return (
                      <BowlCard
                        key={opt.uniqueId}
                        visual={v}
                        name={opt.answerValue}
                        index={i}
                        isPicked={pickedId === opt.uniqueId}
                        onClick={() => handleBowlSelect(opt.uniqueId, opt.answerValue)}
                      />
                    );
                  })}
                </div>
              </IceCreamWrapper>
            )}

            {currentStage === 1 && (
              <IceCreamWrapper emoji="🍨" label="Stage 2 · Scoop">
                <StageQuestion question={questions[1]} fallback="Pick your flavour!" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedScoopOptions.map((opt, i) => {
                    const v = scoopOptions.find(s => opt.uniqueId.startsWith(s.id)) || scoopOptions[0];
                    return (
                      <ScoopCard
                        key={opt.uniqueId}
                        visual={v}
                        name={opt.answerValue}
                        index={i}
                        isPicked={pickedId === opt.uniqueId}
                        onClick={() => handleScoopSelect(opt.uniqueId, opt.answerValue)}
                      />
                    );
                  })}
                </div>
              </IceCreamWrapper>
            )}

            {currentStage === 2 && !allowAnonymous && (
              <FormCapture formData={formData} setFormData={setFormData} onSubmit={handleFormSubmit} />
            )}

            {currentStage === 3 && (
              <IceCreamWrapper emoji="🍫" label="Stage 3 · Sauce">
                <StageQuestion question={questions[2]} fallback="Drizzle your sauce!" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedSauceOptions.map((opt, i) => {
                    const v = sauceOptions.find(s => opt.uniqueId.startsWith(s.id)) || sauceOptions[0];
                    return (
                      <SauceCard
                        key={opt.uniqueId}
                        visual={v}
                        name={opt.answerValue}
                        index={i}
                        isPicked={pickedId === opt.uniqueId}
                        onClick={() => handleSauceSelect(opt.uniqueId, opt.answerValue)}
                      />
                    );
                  })}
                </div>
              </IceCreamWrapper>
            )}

            {currentStage === 4 && (
              <ToppingsStage
                question={questions[3]}
                options={mappedToppingOptions}
                selectedToppings={selectedChoices.toppings}
                allowMultiple={toppingsAllowMultiple}
                onToggle={handleToppingToggle}
                onDone={() => { addXp(); setCurrentStage(5); }}
              />
            )}

            {currentStage === 5 && (
              <FinalThoughts
                value={additionalThoughts}
                onChange={setAdditionalThoughts}
                onContinue={handleComplete}
                onBack={handleBack}
                theme="ice-cream"
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
            className="font-fredoka text-sm font-bold text-silver hover:text-pink-400 transition-colors">
            Unboring<span className="text-pink-400">.</span>
          </a>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IceCreamWrapper({ emoji, label, children }: { emoji: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-pink-100 rounded-2xl shadow-[0_2px_0_#fce7f3]"
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

function BowlCard({ visual, name, index, isPicked, onClick }: {
  visual: typeof bowlOptions[0]; name: string; index: number; isPicked: boolean; onClick: () => void;
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
          ? 'shadow-[0_4px_0_#ec4899]'
          : 'border-pink-100 bg-white shadow-[0_4px_0_#fce7f3] hover:border-pink-300 active:translate-y-[3px] active:shadow-none'
      }`}
      style={isPicked ? { borderColor: visual.borderColor, background: visual.fillColor } : {}}
    >
      <div className="flex flex-col gap-2">
        {/* Bowl SVG preview */}
        <motion.div
          animate={isPicked ? { rotate: [0, -10, 10, -5, 0], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <svg width={52} height={32} viewBox="0 0 52 32" fill="none">
            <path d="M4 10C4 10 7 28 26 28C45 28 48 10 48 10" fill={visual.fillColor} stroke={visual.borderColor} strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="26" cy="10" rx="22" ry="5" fill={visual.fillColor} stroke={visual.borderColor} strokeWidth="3" />
            <ellipse cx="26" cy="29" rx="7" ry="2" fill={visual.borderColor} opacity="0.4" />
          </svg>
        </motion.div>
        <div>
          <div className="font-fredoka font-bold text-almost-black text-base leading-tight">{name}</div>
          <div className="font-bold text-graphite text-xs mt-0.5">{visual.desc}</div>
        </div>
      </div>

      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
            style={{ background: visual.borderColor }}
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

function ScoopCard({ visual, name, index, isPicked, onClick }: {
  visual: typeof scoopOptions[0]; name: string; index: number; isPicked: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative p-4 rounded-3xl border-2 text-left transition-all overflow-hidden ${
        isPicked ? 'shadow-[0_4px_0_#ec4899]' : 'border-pink-100 bg-white shadow-[0_4px_0_#fce7f3] hover:border-pink-300 active:translate-y-[3px] active:shadow-none'
      }`}
      style={isPicked ? { borderColor: visual.border, background: visual.bg } : {}}
    >
      <div className="flex flex-col gap-2">
        {/* Scoop ball preview */}
        <motion.div
          className="w-12 h-12 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.1)] flex items-center justify-center relative"
          style={{ background: visual.bg, border: `3px solid ${visual.border}` }}
          animate={isPicked ? { scale: [1, 1.25, 1], rotate: [-5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute top-2 left-3 w-3 h-3 rounded-full opacity-40" style={{ background: 'white' }} />
        </motion.div>
        <div>
          <div className="font-fredoka font-bold text-almost-black text-base leading-tight">{name}</div>
          <div className="font-bold text-graphite text-xs mt-0.5">{visual.desc}</div>
        </div>
      </div>

      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2.5 right-2.5 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center shadow-md"
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

function SauceCard({ visual, name, index, isPicked, onClick }: {
  visual: typeof sauceOptions[0]; name: string; index: number; isPicked: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative p-4 rounded-3xl border-2 text-left transition-all overflow-hidden ${
        isPicked ? 'shadow-[0_4px_0_#ec4899]' : 'border-pink-100 bg-white shadow-[0_4px_0_#fce7f3] hover:border-pink-300 active:translate-y-[3px] active:shadow-none'
      }`}
      style={isPicked ? { borderColor: visual.light, background: `${visual.light}18` } : {}}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] opacity-10" style={{ background: visual.color }} />

      <div className="flex flex-col gap-2">
        {/* Drizzle preview */}
        <motion.div
          className="flex items-end gap-0.5"
          animate={isPicked ? { rotate: [-5, 5, -3, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {[10, 16, 12, 8].map((h, i) => (
            <div key={i} className="w-2 rounded-b-full" style={{ height: h, background: visual.color }} />
          ))}
          <div className="w-10 h-2 rounded-full ml-1" style={{ background: visual.light }} />
        </motion.div>
        <div>
          <div className="font-fredoka font-bold text-almost-black text-base leading-tight">{name}</div>
          <div className="font-bold text-graphite text-xs mt-0.5">{visual.desc}</div>
        </div>
      </div>

      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2.5 right-2.5 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center shadow-md"
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

function ToppingsStage({
  question, options, selectedToppings, allowMultiple: _allowMultiple, onToggle, onDone,
}: {
  question?: Question;
  options: Array<typeof toppingOptions[0] & { answerValue: string; uniqueId: string }>;
  selectedToppings: string[];
  allowMultiple: boolean;
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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-pink-100 rounded-2xl shadow-[0_2px_0_#fce7f3]">
          <span>🍒</span>
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
              className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-md"
            >
              <span className="font-fredoka font-bold text-white text-sm">{count}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight">
        {question?.question || 'Pile on the toppings!'}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const visual = toppingOptions.find(t => opt.uniqueId.startsWith(t.id)) || toppingOptions[0];
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
                  ? 'border-pink-400 bg-pink-50 shadow-[0_4px_0_#ec4899]'
                  : 'border-pink-100 bg-white shadow-[0_4px_0_#fce7f3] hover:border-pink-300 active:translate-y-[3px] active:shadow-none'
              }`}
            >
              <div className="flex flex-col gap-2">
                <motion.span
                  className="text-4xl"
                  animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {visual.emoji}
                </motion.span>
                <div>
                  <div className="font-fredoka font-bold text-almost-black text-base leading-tight">{opt.answerValue}</div>
                  <div className="font-bold text-graphite text-xs mt-0.5">{visual.desc}</div>
                </div>
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center shadow-md"
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
        className="w-full py-5 bg-pink-500 text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-3xl border-b-4 border-pink-700 shadow-[0_5px_0_#be185d] transition-all hover:brightness-105 active:translate-y-[4px] active:shadow-none active:border-b-0 flex items-center justify-center gap-2"
      >
        <motion.span
          animate={{ rotate: [0, -15, 15, -8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1 }}
          style={{ display: 'inline-block' }}
        >
          🍒
        </motion.span>
        {count === 0 ? 'Skip Toppings' : `Add the Cherry on Top!`}
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
          🍨
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Before the good stuff…</h2>
        <p className="text-graphite font-bold text-sm">What should we call you?</p>
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
              className="w-full p-4 rounded-2xl border-2 border-pink-100 bg-white focus:border-pink-400 focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#fce7f3] focus:shadow-[0_3px_0_#ec4899]"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-5 bg-pink-500 text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-3xl border-b-4 border-pink-700 shadow-[0_5px_0_#be185d] transition-all hover:brightness-105 active:translate-y-[4px] active:shadow-none active:border-b-0"
      >
        Keep Building! 🍫
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
        🎉
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-fredoka text-5xl font-bold text-pink-500 mb-2"
      >
        Sundae Complete!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-graphite font-black text-sm uppercase tracking-widest mb-6"
      >
        Your masterpiece is recorded ✓
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        className="inline-flex items-center gap-2 px-6 py-3 bg-pink-50 border-2 border-pink-200 rounded-2xl"
      >
        <span className="text-xl">🍨</span>
        <span className="font-fredoka font-bold text-almost-black text-lg"><motion.span key={xp} initial={{ scale: 1.3, color: '#ec4899' }} animate={{ scale: 1, color: '#1a1a1a' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP Earned!</span>
      </motion.div>
    </motion.div>
  );
}
