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
  allowAnonymous?: boolean;
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

// ─── Animation variants ───────────────────────────────────────────────────────

const stageVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

const bowlVariants = {
  hidden: { scale: 0, y: 20 },
  visible: { scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

const scoopVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 15, delay: 0.1 } },
};

const sauceVariants = {
  hidden: { opacity: 0, y: -20, scaleY: 0 },
  visible: { opacity: 1, y: 0, scaleY: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const toppingVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1, opacity: 1,
    transition: { type: 'spring' as const, stiffness: 500, damping: 15, delay: i * 0.1 },
  }),
};

const cherryVariants = {
  hidden: { y: -50, opacity: 0, rotate: -45 },
  visible: { y: 0, opacity: 1, rotate: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 10 } },
};

const confettiColors = ['#58cc02', '#ffc700', '#1cb0f6', '#ff6b6b', '#a570ff', '#fd79a8', '#4ecdc4', '#ffeaa7'];

// ─── Visual option data ───────────────────────────────────────────────────────

const bowlOptions = [
  { id: 'blue',   name: 'Blue Bowl',   fillColor: '#DBEAFE', borderColor: '#3B82F6', color: 'bg-blue-100 border-blue-400' },
  { id: 'pink',   name: 'Pink Bowl',   fillColor: '#FCE7F3', borderColor: '#EC4899', color: 'bg-pink-100 border-pink-400' },
  { id: 'green',  name: 'Green Bowl',  fillColor: '#D1FAE5', borderColor: '#10B981', color: 'bg-green-100 border-green-400' },
  { id: 'purple', name: 'Purple Bowl', fillColor: '#EDE9FE', borderColor: '#8B5CF6', color: 'bg-purple-100 border-purple-400' },
];

const scoopOptions = [
  { id: 'vanilla',    name: 'Vanilla',    color: 'bg-amber-50',   borderColor: 'border-amber-300' },
  { id: 'chocolate',  name: 'Chocolate',  color: 'bg-amber-800',  borderColor: 'border-amber-900' },
  { id: 'strawberry', name: 'Strawberry', color: 'bg-pink-300',   borderColor: 'border-pink-400' },
];

const sauceOptions = [
  { id: 'chocolate',  name: 'Chocolate', color: 'bg-amber-900' },
  { id: 'caramel',    name: 'Caramel',   color: 'bg-amber-400' },
  { id: 'strawberry', name: 'Strawberry',color: 'bg-pink-400' },
];

const toppingOptions = [
  { id: 'banana',       name: 'Banana',       emoji: '🍌', color: 'bg-yellow-300' },
  { id: 'nuts',         name: 'Nuts',          emoji: '🥜', color: 'bg-amber-600' },
  { id: 'strawberry',   name: 'Strawberry',   emoji: '🍓', color: 'bg-red-400' },
  { id: 'cookie',       name: 'Cookie',        emoji: '🍪', color: 'bg-amber-700' },
  { id: 'cherry',       name: 'Cherry',        emoji: '🍒', color: 'bg-red-600' },
  { id: 'whippedcream', name: 'Whipped Cream', emoji: '🍦', color: 'bg-white border border-gray-200' },
];

// stage emoji breadcrumbs
const STAGE_EMOJIS = ['🥣', '🍨', '🍫', '🍒', '✨'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getQuestionOptions(question: Question | undefined): string[] {
  if (!question) return [];
  if ('options' in question && question.options) return question.options;
  if (question.type === 'rating' && 'scale' in question) {
    const scale = question.scale || 5;
    return Array.from({ length: scale }, (_, i) => {
      const v = i + 1;
      if (v === 1 && question.startLabel) return question.startLabel;
      if (v === scale && question.endLabel) return question.endLabel;
      return String(v);
    });
  }
  return [];
}

function mapQuestionToVisualOptions<T extends { id: string; name: string }>(
  question: Question | undefined,
  visualOptions: T[]
): Array<T & { answerValue: string; id: string }> {
  const opts = getQuestionOptions(question);
  if (opts.length === 0) return [];
  return opts.map((option, index) => {
    const visual = visualOptions[index % visualOptions.length];
    return { ...visual, id: `${visual.id}-${index}`, answerValue: option };
  });
}

// ─── SVG Bowl ─────────────────────────────────────────────────────────────────

function BowlIcon({ fillColor, borderColor, size = 48 }: { fillColor: string; borderColor: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M6 18C6 18 8 34 24 34C40 34 42 18 42 18" fill={fillColor} stroke={borderColor} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="24" cy="18" rx="18" ry="4" fill={fillColor} stroke={borderColor} strokeWidth="3" />
      <ellipse cx="24" cy="36" rx="6" ry="2" fill={borderColor} />
    </svg>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (isActive) {
      setParticles(Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.6,
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
          animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800, rotate: 360 * (Math.random() > 0.5 ? 1 : -1), opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ─── Micro-feedback flash ─────────────────────────────────────────────────────

function PickedBadge({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.9 }}
      className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-duo-green text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-[0_2px_0_#46a302] z-10 pointer-events-none"
    >
      ✓ {label}
    </motion.div>
  );
}

// ─── Sundae live preview ──────────────────────────────────────────────────────

function SundaeDisplay({ currentStage, selectedChoices }: { currentStage: number; selectedChoices: SelectedChoices }) {
  const bowl = bowlOptions.find(b => b.id === selectedChoices.bowl);
  const scoop = scoopOptions.find(s => s.id === selectedChoices.scoop);
  const sauce = sauceOptions.find(s => s.id === selectedChoices.sauce);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview label */}
      <span className="text-[9px] font-black uppercase tracking-widest text-graphite">Your Sundae</span>

      <div className="relative w-36 h-52">
        {/* Ground shadow */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 mx-auto w-28 h-3 bg-cloud-gray rounded-full"
          animate={{ opacity: currentStage >= 1 ? 0.6 : 0.2, scaleX: currentStage >= 1 ? 1 : 0.4 }}
          transition={{ duration: 0.4 }}
        />

        {/* Bowl */}
        <AnimatePresence>
          {currentStage >= 1 && (
            <motion.div className="absolute bottom-2 left-0 right-0 mx-auto w-fit" variants={bowlVariants} initial="hidden" animate="visible">
              <div className={`w-24 h-14 ${bowl?.color || 'bg-amber-200 border-amber-400'} border-4 rounded-b-full rounded-t-lg shadow-[0_4px_0_rgba(0,0,0,0.1)]`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scoop */}
        <AnimatePresence>
          {currentStage >= 2 && (
            <motion.div className="absolute bottom-12 left-0 right-0 mx-auto w-fit" variants={scoopVariants} initial="hidden" animate="visible">
              <div className={`w-16 h-16 ${scoop?.color || 'bg-amber-50'} ${scoop?.borderColor || 'border-amber-200'} border-4 rounded-full shadow-lg`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sauce drizzle */}
        <AnimatePresence>
          {currentStage >= 4 && (
            <motion.div className="absolute bottom-24 left-0 right-0 mx-auto w-fit origin-top" variants={sauceVariants} initial="hidden" animate="visible">
              <div className={`w-14 h-3 ${sauce?.color || 'bg-amber-400'} rounded-full`} />
              <div className="flex justify-between px-1 -mt-1">
                {[0.2, 0.3, 0.25].map((delay, i) => (
                  <motion.div key={i} className={`w-2 ${i === 1 ? 'h-6' : 'h-4'} ${sauce?.color || 'bg-amber-400'} rounded-b-full`}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay, duration: 0.3 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toppings */}
        <AnimatePresence>
          {currentStage >= 5 && selectedChoices.toppings.length > 0 && (
            <div className="absolute bottom-28 left-0 right-0 mx-auto w-fit">
              <div className="flex flex-wrap justify-center gap-1 w-20">
                {selectedChoices.toppings.map((t, i) => {
                  const top = toppingOptions.find(o => o.id === t);
                  return (
                    <motion.div key={t} className={`w-4 h-4 ${top?.color || 'bg-gray-400'} rounded-full shadow-sm`}
                      variants={toppingVariants} initial="hidden" animate="visible" custom={i} title={top?.name} />
                  );
                })}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Cherry */}
        <AnimatePresence>
          {currentStage >= 6 && (
            <motion.div className="absolute bottom-36 left-0 right-0 mx-auto w-fit" variants={cherryVariants} initial="hidden" animate="visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-4 bg-green-600 rounded-full" />
              <div className="w-5 h-5 bg-red-500 rounded-full shadow-md border-2 border-red-600 relative">
                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-60" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        <AnimatePresence>
          {currentStage === 0 && (
            <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] font-black text-silver uppercase tracking-wider text-center leading-relaxed">Your<br/>sundae<br/>appears here!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stage emoji trail */}
      <div className="flex items-center gap-1.5">
        {STAGE_EMOJIS.map((emoji, i) => {
          const active = i < currentStage;
          return (
            <motion.span
              key={i}
              animate={{ scale: active ? 1 : 0.7, opacity: active ? 1 : 0.3 }}
              className="text-base"
            >{emoji}</motion.span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared stage card shell ──────────────────────────────────────────────────

function StageCard({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
}

// ─── Stage 0: Bowl Selection ──────────────────────────────────────────────────

function BowlSelection({ question, options, onSelect }: {
  question?: Question;
  options: Array<typeof bowlOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
}) {
  const [justPicked, setJustPicked] = useState<string | null>(null);

  const handlePick = (id: string, answer: string) => {
    setJustPicked(answer);
    setTimeout(() => onSelect(id, answer), 600);
  };

  return (
    <StageCard>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black mb-6 leading-tight">
        {question?.question || '🥣 Choose your bowl!'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => handlePick(option.id, option.answerValue)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="relative group p-5 rounded-3xl border-2 border-cloud-gray bg-white shadow-[0_4px_0_#e5e5e5] transition-all active:translate-y-[3px] active:shadow-none hover:border-duo-green/50 hover:shadow-[0_4px_0_#d7ffb8] flex flex-col items-center gap-2"
          >
            <AnimatePresence>
              {justPicked === option.answerValue && <PickedBadge label="Picked!" />}
            </AnimatePresence>
            <motion.div whileTap={{ scale: 0.9, rotate: -5 }}>
              <BowlIcon fillColor={option.fillColor} borderColor={option.borderColor} size={52} />
            </motion.div>
            <span className="text-xs font-black text-almost-black text-center leading-tight">{option.answerValue}</span>
          </motion.button>
        ))}
      </div>
    </StageCard>
  );
}

// ─── Stage 1: Scoop Selection ─────────────────────────────────────────────────

function BaseScoops({ question, options, onSelect, onBack }: {
  question?: Question;
  options: Array<typeof scoopOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
  onBack?: () => void;
}) {
  const [justPicked, setJustPicked] = useState<string | null>(null);

  const handlePick = (id: string, answer: string) => {
    setJustPicked(answer);
    setTimeout(() => onSelect(id, answer), 600);
  };

  return (
    <StageCard>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black mb-6 leading-tight">
        {question?.question || '🍨 Pick your scoop!'}
      </h2>
      <div className="flex justify-center gap-4 flex-wrap">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => handlePick(option.id, option.answerValue)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
            className="relative group flex flex-col items-center gap-2"
          >
            <AnimatePresence>
              {justPicked === option.answerValue && <PickedBadge label="Picked!" />}
            </AnimatePresence>
            <motion.div
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.08, y: -4 }}
              className={`w-24 h-24 ${option.color} ${option.borderColor} border-4 rounded-full shadow-[0_6px_0_rgba(0,0,0,0.12)] flex items-center justify-center`}
            >
              <span
                className="text-xs font-black text-center px-2 leading-tight drop-shadow-sm"
                style={{ color: option.id === 'chocolate' ? 'white' : '#3c3c3c' }}
              >
                {option.answerValue}
              </span>
            </motion.div>
          </motion.button>
        ))}
      </div>
    </StageCard>
  );
}

// ─── Stage 2: Form Capture ────────────────────────────────────────────────────

function InlineFormError({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1"
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </motion.p>
  );
}

function FormCapture({ formData, setFormData, onSubmit, onBack }: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
}) {
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});

  const validateName = (v: string) => !v.trim() ? 'Name is required' : v.trim().length < 2 ? 'At least 2 characters' : undefined;
  const validateEmail = (v: string) => !v ? undefined : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Invalid email address' : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(formData.name);
    const emailErr = validateEmail(formData.email);
    setErrors({ name: nameErr, email: emailErr });
    setTouched({ name: true, email: true });
    if (!nameErr && !emailErr) onSubmit(e);
  };

  return (
    <StageCard>
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="text-5xl mb-3"
        >🍨</motion.div>
        <h2 className="font-fredoka text-2xl font-bold text-almost-black">Before the good stuff…</h2>
        <p className="text-graphite text-sm font-medium mt-1">What should we call you?</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); if (touched.name) setErrors(p => ({ ...p, name: validateName(e.target.value) })); }}
            onBlur={() => { setTouched(p => ({ ...p, name: true })); setErrors(p => ({ ...p, name: validateName(formData.name) })); }}
            placeholder="Your name"
            className={`w-full p-4 rounded-2xl border-2 focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm ${
              errors.name && touched.name
                ? 'border-red-400 bg-red-50 shadow-[0_3px_0_#fca5a5]'
                : 'border-cloud-gray shadow-[0_3px_0_#e5e5e5] focus:border-duo-green focus:shadow-[0_3px_0_#46a302]'
            }`}
          />
          <AnimatePresence>{errors.name && touched.name && <InlineFormError message={errors.name} />}</AnimatePresence>
        </div>
        <div>
          <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
            Email <span className="text-silver">(optional)</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={e => { setFormData(p => ({ ...p, email: e.target.value })); if (touched.email) setErrors(p => ({ ...p, email: validateEmail(e.target.value) })); }}
            onBlur={() => { setTouched(p => ({ ...p, email: true })); setErrors(p => ({ ...p, email: validateEmail(formData.email) })); }}
            placeholder="your@email.com"
            className={`w-full p-4 rounded-2xl border-2 focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm ${
              errors.email && touched.email
                ? 'border-red-400 bg-red-50 shadow-[0_3px_0_#fca5a5]'
                : 'border-cloud-gray shadow-[0_3px_0_#e5e5e5] focus:border-duo-green focus:shadow-[0_3px_0_#46a302]'
            }`}
          />
          <AnimatePresence>{errors.email && touched.email && <InlineFormError message={errors.email} />}</AnimatePresence>
        </div>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0"
        >
          Keep Building! 🍫
        </motion.button>
      </form>
    </StageCard>
  );
}

// ─── Stage 3: Sauce Selection ─────────────────────────────────────────────────

function SauceSelection({ question, options, onSelect, onBack }: {
  question?: Question;
  options: Array<typeof sauceOptions[0] & { answerValue: string }>;
  onSelect: (visualId: string, answerValue: string) => void;
  onBack?: () => void;
}) {
  const [justPicked, setJustPicked] = useState<string | null>(null);

  const handlePick = (id: string, answer: string) => {
    setJustPicked(answer);
    setTimeout(() => onSelect(id, answer), 600);
  };

  return (
    <StageCard>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black mb-6 leading-tight">
        {question?.question || '🍫 Drizzle some sauce!'}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => handlePick(option.id, option.answerValue)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="relative group p-4 rounded-3xl border-2 border-cloud-gray bg-white shadow-[0_4px_0_#e5e5e5] transition-all active:translate-y-[3px] active:shadow-none hover:border-duo-green/40 hover:shadow-[0_4px_0_#d7ffb8] flex flex-col items-center gap-3"
          >
            <AnimatePresence>
              {justPicked === option.answerValue && <PickedBadge label="Drizzled!" />}
            </AnimatePresence>
            {/* Drizzle visual */}
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-16 mx-auto rounded-b-full ${option.color}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.15 + index * 0.1, duration: 0.35 }}
                style={{ originY: 0 }}
              />
              <div className={`w-10 h-2 ${option.color} rounded-full -mt-1`} />
            </div>
            <span className="text-xs font-black text-almost-black text-center leading-tight">{option.answerValue}</span>
          </motion.button>
        ))}
      </div>
    </StageCard>
  );
}

// ─── Stage 4: Toppings Selection ──────────────────────────────────────────────

function ToppingsSelection({ question, options, selectedToppings, onToggle, onComplete, onBack, allowMultiple = true }: {
  question?: Question;
  options: Array<typeof toppingOptions[0] & { answerValue: string }>;
  selectedToppings: string[];
  onToggle: (visualId: string, answerValue: string) => void;
  onComplete: () => void;
  onBack?: () => void;
  allowMultiple?: boolean;
}) {
  return (
    <StageCard>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight">
          {question?.question || '🍒 Add your toppings!'}
        </h2>
        {allowMultiple && selectedToppings.length > 0 && (
          <motion.span
            key={selectedToppings.length}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0 mt-1 px-2.5 py-1 bg-duo-green text-white text-[10px] font-black rounded-full shadow-[0_2px_0_#46a302]"
          >
            {selectedToppings.length} picked
          </motion.span>
        )}
      </div>
      <p className="text-[10px] font-black text-graphite uppercase tracking-widest mb-5">
        {allowMultiple ? 'Select all that apply' : 'Pick one'}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((option, index) => {
          const selected = selectedToppings.includes(option.id);
          return (
            <motion.button
              key={option.id}
              onClick={() => onToggle(option.id, option.answerValue)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06, type: 'spring' }}
              className={`p-3 rounded-2xl border-2 transition-all active:translate-y-[2px] flex items-center gap-3 ${
                selected
                  ? 'border-duo-green bg-duo-green/10 shadow-[0_3px_0_#46a302]'
                  : 'border-cloud-gray bg-white shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              {/* Checkbox */}
              <motion.div
                animate={{ scale: selected ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.2 }}
                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selected ? 'bg-duo-green border-duo-green' : 'border-cloud-gray'
                }`}
              >
                {selected && (
                  <motion.svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </motion.div>
              <span className="text-xl">{option.emoji}</span>
              <span className="text-xs font-black text-almost-black leading-tight">{option.answerValue}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onComplete}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0 flex items-center justify-center gap-2"
      >
        <motion.span animate={{ rotate: [0, -15, 15, -15, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}>🍒</motion.span>
        Add the cherry on top!
      </motion.button>
    </StageCard>
  );
}

// ─── Stage 6: Completion ──────────────────────────────────────────────────────

function CompletionStage({ name }: { name: string }) {
  void name;
  return (
    <motion.div
      className="text-center py-4"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{ scale: [1, 1.25, 1], rotate: [0, -12, 12, -12, 0] }}
        transition={{ duration: 0.7, repeat: 2, repeatDelay: 0.4 }}
      >
        🎉
      </motion.div>
      <h2 className="font-fredoka text-3xl font-bold text-duo-green mb-2">Sundae Complete!</h2>
      <p className="text-graphite text-sm font-bold uppercase tracking-widest">Your masterpiece has been recorded ✓</p>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IceCreamSundae({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: IceCreamSundaeProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? { bowl: '', scoop: '', sauce: '', toppings: [] }
  );
  const [answerMap, setAnswerMap] = useState<AnswerMap>(initialState?.answerMap ?? {});
  const [formData, setFormData] = useState<FormData>(initialState?.formData ?? { name: '', email: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [additionalThoughts, setAdditionalThoughts] = useState('');

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

  const mappedBowlOptions    = mapQuestionToVisualOptions(questions[0], bowlOptions);
  const mappedScoopOptions   = mapQuestionToVisualOptions(questions[1], scoopOptions);
  const mappedSauceOptions   = mapQuestionToVisualOptions(questions[2], sauceOptions);
  const mappedToppingOptions = mapQuestionToVisualOptions(questions[3], toppingOptions);

  const handleBowlSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(p => ({ ...p, bowl: visualId }));
    if (questions[0]) setAnswerMap(p => ({ ...p, [questions[0].id]: { visualId, answerValue } }));
    setCurrentStage(1);
  };

  const handleScoopSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(p => ({ ...p, scoop: visualId }));
    if (questions[1]) setAnswerMap(p => ({ ...p, [questions[1].id]: { visualId, answerValue } }));
    setCurrentStage(allowAnonymous ? 3 : 2);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) setCurrentStage(3);
  };

  const handleSauceSelect = (visualId: string, answerValue: string) => {
    setSelectedChoices(p => ({ ...p, sauce: visualId }));
    if (questions[2]) setAnswerMap(p => ({ ...p, [questions[2].id]: { visualId, answerValue } }));
    setCurrentStage(4);
  };

  const toppingsAllowMultiple = questions[3] && 'allowMultiple' in questions[3]
    ? (questions[3] as { allowMultiple?: boolean }).allowMultiple ?? true : true;

  const handleToppingToggle = (visualId: string, answerValue: string) => {
    setSelectedChoices(p => {
      if (toppingsAllowMultiple) {
        const newT = p.toppings.includes(visualId) ? p.toppings.filter(t => t !== visualId) : [...p.toppings, visualId];
        return { ...p, toppings: newT };
      }
      return { ...p, toppings: p.toppings.includes(visualId) ? [] : [visualId] };
    });
    if (questions[3]) {
      setAnswerMap(p => {
        const cur = p[questions[3].id];
        const curIds = (cur?.visualId as string[]) || [];
        const curVals = (cur?.answerValue as string[]) || [];
        if (toppingsAllowMultiple) {
          const i = curIds.indexOf(visualId);
          return { ...p, [questions[3].id]: { visualId: i > -1 ? curIds.filter((_, j) => j !== i) : [...curIds, visualId], answerValue: i > -1 ? curVals.filter((_, j) => j !== i) : [...curVals, answerValue] } };
        }
        const isSelected = curIds.includes(visualId);
        return { ...p, [questions[3].id]: { visualId: isSelected ? [] : [visualId], answerValue: isSelected ? [] : [answerValue] } };
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
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleBack = () => {
    if (currentStage > 0) {
      setCurrentStage(allowAnonymous && currentStage === 3 ? 1 : currentStage - 1);
    }
  };

  // Progress: map stage → logical step (0-based, max = totalStages-1)
  const progressPct = Math.round((currentStage / (totalStages - 1)) * 100);
  const showProgress = currentStage > 0 && currentStage < 6;

  const renderStage = () => {
    switch (currentStage) {
      case 0: return <BowlSelection question={questions[0]} options={mappedBowlOptions} onSelect={handleBowlSelect} />;
      case 1: return <BaseScoops question={questions[1]} options={mappedScoopOptions} onSelect={handleScoopSelect} onBack={handleBack} />;
      case 2: return <FormCapture formData={formData} setFormData={setFormData} onSubmit={handleFormSubmit} onBack={handleBack} />;
      case 3: return <SauceSelection question={questions[2]} options={mappedSauceOptions} onSelect={handleSauceSelect} onBack={handleBack} />;
      case 4: return <ToppingsSelection question={questions[3]} options={mappedToppingOptions} selectedToppings={selectedChoices.toppings} onToggle={handleToppingToggle} onComplete={() => setCurrentStage(5)} onBack={handleBack} allowMultiple={toppingsAllowMultiple} />;
      case 5: return <FinalThoughts value={additionalThoughts} onChange={setAdditionalThoughts} onContinue={handleComplete} onBack={handleBack} theme="ice-cream" respondentName={formData.name} />;
      case 6: return <CompletionStage name={formData.name} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Confetti isActive={showConfetti} />

      {/* ── Top bar ── */}
      <div className="w-full px-4 pt-6 pb-2 max-w-4xl mx-auto">
        {/* Brand */}
        <div className="text-center mb-4">
          <span className="font-fredoka text-xl font-bold text-almost-black">
            Unboring<span className="text-duo-green">.</span>
          </span>
        </div>

        {/* Duolingo progress bar */}
        {showProgress && (
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleBack}
              className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-cloud-gray shadow-[0_3px_0_#e5e5e5] flex items-center justify-center text-graphite transition-all active:translate-y-[2px] active:shadow-none"
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
              {progressPct}%
            </span>
          </div>
        )}

        {/* Title */}
        {currentStage === 0 && (
          <motion.div className="text-center py-4" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-fredoka text-3xl sm:text-4xl font-bold text-almost-black">
              Build Your Perfect <span className="text-[#ec4899]">Sundae!</span> 🍨
            </h1>
            <p className="text-graphite text-sm font-medium mt-2">Answer each question to unlock the next layer</p>
          </motion.div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-6">
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">

          {/* Sundae preview — top on mobile, left on desktop */}
          {currentStage < 6 && (
            <motion.div
              className="w-full md:w-auto flex-shrink-0 flex justify-center bg-pink-50/60 rounded-3xl border-2 border-pink-100 p-4 md:p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <SundaeDisplay currentStage={currentStage} selectedChoices={selectedChoices} />
            </motion.div>
          )}

          {/* Stage content */}
          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={currentStage} variants={stageVariants} initial="hidden" animate="visible" exit="exit">
                {renderStage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="py-4 text-center">
        <a href="https://unboringsurveys.com" target="_blank" rel="noopener noreferrer"
          className="font-fredoka text-sm font-bold text-silver hover:text-duo-green transition-colors">
          Unboring<span className="text-duo-green">.</span>
        </a>
      </div>
    </div>
  );
}
