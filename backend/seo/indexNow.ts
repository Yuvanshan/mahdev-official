/**
 * IndexNow: tells Bing, Yandex, Seznam and other IndexNow search engines straight
 * away when an admin adds, edits or removes a public page, instead of waiting for
 * their next crawl. Google does not use IndexNow; it reads the sitemap.
 *
 * The key is public by design: search engines verify it by fetching
 * /<key>.txt (public/), which proves the request comes from this site's owner.
 */

import { getTursoDocument, type TursoDocument } from '../db/tursoDatabase.js';
import { gallerySeo, productSeo, projectSeo, serviceSeo } from '../../src/config/itemSeo.js';
import { CANONICAL_SITE_ORIGIN } from '../../src/config/site.js';

export const INDEXNOW_KEY = '445d15ea64a06507bab51845f551f763';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const REQUEST_TIMEOUT_MS = 5_000;

type Write = { collection?: unknown; id?: unknown; parentPath?: unknown };

// Public URL for a record in each indexable collection (same paths as the sitemap and canonicals).
const PATH_FOR: Record<string, (data: Record<string, unknown>, id: string) => string | null> = {
  services: (data, id) => serviceSeo(data, id).path,
  products: (data, id) => productSeo(data, id).path,
  portfolio: (data, id) => projectSeo(data, id).path,
  gallery: (data, id) => gallerySeo(data, id).path,
  media_assets: (data, id) => gallerySeo(data, id).path,
  pages: (data) => {
    const slug = typeof data.slug === 'string' ? data.slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase() : '';
    if (!slug) return null;
    return data.category === 'insights' ? `/insights/${slug}` : `/${slug}`;
  },
};

/** The writes in a database request ("write" or "batch"). */
function writesIn(body: unknown): Write[] {
  if (!body || typeof body !== 'object') return [];
  const request = body as Record<string, unknown>;
  if (request.action === 'write' && request.write && typeof request.write === 'object') return [request.write as Write];
  if (request.action === 'batch' && Array.isArray(request.writes)) return request.writes as Write[];
  return [];
}

/** Public URLs changed by the request's writes, read back after saving so slugs are current. */
export async function changedPublicUrls(body: unknown): Promise<string[]> {
  const urls = new Set<string>();
  for (const write of writesIn(body)) {
    const collection = typeof write.collection === 'string' ? write.collection : '';
    const id = typeof write.id === 'string' ? write.id : '';
    const pathFor = PATH_FOR[collection];
    if (!pathFor || !id || (typeof write.parentPath === 'string' && write.parentPath)) continue;
    // A deleted record is gone: its id-based URL still tells engines to recrawl (and drop) it.
    const record: TursoDocument | null = await getTursoDocument(collection, '', id);
    const path = pathFor(record?.data || {}, id);
    if (path) urls.add(`${CANONICAL_SITE_ORIGIN}${path}`);
  }
  return [...urls];
}

/** Production only, so local and preview deployments never announce URLs. */
export const isIndexNowEnabled = () =>
  process.env.VERCEL_ENV === 'production' && !/localhost|127\.0\.0\.1/.test(CANONICAL_SITE_ORIGIN);

/** Submits URLs to IndexNow. Never throws: a failed ping must not fail the admin's save. */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (!urls.length) return;
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(CANONICAL_SITE_ORIGIN).host,
        key: INDEXNOW_KEY,
        keyLocation: `${CANONICAL_SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10_000),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    // 200 and 202 both mean accepted.
    if (!response.ok) console.warn(`[IndexNow] Submission returned HTTP ${response.status}.`);
  } catch (error) {
    console.warn('[IndexNow] Submission failed:', error);
  }
}
