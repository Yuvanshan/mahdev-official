import type { IncomingMessage, ServerResponse } from 'node:http';
import { AdminSessionAuthError, requireAdminSession } from '../../auth/adminCredentialAuth.js';
import { fetchPlaceReviews, placeIdFor, type Branch } from '../../services/googleReviews/places.js';

interface SyncRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

const GOOGLE_TIMEOUT_MS = 10_000;

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Admin-only. Reads one place from the Google Places API and returns it in the shape the admin
 * "Sync" button expects, so a copy can be saved as the fallback shown when Google is unreachable.
 * The API key stays on the server (GOOGLE_PLACES_API_KEY).
 */
export default async function handler(req: SyncRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, error: 'Only POST requests are supported.' });
    return;
  }

  try {
    await requireAdminSession(req.headers.cookie);
  } catch (error) {
    sendJson(res, error instanceof AdminSessionAuthError ? error.statusCode : 401, { success: false, error: 'Please sign in as an admin.' });
    return;
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 503, { success: false, error: 'Google Places is not configured on the server.' });
    return;
  }

  const body = (req.body || {}) as { branch?: unknown; placeId?: unknown };
  if (body.branch !== 'trincomalee' && body.branch !== 'colombo') {
    sendJson(res, 400, { success: false, error: 'A branch (trincomalee or colombo) is required.' });
    return;
  }

  try {
    // An admin-entered Place ID wins. If Google rejects it (for example an old placeholder saved
    // earlier), fall back to finding the profile by name.
    let placeId = await placeIdFor(body.branch as Branch, apiKey, GOOGLE_TIMEOUT_MS, body.placeId);
    let place;
    try {
      place = await fetchPlaceReviews(placeId, apiKey, GOOGLE_TIMEOUT_MS);
    } catch (error) {
      if (!body.placeId) throw error;
      placeId = await placeIdFor(body.branch as Branch, apiKey, GOOGLE_TIMEOUT_MS);
      place = await fetchPlaceReviews(placeId, apiKey, GOOGLE_TIMEOUT_MS);
    }
    sendJson(res, 200, { success: true, placeId, ...place });
  } catch (error) {
    console.error('[Google Reviews] Sync failed:', error instanceof Error ? error.message : error);
    sendJson(res, 502, { success: false, error: 'Google did not return the reviews. Check the API key and that Places API (New) is enabled.' });
  }
}
