'use client';

import { useState, useEffect, useCallback } from 'react';
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
  allowAnonymous?: boolean;
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
    visualId: string | string[];
    answerValue: string | string[];
  };
}

// Visual options
const soilOptions = [
  { id: 'rich', name: 'Rich Soil', emoji: '🟫', color: 'bg-amber-900' },
  { id: 'sandy', name: 'Sandy Soil', emoji: '🏜️', color: 'bg-amber-300' },
  { id: 'clay', name: 'Clay Soil', emoji: '🧱', color: 'bg-orange-700' },
];

const seedOptions = [
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻' },
  { id: 'rose', name: 'Rose', emoji: '🌹' },
  { id: 'daisy', name: 'Daisy', emoji: '🌼' },
];

const STAGE_EMOJIS = ['🌱', '💧', '☀️', '🌸'];

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

// Garden visual display
function GardenDisplay({ selectedChoices, stage }: { selectedChoices: SelectedChoices; stage: number }) {
  const seed = seedOptions.find(s => selectedChoices.seed.startsWith(s.id));
  const soilBase = soilOptions.find(s => selectedChoices.soil.startsWith(s.id));

  const plantEmoji = stage >= 5 ? (seed?.emoji || '🌱') : stage >= 3 ? '🌿' : stage >= 2 ? '🌱' : '🫘';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Garden pot */}
      <div className="relative w-24 h-24">
        {/* Sky/soil background */}
        <div className={`absolute inset-0 rounded-2xl overflow-hidden border-2 border-cloud-gray shadow-[0_4px_0_rgba(0,0,0,0.08)] ${soilBase ? soilBase.color : 'bg-amber-100'}`}>
          {/* Plant */}
          {stage >= 1 && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 flex justify-center pb-1"
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <span className="text-3xl">{plantEmoji}</span>
            </motion.div>
          )}
          {/* Water drops */}
          {stage === 2 && selectedChoices.watered && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl opacity-60">💧</span>
            </div>
          )}
          {/* Empty hint */}
          {stage === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-20">🌱</div>
          )}
        </div>
        {/* Sun when sunlight stage */}
        {stage >= 4 && (
          <motion.div
            className="absolute -top-4 -right-2 text-xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ☀️
          </motion.div>
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

export default function GardenGrower({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: GardenGrowerProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? { soil: '', seed: '', watered: false, sunlight: 50 }
  );
  const [answerMap, setAnswerMap] = useState<AnswerMap>(initialState?.answerMap ?? {});
  const [formData, setFormData] = useState<FormData>(initialState?.formData ?? { name: '', email: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [isGrowing, setIsGrowing] = useState(false);
  const [additionalThoughts, setAdditionalThoughts] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [isWatering, setIsWatering] = useState(false);

  const reportProgress = useCallback(() => {
    if (!onProgress || currentStage === 0 || currentStage >= 5) return;
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

  const mappedSoilOptions = mapQuestionToVisualOptions(questions[0], soilOptions);
  const mappedSeedOptions = mapQuestionToVisualOptions(questions[1], seedOptions);

  const pickWithBadge = (uniqueId: string, advance: () => void) => {
    setPickedId(uniqueId);
    setTimeout(() => { setPickedId(null); advance(); }, 600);
  };

  const handleSoilSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, soil: uniqueId }));
    if (questions[0]) setAnswerMap(prev => ({ ...prev, [questions[0].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(1));
  };

  const handleSeedSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, seed: uniqueId }));
    if (questions[1]) setAnswerMap(prev => ({ ...prev, [questions[1].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(2));
  };

  const handleWater = () => {
    setIsWatering(true);
    setSelectedChoices(prev => ({ ...prev, watered: true }));
    if (questions[2]) setAnswerMap(prev => ({ ...prev, [questions[2].id]: { visualId: 'watered', answerValue: 'Watered' } }));
    setTimeout(() => {
      setIsWatering(false);
      setCurrentStage(allowAnonymous ? 4 : 3);
    }, 1500);
  };

  const handleSunlightChange = (value: number) => {
    setSelectedChoices(prev => ({ ...prev, sunlight: value }));
  };

  const handleSunlightConfirm = () => {
    if (questions[3]) {
      const level = selectedChoices.sunlight < 33 ? 'Low' : selectedChoices.sunlight < 66 ? 'Medium' : 'High';
      setAnswerMap(prev => ({ ...prev, [questions[3].id]: { visualId: level.toLowerCase(), answerValue: level } }));
    }
    setCurrentStage(5);
  };

  const handleGoToGrowth = () => {
    setCurrentStage(6);
    setIsGrowing(true);
    setGrowthProgress(0);
    const interval = setInterval(() => {
      setGrowthProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGrowing(false);
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
          setTimeout(() => setShowConfetti(false), 4000);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
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
            <GardenDisplay selectedChoices={selectedChoices} stage={currentStage} />
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
                stageLabel="🌱 Soil First"
                question={questions[0]}
                fallback="Choose your soil"
                options={mappedSoilOptions.map(o => ({ ...o, emoji: soilOptions.find(s => o.uniqueId.startsWith(s.id))?.emoji || '🌱' }))}
                onSelect={handleSoilSelect}
                pickedId={pickedId}
                cols={3}
              />
            )}
            {currentStage === 1 && (
              <OptionStage
                stageLabel="🫘 Plant a Seed"
                question={questions[1]}
                fallback="Pick your seed"
                options={mappedSeedOptions.map(o => ({ ...o, emoji: seedOptions.find(s => o.uniqueId.startsWith(s.id))?.emoji || '🫘' }))}
                onSelect={handleSeedSelect}
                pickedId={pickedId}
                cols={3}
              />
            )}
            {currentStage === 2 && (
              <WateringStage
                question={questions[2]}
                watered={selectedChoices.watered}
                isWatering={isWatering}
                onWater={handleWater}
              />
            )}
            {currentStage === 3 && !allowAnonymous && (
              <FormCapture formData={formData} setFormData={setFormData} onSubmit={() => setCurrentStage(4)} />
            )}
            {currentStage === 4 && (
              <SunlightStage
                question={questions[3]}
                sunlight={selectedChoices.sunlight}
                onChange={handleSunlightChange}
                onConfirm={handleSunlightConfirm}
              />
            )}
            {currentStage === 5 && (
              <FinalThoughts
                value={additionalThoughts}
                onChange={setAdditionalThoughts}
                onContinue={handleGoToGrowth}
                onBack={handleBack}
                theme="garden"
                respondentName={formData.name}
              />
            )}
            {currentStage === 6 && (
              <GrowthStage isGrowing={isGrowing} progress={growthProgress} />
            )}
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

// Generic option grid
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

// Stage 2: Watering
function WateringStage({
  question, watered, isWatering, onWater,
}: {
  question?: Question;
  watered: boolean;
  isWatering: boolean;
  onWater: () => void;
}) {
  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          💧 Water Time
        </span>
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
        {question?.question || 'Time to water!'}
      </h2>

      <div className="text-center mb-8">
        <motion.div
          animate={isWatering ? { scale: [1, 1.1, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: isWatering ? Infinity : 0 }}
          className="text-7xl mb-4"
        >
          {isWatering ? '💧' : watered ? '✅' : '🚿'}
        </motion.div>
        {isWatering && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-duo-green font-fredoka font-bold text-lg"
          >
            Watering…
          </motion.p>
        )}
      </div>

      {!watered && (
        <motion.button
          onClick={onWater}
          disabled={isWatering}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0 disabled:opacity-50"
        >
          💧 Water the Seed!
        </motion.button>
      )}
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
          <span className="text-4xl">🌿</span>
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Almost blooming…</h2>
        <p className="text-graphite text-sm font-medium">Who&apos;s tending this garden?</p>
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
        Set the Sunlight ☀️
      </button>
    </div>
  );
}

// Stage 4: Sunlight Slider
function SunlightStage({
  question, sunlight, onChange, onConfirm,
}: {
  question?: Question;
  sunlight: number;
  onChange: (value: number) => void;
  onConfirm: () => void;
}) {
  const level = sunlight < 33 ? 'Low Sun' : sunlight < 66 ? 'Medium Sun' : 'Full Sun';
  const levelEmoji = sunlight < 33 ? '🌑' : sunlight < 66 ? '🌤️' : '☀️';

  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          ☀️ Sunlight
        </span>
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
        {question?.question || 'Adjust the sunlight'}
      </h2>

      {/* Sun track */}
      <div className="relative h-16 mb-6 bg-gradient-to-r from-slate-200 via-sky-100 to-amber-100 rounded-2xl overflow-hidden border-2 border-cloud-gray">
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 text-3xl pointer-events-none"
          style={{ left: `calc(${10 + sunlight * 0.75}% - 1rem)` }}
          animate={{ filter: `drop-shadow(0 0 ${6 + sunlight / 10}px rgba(250,204,21,${0.4 + sunlight / 200}))` }}
          transition={{ duration: 0.1 }}
        >
          ☀️
        </motion.div>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <input
          type="range" min="0" max="100" value={sunlight}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-4 rounded-full appearance-none cursor-pointer bg-cloud-gray
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
            [&::-webkit-slider-thumb]:bg-sunshine-yellow [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-[0_3px_0_rgba(0,0,0,0.2)] [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7
            [&::-moz-range-thumb]:bg-sunshine-yellow [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs font-black text-graphite uppercase tracking-wider mt-2 px-1">
          <span>🌑 Shade</span>
          <span className="text-sunshine-yellow">{levelEmoji} {level}</span>
          <span>☀️ Full</span>
        </div>
      </div>

      <motion.button
        onClick={onConfirm}
        whileTap={{ scale: 0.97 }}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0 flex items-center justify-center gap-2"
      >
        <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          🌱
        </motion.span>
        Watch It Grow!
      </motion.button>
    </div>
  );
}

// Stage 6: Growth Stage
function GrowthStage({ isGrowing, progress }: { isGrowing: boolean; progress: number }) {
  const label = progress < 20 ? 'Germinating…' : progress < 50 ? 'Sprouting…' : progress < 80 ? 'Growing leaves…' : progress < 100 ? 'Blooming…' : 'Fully grown!';

  if (progress >= 100) {
    return (
      <motion.div className="text-center py-12"
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
        <motion.div className="text-7xl mb-6"
          animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.8, repeat: 2, repeatDelay: 0.5 }}>
          🌸
        </motion.div>
        <h2 className="font-fredoka text-4xl font-bold text-duo-green mb-2">Garden Bloomed!</h2>
        <p className="text-graphite font-bold text-sm uppercase tracking-widest">Quest Complete!</p>
      </motion.div>
    );
  }

  return (
    <div className="text-center py-12">
      <motion.div className="text-6xl mb-6"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}>
        {progress < 50 ? '🌱' : '🌿'}
      </motion.div>
      <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-6">{label}</h2>
      <div className="w-full h-4 bg-cloud-gray rounded-full overflow-hidden border-2 border-cloud-gray mb-3">
        <motion.div className="h-full bg-duo-green rounded-full"
          initial={{ width: 0 }} animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }} />
      </div>
      <p className="font-black text-graphite text-sm uppercase tracking-widest">
        {isGrowing ? `${Math.round(progress)}% grown` : 'Almost there…'}
      </p>
    </div>
  );
}
