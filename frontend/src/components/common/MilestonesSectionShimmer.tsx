import React from 'react';
import { Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';

export const MilestonesSectionShimmer: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white">
      <SectionContainer id="milestones-loading" background="none" paddingY="xl" hasBorderBottom>
        <div className="max-w-6xl mx-auto space-y-10 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span>Loading milestones from the database...</span>
              </div>
              <div className="h-9 w-64 sm:w-96 bg-slate-200 rounded-xl" />
              <div className="h-4 w-52 sm:w-80 bg-slate-200/70 rounded-md" />
            </div>

            {/* Trajectory Phase Control Skeleton */}
            <div className="h-10 w-44 bg-slate-200 rounded-xl shrink-0" />
          </div>

          {/* Horizontally swipeable milestone card skeletons */}
          <div className="flex snap-x snap-mandatory gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 w-[78vw] max-w-xs shrink-0 snap-start rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
              >
                <div className="mb-3 h-3 w-14 rounded bg-blue-100" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};
