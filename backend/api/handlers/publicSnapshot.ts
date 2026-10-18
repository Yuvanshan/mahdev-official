import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { initializeTursoDatabase } from '../../db/tursoDatabase.js';
import { handleTursoAction } from '../tursoRoutes.js';

/**
 * GET /api/public/snapshot
 *
 * Returns every public collection in ONE response so the website can render
 * without issuing a separate database call per collection. The response is
 * built with exactly the same public access rules as normal reads (private
 * settings fields stripped, unpublished career openings hidden, duplicate
 * inline images compacted).
 *
 * Caching: Vercel's CDN keeps the response for 5 minutes and keeps serving the
 * cached copy while it refreshes in the background (stale-while-revalidate),
 * so most visitors are answered from the edge without touching the database.
 * There is no polling: the browser fetches it once per page session.
 */

// Collections the public site reads. media_blobs is excluded on purpose:
// it holds chunked binary media and is fetched only when a blob is displayed.
export const PUBLIC_SNAPSHOT_COLLECTIONS = [
  'announcements',
  'banners',
  'careerOpenings',
  'categories',
  'divisions',
  'faqs',
  'gallery',
  'googleReviews',
  'googleReviewsConfig',
  'heroSections',
  'legalPages',
  'media_assets',
  'milestones',
  'navigation',
  'packages',
  'pages',
  'portfolio',
  'products',
  'services',
  'settings',
  'team',
  'testimonials',
  'trustedCompanies',
  'websiteContent',
] as const;

// Vercel serverless responses are capped at 4.5 MB; stay safely below it.
const MAX_SNAPSHOT_BYTES = 4_000_000;

// Inline images (base64 data URLs stored in records, e.g. a 550 KB logo) are
// moved out of the snapshot and served from /api/public/media/<hash>.<ext>
// with an immutable one-year CDN cache. The snapshot stays small, and each
// image leaves the function roughly once per CDN region instead of on every
// snapshot refresh. Stored data is not changed.
const INLINE_IMAGE_MIN_LENGTH = 1024;
const MEDIA_PATH_PREFIX = '/api/public/media/';

interface InlineImage {
  mimeType: string;
  bytes: Buffer;
}

// Most recent images seen by this instance, keyed by content hash.
let inlineImageCache = new Map<string, InlineImage>();

function extractInlineImages(value: unknown, images: Map<string, InlineImage>): unknown {
  if (typeof value === 'string') {
    if (value.length < INLINE_IMAGE_MIN_LENGTH) return value;
    const match = value.match(/^data:(image\/(?:png|jpe?g|webp|gif|avif));base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) return value;
    const mimeType = match[1].toLowerCase();
    const hash = createHash('sha256').update(value).digest('hex').slice(0, 32);
    if (!images.has(hash)) images.set(hash, { mimeType, bytes: Buffer.from(match[2], 'base64') });
    const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
    return `${MEDIA_PATH_PREFIX}${hash}.${extension}`;
  }
  if (Array.isArray(value)) return value.map((item) => extractInlineImages(item, images));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, extractInlineImages(item, images)])
    );
  }
  return value;
}

interface SnapshotDocument {
  id: string;
  data: Record<string, unknown>;
}

interface PublicSnapshot {
  version: string;
  generatedAt: string;
  collections: Record<string, SnapshotDocument[]>;
  documents: Record<string, SnapshotDocument | null>;
  // Collections left out (too large or failed); the client reads these normally.
  omitted: string[];
}

async function buildSnapshot(): Promise<PublicSnapshot> {
  await initializeTursoDatabase();
  const omitted: string[] = [];
  const collections: Record<string, SnapshotDocument[]> = {};

  await Promise.all(PUBLIC_SNAPSHOT_COLLECTIONS.map(async (collection) => {
    try {
      const result = await handleTursoAction({ action: 'list', collection, parentPath: '' }, { role: 'public' });
      if (result.status === 200 && Array.isArray(result.body.documents)) {
        collections[collection] = result.body.documents as SnapshotDocument[];
      } else {
        omitted.push(collection);
      }
    } catch (error) {
      console.error(`[PublicSnapshot] Could not read ${collection}:`, error);
      omitted.push(collection);
    }
  }));

  const documents: Record<string, SnapshotDocument | null> = {};
  try {
    const registry = await handleTursoAction(
      { action: 'get', collection: 'system_metadata', parentPath: '', id: 'deleted_media' },
      { role: 'public' }
    );
    if (registry.status === 200) {
      documents['system_metadata/deleted_media'] = (registry.body.document as SnapshotDocument | null) ?? null;
    }
  } catch (error) {
    console.error('[PublicSnapshot] Could not read the media deletion registry:', error);
  }

  // Replace inline images with cacheable media URLs (see extractInlineImages).
  const images = new Map<string, InlineImage>();
  for (const name of Object.keys(collections)) {
    collections[name] = extractInlineImages(collections[name], images) as SnapshotDocument[];
  }
  for (const key of Object.keys(documents)) {
    documents[key] = extractInlineImages(documents[key], images) as SnapshotDocument | null;
  }
  inlineImageCache = images;

  // Drop the largest collections until the payload fits the platform limit.
  const sizeOf = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
  let total = sizeOf({ collections, documents });
  if (total > MAX_SNAPSHOT_BYTES) {
    const bySize = Object.keys(collections)
      .map((name) => ({ name, bytes: sizeOf(collections[name]) }))
      .sort((a, b) => b.bytes - a.bytes);
    for (const { name, bytes } of bySize) {
      if (total <= MAX_SNAPSHOT_BYTES) break;
      delete collections[name];
      omitted.push(name);
      total -= bytes;
    }
  }

  const version = createHash('sha1').update(JSON.stringify({ collections, documents })).digest('hex').slice(0, 16);
  return { version, generatedAt: new Date().toISOString(), collections, documents, omitted: omitted.sort() };
}

export default async function publicSnapshotHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ success: false, error: 'Only GET requests are supported.' }));
    return;
  }

  try {
    const snapshot = await buildSnapshot();
    const etag = `"${snapshot.version}"`;
    res.setHeader('ETag', etag);
    // Browser always revalidates; the CDN serves cached copies and refreshes in the background.
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304;
      res.end();
      return;
    }
    res.statusCode = 200;
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(snapshot));
  } catch (error) {
    console.error('[PublicSnapshot] Snapshot build failed:', error);
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ success: false, error: 'Public snapshot is temporarily unavailable.' }));
  }
}

/**
 * GET /api/public/media/<hash>.<ext>
 * Serves an inline image extracted from the public snapshot. Only images that
 * are part of public data can be served; the URL changes whenever the image
 * changes, so it can be cached for a year.
 */
export async function publicInlineMediaHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  // Works for both the Vercel path (/api/public/media/x) and Express' relative one.
  const hash = pathname.match(/\/([a-f0-9]{32})(?:\.[a-z]+)?$/)?.[1] || '';
  if ((req.method !== 'GET' && req.method !== 'HEAD') || !/^[a-f0-9]{32}$/.test(hash)) {
    res.statusCode = 404;
    res.setHeader('Cache-Control', 'no-store');
    res.end();
    return;
  }

  try {
    if (!inlineImageCache.has(hash)) await buildSnapshot(); // cold instance: rebuild the image index
    const image = inlineImageCache.get(hash);
    if (!image) {
      res.statusCode = 404;
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Content-Length', String(image.bytes.length));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('CDN-Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=31536000, immutable');
    res.end(req.method === 'HEAD' ? undefined : image.bytes);
  } catch (error) {
    console.error('[PublicSnapshot] Inline media lookup failed:', error);
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.end();
  }
}
