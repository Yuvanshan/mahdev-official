import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarHeart,
  Film,
  Code2,
  Plane,
  ShoppingBag,
} from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface WelcomeAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const { companySettings, siteSettings, divisions, isReady } = useFirestoreDataContext();
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (forceShow) return true;
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('mahdev_welcome_animation_shown');
      return !hasSeen;
    }
    return true;
  });

  const [progress, setProgress] = useState<number>(10);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const brandName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
  const tagline =
    companySettings?.tagline ||
    'Creating Moments. Capturing Memories. Delivering Innovation.';
  const brandInitial = brandName.trim().charAt(0).toUpperCase() || 'M';
  const uploadedLogo = siteSettings?.darkLogoUrl || siteSettings?.logoUrl || companySettings?.logoUrl;

  useEffect(() => {
    if (!isVisible) return;

    // Smooth and responsive progress counter
    // Accelerates when Firestore is ready
    const stepInterval = isReady ? 25 : 40;
    const increment = isReady ? 4 : 2;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleDismiss();
          return 100;
        }
        return prev + increment;
      });
    }, stepInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVisible, isReady]);

  const handleDismiss = () => {
    setIsExiting(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mahdev_welcome_animation_shown', 'true');
    }
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 500);
  };

  if (!isVisible) return null;

  // Icons map for divisions
  const getDivisionIcon = (idOrSlug: string) => {
    const key = idOrSlug.toLowerCase();
    if (key.includes('sws') || key.includes('event')) return CalendarHeart;
    if (key.includes('u1') || key.includes('studio') || key.includes('cinema')) return Film;
    if (key.includes('it') || key.includes('software') || key.includes('cloud')) return Code2;
    if (key.includes('travel')) return Plane;
    return ShoppingBag;
  };

  const getDivisionColor = (idx: number) => {
    const colors = [
      'text-blue-400',
      'text-rose-400',
      'text-indigo-400',
      'text-emerald-400',
      'text-purple-400',
    ];
    return colors[idx % colors.length];
  };

  const displayDivisions =
    divisions && divisions.length > 0
      ? divisions.filter((d) => d.status !== 'inactive').slice(0, 5)
      : [
          { name: 'Event Management', id: 'sws' },
          { name: 'Studio & Cinema', id: 'u1-studio' },
          { name: 'IT & Cloud', id: 'it-solutions' },
          { name: 'Travels & Tours', id: 'travels' },
          { name: 'Online Mart', id: 'online-mart' },
        ];

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="welcome-animation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070D18] text-white px-4 sm:px-6 select-none overflow-hidden"
          role="dialog"
          aria-label="Welcome to Mahdev Pvt Ltd"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-gradient-to-tr from-[#0052FF]/20 via-[#0052FF]/10 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

          {/* Top Header Bar with Skip Button */}
          <div className="absolute top-6 left-0 right-0 px-6 sm:px-10 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-[#0052FF] animate-pulse" />
              <span>Official Corporate Portal</span>
            </div>

            <button
              onClick={handleDismiss}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-slate-200 transition-all cursor-pointer backdrop-blur-md"
            >
              <span>Skip Intro</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Center Brand Animation Card */}
          <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center">
            {/* Monogram / Brand Emblem or Uploaded Admin Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              {uploadedLogo && uploadedLogo.trim() !== '' ? (
                <div className="relative p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center">
                  <img
                    src={uploadedLogo}
                    alt={brandName}
                    className="h-16 sm:h-20 w-auto object-contain max-w-[240px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#0052FF] to-[#0038B8] p-[1px] shadow-2xl shadow-blue-500/30 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0B1528] rounded-[15px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#0052FF]/30 to-transparent" />
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-serif">
                      {brandInitial}
                    </span>
                  </div>
                </div>
              )}

              {/* Glowing ring animation */}
              <div className="absolute -inset-2 rounded-3xl border border-blue-400/30 animate-pulse pointer-events-none" />
            </motion.div>

            {/* Corporate Sub-label */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-[#60A5FA] text-xs font-semibold tracking-wider uppercase mb-3"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Division Corporate Group</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-4"
            >
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
                {brandName}
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-sm sm:text-base text-slate-300 font-normal max-w-lg mb-8 leading-relaxed"
            >
              {tagline}
            </motion.p>

            {/* Dynamic Divisions Badges from Firestore */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-xl mb-10"
            >
              {displayDivisions.map((div, idx) => {
                const Icon = getDivisionIcon(div.id || div.name);
                const color = getDivisionColor(idx);
                return (
                  <div
                    key={div.id || idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-medium text-slate-300"
                  >
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span>{div.name}</span>
                  </div>
                );
              })}
            </motion.div>

            {/* Progress Bar & Enter Action */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="w-full max-w-xs flex flex-col items-center gap-3"
            >
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-75 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button
                onClick={handleDismiss}
                className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#0040CC] hover:from-[#0047E0] hover:to-[#0035A8] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Corporate Experience</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Bottom Trust indicator */}
          <div className="absolute bottom-6 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {companySettings?.legalName || 'Mahdev Private Limited'} • Colombo & Trincomalee
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
