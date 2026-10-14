import React, { useEffect, useState } from 'react';
import { ArrowRight, Megaphone, X } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { useAvailableCmsBanners } from '../../hooks/useAvailableCmsBanners';

interface AnnouncementBannerProps {
  onNavigate?: (route: string) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onNavigate }) => {
  const { siteSettings } = useFirestoreDataContext();
  const availableBanners = useAvailableCmsBanners();
  const promotionBanner = availableBanners.find((banner) => banner.placement === 'announcement_bar');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [promotionBanner?.id]);

  const firestoreAnnouncement = siteSettings?.announcement;
  const isFirestoreActive = Boolean(firestoreAnnouncement?.enabled && firestoreAnnouncement?.text?.trim());

  if (dismissed) return null;
  if (promotionBanner) {
    return (
      <div className="relative z-50 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-3 py-2 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-1 pr-9 text-center sm:px-4">
          <button
            type="button"
            onClick={() => onNavigate?.('/promotion')}
            className="flex w-full min-w-0 items-center justify-center gap-2 text-center text-xs font-semibold sm:text-sm"
            aria-label={`View promotion: ${promotionBanner.title}`}
          >
            <Megaphone className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 whitespace-normal break-words">{promotionBanner.title}</span>
            <span className="hidden shrink-0 items-center gap-1 font-bold sm:inline-flex">
              View offers <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/75 hover:bg-white/15 hover:text-white"
          aria-label="Dismiss promotion banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (firestoreAnnouncement?.enabled === false || !isFirestoreActive) return null;

  const announcementLink = firestoreAnnouncement?.link || '/contact';
  const openAnnouncement = () => {
    if (/^https?:\/\//i.test(announcementLink)) {
      window.open(announcementLink, '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigate?.(announcementLink);
  };

  return (
    <div className="relative z-50 bg-gradient-to-r from-slate-950 via-[#0052FF] to-blue-900 px-4 py-2 text-xs font-medium text-white sm:text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-1 pr-9 sm:px-4">
        <Megaphone className="h-3.5 w-3.5 shrink-0" />
        <button
          type="button"
          onClick={openAnnouncement}
          className="inline-flex w-full min-w-0 items-center justify-center gap-2 font-semibold"
        >
          <span className="min-w-0 truncate">{firestoreAnnouncement?.text}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/75 hover:bg-white/15 hover:text-white"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
