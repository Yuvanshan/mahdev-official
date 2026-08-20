import React from 'react';

interface BrandLogoProps {
  divisionLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  divisionLabel,
  size = 'md',
  onClick,
  className = '',
}) => {
  const sizeStyles = {
    sm: {
      mark: 'w-6 h-6 sm:w-7 sm:h-7 text-xs',
      text: 'text-base sm:text-lg',
      tag: 'text-[8px] sm:text-[9px]',
    },
    md: {
      mark: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
      text: 'text-lg sm:text-xl',
      tag: 'text-[9px] sm:text-[10px]',
    },
    lg: {
      mark: 'w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base',
      text: 'text-xl sm:text-2xl',
      tag: 'text-[10px] sm:text-xs',
    },
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none group shrink-0 ${className}`}
      role="banner"
    >
      {/* Monogram Mark */}
      <div
        className={`relative flex items-center justify-center font-display font-extrabold rounded-lg bg-slate-900 text-white transition-transform duration-200 group-hover:scale-105 ${sizeStyles[size].mark} shadow-sm overflow-hidden shrink-0`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0038B8] to-[#0052FF] opacity-90" />
        <span className="relative z-10 text-white tracking-tighter">M</span>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
          <span
            className={`font-display font-extrabold tracking-tight text-slate-900 ${sizeStyles[size].text}`}
          >
            MAHDEV
          </span>
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#0052FF] shrink-0" />
        </div>
        {divisionLabel ? (
          <span className={`font-semibold tracking-wider uppercase text-[#0052FF] mt-0.5 truncate ${sizeStyles[size].tag}`}>
            {divisionLabel}
          </span>
        ) : (
          <span className={`font-medium tracking-wider uppercase text-slate-400 mt-0.5 tracking-widest ${sizeStyles[size].tag}`}>
            PVT LTD
          </span>
        )}
      </div>
    </div>
  );
};
