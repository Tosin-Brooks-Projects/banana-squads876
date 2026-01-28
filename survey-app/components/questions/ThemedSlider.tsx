'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface SliderTheme {
  name: string;
  visuals: string[]; // Emojis or text for each step
  colors: {
    track: string;     // Tailwind class for track background
    fill: string;      // Tailwind class for filled portion
    thumb: string;     // Tailwind class for thumb
    accent: string;    // Tailwind class for accent/hover
  };
}

// Pre-defined themes for each adventure
export const SLIDER_THEMES: Record<string, SliderTheme> = {
  classic: {
    name: 'Classic',
    visuals: ['😢', '😕', '😐', '🙂', '😊'],
    colors: {
      track: 'bg-neutral-200',
      fill: 'bg-brand-400',
      thumb: 'bg-brand-500',
      accent: 'ring-brand-300',
    },
  },
  'ice-cream-sundae': {
    name: 'Ice Cream',
    visuals: ['🍨', '🍦', '🍧', '🍨🍦', '🍨🍧🍦'],
    colors: {
      track: 'bg-pink-100',
      fill: 'bg-pink-400',
      thumb: 'bg-pink-500',
      accent: 'ring-pink-300',
    },
  },
  'pizza-builder': {
    name: 'Pizza',
    visuals: ['🍕', '🍕🍕', '🍕🍕🍕', '🍕🍕🍕🍕', '🍕🍕🍕🍕🍕'],
    colors: {
      track: 'bg-orange-100',
      fill: 'bg-orange-400',
      thumb: 'bg-orange-500',
      accent: 'ring-orange-300',
    },
  },
  'garden-grower': {
    name: 'Garden',
    visuals: ['🌱', '🌿', '🌷', '🌻', '🌸'],
    colors: {
      track: 'bg-green-100',
      fill: 'bg-green-400',
      thumb: 'bg-green-500',
      accent: 'ring-green-300',
    },
  },
  'dream-home': {
    name: 'Home',
    visuals: ['🏚️', '🏠', '🏡', '🏘️', '🏰'],
    colors: {
      track: 'bg-amber-100',
      fill: 'bg-amber-400',
      thumb: 'bg-amber-500',
      accent: 'ring-amber-300',
    },
  },
  'coffee-brewer': {
    name: 'Coffee',
    visuals: ['☕', '☕☕', '☕☕☕', '☕☕☕☕', '☕☕☕☕☕'],
    colors: {
      track: 'bg-amber-100',
      fill: 'bg-amber-600',
      thumb: 'bg-amber-700',
      accent: 'ring-amber-400',
    },
  },
};

// 10-point scale versions
export const SLIDER_THEMES_10: Record<string, SliderTheme> = {
  classic: {
    name: 'Classic',
    visuals: ['😢', '😞', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳'],
    colors: SLIDER_THEMES.classic.colors,
  },
  'ice-cream-sundae': {
    name: 'Ice Cream',
    visuals: ['🍨', '🍦', '🍧', '🍨🍦', '🍨🍧', '🍦🍧', '🍨🍦🍧', '🍨🍨🍦', '🍨🍧🍧🍦', '🎂'],
    colors: SLIDER_THEMES['ice-cream-sundae'].colors,
  },
  'pizza-builder': {
    name: 'Pizza',
    visuals: ['🍕', '🍕', '🍕🍕', '🍕🍕', '🍕🍕🍕', '🍕🍕🍕', '🍕🍕🍕🍕', '🍕🍕🍕🍕', '🍕🍕🍕🍕🍕', '🍕🍕🍕🍕🍕🍕'],
    colors: SLIDER_THEMES['pizza-builder'].colors,
  },
  'garden-grower': {
    name: 'Garden',
    visuals: ['🌱', '🌱🌱', '🌿', '🌿🌱', '🌷', '🌷🌿', '🌻', '🌻🌷', '🌸', '🌺🌸🌻'],
    colors: SLIDER_THEMES['garden-grower'].colors,
  },
  'dream-home': {
    name: 'Home',
    visuals: ['🏚️', '🛖', '🏠', '🏡', '🏘️', '🏛️', '🏰', '🏯', '🗼', '🏰🏯'],
    colors: SLIDER_THEMES['dream-home'].colors,
  },
  'coffee-brewer': {
    name: 'Coffee',
    visuals: ['☕', '☕', '☕☕', '☕☕', '☕☕☕', '☕☕☕', '☕☕☕☕', '☕☕☕☕', '☕☕☕☕☕', '🫖☕☕☕☕☕'],
    colors: SLIDER_THEMES['coffee-brewer'].colors,
  },
};

interface ThemedSliderProps {
  value?: number;
  onChange: (value: number) => void;
  theme?: string; // Adventure type
  customVisuals?: string[]; // Override visuals
  scale?: 5 | 10;
  labels?: { start: string; end: string };
}

export default function ThemedSlider({
  value,
  onChange,
  theme = 'classic',
  customVisuals,
  scale = 5,
  labels,
}: ThemedSliderProps) {
  const themeConfig = scale === 5
    ? SLIDER_THEMES[theme] || SLIDER_THEMES.classic
    : SLIDER_THEMES_10[theme] || SLIDER_THEMES_10.classic;

  const visuals = customVisuals && customVisuals.length === scale
    ? customVisuals
    : themeConfig.visuals;

  const [internalValue, setInternalValue] = useState<number>(value ?? Math.ceil(scale / 2));
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value, internalValue]);

  const getPositionFromValue = (val: number): number => {
    return ((val - 1) / (scale - 1)) * 100;
  };

  const getValueFromPosition = useCallback((clientX: number): number => {
    if (!sliderRef.current) return internalValue;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const rawValue = percentage * (scale - 1) + 1;
    return Math.round(rawValue);
  }, [scale, internalValue]);

  const handleSliderClick = (e: React.MouseEvent) => {
    const newValue = getValueFromPosition(e.clientX);
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newValue = getValueFromPosition(e.clientX);
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newValue = getValueFromPosition(e.clientX);
    if (newValue !== internalValue) {
      setInternalValue(newValue);
      onChange(newValue);
    }
  }, [isDragging, getValueFromPosition, internalValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const newValue = getValueFromPosition(touch.clientX);
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newValue = getValueFromPosition(touch.clientX);
    if (newValue !== internalValue) {
      setInternalValue(newValue);
      onChange(newValue);
    }
  }, [isDragging, getValueFromPosition, internalValue, onChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newValue = internalValue;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      newValue = Math.min(scale, internalValue + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      newValue = Math.max(1, internalValue - 1);
    } else if (e.key === 'Home') {
      newValue = 1;
    } else if (e.key === 'End') {
      newValue = scale;
    } else {
      return;
    }

    e.preventDefault();
    setInternalValue(newValue);
    onChange(newValue);
  };

  const currentVisual = visuals[internalValue - 1];
  const position = getPositionFromValue(internalValue);
  const { colors } = themeConfig;

  return (
    <div className="w-full space-y-2">
      {/* Labels at top */}
      {labels && (
        <div className="flex justify-between text-sm text-neutral-500 mb-2">
          <span>{labels.start}</span>
          <span>{labels.end}</span>
        </div>
      )}

      {/* Slider container with emoji above */}
      <div className="relative pt-16 pb-4">
        {/* Floating emoji that follows the slider position */}
        <motion.div
          className="absolute top-0 select-none pointer-events-none"
          initial={false}
          animate={{
            left: `${position}%`,
            x: '-50%',
          }}
          transition={{ duration: isDragging ? 0.05 : 0.2, ease: 'easeOut' }}
          style={{ zIndex: 20 }}
        >
          <motion.div
            key={currentVisual}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: isDragging ? 1.2 : 1, opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="text-5xl"
          >
            {currentVisual}
          </motion.div>
        </motion.div>

        {/* Slider track */}
        <div
          ref={sliderRef}
          className="relative h-10 cursor-pointer touch-none"
          onClick={handleSliderClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-valuemin={1}
          aria-valuemax={scale}
          aria-valuenow={internalValue}
          aria-label="Rating slider"
        >
          {/* Track background */}
          <div className={`absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2 ${colors.track} rounded-full shadow-inner`}>
            {/* Filled portion */}
            <motion.div
              className={`absolute h-full ${colors.fill} rounded-full`}
              initial={false}
              animate={{ width: `${position}%` }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          </div>

          {/* Step markers (dots) */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2">
            {Array.from({ length: scale }, (_, i) => {
              const markerPosition = (i / (scale - 1)) * 100;
              const isActive = i + 1 === internalValue;
              const isPast = i + 1 < internalValue;

              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInternalValue(i + 1);
                    onChange(i + 1);
                  }}
                  className={`absolute w-5 h-5 rounded-full border-2 transition-colors duration-150 ${
                    isActive
                      ? `${colors.thumb} border-white shadow-lg`
                      : isPast
                        ? `${colors.fill} border-white`
                        : `bg-white border-neutral-300 hover:border-neutral-400`
                  }`}
                  style={{
                    left: `${markerPosition}%`,
                    transform: 'translate(-50%, -50%)',
                    top: '50%',
                  }}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                  }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  whileHover={{ scale: isActive ? 1.3 : 1.15 }}
                  aria-label={`Rate ${i + 1} out of ${scale}`}
                />
              );
            })}
          </div>

          {/* Draggable thumb (larger, more visible) - centered on track */}
          <motion.div
            className={`absolute w-8 h-8 bg-white rounded-full shadow-lg border-4 ${colors.thumb.replace('bg-', 'border-')} ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            initial={false}
            animate={{
              left: `${position}%`,
              scale: isDragging ? 1.15 : 1,
            }}
            transition={{ duration: isDragging ? 0.05 : 0.15, ease: 'easeOut' }}
            style={{
              zIndex: 15,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>

      {/* Value display */}
      <div className="text-center">
        <span className="text-lg font-medium text-neutral-700">
          {internalValue} / {scale}
        </span>
      </div>
    </div>
  );
}
