import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import type { ProfileCompletion } from '../../utils/profileCompletion';
import { ProgressRing } from './ProgressRing';

interface ProfileCompletionCardProps {
  completion: ProfileCompletion;
  onNavigate: (path: string) => void;
}

/**
 * Reminder at the top of the account pages. Missing required details (name, contact
 * number, NIC) show a prominent card that cannot be dismissed; when only optional
 * items are left, a smaller tip can be hidden for this visit.
 */
export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({ completion, onNavigate }) => {
  const [dismissed, setDismissed] = useState(false);
  if (completion.percent === 100) return null;
  const urgent = !completion.isComplete;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden"
        >
          <div
            className={`relative flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:p-6 ${
              urgent ? 'border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-white text-amber-600' : 'border-blue-100 bg-gradient-to-r from-blue-50 to-white text-[#0052FF]'
            }`}
          >
            <ProgressRing percent={completion.percent} size={68} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                {urgent ? <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" /> : <Sparkles className="h-4 w-4 text-blue-500" aria-hidden="true" />}
                {urgent ? 'Please complete your profile' : 'Almost there'}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {urgent
                  ? 'We need these details to confirm your bookings and orders.'
                  : 'A few optional details make checkout and bookings faster.'}
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {completion.items.map((item, index) => (
                  <motion.li
                    key={item.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      item.done
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.required
                          ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200'
                    }`}
                  >
                    {item.done && <Check className="h-3 w-3" aria-hidden="true" />}
                    {item.label}
                    {!item.done && item.required && <span className="sr-only"> (required)</span>}
                  </motion.li>
                ))}
              </ul>
            </div>
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(urgent ? '/account/complete' : '/account/profile')}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md ${
                urgent ? 'bg-amber-500 shadow-amber-500/25 hover:bg-amber-600' : 'bg-[#0052FF] shadow-blue-500/25 hover:bg-blue-700'
              }`}
            >
              {urgent ? 'Complete profile' : 'Finish profile'} <ArrowRight className="h-4 w-4" />
            </motion.button>
            {!urgent && (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600"
                aria-label="Hide for now"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
