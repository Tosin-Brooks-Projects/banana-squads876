'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Answer, OnProgressCallback } from '@/lib/types';
import FinalThoughts from './shared/FinalThoughts';

interface DreamHomeProps {
  questions: Question[];
  onComplete: (responses: Answer[]) => void;
  onProgress?: OnProgressCallback;
  initialState?: DreamHomeInitialState;
  allowAnonymous?: boolean;
}

interface DreamHomeInitialState {
  currentStage: number;
  selectedChoices: SelectedChoices;
  placedItems: PlacedItems;
  answerMap: AnswerMap;
  formData: FormData;
}

interface FormData { name: string; email: string; }
interface SelectedChoices {
  foundation: string; walls: string; roof: string;
  windows: string; door: string; color: string; landscape: string;
}
interface PlacedItems {
  windows: { x: number; y: number }[];
  door: { x: number; y: number } | null;
}
interface AnswerMap {
  [questionId: string]: { visualId: string | string[]; answerValue: string | string[]; };
}

// ── Option data ────────────────────────────────────────────────
const foundationOptions = [
  { id: 'concrete', name: 'Concrete Slab', emoji: '🪨', color: '#d1d5db', desc: 'Solid base' },
  { id: 'basement', name: 'Basement', emoji: '🏚️', color: '#9ca3af', desc: 'Extra space' },
  { id: 'raised',   name: 'Raised',   emoji: '🪜', color: '#a8a29e', desc: 'Off the ground' },
];
const wallOptions = [
  { id: 'brick',  name: 'Brick',  emoji: '🧱', color: '#fca5a5', wallColor: '#ef4444', desc: 'Classic & strong' },
  { id: 'wood',   name: 'Wood',   emoji: '🪵', color: '#fcd34d', wallColor: '#d97706', desc: 'Warm & natural' },
  { id: 'stone',  name: 'Stone',  emoji: '🪨', color: '#d1d5db', wallColor: '#6b7280', desc: 'Timeless elegance' },
];
const roofOptions = [
  { id: 'roof1', name: 'Slate',     emoji: '🔷', color: '#334155', desc: 'Modern & sleek' },
  { id: 'roof2', name: 'Terracotta',emoji: '🟫', color: '#78350f', desc: 'Mediterranean' },
  { id: 'roof3', name: 'Red Tile',  emoji: '🔴', color: '#7f1d1d', desc: 'Classic charm' },
];
const windowOptions = [
  { id: 'square', name: 'Square', emoji: '⬜', desc: 'Clean lines' },
  { id: 'arched', name: 'Arched', emoji: '🔲', desc: 'Elegant arches' },
  { id: 'bay',    name: 'Bay',    emoji: '🪟', desc: 'Panoramic view' },
];
const doorOptions = [
  { id: 'classic', name: 'Classic', emoji: '🚪', color: '#92400e', desc: 'Timeless entry' },
  { id: 'modern',  name: 'Modern',  emoji: '🔲', color: '#1e293b', desc: 'Sleek & minimal' },
  { id: 'double',  name: 'Double',  emoji: '🏛️', color: '#7c3aed', desc: 'Grand entrance' },
];
const colorOptions = [
  { id: 'white',  name: 'Crisp White', paintColor: '#f1f5f9', border: '#cbd5e1' },
  { id: 'blue',   name: 'Sky Blue',    paintColor: '#bfdbfe', border: '#3b82f6' },
  { id: 'yellow', name: 'Warm Sand',   paintColor: '#fef3c7', border: '#f59e0b' },
  { id: 'green',  name: 'Sage Green',  paintColor: '#bbf7d0', border: '#22c55e' },
];
const landscapeOptions = [
  { id: 'tree',    name: 'Oak Trees', emoji: '🌳', desc: 'Shady canopy' },
  { id: 'flowers', name: 'Flowers',   emoji: '🌸', desc: 'Colorful blooms' },
  { id: 'garden',  name: 'Garden',    emoji: '🌻', desc: 'Sunny sunflowers' },
];

// ── XP system ──────────────────────────────────────────────────
const COMBO_PHRASES = ['Nice pick!', 'Love it!', 'Perfect!', 'Great taste!', 'Solid choice!'];

function XPParticle({ id: _id, onDone }: { id: number; onDone: () => void }) {
  return (
    <motion.div
      className="fixed z-50 pointer-events-none font-fredoka font-black text-sm text-amber-500"
      style={{ top: '15%', left: '50%', translateX: '-50%' }}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -48 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      +10 XP 🏠
    </motion.div>
  );
}

// ── House scene ──────────────────────────────────────────────────
function HouseScene({ choices, stage }: { choices: SelectedChoices; stage: number }) {
  const wall = wallOptions.find(w => choices.walls.startsWith(w.id));
  const roof = roofOptions.find(r => choices.roof.startsWith(r.id));
  const color = colorOptions.find(c => choices.color.startsWith(c.id));
  const landscape = landscapeOptions.find(l => choices.landscape.startsWith(l.id));
  const door = doorOptions.find(d => choices.door.startsWith(d.id));

  const houseColor = color?.paintColor || wall?.wallColor || '#fef3c7';
  const roofColor = roof?.color || '#334155';
  const doorColor = door?.color || '#92400e';

  // sky gradient darkens as house builds
  const skyColors = [
    'from-sky-200 to-blue-100',
    'from-sky-300 to-blue-200',
    'from-sky-300 to-blue-300',
    'from-sky-400 to-blue-300',
    'from-amber-200 to-orange-100', // paint stage = golden hour
    'from-amber-300 to-orange-200',
    'from-indigo-300 to-purple-200', // night = done
  ];
  const skyClass = skyColors[Math.min(stage, skyColors.length - 1)];

  // sun position shifts
  const sunX = [70, 65, 60, 55, 50, 45, 80];
  const sunY = [18, 20, 22, 20, 16, 14, 70];
  const showMoon = stage >= 6;

  return (
    <div className={`relative w-full h-52 rounded-3xl overflow-hidden bg-gradient-to-b ${skyClass} border-2 border-amber-200/60`}>
      {/* Sun / Moon */}
      <motion.div
        className="absolute text-3xl"
        style={{ left: `${sunX[Math.min(stage, sunX.length - 1)]}%`, top: `${sunY[Math.min(stage, sunY.length - 1)]}%` }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {showMoon ? '🌙' : '☀️'}
      </motion.div>

      {/* Clouds */}
      {stage < 6 && (
        <>
          <motion.div className="absolute text-xl opacity-60" style={{ top: '12%', left: '15%' }}
            animate={{ x: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity }}>☁️</motion.div>
          <motion.div className="absolute text-sm opacity-40" style={{ top: '20%', left: '40%' }}
            animate={{ x: [0, -6, 0] }} transition={{ duration: 8, repeat: Infinity }}>☁️</motion.div>
        </>
      )}

      {/* Stars at night */}
      {stage >= 6 && ['✨', '⭐', '✨'].map((s, i) => (
        <motion.div key={i} className="absolute text-xs"
          style={{ top: `${10 + i * 12}%`, left: `${15 + i * 25}%` }}
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}>
          {s}
        </motion.div>
      ))}

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-green-400 to-green-300" />

      {/* Landscape */}
      {stage >= 5 && landscape && (
        <>
          <motion.div className="absolute bottom-8 left-4 text-2xl"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }}>
            {landscape.emoji}
          </motion.div>
          <motion.div className="absolute bottom-8 right-6 text-xl"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6, delay: 0.15 }}>
            {landscape.emoji}
          </motion.div>
        </>
      )}

      {/* House body */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
        {/* Roof */}
        {stage >= 2 && (
          <motion.div
            initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
          >
            <div style={{
              width: 0, height: 0,
              borderLeft: '52px solid transparent',
              borderRight: '52px solid transparent',
              borderBottom: `38px solid ${roofColor}`,
            }} />
          </motion.div>
        )}
        {/* Walls */}
        {stage >= 1 && (
          <motion.div
            className="relative border-2 border-stone-300"
            style={{ width: 88, height: 64, backgroundColor: stage >= 4 ? houseColor : (wall?.wallColor || '#fef3c7') }}
            initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
          >
            {/* Windows */}
            {stage >= 3 && (
              <>
                <div className={`absolute top-2 left-2 w-5 h-5 rounded-sm border border-gray-300 ${stage >= 6 ? 'bg-yellow-200' : 'bg-sky-200'}`} />
                <div className={`absolute top-2 right-2 w-5 h-5 rounded-sm border border-gray-300 ${stage >= 6 ? 'bg-yellow-200' : 'bg-sky-200'}`} />
              </>
            )}
            {/* Door */}
            {stage >= 3 && (
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-sm border"
                style={{ width: 18, height: 28, backgroundColor: doorColor, borderColor: doorColor }}
                initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }}
                transition={{ type: 'spring', bounce: 0.3, delay: 0.1 }}
              >
                <div className="absolute right-1.5 top-1/2 w-1 h-1 rounded-full bg-yellow-300" />
              </motion.div>
            )}
            {/* Chimney */}
            {stage >= 2 && (
              <div className="absolute -top-5 right-4 w-4 h-6 border-2 border-stone-300" style={{ backgroundColor: roofColor }} />
            )}
          </motion.div>
        )}
        {/* Foundation slab */}
        {stage >= 0 && (
          <div className="w-24 h-2.5 bg-stone-400 rounded-b-sm" />
        )}
        {/* Empty hint */}
        {stage === 0 && (
          <div className="absolute -top-12 text-4xl opacity-30">🏠</div>
        )}
      </div>

      {/* Smoke from chimney */}
      {stage >= 6 && (
        <motion.div className="absolute text-xs opacity-50"
          style={{ bottom: '58%', left: '59%' }}
          animate={{ y: [0, -12, 0], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}>
          💨
        </motion.div>
      )}
    </div>
  );
}

// ── Ingredient card ─────────────────────────────────────────────
function HomeCard({
  emoji, name, desc, accentColor, accentBg, isPicked, onClick,
}: {
  emoji: string; name: string; desc: string;
  accentColor: string; accentBg: string;
  isPicked: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`relative p-4 rounded-2xl border-2 text-left transition-all overflow-hidden ${
        isPicked
          ? 'border-amber-400 shadow-[0_4px_0_#b45309]'
          : 'bg-white border-stone-200 shadow-[0_4px_0_#d6d3d1] hover:border-amber-300'
      }`}
      style={isPicked ? { backgroundColor: accentBg } : {}}
    >
      {/* Color accent strip */}
      <div className="absolute top-0 right-0 w-12 h-12 rounded-bl-2xl opacity-20" style={{ backgroundColor: accentColor }} />
      {/* Checkmark */}
      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="text-4xl mb-2">{emoji}</div>
      <div className="font-fredoka font-bold text-almost-black text-base leading-tight">{name}</div>
      <div className="text-xs text-graphite mt-0.5 font-medium">{desc}</div>
    </motion.button>
  );
}

// Color swatch card
function ColorCard({
  name, paintColor, border, isPicked, onClick,
}: {
  name: string; paintColor: string; border: string; isPicked: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`relative p-3 rounded-2xl border-2 text-center transition-all ${
        isPicked ? 'shadow-[0_4px_0_#b45309]' : 'shadow-[0_3px_0_#d6d3d1] hover:opacity-90'
      }`}
      style={{ backgroundColor: paintColor, borderColor: isPicked ? border : '#e7e5e4' }}
    >
      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: border }}
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="font-fredoka font-bold text-stone-700 text-sm mt-1">{name}</div>
    </motion.button>
  );
}

// Stage wrapper
function StageWrapper({ label, emoji, color, children }: { label: string; emoji: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest mb-4"
        style={{ backgroundColor: `${color}18`, borderColor: `${color}40`, color }}
      >
        {emoji} {label}
      </motion.div>
      {children}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────
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

function mapOptions<T extends { id: string }>(question: Question | undefined, visuals: T[]) {
  const opts = getQuestionOptions(question);
  if (!opts.length) return [];
  return opts.map((answerValue, index) => ({
    ...visuals[index % visuals.length],
    answerValue,
    uniqueId: `${visuals[index % visuals.length].id}-${index}`,
  }));
}

// ── Main component ───────────────────────────────────────────────
export default function DreamHome({ questions, onComplete, onProgress, initialState, allowAnonymous = false }: DreamHomeProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoices>(
    initialState?.selectedChoices ?? { foundation: '', walls: '', roof: '', windows: '', door: '', color: '', landscape: '' }
  );
  const [placedItems] = useState<PlacedItems>(initialState?.placedItems ?? { windows: [], door: null });
  const [answerMap, setAnswerMap] = useState<AnswerMap>(initialState?.answerMap ?? {});
  const [formData, setFormData] = useState<FormData>(initialState?.formData ?? { name: '', email: '' });
  const [additionalThoughts, setAdditionalThoughts] = useState('');

  const [xp, setXp] = useState(0);
  const [particles, setParticles] = useState<number[]>([]);
  const [combo, setCombo] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const particleCounter = useRef(0);
  const comboIdx = useRef(0);

  const addXp = useCallback(() => {
    setXp(p => p + 10);
    const id = ++particleCounter.current;
    setParticles(p => [...p, id]);
    setCombo(COMBO_PHRASES[comboIdx.current % COMBO_PHRASES.length]);
    comboIdx.current++;
    setTimeout(() => setCombo(''), 1200);
  }, []);

  const removeParticle = useCallback((id: number) => {
    setParticles(p => p.filter(x => x !== id));
  }, []);

  const pickWithBadge = useCallback((uniqueId: string, advance: () => void) => {
    setPickedId(uniqueId);
    addXp();
    setTimeout(() => { setPickedId(null); advance(); }, 650);
  }, [addXp]);

  const reportProgress = useCallback(() => {
    if (!onProgress || currentStage === 0 || currentStage >= 6) return;
    const answers: Answer[] = questions.map(q => {
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

  const mFoundation = mapOptions(questions[0], foundationOptions);
  const mWalls      = mapOptions(questions[1], wallOptions);
  const mRoof       = mapOptions(questions[2], roofOptions);
  const mWindows    = mapOptions(questions[3], windowOptions);
  const mDoors      = mapOptions(questions[3], doorOptions);
  const mColors     = mapOptions(questions[4], colorOptions);
  const mLandscape  = mapOptions(questions[4], landscapeOptions);

  const handle = (key: keyof SelectedChoices, questionId: string | undefined, uniqueId: string, answerValue: string, advance: () => void) => {
    setSelectedChoices(prev => ({ ...prev, [key]: uniqueId }));
    if (questionId) setAnswerMap(prev => ({ ...prev, [questionId]: { visualId: uniqueId, answerValue } }));
    pickWithBadge(uniqueId, advance);
  };

  const handleComplete = () => {
    setCurrentStage(7);
    const answers: Answer[] = questions.map(q => {
      const entry = answerMap[q.id];
      return { questionId: q.id, value: entry?.answerValue || '' };
    });
    if (!allowAnonymous) {
      answers.push({ questionId: 'respondent_name', value: formData.name });
      answers.push({ questionId: 'respondent_email', value: formData.email });
    }
    answers.push({ questionId: 'additional_thoughts', value: additionalThoughts });
    onComplete(answers);
  };

  const totalDisplayStages = allowAnonymous ? 6 : 7;
  const progressPct = Math.min((currentStage / totalDisplayStages) * 100, 100);
  const showBar = currentStage >= 1 && currentStage < 7;

  const ACCENT = '#f59e0b';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #fffbeb 0%, #fefce8 100%)' }}>
      {/* XP particles */}
      {particles.map(id => <XPParticle key={id} id={id} onDone={() => removeParticle(id)} />)}

      {/* HUD */}
      {showBar && (
        <div className="w-full px-4 pt-6 pb-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => currentStage > 1 && setCurrentStage(s => s - 1)}
              disabled={currentStage <= 1}
              className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-amber-200 shadow-[0_3px_0_#d97706] flex items-center justify-center text-amber-700 disabled:opacity-30 transition-all active:translate-y-[2px] active:shadow-none bg-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 h-4 bg-amber-100 rounded-full overflow-hidden border-2 border-amber-200">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: ACCENT }}
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }} />
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-amber-100 border-2 border-amber-300 rounded-full shadow-[0_2px_0_#d97706]">
              <span className="text-xs">🏠</span>
              <span className="font-fredoka font-black text-amber-700 text-sm"><motion.span key={xp} initial={{ scale: 1.4, color: '#f59e0b' }} animate={{ scale: 1, color: '#92400e' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP</span>
            </div>
          </div>
          {/* Combo */}
          <div className="h-5 text-center">
            <AnimatePresence>
              {combo && (
                <motion.span
                  key={combo + xp}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs font-black uppercase tracking-widest text-amber-500"
                >
                  {combo}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* House scene */}
      <div className="px-4 max-w-lg mx-auto w-full">
        {currentStage < 7 && (
          <motion.div className="mb-5"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <HouseScene choices={selectedChoices} stage={currentStage} />
          </motion.div>
        )}
      </div>

      {/* Stage content */}
      <div className="flex-1 px-4 max-w-lg mx-auto w-full pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
          >
            {/* Stage 0: Foundation */}
            {currentStage === 0 && (
              <StageWrapper label="Foundation" emoji="🪨" color={ACCENT}>
                <h2 className="font-fredoka text-2xl font-bold text-stone-800 mb-6">
                  {questions[0]?.question || 'What foundation do you want?'}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {mFoundation.map((o, i) => {
                    const vis = foundationOptions.find(f => o.uniqueId.startsWith(f.id))!;
                    return (
                      <motion.div key={o.uniqueId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                        <HomeCard
                          emoji={vis.emoji} name={o.answerValue} desc={vis.desc}
                          accentColor={ACCENT} accentBg="#fef9c3"
                          isPicked={pickedId === o.uniqueId}
                          onClick={() => handle('foundation', questions[0]?.id, o.uniqueId, o.answerValue, () => setCurrentStage(1))}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </StageWrapper>
            )}

            {/* Stage 1: Walls */}
            {currentStage === 1 && (
              <StageWrapper label="Walls" emoji="🧱" color="#ef4444">
                <h2 className="font-fredoka text-2xl font-bold text-stone-800 mb-6">
                  {questions[1]?.question || 'Choose your wall material'}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {mWalls.map((o, i) => {
                    const vis = wallOptions.find(w => o.uniqueId.startsWith(w.id))!;
                    return (
                      <motion.div key={o.uniqueId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                        <HomeCard
                          emoji={vis.emoji} name={o.answerValue} desc={vis.desc}
                          accentColor={vis.wallColor} accentBg={`${vis.wallColor}18`}
                          isPicked={pickedId === o.uniqueId}
                          onClick={() => handle('walls', questions[1]?.id, o.uniqueId, o.answerValue, () => setCurrentStage(2))}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </StageWrapper>
            )}

            {/* Stage 2: Roof */}
            {currentStage === 2 && (
              <StageWrapper label="Roof" emoji="🏗️" color="#6b7280">
                <h2 className="font-fredoka text-2xl font-bold text-stone-800 mb-6">
                  {questions[2]?.question || 'Pick your roof style'}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {mRoof.map((o, i) => {
                    const vis = roofOptions.find(r => o.uniqueId.startsWith(r.id))!;
                    return (
                      <motion.div key={o.uniqueId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                        <HomeCard
                          emoji={vis.emoji} name={o.answerValue} desc={vis.desc}
                          accentColor={vis.color} accentBg={`${vis.color}22`}
                          isPicked={pickedId === o.uniqueId}
                          onClick={() => handle('roof', questions[2]?.id, o.uniqueId, o.answerValue, () => setCurrentStage(allowAnonymous ? 4 : 3))}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </StageWrapper>
            )}

            {/* Stage 3: Form (non-anonymous) */}
            {currentStage === 3 && !allowAnonymous && (
              <FormCapture formData={formData} setFormData={setFormData}
                onSubmit={() => setCurrentStage(4)} />
            )}

            {/* Stage 4: Windows & Door */}
            {currentStage === 4 && (
              <WindowsDoorStage
                windowOptions={mWindows} doorOptions={mDoors}
                selectedWindows={selectedChoices.windows} selectedDoor={selectedChoices.door}
                pickedId={pickedId}
                onWindowSelect={(uid, val) => {
                  setSelectedChoices(prev => ({ ...prev, windows: uid }));
                  if (questions[3]) setAnswerMap(prev => ({ ...prev, [`${questions[3].id}_windows`]: { visualId: uid, answerValue: val } }));
                  addXp();
                  setPickedId(uid);
                  setTimeout(() => setPickedId(null), 650);
                }}
                onDoorSelect={(uid, val) => {
                  setSelectedChoices(prev => ({ ...prev, door: uid }));
                  if (questions[3]) setAnswerMap(prev => ({ ...prev, [`${questions[3].id}_door`]: { visualId: uid, answerValue: val } }));
                  addXp();
                  setPickedId(uid);
                  setTimeout(() => setPickedId(null), 650);
                }}
                onComplete={() => setCurrentStage(5)}
                accentColor={ACCENT}
              />
            )}

            {/* Stage 5: Paint & Landscape */}
            {currentStage === 5 && (
              <PaintLandscapeStage
                colorOptions={mColors} landscapeOptions={mLandscape}
                selectedColor={selectedChoices.color} selectedLandscape={selectedChoices.landscape}
                pickedId={pickedId}
                onColorSelect={(uid, val) => {
                  setSelectedChoices(prev => ({ ...prev, color: uid }));
                  if (questions[4]) setAnswerMap(prev => ({ ...prev, [`${questions[4].id}_color`]: { visualId: uid, answerValue: val } }));
                  addXp();
                  setPickedId(uid);
                  setTimeout(() => setPickedId(null), 650);
                }}
                onLandscapeSelect={(uid, val) => {
                  setSelectedChoices(prev => ({ ...prev, landscape: uid }));
                  if (questions[4]) setAnswerMap(prev => ({ ...prev, [`${questions[4].id}_landscape`]: { visualId: uid, answerValue: val } }));
                  addXp();
                  setPickedId(uid);
                  setTimeout(() => setPickedId(null), 650);
                }}
                onComplete={() => setCurrentStage(6)}
                accentColor={ACCENT}
              />
            )}

            {/* Stage 6: Final thoughts */}
            {currentStage === 6 && (
              <FinalThoughts
                value={additionalThoughts}
                onChange={setAdditionalThoughts}
                onContinue={handleComplete}
                onBack={() => setCurrentStage(5)}
                theme="home"
                respondentName={formData.name}
              />
            )}

            {/* Stage 7: Completion */}
            {currentStage === 7 && <CompletionStage xp={xp} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {currentStage < 7 && (
        <div className="py-5 text-center">
          <a href="https://unboringsurveys.com" target="_blank" rel="noopener noreferrer"
            className="font-fredoka text-sm font-bold text-stone-400 hover:text-amber-500 transition-colors">
            Unboring<span className="text-amber-500">.</span>
          </a>
        </div>
      )}
    </div>
  );
}

// ── Sub-stages ───────────────────────────────────────────────────

function WindowsDoorStage({
  windowOptions, doorOptions, selectedWindows, selectedDoor, pickedId,
  onWindowSelect, onDoorSelect, onComplete, accentColor,
}: {
  windowOptions: Array<{ uniqueId: string; answerValue: string }>;
  doorOptions: Array<{ uniqueId: string; answerValue: string }>;
  selectedWindows: string; selectedDoor: string; pickedId: string | null;
  onWindowSelect: (uid: string, val: string) => void;
  onDoorSelect: (uid: string, val: string) => void;
  onComplete: () => void;
  accentColor: string;
}) {
  const canProceed = selectedWindows && selectedDoor;
  const windowEmojis = ['⬜', '🔲', '🪟'];
  const doorEmojis = ['🚪', '🔲', '🏛️'];

  return (
    <StageWrapper label="Windows & Door" emoji="🪟" color={accentColor}>
      <h2 className="font-fredoka text-2xl font-bold text-stone-800 mb-5">Design your openings</h2>

      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">Window Style</p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {windowOptions.map((o, i) => {
          const isSelected = selectedWindows === o.uniqueId || pickedId === o.uniqueId;
          return (
            <motion.button key={o.uniqueId} onClick={() => onWindowSelect(o.uniqueId, o.answerValue)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${isSelected
                ? 'bg-amber-50 border-amber-400 shadow-[0_3px_0_#d97706]'
                : 'bg-white border-stone-200 shadow-[0_3px_0_#d6d3d1] hover:border-amber-300'}`}>
              <div className="text-2xl mb-1">{windowEmojis[i % windowEmojis.length]}</div>
              <div className="font-fredoka font-bold text-stone-700 text-xs">{o.answerValue}</div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">Door Style</p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {doorOptions.map((o, i) => {
          const isSelected = selectedDoor === o.uniqueId || pickedId === o.uniqueId;
          return (
            <motion.button key={o.uniqueId} onClick={() => onDoorSelect(o.uniqueId, o.answerValue)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${isSelected
                ? 'bg-amber-50 border-amber-400 shadow-[0_3px_0_#d97706]'
                : 'bg-white border-stone-200 shadow-[0_3px_0_#d6d3d1] hover:border-amber-300'}`}>
              <div className="text-2xl mb-1">{doorEmojis[i % doorEmojis.length]}</div>
              <div className="font-fredoka font-bold text-stone-700 text-xs">{o.answerValue}</div>
            </motion.button>
          );
        })}
      </div>

      <motion.button onClick={onComplete} disabled={!canProceed} whileTap={{ scale: 0.97 }}
        className={`w-full py-5 font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl transition-all ${
          canProceed
            ? 'bg-amber-400 text-white border-b-4 border-amber-600 shadow-[0_4px_0_#b45309] hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed border-b-4 border-stone-300'
        }`}>
        Paint the House 🎨
      </motion.button>
    </StageWrapper>
  );
}

function PaintLandscapeStage({
  colorOptions, landscapeOptions, selectedColor, selectedLandscape, pickedId,
  onColorSelect, onLandscapeSelect, onComplete, accentColor,
}: {
  colorOptions: Array<{ uniqueId: string; answerValue: string }>;
  landscapeOptions: Array<{ uniqueId: string; answerValue: string }>;
  selectedColor: string; selectedLandscape: string; pickedId: string | null;
  onColorSelect: (uid: string, val: string) => void;
  onLandscapeSelect: (uid: string, val: string) => void;
  onComplete: () => void;
  accentColor: string;
}) {
  const canProceed = selectedColor && selectedLandscape;
  const bgPaints = ['#f1f5f9', '#bfdbfe', '#fef3c7', '#bbf7d0'];
  const borderPaints = ['#cbd5e1', '#3b82f6', '#f59e0b', '#22c55e'];
  const landscapeEmojis = ['🌳', '🌸', '🌻'];

  return (
    <StageWrapper label="Paint & Garden" emoji="🎨" color={accentColor}>
      <h2 className="font-fredoka text-2xl font-bold text-stone-800 mb-5">Finish your home</h2>

      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">House Color</p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {colorOptions.map((o, i) => (
          <ColorCard key={o.uniqueId}
            name={o.answerValue}
            paintColor={bgPaints[i % bgPaints.length]}
            border={borderPaints[i % borderPaints.length]}
            isPicked={selectedColor === o.uniqueId || pickedId === o.uniqueId}
            onClick={() => onColorSelect(o.uniqueId, o.answerValue)}
          />
        ))}
      </div>

      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">Landscape</p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {landscapeOptions.map((o, i) => {
          const isSelected = selectedLandscape === o.uniqueId || pickedId === o.uniqueId;
          return (
            <motion.button key={o.uniqueId} onClick={() => onLandscapeSelect(o.uniqueId, o.answerValue)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${isSelected
                ? 'bg-amber-50 border-amber-400 shadow-[0_3px_0_#d97706]'
                : 'bg-white border-stone-200 shadow-[0_3px_0_#d6d3d1] hover:border-amber-300'}`}>
              <div className="text-2xl mb-1">{landscapeEmojis[i % landscapeEmojis.length]}</div>
              <div className="font-fredoka font-bold text-stone-700 text-xs">{o.answerValue}</div>
            </motion.button>
          );
        })}
      </div>

      <motion.button onClick={onComplete} disabled={!canProceed} whileTap={{ scale: 0.97 }}
        className={`w-full py-5 font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl transition-all ${
          canProceed
            ? 'bg-amber-400 text-white border-b-4 border-amber-600 shadow-[0_4px_0_#b45309] hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed border-b-4 border-stone-300'
        }`}>
        🏠 Almost Done!
      </motion.button>
    </StageWrapper>
  );
}

function FormCapture({ formData, setFormData, onSubmit }: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="w-20 h-20 bg-amber-100 rounded-[1.5rem] border-2 border-amber-300 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">🏠</span>
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-stone-800 mb-2">Almost home…</h2>
        <p className="text-stone-500 text-sm font-medium">Who&apos;s building this dream home?</p>
      </div>
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 ml-1">
            Name <span className="text-stone-400">(optional)</span>
          </label>
          <input type="text" value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Your name"
            className="w-full p-4 rounded-2xl border-2 border-stone-200 focus:border-amber-400 focus:ring-0 outline-none transition-all text-stone-800 font-bold text-sm shadow-[0_3px_0_#d6d3d1] focus:shadow-[0_3px_0_#d97706]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 ml-1">
            Email <span className="text-stone-400">(optional)</span>
          </label>
          <input type="email" value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
            className="w-full p-4 rounded-2xl border-2 border-stone-200 focus:border-amber-400 focus:ring-0 outline-none transition-all text-stone-800 font-bold text-sm shadow-[0_3px_0_#d6d3d1] focus:shadow-[0_3px_0_#d97706]"
          />
        </div>
      </div>
      <button onClick={onSubmit}
        className="w-full py-5 bg-amber-400 text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-amber-600 shadow-[0_4px_0_#b45309] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0">
        Add Windows & Door 🪟
      </button>
    </div>
  );
}

function CompletionStage({ xp }: { xp: number }) {
  return (
    <motion.div className="text-center py-12"
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
      <motion.div className="text-7xl mb-6"
        animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
        transition={{ duration: 0.8, repeat: 2, repeatDelay: 0.5 }}>
        🏠
      </motion.div>
      <h2 className="font-fredoka text-4xl font-bold mb-2" style={{ color: '#f59e0b' }}>Dream Home Built!</h2>
      <p className="text-stone-500 font-bold text-sm uppercase tracking-widest mb-6">Quest Complete!</p>
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-100 border-2 border-amber-300 rounded-2xl shadow-[0_3px_0_#d97706]"
      >
        <span className="text-2xl">🏆</span>
        <span className="font-fredoka font-black text-amber-700 text-xl"><motion.span key={xp} initial={{ scale: 1.3, color: '#f59e0b' }} animate={{ scale: 1, color: '#92400e' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP earned!</span>
      </motion.div>
      {/* Floating particles */}
      {['🏠', '🌳', '☀️', '🌸', '🏡'].map((e, i) => (
        <motion.div key={i} className="fixed pointer-events-none text-2xl"
          style={{ left: `${15 + i * 16}%`, top: '100%' }}
          animate={{ y: [0, -window.innerHeight - 100] }}
          transition={{ duration: 3 + i * 0.3, delay: i * 0.15, ease: 'easeOut' }}>
          {e}
        </motion.div>
      ))}
    </motion.div>
  );
}
