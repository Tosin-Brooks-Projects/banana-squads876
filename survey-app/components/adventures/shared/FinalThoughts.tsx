'use client';

import { motion } from 'framer-motion';

interface FinalThoughtsProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  theme: 'ice-cream' | 'pizza' | 'garden' | 'home' | 'coffee';
  respondentName?: string;
}

const themeConfig = {
  'ice-cream': {
    title: 'Any final thoughts?',
    subtitle: 'Before we add the cherry on top...',
    placeholder: 'Share any additional thoughts or feedback...',
    emoji: '🍒',
    buttonText: 'Add the Cherry!',
    bgGradient: 'from-pink-50 to-purple-50',
    borderColor: 'border-pink-200',
    focusRing: 'focus:ring-pink-200 focus:border-pink-400',
    buttonBg: 'bg-pink-500 hover:bg-pink-600',
  },
  'pizza': {
    title: 'Any final thoughts?',
    subtitle: 'Before we put your pizza in the oven...',
    placeholder: 'Share any additional thoughts or feedback...',
    emoji: '🍕',
    buttonText: 'Start Baking!',
    bgGradient: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    focusRing: 'focus:ring-orange-200 focus:border-orange-400',
    buttonBg: 'bg-orange-500 hover:bg-orange-600',
  },
  'garden': {
    title: 'Any final thoughts?',
    subtitle: 'Before we watch your garden grow...',
    placeholder: 'Share any additional thoughts or feedback...',
    emoji: '🌱',
    buttonText: 'Plant the Seeds!',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    focusRing: 'focus:ring-green-200 focus:border-green-400',
    buttonBg: 'bg-green-500 hover:bg-green-600',
  },
  'home': {
    title: 'Any final thoughts?',
    subtitle: 'Before we reveal your dream home...',
    placeholder: 'Share any additional thoughts or feedback...',
    emoji: '🏠',
    buttonText: 'See Your Home!',
    bgGradient: 'from-purple-50 to-indigo-50',
    borderColor: 'border-purple-200',
    focusRing: 'focus:ring-purple-200 focus:border-purple-400',
    buttonBg: 'bg-purple-500 hover:bg-purple-600',
  },
  'coffee': {
    title: 'Any final thoughts?',
    subtitle: 'Before we brew your perfect cup...',
    placeholder: 'Share any additional thoughts or feedback...',
    emoji: '☕',
    buttonText: 'Start Brewing!',
    bgGradient: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    focusRing: 'focus:ring-amber-200 focus:border-amber-400',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
  },
};

export default function FinalThoughts({
  value,
  onChange,
  onContinue,
  onBack,
  theme,
  respondentName,
}: FinalThoughtsProps) {
  const config = themeConfig[theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className={`bg-gradient-to-br ${config.bgGradient} rounded-2xl p-6 shadow-lg border ${config.borderColor}`}>
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl block mb-2">{config.emoji}</span>
          <h2 className="text-xl font-bold text-gray-800">
            {respondentName ? `Almost done, ${respondentName}!` : config.title}
          </h2>
          <p className="text-gray-600 text-sm mt-1">{config.subtitle}</p>
        </div>

        {/* Text area */}
        <div className="mb-6">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            className={`w-full px-4 py-3 rounded-xl border ${config.borderColor} ${config.focusRing} focus:outline-none focus:ring-2 resize-none text-gray-700 placeholder-gray-400`}
          />
          <p className="text-xs text-gray-400 mt-2 text-center">This is optional - feel free to skip!</p>
        </div>

        {/* Continue button */}
        <div className="flex gap-3">
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 ${config.buttonBg} text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-colors`}
          >
            {config.buttonText}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
