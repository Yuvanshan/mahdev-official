import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getTursoDocument,
  initializeTursoDatabase,
  listTursoDocuments,
  type TursoDocument,
} from '../../db/tursoDatabase.js';
import { CANONICAL_SITE_ORIGIN } from '../../../shared/config/site.js';
import { DIVISIONS } from '../../../shared/config/divisions.js';
import { canonicalizeDivisionRoute } from '../../../shared/config/divisionRoutes.js';
import {
  DIVISION_SITE_IDS,
  getCanonicalPublicUrl,
} from '../../../shared/config/divisionSites.js';
import { getRequestSiteOrigin } from '../../seo/requestOrigin.js';

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
// /gallery is not listed: it renders the /services page and declares /services as
// canonical. Single gallery items (/gallery?id=…) are listed below with their own head.
const RESERVED_PATHS = new Set([...STATIC_PUBLIC_PATHS, '/gallery']);
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
  '/reset-password',
  '/auth',
  '/verify-email',
  '/book/service',
  '/book/gallery',
  '/book/product',
  '/api',
];
const MAX_PUBLIC_CONTENT_ROWS = 10000;

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

const MAX_IMAGES_PER_URL = 1000;
const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const IMAGE_FIELDS = new Set([
  'bgImage',
  'coverImage',
  'coverImageUrl',
  'decorationShowcase',
  'defaultImageUrl',
  'fallbackImageUrl',
  'gallery',
  'galleryImages',
  'hero',
  'heroImage',
  'heroImageUrl',
  'image',
  'imageUrl',
  'images',
  'logoUrl',
  'mediaUrl',
  'openGraphImage',
  'ogImage',
  'poster',
  'posterUrl',
  'thumbnail',
  'thumbnailUrl',
  'url',
  'videos',
]);

/**
 * Photo URLs of a record (image sitemap), absolute and without videos or inline
 * data, so Google Images can find gallery, service, product and project photos.
 */
function recordImages(data: Record<string, unknown>, origin: string): string[] {
  const urls = new Set<string>();
  const isVideoRecord = (record: Record<string, unknown>) =>
    [record.mediaType, record.type].some(
      (type) => typeof type === 'string' && type.toLowerCase() === 'video'
    );
  const addImage = (value: unknown): void => {
    if (typeof value === 'string') {
      if (!value.trim() || VIDEO_FILE.test(value)) return;
      try {
        const url = new URL(value.trim(), origin);
        if (url.protocol === 'https:' || url.protocol === 'http:') urls.add(url.href);
      } catch {
        // Not a usable URL; skip it.
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => addImage(item));
      return;
    }

    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    const isVideo = isVideoRecord(record);
    for (const [field, child] of Object.entries(record)) {
      if (!IMAGE_FIELDS.has(field)) continue;
      if (isVideo && ['gallery', 'images', 'mediaUrl', 'url'].includes(field)) continue;
      addImage(child);
    }
  };

  const isVideo = isVideoRecord(data);
  for (const field of IMAGE_FIELDS) {
    if (isVideo && ['gallery', 'images', 'mediaUrl', 'url'].includes(field)) continue;
    addImage(data[field]);
  }
  const seo = data.seo;
  if (seo && typeof seo === 'object' && !Array.isArray(seo)) {
    const seoData = seo as Record<string, unknown>;
    addImage(seoData.ogImage);
    addImage(seoData.imageUrl);
  }

  return [...urls].slice(0, MAX_IMAGES_PER_URL);
}

function mergeEntries(existing: string | undefined, incoming: string): string {
  if (!existing) return incoming;
  const location = incoming.match(/<loc>(.*?)<\/loc>/)?.[1] || '';
  const lastmodValues = [existing, incoming]
    .map((item) => item.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] || '')
    .filter(Boolean)
    .sort();
  const imageTags = new Set(
    [existing, incoming].flatMap((item) =>
      [...item.matchAll(/<image:image><image:loc>.*?<\/image:loc><\/image:image>/g)]
        .map(([tag]) => tag)
    )
  );
  return `  <url><loc>${location}</loc>${lastmodValues.length ? `<lastmod>${lastmodValues.at(-1)}</lastmod>` : ''}${[...imageTags].join('')}</url>`;
}

function entry(
  path: string,
  origin: string,
  lastmod?: string | null,
  images: string[] = []
): string {
  const location = escapeXml(getCanonicalPublicUrl(path, origin));
  const imageTags = images.map((image) => `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`).join('');
  return `  <url><loc>${location}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${imageTags}</url>`;
}

function recordsToEntries(
  documents: TursoDocument[],
  pathForDocument: (document: TursoDocument) => string | null,
  origin: string,
  withImages = false,
  includeReserved = false,
): Array<[string, string]> {
  return documents.flatMap((document) => {
    const path = pathForDocument(document);
    if (!path || (!includeReserved && RESERVED_PATHS.has(path)) || !isPublicPath(path)) return [];
    return [[
      path,
      entry(
        path,
        origin,
        isValidDate(document.data.updatedAt || document.data.publishedAt),
        withImages ? recordImages(document.data, origin) : [],
      ),
    ]];
  });
}

export function buildSitemapXml(
  content: {
    pages: TursoDocument[];
    careerOpenings?: TursoDocument[];
    divisions: TursoDocument[];
    services: TursoDocument[];
    portfolio: TursoDocument[];
    gallery?: TursoDocument[];
    mediaAssets?: TursoDocument[];
    products?: TursoDocument[];
    homepage?: TursoDocument | null;
    siteSettings?: TursoDocument | null;
    companySettings?: TursoDocument | null;
    seoConfig?: TursoDocument | null;
  },
  origin = CANONICAL_SITE_ORIGIN,
): string {
  const publishedPages = content.pages.filter(
    ({ data }) => data.isPublished === true && data.isDeleted !== true
  );
  const isDivisionLive = ({ data }: TursoDocument) =>
    data.isPublished !== false &&
    data.status !== 'inactive' &&
    data.status !== 'coming_soon' &&
    data.isComingSoon !== true &&
    data.comingSoon !== true;
  const divisionPaths = ({ data }: TursoDocument) => [
    typeof data.route === 'string' ? canonicalizeDivisionRoute(data.route) : '',
    typeof data.slug === 'string' ? canonicalizeDivisionRoute(`/${publicSlug(data.slug) || ''}`) : '',
  ];
  // Several records can describe one division (e.g. "mart" and an old "online-mart").
  // Like the app, a division page counts as live if any of its records is live, so a
  // stale "coming soon" duplicate cannot hide a live page from search engines.
  const liveDivisionPaths = new Set(content.divisions.filter(isDivisionLive).flatMap(divisionPaths));
  const inactiveDivisionPaths = new Set(
    content.divisions
      .filter((division) => !isDivisionLive(division))
      .flatMap(divisionPaths)
      .filter((path) => !liveDivisionPaths.has(path))
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
  const sharedImages = [
    content.homepage,
    content.siteSettings,
    content.companySettings,
  ].flatMap((document) => document ? recordImages(document.data, origin) : []);
  const defaultDivisionImages = new Map<string, string[]>(
    Object.values(DIVISIONS).flatMap((division) =>
      typeof division.route === 'string'
        ? [[division.route, recordImages({
            imageUrl: division.imageUrl || division.image,
          }, origin)]]
        : []
    )
  );
  const entries = new Map<string, string>(
    STATIC_PUBLIC_PATHS
      .filter((path) =>
        !excludedPaths.has(path) &&
          (!inactiveDivisionPaths.has(path) ||
            DIVISION_SITE_IDS.some((id) => path === `/${id}`)) &&
          isPublicPath(path)
      )
      .map((path) => [
        path,
        entry(path, origin, null, [
          ...(path === '/' ? sharedImages : []),
          ...(defaultDivisionImages.get(path) || []),
        ]),
      ])
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
      true,
      true,
    ),
    ...recordsToEntries(
      (content.careerOpenings || []).filter(({ data }) =>
        data.status === 'published' && data.isDeleted !== true
      ),
      ({ id }) => `/careers?role=${encodeURIComponent(id)}`,
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
      true,
      true,
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
      true,
    ),
    ...recordsToEntries(
      (content.products || []).filter(({ data }) =>
        data.isPublished !== false &&
        data.status !== 'inactive' &&
        data.status !== 'draft' &&
        data.status !== 'archived' &&
        data.isDeleted !== true
      ),
      ({ data, id }) => {
        const slug = publicSlug(data.slug || id);
        return slug && !slug.includes('/') ? `/products/${slug}` : null;
      },
      origin,
      true,
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
      true,
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
      true,
    ),
  ];

  for (const [path, item] of dynamicEntries) {
    if (!excludedPaths.has(path.split(/[?#]/, 1)[0])) {
      entries.set(path, mergeEntries(entries.get(path), item));
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...[...entries.values()].sort((left, right) => left.localeCompare(right)),
    '</urlset>',
    '',
  ].join('\n');
}

export function scopeSitemapXmlToOrigin(xml: string, origin: string): string {
  const allowedOrigin = new URL(origin).origin;
  const urlEntries = xml.match(/  <url>[\s\S]*?<\/url>/g) || [];
  const scopedEntries = new Map<string, string>();
  for (const urlEntry of urlEntries) {
    const location = urlEntry.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!location) continue;
    try {
      if (new URL(location.replace(/&amp;/g, '&')).origin !== allowedOrigin) continue;
    } catch {
      continue;
    }
    const existing = scopedEntries.get(location);
    scopedEntries.set(location, existing ? mergeEntries(existing, urlEntry) : urlEntry);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...scopedEntries.values(),
    '</urlset>',
    '',
  ].join('\n');
}

let initialization: Promise<void> | undefined;

export async function loadPublicSitemapData(): Promise<{
  pages: TursoDocument[];
  careerOpenings: TursoDocument[];
  divisions: TursoDocument[];
  services: TursoDocument[];
  portfolio: TursoDocument[];
  gallery: TursoDocument[];
  mediaAssets: TursoDocument[];
  products: TursoDocument[];
  homepage: TursoDocument | null;
  siteSettings: TursoDocument | null;
  companySettings: TursoDocument | null;
  seoConfig: TursoDocument | null;
}> {
  initialization ??= initializeTursoDatabase().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  const [pages, careerOpenings, divisions, services, portfolio, gallery, mediaAssets, products, homepage, siteSettings, companySettings, seoConfig] = await Promise.all([
    listTursoDocuments('pages', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('careerOpenings', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('divisions', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('services', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('portfolio', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('gallery', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('media_assets', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    listTursoDocuments('products', '', [], undefined, MAX_PUBLIC_CONTENT_ROWS),
    getTursoDocument('settings', '', 'homepage'),
    getTursoDocument('settings', '', 'site'),
    getTursoDocument('settings', '', 'company'),
    getTursoDocument('settings', '', 'seo'),
  ]);
  return { pages, careerOpenings, divisions, services, portfolio, gallery, mediaAssets, products, homepage, siteSettings, companySettings, seoConfig };
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
    const origin = getRequestSiteOrigin(req);
    const sitemap = buildSitemapXml(await loadPublicSitemapData(), origin);
    const xml = scopeSitemapXmlToOrigin(sitemap, origin);
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
