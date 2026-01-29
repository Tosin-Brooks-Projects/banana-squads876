'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Question,
  QuestionType,
  MultipleChoiceQuestion,
  RatingQuestion,
  TextQuestion,
  EmojiSliderQuestion,
  isMultipleChoiceQuestion,
  isRatingQuestion,
  isTextQuestion,
  isEmojiSliderQuestion,
} from '@/lib/types';

interface QuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
  onDelete: () => void;
  index?: number;
  showDragHandle?: boolean;
}

interface ValidationErrors {
  question?: string;
  options?: string;
  scale?: string;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'multiple-choice', label: 'Multiple Choice', icon: '○' },
  { value: 'rating', label: 'Rating', icon: '★' },
  { value: 'emoji-slider', label: 'Emoji Slider', icon: '😊' },
  { value: 'text', label: 'Text', icon: '¶' },
];

export default function QuestionEditor({
  question,
  onChange,
  onDelete,
  index = 0,
  showDragHandle = true,
}: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Validation
  const validate = useCallback((q: Question): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!q.question.trim()) {
      newErrors.question = 'Question text is required';
    }

    if (isMultipleChoiceQuestion(q)) {
      const validOptions = q.options.filter(o => o.trim());
      if (validOptions.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }
    }

    return newErrors;
  }, []);

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const newErrors = validate(question);
    setErrors(newErrors);
  };

  // Update question text
  const updateQuestionText = (text: string) => {
    onChange({ ...question, question: text });
    if (touched.question) {
      const newErrors = validate({ ...question, question: text });
      setErrors(newErrors);
    }
  };

  // Update required status
  const updateRequired = (required: boolean) => {
    onChange({ ...question, required });
  };

  // Change question type
  const changeType = (newType: QuestionType) => {
    let newQuestion: Question;

    const base = {
      id: question.id,
      question: question.question,
      required: question.required,
      order: question.order,
    };

    switch (newType) {
      case 'multiple-choice':
        newQuestion = {
          ...base,
          type: 'multiple-choice',
          options: isMultipleChoiceQuestion(question) ? question.options : ['Option 1', 'Option 2'],
        };
        break;
      case 'rating':
        newQuestion = {
          ...base,
          type: 'rating',
          scale: isRatingQuestion(question) ? question.scale : 5,
          startLabel: isRatingQuestion(question) ? question.startLabel : '',
          endLabel: isRatingQuestion(question) ? question.endLabel : '',
        };
        break;
      case 'text':
        const textQuestion: TextQuestion = {
          ...base,
          type: 'text',
          placeholder: isTextQuestion(question) ? question.placeholder : '',
        };
        if (isTextQuestion(question) && question.maxLength) {
          textQuestion.maxLength = question.maxLength;
        }
        newQuestion = textQuestion;
        break;
      case 'emoji-slider':
        const emojiSliderQuestion: EmojiSliderQuestion = {
          ...base,
          type: 'emoji-slider',
          scale: isEmojiSliderQuestion(question) ? question.scale : 5,
        };
        if (isEmojiSliderQuestion(question) && question.labels) {
          emojiSliderQuestion.labels = question.labels;
        }
        if (isEmojiSliderQuestion(question) && question.emojis) {
          emojiSliderQuestion.emojis = question.emojis;
        }
        newQuestion = emojiSliderQuestion;
        break;
    }

    onChange(newQuestion);
    setErrors({});
    setShowTypeDropdown(false);
  };

  // Multiple choice specific handlers
  const updateOption = (idx: number, value: string) => {
    if (!isMultipleChoiceQuestion(question)) return;
    const newOptions = [...question.options];
    newOptions[idx] = value;
    onChange({ ...question, options: newOptions });
  };

  const addOption = () => {
    if (!isMultipleChoiceQuestion(question)) return;
    onChange({ ...question, options: [...question.options, ''] });
  };

  const deleteOption = (idx: number) => {
    if (!isMultipleChoiceQuestion(question)) return;
    if (question.options.length <= 2) {
      setErrors(prev => ({ ...prev, options: 'Minimum 2 options required' }));
      return;
    }
    const newOptions = question.options.filter((_, i) => i !== idx);
    onChange({ ...question, options: newOptions });
    const newErrors = validate({ ...question, options: newOptions });
    setErrors(newErrors);
  };

  // Rating specific handlers
  const updateScale = (scale: 5 | 10) => {
    if (!isRatingQuestion(question)) return;
    onChange({ ...question, scale });
  };

  const updateRatingLabel = (field: 'startLabel' | 'endLabel', value: string) => {
    if (!isRatingQuestion(question)) return;
    onChange({ ...question, [field]: value });
  };

  // Text specific handlers
  const updatePlaceholder = (placeholder: string) => {
    if (!isTextQuestion(question)) return;
    onChange({ ...question, placeholder });
  };

  const updateMaxLength = (maxLength: number | undefined) => {
    if (!isTextQuestion(question)) return;
    onChange({ ...question, maxLength });
  };

  // Emoji slider specific handlers
  const updateEmojiScale = (scale: 5 | 10) => {
    if (!isEmojiSliderQuestion(question)) return;
    onChange({ ...question, scale });
  };

  const updateEmojiSliderLabel = (field: 'start' | 'end', value: string) => {
    if (!isEmojiSliderQuestion(question)) return;
    const currentLabels = question.labels || { start: '', end: '' };
    onChange({
      ...question,
      labels: { ...currentLabels, [field]: value },
    });
  };

  // Delete confirmation
  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Get type info - always returns a valid type (defaults to first type if not found)
  const currentTypeInfo = QUESTION_TYPES.find(t => t.value === question.type) ?? QUESTION_TYPES[0];

  // Get preview text for collapsed state
  const getPreviewText = () => {
    if (isMultipleChoiceQuestion(question)) {
      const validOptions = question.options.filter(o => o.trim());
      return validOptions.length > 0 ? `${validOptions.length} options` : 'No options';
    }
    if (isRatingQuestion(question)) {
      return `1-${question.scale} scale`;
    }
    if (isEmojiSliderQuestion(question)) {
      return `Emoji 1-${question.scale || 5}`;
    }
    if (isTextQuestion(question)) {
      return 'Free text';
    }
    return '';
  };

  // Check if question has validation issues
  const hasErrors = Object.keys(validate(question)).length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
        hasErrors ? 'border-amber-300' : 'border-gray-200'
      }`}
    >
      {/* Compact Header - Click to expand */}
      <div
        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
          isExpanded ? 'bg-gray-50 border-b border-gray-200' : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Drag handle */}
        {showDragHandle && (
          <div
            className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        )}

        {/* Question number */}
        <span className="text-xs font-semibold text-gray-400 w-6">Q{index + 1}</span>

        {/* Question text or placeholder */}
        <div className="flex-1 min-w-0">
          {question.question ? (
            <p className="text-sm text-gray-800 truncate">{question.question}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Enter your question...</p>
          )}
        </div>

        {/* Type badge - clickable dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            <span>{currentTypeInfo.icon}</span>
            <span className="hidden sm:inline">{currentTypeInfo.label}</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Type dropdown */}
          <AnimatePresence>
            {showTypeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]"
              >
                {QUESTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => changeType(type.value)}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                      question.type === type.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview info */}
        <span className="text-xs text-gray-400 hidden sm:block">{getPreviewText()}</span>

        {/* Required indicator */}
        {question.required && (
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Required" />
        )}

        {/* Error indicator */}
        {hasErrors && !isExpanded && (
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Needs attention" />
        )}

        {/* Expand icon */}
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>

        {/* Delete button */}
        <div onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {showDeleteConfirm ? (
              <motion.button
                key="confirm"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleDelete}
                className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete?
              </motion.button>
            ) : (
              <motion.button
                key="delete"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleDelete}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                title="Delete question"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Question text */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Question Text
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestionText(e.target.value)}
                  onBlur={() => handleBlur('question')}
                  placeholder="Enter your question..."
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border transition-colors
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${errors.question && touched.question
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
                    }
                  `}
                />
                {errors.question && touched.question && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-xs text-red-600"
                  >
                    {errors.question}
                  </motion.p>
                )}
              </div>

              {/* Type-specific fields */}
              {isMultipleChoiceQuestion(question) && (
                <MultipleChoiceFields
                  question={question}
                  onUpdateOption={updateOption}
                  onAddOption={addOption}
                  onDeleteOption={deleteOption}
                  errors={errors}
                  onBlur={() => handleBlur('options')}
                />
              )}

              {isRatingQuestion(question) && (
                <RatingFields
                  question={question}
                  onUpdateScale={updateScale}
                  onUpdateLabel={updateRatingLabel}
                />
              )}

              {isTextQuestion(question) && (
                <TextFields
                  question={question}
                  onUpdatePlaceholder={updatePlaceholder}
                  onUpdateMaxLength={updateMaxLength}
                />
              )}

              {isEmojiSliderQuestion(question) && (
                <EmojiSliderFields
                  question={question}
                  onUpdateScale={updateEmojiScale}
                  onUpdateLabel={updateEmojiSliderLabel}
                />
              )}

              {/* Required toggle - compact */}
              <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => updateRequired(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-600">Required</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Multiple Choice Fields Component - Compact
function MultipleChoiceFields({
  question,
  onUpdateOption,
  onAddOption,
  onDeleteOption,
  errors,
  onBlur,
}: {
  question: MultipleChoiceQuestion;
  onUpdateOption: (idx: number, value: string) => void;
  onAddOption: () => void;
  onDeleteOption: (idx: number) => void;
  errors: ValidationErrors;
  onBlur: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-2">
        Options
      </label>
      <div className="space-y-1.5">
        {question.options.map((option, idx) => (
          <motion.div
            key={idx}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-300 text-gray-400 text-xs">
              {idx + 1}
            </span>
            <input
              type="text"
              value={option}
              onChange={(e) => onUpdateOption(idx, e.target.value)}
              onBlur={onBlur}
              placeholder={`Option ${idx + 1}`}
              className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
            />
            <button
              onClick={() => onDeleteOption(idx)}
              disabled={question.options.length <= 2}
              className={`
                p-1 rounded transition-colors
                ${question.options.length <= 2
                  ? 'text-gray-200 cursor-not-allowed'
                  : 'text-gray-300 hover:text-red-500'
                }
              `}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </div>
      {errors.options && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-600"
        >
          {errors.options}
        </motion.p>
      )}
      <button
        onClick={onAddOption}
        className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add option
      </button>
    </div>
  );
}

// Rating Fields Component - Compact
function RatingFields({
  question,
  onUpdateScale,
  onUpdateLabel,
}: {
  question: RatingQuestion;
  onUpdateScale: (scale: 5 | 10) => void;
  onUpdateLabel: (field: 'startLabel' | 'endLabel', value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Scale selector */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Scale
        </label>
        <div className="flex gap-2">
          {([5, 10] as const).map((scale) => (
            <button
              key={scale}
              onClick={() => onUpdateScale(scale)}
              className={`
                px-3 py-1 text-xs rounded-lg border transition-all
                ${question.scale === scale
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }
              `}
            >
              1-{scale}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-400 w-12 truncate">
            {question.startLabel || 'Low'}
          </span>
          <div className="flex-1 flex justify-center gap-0.5">
            {Array.from({ length: question.scale }, (_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-[10px] text-gray-400"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-gray-400 w-12 text-right truncate">
            {question.endLabel || 'High'}
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Low label
          </label>
          <input
            type="text"
            value={question.startLabel || ''}
            onChange={(e) => onUpdateLabel('startLabel', e.target.value)}
            placeholder="e.g., Poor"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            High label
          </label>
          <input
            type="text"
            value={question.endLabel || ''}
            onChange={(e) => onUpdateLabel('endLabel', e.target.value)}
            placeholder="e.g., Excellent"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}

// Text Fields Component - Compact
function TextFields({
  question,
  onUpdatePlaceholder,
  onUpdateMaxLength,
}: {
  question: TextQuestion;
  onUpdatePlaceholder: (placeholder: string) => void;
  onUpdateMaxLength: (maxLength: number | undefined) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Placeholder text
        </label>
        <input
          type="text"
          value={question.placeholder || ''}
          onChange={(e) => onUpdatePlaceholder(e.target.value)}
          placeholder="e.g., Enter your answer..."
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Max length
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={question.maxLength || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
              onUpdateMaxLength(value && value > 0 ? value : undefined);
            }}
            placeholder="No limit"
            min={1}
            max={10000}
            className="w-24 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
          />
          <span className="text-xs text-gray-400">characters</span>
        </div>
      </div>
    </div>
  );
}

// Export validation helper for external use
export function validateQuestion(question: Question): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!question.question.trim()) {
    errors.question = 'Question text is required';
  }

  if (question.type === 'multiple-choice') {
    const validOptions = question.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      errors.options = 'At least 2 options are required';
    }
  }

  return errors;
}

// Export helper to check if question is valid
export function isQuestionValid(question: Question): boolean {
  const errors = validateQuestion(question);
  return Object.keys(errors).length === 0;
}

// Emoji Slider Fields Component - Compact
const DEFAULT_EMOJIS_5 = ['😢', '😕', '😐', '🙂', '😊'];

function EmojiSliderFields({
  question,
  onUpdateScale,
  onUpdateLabel,
}: {
  question: EmojiSliderQuestion;
  onUpdateScale: (scale: 5 | 10) => void;
  onUpdateLabel: (field: 'start' | 'end', value: string) => void;
}) {
  const emojis = question.emojis || DEFAULT_EMOJIS_5;
  const scale = question.scale || 5;

  return (
    <div className="space-y-3">
      {/* Scale selector */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Scale
        </label>
        <div className="flex gap-2">
          {([5, 10] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdateScale(s)}
              className={`
                px-3 py-1 text-xs rounded-lg border transition-all
                ${scale === s
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }
              `}
            >
              1-{s}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="flex justify-center items-center gap-1 mb-1">
          {emojis.slice(0, scale).map((emoji, i) => (
            <span
              key={i}
              className={`text-lg ${i === Math.floor(scale / 2) ? 'transform scale-110' : 'opacity-50'}`}
            >
              {emoji}
            </span>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>{question.labels?.start || 'Low'}</span>
          <span>{question.labels?.end || 'High'}</span>
        </div>
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Low label
          </label>
          <input
            type="text"
            value={question.labels?.start || ''}
            onChange={(e) => onUpdateLabel('start', e.target.value)}
            placeholder="e.g., Poor"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            High label
          </label>
          <input
            type="text"
            value={question.labels?.end || ''}
            onChange={(e) => onUpdateLabel('end', e.target.value)}
            placeholder="e.g., Excellent"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
