import type { IncomingMessage, ServerResponse } from 'node:http';
import { initializeTursoDatabase } from '../server/tursoDatabase';
import { AdminAuthenticationError } from '../server/firebaseAdminAuth';
import { authorizeDatabaseAction, handleTursoAction } from '../server/tursoRoutes';

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

export default async function handler(req: TursoApiRequest, res: ServerResponse): Promise<void> {
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

  try {
    await ensureDatabaseInitialized();
  } catch (error) {
    console.error('[Turso API] Database initialization failed:', error);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Turso is unavailable or not configured. Check the server database environment.',
    }));
    return;
  }

  try {
    const authorization = req.headers.authorization;
    await authorizeDatabaseAction(
      req.body,
      Array.isArray(authorization) ? authorization[0] : authorization
    );
  } catch (error) {
    const status = error instanceof AdminAuthenticationError ? error.statusCode : 401;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Admin authorization failed.',
    }));
    return;
  }

  const result = await handleTursoAction(req.body);
  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result.body));
}
