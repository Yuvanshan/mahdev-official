import React from 'react';
import { Sparkles, Flag, Award } from 'lucide-react';
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
                <span>Loading Milestones from Cloud Firestore...</span>
              </div>
              <div className="h-9 w-64 sm:w-96 bg-slate-200 rounded-xl" />
              <div className="h-4 w-52 sm:w-80 bg-slate-200/70 rounded-md" />
            </div>

            {/* Trajectory Phase Control Skeleton */}
            <div className="h-10 w-44 bg-slate-200 rounded-xl shrink-0" />
          </div>

          {/* 3D Milestone Cards Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between h-44"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-5 w-14 bg-blue-100 rounded-full" />
                    <div className="w-7 h-7 rounded-lg bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-blue-50 rounded" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-4/5 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Active Milestone Spotlight Card Skeleton */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-slate-700 rounded" />
                  <div className="h-6 w-52 bg-slate-700 rounded-lg" />
                </div>
              </div>
              <div className="h-7 w-24 bg-slate-800 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-800 rounded" />
              <div className="h-4 w-3/4 bg-slate-800 rounded" />
            </div>
          </div>

          {/* Key Achievements Grid Skeleton */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-200" />
                  <div className="h-6 w-16 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};
