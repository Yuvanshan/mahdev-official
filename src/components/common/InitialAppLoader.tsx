import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface InitialAppLoaderProps {
  message?: string;
  subMessage?: string;
  progress?: number;
}

export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({
  message = 'Mahdev',
  subMessage = 'Synchronizing database...',
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
  const hasNumericProgress = typeof progress === 'number' && !isNaN(progress);
  const clampedProgress = hasNumericProgress ? Math.min(100, Math.max(0, Math.round(progress))) : null;

  return (
    <motion.div
      id="app-initial-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF9F6] text-slate-900 select-none antialiased"
    >
      <div className="flex flex-col items-center text-center max-w-sm px-6">
        {/* Brand Presentation with Official Logo */}
        <div className="mb-6 flex items-center justify-center">
          <img
            src={effectiveLogo}
            alt="Mahdev"
            className="h-12 w-auto max-w-[240px] object-contain drop-shadow-xs"
            referrerPolicy="no-referrer"
            onError={() => {
              if (effectiveLogo !== '/logo.png') {
                setCachedLogo('/logo.png');
                setImgError(false);
              }
            }}
          />
        </div>

        {/* Minimalist Micro-Progress Line with Real Progress */}
        <div className="w-48 h-[3px] bg-slate-200/90 rounded-full overflow-hidden relative mb-3">
          {clampedProgress !== null ? (
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          ) : (
            <div className="absolute inset-y-0 bg-blue-600 rounded-full animate-indeterminate" />
          )}
        </div>

        {/* Percentage Counter and Status */}
        <div className="flex items-center gap-2 mb-1">
          {clampedProgress !== null && (
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {clampedProgress}%
            </span>
          )}
          {subMessage && (
            <p className="text-[11px] font-medium text-slate-500 tracking-wide">
              {subMessage}
            </p>
          )}
        </div>
      </div>

      {/* Subtle Corporate Micro-Footer */}
      <div className="absolute bottom-8 text-[10px] font-medium tracking-[0.2em] uppercase text-slate-400">
        Mahdev (Pvt) Ltd • Enterprise Cloud
      </div>
    </motion.div>
  );
};
