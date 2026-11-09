import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { useAvailableCmsBanners } from '../../hooks/useAvailableCmsBanners';
import type { DivisionSiteId } from '../../config/divisionSites';

interface AnnouncementBannerProps {
  onNavigate?: (route: string) => void;
  divisionId?: DivisionSiteId;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onNavigate, divisionId }) => {
  const { siteSettings } = useFirestoreDataContext();
  const availableBanners = useAvailableCmsBanners();
  const promotionBanner = availableBanners.find((banner) => {
    if (banner.placement !== 'announcement_bar') return false;
    const isBookingBanner = /\bbookings?\b.*\bopen(?:ed)?\b/i.test(banner.title);
    if (divisionId === 'travels' && isBookingBanner) return false;
    if (banner.divisionId === 'all') return true;
    if (banner.divisionId) return banner.divisionId === divisionId;
    if (!divisionId) return true;
    return !isBookingBanner || divisionId === 'sws' || divisionId === 'u1';
  });
  const promotionTitle = promotionBanner?.title.replace(
    /^(\d{4})\s+Bookings Are Opened$/i,
    'Now booking for $1'
  );

  const firestoreAnnouncement = siteSettings?.announcement;
  const isFirestoreActive = Boolean(firestoreAnnouncement?.enabled && firestoreAnnouncement?.text?.trim());
  const announcementText = firestoreAnnouncement?.text || '';
  const isEventAnnouncement = /\b(wedding|event|booking|party)\b/i.test(announcementText);
  const showEventAnnouncement =
    !divisionId || divisionId === 'sws' || divisionId === 'u1';

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

  if (isEventAnnouncement && !showEventAnnouncement) return null;
  if (firestoreAnnouncement?.enabled === false) return null;
  if (!isFirestoreActive && !showEventAnnouncement) return null;

  return (
    <div className="public-announcement-bar relative z-50 px-4 text-center text-xs font-semibold sm:text-sm">
      {isFirestoreActive ? (
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
      ) : (
        <div className="public-announcement-link mx-auto inline-flex max-w-7xl items-center justify-center gap-2 px-4">
          {showEventAnnouncement && (
            <>
              <span className="announcement-new">New</span>
              <span>Planning a wedding or event? Let’s make it feel like yours.</span>
              <button type="button" onClick={() => onNavigate?.('/contact')} className="announcement-action">
                Start planning <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
