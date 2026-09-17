import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface DataLoadingOverlayProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  dark?: boolean;
  className?: string;
}

export const DataLoadingOverlay: React.FC<DataLoadingOverlayProps> = ({
  message = 'Loading...',
  subMessage = 'Please wait a moment',
  fullScreen = false,
  dark = false,
  className = '',
}) => {
  const ringClass = dark ? 'border-blue-400/30 border-t-blue-400 border-r-cyan-300 border-b-blue-200/20' : 'border-blue-600/25 border-t-blue-600 border-r-cyan-500 border-b-blue-300/20';

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-[99] flex flex-col items-center justify-center ${dark ? 'bg-slate-950/80' : 'bg-slate-900/60'} backdrop-blur-sm select-none antialiased ${className}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border text-center flex flex-col items-center gap-3 ${
            dark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className={`relative w-14 h-14 rounded-full ${dark ? 'bg-blue-950/80' : 'bg-blue-50'} flex items-center justify-center`}>
            <div className={`absolute inset-0 rounded-full border-[3px] ${ringClass} animate-spin [animation-duration:1.5s]`} />
            <div className={`absolute inset-2 rounded-full border border-dashed ${dark ? 'border-blue-300/60' : 'border-blue-200'} animate-pulse`} />
            <div className={`absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full ${dark ? 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.75)]'}`} />
            <Sparkles className={`relative z-10 w-5 h-5 ${dark ? 'text-blue-300' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{message}</h3>
            <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{subMessage}</p>
          </div>
          <div className={`w-full rounded-full h-1.5 overflow-hidden mt-1 ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <motion.div
              className="bg-blue-600 h-full rounded-full"
              initial={{ width: '15%' }}
              animate={{ width: ['15%', '85%', '45%', '95%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-[280px] py-16 flex flex-col items-center justify-center gap-3 text-center px-4 ${className}`}>
      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${dark ? 'bg-blue-950/80' : 'bg-blue-50'}`}>
        <div className={`absolute inset-0 rounded-full border-[3px] ${ringClass} animate-spin [animation-duration:1.5s]`} />
        <div className={`absolute inset-2 rounded-full border border-dashed ${dark ? 'border-blue-300/60' : 'border-blue-200'} animate-pulse`} />
        <div className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${dark ? 'bg-cyan-300' : 'bg-blue-500'}`} />
        <Sparkles className={`relative z-10 w-4 h-4 ${dark ? 'text-blue-300' : 'text-blue-600'}`} />
      </div>
      <div>
        <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{message}</p>
        <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{subMessage}</p>
      </div>
    </div>
  );
};
