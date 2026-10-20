import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getTursoDocument,
  initializeTursoDatabase,
  listTursoDocuments,
  type TursoDocument,
} from '../../db/tursoDatabase.js';
import { CANONICAL_SITE_ORIGIN } from '../../../src/config/site.js';
import { canonicalizeDivisionRoute } from '../../../src/config/divisionRoutes.js';

const STATIC_PUBLIC_PATHS = [
  '/',
  '/divisions',
  '/sws',
  '/u1',
  '/it',
  '/travels',
  '/mart',
  '/services',
  '/insights',
  '/catalog',
  '/book',
  '/about',
  '/gallery',
  '/portfolio',
  '/milestones',
  '/testimonials',
  '/careers',
  '/clients',
  '/contact',
  '/promotions',
  '/privacy-policy',
  '/terms-and-conditions',
  '/refund-policy',
  '/shipping-policy',
  '/cookie-policy',
];
const RESERVED_PATHS = new Set(STATIC_PUBLIC_PATHS);
const PRIVATE_PATH_PREFIXES = [
  '/admin',
  '/admin-yuvan1709',
  '/admin-login',
  '/adminlogin',
  '/adminportal',
  '/admin-portal',
  '/account',
  '/checkout',
  '/cart',
  '/bookings',
  '/order',
  '/orders',
  '/track-order',
  '/login',
  '/register',
  '/forgot-password',
  '/api',
];
const MAX_PUBLIC_CONTENT_ROWS = 1000;

function isPublicPath(path: string): boolean {
  return !PRIVATE_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] || character);
}

// Configured with VITE_SITE_URL (or PUBLIC_SITE_URL); validated in src/config/site.ts.
function getSiteOrigin(): string {
  return CANONICAL_SITE_ORIGIN;
}

function publicSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!slug || slug.split('/').some((segment) => !segment || segment === '.' || segment === '..')) return null;
  if (!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/.test(slug)) return null;
  return slug;
}

function isValidDate(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function entry(
  path: string,
  origin: string,
  lastmod?: string | null
): string {
  const location = escapeXml(new URL(path, origin).href);
  return `  <url><loc>${location}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
}

function recordsToEntries(
  documents: TursoDocument[],
  pathForDocument: (document: TursoDocument) => string | null,
  origin: string,
): Array<[string, string]> {
  return documents.flatMap((document) => {
    const path = pathForDocument(document);
    if (!path || RESERVED_PATHS.has(path) || !isPublicPath(path)) return [];
    return [[
      path,
      entry(path, origin, isValidDate(document.data.updatedAt || document.data.publishedAt)),
    ]];
  });
}

export function buildSitemapXml(
  content: {
    pages: TursoDocument[];
    divisions: TursoDocument[];
    services: TursoDocument[];
    portfolio: TursoDocument[];
    gallery?: TursoDocument[];
    mediaAssets?: TursoDocument[];
    seoConfig?: TursoDocument | null;
  },
  origin = CANONICAL_SITE_ORIGIN,
): string {
  const publishedPages = content.pages.filter(
    ({ data }) => data.isPublished === true && data.isDeleted !== true
  );
  const hasPublishedInsights = publishedPages.some(({ data }) => data.category === 'insights');
  const inactiveDivisionPaths = new Set(
    content.divisions
      .filter(({ data }) =>
        data.isPublished === false ||
        data.status === 'inactive' ||
        data.status === 'coming_soon' ||
        data.isComingSoon === true ||
        data.comingSoon === true
      )
      .flatMap(({ data }) => [
        typeof data.route === 'string' ? data.route : '',
        typeof data.slug === 'string' ? `/${publicSlug(data.slug) || ''}` : '',
      ])
  );
  const excludedPaths = new Set(
    Array.isArray(content.seoConfig?.data.configs)
      ? content.seoConfig.data.configs.flatMap((config) => {
          if (!config || typeof config !== 'object') return [];
          const record = config as Record<string, unknown>;
          if (record.allowIndexing !== false || typeof record.route !== 'string') return [];
          const path = record.route.startsWith('/') ? record.route : `/${record.route}`;
          return /^\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/.test(path) ? [path] : [];
        })
      : []
  );
  const entries = new Map<string, string>(
    STATIC_PUBLIC_PATHS
      .filter((path) =>
        !excludedPaths.has(path) &&
          !inactiveDivisionPaths.has(path) &&
          isPublicPath(path) &&
        (path !== '/insights' || hasPublishedInsights)
      )
      .map((path) => [path, entry(path, origin)])
  );
  const dynamicEntries: Array<[string, string]> = [
    ...recordsToEntries(
      publishedPages,
      ({ data }) => {
        const slug = publicSlug(data.slug);
        if (!slug) return null;
        return data.category === 'insights' ? `/insights/${slug}` : `/${slug}`;
      },
      origin,
    ),
    ...recordsToEntries(
      content.divisions.filter(({ data }) =>
        data.isPublished !== false &&
        data.status !== 'inactive' &&
        data.status !== 'coming_soon' &&
        data.isComingSoon !== true &&
        data.comingSoon !== true
      ),
      ({ data }) => {
        // List only the canonical URL (e.g. /sws, not its /sws-event-management alias),
        // so search engines do not see two competing pages for one division.
        const route = typeof data.route === 'string' ? data.route : '';
        if (route.startsWith('/') && /^\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/.test(route)) {
          return canonicalizeDivisionRoute(route);
        }
        const slug = publicSlug(data.slug);
        return slug ? canonicalizeDivisionRoute(`/${slug}`) : null;
      },
      origin,
    ),
    ...recordsToEntries(
      content.services.filter(({ data }) =>
        data.isPublished !== false &&
        data.status !== 'inactive' &&
        data.status !== 'draft' &&
        data.isDeleted !== true
      ),
      ({ data, id }) => {
        const slug = publicSlug(data.slug || id);
        return slug && !slug.includes('/') ? `/services/${slug}` : null;
      },
      origin,
    ),
    ...recordsToEntries(
      [...(content.gallery || []), ...(content.mediaAssets || [])].filter(({ data }) =>
        data.isPublished !== false &&
        data.status !== 'hidden' &&
        data.status !== 'inactive' &&
        data.status !== 'draft' &&
        data.status !== 'archived'
      ),
      ({ id }) => `/gallery?id=${encodeURIComponent(id)}`,
      origin,
    ),
    ...recordsToEntries(
      content.portfolio.filter(({ data }) =>
        data.isPublished === true || data.status === 'published' || data.status === 'active'
      ),
      ({ data, id }) => {
        const slug = publicSlug(data.slug || id);
        return slug ? `/projects/${slug}` : null;
      },
      origin,
    ),
  ];

  for (const [path, item] of dynamicEntries) {
    if (!excludedPaths.has(path.split(/[?#]/, 1)[0])) entries.set(path, item);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...entries.values()].sort((left, right) => left.localeCompare(right)),
    '</urlset>',
    '',
  ].join('\n');
}

let initialization: Promise<void> | undefined;

async function loadPublicSitemapData(): Promise<{
  pages: TursoDocument[];
  divisions: TursoDocument[];
  services: TursoDocument[];
  portfolio: TursoDocument[];
  gallery: TursoDocument[];
  mediaAssets: TursoDocument[];
  seoConfig: TursoDocument | null;
}> {
  initialization ??= initializeTursoDatabase().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  const [pages, divisions, services, portfolio, gallery, mediaAssets, seoConfig] = await Promise.all([
    listTursoDocuments('pages', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('divisions', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('services', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('portfolio', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('gallery', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('media_assets', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    getTursoDocument('settings', '', 'seo'),
  ]);
  return { pages, divisions, services, portfolio, gallery, mediaAssets, seoConfig };
}

export default async function sitemapHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method not allowed');
    return;
  }

  try {
    const xml = buildSitemapXml(await loadPublicSitemapData(), getSiteOrigin());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.end(req.method === 'HEAD' ? undefined : xml);
  } catch (error) {
    console.error('[Sitemap] Could not generate public sitemap:', error);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end('Sitemap temporarily unavailable.');
  }
}
