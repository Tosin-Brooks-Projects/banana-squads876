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
  finishing: string | string[];
}

interface AnswerMap {
  [questionId: string]: {
    visualId: string | string[];
    answerValue: string | string[];
  };
}

// Visual options
const beanOptions = [
  { id: 'light', name: 'Light Roast', emoji: '☀️', color: 'bg-amber-200' },
  { id: 'medium', name: 'Medium Roast', emoji: '⚡', color: 'bg-amber-500' },
  { id: 'dark', name: 'Dark Roast', emoji: '🌑', color: 'bg-amber-900' },
];

const grindOptions = [
  { id: 'fine', name: 'Fine', emoji: '🔬', dots: 4 },
  { id: 'medium', name: 'Medium', emoji: '⚖️', dots: 2 },
  { id: 'coarse', name: 'Coarse', emoji: '🪨', dots: 1 },
];

const methodOptions = [
  { id: 'drip', name: 'Drip', emoji: '☕' },
  { id: 'frenchpress', name: 'French Press', emoji: '🫖' },
  { id: 'espresso', name: 'Espresso', emoji: '⚡' },
];

const finishingOptions = [
  { id: 'option1', name: 'Option 1', emoji: '🍬' },
  { id: 'option2', name: 'Option 2', emoji: '🥛' },
  { id: 'option3', name: 'Option 3', emoji: '🍯' },
  { id: 'option4', name: 'Option 4', emoji: '✨' },
];

const STAGE_EMOJIS = ['☕', '⚙️', '🫖', '✨'];

const confettiColors = ['#58cc02', '#ffc700', '#1cb0f6', '#a570ff', '#cc348d', '#e67348'];

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
  if (question.type === 'emoji-slider' && 'scale' in question) {
    const scale = question.scale || 5;
    return Array.from({ length: scale }, (_, i) => {
      const v = i + 1;
      if (v === 1 && question.labels?.start) return question.labels.start;
      if (v === scale && question.labels?.end) return question.labels.end;
      return String(v);
    });
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

function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; duration: number }>>([]);
  useEffect(() => {
    if (isActive) {
      setParticles(Array.from({ length: 50 }, (_, i) => ({
        id: i, x: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.5, duration: 2 + Math.random() * 2,
      })));
    }
  }, [isActive]);
  if (!isActive) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute w-3 h-3 rounded-sm"
          style={{ left: `${p.x}%`, top: -20, backgroundColor: p.color }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800, rotate: 360, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// Coffee cup display
function CoffeeDisplay({ selectedChoices, stage }: { selectedChoices: SelectedChoices; stage: number }) {
  const bean = beanOptions.find(b => selectedChoices.beans.startsWith(b.id));
  const method = methodOptions.find(m => selectedChoices.method.startsWith(m.id));

  const cupColor = bean ? (bean.id === 'light' ? 'bg-amber-200' : bean.id === 'medium' ? 'bg-amber-500' : 'bg-amber-900') : 'bg-cloud-gray';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Cup */}
      <div className="relative">
        {/* Steam */}
        {stage >= 3 && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 h-4 bg-gray-300 rounded-full"
                animate={{ opacity: [0, 0.7, 0], y: [0, -8] }}
                transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
              />
            ))}
          </div>
        )}
        {/* Cup body */}
        <div className="relative w-20 h-20">
          {/* Cup shape */}
          <div className={`absolute inset-0 rounded-b-[2rem] rounded-t-xl border-4 border-cloud-gray shadow-[0_4px_0_rgba(0,0,0,0.08)] ${stage >= 1 ? cupColor : 'bg-cloud-gray/40'} transition-colors duration-500`} />
          {/* Handle */}
          <div className="absolute right-0 top-4 w-4 h-6 border-4 border-cloud-gray rounded-r-full border-l-0" />
          {/* Method emoji overlay */}
          {method && stage >= 2 && (
            <motion.div className="absolute inset-0 flex items-center justify-center text-2xl"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {method.emoji}
            </motion.div>
          )}
          {/* Empty hint */}
          {stage === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xl opacity-30">☕</div>
          )}
        </div>
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

  const mappedBeanOptions = mapQuestionToVisualOptions(questions[0], beanOptions);
  const mappedGrindOptions = mapQuestionToVisualOptions(questions[1], grindOptions);
  const mappedMethodOptions = mapQuestionToVisualOptions(questions[2], methodOptions);
  const mappedFinishingOptions = mapQuestionToVisualOptions(questions[3], finishingOptions);

  const pickWithBadge = (uniqueId: string, advance: () => void) => {
    setPickedId(uniqueId);
    setTimeout(() => { setPickedId(null); advance(); }, 600);
  };

  const handleBeansSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, beans: uniqueId }));
    if (questions[0]) setAnswerMap(prev => ({ ...prev, [questions[0].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(1));
  };

  const handleGrindSelect = (uniqueId: string, answerValue: string) => {
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
  const allowMultipleFinishing = finishingQuestion &&
    isMultipleChoiceQuestion(finishingQuestion) &&
    finishingQuestion.allowMultiple === true;

  const handleFinishingSelect = (uniqueId: string, answerValue: string) => {
    if (allowMultipleFinishing) {
      setSelectedChoices(prev => {
        const cur = Array.isArray(prev.finishing) ? prev.finishing : (prev.finishing ? [prev.finishing] : []);
        const isSelected = cur.includes(uniqueId);
        return { ...prev, finishing: isSelected ? cur.filter(id => id !== uniqueId) : [...cur, uniqueId] };
      });
      if (questions[3]) {
        setAnswerMap(prev => {
          const entry = prev[questions[3].id];
          const ids = Array.isArray(entry?.visualId) ? entry.visualId : (entry?.visualId ? [entry.visualId] : []);
          const vals = Array.isArray(entry?.answerValue) ? entry.answerValue : (entry?.answerValue ? [entry.answerValue] : []);
          const isSelected = ids.includes(uniqueId);
          return { ...prev, [questions[3].id]: {
            visualId: isSelected ? ids.filter(id => id !== uniqueId) : [...ids, uniqueId],
            answerValue: isSelected ? vals.filter(v => v !== answerValue) : [...vals, answerValue],
          }};
        });
      }
    } else {
      setSelectedChoices(prev => ({ ...prev, finishing: uniqueId }));
      if (questions[3]) setAnswerMap(prev => ({ ...prev, [questions[3].id]: { visualId: uniqueId, answerValue } }));
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
    setTimeout(() => setShowConfetti(false), 4000);
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
              <motion.div className="h-full bg-duo-green rounded-full"
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }} />
            </div>
            <span className="flex-shrink-0 text-[10px] font-black text-graphite uppercase tracking-wider">
              {Math.min(currentStage, totalDisplayStages)}/{totalDisplayStages}
            </span>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col px-4 max-w-lg mx-auto w-full pb-8">
        {currentStage < 6 && (
          <div className="py-6 flex justify-center">
            <CoffeeDisplay selectedChoices={selectedChoices} stage={currentStage} />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
          >
            {currentStage === 0 && (
              <OptionStage
                stageLabel="☕ Beans First"
                question={questions[0]}
                fallback="Pick your beans"
                options={mappedBeanOptions.map(o => ({ ...o, emoji: beanOptions.find(b => o.uniqueId.startsWith(b.id))?.emoji || '☕' }))}
                onSelect={handleBeansSelect}
                pickedId={pickedId}
                cols={3}
              />
            )}
            {currentStage === 1 && (
              <OptionStage
                stageLabel="⚙️ Grind Size"
                question={questions[1]}
                fallback="Choose your grind"
                options={mappedGrindOptions.map(o => ({ ...o, emoji: grindOptions.find(g => o.uniqueId.startsWith(g.id))?.emoji || '⚙️' }))}
                onSelect={handleGrindSelect}
                pickedId={pickedId}
                cols={3}
              />
            )}
            {currentStage === 2 && (
              <OptionStage
                stageLabel="🫖 Brew Method"
                question={questions[2]}
                fallback="How do you brew?"
                options={mappedMethodOptions.map(o => ({ ...o, emoji: methodOptions.find(m => o.uniqueId.startsWith(m.id))?.emoji || '☕' }))}
                onSelect={handleMethodSelect}
                pickedId={pickedId}
                cols={3}
              />
            )}
            {currentStage === 3 && !allowAnonymous && (
              <FormCapture formData={formData} setFormData={setFormData} onSubmit={() => setCurrentStage(4)} />
            )}
            {currentStage === 4 && (
              <FinishingSelection
                question={questions[3]}
                options={mappedFinishingOptions.map(o => ({ ...o, emoji: finishingOptions.find(f => o.uniqueId.startsWith(f.id))?.emoji || '✨' }))}
                selected={finishingSelected}
                allowMultiple={allowMultipleFinishing}
                onSelect={handleFinishingSelect}
                onContinue={() => setCurrentStage(5)}
                pickedId={pickedId}
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
            {currentStage === 6 && <CompletionStage />}
          </motion.div>
        </AnimatePresence>
      </div>

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

// Generic option grid (used for beans, grind, method)
function OptionStage({
  stageLabel, question, fallback, options, onSelect, pickedId, cols,
}: {
  stageLabel: string;
  question?: Question;
  fallback: string;
  options: Array<{ uniqueId: string; answerValue: string; emoji: string }>;
  onSelect: (uniqueId: string, answerValue: string) => void;
  pickedId: string | null;
  cols: number;
}) {
  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          {stageLabel}
        </span>
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
        {question?.question || fallback}
      </h2>
      <div className={`grid grid-cols-${cols} gap-3`}>
        {options.map((option, index) => {
          const isPicked = pickedId === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
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
  formData, setFormData, onSubmit,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="w-20 h-20 bg-duo-green/10 rounded-[1.5rem] border-2 border-duo-green/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">☕</span>
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Almost brewed…</h2>
        <p className="text-graphite text-sm font-medium">Who&apos;s ordering this coffee?</p>
      </div>
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
            Name <span className="text-silver">(optional)</span>
          </label>
          <input type="text" value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Your name"
            className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
            Email <span className="text-silver">(optional)</span>
          </label>
          <input type="email" value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
            className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
          />
        </div>
      </div>
      <button onClick={onSubmit}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0">
        Finishing Touches ✨
      </button>
    </div>
  );
}

// Stage 4: Finishing Selection
function FinishingSelection({
  question, options, selected, allowMultiple, onSelect, onContinue, pickedId,
}: {
  question?: Question;
  options: Array<{ uniqueId: string; answerValue: string; emoji: string }>;
  selected: string[];
  allowMultiple: boolean | undefined;
  onSelect: (uniqueId: string, answerValue: string) => void;
  onContinue: () => void;
  pickedId: string | null;
}) {
  const count = selected.length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          ✨ Finishing
        </span>
        {allowMultiple && count > 0 && (
          <motion.span key={count} initial={{ scale: 0.7 }} animate={{ scale: 1 }}
            className="inline-flex items-center px-2.5 py-1 bg-duo-green text-white text-[10px] font-black uppercase tracking-wider rounded-full">
            {count} picked
          </motion.span>
        )}
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
        {question?.question || 'Any finishing touches?'}
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((option, index) => {
          const isSelected = selected.includes(option.uniqueId);
          const isPicked = !allowMultiple && pickedId === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => {
                if (!allowMultiple) {
                  onSelect(option.uniqueId, option.answerValue);
                } else {
                  onSelect(option.uniqueId, option.answerValue);
                }
              }}
              whileTap={{ scale: 0.97 }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                isSelected || isPicked
                  ? 'bg-duo-green/10 border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'bg-white border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  isSelected || isPicked ? 'border-duo-green bg-duo-green' : 'border-cloud-gray'
                }`}>
                  {(isSelected || isPicked) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-xl">{option.emoji}</span>
                <span className="font-bold text-almost-black text-xs leading-snug">{option.answerValue}</span>
              </div>
              {!allowMultiple && (
                <div className="mt-1.5 h-5 flex justify-center">
                  <PickedBadge show={isPicked} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {allowMultiple && (
        <motion.button
          onClick={onContinue}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0 flex items-center justify-center gap-2"
        >
          <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}>
            ☕
          </motion.span>
          Brew It!
        </motion.button>
      )}
    </div>
  );
}

// Stage 6: Completion
function CompletionStage() {
  return (
    <motion.div className="text-center py-12"
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
      <motion.div className="text-7xl mb-6"
        animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.6, repeat: 2, repeatDelay: 0.5 }}>
        ☕
      </motion.div>
      <h2 className="font-fredoka text-4xl font-bold text-duo-green mb-2">Coffee Ready!</h2>
      <p className="text-graphite font-bold text-sm uppercase tracking-widest">Quest Complete!</p>
    </motion.div>
  );
}
