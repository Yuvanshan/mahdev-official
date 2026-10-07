import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  AdminAuthenticationError,
  getBearerToken,
  verifyFirebaseAdminToken,
} from '../../server/firebaseAdminAuth';
import { initializeTursoDatabase, listTursoDocuments } from '../../server/tursoDatabase';

interface AdminCustomersRequest extends IncomingMessage {
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

export default async function handler(req: AdminCustomersRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Only GET requests are supported.' }));
    return;
  }

  try {
    await ensureDatabaseInitialized();
    const authorization = req.headers.authorization;
    await verifyFirebaseAdminToken(getBearerToken(
      Array.isArray(authorization) ? authorization[0] : authorization
    ));
    const records = await listTursoDocuments('users', '');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      customers: records.map((record) => ({ ...record.data, id: record.id })),
    }));
  } catch (error) {
    const status = error instanceof AdminAuthenticationError ? error.statusCode : 503;
    if (!(error instanceof AdminAuthenticationError)) {
      console.error('[Admin Customers] Turso customer query failed:', error);
    }
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error instanceof AdminAuthenticationError
        ? error.message
        : 'Customer records could not be loaded.',
    }));
  }
}
