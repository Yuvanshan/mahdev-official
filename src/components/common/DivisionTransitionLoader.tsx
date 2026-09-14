import React from 'react';
import { motion } from 'motion/react';
import { DIVISIONS } from '../../config/divisions';
import { DivisionId } from '../../types';
import { Sparkles } from 'lucide-react';

interface DivisionTransitionLoaderProps {
  divisionId?: string;
  divisionName?: string;
}

export const DivisionTransitionLoader: React.FC<DivisionTransitionLoaderProps> = ({
  divisionId,
  divisionName: explicitName,
}) => {
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

  const tagline =
    divConfig?.tagline ||
    (divisionId === 'sws'
      ? 'Creating Moments with Elegance & Distinction'
      : divisionId === 'u1'
      ? 'Capturing Memories in Cinema Perfection'
      : divisionId === 'it'
      ? 'Delivering Innovation & Cloud Solutions'
      : divisionId === 'travels'
      ? 'Luxury Expeditions & Bespoke Journeys'
      : divisionId === 'mart'
      ? 'Verified Hardware & Smart Living Solutions'
      : 'Creating Moments • Capturing Memories • Delivering Innovation');

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

  return (
    <div
      className="relative min-h-[85vh] w-full overflow-hidden bg-slate-50/80 backdrop-blur-md flex flex-col justify-start select-none"
      aria-busy="true"
      aria-label={`Preparing ${name}`}
    >
      {/* Dynamic Background Ambient Shimmer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Floating Centered Division Identity Card */}
      <div className="relative z-20 flex flex-col items-center justify-center pt-24 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-2xl shadow-blue-500/5 rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center"
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

          <h2 className="text-xl font-black tracking-tight text-slate-900 mb-1.5">
            {name}
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed mb-5">
            {tagline}
          </p>

          {/* Smooth Shimmer Progress Line */}
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
      </div>

      {/* Realistic Structural Shimmer Preview Layout */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-10 pointer-events-none opacity-60">
        {/* Hero Banner Shimmer */}
        <div className="w-full h-56 sm:h-72 rounded-3xl bg-linear-to-r from-slate-200/60 via-slate-100/70 to-slate-200/60 animate-pulse border border-slate-200/40 p-8 flex flex-col justify-end">
          <div className="w-48 h-6 rounded-xl bg-slate-300/60 mb-3" />
          <div className="w-80 max-w-full h-4 rounded-lg bg-slate-200" />
        </div>

        {/* 3-Column Service Card Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/50 bg-white/60 p-6 space-y-4 animate-pulse shadow-xs"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-200/80" />
              <div className="w-3/4 h-5 rounded-lg bg-slate-200" />
              <div className="space-y-2">
                <div className="w-full h-3 rounded-md bg-slate-100" />
                <div className="w-5/6 h-3 rounded-md bg-slate-100" />
              </div>
              <div className="w-24 h-8 rounded-xl bg-slate-200/60 mt-4" />
            </div>
          ))}
        </div>

        {/* Portfolio / Showcase Strip Shimmer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-36 rounded-2xl bg-linear-to-b from-slate-200/70 to-slate-100/50 animate-pulse border border-slate-200/40"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
