import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Sparkles } from 'lucide-react';

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
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
            dark ? 'bg-blue-950/80 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <Loader2 className="w-6 h-6 animate-spin" />
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
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
        dark ? 'bg-blue-950/80 text-blue-400 border border-blue-800/40' : 'bg-blue-50 text-blue-600'
      }`}>
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <div>
        <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{message}</p>
        <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{subMessage}</p>
      </div>
    </div>
  );
};
