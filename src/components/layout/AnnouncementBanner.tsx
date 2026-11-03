import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { useAvailableCmsBanners } from '../../hooks/useAvailableCmsBanners';

interface AnnouncementBannerProps {
  onNavigate?: (route: string) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onNavigate }) => {
  const { siteSettings } = useFirestoreDataContext();
  const availableBanners = useAvailableCmsBanners();
  const promotionBanner = availableBanners.find((banner) => banner.placement === 'announcement_bar');
  const promotionTitle = promotionBanner?.title.replace(
    /^(\d{4})\s+Bookings Are Opened$/i,
    'Now booking for $1'
  );

  const firestoreAnnouncement = siteSettings?.announcement;
  const isFirestoreActive = Boolean(firestoreAnnouncement?.enabled && firestoreAnnouncement?.text?.trim());

  if (promotionBanner) {
    return (
      <div className="public-announcement-bar relative z-50 px-3 text-center text-xs font-semibold sm:text-sm">
        <button
          type="button"
          onClick={() => onNavigate?.('/promotion')}
          className="public-announcement-link mx-auto inline-flex max-w-7xl items-center justify-center gap-2 px-4"
          aria-label={promotionTitle}
        >
          {promotionTitle}
          <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </button>
      </div>
    );
  }

  if (firestoreAnnouncement?.enabled === false || !isFirestoreActive) return null;

  return (
    <div className="public-announcement-bar relative z-50 px-4 text-center text-xs font-semibold sm:text-sm">
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
        className="public-announcement-link mx-auto inline-flex max-w-7xl items-center justify-center gap-2 px-4"
      >
        {firestoreAnnouncement?.text}
        <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
      </button>
    </div>
  );
};
