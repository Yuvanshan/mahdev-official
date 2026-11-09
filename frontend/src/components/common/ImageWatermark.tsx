import React from 'react';

interface ImageWatermarkProps {
  label: 'SWS EVENT MANAGEMENT' | 'U1 STUDIO';
}

export const ImageWatermark: React.FC<ImageWatermarkProps> = ({ label }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 select-none bg-gradient-to-t from-black/70 via-black/35 to-transparent px-3 pb-2 pt-5 text-right"
  >
    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] sm:text-[10px]">
      {label}
    </span>
  </div>
);
