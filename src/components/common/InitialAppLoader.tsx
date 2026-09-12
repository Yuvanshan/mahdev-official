import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface InitialAppLoaderProps {
  message?: string;
  subMessage?: string;
}

export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({
  message = 'Mahdev',
  subMessage = 'Loading experience...',
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

        {/* Minimalist Micro-Progress Line */}
        <div className="w-36 h-[2px] bg-slate-200/80 rounded-full overflow-hidden relative mb-4">
          <div className="absolute inset-y-0 bg-slate-900 rounded-full animate-indeterminate" />
        </div>

        {/* Quiet, Professional Subtitle */}
        {subMessage && (
          <p className="text-[11px] font-medium text-slate-400 tracking-wide">
            {subMessage}
          </p>
        )}
      </div>

      {/* Subtle Corporate Micro-Footer */}
      <div className="absolute bottom-8 text-[10px] font-medium tracking-[0.2em] uppercase text-slate-300">
        Enterprise Group
      </div>
    </motion.div>
  );
};
