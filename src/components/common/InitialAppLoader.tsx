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
  const [cachedLogo, setCachedLogo] = useState<string>('');
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
  }, []);

  const hasLogo = Boolean(cachedLogo && !imgError);

  return (
    <motion.div
      id="app-initial-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAFAFA] text-slate-900 select-none antialiased"
    >
      <div className="flex flex-col items-center text-center max-w-sm px-6">
        {/* Brand Presentation */}
        <div className="mb-6 flex items-center justify-center">
          {hasLogo ? (
            <img
              src={cachedLogo}
              alt="Mahdev"
              className="h-10 w-auto max-w-[220px] object-contain"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs border border-slate-800">
                <span className="font-serif font-bold text-lg tracking-tight">M</span>
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1 leading-none">
                  <span className="font-display font-bold text-lg tracking-tight text-slate-900">
                    {message === 'Mahdev' ? 'Mahdev' : message}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mb-0.5" />
                </div>
                <span className="text-[10px] font-medium tracking-widest uppercase text-slate-400 mt-1">
                  Pvt Ltd
                </span>
              </div>
            </div>
          )}
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
