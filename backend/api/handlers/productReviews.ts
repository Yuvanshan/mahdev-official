import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AdminSessionAuthError, requireAdminSession } from '../../auth/adminCredentialAuth.js';
import { FirebaseTokenError, verifyFirebaseIdToken } from '../../auth/firebaseIdToken.js';
import {
  getTursoDocument,
  initializeTursoDatabase,
  listTursoDocuments,
  writeTursoDocument,
} from '../../db/tursoDatabase.js';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../security/rateLimit.js';

// Customer product reviews, kept in the "productReviews" collection.
//   GET    ?productId=…  public: the reviews of one product
//   GET                  admin:  every review (moderation list)
//   POST                 signed-in customer: add or replace their own review of a product
//   DELETE ?id=…         admin:  remove a review
const COLLECTION = 'productReviews';
const MAX_COMMENT_LENGTH = 1000;
const MAX_TITLE_LENGTH = 100;
const MAX_ADMIN_LIST_ROWS = 500;
const MAX_PRODUCT_REVIEWS = 200;
const REVIEW_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

interface ReviewRequest extends IncomingMessage {
  body?: unknown;
}

let databaseInitialization: Promise<void> | undefined;
function ensureDatabase(): Promise<void> {
  databaseInitialization ??= initializeTursoDatabase().catch((error: unknown) => {
    databaseInitialization = undefined;
    throw error;
  });
  return databaseInitialization;
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
}

// The document id carries a hash of the customer's uid, so a review is one per customer and
// product, and the uid itself never reaches the public list.
function reviewId(productId: string, uid: string): string {
  return `${productId}_${crypto.createHash('sha256').update(uid).digest('hex').slice(0, 16)}`;
}

function publicReview(id: string, data: Record<string, unknown>) {
  return {
    id,
    productId: data.productId,
    author: data.author,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
    createdAt: data.createdAt,
  };
}

// Keep the product's average rating and count in step with its reviews.
async function refreshProductRating(productId: string): Promise<void> {
  const reviews = await listTursoDocuments(
    COLLECTION, '', [{ field: 'productId', operator: '==', value: productId }], undefined, MAX_PRODUCT_REVIEWS
  );
  const ratings = reviews.map((review) => Number(review.data.rating)).filter((rating) => rating >= 1 && rating <= 5);
  const average = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  await writeTursoDocument({
    type: 'update',
    collection: 'products',
    parentPath: '',
    id: productId,
    data: { rating: Math.round(average * 10) / 10, reviewsCount: ratings.length },
    merge: true,
  });
}

async function listReviews(request: ReviewRequest, response: ServerResponse): Promise<void> {
  const url = new URL(request.url || '/', 'http://localhost');
  const productId = text(url.searchParams.get('productId'), 128);
  if (productId) {
    const reviews = await listTursoDocuments(
      COLLECTION, '', [{ field: 'productId', operator: '==', value: productId }],
      { field: 'createdAt', direction: 'desc' }, MAX_PRODUCT_REVIEWS
    );
    sendJson(response, 200, { success: true, reviews: reviews.map((review) => publicReview(review.id, review.data)) });
    return;
  }

  await requireAdminSession(request.headers.cookie);
  const reviews = await listTursoDocuments(COLLECTION, '', [], { field: 'createdAt', direction: 'desc' }, MAX_ADMIN_LIST_ROWS);
  sendJson(response, 200, { success: true, reviews: reviews.map((review) => publicReview(review.id, review.data)) });
}

async function saveReview(request: ReviewRequest, response: ServerResponse): Promise<void> {
  const identity = await verifyFirebaseIdToken(request.headers.authorization);
  await consumeRateLimit(`review:${identity.uid}:${getClientIp(request)}`, REVIEW_LIMIT.limit, REVIEW_LIMIT.windowMs);

  const body = request.body && typeof request.body === 'object' && !Array.isArray(request.body)
    ? request.body as Record<string, unknown>
    : null;
  const productId = text(body?.productId, 128);
  const rating = Number(body?.rating);
  const comment = text(body?.comment, MAX_COMMENT_LENGTH);
  if (!productId || productId.includes('/') || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3) {
    sendJson(response, 400, { success: false, error: 'Choose a rating from 1 to 5 and write a short comment.' });
    return;
  }
  // Only products that exist can be reviewed.
  if (!(await getTursoDocument('products', '', productId))) {
    sendJson(response, 404, { success: false, error: 'This product could not be found.' });
    return;
  }

  const id = reviewId(productId, identity.uid);
  const existing = await getTursoDocument(COLLECTION, '', id);
  // Only the first name of the signed-in customer is shown with a review.
  const profile = await getTursoDocument('users', '', identity.uid);
  const profileName = typeof profile?.data.name === 'string' ? profile.data.name : profile?.data.displayName;
  const firstName = text(profileName, 60).split(' ')[0] || 'Customer';
  const data = {
    productId,
    author: firstName,
    rating,
    title: text(body?.title, MAX_TITLE_LENGTH),
    comment,
    createdAt: typeof existing?.data.createdAt === 'string' ? existing.data.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeTursoDocument({ type: 'set', collection: COLLECTION, parentPath: '', id, data });
  await refreshProductRating(productId);
  sendJson(response, 200, { success: true, review: publicReview(id, data) });
}

async function deleteReview(request: ReviewRequest, response: ServerResponse): Promise<void> {
  await requireAdminSession(request.headers.cookie);
  const id = text(new URL(request.url || '/', 'http://localhost').searchParams.get('id'), 200);
  if (!id || id.includes('/')) {
    sendJson(response, 400, { success: false, error: 'A review id is required.' });
    return;
  }
  const review = await getTursoDocument(COLLECTION, '', id);
  if (!review) {
    sendJson(response, 404, { success: false, error: 'Review not found.' });
    return;
  }
  await writeTursoDocument({ type: 'delete', collection: COLLECTION, parentPath: '', id });
  if (typeof review.data.productId === 'string') await refreshProductRating(review.data.productId);
  sendJson(response, 200, { success: true });
}

export default async function handler(request: ReviewRequest, response: ServerResponse): Promise<void> {
  try {
    await ensureDatabase();
    if (request.method === 'GET') return await listReviews(request, response);
    if (request.method === 'POST') return await saveReview(request, response);
    if (request.method === 'DELETE') return await deleteReview(request, response);
    response.setHeader('Allow', 'GET, POST, DELETE');
    sendJson(response, 405, { success: false, error: 'Method not allowed.' });
  } catch (error) {
    if (error instanceof AdminSessionAuthError) {
      sendJson(response, error.statusCode, { success: false, error: error.message });
    } else if (error instanceof FirebaseTokenError) {
      sendJson(response, 401, { success: false, error: 'Please sign in to review a product.' });
    } else if (error instanceof RateLimitError) {
      sendJson(response, 429, { success: false, error: 'Too many reviews. Please try again later.' });
    } else {
      console.error('[ProductReviews] Request failed:', error);
      sendJson(response, 503, { success: false, error: 'Reviews are temporarily unavailable.' });
    }
  }
}
