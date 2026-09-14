import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface InitialAppLoaderProps {
  message?: string;
  subMessage?: string;
  progress?: number;
}

const BRAND_TAGLINES = [
  'Creating Moments...',
  'Capturing Memories...',
  'Delivering Innovation...',
];

export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({
  message = 'Mahdev',
  subMessage,
  progress,
}) => {
  const [cachedLogo, setCachedLogo] = useState<string>('/logo.png');
  const [imgError, setImgError] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % BRAND_TAGLINES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

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

  // Filter out any backend/firestore terms from subMessage if passed
  const sanitizedSubMessage = subMessage &&
    !subMessage.toLowerCase().includes('firestore') &&
    !subMessage.toLowerCase().includes('firebase') &&
    !subMessage.toLowerCase().includes('database') &&
    !subMessage.toLowerCase().includes('backend') &&
    !subMessage.toLowerCase().includes('store data')
      ? subMessage
      : BRAND_TAGLINES[taglineIndex];

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
            className="h-14 sm:h-16 w-auto max-w-[280px] object-contain drop-shadow-xs"
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
        <div className="w-52 h-[3px] bg-slate-200/90 rounded-full overflow-hidden relative mb-3">
          {clampedProgress !== null ? (
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          ) : (
            <div className="absolute inset-y-0 bg-blue-600 rounded-full animate-indeterminate" />
          )}
        </div>

        {/* Percentage Counter and Brand Tagline */}
        <div className="flex items-center gap-2 mb-1 min-h-[24px]">
          {clampedProgress !== null && (
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {clampedProgress}%
            </span>
          )}
          <motion.p
            key={sanitizedSubMessage}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-medium text-slate-600 tracking-wide"
          >
            {sanitizedSubMessage}
          </motion.p>
        </div>
      </div>

      {/* Subtle Corporate Micro-Footer with Brand Taglines */}
      <div className="absolute bottom-8 text-[11px] font-medium tracking-[0.15em] text-slate-400">
        Creating Moments • Capturing Memories • Delivering Innovation
      </div>
    </motion.div>
  );
};
