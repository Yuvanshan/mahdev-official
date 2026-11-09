import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, XCircle } from 'lucide-react';
import type { Progress } from '../../services/customerAccountService';

/**
 * Animated step tracker for an order or booking ("Placed → Payment → … → Delivered").
 * Completed steps fill in one after another; a stopped order shows a single notice.
 */
export const ProgressTracker: React.FC<{ progress: Progress; className?: string }> = ({ progress, className = '' }) => {
  const reduceMotion = useReducedMotion();
  const { steps, current, stopped } = progress;

  if (stopped) {
    return (
      <div className={`flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ${className}`}>
        <XCircle className="h-4 w-4" aria-hidden="true" /> {stopped}
      </div>
    );
  }

  const percent = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;
  return (
    <div className={className} aria-label={`Progress: ${steps[current]?.label}`}>
      <div className="relative">
        {/* Track and animated fill behind the dots. */}
        <div className="absolute left-3 right-3 top-3 h-1 rounded-full bg-slate-200" aria-hidden="true" />
        <motion.div
          aria-hidden="true"
          className="absolute left-3 top-3 h-1 rounded-full bg-gradient-to-r from-[#0052FF] to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `calc((100% - 1.5rem) * ${percent / 100})` }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <ol className="relative flex justify-between">
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={step.key} className="flex w-14 flex-col items-center gap-1.5 text-center sm:w-20">
                <motion.span
                  initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: reduceMotion ? 0 : 0.12 * index, type: 'spring', stiffness: 320, damping: 20 }}
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : active
                        ? 'border-[#0052FF] bg-white text-[#0052FF]'
                        : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                  {active && !reduceMotion && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border-2 border-[#0052FF]"
                      animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </motion.span>
                <span className={`text-[10px] font-semibold leading-tight sm:text-[11px] ${active ? 'text-[#0052FF]' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
