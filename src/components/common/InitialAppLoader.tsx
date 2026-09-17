import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, ShieldCheck } from 'lucide-react';

interface InitialAppLoaderProps {
  message?: string;
  subMessage?: string;
  progress?: number;
}

export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({
  message,
  subMessage,
  progress,
}) => {
  const [cachedLogo, setCachedLogo] = useState<string>('/logo.png');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    try {
      const siteRaw = localStorage.getItem('mahdev_cached_site_settings');
      if (siteRaw) {
        const s = JSON.parse(siteRaw);
        if (s?.logoUrl?.trim()) {
          setCachedLogo(s.logoUrl.trim());
          return;
        }
      }
      const compRaw = localStorage.getItem('mahdev_cached_company_settings');
      if (compRaw) {
        const c = JSON.parse(compRaw);
        if (c?.logoUrl?.trim()) {
          setCachedLogo(c.logoUrl.trim());
          return;
        }
      }
    } catch {}
    setCachedLogo('/logo.png');
  }, []);

  const effectiveLogo = !imgError && cachedLogo ? cachedLogo : '/logo.png';
  const displayPercent =
    progress !== undefined && progress >= 0 ? Math.min(100, Math.round(progress)) : null;

  return (
    <motion.div
      id="app-initial-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-[#FAF9F6] flex flex-col items-center justify-between p-6 sm:p-10 select-none antialiased overflow-hidden"
    >
      {/* Subtle, soft ambient background illumination */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className="w-[480px] h-[480px] rounded-full opacity-40 blur-[120px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0,82,255,0.12) 0%, rgba(0,210,255,0.04) 60%, transparent 80%)',
          }}
        />
      </div>

      {/* Top Quiet Corporate Watermark */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-full flex items-center justify-center pt-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400"
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Verified Enterprise Infrastructure
        </span>
      </motion.div>

      {/* Center Core Brand Card & Progress Engine */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-sm sm:max-w-md w-full my-auto text-center">
        {/* Brand Emblem with Smooth Breathing Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6 flex items-center justify-center min-h-[96px] sm:min-h-[112px]"
        >
          {/* Subtle soft ambient halo behind emblem */}
          <div className="absolute inset-0 -m-3 rounded-2xl bg-blue-500/5 blur-xl pointer-events-none" />

          {!imgError ? (
            <motion.img
              src={effectiveLogo}
              alt="Mahdev (Pvt) Ltd"
              className="h-20 sm:h-24 md:h-28 w-auto max-w-[280px] sm:max-w-[340px] object-contain drop-shadow-xs relative z-10"
              referrerPolicy="no-referrer"
              animate={{
                scale: [1, 1.015, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              onError={() => {
                if (effectiveLogo !== '/logo.png') {
                  setCachedLogo('/logo.png');
                  setImgError(false);
                } else {
                  setImgError(true);
                }
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-extrabold text-3xl tracking-tight">
              M
            </div>
          )}
        </motion.div>

        {/* Brand Name & Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="space-y-1 mb-7"
        >
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {message || 'Mahdev (Pvt) Ltd'}
          </h1>
          <p className="text-xs sm:text-[13px] font-medium text-slate-500 tracking-wide">
            Creating Moments • Capturing Memories • Delivering Innovation
          </p>
        </motion.div>

        {/* Minimalist Hairline Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          className="w-full max-w-[280px] sm:max-w-[320px] flex flex-col items-center gap-2.5"
        >
          <div className="w-full bg-slate-200/80 rounded-full h-1 sm:h-1.5 overflow-hidden relative">
            {displayPercent !== null ? (
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 relative"
                initial={{ width: '4%' }}
                animate={{ width: `${Math.max(6, displayPercent)}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            ) : (
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 absolute inset-y-0 w-1/3"
                animate={{
                  x: ['-100%', '350%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  ease: 'easeInOut',
                }}
              />
            )}
          </div>

          {/* Status Feedback & Tabular Progress */}
          <div className="w-full flex items-center justify-between text-[11px] font-medium text-slate-500 px-0.5">
            <span className="inline-flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <span className="truncate">{subMessage || 'Initializing digital experience...'}</span>
            </span>
            {displayPercent !== null && (
              <span className="tabular-nums font-semibold text-slate-700 ml-2 shrink-0">
                {displayPercent}%
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Quiet Location & Division Pill */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="pb-2 flex flex-col items-center gap-1.5"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs text-[11px] font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
            <MapPin className="w-3 h-3 shrink-0" />
            Trincomalee & Colombo
          </span>
          <span className="text-slate-300">•</span>
          <span>Sri Lanka</span>
        </div>
        <p className="text-[10px] tracking-wider text-slate-400 uppercase font-medium">
          Events • Cinema • IT • Travels • Mart
        </p>
      </motion.div>
    </motion.div>
  );
};

