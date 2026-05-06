'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, Answer, OnProgressCallback, EmojiSliderQuestion } from '@/lib/types';
import ThemedSlider from '@/components/questions/ThemedSlider';

interface ClassicSurveyInitialState {
  currentStage: number;
  answers: Record<string, string | number | string[]>;
  formData: FormData;
}

interface ClassicSurveyProps {
  questions: Question[];
  onComplete: (responses: Answer[]) => void;
  onProgress?: OnProgressCallback;
  initialState?: ClassicSurveyInitialState;
  allowAnonymous?: boolean;
}

interface FormData { name: string; email: string; }

// ── XP system ──────────────────────────────────────────────────
const COMBO_PHRASES = ['Nice!', 'On fire!', 'Great answer!', 'Keep going!', 'Crushing it!', 'Legend!'];
const STREAK_THRESHOLDS = [3, 5, 7, 10];

function XPParticle({ id: _id, onDone }: { id: number; onDone: () => void }) {
  return (
    <motion.div
      className="fixed z-50 pointer-events-none font-fredoka font-black text-sm text-duo-green"
      style={{ top: '14%', left: '50%', translateX: '-50%' }}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -48 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      +10 XP ⭐
    </motion.div>
  );
}

// ── Answer feedback ─────────────────────────────────────────────
function AnswerFlash({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-duo-green text-white text-[10px] font-black uppercase tracking-wider rounded-full"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          Picked!
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Streak badge ────────────────────────────────────────────────
function StreakBadge({ streak }: { streak: number }) {
  if (!STREAK_THRESHOLDS.some(t => streak >= t)) return null;
  const label = streak >= 10 ? '10x 🔥🔥🔥' : streak >= 7 ? '7x 🔥🔥' : streak >= 5 ? '5x 🔥' : '3x 🔥';
  return (
    <motion.span
      key={streak}
      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full"
    >
      {label} Streak
    </motion.span>
  );
}

export default function ClassicSurvey({
  questions, onComplete, onProgress, initialState, allowAnonymous = false,
}: ClassicSurveyProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage || 0);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>(
    initialState?.answers || {}
  );
  const [formData, setFormData] = useState<FormData>(initialState?.formData || { name: '', email: '' });

  // XP state
  const [xp, setXp] = useState(0);
  const [particles, setParticles] = useState<number[]>([]);
  const [combo, setCombo] = useState('');
  const [streak, setStreak] = useState(0);
  const [flashId, setFlashId] = useState<string | null>(null);
  const particleCounter = useRef(0);
  const comboIdx = useRef(0);
  const answeredStages = useRef(new Set<number>());

  const addXp = useCallback(() => {
    setXp(p => p + 10);
    const id = ++particleCounter.current;
    setParticles(p => [...p, id]);
    setCombo(COMBO_PHRASES[comboIdx.current % COMBO_PHRASES.length]);
    comboIdx.current++;
    setTimeout(() => setCombo(''), 1200);
  }, []);

  const removeParticle = useCallback((id: number) => setParticles(p => p.filter(x => x !== id)), []);

  const awardAnswerXp = useCallback((questionId: string) => {
    if (flashId === questionId) return;
    setFlashId(questionId);
    setTimeout(() => setFlashId(null), 700);
    if (!answeredStages.current.has(currentStage)) {
      answeredStages.current.add(currentStage);
      addXp();
      setStreak(s => s + 1);
    }
  }, [flashId, currentStage, addXp]);

  const totalStages = allowAnonymous ? questions.length : questions.length + 1;

  useEffect(() => {
    if (onProgress) {
      const answersArray: Answer[] = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      onProgress({
        currentStage, totalStages, answers: answersArray,
        adventureState: { currentStage, answers, formData },
        respondentName: formData.name || undefined,
        respondentEmail: formData.email || undefined,
      });
    }
  }, [currentStage, answers, formData, totalStages, onProgress]);

  const handleAnswer = (questionId: string, value: string | number | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    awardAnswerXp(questionId);
  };

  const handleNext = () => {
    if (allowAnonymous && currentStage === questions.length - 1) { handleComplete(); return; }
    if (currentStage < totalStages - 1) setCurrentStage(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStage > 0) { setStreak(0); setCurrentStage(prev => prev - 1); }
  };

  const handleComplete = () => {
    const responsesArray: Answer[] = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
    if (formData.name) responsesArray.push({ questionId: '_name', value: formData.name });
    if (formData.email) responsesArray.push({ questionId: '_email', value: formData.email });
    onComplete(responsesArray);
  };

  const currentQuestion = questions[currentStage];
  const isLastQuestion = currentStage === questions.length - 1;
  const isCompletionStage = !allowAnonymous && currentStage === questions.length;
  const progress = ((currentStage + 1) / totalStages) * 100;

  const canProceed = () => {
    if (isCompletionStage) return true;
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    if (answer === undefined || answer === null || answer === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const selected = currentAnswer === option;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAnswer(question.id, option)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all font-bold text-sm ${
                    selected
                      ? 'bg-duo-green/10 border-duo-green text-almost-black shadow-[0_3px_0_#46a302]'
                      : 'bg-white border-cloud-gray text-almost-black hover:border-duo-green/40 hover:bg-duo-green/5 shadow-[0_3px_0_#e5e5e5]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        selected ? 'border-duo-green bg-duo-green' : 'border-cloud-gray'
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span>{option}</span>
                    </div>
                    <div className="flex-shrink-0">
                      <AnswerFlash show={selected && flashId === question.id} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        );

      case 'rating': {
        const scale = question.scale || 5;
        return (
          <div className="space-y-5">
            <div className="flex justify-between text-xs font-black text-graphite uppercase tracking-wider px-1">
              <span>{question.startLabel || 'Poor'}</span>
              <span>{question.endLabel || 'Excellent'}</span>
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {Array.from({ length: scale }, (_, i) => i + 1).map((rating) => {
                const selected = currentAnswer === rating;
                return (
                  <motion.button
                    key={rating}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: rating * 0.04 }}
                    onClick={() => handleAnswer(question.id, rating)}
                    whileTap={{ scale: 0.92 }}
                    className={`w-12 h-12 rounded-2xl font-black text-lg transition-all ${
                      selected
                        ? 'bg-duo-green text-white border-b-4 border-[#46a302] shadow-none scale-105'
                        : 'bg-white text-almost-black border-2 border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
                    }`}
                  >
                    {rating}
                  </motion.button>
                );
              })}
            </div>
            {/* Emoji indicators for rating feel */}
            <div className="flex justify-center gap-1 text-xl">
              {Array.from({ length: scale }, (_, i) => i + 1).map(r => {
                const emojis = ['😞', '😐', '🙂', '😊', '🤩'];
                const idx = Math.round(((r - 1) / (scale - 1)) * (emojis.length - 1));
                const isActive = currentAnswer !== undefined && r <= (currentAnswer as number);
                return (
                  <motion.span key={r} className={`transition-all ${isActive ? 'opacity-100 scale-110' : 'opacity-20'}`}
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}>
                    {emojis[idx]}
                  </motion.span>
                );
              })}
            </div>
          </div>
        );
      }

      case 'text':
        return (
          <textarea
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || 'Type your answer here...'}
            maxLength={question.maxLength || 1000}
            rows={4}
            className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all resize-none text-almost-black font-medium text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
          />
        );

      case 'emoji-slider': {
        const emojiQuestion = question as EmojiSliderQuestion;
        return (
          <ThemedSlider
            value={currentAnswer as number | undefined}
            onChange={(value) => handleAnswer(question.id, value)}
            theme="classic"
            customVisuals={emojiQuestion.emojis}
            scale={emojiQuestion.scale || 5}
            labels={emojiQuestion.labels}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #f0fdf4 0%, #ffffff 40%)' }}>
      {/* XP particles */}
      {particles.map(id => <XPParticle key={id} id={id} onDone={() => removeParticle(id)} />)}

      {/* Top bar */}
      <div className="w-full px-4 pt-6 pb-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBack}
            disabled={currentStage === 0}
            className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-cloud-gray shadow-[0_3px_0_#e5e5e5] flex items-center justify-center text-graphite disabled:opacity-30 transition-all active:translate-y-[2px] active:shadow-none bg-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 h-4 bg-cloud-gray rounded-full overflow-hidden border-2 border-cloud-gray">
            <motion.div
              className="h-full bg-duo-green rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* XP badge */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 border-2 border-duo-green/30 rounded-full shadow-[0_2px_0_#46a302]">
            <span className="text-xs">⭐</span>
            <span className="font-fredoka font-black text-duo-green text-sm"><motion.span key={xp} initial={{ scale: 1.4, color: '#86efac' }} animate={{ scale: 1, color: '#46a302' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP</span>
          </div>
        </div>

        {/* Combo / streak row */}
        <div className="h-5 flex items-center gap-2 px-1">
          <AnimatePresence>
            {combo && (
              <motion.span
                key={combo + xp}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs font-black uppercase tracking-widest text-duo-green"
              >
                {combo}
              </motion.span>
            )}
          </AnimatePresence>
          <StreakBadge streak={streak} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {isCompletionStage ? (
              /* ── Contact info stage ─────────────────────────────── */
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-20 h-20 bg-duo-green/10 rounded-[1.5rem] border-2 border-duo-green/20 flex items-center justify-center mx-auto mb-5"
                  >
                    <svg className="w-10 h-10 text-duo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Almost there!</h2>
                  <p className="text-graphite text-sm font-medium">Leave your details or submit anonymously.</p>
                  {/* XP earned so far */}
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-duo-green/10 border-2 border-duo-green/30 rounded-2xl"
                  >
                    <span className="text-lg">⭐</span>
                    <span className="font-fredoka font-black text-duo-green"><motion.span key={xp} initial={{ scale: 1.3, color: '#86efac' }} animate={{ scale: 1, color: '#46a302' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-block' }}>{xp}</motion.span> XP earned so far!</span>
                  </motion.div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
                      Name <span className="text-silver">(optional)</span>
                    </label>
                    <input type="text" value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
                      Email <span className="text-silver">(optional)</span>
                    </label>
                    <input type="email" value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
                    />
                  </div>
                </div>

                <button onClick={handleComplete}
                  className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0">
                  Submit Response 🎉
                </button>
              </div>

            ) : currentQuestion ? (
              /* ── Question stage ─────────────────────────────────── */
              <div className="flex-1 flex flex-col">
                {/* Stage badge */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 flex items-center gap-2"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
                    ⭐ Question {currentStage + 1}
                    {currentQuestion.required && <span className="text-duo-green/60">· Required</span>}
                  </span>
                  <span className="text-[10px] font-black text-graphite uppercase tracking-wider">
                    {currentStage + 1}/{questions.length}
                  </span>
                </motion.div>

                {/* Question text */}
                <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
                  {currentQuestion.question}
                </h2>

                {/* Answer */}
                <div className="flex-1">
                  {renderQuestion(currentQuestion)}
                </div>

                {/* XP micro-hint for unanswered required */}
                {currentQuestion.required && !answers[currentQuestion.id] && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                    className="text-center text-xs text-graphite mt-4 font-medium"
                  >
                    Answer to earn <span className="text-duo-green font-black">+10 XP</span> ⭐
                  </motion.p>
                )}

                {/* Next button */}
                <div className="pt-6 pb-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`w-full py-5 font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl transition-all ${
                      canProceed()
                        ? 'bg-duo-green text-white border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0'
                        : 'bg-cloud-gray text-silver cursor-not-allowed border-b-4 border-[#e5e5e5]'
                    }`}
                  >
                    {isLastQuestion ? (allowAnonymous ? 'Submit 🎉' : 'Continue') : 'Next →'}
                  </motion.button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <a href="https://unboringsurveys.com" target="_blank" rel="noopener noreferrer"
          className="font-fredoka text-sm font-bold text-silver hover:text-duo-green transition-colors">
          Unboring<span className="text-duo-green">.</span>
        </a>
      </div>
    </div>
  );
}
