import type { IncomingMessage, ServerResponse } from 'node:http';
import { initializeTursoDatabase } from '../../db/tursoDatabase.js';
import { AdminSessionAuthError } from '../../auth/adminCredentialAuth.js';
import { FirebaseTokenError } from '../../auth/firebaseIdToken.js';
import {
  authorizeDatabaseAction,
  handleTursoAction,
  type DatabaseAccess,
} from '../tursoRoutes.js';

interface TursoApiRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

let initialization: Promise<void> | undefined;

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
      error: 'Turso is unavailable or not configured. Check the server database environment.',
    }));
    return;
  }

  const result = await handleTursoAction(req.body, access);
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}

export default function handler(req: TursoApiRequest, res: ServerResponse): Promise<void> {
  return handleTursoDatabaseRequest(req, res);
}
