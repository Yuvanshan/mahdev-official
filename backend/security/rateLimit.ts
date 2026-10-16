import type { IncomingMessage } from 'node:http';
import { getTursoClient } from '../db/tursoDatabase.js';

/**
 * Shared, database-backed fixed-window rate limiter.
 *
 * In-memory limiters reset on every serverless cold start and are not shared
 * between instances, so they are easy to bypass. Counters here live in Turso,
 * so every instance sees the same count. One atomic upsert per check.
 */

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  tableReady ??= getTursoClient()
    .execute(
      'CREATE TABLE IF NOT EXISTS security_rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)'
    )
    .then(() => undefined)
    .catch((error: unknown) => {
      tableReady = null;
      throw error;
    });
  return tableReady;
}

export class RateLimitError extends Error {
  readonly statusCode = 429;
  constructor(message = 'Too many requests. Please wait a few minutes and try again.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Adds `cost` to the counter for `key` and throws RateLimitError once `limit`
 * is exceeded within `windowMs`.
 */
export async function consumeRateLimit(key: string, limit: number, windowMs: number, cost = 1): Promise<void> {
  await ensureTable();
  const now = Date.now();
  const resetAt = now + windowMs;
  // Start a new window when the old one has expired, otherwise add to it.
  const result = await getTursoClient().execute({
    sql: `INSERT INTO security_rate_limits (key, count, reset_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            count = CASE WHEN reset_at <= ? THEN excluded.count ELSE count + excluded.count END,
            reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END
          RETURNING count`,
    args: [key.slice(0, 200), cost, resetAt, now, now],
  });
  const count = Number(result.rows[0]?.count ?? 0);
  if (count > limit) throw new RateLimitError();
}

/**
 * Client IP for rate limiting. On Vercel, `x-vercel-forwarded-for` and
 * `x-real-ip` are set by the platform and cannot be spoofed by the client;
 * the generic `x-forwarded-for` header is only used as a last resort.
 */
export function getClientIp(req: IncomingMessage): string {
  const header = (name: string) => {
    const value = req.headers[name];
    return (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim() || '';
  };
  return header('x-vercel-forwarded-for') || header('x-real-ip') || req.socket?.remoteAddress || header('x-forwarded-for') || 'unknown';
}

// Per-IP limits for anonymous submissions, by collection.
export const PUBLIC_SUBMISSION_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  analyticsEvents: { limit: 300, windowMs: 10 * 60 * 1000 },
  inquiries: { limit: 5, windowMs: 10 * 60 * 1000 },
  contactSubmissions: { limit: 5, windowMs: 10 * 60 * 1000 },
  quoteRequests: { limit: 5, windowMs: 10 * 60 * 1000 },
  careerApplications: { limit: 5, windowMs: 10 * 60 * 1000 },
  orders: { limit: 10, windowMs: 60 * 60 * 1000 },
  bookings: { limit: 10, windowMs: 60 * 60 * 1000 },
};
