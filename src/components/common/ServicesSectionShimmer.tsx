import React from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';

interface ServicesSectionShimmerProps {
  divisionName?: string;
}

export const ServicesSectionShimmer: React.FC<ServicesSectionShimmerProps> = ({
  divisionName = 'Division',
}) => {
  return (
    <SectionContainer background="white" paddingY="lg" hasBorderBottom>
      <div className="w-full space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span>Loading {divisionName} Services...</span>
            </div>
            <div className="h-8 w-64 sm:w-96 bg-slate-200 rounded-xl" />
            <div className="h-4 w-48 sm:w-72 bg-slate-100 rounded-md" />
          </div>
          <div className="h-10 w-36 bg-slate-100 rounded-xl hidden sm:block" />
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100" />
                  <div className="h-5 w-20 bg-slate-100 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-slate-100 rounded" />
                  <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
                  <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-9 w-28 bg-blue-600/20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};
