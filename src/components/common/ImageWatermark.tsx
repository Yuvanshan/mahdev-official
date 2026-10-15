import React from 'react';

interface ImageWatermarkProps {
  label: 'SWS EVENT MANAGEMENT' | 'U1 STUDIO';
}

export const ImageWatermark: React.FC<ImageWatermarkProps> = ({ label }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
  >
    <div className="absolute -inset-1/4 grid h-[150%] w-[150%] rotate-[-24deg] grid-cols-3 grid-rows-5 opacity-50">
      {Array.from({ length: 15 }, (_, index) => (
        <span
          key={index}
          className="flex items-center justify-center whitespace-nowrap px-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] sm:text-[11px]"
        >
          {label}
        </span>
      ))}
    </div>
  </div>
);
