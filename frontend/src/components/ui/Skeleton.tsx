import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'rounded' | 'circular' | 'text';
  animation?: 'shimmer' | 'pulse' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  animation = 'shimmer',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-xl';
      case 'text':
        return 'rounded-md h-4 w-full';
      case 'rectangular':
      default:
        return 'rounded-none';
    }
  };

  const getAnimationClass = () => {
    if (animation === 'pulse') return 'animate-pulse bg-slate-200/80';
    if (animation === 'shimmer') {
      return 'relative overflow-hidden bg-slate-200/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent';
    }
    return 'bg-slate-200';
  };

  return (
    <div
      className={`select-none pointer-events-none ${getVariantClass()} ${getAnimationClass()} ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-slate-200/80 bg-white/90 shadow-xs space-y-4 ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton variant="rounded" className="h-10 w-10" />
      <Skeleton variant="rounded" className="h-5 w-20" />
    </div>
    <Skeleton variant="text" className="h-7 w-3/4" />
    <Skeleton variant="text" className="h-4 w-full" />
    <Skeleton variant="text" className="h-4 w-5/6" />
    <div className="pt-2 flex gap-2">
      <Skeleton variant="rounded" className="h-8 w-24" />
      <Skeleton variant="rounded" className="h-8 w-24" />
    </div>
  </div>
);

export const TimelineSkeleton: React.FC = () => (
  <div className="max-w-5xl mx-auto space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col items-center gap-2">
          <Skeleton variant="circular" className="w-9 h-9" />
          <Skeleton variant="text" className="h-4 w-12" />
          <Skeleton variant="text" className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" className="w-12 h-12 bg-slate-800" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="h-3 w-32 bg-slate-800" />
          <Skeleton variant="text" className="h-6 w-48 bg-slate-800" />
        </div>
      </div>
      <Skeleton variant="text" className="h-4 w-full bg-slate-800" />
      <Skeleton variant="text" className="h-4 w-4/5 bg-slate-800" />
    </div>
  </div>
);
