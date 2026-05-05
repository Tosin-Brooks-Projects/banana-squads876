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
  allowAnonymous?: boolean;
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

// Visual options
const foundationOptions = [
  { id: 'concrete', name: 'Concrete Slab', emoji: '🪨' },
  { id: 'basement', name: 'Basement', emoji: '🏚️' },
  { id: 'raised', name: 'Raised', emoji: '🪜' },
];

const wallOptions = [
  { id: 'brick', name: 'Brick', emoji: '🧱', color: 'bg-red-300' },
  { id: 'wood', name: 'Wood', emoji: '🪵', color: 'bg-amber-400' },
  { id: 'stone', name: 'Stone', emoji: '🪨', color: 'bg-gray-400' },
];

const roofOptions = [
  { id: 'roof1', name: 'Slate', emoji: '🔷', color: '#334155' },
  { id: 'roof2', name: 'Terracotta', emoji: '🟫', color: '#78350f' },
  { id: 'roof3', name: 'Red Tile', emoji: '🔴', color: '#7f1d1d' },
];

const windowOptions = [
  { id: 'square', name: 'Square', emoji: '⬜' },
  { id: 'arched', name: 'Arched', emoji: '🔲' },
  { id: 'bay', name: 'Bay', emoji: '🪟' },
];

const doorOptions = [
  { id: 'classic', name: 'Classic', emoji: '🚪' },
  { id: 'modern', name: 'Modern', emoji: '🔲' },
  { id: 'double', name: 'Double', emoji: '🏛️' },
];

const colorOptions = [
  { id: 'white', name: 'White', color: '#f8fafc' },
  { id: 'blue', name: 'Blue', color: '#bfdbfe' },
  { id: 'yellow', name: 'Yellow', color: '#fef9c3' },
  { id: 'green', name: 'Green', color: '#bbf7d0' },
];

const landscapeOptions = [
  { id: 'tree', name: 'Trees', emoji: '🌳' },
  { id: 'flowers', name: 'Flowers', emoji: '🌸' },
  { id: 'garden', name: 'Garden', emoji: '🌻' },
];

const STAGE_EMOJIS = ['🏠', '🧱', '🏗️', '🪟', '🎨', '🌳'];

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

// House visual display
function HouseDisplay({ selectedChoices, stage, lightsOn }: { selectedChoices: SelectedChoices; stage: number; lightsOn: boolean }) {
  const wall = wallOptions.find(w => selectedChoices.walls.startsWith(w.id));
  const roof = roofOptions.find(r => selectedChoices.roof.startsWith(r.id));
  const color = colorOptions.find(c => selectedChoices.color.startsWith(c.id));
  const landscape = landscapeOptions.find(l => selectedChoices.landscape.startsWith(l.id));

  const houseColor = color?.color || wall?.color || '#fef3c7';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* House */}
      <div className="relative w-28 h-28">
        {/* Foundation */}
        {stage >= 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-400 rounded-sm" />
        )}
        {/* Walls */}
        {stage >= 1 && (
          <motion.div
            className="absolute bottom-2 left-2 right-2 rounded-sm border-2 border-cloud-gray"
            style={{ height: '60%', backgroundColor: stage >= 5 ? houseColor : undefined }}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
          >
            {/* Windows */}
            {stage >= 4 && (
              <>
                <div className={`absolute top-2 left-2 w-4 h-4 rounded-sm ${lightsOn ? 'bg-yellow-200' : 'bg-sky-200'} border border-gray-300`} />
                <div className={`absolute top-2 right-2 w-4 h-4 rounded-sm ${lightsOn ? 'bg-yellow-200' : 'bg-sky-200'} border border-gray-300`} />
              </>
            )}
            {/* Door */}
            {stage >= 4 && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-7 bg-amber-800 rounded-t-sm border border-amber-900" />
            )}
          </motion.div>
        )}
        {/* Roof */}
        {stage >= 2 && (
          <motion.div
            className="absolute left-0 right-0"
            style={{ top: '15%' }}
            initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
          >
            <div className="w-0 h-0 mx-auto"
              style={{
                borderLeft: '3.5rem solid transparent',
                borderRight: '3.5rem solid transparent',
                borderBottom: `2.5rem solid ${roof?.color || '#334155'}`,
              }}
            />
          </motion.div>
        )}
        {/* Landscape */}
        {stage >= 5 && landscape && (
          <motion.div className="absolute -bottom-1 -right-5 text-lg"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            {landscape.emoji}
          </motion.div>
        )}
        {/* Empty hint */}
        {stage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-20">🏠</div>
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

export default function DreamHome({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: DreamHomeProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? { foundation: '', walls: '', roof: '', windows: '', door: '', color: '', landscape: '' }
  );
  const [placedItems, setPlacedItems] = useState<PlacedItems>(initialState?.placedItems ?? { windows: [], door: null });
  const [answerMap, setAnswerMap] = useState<AnswerMap>(initialState?.answerMap ?? {});
  const [formData, setFormData] = useState<FormData>(initialState?.formData ?? { name: '', email: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);
  const [additionalThoughts, setAdditionalThoughts] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const reportProgress = useCallback(() => {
    if (!onProgress || currentStage === 0 || currentStage >= 6) return;
    const answers: Answer[] = questions.map((q) => {
      const entry = answerMap[q.id];
      return { questionId: q.id, value: entry?.answerValue || '' };
    });
    onProgress({
      currentStage, totalStages: allowAnonymous ? 7 : 8, answers,
      adventureState: { currentStage, selectedChoices, placedItems, answerMap, formData },
      respondentName: allowAnonymous ? undefined : (formData.name || undefined),
      respondentEmail: allowAnonymous ? undefined : (formData.email || undefined),
    });
  }, [onProgress, currentStage, questions, answerMap, selectedChoices, placedItems, formData, allowAnonymous]);

  useEffect(() => { reportProgress(); }, [currentStage, reportProgress]);

  const mappedFoundationOptions = mapQuestionToVisualOptions(questions[0], foundationOptions);
  const mappedWallOptions = mapQuestionToVisualOptions(questions[1], wallOptions);
  const mappedRoofOptions = mapQuestionToVisualOptions(questions[2], roofOptions);
  const mappedWindowOptions = mapQuestionToVisualOptions(questions[3], windowOptions);
  const mappedDoorOptions = mapQuestionToVisualOptions(questions[3], doorOptions);
  const mappedColorOptions = mapQuestionToVisualOptions(questions[4], colorOptions);
  const mappedLandscapeOptions = mapQuestionToVisualOptions(questions[4], landscapeOptions);

  const pickWithBadge = (uniqueId: string, advance: () => void) => {
    setPickedId(uniqueId);
    setTimeout(() => { setPickedId(null); advance(); }, 600);
  };

  const defaultPlacedItems = {
    windows: [{ x: -20, y: 145 }, { x: 20, y: 145 }],
    door: { x: 0, y: 118 },
  };

  const handleFoundationSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, foundation: uniqueId }));
    if (questions[0]) setAnswerMap(prev => ({ ...prev, [questions[0].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(1));
  };

  const handleWallsSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, walls: uniqueId }));
    if (questions[1]) setAnswerMap(prev => ({ ...prev, [questions[1].id]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, () => setCurrentStage(2));
  };

  const handleRoofSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, roof: uniqueId }));
    if (questions[2]) setAnswerMap(prev => ({ ...prev, [questions[2].id]: { visualId: uniqueId, answerValue } }));
    setPlacedItems(defaultPlacedItems);
    pickWithBadge(uniqueId, () => setCurrentStage(allowAnonymous ? 4 : 3));
  };

  const handleWindowStyleSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, windows: uniqueId }));
    if (questions[3]) setAnswerMap(prev => ({ ...prev, [`${questions[3].id}_windows`]: { visualId: uniqueId, answerValue } }));
  };

  const handleDoorStyleSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, door: uniqueId }));
    if (questions[3]) setAnswerMap(prev => ({ ...prev, [`${questions[3].id}_door`]: { visualId: uniqueId, answerValue } }));
  };

  const handleColorSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, color: uniqueId }));
    if (questions[4]) setAnswerMap(prev => ({ ...prev, [`${questions[4].id}_color`]: { visualId: uniqueId, answerValue } }));
  };

  const handleLandscapeSelect = (uniqueId: string, answerValue: string) => {
    setSelectedChoices(prev => ({ ...prev, landscape: uniqueId }));
    if (questions[4]) setAnswerMap(prev => ({ ...prev, [`${questions[4].id}_landscape`]: { visualId: uniqueId, answerValue } }));
  };

  const handleComplete = () => {
    setCurrentStage(7);
    setLightsOn(true);
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

  const totalDisplayStages = allowAnonymous ? 6 : 7;
  const progressPct = Math.min((currentStage / totalDisplayStages) * 100, 100);
  const showTopBar = currentStage >= 1 && currentStage < 7;

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
        {currentStage < 7 && (
          <div className="py-6 flex justify-center">
            <HouseDisplay selectedChoices={selectedChoices} stage={currentStage} lightsOn={lightsOn} />
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
                stageLabel="🏠 Foundation"
                question={questions[0]}
                fallback="Choose your foundation"
                options={mappedFoundationOptions.map(o => ({ ...o, emoji: foundationOptions.find(f => o.uniqueId.startsWith(f.id))?.emoji || '🏠' }))}
                onSelect={handleFoundationSelect}
                pickedId={pickedId}
                cols={3}
              />
            )}
            {currentStage === 1 && (
              <OptionStage
                stageLabel="🧱 Walls"
                question={questions[1]}
                fallback="Pick your wall material"
                options={mappedWallOptions.map(o => ({ ...o, emoji: wallOptions.find(w => o.uniqueId.startsWith(w.id))?.emoji || '🧱' }))}
                onSelect={handleWallsSelect}
                pickedId={pickedId}
                cols={3}
              />
            )}
            {currentStage === 2 && (
              <OptionStage
                stageLabel="🏗️ Roof"
                question={questions[2]}
                fallback="Choose your roof style"
                options={mappedRoofOptions.map(o => ({ ...o, emoji: roofOptions.find(r => o.uniqueId.startsWith(r.id))?.emoji || '🏗️' }))}
                onSelect={handleRoofSelect}
                pickedId={pickedId}
                cols={3}
              />
            )}
            {currentStage === 3 && !allowAnonymous && (
              <FormCapture formData={formData} setFormData={setFormData} onSubmit={() => { setPlacedItems(defaultPlacedItems); setCurrentStage(4); }} />
            )}
            {currentStage === 4 && (
              <WindowsDoorSelection
                windowOptions={mappedWindowOptions}
                doorOptions={mappedDoorOptions}
                selectedWindows={selectedChoices.windows}
                selectedDoor={selectedChoices.door}
                onWindowSelect={handleWindowStyleSelect}
                onDoorSelect={handleDoorStyleSelect}
                onComplete={() => setCurrentStage(5)}
                pickedId={pickedId}
              />
            )}
            {currentStage === 5 && (
              <PaintLandscapeSelection
                colorOptions={mappedColorOptions}
                landscapeOptions={mappedLandscapeOptions}
                selectedColor={selectedChoices.color}
                selectedLandscape={selectedChoices.landscape}
                onColorSelect={handleColorSelect}
                onLandscapeSelect={handleLandscapeSelect}
                onComplete={() => setCurrentStage(6)}
                pickedId={pickedId}
              />
            )}
            {currentStage === 6 && (
              <FinalThoughts
                value={additionalThoughts}
                onChange={setAdditionalThoughts}
                onContinue={handleComplete}
                onBack={handleBack}
                theme="home"
                respondentName={formData.name}
              />
            )}
            {currentStage === 7 && <CompletionStage />}
          </motion.div>
        </AnimatePresence>
      </div>

      {currentStage < 7 && (
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
          <span className="text-4xl">🏠</span>
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Almost home…</h2>
        <p className="text-graphite text-sm font-medium">Who&apos;s building this dream home?</p>
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
        Add Windows & Door 🪟
      </button>
    </div>
  );
}

// Stage 4: Windows & Door
function WindowsDoorSelection({
  windowOptions: wOpts, doorOptions: dOpts,
  selectedWindows, selectedDoor,
  onWindowSelect, onDoorSelect, onComplete, pickedId,
}: {
  windowOptions: Array<{ uniqueId: string; answerValue: string }>;
  doorOptions: Array<{ uniqueId: string; answerValue: string }>;
  selectedWindows: string;
  selectedDoor: string;
  onWindowSelect: (uniqueId: string, answerValue: string) => void;
  onDoorSelect: (uniqueId: string, answerValue: string) => void;
  onComplete: () => void;
  pickedId: string | null;
}) {
  const windowEmojis = ['⬜', '🔲', '🪟'];
  const doorEmojis = ['🚪', '🔲', '🏛️'];
  const canProceed = selectedWindows && selectedDoor;

  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          🪟 Windows & Door
        </span>
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-5">
        Design your openings
      </h2>

      {/* Window style */}
      <p className="text-[10px] font-black text-graphite uppercase tracking-widest mb-3">Window Style</p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {wOpts.map((option, index) => {
          const isSelected = selectedWindows === option.uniqueId;
          const isPicked = pickedId === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => onWindowSelect(option.uniqueId, option.answerValue)}
              whileTap={{ scale: 0.97 }}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${
                isSelected || isPicked
                  ? 'bg-duo-green/10 border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'bg-white border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              <div className="text-2xl mb-1">{windowEmojis[index % windowEmojis.length]}</div>
              <div className="font-bold text-almost-black text-xs leading-snug">{option.answerValue}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Door style */}
      <p className="text-[10px] font-black text-graphite uppercase tracking-widest mb-3">Door Style</p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {dOpts.map((option, index) => {
          const isSelected = selectedDoor === option.uniqueId;
          const isPicked = pickedId === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => onDoorSelect(option.uniqueId, option.answerValue)}
              whileTap={{ scale: 0.97 }}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${
                isSelected || isPicked
                  ? 'bg-duo-green/10 border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'bg-white border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              <div className="text-2xl mb-1">{doorEmojis[index % doorEmojis.length]}</div>
              <div className="font-bold text-almost-black text-xs leading-snug">{option.answerValue}</div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={onComplete}
        disabled={!canProceed}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-5 font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl transition-all ${
          canProceed
            ? 'bg-duo-green text-white border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0'
            : 'bg-cloud-gray text-silver cursor-not-allowed border-b-4 border-[#e5e5e5]'
        }`}
      >
        Paint the House 🎨
      </motion.button>
    </div>
  );
}

// Stage 5: Paint & Landscape
function PaintLandscapeSelection({
  colorOptions: cOpts, landscapeOptions: lOpts,
  selectedColor, selectedLandscape,
  onColorSelect, onLandscapeSelect, onComplete, pickedId,
}: {
  colorOptions: Array<{ uniqueId: string; answerValue: string }>;
  landscapeOptions: Array<{ uniqueId: string; answerValue: string }>;
  selectedColor: string;
  selectedLandscape: string;
  onColorSelect: (uniqueId: string, answerValue: string) => void;
  onLandscapeSelect: (uniqueId: string, answerValue: string) => void;
  onComplete: () => void;
  pickedId: string | null;
}) {
  const bgColors = ['#f8fafc', '#bfdbfe', '#fef9c3', '#bbf7d0'];
  const landscapeEmojis = ['🌳', '🌸', '🌻'];
  const canProceed = selectedColor && selectedLandscape;

  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
          🎨 Paint & Garden
        </span>
      </div>
      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-5">
        Finish your home
      </h2>

      {/* House color */}
      <p className="text-[10px] font-black text-graphite uppercase tracking-widest mb-3">House Color</p>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {cOpts.map((option, index) => {
          const isSelected = selectedColor === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => onColorSelect(option.uniqueId, option.answerValue)}
              whileTap={{ scale: 0.97 }}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${
                isSelected
                  ? 'border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
              style={{ backgroundColor: bgColors[index % bgColors.length] }}
            >
              <div className="font-bold text-almost-black text-[11px] leading-snug">{option.answerValue}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Landscape */}
      <p className="text-[10px] font-black text-graphite uppercase tracking-widest mb-3">Landscape</p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {lOpts.map((option, index) => {
          const isSelected = selectedLandscape === option.uniqueId;
          const isPicked = pickedId === option.uniqueId;
          return (
            <motion.button
              key={option.uniqueId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => onLandscapeSelect(option.uniqueId, option.answerValue)}
              whileTap={{ scale: 0.97 }}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${
                isSelected || isPicked
                  ? 'bg-duo-green/10 border-duo-green shadow-[0_3px_0_#46a302]'
                  : 'bg-white border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
              }`}
            >
              <div className="text-2xl mb-1">{landscapeEmojis[index % landscapeEmojis.length]}</div>
              <div className="font-bold text-almost-black text-xs leading-snug">{option.answerValue}</div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={onComplete}
        disabled={!canProceed}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-5 font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl transition-all ${
          canProceed
            ? 'bg-duo-green text-white border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0'
            : 'bg-cloud-gray text-silver cursor-not-allowed border-b-4 border-[#e5e5e5]'
        }`}
      >
        <motion.span className="inline-block" animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          🏠
        </motion.span>
        {' '}Almost Done!
      </motion.button>
    </div>
  );
}

// Stage 7: Completion
function CompletionStage() {
  return (
    <motion.div className="text-center py-12"
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
      <motion.div className="text-7xl mb-6"
        animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.8, repeat: 2, repeatDelay: 0.5 }}>
        🏠
      </motion.div>
      <h2 className="font-fredoka text-4xl font-bold text-duo-green mb-2">Dream Home Built!</h2>
      <p className="text-graphite font-bold text-sm uppercase tracking-widest">Quest Complete!</p>
    </motion.div>
  );
}
