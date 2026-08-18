import React from 'react';

export interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  variant = 'spinner',
  className = '',
}) => {
  if (variant === 'skeleton') {
    return (
      <div className={`space-y-4 w-full animate-pulse ${className}`}>
        <div className="h-8 bg-slate-200 rounded-md w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded-md w-2/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="h-48 bg-slate-100 rounded-xl border border-slate-200"></div>
          <div className="h-48 bg-slate-100 rounded-xl border border-slate-200"></div>
          <div className="h-48 bg-slate-100 rounded-xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="w-10 h-10 border-3 border-blue-600/20 border-t-[#0052FF] rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};
