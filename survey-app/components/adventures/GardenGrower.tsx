'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

interface FormData { name: string; email: string }

interface SelectedChoices {
  soil: string;
  seed: string;
  watered: boolean;
  sunlight: number;
}

interface AnswerMap {
  [questionId: string]: { visualId: string | string[]; answerValue: string | string[] };
}

// ── Visual data ───────────────────────────────────────────────────────────────

const soilOptions = [
  { id: 'rich',   name: 'Rich Soil',  emoji: '🟫', desc: 'Nutrient-packed',  soilColor: '#5c3317' },
  { id: 'sandy',  name: 'Sandy Soil', emoji: '🏜️', desc: 'Great drainage',   soilColor: '#c8a96e' },
  { id: 'clay',   name: 'Clay Soil',  emoji: '🧱', desc: 'Retains moisture', soilColor: '#a0522d' },
  { id: 'compost',name: 'Compost',    emoji: '♻️', desc: 'Super enriched',   soilColor: '#3d2b0a' },
];

const seedOptions = [
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', desc: 'Tall & bright',    bloomEmoji: '🌻' },
  { id: 'rose',      name: 'Rose',      emoji: '🌹', desc: 'Classic beauty',   bloomEmoji: '🌹' },
  { id: 'daisy',     name: 'Daisy',     emoji: '🌼', desc: 'Cheerful & wild',  bloomEmoji: '🌼' },
  { id: 'tulip',     name: 'Tulip',     emoji: '🌷', desc: 'Elegant & bold',   bloomEmoji: '🌷' },
  { id: 'herb',      name: 'Herbs',     emoji: '🌿', desc: 'Useful & fragrant',bloomEmoji: '🌿' },
];

const COMBO_PHRASES = [
  'Great choice! 🌱', 'Green thumb! 🤌', 'Blooming lovely! 🌸',
  'Nature calls! 🍃', 'Soil approved! ✅', 'Growing strong! 💪',
];

const confettiColors = ['#58cc02', '#ffc700', '#1cb0f6', '#a570ff', '#34d399', '#e67348'];

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

// ── Garden scene ──────────────────────────────────────────────────────────────

function GardenScene({ selectedChoices, stage }: { selectedChoices: SelectedChoices; stage: number }) {
  const soilId = selectedChoices.soil.replace(/-\d+$/, '');
  const seedId = selectedChoices.seed.replace(/-\d+$/, '');
  const soil = soilOptions.find(s => s.id === soilId);
  const seed = seedOptions.find(s => s.id === seedId);

  const plantStage = stage >= 6
    ? seed?.bloomEmoji || '🌸'
    : stage >= 4
    ? '🌿'
    : stage >= 2
    ? '🌱'
    : stage >= 1
    ? '🫘'
    : null;

  const skyGradient = stage >= 4
    ? 'linear-gradient(to bottom, #87ceeb 0%, #b0e0ff 100%)'
    : stage >= 2
    ? 'linear-gradient(to bottom, #c8e6fa 0%, #dff0fa 100%)'
    : 'linear-gradient(to bottom, #e8f4fd 0%, #f0f8ff 100%)';

  return (
    <div className="relative w-52 h-52 sm:w-60 sm:h-60 mx-auto select-none">
      {/* Sky */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden border-2 border-cloud-gray shadow-[0_6px_0_rgba(0,0,0,0.06)]"
        style={{ background: skyGradient }}>

        {/* Sun */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              className="absolute top-3 right-4 text-3xl"
              initial={{ scale: 0, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block' }}
              >
                ☀️
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clouds when sunny */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              className="absolute top-5 left-3 text-xl opacity-70"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 0.7 }}
              transition={{ delay: 0.3 }}
            >
              ☁️
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soil strip at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 rounded-b-3xl"
          style={{ background: soil ? `linear-gradient(to bottom, ${soil.soilColor}cc, ${soil.soilColor})` : '#c8a96e' }}
        />

        {/* Water ripples */}
        <AnimatePresence>
          {stage === 2 && (
            <>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  style={{ left: `${25 + i * 20}%`, top: `55%` }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 30, opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, repeatDelay: 0.4 }}
                >
                  💧
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Plant */}
        <AnimatePresence>
          {plantStage && (
            <motion.div
              key={plantStage}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-5xl"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            >
              <motion.span
                animate={stage >= 4 ? { rotate: [-3, 3, -3] } : {}}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block' }}
              >
                {plantStage}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty hint */}
        {stage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-5xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              🌱
            </motion.span>
          </div>
        )}
      </div>

      {/* Glow ring when blooming */}
      {stage >= 6 && (
        <motion.div
          className="absolute -inset-2 rounded-[2rem]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, rgba(88,204,2,0.12) 0%, transparent 70%)' }}
        />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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

  const mappedSoilOptions = mapQuestionToVisualOptions(questions[0], soilOptions);
  const mappedSeedOptions = mapQuestionToVisualOptions(questions[1], seedOptions);

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
    addXp();
    setTimeout(() => {
      setIsWatering(false);
      setCurrentStage(allowAnonymous ? 4 : 3);
    }, 2000);
  };

  const handleSunlightChange = (value: number) => {
    setSelectedChoices(prev => ({ ...prev, sunlight: value }));
  };

  const handleSunlightConfirm = () => {
    if (questions[3]) {
      const level = selectedChoices.sunlight < 33 ? 'Low' : selectedChoices.sunlight < 66 ? 'Medium' : 'High';
      setAnswerMap(prev => ({ ...prev, [questions[3].id]: { visualId: level.toLowerCase(), answerValue: level } }));
    }
    addXp();
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
          setTimeout(() => setShowConfetti(false), 5000);
          return 100;
        }
        return prev + 1.2;
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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #f0fdf4 0%, #fafff7 100%)' }}>
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
              className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-cloud-gray bg-white shadow-[0_3px_0_#e5e5e5] flex items-center justify-center text-graphite disabled:opacity-20 active:translate-y-[2px] active:shadow-none transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 h-4 bg-white rounded-full overflow-hidden border-2 border-cloud-gray shadow-inner">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #58cc02 0%, #78e02a 100%)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </div>

            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-100 border-2 border-green-200 rounded-2xl">
              <span className="text-xs">🌱</span>
              <span className="font-fredoka font-bold text-sm text-almost-black"><motion.span key={xp} initial={{ scale: 1.4, color: '#22c55e' }} animate={{ scale: 1, color: '#1a1a1a' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP</span>
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
                  className="text-xs font-black text-duo-green uppercase tracking-widest"
                >
                  {comboText}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Garden scene ── */}
      {currentStage < 6 && (
        <div className="flex justify-center pt-4 pb-2">
          <GardenScene selectedChoices={selectedChoices} stage={currentStage} />
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
              <GardenStageWrapper emoji="🟫" label="Stage 1 · Soil">
                <StageQuestion question={questions[0]} fallback="Choose your soil type" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedSoilOptions.map((opt, i) => {
                    const visual = soilOptions.find(s => opt.uniqueId.startsWith(s.id)) || soilOptions[0];
                    return (
                      <GardenCard
                        key={opt.uniqueId}
                        emoji={visual.emoji}
                        name={opt.answerValue}
                        desc={visual.desc}
                        accentColor={visual.soilColor}
                        index={i}
                        isPicked={pickedId === opt.uniqueId}
                        onClick={() => handleSoilSelect(opt.uniqueId, opt.answerValue)}
                      />
                    );
                  })}
                </div>
              </GardenStageWrapper>
            )}

            {currentStage === 1 && (
              <GardenStageWrapper emoji="🫘" label="Stage 2 · Seed">
                <StageQuestion question={questions[1]} fallback="Pick your seed" />
                <div className="grid grid-cols-2 gap-3">
                  {mappedSeedOptions.map((opt, i) => {
                    const visual = seedOptions.find(s => opt.uniqueId.startsWith(s.id)) || seedOptions[0];
                    return (
                      <GardenCard
                        key={opt.uniqueId}
                        emoji={visual.emoji}
                        name={opt.answerValue}
                        desc={visual.desc}
                        accentColor="#58cc02"
                        index={i}
                        isPicked={pickedId === opt.uniqueId}
                        onClick={() => handleSeedSelect(opt.uniqueId, opt.answerValue)}
                      />
                    );
                  })}
                </div>
              </GardenStageWrapper>
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
              <GrowthStage isGrowing={isGrowing} progress={growthProgress} xp={xp} selectedChoices={selectedChoices} />
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

function GardenStageWrapper({ emoji, label, children }: { emoji: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-green-100 rounded-2xl shadow-[0_2px_0_#dcfce7]"
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

function GardenCard({
  emoji, name, desc, accentColor, index, isPicked, onClick,
}: {
  emoji: string; name: string; desc: string; accentColor: string;
  index: number; isPicked: boolean; onClick: () => void;
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
          ? 'border-duo-green bg-green-50 shadow-[0_4px_0_#46a302]'
          : 'border-green-100 bg-white shadow-[0_4px_0_#dcfce7] hover:border-duo-green/60 active:translate-y-[3px] active:shadow-none'
      }`}
    >
      {/* Color accent corner */}
      <div
        className="absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] opacity-10"
        style={{ background: accentColor }}
      />

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
    </motion.button>
  );
}

// ── Watering mini-game ────────────────────────────────────────────────────────

function WateringStage({
  question, watered, isWatering, onWater,
}: {
  question?: Question; watered: boolean; isWatering: boolean; onWater: () => void;
}) {
  const [tapCount, setTapCount] = useState(0);
  const TAPS_NEEDED = 3;

  const handleTap = () => {
    if (watered || isWatering) return;
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= TAPS_NEEDED) onWater();
  };

  const fillPct = Math.min((tapCount / TAPS_NEEDED) * 100, 100);

  return (
    <GardenStageWrapper emoji="💧" label="Stage 3 · Water">
      <StageQuestion question={question} fallback="Time to water your seed!" />

      <div className="flex flex-col items-center gap-6 py-4">
        {/* Watering can button */}
        <div className="relative">
          <motion.button
            onClick={handleTap}
            disabled={watered || isWatering}
            whileTap={!watered && !isWatering ? { scale: 0.88, rotate: -15 } : {}}
            animate={isWatering ? { rotate: [-20, -20] } : {}}
            className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-7xl transition-all select-none
              ${watered
                ? 'bg-green-100 border-2 border-green-200'
                : 'bg-white border-4 border-sky-200 shadow-[0_6px_0_#bae6fd] hover:shadow-[0_8px_0_#7dd3fc] active:shadow-none cursor-pointer'
              }`}
          >
            {watered ? '✅' : '🪣'}
          </motion.button>

          {/* Animated water drops shooting out when tapping */}
          <AnimatePresence>
            {isWatering && [0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                className="absolute text-2xl pointer-events-none"
                style={{ left: '50%', top: '70%' }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (i - 2) * 22,
                  y: 50 + i * 8,
                  opacity: 0,
                }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
              >
                💧
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Tap prompt */}
        {!watered && !isWatering && (
          <div className="text-center space-y-3 w-full">
            <p className="font-fredoka font-bold text-graphite text-sm">
              {tapCount === 0 ? 'Tap the bucket to water! 💧' : `${TAPS_NEEDED - tapCount} more tap${TAPS_NEEDED - tapCount > 1 ? 's' : ''}!`}
            </p>
            {/* Fill bar */}
            <div className="w-full h-4 bg-sky-50 rounded-full border-2 border-sky-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7dd3fc 0%, #38bdf8 100%)' }}
                animate={{ width: `${fillPct}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: TAPS_NEEDED }, (_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  animate={{ background: i < tapCount ? '#38bdf8' : '#e0f2fe' }}
                  transition={{ type: 'spring' }}
                />
              ))}
            </div>
          </div>
        )}

        {isWatering && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-fredoka font-bold text-xl text-sky-500"
          >
            Watering… 💧
          </motion.p>
        )}

        {watered && !isWatering && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-fredoka font-bold text-xl text-duo-green"
          >
            Seeds watered! ✅
          </motion.p>
        )}
      </div>
    </GardenStageWrapper>
  );
}

// ── Sunlight slider ───────────────────────────────────────────────────────────

function SunlightStage({
  question, sunlight, onChange, onConfirm,
}: {
  question?: Question; sunlight: number; onChange: (v: number) => void; onConfirm: () => void;
}) {
  const isLow = sunlight < 33;
  const isMed = sunlight >= 33 && sunlight < 66;
  const level = isLow ? 'Shade' : isMed ? 'Partial Sun' : 'Full Sun';
  const levelEmoji = isLow ? '🌑' : isMed ? '🌤️' : '☀️';
  const levelColor = isLow ? '#94a3b8' : isMed ? '#fbbf24' : '#f97316';

  return (
    <GardenStageWrapper emoji="☀️" label="Stage 4 · Sunlight">
      <StageQuestion question={question} fallback="How much sun does your plant get?" />

      {/* Sky track */}
      <div className="relative h-20 rounded-3xl overflow-hidden border-2 border-cloud-gray mb-2"
        style={{ background: `linear-gradient(to right, #cbd5e1 0%, #fef08a 50%, #f97316 100%)` }}>
        {/* Moving sun */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 text-4xl pointer-events-none"
          style={{ left: `calc(${sunlight}% - 1.25rem)` }}
          animate={{
            filter: `drop-shadow(0 0 ${8 + sunlight / 5}px rgba(251,191,36,${0.4 + sunlight / 200}))`,
          }}
          transition={{ duration: 0.05 }}
        >
          ☀️
        </motion.div>
      </div>

      {/* Level label */}
      <div className="flex justify-center mb-4">
        <motion.span
          key={level}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-fredoka font-bold text-base border-2"
          style={{ background: `${levelColor}18`, color: levelColor, borderColor: `${levelColor}40` }}
        >
          {levelEmoji} {level}
        </motion.span>
      </div>

      {/* Slider */}
      <input
        type="range" min="0" max="100" value={sunlight}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-5 rounded-full appearance-none cursor-pointer mb-6"
        style={{
          background: `linear-gradient(to right, #cbd5e1 0%, #fef08a ${sunlight / 2}%, #f97316 ${sunlight}%, #e5e5e5 ${sunlight}%, #e5e5e5 100%)`,
        }}
      />

      <motion.button
        onClick={onConfirm}
        whileTap={{ scale: 0.97 }}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-3xl border-b-4 border-[#46a302] shadow-[0_5px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[4px] active:shadow-none active:border-b-0 flex items-center justify-center gap-2"
      >
        <motion.span
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ display: 'inline-block' }}
        >
          🌱
        </motion.span>
        Watch It Grow!
      </motion.button>
    </GardenStageWrapper>
  );
}

// ── Form capture ──────────────────────────────────────────────────────────────

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
          🌿
        </motion.div>
        <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Almost blooming…</h2>
        <p className="text-graphite font-bold text-sm">Who&apos;s tending this garden?</p>
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
              className="w-full p-4 rounded-2xl border-2 border-green-100 bg-white focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#dcfce7] focus:shadow-[0_3px_0_#46a302]"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-3xl border-b-4 border-[#46a302] shadow-[0_5px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[4px] active:shadow-none active:border-b-0"
      >
        Set the Sunlight ☀️
      </button>
    </div>
  );
}

// ── Growth finale ─────────────────────────────────────────────────────────────

const GROWTH_STAGES = [
  { min: 0,  max: 20,  emoji: '🫘', label: 'Germinating…',    color: '#92400e' },
  { min: 20, max: 45,  emoji: '🌱', label: 'Sprouting!',       color: '#65a30d' },
  { min: 45, max: 70,  emoji: '🌿', label: 'Growing leaves…', color: '#16a34a' },
  { min: 70, max: 90,  emoji: '🌸', label: 'Budding…',         color: '#ec4899' },
  { min: 90, max: 100, emoji: '🌺', label: 'Blooming! 🎉',      color: '#f97316' },
];

function GrowthStage({
  isGrowing: _isGrowing, progress, xp, selectedChoices,
}: {
  isGrowing: boolean; progress: number; xp: number; selectedChoices: SelectedChoices;
}) {
  const seedId = selectedChoices.seed.replace(/-\d+$/, '');
  const seed = seedOptions.find(s => s.id === seedId);
  const growthStep = GROWTH_STAGES.findLast(s => progress >= s.min) ?? GROWTH_STAGES[0];

  if (progress >= 100) {
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
          {seed?.bloomEmoji || '🌸'}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-fredoka text-5xl font-bold text-duo-green mb-2"
        >
          Garden Bloomed!
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 border-2 border-green-200 rounded-2xl"
        >
          <span className="text-xl">🌱</span>
          <span className="font-fredoka font-bold text-almost-black text-lg"><motion.span key={xp} initial={{ scale: 1.3, color: '#22c55e' }} animate={{ scale: 1, color: '#1a1a1a' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP Earned!</span>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="text-center py-8">
      {/* Growing plant */}
      <div className="relative w-44 h-44 mx-auto mb-6">
        {/* Soil pot */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-20 rounded-b-3xl rounded-t-xl border-2 border-amber-200"
          style={{ background: 'linear-gradient(to bottom, #92400e, #78350f)' }}
        />
        {/* Sky / plant area */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-28 rounded-t-3xl border-2 border-sky-100 overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #e0f2fe, #f0fdf4)' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={growthStep.emoji}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 text-5xl pb-1"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <motion.span
                animate={{ rotate: [-4, 4, -4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block' }}
              >
                {growthStep.emoji}
              </motion.span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Stage label */}
      <motion.div
        key={growthStep.label}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4"
      >
        <h2 className="font-fredoka text-3xl font-bold mb-1" style={{ color: growthStep.color }}>
          {growthStep.label}
        </h2>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full max-w-sm mx-auto h-5 bg-white rounded-full overflow-hidden border-2 border-green-100 shadow-inner mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #58cc02, ${growthStep.color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <p className="font-black text-graphite text-sm uppercase tracking-widest">
        {Math.round(progress)}% grown
      </p>

      {/* Floating leaf particles */}
      <div className="mt-4 flex justify-center gap-4">
        {['🍃', '🌿', '🍃'].map((leaf, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0], rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
            className="text-xl opacity-60"
            style={{ display: 'inline-block' }}
          >
            {leaf}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
