import React from 'react';
import { Sparkles, Camera } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';

interface GallerySectionShimmerProps {
  divisionName?: string;
}

export const GallerySectionShimmer: React.FC<GallerySectionShimmerProps> = ({
  divisionName = 'Division',
}) => {
  return (
    <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
      <div className="w-full space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span>Loading {divisionName} Gallery...</span>
            </div>
            <div className="h-8 w-60 sm:w-80 bg-slate-200 rounded-xl" />
            <div className="h-4 w-44 sm:w-64 bg-slate-200/70 rounded-md" />
          </div>

          {/* Filter Pills Skeleton */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 sm:w-24 bg-slate-200 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* Gallery Image Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden bg-slate-200 aspect-4/3 sm:aspect-square flex flex-col justify-end p-4 border border-slate-200/60 shadow-xs"
            >
              <div className="space-y-2 relative z-10">
                <div className="h-4 w-3/4 bg-white/60 rounded" />
                <div className="h-3 w-1/2 bg-white/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};
