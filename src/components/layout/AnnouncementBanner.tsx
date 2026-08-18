import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Megaphone, Tag } from 'lucide-react';
import { CmsBanner } from '../../types/cms';
import { cmsService } from '../../services/cmsService';

interface AnnouncementBannerProps {
  onNavigate?: (route: string) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onNavigate }) => {
  const [activeBanner, setActiveBanner] = useState<CmsBanner | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const loadBanner = () => {
    const banners = cmsService.getAll<CmsBanner>('banners', { status: 'active' });
    const announcement = banners.find(
      (b) => b.placement === 'announcement_bar' && b.isActive && !b.isDeleted
    ) || banners.find((b) => b.isActive && !b.isDeleted);

    if (announcement) {
      setActiveBanner(announcement);
    } else {
      setActiveBanner(null);
    }
  };

  useEffect(() => {
    loadBanner();
    const unsub = cmsService.subscribe('banners', loadBanner);
    return () => unsub();
  }, []);

  if (!activeBanner || dismissed) return null;

  const handleClick = (e: React.MouseEvent) => {
    if (!activeBanner.targetUrl) return;
    if (activeBanner.targetUrl.startsWith('http')) {
      window.open(activeBanner.targetUrl, '_blank');
    } else if (onNavigate) {
      e.preventDefault();
      onNavigate(activeBanner.targetUrl);
    }
  };

  return (
    <div
      id="site-announcement-banner"
      className="relative z-50 bg-gradient-to-r from-slate-950 via-[#0052FF] to-blue-900 text-white px-4 py-2 text-xs sm:text-sm font-medium border-b border-blue-400/20 shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div
          onClick={handleClick}
          className="flex-1 flex flex-wrap items-center justify-center gap-2.5 cursor-pointer hover:opacity-95 transition-opacity"
        >
          {activeBanner.badgeText && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase border border-white/20">
              <Megaphone className="w-3 h-3" />
              {activeBanner.badgeText}
            </span>
          )}

          <span className="font-semibold">{activeBanner.title}</span>
          <span className="hidden md:inline text-blue-100/80 font-normal">
            — {activeBanner.subtitle}
          </span>

          {activeBanner.buttonText && (
            <span className="inline-flex items-center gap-1 font-bold text-white underline underline-offset-2 ml-1 text-xs hover:text-blue-200">
              {activeBanner.buttonText}
              <ArrowRight className="w-3 h-3" />
            </span>
          )}
        </div>

        <button
          id="dismiss-announcement-btn"
          onClick={() => setDismissed(true)}
          className="p-1 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Dismiss announcement"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
