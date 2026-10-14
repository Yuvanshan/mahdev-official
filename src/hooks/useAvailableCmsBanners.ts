import { useEffect, useState } from 'react';
import { cmsService } from '../services/cmsService';
import { CmsBanner } from '../types/cms';
import { getAvailableCmsBanners, getNextCmsBannerBoundary } from '../utils/cmsBanners';

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

    const timeout = window.setTimeout(() => {
      setBanners(cmsService.getAll<CmsBanner>('banners', { status: 'active' }));
    }, Math.max(0, nextBoundary - Date.now() + 10));

    return () => window.clearTimeout(timeout);
  }, [banners]);

  return getAvailableCmsBanners(banners);
}
