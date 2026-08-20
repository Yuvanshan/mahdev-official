import React, { useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface AppBootLoaderProps {
  message?: string;
  subtext?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export const AppBootLoader: React.FC<AppBootLoaderProps> = ({
  message = 'Initializing Mahdev Enterprise Ecosystem...',
  subtext = 'Synchronizing divisions, product catalogs, and corporate services...',
  error = null,
  onRetry,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const steps = [
    'Connecting to Cloud Firestore repository...',
    'Synchronizing 5 core enterprise divisions...',
    'Validating catalog pricing and live inventory...',
    'Finalizing corporate branding and ecosystem settings...',
  ];

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [error, steps.length]);

  return (
    <div
      id="app-boot-loader"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-md text-slate-900 overflow-hidden select-none"
    >
      {/* Soft Ambient Blue Gradients */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#0052FF]/5 blur-3xl pointer-events-none -top-32 -left-32" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-400/5 blur-3xl pointer-events-none -bottom-32 -right-32" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-2xl pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {error ? (
          /* Error State Screen (Phase 48 Requirement 9) */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="w-18 h-18 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-6 shadow-sm">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight mb-2">
              We couldn't load the latest website data.
            </h2>

            <p className="text-sm text-slate-600 mb-8 leading-relaxed max-w-sm">
              Please try again.
            </p>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0052FF] hover:bg-[#0045D8] active:bg-[#003BB8] text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
            )}

            {error.message && (
              <p className="text-[11px] font-mono text-slate-400 mt-6 max-w-xs truncate bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {error.message}
              </p>
            )}
          </motion.div>
        ) : (
          /* Premium Corporate Loader (Phase 48 Requirements 1-4) */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full"
          >
            {/* Animated Brand Monogram & Soft Electric-Blue Pulse */}
            <div className="relative mb-7 flex items-center justify-center">
              {/* Soft electric-blue pulse ring */}
              <div className="absolute -inset-4 rounded-3xl bg-[#0052FF]/10 blur-xl animate-pulse" />
              
              {/* Outer smooth rotating accent ring */}
              <div
                className="absolute -inset-3 rounded-3xl border border-[#0052FF]/20 border-t-[#0052FF] animate-spin"
                style={{ animationDuration: '2.5s' }}
              />

              {/* Main Card with Abstract M Logo Mark */}
              <div className="relative w-20 h-20 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-blue-900/5 flex items-center justify-center overflow-hidden">
                {/* Subtle internal gradient shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0052FF]/5 via-transparent to-blue-400/10" />
                
                {/* Modern Brand Monogram */}
                <span className="text-3xl font-black font-display tracking-tight text-[#0052FF] select-none">
                  M
                </span>

                {/* Subtle bottom active bar */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#0052FF] via-cyan-400 to-[#0052FF]" />
              </div>
            </div>

            {/* Corporate Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#0052FF] text-[11px] font-semibold tracking-wide uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] animate-ping" />
              <span>Mahdev Pvt Ltd</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight mb-2">
              {message}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-sm min-h-[40px] flex items-center justify-center">
              {steps[activeStepIndex] || subtext}
            </p>

            {/* Shimmer Progress Track */}
            <div className="w-56 h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative border border-slate-200 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0052FF] via-cyan-400 to-[#0052FF] rounded-full animate-[shimmer_1.6s_infinite] w-full" />
            </div>

            {/* Verification Note */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0052FF]" />
              <span>Enterprise Cloud Verification</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
