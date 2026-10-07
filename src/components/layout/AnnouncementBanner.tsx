import React, { useState, useEffect } from 'react';
import { Megaphone, ArrowRight, X } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { CmsBanner } from '../../types/cms';
import { cmsService } from '../../services/cmsService';

interface AnnouncementBannerProps {
  onNavigate?: (route: string) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onNavigate }) => {
  const { siteSettings } = useFirestoreDataContext();
  const [cmsBanner, setCmsBanner] = useState<CmsBanner | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const loadCmsBanner = () => {
    const now = Date.now();
    const announcement = cmsService
      .getAll<CmsBanner>('banners', { status: 'active' })
      .filter((banner) => {
        if (banner.placement !== 'announcement_bar') return false;
        if (banner.startDate && new Date(`${banner.startDate}T00:00:00`).getTime() > now) return false;
        if (banner.endDate && new Date(`${banner.endDate}T23:59:59`).getTime() < now) return false;
        return true;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
    setCmsBanner(announcement || null);
  };

  useEffect(() => {
    loadCmsBanner();
    const unsub = cmsService.subscribe('banners', loadCmsBanner);
    return () => unsub();
  }, []);

  if (dismissed) return null;

  // 1. Authoritative Firestore site announcement
  const firestoreAnnouncement = siteSettings?.announcement;
  
  // If Firestore explicitly disabled the announcement banner, do not show any banner
  if (firestoreAnnouncement && firestoreAnnouncement.enabled === false) {
    return null;
  }

  const isFirestoreActive = Boolean(firestoreAnnouncement?.enabled && firestoreAnnouncement?.text?.trim());

  // 2. Secondary: CMS Banner (only when Firestore announcement is not configured)
  const isCmsActive = !firestoreAnnouncement && Boolean(cmsBanner && cmsBanner.isActive);

  if (!isFirestoreActive && !isCmsActive) return null;

  const displayText = isFirestoreActive
    ? firestoreAnnouncement!.text
    : cmsBanner?.title || '';
  const displaySubtitle = !isFirestoreActive && cmsBanner?.subtitle ? cmsBanner.subtitle : '';
  const targetLink = isFirestoreActive
    ? firestoreAnnouncement?.link || '/contact'
    : cmsBanner?.targetUrl || '';
  const badgeText = isFirestoreActive ? 'Official' : cmsBanner?.badgeText || 'Notice';

  const handleClick = (e: React.MouseEvent) => {
    if (!targetLink) return;
    if (targetLink.startsWith('http')) {
      window.open(targetLink, '_blank');
    } else if (onNavigate) {
      e.preventDefault();
      onNavigate(targetLink);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase border border-white/20">
            <Megaphone className="w-3 h-3" />
            {badgeText}
          </span>

          <span className="font-semibold">{displayText}</span>
          {displaySubtitle && (
            <span className="hidden md:inline text-blue-100/80 font-normal">
              — {displaySubtitle}
            </span>
          )}

          {targetLink && (
            <span className="inline-flex items-center gap-1 font-bold text-white underline underline-offset-2 ml-1 text-xs hover:text-blue-200">
              Learn More
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
