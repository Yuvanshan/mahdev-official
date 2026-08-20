import React, { useState } from 'react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface BrandLogoProps {
  divisionLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
  theme?: 'light' | 'dark';
  logoUrl?: string;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  divisionLabel,
  size = 'md',
  onClick,
  className = '',
  theme = 'light',
  logoUrl: propLogoUrl,
  showText = true,
}) => {
  const { siteSettings } = useFirestoreDataContext();
  const [imgError, setImgError] = useState(false);

  const customLogo =
    propLogoUrl ||
    (theme === 'dark' && siteSettings?.darkLogoUrl
      ? siteSettings.darkLogoUrl
      : siteSettings?.logoUrl);

  const sizeStyles = {
    sm: {
      mark: 'w-6 h-6 sm:w-7 sm:h-7 text-xs',
      text: 'text-base sm:text-lg',
      tag: 'text-[8px] sm:text-[9px]',
      imgHeight: 'h-6 sm:h-7 max-w-[140px]',
    },
    md: {
      mark: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
      text: 'text-lg sm:text-xl',
      tag: 'text-[9px] sm:text-[10px]',
      imgHeight: 'h-8 sm:h-9 max-w-[180px]',
    },
    lg: {
      mark: 'w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base',
      text: 'text-xl sm:text-2xl',
      tag: 'text-[10px] sm:text-xs',
      imgHeight: 'h-10 sm:h-12 max-w-[220px]',
    },
    xl: {
      mark: 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg',
      text: 'text-2xl sm:text-3xl',
      tag: 'text-xs sm:text-sm',
      imgHeight: 'h-12 sm:h-14 max-w-[260px]',
    },
  };

  const isDark = theme === 'dark';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0 ${className}`}
      role="banner"
    >
      {customLogo && !imgError ? (
        <div className="flex items-center gap-2">
          <img
            src={customLogo}
            alt={siteSettings?.siteName || 'Mahdev Pvt Ltd'}
            className={`${sizeStyles[size].imgHeight} w-auto object-contain transition-transform duration-200 group-hover:scale-105`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
          {divisionLabel && (
            <span
              className={`font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                isDark
                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700/40'
                  : 'bg-blue-50 text-[#0052FF] border border-blue-100'
              } ${sizeStyles[size].tag}`}
            >
              {divisionLabel}
            </span>
          )}
        </div>
      ) : (
        <>
          {/* Monogram Mark */}
          <div
            className={`relative flex items-center justify-center font-display font-extrabold rounded-lg ${
              isDark ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
            } transition-transform duration-200 group-hover:scale-105 ${sizeStyles[size].mark} shadow-sm overflow-hidden shrink-0`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0038B8] to-[#0052FF] opacity-90" />
            <span className="relative z-10 text-white tracking-tighter">M</span>
          </div>

          {/* Wordmark */}
          {showText && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
                <span
                  className={`font-display font-extrabold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  } ${sizeStyles[size].text}`}
                >
                  {siteSettings?.siteName
                    ? siteSettings.siteName.split(' ')[0].toUpperCase()
                    : 'MAHDEV'}
                </span>
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#0052FF] shrink-0" />
              </div>
              {divisionLabel ? (
                <span
                  className={`font-semibold tracking-wider uppercase ${
                    isDark ? 'text-blue-400' : 'text-[#0052FF]'
                  } mt-0.5 truncate ${sizeStyles[size].tag}`}
                >
                  {divisionLabel}
                </span>
              ) : (
                <span
                  className={`font-medium tracking-wider uppercase ${
                    isDark ? 'text-slate-400' : 'text-slate-400'
                  } mt-0.5 tracking-widest ${sizeStyles[size].tag}`}
                >
                  {siteSettings?.siteName && siteSettings.siteName.includes(' ')
                    ? siteSettings.siteName.substring(siteSettings.siteName.indexOf(' ') + 1).toUpperCase()
                    : 'PVT LTD'}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

