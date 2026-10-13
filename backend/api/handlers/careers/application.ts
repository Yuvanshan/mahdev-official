import type { IncomingMessage, ServerResponse } from 'node:http';
import { AdminSessionAuthError, getAdminSessionFromCookie } from '../../../auth/adminCredentialAuth.js';
import {
  getTursoDocument,
  initializeTursoDatabase,
  writeTursoDocument,
} from '../../../db/tursoDatabase.js';
import { deleteCareerCv } from '../../../services/adminMediaUpload.js';

interface CareerApplicationRequest extends IncomingMessage {
  method?: string;
  url?: string;
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

export default async function handler(
  request: CareerApplicationRequest,
  response: ServerResponse
): Promise<void> {
  response.setHeader('Cache-Control', 'private, no-store');
  if (request.method !== 'DELETE') {
    response.setHeader('Allow', 'DELETE');
    sendJson(response, 405, { success: false, error: 'Method not allowed.' });
    return;
  }

  try {
    getAdminSessionFromCookie(
      Array.isArray(request.headers.cookie) ? request.headers.cookie[0] : request.headers.cookie
    );
    const url = new URL(request.url || '/', 'http://localhost');
    const applicationId = url.searchParams.get('id') || '';
    if (!/^[0-9a-f-]{36}$/i.test(applicationId)) {
      sendJson(response, 400, { success: false, error: 'A valid application ID is required.' });
      return;
    }

    await initializeTursoDatabase();
    const application = await getTursoDocument('careerApplications', '', applicationId);
    if (!application) {
      sendJson(response, 404, { success: false, error: 'Application not found.' });
      return;
    }

    await writeTursoDocument({
      type: 'delete',
      collection: 'careerApplications',
      parentPath: '',
      id: applicationId,
    });

    let cleanupWarning: string | undefined;
    if (typeof application.data.cvStoragePath === 'string') {
      try {
        await deleteCareerCv(application.data.cvStoragePath);
      } catch (error) {
        console.error('[Careers] Application was deleted but CV cleanup failed:', error);
        cleanupWarning = 'Application deleted, but its private CV file could not be removed.';
      }
    }
    sendJson(response, 200, { success: true, cleanupWarning });
  } catch (error) {
    if (error instanceof AdminSessionAuthError) {
      sendJson(response, error.statusCode, { success: false, error: error.message });
      return;
    }
    console.error('[Careers] Application deletion failed:', error);
    sendJson(response, 503, { success: false, error: 'Application could not be deleted.' });
  }
}
