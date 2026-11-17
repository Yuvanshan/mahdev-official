import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ShopSliderProps {
  title: string;
  tagline?: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}

// A titled, swipeable row of cards with a "View all" button and arrows (scroll-snap, no library).
export const ShopSlider: React.FC<ShopSliderProps> = ({ title, tagline, onViewAll, children }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const scrollRow = (direction: 1 | -1) =>
    rowRef.current?.scrollBy({ left: direction * rowRef.current.clientWidth * 0.85, behavior: 'smooth' });

  return (
    <section className="relative w-full overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h2>
          {tagline && <p className="text-xs text-slate-500">{tagline}</p>}
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="rounded-sm bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-blue-700"
          >
            View all
          </button>
        )}
      </header>
      <div className="group/slider relative">
        <div
          ref={rowRef}
          className="flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
        {(['prev', 'next'] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => scrollRow(side === 'next' ? 1 : -1)}
            aria-label={side === 'next' ? 'Scroll right' : 'Scroll left'}
            className={`absolute top-1/2 hidden h-16 w-9 -translate-y-1/2 items-center justify-center bg-white text-slate-800 shadow-md transition-opacity hover:text-blue-700 md:flex md:opacity-0 md:group-hover/slider:opacity-100 ${
              side === 'next' ? 'right-0 rounded-l-md' : 'left-0 rounded-r-md'
            }`}
          >
            {side === 'next' ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        ))}
      </div>
    </section>
  );
};
