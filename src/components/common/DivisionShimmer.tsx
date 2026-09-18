import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface DivisionShimmerProps {
  onNavigate?: (route: string) => void;
  divisionName?: string;
}

export const DivisionShimmer: React.FC<DivisionShimmerProps> = ({
  onNavigate,
  divisionName = 'Enterprise Division',
}) => {
  return (
    <div className="w-full min-h-screen bg-[#FAF9F6] flex flex-col">
      {/* Hero Skeleton */}
      <section className="relative w-full min-h-[80vh] flex items-center bg-slate-950 overflow-hidden">
        {/* Shimmer pulse background */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 animate-pulse" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-20 w-full">
          <div className="max-w-3xl space-y-6">
            {onNavigate && (
              <button
                onClick={() => onNavigate('/')}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Ecosystem</span>
              </button>
            )}

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Loading Live Division Data...</span>
            </div>

            <div className="h-12 sm:h-16 w-3/4 max-w-xl bg-slate-800 rounded-xl animate-pulse" />
            <div className="space-y-2 max-w-lg">
              <div className="h-4 w-full bg-slate-800/80 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-800/60 rounded animate-pulse" />
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className="h-12 w-40 bg-blue-600/40 rounded-xl animate-pulse" />
              <div className="h-12 w-36 bg-slate-800 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Services and Details Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-12">
        <div className="flex flex-col space-y-3">
          <div className="h-4 w-28 bg-blue-100 rounded-full animate-pulse" />
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-slate-200/70 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 animate-pulse"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200" />
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="space-y-2">
                <div className="h-3.5 w-full bg-slate-100 rounded" />
                <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
              </div>
              <div className="h-9 w-full bg-slate-100 rounded-lg pt-2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
