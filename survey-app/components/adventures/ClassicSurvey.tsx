'use client';

import { useState, useEffect } from 'react';
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

interface FormData {
  name: string;
  email: string;
}

export default function ClassicSurvey({
  questions,
  onComplete,
  onProgress,
  initialState,
  allowAnonymous = false,
}: ClassicSurveyProps) {
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage || 0);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>(
    initialState?.answers || {}
  );
  const [formData, setFormData] = useState<FormData>(
    initialState?.formData || { name: '', email: '' }
  );

  const totalStages = allowAnonymous ? questions.length : questions.length + 1;

  useEffect(() => {
    if (onProgress) {
      const answersArray: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));
      onProgress({
        currentStage,
        totalStages,
        answers: answersArray,
        adventureState: { currentStage, answers, formData },
        respondentName: formData.name || undefined,
        respondentEmail: formData.email || undefined,
      });
    }
  }, [currentStage, answers, formData, totalStages, onProgress]);

  const handleAnswer = (questionId: string, value: string | number | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (allowAnonymous && currentStage === questions.length - 1) {
      handleComplete();
      return;
    }
    if (currentStage < totalStages - 1) {
      setCurrentStage(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStage > 0) setCurrentStage(prev => prev - 1);
  };

  const handleComplete = () => {
    const responsesArray: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
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
                  transition={{ delay: index * 0.04 }}
                  onClick={() => handleAnswer(question.id, option)}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all font-bold text-sm active:translate-y-[2px] ${
                    selected
                      ? 'bg-duo-green/10 border-duo-green text-almost-black shadow-[0_3px_0_#46a302]'
                      : 'bg-white border-cloud-gray text-almost-black hover:border-duo-green/40 hover:bg-duo-green/5 shadow-[0_3px_0_#e5e5e5]'
                  }`}
                >
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
                    transition={{ delay: rating * 0.03 }}
                    onClick={() => handleAnswer(question.id, rating)}
                    className={`w-12 h-12 rounded-2xl font-black text-lg transition-all active:translate-y-[2px] ${
                      selected
                        ? 'bg-duo-green text-white border-b-4 border-[#46a302] shadow-none'
                        : 'bg-white text-almost-black border-2 border-cloud-gray shadow-[0_3px_0_#e5e5e5] hover:border-duo-green/40'
                    }`}
                  >
                    {rating}
                  </motion.button>
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar: brand + progress */}
      <div className="w-full px-4 pt-6 pb-4 max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-4">
          {/* Back chevron */}
          <button
            onClick={handleBack}
            disabled={currentStage === 0}
            className="flex-shrink-0 w-10 h-10 rounded-2xl border-2 border-cloud-gray shadow-[0_3px_0_#e5e5e5] flex items-center justify-center text-graphite disabled:opacity-30 transition-all active:translate-y-[2px] active:shadow-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-4 bg-cloud-gray rounded-full overflow-hidden border-2 border-cloud-gray">
            <motion.div
              className="h-full bg-duo-green rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Counter */}
          <span className="flex-shrink-0 text-[10px] font-black text-graphite uppercase tracking-wider">
            {Math.min(currentStage + 1, questions.length)}/{questions.length}
          </span>
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
              /* ── Contact info stage ──────────────────────────────── */
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-20 h-20 bg-duo-green/10 rounded-[1.5rem] border-2 border-duo-green/20 flex items-center justify-center mx-auto mb-5"
                  >
                    <svg className="w-10 h-10 text-duo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h2 className="font-fredoka text-3xl font-bold text-almost-black mb-2">Almost there!</h2>
                  <p className="text-graphite text-sm font-medium">Leave your details or submit anonymously.</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
                      Name <span className="text-silver">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-graphite uppercase tracking-widest mb-2 ml-1">
                      Email <span className="text-silver">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full p-4 rounded-2xl border-2 border-cloud-gray focus:border-duo-green focus:ring-0 outline-none transition-all text-almost-black font-bold text-sm shadow-[0_3px_0_#e5e5e5] focus:shadow-[0_3px_0_#46a302]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-5 bg-duo-green text-white font-fredoka font-bold text-xl uppercase tracking-widest rounded-2xl border-b-4 border-[#46a302] shadow-[0_4px_0_#3f8f01] transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none active:border-b-0"
                >
                  Submit Response 🎉
                </button>
              </div>

            ) : currentQuestion ? (
              /* ── Question stage ──────────────────────────────────── */
              <div className="flex-1 flex flex-col">
                {/* Question number pill */}
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-duo-green/10 text-duo-green text-[10px] font-black uppercase tracking-widest rounded-full border border-duo-green/20">
                    Question {currentStage + 1}
                    {currentQuestion.required && <span className="text-duo-green/60">· Required</span>}
                  </span>
                </div>

                {/* Question text */}
                <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-almost-black leading-tight mb-7">
                  {currentQuestion.question}
                </h2>

                {/* Answer options */}
                <div className="flex-1">
                  {renderQuestion(currentQuestion)}
                </div>

                {/* Next / Submit button */}
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

      {/* Footer branding */}
      <div className="py-6 text-center">
        <a
          href="https://unboringsurveys.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-fredoka text-sm font-bold text-silver hover:text-duo-green transition-colors"
        >
          Unboring<span className="text-duo-green">.</span>
        </a>
      </div>
    </div>
  );
}
