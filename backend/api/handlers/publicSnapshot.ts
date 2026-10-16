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
