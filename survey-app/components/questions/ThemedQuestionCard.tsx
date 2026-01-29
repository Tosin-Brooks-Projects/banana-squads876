'use client';

import { motion } from 'framer-motion';
import ThemedSlider from './ThemedSlider';
import { Question, EmojiSliderQuestion } from '@/lib/types';

// Theme color configurations that map to actual Tailwind classes
export const THEME_COLORS = {
  classic: {
    primary: 'bg-brand-500',
    primaryHover: 'hover:bg-brand-600',
    primaryText: 'text-brand-500',
    accent: 'bg-brand-50',
    accentBorder: 'border-brand-500',
    ring: 'focus:ring-brand-400',
    ratingActive: 'bg-brand-500 text-white',
    ratingInactive: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
  },
  'ice-cream-sundae': {
    primary: 'bg-pink-500',
    primaryHover: 'hover:bg-pink-600',
    primaryText: 'text-pink-500',
    accent: 'bg-pink-50',
    accentBorder: 'border-pink-500',
    ring: 'focus:ring-pink-400',
    ratingActive: 'bg-pink-500 text-white',
    ratingInactive: 'bg-pink-50 text-neutral-600 hover:bg-pink-100',
  },
  'pizza-builder': {
    primary: 'bg-orange-500',
    primaryHover: 'hover:bg-orange-600',
    primaryText: 'text-orange-500',
    accent: 'bg-orange-50',
    accentBorder: 'border-orange-500',
    ring: 'focus:ring-orange-400',
    ratingActive: 'bg-orange-500 text-white',
    ratingInactive: 'bg-orange-50 text-neutral-600 hover:bg-orange-100',
  },
  'garden-grower': {
    primary: 'bg-green-500',
    primaryHover: 'hover:bg-green-600',
    primaryText: 'text-green-500',
    accent: 'bg-green-50',
    accentBorder: 'border-green-500',
    ring: 'focus:ring-green-400',
    ratingActive: 'bg-green-500 text-white',
    ratingInactive: 'bg-green-50 text-neutral-600 hover:bg-green-100',
  },
  'dream-home': {
    primary: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    primaryText: 'text-amber-500',
    accent: 'bg-amber-50',
    accentBorder: 'border-amber-500',
    ring: 'focus:ring-amber-400',
    ratingActive: 'bg-amber-500 text-white',
    ratingInactive: 'bg-amber-50 text-neutral-600 hover:bg-amber-100',
  },
  'coffee-brewer': {
    primary: 'bg-amber-700',
    primaryHover: 'hover:bg-amber-800',
    primaryText: 'text-amber-700',
    accent: 'bg-amber-50',
    accentBorder: 'border-amber-700',
    ring: 'focus:ring-amber-500',
    ratingActive: 'bg-amber-700 text-white',
    ratingInactive: 'bg-amber-50 text-neutral-600 hover:bg-amber-100',
  },
};

interface ThemedQuestionCardProps {
  question: Question;
  value?: string | number | string[];
  onChange: (value: string | number | string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  theme: keyof typeof THEME_COLORS;
}

const buttonHoverVariants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: 'easeOut' as const }
  },
  tap: { scale: 0.98 }
};

export default function ThemedQuestionCard({
  question,
  value,
  onChange,
  onNext,
  onBack,
  theme,
}: ThemedQuestionCardProps) {
  const colors = THEME_COLORS[theme] || THEME_COLORS.classic;

  const canProceed = () => {
    if (!question.required) return true;
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'emoji-slider':
        const emojiQuestion = question as EmojiSliderQuestion;
        return (
          <ThemedSlider
            value={value as number | undefined}
            onChange={(v) => onChange(v)}
            theme={theme}
            customVisuals={emojiQuestion.emojis}
            scale={emojiQuestion.scale || 5}
            labels={emojiQuestion.labels}
          />
        );

      case 'rating':
        if ('scale' in question) {
          return (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>{question.startLabel || 'Poor'}</span>
                <span>{question.endLabel || 'Excellent'}</span>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                {Array.from({ length: question.scale || 5 }, (_, i) => i + 1).map((rating) => (
                  <motion.button
                    key={rating}
                    type="button"
                    onClick={() => onChange(rating)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-bold text-lg transition-all ${
                      value === rating
                        ? `${colors.ratingActive} scale-110 shadow-lg`
                        : colors.ratingInactive
                    }`}
                    whileHover={{ scale: value === rating ? 1.1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {rating}
                  </motion.button>
                ))}
              </div>
            </div>
          );
        }
        return null;

      case 'text':
        if ('placeholder' in question) {
          return (
            <textarea
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder || 'Type your answer here...'}
              maxLength={question.maxLength || 1000}
              className={`w-full p-4 rounded-xl border-2 border-neutral-200 focus:${colors.accentBorder} ${colors.ring} focus:ring-2 outline-none transition-all resize-none min-h-[120px]`}
            />
          );
        }
        return null;

      case 'multiple-choice':
        if ('options' in question) {
          return (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => onChange(option)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    value === option
                      ? `${colors.accentBorder} ${colors.accent} ${colors.primaryText}`
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="font-medium leading-snug" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>{option}</span>
                </motion.button>
              ))}
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-3 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        {question.question}
        {question.required && <span className={`${colors.primaryText} ml-1`}>*</span>}
      </h2>

      {renderQuestionContent()}

      <motion.button
        type="button"
        onClick={onNext}
        disabled={!canProceed()}
        className={`w-full mt-6 py-3 px-6 min-h-[48px] font-semibold rounded-lg
          transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.ring}
          ${canProceed()
            ? `${colors.primary} text-white ${colors.primaryHover}`
            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        variants={buttonHoverVariants}
        whileHover={canProceed() ? 'hover' : undefined}
        whileTap={canProceed() ? 'tap' : undefined}
      >
        Continue
      </motion.button>
    </div>
  );
}
