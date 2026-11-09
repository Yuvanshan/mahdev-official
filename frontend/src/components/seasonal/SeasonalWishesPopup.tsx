import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Gift, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CmsCoupon, SeasonalWishCampaign } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { resolveMediaUrl } from '../../services/firestoreMediaService';
import { safeStorage } from '../../utils/safeStorage';
import { formatCouponExpiry, isSeasonalWishCampaignActive } from '../../utils/seasonalWishes';

const DISMISSAL_PREFIX = 'mahdev:dismissed-seasonal-wishes:';
const CLOSE_ANIMATION_MS = 560;

interface SeasonalWishesPopupProps {
  onNavigate: (path: string) => void;
}

function firstName(value: string | undefined): string {
  return value?.trim().split(/\s+/)[0] || '';
}

export const SeasonalWishesPopup: React.FC<SeasonalWishesPopupProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<SeasonalWishCampaign[]>(() =>
    cmsService.getAll<SeasonalWishCampaign>('seasonalWishCampaigns')
  );
  const [coupons, setCoupons] = useState<CmsCoupon[]>(() => cmsService.getAll<CmsCoupon>('coupons'));
  const [now, setNow] = useState(Date.now());
  const [visibleCampaign, setVisibleCampaign] = useState<SeasonalWishCampaign | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [resolvedArtwork, setResolvedArtwork] = useState('');
  const [resolvedBackground, setResolvedBackground] = useState('');

  const customerKey = isAuthenticated && user ? user.uid || user.id : 'guest';
  const candidate = useMemo(
    () => campaigns
      .filter((campaign) => isSeasonalWishCampaignActive(campaign, now))
      .sort((left, right) => left.startAt.localeCompare(right.startAt))
      .find((campaign) => safeStorage.getItem(`${DISMISSAL_PREFIX}${customerKey}:${campaign.id}`) !== '1') || null,
    [campaigns, customerKey, now]
  );
  const coupon = visibleCampaign?.couponId
    ? coupons.find((item) => item.id === visibleCampaign.couponId && item.isActive && !item.isDeleted)
    : undefined;

  useEffect(() => {
    void cmsService.ensureSeasonalWishCampaignsLoaded().catch(() => undefined);
    void cmsService.ensureCouponsLoaded().catch(() => undefined);
    const updateCampaigns = () => setCampaigns(cmsService.getAll<SeasonalWishCampaign>('seasonalWishCampaigns'));
    const updateCoupons = () => setCoupons(cmsService.getAll<CmsCoupon>('coupons'));
    const unsubscribeCampaigns = cmsService.subscribe('seasonalWishCampaigns', updateCampaigns);
    const unsubscribeCoupons = cmsService.subscribe('coupons', updateCoupons);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      unsubscribeCampaigns();
      unsubscribeCoupons();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setVisibleCampaign(null);
    setIsClosing(false);
    setIsOfferOpen(false);
    if (!candidate) return;
    const delay = Math.min(Math.max(candidate.displayDelayMs, 0), 60_000);
    const timer = window.setTimeout(() => setVisibleCampaign(candidate), delay);
    return () => window.clearTimeout(timer);
  }, [candidate]);

  useEffect(() => {
    if (!visibleCampaign) {
      setResolvedArtwork('');
      setResolvedBackground('');
      return;
    }

    let active = true;
    const resolve = (asset: string, setUrl: (url: string) => void) => {
      if (!asset) {
        setUrl('');
        return;
      }
      resolveMediaUrl(asset)
        .then((url) => {
          if (active) setUrl(url);
        })
        .catch((error: unknown) => {
          console.error('[SeasonalWishes] Campaign artwork could not be loaded:', error);
          if (active) setUrl('');
        });
    };
    resolve(visibleCampaign.artworkUrl, setResolvedArtwork);
    resolve(visibleCampaign.backgroundArtworkUrl, setResolvedBackground);
    return () => {
      active = false;
    };
  }, [visibleCampaign]);

  useEffect(() => {
    if (!visibleCampaign || visibleCampaign.autoDismissSeconds <= 0) return;
    const timer = window.setTimeout(
      () => dismissCampaign(visibleCampaign),
      visibleCampaign.autoDismissSeconds * 1000
    );
    return () => window.clearTimeout(timer);
  }, [visibleCampaign]);

  const dismissCampaign = (campaign: SeasonalWishCampaign) => {
    safeStorage.setItem(`${DISMISSAL_PREFIX}${customerKey}:${campaign.id}`, '1');
    setIsClosing(true);
    window.setTimeout(() => {
      setVisibleCampaign((current) => current?.id === campaign.id ? null : current);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  };

  if (!visibleCampaign || typeof document === 'undefined') return null;

  const title = isAuthenticated && firstName(user?.fullName)
    ? `${visibleCampaign.greetingTitle}, ${firstName(user?.fullName)}!`
    : visibleCampaign.greetingTitle;
  const animationDuration = Math.min(Math.max(visibleCampaign.animationDurationMs, 700), 3000);
  const applyOffer = () => {
    if (!coupon) {
      setCouponMessage('This offer is not currently available.');
      return;
    }
    onNavigate(`/checkout?coupon=${encodeURIComponent(coupon.code)}`);
    setIsOfferOpen(false);
    dismissCampaign(visibleCampaign);
  };

  return createPortal((
    <>
      <aside
        role="region"
        aria-label="Seasonal wishes"
        className={`seasonal-wishes-card seasonal-wishes-font-${visibleCampaign.fontFamily} ${visibleCampaign.animationType === 'fade' ? 'seasonal-wishes-fade' : ''} ${isClosing ? 'seasonal-wishes-card-closing' : 'seasonal-wishes-card-entering'}`}
        style={{
          '--wishes-duration': `${animationDuration}ms`,
          '--wishes-background': visibleCampaign.backgroundColor,
          '--wishes-accent': visibleCampaign.accentColor,
          '--wishes-text': visibleCampaign.textColor,
          '--wishes-desktop-width': `${visibleCampaign.desktopWidth}px`,
          '--wishes-mobile-width': `${visibleCampaign.mobileWidth}vw`,
          ...(resolvedBackground ? { backgroundImage: `linear-gradient(115deg, rgb(9 17 35 / 78%), rgb(9 17 35 / 26%)), url("${resolvedBackground}")` } : {}),
        } as React.CSSProperties}
      >
        <div className="seasonal-wishes-hanger" aria-hidden="true" />
        {resolvedArtwork && (
          <img className="seasonal-wishes-artwork" src={resolvedArtwork} alt="" aria-hidden="true" />
        )}
        <div className="seasonal-wishes-content">
          <p className="seasonal-wishes-occasion">{visibleCampaign.occasion}</p>
          <h2>{title}</h2>
          <p className="seasonal-wishes-description">{visibleCampaign.greetingDescription}</p>
          {coupon && <p className="seasonal-wishes-offer">{coupon.discountValue}{coupon.discountType === 'percentage' ? '% OFF' : ` ${coupon.currency} OFF`}</p>}
          <button type="button" className="seasonal-wishes-cta" onClick={() => { setIsOfferOpen(true); setCouponMessage(''); }}>
            <Gift aria-hidden="true" className="h-4 w-4" />
            {visibleCampaign.ctaText}
          </button>
        </div>
        <button
          type="button"
          className="seasonal-wishes-close"
          aria-label="Dismiss seasonal wishes"
          onClick={() => dismissCampaign(visibleCampaign)}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
        <div className="seasonal-wishes-snow" aria-hidden="true">✦　·　✧　·</div>
      </aside>

      {isOfferOpen && (
        <div className="seasonal-offer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsOfferOpen(false);
        }}>
          <section className="seasonal-offer-panel" role="dialog" aria-modal="true" aria-labelledby="seasonal-offer-title">
            <button type="button" className="seasonal-offer-close" aria-label="Close offer" onClick={() => setIsOfferOpen(false)}>
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
            <p className="seasonal-wishes-occasion">{visibleCampaign.occasion}</p>
            <h2 id="seasonal-offer-title">{visibleCampaign.greetingTitle}</h2>
            {coupon ? (
              <>
                <p className="seasonal-offer-discount">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}% OFF`
                    : `${coupon.currency} ${coupon.discountValue} OFF`}
                </p>
                <p className="text-sm text-slate-600">{visibleCampaign.greetingDescription}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Coupon code</p>
                <div className="seasonal-offer-code">{coupon.code}</div>
                <p className="text-xs text-slate-500">Coupon valid until {formatCouponExpiry(coupon.validUntil)}</p>
                <button type="button" className="seasonal-offer-copy" onClick={() => {
                  void navigator.clipboard.writeText(coupon.code).then(() => setCopied(true)).catch((error: unknown) => {
                    console.error('[SeasonalWishes] Coupon could not be copied:', error);
                    setCouponMessage('Could not copy the code. Please select and copy it manually.');
                  });
                }}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy coupon'}
                </button>
                <button type="button" className="seasonal-wishes-cta mt-2 w-full" onClick={applyOffer}>Apply offer</button>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">This campaign has no currently available coupon. Contact our team for details.</p>
            )}
            {couponMessage && <p role="status" className="mt-3 text-sm text-rose-700">{couponMessage}</p>}
          </section>
        </div>
      )}
    </>
  ), document.body);
};
