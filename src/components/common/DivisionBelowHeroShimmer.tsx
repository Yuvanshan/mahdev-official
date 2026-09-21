import React from 'react';
import { Sparkles } from 'lucide-react';

interface DivisionBelowHeroShimmerProps {
  divisionName?: string;
}

export const DivisionBelowHeroShimmer: React.FC<DivisionBelowHeroShimmerProps> = ({
  divisionName = 'Division',
}) => {
  return (
    <div className="w-full bg-[#FAF9F6] dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 space-y-20 animate-pulse transition-colors duration-300">
      {/* 1. Status Indicator */}
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span>Loading {divisionName} details from Firestore...</span>
        </div>
        <div className="h-8 w-64 sm:w-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-48 sm:w-72 bg-slate-200/70 dark:bg-slate-800/70 rounded-md" />
      </div>

      {/* 2. Executive Overview & Mission / Vision Skeletons */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50" />
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="h-3.5 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50" />
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="h-3.5 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Services / Capabilities Grid Skeleton */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-blue-100 dark:bg-blue-900/40 rounded-full" />
            <div className="h-7 w-64 sm:w-80 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60" />
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-3.5 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-8 w-24 bg-blue-100/70 dark:bg-blue-900/40 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Visual Gallery / Portfolio Showcase Skeleton */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-blue-100 dark:bg-blue-900/40 rounded-full" />
            <div className="h-7 w-60 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-4/3 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 overflow-hidden"
            />
          ))}
        </div>
      </div>

      {/* 5. Packages / Offerings Skeleton */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-blue-100 dark:bg-blue-900/40 rounded-full" />
          <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col"
            >
              <div className="h-48 w-full bg-slate-200 dark:bg-slate-800" />
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-blue-50 dark:bg-blue-950/60 rounded" />
                  <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
                <div className="h-9 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Bottom Consultation Action CTA Skeleton */}
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl bg-slate-900 dark:bg-slate-900 border border-slate-800 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center sm:text-left">
            <div className="h-6 w-56 bg-slate-700 rounded-lg" />
            <div className="h-4 w-72 sm:w-96 bg-slate-800 rounded" />
          </div>
          <div className="h-12 w-40 bg-blue-600/60 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
