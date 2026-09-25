import React from 'react';
import { Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';

export const MilestonesTimelineShimmer: React.FC = () => {
  return (
    <SectionContainer background="white" paddingY="xl" hasBorderBottom>
      <div className="max-w-4xl mx-auto relative animate-pulse space-y-12">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            <span>Fetching Milestones from Cloud Firestore...</span>
          </div>
        </div>

        {/* Timeline Items */}
        {[1, 2, 3, 4, 5].map((i) => {
          const isEven = i % 2 === 0;
          return (
            <div
              key={i}
              className={`flex flex-col sm:flex-row items-start ${
                isEven ? 'sm:flex-row-reverse' : ''
              } gap-6 sm:gap-12 relative`}
            >
              {/* Year marker */}
              <div className="w-9 h-9 rounded-full bg-slate-300 ring-4 ring-white shrink-0" />

              {/* Card skeleton */}
              <div className="w-full sm:w-[calc(50%-2rem)] p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-12 bg-blue-100 rounded-md" />
                  <div className="h-5 w-20 bg-slate-200 rounded-md" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-4 w-1/2 bg-blue-50 rounded" />
                <div className="h-3.5 w-full bg-slate-100 rounded" />
                <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
                <div className="pt-3 border-t border-slate-200/80 space-y-1.5">
                  <div className="h-3 w-4/5 bg-slate-100 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>

              <div className="hidden sm:block sm:w-[calc(50%-2rem)]" />
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
};
