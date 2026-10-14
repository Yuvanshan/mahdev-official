import React from 'react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { useAvailableCmsBanners } from '../../hooks/useAvailableCmsBanners';

interface AnnouncementBannerProps {
  onNavigate?: (route: string) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onNavigate }) => {
  const { siteSettings } = useFirestoreDataContext();
  const availableBanners = useAvailableCmsBanners();
  const promotionBanner = availableBanners.find((banner) => banner.placement === 'announcement_bar');

  const firestoreAnnouncement = siteSettings?.announcement;
  const isFirestoreActive = Boolean(firestoreAnnouncement?.enabled && firestoreAnnouncement?.text?.trim());

  if (promotionBanner) {
    return (
      <div className="relative z-50 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm sm:text-sm">
        <button
          type="button"
          onClick={() => onNavigate?.('/promotion')}
          className="mx-auto block max-w-7xl px-4"
          aria-label={promotionBanner.title}
        >
          {promotionBanner.title}
        </button>
      </div>
    );
  }

  if (firestoreAnnouncement?.enabled === false || !isFirestoreActive) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-slate-950 via-[#0052FF] to-blue-900 px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
      <button
        type="button"
        onClick={() => {
          const link = firestoreAnnouncement?.link || '/contact';
          if (/^https?:\/\//i.test(link)) {
            window.open(link, '_blank', 'noopener,noreferrer');
          } else {
            onNavigate?.(link);
          }
        }}
        className="mx-auto block max-w-7xl px-4"
      >
        {firestoreAnnouncement?.text}
      </button>
    </div>
  );
};
