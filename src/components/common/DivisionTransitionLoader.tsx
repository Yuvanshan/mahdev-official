import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DIVISIONS } from '../../config/divisions';
import { Sparkles } from 'lucide-react';

interface DivisionTransitionLoaderProps {
  divisionId?: string;
  divisionName?: string;
}

const BRAND_TAGLINES = [
  'Creating Moments...',
  'Capturing Memories...',
  'Delivering Innovation....',
];

export const DivisionTransitionLoader: React.FC<DivisionTransitionLoaderProps> = ({
  divisionId,
  divisionName: explicitName,
}) => {
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % BRAND_TAGLINES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const divConfig = divisionId ? (DIVISIONS as any)[divisionId] : null;
  const name =
    explicitName ||
    divConfig?.name ||
    (divisionId === 'sws'
      ? 'SWS Event Management'
      : divisionId === 'u1'
      ? 'U1 Cinema & Studio'
      : divisionId === 'it'
      ? 'Mahdev IT & Software'
      : divisionId === 'travels'
      ? 'Mahdev Travels'
      : divisionId === 'mart'
      ? 'Mahdev Online Mart'
      : 'Enterprise Division');

  const accentColor =
    divConfig?.color ||
    (divisionId === 'sws'
      ? '#0052FF'
      : divisionId === 'u1'
      ? '#7C3AED'
      : divisionId === 'it'
      ? '#0284C7'
      : divisionId === 'travels'
      ? '#059669'
      : divisionId === 'mart'
      ? '#EA580C'
      : '#0052FF');

  const currentTagline = BRAND_TAGLINES[taglineIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none antialiased"
      aria-busy="true"
      aria-label={`Loading ${name}`}
    >
      {/* Dynamic Background Ambient Shimmer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Floating Centered Division Identity Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-20 bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl shadow-blue-500/10 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center flex flex-col items-center"
      >
        {/* Animated Division Halo */}
        <div className="relative mb-5">
          <div
            className="absolute inset-0 rounded-2xl blur-md opacity-40 animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-2">
          {name}
        </h2>

        {/* Animated Brand Tagline Switcher */}
        <div className="min-h-[28px] flex items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTagline}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="text-sm font-semibold text-slate-700 tracking-wide"
            >
              {currentTagline}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Smooth Continuous Shimmer Line (No Percentage) */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden relative">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accentColor }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* Subtle Corporate Micro-Footer */}
      <div className="absolute bottom-8 text-[11px] font-medium tracking-[0.15em] text-slate-200/80 drop-shadow-xs">
        Creating Moments • Capturing Memories • Delivering Innovation
      </div>
    </motion.div>
  );
};
