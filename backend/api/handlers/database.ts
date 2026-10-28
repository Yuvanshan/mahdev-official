import type { IncomingMessage, ServerResponse } from 'node:http';
import { initializeTursoDatabase } from '../../db/tursoDatabase.js';
import { AdminSessionAuthError } from '../../auth/adminCredentialAuth.js';
import { FirebaseTokenError } from '../../auth/firebaseIdToken.js';
import {
  authorizeDatabaseAction,
  handleTursoAction,
  type DatabaseAccess,
} from '../tursoRoutes.js';
import { notifyCustomerOfConfirmation, notifyForVerifiedSubmission } from '../../services/submissionAlerts.js';
import { changedPublicUrls, isIndexNowEnabled, submitToIndexNow } from '../../seo/indexNow.js';
import {
  consumeRateLimit,
  getClientIp,
  PUBLIC_SUBMISSION_LIMITS,
  RateLimitError,
} from '../../security/rateLimit.js';

interface TursoApiRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

let initialization: Promise<void> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function ensureDatabaseInitialized(): Promise<void> {
  initialization ??= initializeTursoDatabase().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export async function handleTursoDatabaseRequest(
  req: TursoApiRequest,
  res: ServerResponse,
  fixedCollection?: string
): Promise<void> {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Only POST requests are supported.' }));
    return;
  }
  if (fixedCollection) {
    const body = req.body && typeof req.body === 'object'
      ? req.body as Record<string, unknown>
      : {};
    const targetCollection = body.action === 'write' && body.write && typeof body.write === 'object'
      ? (body.write as Record<string, unknown>).collection
      : body.collection;
    if (body.action === 'batch' || body.action === 'health' || targetCollection !== fixedCollection) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: 'The requested database collection does not match this API resource.',
      }));
      return;
    }
  }

  let access: DatabaseAccess;
  try {
    access = await authorizeDatabaseAction(
      req.body,
      Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie,
      Array.isArray(req.headers.authorization)
        ? req.headers.authorization[0]
        : req.headers.authorization
    );
  } catch (error) {
    const status = error instanceof AdminSessionAuthError || error instanceof FirebaseTokenError
      ? error.statusCode
      : 403;
    res.statusCode = status;
    res.end(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Admin authorization failed.',
    }));
    return;
  }

  try {
    await ensureDatabaseInitialized();
  } catch (error) {
    console.error('[Turso API] Database initialization failed:', error);
    res.statusCode = 503;
    res.end(JSON.stringify({
      success: false,
      error: 'Database is unavailable or not configured. Check the server database environment.',
    }));
    return;
  }

  // Shared per-IP limits for anonymous submissions (forms, orders, analytics).
  if (access.role !== 'admin' && isRecord(req.body) && req.body.action === 'write' && isRecord(req.body.write)) {
    const collection = typeof req.body.write.collection === 'string' ? req.body.write.collection : '';
    const rule = PUBLIC_SUBMISSION_LIMITS[collection];
    if (rule) {
      try {
        await consumeRateLimit(`submit:${collection}:${getClientIp(req)}`, rule.limit, rule.windowMs);
      } catch (error) {
        if (!(error instanceof RateLimitError)) {
          console.error('[Turso API] Rate limiter unavailable:', error);
        } else {
          res.statusCode = 429;
          res.setHeader('Retry-After', String(Math.ceil(rule.windowMs / 1000)));
          res.end(JSON.stringify({ success: false, error: error.message }));
          return;
        }
      }
    }
  }

  const result = await handleTursoAction(req.body, access);
  if (result.status === 200 && result.body.success === true) {
    try {
      await notifyForVerifiedSubmission(req.body, access);
      await notifyCustomerOfConfirmation(req.body, access);
    } catch (error) {
      console.error('[Turso API] Verified submission alert failed:', error);
    }
    // Admin content changes: tell IndexNow search engines (Bing etc.) which public pages changed.
    if (access.role === 'admin' && isIndexNowEnabled()) {
      try {
        await submitToIndexNow(await changedPublicUrls(req.body));
      } catch (error) {
        console.error('[Turso API] IndexNow URLs could not be collected:', error);
      }
    }
  }
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}

export default function handler(req: TursoApiRequest, res: ServerResponse): Promise<void> {
  return handleTursoDatabaseRequest(req, res);
}
