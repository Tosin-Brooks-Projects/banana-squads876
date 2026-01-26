'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Question,
  QuestionType,
  MultipleChoiceQuestion,
  RatingQuestion,
  TextQuestion,
  isMultipleChoiceQuestion,
  isRatingQuestion,
  isTextQuestion,
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
        newQuestion = {
          ...base,
          type: 'text',
          placeholder: isTextQuestion(question) ? question.placeholder : '',
          maxLength: isTextQuestion(question) ? question.maxLength : undefined,
        };
        break;
    }

    onChange(newQuestion);
    setErrors({});
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
    // Re-validate after deletion
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

  // Delete confirmation
  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Get type icon
  const getTypeIcon = () => {
    const typeConfig = QUESTION_TYPES.find(t => t.value === question.type);
    return typeConfig?.icon || '?';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header - Always visible */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {/* Drag handle */}
        {showDragHandle && (
          <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        )}

        {/* Question number and type badge */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1">
            <span>{getTypeIcon()}</span>
            <span className="capitalize">{question.type.replace('-', ' ')}</span>
          </span>
          {question.required && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              Required
            </span>
          )}
          {/* Truncated question preview */}
          {!isExpanded && question.question && (
            <span className="text-sm text-gray-600 truncate">
              {question.question}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <motion.svg
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>

          {/* Delete button */}
          <AnimatePresence mode="wait">
            {showDeleteConfirm ? (
              <motion.button
                key="confirm"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleDelete}
                className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Confirm Delete
              </motion.button>
            ) : (
              <motion.button
                key="delete"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete question"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              {/* Question type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => changeType(type.value)}
                      className={`
                        px-3 py-1.5 text-sm rounded-lg border-2 transition-all flex items-center gap-1.5
                        ${question.type === type.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }
                      `}
                    >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestionText(e.target.value)}
                  onBlur={() => handleBlur('question')}
                  placeholder="Enter your question..."
                  className={`
                    w-full px-4 py-2 rounded-lg border transition-colors
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${errors.question && touched.question
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    }
                  `}
                />
                {errors.question && touched.question && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600"
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

              {/* Required toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Required question</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Multiple Choice Fields Component
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Options <span className="text-red-500">*</span>
        <span className="text-gray-400 font-normal ml-1">(minimum 2)</span>
      </label>
      <div className="space-y-2">
        {question.options.map((option, idx) => (
          <motion.div
            key={idx}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 text-xs">
              {idx + 1}
            </span>
            <input
              type="text"
              value={option}
              onChange={(e) => onUpdateOption(idx, e.target.value)}
              onBlur={onBlur}
              placeholder={`Option ${idx + 1}`}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
            />
            <button
              onClick={() => onDeleteOption(idx)}
              disabled={question.options.length <= 2}
              className={`
                p-1.5 rounded transition-colors
                ${question.options.length <= 2
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }
              `}
              title={question.options.length <= 2 ? 'Minimum 2 options required' : 'Delete option'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="mt-1 text-sm text-red-600"
        >
          {errors.options}
        </motion.p>
      )}
      <button
        onClick={onAddOption}
        className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add option
      </button>
    </div>
  );
}

// Rating Fields Component
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
    <div className="space-y-4">
      {/* Scale selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating Scale
        </label>
        <div className="flex gap-3">
          {([5, 10] as const).map((scale) => (
            <button
              key={scale}
              onClick={() => onUpdateScale(scale)}
              className={`
                px-4 py-2 rounded-lg border-2 transition-all
                ${question.scale === scale
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }
              `}
            >
              1 - {scale}
            </button>
          ))}
        </div>
      </div>

      {/* Scale preview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500 w-16 text-center truncate">
            {question.startLabel || 'Low'}
          </span>
          <div className="flex-1 flex justify-center gap-1">
            {Array.from({ length: question.scale }, (_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-400"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500 w-16 text-center truncate">
            {question.endLabel || 'High'}
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Label (optional)
          </label>
          <input
            type="text"
            value={question.startLabel || ''}
            onChange={(e) => onUpdateLabel('startLabel', e.target.value)}
            placeholder="e.g., Not satisfied"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Label (optional)
          </label>
          <input
            type="text"
            value={question.endLabel || ''}
            onChange={(e) => onUpdateLabel('endLabel', e.target.value)}
            placeholder="e.g., Very satisfied"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}

// Text Fields Component
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
    <div className="space-y-4">
      {/* Placeholder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Placeholder Text (optional)
        </label>
        <input
          type="text"
          value={question.placeholder || ''}
          onChange={(e) => onUpdatePlaceholder(e.target.value)}
          placeholder="e.g., Enter your answer here..."
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
        />
      </div>

      {/* Max length */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Maximum Length (optional)
        </label>
        <div className="flex items-center gap-3">
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
            className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
          />
          <span className="text-sm text-gray-500">characters</span>
        </div>
        {question.maxLength && (
          <p className="mt-1 text-xs text-gray-500">
            Respondents can enter up to {question.maxLength.toLocaleString()} characters
          </p>
        )}
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preview
        </label>
        <textarea
          disabled
          placeholder={question.placeholder || 'Enter your answer...'}
          maxLength={question.maxLength}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 resize-none"
          rows={3}
        />
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
