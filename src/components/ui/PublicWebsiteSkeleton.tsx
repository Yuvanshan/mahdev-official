import React from 'react';

export const PublicWebsiteSkeleton: React.FC = () => {
  return (
    <div
      id="public-website-skeleton"
      className="w-full min-h-screen bg-white flex flex-col select-none overflow-hidden"
      aria-label="Loading content..."
      role="status"
    >
      {/* 1. Announcement Banner Shimmer */}
      <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <div className="w-16 h-4 rounded-full skeleton-shimmer-dark shrink-0" />
          <div className="w-64 sm:w-96 h-3.5 rounded-md skeleton-shimmer-dark" />
          <div className="hidden md:block w-20 h-3.5 rounded-md skeleton-shimmer-dark" />
        </div>
      </div>

      {/* 2. Top Header Navigation Bar Shimmer */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo Skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl skeleton-shimmer shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="w-28 sm:w-36 h-4 sm:h-5 rounded-md skeleton-shimmer" />
              <div className="w-16 sm:w-20 h-2.5 rounded-md skeleton-shimmer" />
            </div>
          </div>

          {/* Desktop Navigation Links Skeleton */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="w-16 h-4 rounded-md skeleton-shimmer" />
            <div className="w-20 h-4 rounded-md skeleton-shimmer" />
            <div className="w-18 h-4 rounded-md skeleton-shimmer" />
            <div className="w-24 h-4 rounded-md skeleton-shimmer" />
            <div className="w-16 h-4 rounded-md skeleton-shimmer" />
            <div className="w-20 h-4 rounded-md skeleton-shimmer" />
          </div>

          {/* Right Action Buttons Skeleton */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
              <div className="w-3.5 h-3.5 rounded-full skeleton-shimmer" />
              <div className="w-24 h-3.5 rounded-md skeleton-shimmer" />
            </div>
            <div className="w-9 h-9 rounded-xl skeleton-shimmer" />
            <div className="hidden sm:block w-28 h-9 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </header>

      {/* 3. Hero Section Skeleton */}
      <section className="relative w-full bg-gradient-to-b from-blue-50/50 via-white to-white pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
          {/* Eyebrow Pill */}
          <div className="w-48 sm:w-60 h-7 rounded-full skeleton-shimmer mb-6 shadow-xs" />

          {/* Hero Display Headings */}
          <div className="w-full flex flex-col items-center gap-3 mb-6">
            <div className="w-4/5 sm:w-3/4 h-8 sm:h-12 lg:h-14 rounded-xl skeleton-shimmer" />
            <div className="w-2/3 sm:w-1/2 h-8 sm:h-12 lg:h-14 rounded-xl skeleton-shimmer" />
          </div>

          {/* Subtext Paragraph */}
          <div className="w-full max-w-2xl flex flex-col items-center gap-2 mb-10">
            <div className="w-full h-4 rounded-md skeleton-shimmer" />
            <div className="w-5/6 h-4 rounded-md skeleton-shimmer" />
            <div className="w-3/5 h-4 rounded-md skeleton-shimmer" />
          </div>

          {/* Twin Call to Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
            <div className="w-36 sm:w-44 h-12 rounded-xl skeleton-shimmer shadow-md" />
            <div className="w-36 sm:w-44 h-12 rounded-xl skeleton-shimmer" />
          </div>

          {/* Division Pill Rail Skeleton */}
          <div className="w-full max-w-3xl flex flex-wrap items-center justify-center gap-2.5 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-28 sm:w-36 h-10 rounded-xl skeleton-shimmer shadow-xs"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Division Showcase Matrix Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-3">
          <div className="w-32 h-5 rounded-full skeleton-shimmer" />
          <div className="w-72 sm:w-96 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-64 sm:w-80 h-4 rounded-md skeleton-shimmer" />
        </div>

        {/* 5-Division Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden p-4 sm:p-5 gap-4"
            >
              {/* Media banner */}
              <div className="w-full h-44 sm:h-48 rounded-xl skeleton-shimmer" />

              {/* Title & Badge */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="w-32 h-6 rounded-md skeleton-shimmer" />
                <div className="w-16 h-5 rounded-full skeleton-shimmer" />
              </div>

              {/* Description lines */}
              <div className="flex flex-col gap-2">
                <div className="w-full h-3.5 rounded-md skeleton-shimmer" />
                <div className="w-4/5 h-3.5 rounded-md skeleton-shimmer" />
              </div>

              {/* Action Button */}
              <div className="w-full h-10 rounded-xl skeleton-shimmer mt-2" />
            </div>
          ))}
        </div>
      </section>

      {/* 5. Featured Services / Hardware Skeletons */}
      <section className="bg-slate-50 border-t border-slate-200/60 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="flex flex-col gap-2.5">
              <div className="w-28 h-5 rounded-full skeleton-shimmer" />
              <div className="w-64 sm:w-80 h-7 rounded-lg skeleton-shimmer" />
            </div>
            <div className="w-32 h-9 rounded-xl skeleton-shimmer" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-slate-100 flex flex-col gap-3.5 shadow-xs"
              >
                <div className="w-full h-36 rounded-xl skeleton-shimmer" />
                <div className="w-20 h-4 rounded-md skeleton-shimmer" />
                <div className="w-40 h-5 rounded-md skeleton-shimmer" />
                <div className="w-24 h-4 rounded-md skeleton-shimmer mt-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
