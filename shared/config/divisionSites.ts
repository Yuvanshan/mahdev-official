import { CANONICAL_SITE_ORIGIN } from './site.js';

export const DIVISION_SITE_IDS = ['sws', 'u1', 'it', 'travels', 'mart'] as const;
export type DivisionSiteId = (typeof DIVISION_SITE_IDS)[number];

export const DIVISION_SITE_BRANDING: Record<DivisionSiteId, {
  name: string;
  shortName: string;
  logoPath: string;
}> = {
  sws: {
    name: 'SWS Event Management',
    shortName: 'SWS',
    logoPath: '/assets/images/sws_logo.jpeg',
  },
  u1: {
    name: 'U1 Studio',
    shortName: 'U1 Studio',
    logoPath: '/assets/images/u1_logo.jpeg',
  },
  it: {
    name: 'Mahdev IT Solutions',
    shortName: 'Mahdev IT',
    logoPath: '/assets/images/it_logo.svg',
  },
  travels: {
    name: 'Mahdev Travels',
    shortName: 'Travels',
    logoPath: '/assets/images/travels_logo.svg',
  },
  mart: {
    name: 'Mahdev Online Mart',
    shortName: 'Mahdev Mart',
    logoPath: '/assets/images/mart_logo.svg',
  },
};

// One website: every division lives under the corporate origin at /{id}.
export function getDivisionSiteUrl(id: DivisionSiteId, path = '/'): string {
  const route = path.startsWith('/') ? path : `/${path}`;
  return `${CANONICAL_SITE_ORIGIN}/${id}${route === '/' ? '' : route}`;
}

export function getDivisionSiteHref(id: string): string {
  return `/${id}`;
}

export function getCanonicalPublicUrl(path: string, origin = CANONICAL_SITE_ORIGIN): string {
  return `${origin}${path === '/' ? '' : path}`;
}
