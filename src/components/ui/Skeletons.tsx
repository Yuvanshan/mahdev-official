import React from 'react';

/**
 * Premium Corporate Skeleton Loaders for Mahdev Enterprise Ecosystem
 * Phase 48: Light theme, Electric Blue accent shimmer, zero layout shift
 */

export const SkeletonBox: React.FC<{
  className?: string;
  rounded?: string;
}> = ({ className = 'h-4 w-full', rounded = 'rounded-lg' }) => (
  <div
    className={`relative overflow-hidden bg-slate-200/70 ${rounded} ${className}`}
  >
    <div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.6s_infinite]"
    />
  </div>
);

export const ServiceCardSkeleton: React.FC<{ id?: string }> = ({ id }) => (
  <div
    id={id}
    className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between h-[340px] relative overflow-hidden"
  >
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <SkeletonBox className="w-12 h-12" rounded="rounded-xl" />
        <SkeletonBox className="w-20 h-5" rounded="rounded-full" />
      </div>
      <SkeletonBox className="w-3/4 h-6 mb-3" />
      <SkeletonBox className="w-full h-4 mb-2" />
      <SkeletonBox className="w-5/6 h-4 mb-6" />
      <div className="space-y-2 pt-2">
        <SkeletonBox className="w-2/3 h-3.5" />
        <SkeletonBox className="w-1/2 h-3.5" />
      </div>
    </div>
    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
      <SkeletonBox className="w-24 h-4" />
      <SkeletonBox className="w-24 h-8" rounded="rounded-xl" />
    </div>
  </div>
);

export const ProductCardSkeleton: React.FC<{ id?: string }> = ({ id }) => (
  <div
    id={id}
    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col justify-between h-[380px] relative overflow-hidden"
  >
    <div>
      <SkeletonBox className="w-full h-48 mb-4" rounded="rounded-xl" />
      <div className="flex items-center justify-between gap-2 mb-2">
        <SkeletonBox className="w-16 h-4" rounded="rounded-md" />
        <SkeletonBox className="w-12 h-4" rounded="rounded-md" />
      </div>
      <SkeletonBox className="w-4/5 h-5 mb-2" />
      <SkeletonBox className="w-full h-3.5" />
    </div>
    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
      <SkeletonBox className="w-20 h-6" />
      <SkeletonBox className="w-24 h-9" rounded="rounded-xl" />
    </div>
  </div>
);

export const PortfolioCardSkeleton: React.FC<{ id?: string }> = ({ id }) => (
  <div
    id={id}
    className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm flex flex-col h-[400px]"
  >
    <SkeletonBox className="w-full h-52" rounded="rounded-none" />
    <div className="p-6 flex flex-col justify-between flex-1">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <SkeletonBox className="w-24 h-4" rounded="rounded-full" />
          <SkeletonBox className="w-12 h-4" />
        </div>
        <SkeletonBox className="w-3/4 h-6 mb-2" />
        <SkeletonBox className="w-full h-4 mb-1.5" />
        <SkeletonBox className="w-2/3 h-4" />
      </div>
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <SkeletonBox className="w-28 h-4" />
        <SkeletonBox className="w-20 h-4" />
      </div>
    </div>
  </div>
);

export const MilestoneSkeleton: React.FC<{ id?: string }> = ({ id }) => (
  <div
    id={id}
    className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex items-start gap-4"
  >
    <SkeletonBox className="w-14 h-14 shrink-0" rounded="rounded-2xl" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-16 h-5" rounded="rounded-md" />
        <SkeletonBox className="w-20 h-4" rounded="rounded-full" />
      </div>
      <SkeletonBox className="w-3/4 h-5" />
      <SkeletonBox className="w-full h-4" />
      <SkeletonBox className="w-5/6 h-4" />
    </div>
  </div>
);

export const TestimonialSkeleton: React.FC<{ id?: string }> = ({ id }) => (
  <div
    id={id}
    className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm max-w-2xl mx-auto space-y-6"
  >
    <div className="flex items-center gap-4">
      <SkeletonBox className="w-14 h-14" rounded="rounded-full" />
      <div className="space-y-2">
        <SkeletonBox className="w-36 h-5" />
        <SkeletonBox className="w-48 h-4" />
      </div>
    </div>
    <div className="space-y-2.5">
      <SkeletonBox className="w-full h-4" />
      <SkeletonBox className="w-full h-4" />
      <SkeletonBox className="w-4/5 h-4" />
    </div>
    <div className="flex items-center justify-between pt-2">
      <SkeletonBox className="w-24 h-4" />
      <SkeletonBox className="w-28 h-6" rounded="rounded-full" />
    </div>
  </div>
);

export const CompanyLogoSkeleton: React.FC<{ id?: string }> = ({ id }) => (
  <div
    id={id}
    className="h-20 rounded-xl border border-slate-200/60 bg-white p-4 flex items-center justify-center shadow-xs"
  >
    <SkeletonBox className="w-28 h-7" rounded="rounded-md" />
  </div>
);

export const SectionHeaderSkeleton: React.FC = () => (
  <div className="max-w-2xl mb-10 space-y-3">
    <SkeletonBox className="w-32 h-5" rounded="rounded-full" />
    <SkeletonBox className="w-3/4 h-8" />
    <SkeletonBox className="w-full h-4" />
    <SkeletonBox className="w-5/6 h-4" />
  </div>
);
