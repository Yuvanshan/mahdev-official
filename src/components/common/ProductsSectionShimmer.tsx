import React from 'react';
import { Sparkles, Box } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';

interface ProductsSectionShimmerProps {
  title?: string;
  badge?: string;
}

export const ProductsSectionShimmer: React.FC<ProductsSectionShimmerProps> = ({
  title = 'Inventory & Catalog',
  badge = 'Loading Products...',
}) => {
  return (
    <SectionContainer background="white" paddingY="lg" hasBorderBottom>
      <div className="w-full space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span>{badge}</span>
            </div>
            <div className="h-8 w-64 sm:w-80 bg-slate-200 rounded-xl" />
            <div className="h-4 w-48 sm:w-64 bg-slate-100 rounded-md" />
          </div>
          <div className="h-10 w-48 bg-slate-100 rounded-xl hidden sm:block" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-hidden pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-xl shrink-0" />
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div className="h-52 w-full bg-slate-200/80" />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-blue-100/60 rounded-full" />
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
                <div className="h-3.5 w-full bg-slate-100 rounded" />
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="h-5 w-24 bg-slate-200 rounded" />
                  <div className="h-9 w-28 bg-blue-600/20 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};
