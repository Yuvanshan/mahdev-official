// Reads one place's rating and (up to 5) reviews from the Google Places API (New).
// Shared by the admin sync endpoint and the public live-reviews endpoint.
import { COMPANY_INFO } from '../../../shared/config/company.js';

// Google Place IDs are URL-safe base64-like strings (e.g. "ChIJ..."). Reject anything else
// so the value can never change the Google API path.
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;

export interface PlaceReview {
  googleReviewId: string;
  authorName: string;
  authorPhotoUrl?: string;
  authorUrl?: string;
  rating: number;
  text: string;
  relativePublishTimeDescription?: string;
  publishTime?: string;
}

export interface PlaceReviews {
  rating?: number;
  userRatingCount?: number;
  reviews: PlaceReview[];
}

interface GooglePlaceResponse {
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    name?: string;
    relativePublishTimeDescription?: string;
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
    publishTime?: string;
  }>;
}

export function isValidPlaceId(value: unknown): value is string {
  return typeof value === 'string' && PLACE_ID_PATTERN.test(value);
}

/** Throws on a bad ID, a non-200 answer or a timeout. The error message never contains Google's response body. */
export async function fetchPlaceReviews(placeId: string, apiKey: string, timeoutMs: number): Promise<PlaceReviews> {
  if (!isValidPlaceId(placeId)) throw new Error('Invalid Google Place ID.');
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Places API returned status ${response.status}`);

  const place = (await response.json()) as GooglePlaceResponse;
  return {
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    reviews: (place.reviews || [])
      .filter((review) => review.name && review.rating)
      .map((review) => ({
        googleReviewId: review.name as string,
        authorName: review.authorAttribution?.displayName || 'Google Customer',
        authorPhotoUrl: review.authorAttribution?.photoUri,
        authorUrl: review.authorAttribution?.uri,
        rating: review.rating as number,
        // Original wording, never edited or translated by us.
        text: review.originalText?.text || review.text?.text || '',
        relativePublishTimeDescription: review.relativePublishTimeDescription,
        publishTime: review.publishTime,
      })),
  };
}

export type Branch = 'trincomalee' | 'colombo';

// What to search Google for when no Place ID is configured. Check the result on the first sync;
// set GOOGLE_PLACE_ID_TRINCOMALEE / GOOGLE_PLACE_ID_COLOMBO to pin an exact profile.
const SEARCH_QUERY: Record<Branch, string> = {
  trincomalee: `SWS Event Management ${COMPANY_INFO.offices.trincomalee.fullAddress}`,
  colombo: `${COMPANY_INFO.legalName} ${COMPANY_INFO.offices.colombo.fullAddress}`,
};

const resolvedIds = new Map<Branch, string>();

async function searchPlaceId(query: string, apiKey: string, timeoutMs: number): Promise<string> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id', 'Content-Type': 'application/json' },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Places search returned status ${response.status}`);
  const id = ((await response.json()) as { places?: Array<{ id?: string }> }).places?.[0]?.id;
  if (!isValidPlaceId(id)) throw new Error('Google found no matching place.');
  return id;
}

/** Place ID for a branch: the given override, then the env variable, then a Google search (kept for later calls). */
export async function placeIdFor(branch: Branch, apiKey: string, timeoutMs: number, override?: unknown): Promise<string> {
  if (isValidPlaceId(override)) return override;
  const fromEnv = process.env[`GOOGLE_PLACE_ID_${branch.toUpperCase()}`]?.trim();
  if (isValidPlaceId(fromEnv)) return fromEnv;
  const known = resolvedIds.get(branch);
  if (known) return known;
  const found = await searchPlaceId(SEARCH_QUERY[branch], apiKey, timeoutMs);
  resolvedIds.set(branch, found);
  return found;
}
