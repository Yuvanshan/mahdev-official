import { useEffect, useState } from 'react';
import { cmsService } from '../services/cmsService';
import { CmsBanner } from '../types/cms';
import { getAvailableCmsBanners, getNextCmsBannerBoundary } from '../utils/cmsBanners';

// Largest delay setTimeout accepts (2^31 - 1 ms).
const MAX_TIMEOUT_MS = 2_147_483_647;

export function useAvailableCmsBanners(): CmsBanner[] {
  const [banners, setBanners] = useState<CmsBanner[]>(() =>
    cmsService.getAll<CmsBanner>('banners', { status: 'active' })
  );

  useEffect(() => {
    const refresh = () => setBanners(cmsService.getAll<CmsBanner>('banners', { status: 'active' }));
    refresh();
    const unsubscribe = cmsService.subscribe('banners', refresh);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const nextBoundary = getNextCmsBannerBoundary(banners);
    if (nextBoundary === null) return;

    // Browsers run delays over ~24.8 days at once, which would re-schedule in a tight
    // loop. A start/end date that far away is picked up when the page next loads.
    const delay = Math.max(0, nextBoundary - Date.now() + 10);
    if (delay > MAX_TIMEOUT_MS) return;

    const timeout = window.setTimeout(() => {
      setBanners(cmsService.getAll<CmsBanner>('banners', { status: 'active' }));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [banners]);

  return getAvailableCmsBanners(banners);
}
