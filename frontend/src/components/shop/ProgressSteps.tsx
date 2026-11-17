import React from 'react';
import { Check } from 'lucide-react';

interface ProgressStepsProps {
  steps: string[];
  /** Index of the current step; earlier steps show as done. A negative value shows none as done. */
  current: number;
  label: string;
}

// Horizontal stepper shared by checkout and order tracking (Flipkart stepper pattern).
export const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, current, label }) => (
  <ol aria-label={label} className="flex w-full items-start">
    {steps.map((step, index) => {
      const done = index < current;
      const active = index === current;
      return (
        <li key={step} aria-current={active ? 'step' : undefined} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
          {index > 0 && (
            <span aria-hidden="true" className={`absolute right-1/2 top-3.5 h-0.5 w-full ${index <= current ? 'bg-blue-600' : 'bg-slate-200'}`} />
          )}
          <span
            className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ${
              done ? 'border-blue-600 bg-blue-600 text-white' : active ? 'border-amber-400 bg-amber-400 text-blue-950' : 'border-slate-300 bg-white text-slate-400'
            }`}
          >
            {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
          </span>
          <span className={`px-1 text-[11px] font-medium sm:text-xs ${done || active ? 'text-slate-900' : 'text-slate-500'}`}>{step}</span>
        </li>
      );
    })}
  </ol>
);
