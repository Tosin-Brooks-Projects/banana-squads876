'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface EmojiSliderProps {
  value?: number;
  onChange: (value: number) => void;
  emojis?: string[];
  scale?: 5 | 10;
  labels?: { start: string; end: string };
}

const DEFAULT_EMOJIS_5 = ['😢', '😕', '😐', '🙂', '😊'];
const DEFAULT_EMOJIS_10 = ['😢', '😞', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳'];

export default function EmojiSlider({
  value,
  onChange,
  emojis,
  scale = 5,
  labels,
}: EmojiSliderProps) {
  const defaultEmojis = scale === 5 ? DEFAULT_EMOJIS_5 : DEFAULT_EMOJIS_10;
  const emojiSet = emojis && emojis.length === scale ? emojis : defaultEmojis;

  const [internalValue, setInternalValue] = useState<number>(value ?? Math.ceil(scale / 2));
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Sync with external value changes
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

  // Global mouse/touch event listeners for drag
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

  // Keyboard navigation
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

  const currentEmoji = emojiSet[internalValue - 1];
  const position = getPositionFromValue(internalValue);

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
            key={currentEmoji}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: isDragging ? 1.2 : 1, opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="text-5xl"
          >
            {currentEmoji}
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
          aria-label="Emoji rating slider"
        >
          {/* Track background */}
          <div className="absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2 bg-neutral-200 rounded-full shadow-inner">
            {/* Filled portion with gradient */}
            <motion.div
              className="absolute h-full bg-gradient-to-r from-brand-300 to-brand-500 rounded-full"
              initial={false}
              animate={{ width: `${position}%` }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          </div>

          {/* Dot markers for each position */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2">
            {emojiSet.map((_, index) => {
              const markerPosition = (index / (scale - 1)) * 100;
              const isActive = index + 1 === internalValue;
              const isPast = index + 1 < internalValue;

              return (
                <motion.button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInternalValue(index + 1);
                    onChange(index + 1);
                  }}
                  className={`absolute w-5 h-5 rounded-full border-2 transition-colors duration-150 ${
                    isActive
                      ? 'bg-brand-500 border-brand-600 shadow-lg'
                      : isPast
                        ? 'bg-brand-400 border-brand-500'
                        : 'bg-white border-neutral-300 hover:border-brand-400'
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
                  aria-label={`Rate ${index + 1} out of ${scale}`}
                />
              );
            })}
          </div>

          {/* Draggable thumb (larger, more visible) - centered on track */}
          <motion.div
            className={`absolute w-8 h-8 bg-white rounded-full shadow-lg border-4 border-brand-500 ${
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
