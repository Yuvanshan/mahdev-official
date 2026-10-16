import type { IncomingMessage, ServerResponse } from 'node:http';
import { initializeTursoDatabase } from '../../db/tursoDatabase.js';
import { handleTursoAction } from '../tursoRoutes.js';
import { consumeRateLimit, getClientIp, PUBLIC_SUBMISSION_LIMITS, RateLimitError } from '../../security/rateLimit.js';

/**
 * POST /api/analytics  { events: [{ id, type, path, title, sessionId, divisionId, metadata }] }
 *
 * Stores several analytics events in one request. The browser queues events
 * and sends them together (via navigator.sendBeacon when the page is hidden),
 * instead of one request per page view. Every event still passes the same
 * validation as a single public analytics write.
 */

const MAX_EVENTS_PER_REQUEST = 25;
const MAX_BODY_BYTES = 64 * 1024;

interface AnalyticsRequest extends IncomingMessage {
  body?: unknown;
}

// sendBeacon posts text/plain, which the JSON body parser skips, so read it here.
async function readBody(req: AnalyticsRequest): Promise<unknown> {
  // Express' JSON parser sets req.body = {} even for text/plain, so only trust
  // an already-parsed body when it actually carries events.
  if (req.body && typeof req.body === 'object' && 'events' in (req.body as object)) return req.body;
  if (typeof req.body === 'string' && req.body) return JSON.parse(req.body);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += data.length;
    if (size > MAX_BODY_BYTES) throw new Error('Analytics payload is too large.');
    chunks.push(data);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function analyticsHandler(req: AnalyticsRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Only POST requests are supported.' }));
    return;
  }

  let events: unknown[];
  try {
    const body = await readBody(req) as { events?: unknown };
    events = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS_PER_REQUEST) : [];
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'Invalid analytics payload.' }));
    return;
  }
  if (events.length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'No analytics events supplied.' }));
    return;
  }

  try {
    await initializeTursoDatabase();
    const rule = PUBLIC_SUBMISSION_LIMITS.analyticsEvents;
    await consumeRateLimit(`submit:analyticsEvents:${getClientIp(req)}`, rule.limit, rule.windowMs, events.length);
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.statusCode = 429;
      res.end(JSON.stringify({ success: false, error: error.message }));
      return;
    }
    console.error('[Analytics] Could not prepare analytics storage:', error);
    res.statusCode = 503;
    res.end(JSON.stringify({ success: false, error: 'Analytics storage is unavailable.' }));
    return;
  }

  let stored = 0;
  for (const event of events) {
    if (!event || typeof event !== 'object' || Array.isArray(event)) continue;
    const { id, ...data } = event as Record<string, unknown>;
    if (typeof id !== 'string') continue;
    // Same validation and normalisation as a single public analytics write.
    const result = await handleTursoAction(
      { action: 'write', write: { type: 'set', collection: 'analyticsEvents', id, data } },
      { role: 'public' }
    );
    if (result.status === 200) stored += 1;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, stored, received: events.length }));
}
