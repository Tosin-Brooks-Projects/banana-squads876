"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

type LoadingState = {
  text: string;
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = true,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }
    const timeout = setTimeout(() => {
      setCurrentState((prev) =>
        loop
          ? prev === loadingStates.length - 1 ? 0 : prev + 1
          : Math.min(prev + 1, loadingStates.length - 1)
      );
    }, duration);
    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration]);

  const progress = Math.round(((currentState + 1) / loadingStates.length) * 100);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f5f5f5]/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white border border-[#e5e5e5] rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-[#f0f0f0]">
              {/* Wordmark */}
              <div className="flex items-center gap-0.5 mb-4">
                <span className="font-fredoka text-[18px] font-bold tracking-tight text-[#3c3c3c]">
                  Unboring
                </span>
                <span className="font-fredoka text-[18px] font-bold text-orange-500">.</span>
              </div>
              <p className="text-sm font-bold font-outfit text-[#3c3c3c] mb-0.5">
                Generating your survey
              </p>
              <p className="text-[12px] font-outfit text-[#afafaf]">
                AI is building your questions…
              </p>
            </div>

            {/* Steps */}
            <div className="px-6 py-4 space-y-3">
              {loadingStates.map((state, index) => {
                const isDone    = index < currentState;
                const isCurrent = index === currentState;
                const isFuture  = index > currentState;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: isFuture ? 0.35 : 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    {/* Icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isDone    ? 'bg-orange-500'   :
                      isCurrent ? 'bg-orange-100 border-2 border-orange-400' :
                                  'bg-[#f0f0f0]'
                    }`}>
                      {isDone ? (
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      ) : isCurrent ? (
                        <motion.div
                          className="w-2 h-2 rounded-full bg-orange-500"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#d0d0d0]" />
                      )}
                    </div>

                    {/* Label */}
                    <span className={`text-[13px] font-outfit transition-colors ${
                      isDone    ? 'text-[#afafaf] line-through'  :
                      isCurrent ? 'text-[#3c3c3c] font-bold'    :
                                  'text-[#c8c8c8]'
                    }`}>
                      {state.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="px-6 pb-6 pt-1">
              <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] font-outfit text-[#afafaf] mt-1.5 text-right tabular-nums">
                {progress}%
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
