import React from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';

export const DivisionsSectionShimmer: React.FC = () => {
  return (
    <SectionContainer id="divisions-loading" background="subtle" paddingY="xl" hasBorderBottom>
      <div className="max-w-7xl mx-auto space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span>Loading Divisions from Cloud Firestore...</span>
            </div>
            <div className="h-9 w-64 sm:w-96 bg-slate-200 rounded-xl" />
            <div className="h-4 w-52 sm:w-80 bg-slate-200/70 rounded-md" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl shrink-0" />
        </div>

        {/* Bento Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Large Card */}
          <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between h-96 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-slate-200" />
              <div className="h-6 w-28 bg-blue-100 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="h-8 w-2/3 bg-slate-200 rounded-xl" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-4/5 bg-slate-100 rounded" />
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="h-6 w-32 bg-slate-100 rounded-lg" />
              <div className="h-10 w-32 bg-slate-200 rounded-xl" />
            </div>
          </div>

          {/* Regular Division Cards */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between h-80 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="h-5 w-20 bg-slate-100 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-3.5 w-full bg-slate-100 rounded" />
                <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="h-4 w-20 bg-slate-100 rounded" />
                <div className="h-8 w-24 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};
