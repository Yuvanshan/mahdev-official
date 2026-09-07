import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  CalendarHeart,
  Film,
  Code2,
  Plane,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppBootLoaderProps {
  message?: string;
  subtext?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export const AppBootLoader: React.FC<AppBootLoaderProps> = ({
  message = 'Loading Mahdev Enterprise',
  subtext = 'Synchronizing real-time Firestore collections & division data...',
  error = null,
  onRetry,
}) => {
  const [activeDivisionIndex, setActiveDivisionIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  const divisionStages = [
    {
      id: 'sws',
      name: 'SWS Event Management',
      shortName: 'Events & Galas',
      icon: CalendarHeart,
      color: '#0052FF',
      badge: 'Primary Division',
      statusText: 'Connecting stage design & event production pipelines...',
    },
    {
      id: 'u1',
      name: 'U1 Studio Cinema',
      shortName: 'Studio & Cinema',
      icon: Film,
      color: '#E11D48',
      badge: 'Media & 8K Film',
      statusText: 'Loading cinema portfolio, color grading & media vaults...',
    },
    {
      id: 'it',
      name: 'IT & Cloud Solutions',
      shortName: 'Tech & Engineering',
      icon: Code2,
      color: '#2563EB',
      badge: 'Cloud & AI Systems',
      statusText: 'Initializing cloud infrastructure, APIs & portals...',
    },
    {
      id: 'travels',
      name: 'Mahdev Travels & Tour',
      shortName: 'Travels & Fleet',
      icon: Plane,
      color: '#059669',
      badge: 'VIP Expeditions',
      statusText: 'Synchronizing expedition itineraries & luxury fleet...',
    },
    {
      id: 'mart',
      name: 'Mahdev Online Mart',
      shortName: 'Decor & Smart Tech',
      icon: ShoppingBag,
      color: '#7C3AED',
      badge: 'Event Decor & Smart Tech',
      statusText: 'Hydrating verified product catalog & checkout engine...',
    },
  ];

  useEffect(() => {
    if (error) return;

    const interval = setInterval(() => {
      setActiveDivisionIndex((prev) => {
        const next = (prev + 1) % divisionStages.length;
        setProgress(((next + 1) / divisionStages.length) * 100);
        return next;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [error, divisionStages.length]);

  const currentStage = divisionStages[activeDivisionIndex];

  return (
    <div
      id="app-boot-loader"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white select-none px-4 overflow-hidden"
      role="status"
      aria-label="Loading application"
    >
      {/* Ambient background glow nodes */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#0052FF]/20 blur-[130px] pointer-events-none -top-32 -left-32 animate-pulse" />
      <div
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[130px] pointer-events-none -bottom-32 -right-32 animate-pulse"
        style={{ animationDuration: '4s' }}
      />

      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center">
        {error ? (
          /* Error State Fallback */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl max-w-md w-full"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-5 shadow-lg">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <h2 className="text-xl font-bold font-display text-white tracking-tight mb-2">
              Connection Synchronizing
            </h2>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              We encountered a delay synchronizing Cloud Firestore. Please retry to refresh the live connection.
            </p>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0045D8] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            )}

            {error.message && (
              <p className="text-[10px] font-mono text-slate-500 mt-4 max-w-xs truncate bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                {error.message}
              </p>
            )}
          </motion.div>
        ) : (
          /* High-Craft 5-Division Animated Spotlight Loader */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full"
          >
            {/* Monogram Brand Header using PNG Asset */}
            <div className="relative mb-6 flex items-center justify-center">
              {/* Outer Pulse */}
              <div className="absolute -inset-6 rounded-full bg-[#0052FF]/30 blur-2xl animate-pulse" />

              {/* Rotating Orbit Accent Rings */}
              <div
                className="absolute -inset-4 rounded-full border border-blue-500/30 border-t-[#0052FF] border-r-blue-400 animate-spin"
                style={{ animationDuration: '3.5s' }}
              />
              <div
                className="absolute -inset-2 rounded-full border border-dashed border-blue-400/20 animate-spin"
                style={{ animationDuration: '7s', animationDirection: 'reverse' }}
              />

              {/* Main Glowing Brand Plaque with PNG Icon */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/40 shadow-2xl shadow-blue-500/25 flex items-center justify-center overflow-hidden p-3">
                <img
                  src="/brand-assets/mahdev-symbol.png"
                  alt="Mahdev"
                  className="w-12 h-12 object-contain filter drop-shadow-md"
                  onError={(e) => {
                    // Fallback to /icon.png if /brand-assets/mahdev-symbol.png is missing
                    (e.target as HTMLImageElement).src = '/icon.png';
                  }}
                />
              </div>
            </div>

            {/* Corporate Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wider mb-3 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#0052FF] animate-ping" />
              <span>Mahdev Enterprise Group</span>
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight mb-2">
              {message}
            </h2>

            {/* Active Division Status Feedback */}
            <div className="h-10 mb-6 flex items-center justify-center px-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentStage.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md"
                >
                  <span className="text-blue-400 font-bold mr-1.5">{currentStage.name}:</span>
                  {currentStage.statusText}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* 5 Enterprise Division Spotlight Cards */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-md mb-6">
              {divisionStages.map((div, idx) => {
                const IconComponent = div.icon;
                const isActive = idx === activeDivisionIndex;
                const isPassed = idx < activeDivisionIndex;

                return (
                  <div
                    key={div.id}
                    className={`relative flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-950/80 border-[#0052FF] text-white shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-500/40'
                        : isPassed
                        ? 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    {/* Active highlight corner dot */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#0052FF] animate-ping" />
                    )}

                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-[#0052FF] text-white shadow-md'
                          : isPassed
                          ? 'bg-slate-800 text-blue-400'
                          : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate max-w-full">
                      {div.shortName.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Clean Glowing Progress Line (No generic shimmer) */}
            <div className="w-64 sm:w-80 h-1.5 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800 mb-6">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-[#0052FF] to-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Footer Trust Note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0052FF]" />
              <span>Real-time Cloud Firestore Data Stream</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
