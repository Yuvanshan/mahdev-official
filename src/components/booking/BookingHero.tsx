import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Camera,
  Layers,
  Compass,
  Cpu,
  BookmarkCheck,
} from 'lucide-react';

interface BookingHeroProps {
  onOpenLookup: () => void;
  activeBookingsCount: number;
}

export const BookingHero: React.FC<BookingHeroProps> = ({
  onOpenLookup,
  activeBookingsCount,
}) => {
  return (
    <section className="relative pt-32 pb-16 bg-neutral-900 text-white overflow-hidden border-b border-neutral-800">
      {/* Tech/Artisanal Glow & Grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Main Hero Header */}
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-800/90 border border-neutral-700 text-amber-400 text-xs tracking-wider uppercase font-medium mb-6 backdrop-blur-md"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Universal Enterprise Service Booking</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-white mb-6"
            >
              Reserve Premium <br />
              <span className="italic font-light text-amber-200/90">Mahdev Services</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-neutral-300 font-light leading-relaxed mb-6 max-w-2xl"
            >
              One unified scheduling and service orchestration engine for Grand Event Productions, Cinema Shoots, Ceylon Safaris, IT Deployments, and Trade Consultations.
            </motion.p>

            {/* Quick Guarantees */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 text-xs text-neutral-400"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant Availability Check</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Transparent Fixed & Tiered Pricing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Dedicated Event & Technical Concierge</span>
              </div>
            </motion.div>
          </div>

          {/* Quick Booking Lookup Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-neutral-800/80 border border-neutral-700/90 rounded-2xl p-6 backdrop-blur-md max-w-md w-full shadow-xl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-700">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Have an Existing Booking?</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                {activeBookingsCount} Active Records
              </span>
            </div>

            <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
              Track real-time confirmation status, scheduled dates, assigned concierge, or request rescheduling.
            </p>

            <button
              onClick={onOpenLookup}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>Track or Manage Booking</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
