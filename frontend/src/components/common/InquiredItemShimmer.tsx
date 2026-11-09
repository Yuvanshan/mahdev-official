import React from 'react';

export const InquiredItemShimmer: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      {/* Top Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          <div className="h-6 w-32 bg-slate-100 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
          <div className="h-9 w-24 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Main Spotlight Card Shimmer */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Media Area Shimmer (7 cols) */}
          <div className="lg:col-span-7 bg-slate-100 min-h-[340px] sm:min-h-[460px] relative overflow-hidden flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-slate-300" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>

          {/* Details Column Shimmer (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Badge */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-24 bg-blue-100 rounded-full" />
                <div className="h-5 w-28 bg-slate-100 rounded-full" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <div className="h-8 w-4/5 bg-slate-200 rounded-lg" />
                <div className="h-5 w-1/2 bg-slate-100 rounded-md" />
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <div className="h-3.5 w-full bg-slate-100 rounded-sm" />
                <div className="h-3.5 w-5/6 bg-slate-100 rounded-sm" />
                <div className="h-3.5 w-4/6 bg-slate-100 rounded-sm" />
              </div>

              {/* Metadata specs */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="h-3 w-12 bg-slate-200 rounded-xs" />
                  <div className="h-4 w-20 bg-slate-300 rounded-xs" />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="h-3 w-16 bg-slate-200 rounded-xs" />
                  <div className="h-4 w-24 bg-slate-300 rounded-xs" />
                </div>
              </div>
            </div>

            {/* Action Buttons Shimmer */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="h-12 w-full bg-emerald-100 rounded-2xl" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-slate-100 rounded-xl" />
                <div className="h-10 bg-blue-100 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
