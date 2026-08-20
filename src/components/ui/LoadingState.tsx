import React from 'react';
import {
  ServiceCardSkeleton,
  ProductCardSkeleton,
  PortfolioCardSkeleton,
  MilestoneSkeleton,
  TestimonialSkeleton,
  CompanyLogoSkeleton,
  SectionHeaderSkeleton,
} from './Skeletons';

export interface LoadingStateProps {
  message?: string;
  variant?:
    | 'spinner'
    | 'skeleton'
    | 'services'
    | 'products'
    | 'portfolio'
    | 'milestones'
    | 'testimonials'
    | 'companies';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Synchronizing with Firestore...',
  variant = 'spinner',
  count = 3,
  className = '',
}) => {
  if (variant === 'services') {
    return (
      <div className={`space-y-6 w-full ${className}`}>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'products') {
    return (
      <div className={`space-y-6 w-full ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: count || 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'portfolio') {
    return (
      <div className={`space-y-6 w-full ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <PortfolioCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'milestones') {
    return (
      <div className={`space-y-4 w-full max-w-3xl mx-auto ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <MilestoneSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'testimonials') {
    return (
      <div className={`w-full ${className}`}>
        <TestimonialSkeleton />
      </div>
    );
  }

  if (variant === 'companies') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 w-full ${className}`}>
        {Array.from({ length: count || 6 }).map((_, i) => (
          <CompanyLogoSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-4 w-full ${className}`}>
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="h-48 bg-slate-100/90 rounded-2xl border border-slate-200/80 animate-pulse" />
          <div className="h-48 bg-slate-100/90 rounded-2xl border border-slate-200/80 animate-pulse" />
          <div className="h-48 bg-slate-100/90 rounded-2xl border border-slate-200/80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative mb-4 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#0052FF]/20 border-t-[#0052FF] rounded-full animate-spin" />
        <span className="absolute text-[10px] font-black text-[#0052FF] font-display">M</span>
      </div>
      <p className="text-xs sm:text-sm font-semibold text-slate-700">{message}</p>
      <p className="text-[11px] text-slate-400 mt-1">Live Firestore Subscription</p>
    </div>
  );
};

