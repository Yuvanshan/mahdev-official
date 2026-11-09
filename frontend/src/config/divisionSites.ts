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

const divisionEnvKeys: Record<DivisionSiteId, keyof ImportMetaEnv> = {
  sws: 'VITE_SWS_SITE_URL',
  u1: 'VITE_U1_SITE_URL',
  it: 'VITE_IT_SITE_URL',
  travels: 'VITE_TRAVELS_SITE_URL',
  mart: 'VITE_MART_SITE_URL',
};

function readConfiguredOrigin(id: DivisionSiteId): string | undefined {
  const viteEnv = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
  const nodeEnv = typeof process !== 'undefined' ? process.env : undefined;
  const value = (viteEnv?.[divisionEnvKeys[id]] || nodeEnv?.[divisionEnvKeys[id]])?.trim();
  if (!value) return undefined;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${divisionEnvKeys[id]} must be a valid absolute URL.`);
  }
  if (
    !/^https?:$/.test(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${divisionEnvKeys[id]} must be an origin without a path, query, or fragment.`);
  }
  return url.origin;
}

const DIVISION_SITE_ORIGINS = Object.fromEntries(
  DIVISION_SITE_IDS.map((id) => [id, readConfiguredOrigin(id)])
) as Record<DivisionSiteId, string | undefined>;

const configuredHosts = new Map<string, DivisionSiteId>();
for (const id of DIVISION_SITE_IDS) {
  const origin = DIVISION_SITE_ORIGINS[id];
  if (!origin) continue;
  const host = new URL(origin).host.toLowerCase();
  if (host === new URL(CANONICAL_SITE_ORIGIN).host.toLowerCase()) {
    throw new Error(`${divisionEnvKeys[id]} must not use the corporate site's host.`);
  }
  const existing = configuredHosts.get(host);
  if (existing) {
    throw new Error(`${divisionEnvKeys[id]} and ${divisionEnvKeys[existing]} cannot use the same host.`);
  }
  configuredHosts.set(host, id);
}

export function getDivisionSiteForHost(hostname: string): DivisionSiteId | undefined {
  return configuredHosts.get(hostname.toLowerCase());
}

export function getCurrentDivisionSite(): DivisionSiteId | undefined {
  return typeof window === 'undefined'
    ? undefined
    : getDivisionSiteForHost(window.location.host);
}

export function getDivisionSiteOrigin(id: DivisionSiteId): string | undefined {
  return DIVISION_SITE_ORIGINS[id];
}

export function getDivisionSiteUrl(id: DivisionSiteId, path = '/'): string {
  const route = path.startsWith('/') ? path : `/${path}`;
  const origin = DIVISION_SITE_ORIGINS[id];
  if (origin) return `${origin}${route === '/' ? '' : route}`;
  return `${CANONICAL_SITE_ORIGIN}/${id}${route === '/' ? '' : route}`;
}

export function getDivisionSiteHref(id: string): string {
  const origin = DIVISION_SITE_IDS.includes(id as DivisionSiteId)
    ? DIVISION_SITE_ORIGINS[id as DivisionSiteId]
    : undefined;
  return origin || `/${id}`;
}

export function getCanonicalPublicUrl(path: string, origin = CANONICAL_SITE_ORIGIN): string {
  const divisionRoute = path.match(/^\/(sws|u1|it|travels|mart)(\/.*)?$/);
  if (!divisionRoute) return `${origin}${path === '/' ? '' : path}`;

  const id = divisionRoute[1] as DivisionSiteId;
  const hostOrigin = DIVISION_SITE_ORIGINS[id];
  if (!hostOrigin) return `${origin}${path === '/' ? '' : path}`;

  const divisionPath = divisionRoute[2] || '/';
  return `${hostOrigin}${divisionPath === '/' ? '' : divisionPath}`;
}

const SHARED_ROUTE_PREFIXES = [
  '/admin',
  '/admin-yuvan1709',
  '/account',
  '/auth',
  '/login',
  '/register',
  '/forgot-password',
  '/checkout',
  '/cart',
  '/orders',
  '/order',
  '/track-order',
  '/privacy-policy',
  '/terms-and-conditions',
  '/refund-policy',
  '/shipping-policy',
  '/cookie-policy',
  '/book',
  '/services',
  '/featured-services',
  '/catalog',
  '/gallery',
  '/media',
  '/projects',
  '/portfolio',
  '/contact',
  '/about',
  '/insights',
  '/careers',
];

function isSharedRoute(path: string): boolean {
  return SHARED_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function toDivisionInternalPath(path: string, id?: DivisionSiteId): string {
  if (!id) return path;
  const queryIndex = path.search(/[?#]/);
  const route = queryIndex < 0 ? path : path.slice(0, queryIndex);
  const suffix = queryIndex < 0 ? '' : path.slice(queryIndex);
  if (isSharedRoute(route) || route === `/${id}` || route.startsWith(`/${id}/`)) return path;
  return `/${id}${route === '/' ? '' : route}${suffix}`;
}

export function toDivisionPublicPath(path: string, id?: DivisionSiteId): string {
  if (!id) return path;
  const queryIndex = path.search(/[?#]/);
  const route = queryIndex < 0 ? path : path.slice(0, queryIndex);
  const suffix = queryIndex < 0 ? '' : path.slice(queryIndex);
  if (isSharedRoute(route)) return path;
  if (route === `/${id}`) return `/${suffix}`;
  if (route.startsWith(`/${id}/`)) return `${route.slice(id.length + 1)}${suffix}`;
  return path;
}
