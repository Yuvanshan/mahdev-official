import { CmsBanner } from '../types/cms';

function getDateBoundary(value: string | undefined, endOfDay = false): number | null {
  if (!value) return null;

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const timestamp = dateOnly
    ? (() => {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return NaN;
        return date.getTime();
      })()
    : Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getAvailableCmsBanners(banners: CmsBanner[], now = Date.now()): CmsBanner[] {
  return banners
    .filter((banner) => {
      if (!banner.isActive || banner.isDeleted) return false;
      const startsAt = getDateBoundary(banner.startDate);
      const endsAt = getDateBoundary(banner.endDate, true);
      if ((banner.startDate && startsAt === null) || (banner.endDate && endsAt === null)) return false;
      return (startsAt === null || startsAt <= now) && (endsAt === null || endsAt >= now);
    })
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

export function getNextCmsBannerBoundary(banners: CmsBanner[], now = Date.now()): number | null {
  const boundaries = banners.flatMap((banner) => [
    getDateBoundary(banner.startDate),
    getDateBoundary(banner.endDate, true),
  ]);
  return boundaries
    .filter((boundary): boundary is number => boundary !== null && boundary > now)
    .sort((a, b) => a - b)[0] ?? null;
}
