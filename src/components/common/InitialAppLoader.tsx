import React from 'react';
import { ShieldCheck, Sparkles, Database } from 'lucide-react';
import { activeFirestoreDatabaseId } from '../../lib/firebase';

interface InitialAppLoaderProps {
  message?: string;
  subMessage?: string;
}

export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({
  message = 'Loading Live Business Data...',
  subMessage = 'Connecting to Cloud Firestore collections & enterprise configuration...',
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-300">
      {/* Background ambient glowing nodes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      <div className="relative z-10 max-w-md w-full mx-4 p-8 text-center space-y-6">
        {/* Animated Brand Emblem */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-blue-600/30 blur-md animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xl border border-blue-400/40">
            <span className="font-display font-extrabold text-2xl tracking-tight">M</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-slate-950">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Brand Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Mahdev Enterprise Ecosystem</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
            Mahdev Pvt Ltd
          </h2>
        </div>

        {/* Dynamic Loading Message */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-200">
            {message}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            {subMessage}
          </p>
        </div>

        {/* Modern Shimmer Progress Bar */}
        <div className="w-48 mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 rounded-full animate-indeterminate" />
        </div>

        {/* Active Database Tag */}
        <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
          <Database className="w-3 h-3 text-blue-400" />
          <span>Firestore Instance: {activeFirestoreDatabaseId}</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">Live Realtime</span>
        </div>
      </div>
    </div>
  );
};
