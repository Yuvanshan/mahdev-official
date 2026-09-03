import React, { useState, useEffect } from 'react';
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
  const { siteSettings, companySettings } = useFirestoreDataContext();
  const [imgError, setImgError] = useState(false);
  const [liveLogoUrl, setLiveLogoUrl] = useState<string>('');

  const isDark = theme === 'dark';

  // Listen to broadcast custom events for instant zero-refresh synchronization
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const siteRaw = localStorage.getItem('mahdev_cached_site_settings');
        if (siteRaw) {
          const s = JSON.parse(siteRaw);
          if (isDark && s?.darkLogoUrl?.trim()) {
            setLiveLogoUrl(s.darkLogoUrl.trim());
            return;
          }
          if (s?.logoUrl?.trim()) {
            setLiveLogoUrl(s.logoUrl.trim());
            return;
          }
        }
        const compRaw = localStorage.getItem('mahdev_cached_company_settings');
        if (compRaw) {
          const c = JSON.parse(compRaw);
          if (isDark && c?.darkLogoUrl?.trim()) {
            setLiveLogoUrl(c.darkLogoUrl.trim());
            return;
          }
          if (c?.logoUrl?.trim()) {
            setLiveLogoUrl(c.logoUrl.trim());
            return;
          }
        }
      } catch {}
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mahdev_site_settings_updated', handleUpdate);
      window.addEventListener('mahdev_company_settings_updated', handleUpdate);
      return () => {
        window.removeEventListener('mahdev_site_settings_updated', handleUpdate);
        window.removeEventListener('mahdev_company_settings_updated', handleUpdate);
      };
    }
  }, [isDark]);

  // Check localStorage for immediate zero-latency branding fallback
  const cachedLogo = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const siteRaw = localStorage.getItem('mahdev_cached_site_settings');
      if (siteRaw) {
        const s = JSON.parse(siteRaw);
        if (isDark && s?.darkLogoUrl?.trim()) return s.darkLogoUrl.trim();
        if (s?.logoUrl?.trim()) return s.logoUrl.trim();
      }
      const compRaw = localStorage.getItem('mahdev_cached_company_settings');
      if (compRaw) {
        const c = JSON.parse(compRaw);
        if (isDark && c?.darkLogoUrl?.trim()) return c.darkLogoUrl.trim();
        if (c?.logoUrl?.trim()) return c.logoUrl.trim();
      }
    } catch {}
    return '';
  }, [isDark]);

  // Determine active uploaded logo URL from props, live event, React context, or cached snapshot
  const rawLogo =
    propLogoUrl ||
    liveLogoUrl ||
    (isDark && (siteSettings?.darkLogoUrl || companySettings?.darkLogoUrl)
      ? siteSettings?.darkLogoUrl || companySettings?.darkLogoUrl
      : siteSettings?.logoUrl || companySettings?.logoUrl) ||
    cachedLogo;

  const uploadedLogo = typeof rawLogo === 'string' ? rawLogo.trim() : '';

  const brandName = companySettings?.name || siteSettings?.siteName || 'Mahdev';
  const legalNameSuffix = companySettings?.legalName?.includes('Pvt') ? 'Pvt Ltd' : 'Pvt Ltd';
  const brandInitial = brandName.trim().charAt(0).toUpperCase() || 'M';

  // Reset imgError whenever uploaded logo source changes
  useEffect(() => {
    setImgError(false);
  }, [uploadedLogo]);

  const hasValidUploadedImage = Boolean(
    uploadedLogo && uploadedLogo !== '' && !imgError
  );

  const sizeStyles = {
    sm: {
      mark: 'w-7 h-7 sm:w-8 sm:h-8 text-xs',
      imgHeight: 'h-7 sm:h-8',
      title: 'text-sm font-bold',
      subtitle: 'text-[9px]',
      tag: 'text-[8px] sm:text-[9px]',
    },
    md: {
      mark: 'w-8 h-8 sm:w-10 sm:h-10 text-sm',
      imgHeight: 'h-8 sm:h-10',
      title: 'text-base sm:text-lg font-bold',
      subtitle: 'text-[10px]',
      tag: 'text-[9px] sm:text-[10px]',
    },
    lg: {
      mark: 'w-10 h-10 sm:w-12 sm:h-12 text-base',
      imgHeight: 'h-11 sm:h-13',
      title: 'text-lg sm:text-xl font-bold',
      subtitle: 'text-xs',
      tag: 'text-[10px] sm:text-xs',
    },
    xl: {
      mark: 'w-12 h-12 sm:w-16 sm:h-16 text-lg',
      imgHeight: 'h-14 sm:h-18',
      title: 'text-xl sm:text-2xl font-bold',
      subtitle: 'text-xs sm:text-sm',
      tag: 'text-xs sm:text-sm',
    },
  };

  const currentSize = sizeStyles[size];

  // Vector dynamic monogram emblem (used when no uploaded logo or as standalone symbol)
  const renderVectorEmblem = () => (
    <div
      className={`relative ${currentSize.mark} rounded-xl bg-gradient-to-br from-[#0052FF] to-[#0038B8] p-[1px] shadow-sm flex items-center justify-center shrink-0 select-none group-hover:shadow-md transition-shadow`}
    >
      <div
        className={`w-full h-full ${
          isDark ? 'bg-[#0B1528]' : 'bg-[#0F172A]'
        } rounded-[11px] flex items-center justify-center relative overflow-hidden`}
      >
        {/* Subtle geometric light reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0052FF]/30 to-transparent" />
        <span className="relative z-10 font-black tracking-tight text-white font-serif">
          {brandInitial}
        </span>
      </div>
    </div>
  );

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group shrink-0 ${className}`}
      role="banner"
    >
      {hasValidUploadedImage ? (
        // 1. Live Uploaded Logo from Admin Portal (Firestore)
        <div className="flex items-center gap-2.5">
          <img
            src={uploadedLogo}
            alt={brandName}
            className={`${currentSize.imgHeight} w-auto max-w-[280px] object-contain transition-transform duration-200 group-hover:scale-[1.02] filter drop-shadow-xs`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
          {divisionLabel && (
            <span
              className={`font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs shrink-0 ${
                isDark
                  ? 'bg-blue-900/80 text-blue-200 border border-blue-600/50'
                  : 'bg-blue-50 text-[#0052FF] border border-blue-200'
              } ${currentSize.tag}`}
            >
              {divisionLabel}
            </span>
          )}
        </div>
      ) : showText ? (
        // 2. High-Craft Vector Monogram & Wordmark (Zero dependence on PNG)
        <div className="flex items-center gap-2.5 sm:gap-3">
          {renderVectorEmblem()}
          <div className="flex flex-col text-left justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span
                className={`tracking-tight font-display ${currentSize.title} ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {brandName}
              </span>
              <span className="text-[#0052FF] font-bold text-xs">.</span>
            </div>
            <span
              className={`font-medium tracking-wider uppercase ${currentSize.subtitle} ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              } mt-0.5`}
            >
              {legalNameSuffix}
            </span>
          </div>

          {divisionLabel && (
            <span
              className={`ml-1 font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs shrink-0 ${
                isDark
                  ? 'bg-blue-900/80 text-blue-200 border border-blue-600/50'
                  : 'bg-blue-50 text-[#0052FF] border border-blue-200'
              } ${currentSize.tag}`}
            >
              {divisionLabel}
            </span>
          )}
        </div>
      ) : (
        // 3. Standalone Vector Mark
        <div className="relative flex items-center justify-center shrink-0">
          {renderVectorEmblem()}
          {divisionLabel && (
            <span
              className={`ml-2 font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0 ${
                isDark
                  ? 'bg-blue-900/80 text-blue-200 border border-blue-600/50'
                  : 'bg-blue-50 text-[#0052FF] border border-blue-200'
              } ${currentSize.tag}`}
            >
              {divisionLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
