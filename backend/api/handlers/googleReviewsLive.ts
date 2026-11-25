import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchPlaceReviews, placeIdFor, type Branch, type PlaceReview } from '../../services/googleReviews/places.js';

interface LiveRequest extends IncomingMessage {
  method?: string;
}

// Short timeout: if Google is slow the website simply shows the admin's saved reviews.
const GOOGLE_TIMEOUT_MS = 4_000;
const CACHE_MS = 60 * 60 * 1000;

const BRANCHES: Branch[] = ['trincomalee', 'colombo'];
interface LiveReviews {
  rating?: number;
  total: number;
  reviews: Array<PlaceReview & { branch: Branch }>;
}

// Per-instance copy so repeated requests do not call Google every time.
let cached: { at: number; data: LiveReviews } | null = null;

async function loadLive(apiKey: string): Promise<LiveReviews | null> {
  const results = await Promise.allSettled(
    BRANCHES.map(async (branch) => ({
      branch,
      place: await fetchPlaceReviews(await placeIdFor(branch, apiKey, GOOGLE_TIMEOUT_MS), apiKey, GOOGLE_TIMEOUT_MS),
    }))
  );
  const ok = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
  results.forEach((result) => {
    if (result.status === 'rejected') console.error('[Google Reviews] Live fetch failed:', result.reason instanceof Error ? result.reason.message : result.reason);
  });

  const reviews = ok.flatMap(({ branch, place }) => place.reviews.map((review) => ({ ...review, branch })));
  if (reviews.length === 0) return null;

  // Combined rating across profiles, weighted by each profile's review count.
  const total = ok.reduce((sum, { place }) => sum + (place.userRatingCount || 0), 0);
  const points = ok.reduce((sum, { place }) => sum + (place.rating || 0) * (place.userRatingCount || 0), 0);
  return { rating: total ? Math.round((points / total) * 10) / 10 : undefined, total, reviews };
}

function sendJson(res: ServerResponse, status: number, cacheControl: string, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Public. Live Google reviews for both profiles. When Google fails or returns nothing, the last
 * good copy is used; with none, success is false and the website shows the admin's saved reviews.
 */
export default async function handler(req: LiveRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, 'no-store', { success: false });
    return;
  }
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 200, 'no-store', { success: false });
    return;
  }

  if (!cached || Date.now() - cached.at > CACHE_MS) {
    const fresh = await loadLive(apiKey);
    if (fresh) cached = { at: Date.now(), data: fresh };
  }
  if (!cached) {
    sendJson(res, 200, 'no-store', { success: false });
    return;
  }
  sendJson(res, 200, 'public, s-maxage=3600, stale-while-revalidate=86400', { success: true, ...cached.data });
}
