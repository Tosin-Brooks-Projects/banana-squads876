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

  // If anonymous, skip the contact info stage
  const totalStages = allowAnonymous ? questions.length : questions.length + 1;

  // Report progress
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
    // If anonymous and on last question, submit directly
    if (allowAnonymous && currentStage === questions.length - 1) {
      handleComplete();
      return;
    }
    if (currentStage < totalStages - 1) {
      setCurrentStage(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStage > 0) {
      setCurrentStage(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    const responsesArray: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    // Add name and email if provided
    if (formData.name) {
      responsesArray.push({ questionId: '_name', value: formData.name });
    }
    if (formData.email) {
      responsesArray.push({ questionId: '_email', value: formData.email });
    }

    onComplete(responsesArray);
  };

  const currentQuestion = questions[currentStage];
  const isLastQuestion = currentStage === questions.length - 1;
  const isCompletionStage = !allowAnonymous && currentStage === questions.length;
  const progress = ((currentStage + 1) / totalStages) * 100;

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleAnswer(question.id, option)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${currentAnswer === option
                  ? 'border-brand-500 bg-brand-50 text-brand-900'
                  : 'border-neutral-200 bg-white text-gray-900 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
              >
                <span className="font-medium !text-black" style={{ color: 'black' }}>{option}</span>
              </motion.button>
            ))}
          </div>
        );

      case 'rating':
        const scale = question.scale || 5;
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-neutral-500">
              <span>{question.startLabel || 'Poor'}</span>
              <span>{question.endLabel || 'Excellent'}</span>
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: scale }, (_, i) => i + 1).map((rating) => (
                <motion.button
                  key={rating}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: rating * 0.03 }}
                  onClick={() => handleAnswer(question.id, rating)}
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${currentAnswer === rating
                    ? 'bg-brand-500 text-white scale-110 shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  {rating}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || 'Type your answer here...'}
            maxLength={question.maxLength || 1000}
            className="w-full p-4 rounded-xl border-2 border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none min-h-[120px] !text-black"
            style={{ color: 'black' }}
          />
        );

      case 'emoji-slider':
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

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (isCompletionStage) return true;
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    if (answer === undefined || answer === null || answer === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-neutral-500 mb-2">
            <span>Question {Math.min(currentStage + 1, questions.length)} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 sm:p-8"
          >
            {isCompletionStage ? (
              // Contact info / completion stage
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Almost done!</h2>
                  <p className="text-neutral-600">Add your contact info (optional) or submit your response.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full p-3 rounded-xl border-2 border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all !text-black"
                      style={{ color: 'black' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full p-3 rounded-xl border-2 border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all !text-black"
                      style={{ color: 'black' }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 py-3 px-6 rounded-xl border-2 border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex-1 py-3 px-6 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-all"
                  >
                    Submit Response
                  </button>
                </div>
              </div>
            ) : currentQuestion ? (
              // Question stage
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                    {currentQuestion.question}
                    {currentQuestion.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h2>
                </div>

                {renderQuestion(currentQuestion)}

                <div className="flex gap-3 pt-4">
                  {currentStage > 0 && (
                    <button
                      onClick={handleBack}
                      className="py-3 px-6 rounded-xl border-2 border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-all"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${canProceed()
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      }`}
                  >
                    {isLastQuestion ? (allowAnonymous ? 'Submit' : 'Continue') : 'Next'}
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* Branding */}
        <div className="mt-8 text-center text-sm text-neutral-400">
          Powered by{' '}
          <a
            href="https://unboringsurveys.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 hover:text-brand-600 transition-colors"
          >
            Unboring Surveys
          </a>
        </div>
      </div>
    </div>
  );
}
