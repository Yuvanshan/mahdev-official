import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MapPin } from 'lucide-react';

interface InitialAppLoaderProps {
  message?: string;
  subMessage?: string;
  progress?: number;
}

const BRAND_TAGLINES = [
  'Creating Moments...',
  'Capturing Memories...',
  'Delivering Innovation...',
  'Delivering in Trincomalee & Colombo...',
  'SWS Luxury Events & Decor...',
  'U1 Fine Art Photography & Cinema...',
  'Enterprise IT & Software Solutions...',
  'Curated Ceylon Travels & Mart...',
  'Contact Now: 075 092 8078',
];

export const InitialAppLoader: React.FC<InitialAppLoaderProps> = () => {
  const [cachedLogo, setCachedLogo] = useState<string>('/logo.png');
  const [imgError, setImgError] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % BRAND_TAGLINES.length);
    }, 1600);
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
  const currentTagline = BRAND_TAGLINES[taglineIndex];

  return (
    <motion.div
      id="app-initial-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none antialiased"
    >
      {/* Dynamic Background Ambient Shimmer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse bg-[#0052FF]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse bg-[#00D2FF]" />
      </div>

      {/* Floating Centered Brand Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-20 bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl shadow-blue-500/10 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center flex flex-col items-center"
      >
        {/* Prominent High-Impact Brand Logo */}
        <div className="mb-5 flex items-center justify-center min-h-[90px] sm:min-h-[110px]">
          <img
            src={effectiveLogo}
            alt="Mahdev"
            className="h-20 sm:h-24 md:h-28 w-auto max-w-[320px] sm:max-w-[380px] object-contain drop-shadow-sm transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={() => {
              if (effectiveLogo !== '/logo.png') {
                setCachedLogo('/logo.png');
                setImgError(false);
              } else {
                setImgError(true);
              }
            }}
          />
        </div>

        {/* Animated Brand Tagline Switcher */}
        <div className="min-h-[30px] flex items-center justify-center mb-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTagline}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="text-sm sm:text-base font-bold text-slate-800 tracking-wide"
            >
              {currentTagline}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Smooth Continuous Shimmer Line */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden relative mb-4">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-[#0052FF] via-[#0066FF] to-[#00D2FF]"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Delivery Locations & Contact Number Badge */}
        <div className="w-full pt-3 border-t border-slate-100/90 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1 text-blue-600 font-bold">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            Trincomalee & Colombo
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <a
            href="tel:0750928078"
            className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 transition-colors font-bold"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            Contact: 075 092 8078
          </a>
        </div>
      </motion.div>

      {/* Micro-Footer */}
      <div className="absolute bottom-8 text-[11px] sm:text-xs font-semibold tracking-wider text-slate-200/90 drop-shadow-md flex items-center gap-2">
        <span>Delivering in Trincomalee & Colombo</span>
        <span>•</span>
        <span>075 092 8078</span>
      </div>
    </motion.div>
  );
};
