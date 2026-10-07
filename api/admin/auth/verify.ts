import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  AdminAuthenticationError,
  getBearerToken,
  verifyFirebaseAdminToken,
} from '../../../server/firebaseAdminAuth';
import { initializeTursoDatabase } from '../../../server/tursoDatabase';

interface AdminAuthRequest extends IncomingMessage {
  method?: string;
}

let initialization: Promise<void> | undefined;

function ensureDatabaseInitialized(): Promise<void> {
  initialization ??= initializeTursoDatabase().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export default async function handler(req: AdminAuthRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Only POST requests are supported.' }));
    return;
  }

  try {
    await ensureDatabaseInitialized();
    const authorization = req.headers.authorization;
    const { user } = await verifyFirebaseAdminToken(getBearerToken(
      Array.isArray(authorization) ? authorization[0] : authorization
    ));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, user }));
  } catch (error) {
    const status = error instanceof AdminAuthenticationError
      ? error.statusCode
      : 503;
    if (!(error instanceof AdminAuthenticationError)) {
      console.error('[Admin Auth] Firebase token verification failed:', error);
    }
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error instanceof AdminAuthenticationError
        ? error.message
        : 'Firebase authentication could not be verified.',
    }));
  }
}
