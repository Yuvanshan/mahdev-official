import type { IncomingMessage, ServerResponse } from 'node:http';
import { AdminSessionAuthError, requireAdminSession } from '../../../auth/adminCredentialAuth.js';
import { initializeTursoDatabase, getTursoDocument } from '../../../db/tursoDatabase.js';
import { readCareerCv, storeCareerCv } from '../../../services/adminMediaUpload.js';

const MAX_CV_BYTES = 10 * 1024 * 1024;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const UPLOAD_MAX_PER_WINDOW = 5;
const uploadAttempts = new Map<string, { count: number; resetAt: number }>();
let databaseInitialization: Promise<void> | undefined;

interface CareerCvRequest extends IncomingMessage {
  method?: string;
  url?: string;
  body?: unknown;
}

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const parsedBody = (request as CareerCvRequest).body;
  if (Buffer.isBuffer(parsedBody)) {
    if (parsedBody.length > MAX_CV_BYTES) throw new Error('CV file exceeds the 10 MB limit.');
    return parsedBody;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += data.length;
    if (size > MAX_CV_BYTES) throw new Error('CV file exceeds the 10 MB limit.');
    chunks.push(data);
  }
  return Buffer.concat(chunks);
}

function checkUploadRateLimit(request: IncomingMessage): void {
  const forwardedFor = request.headers['x-forwarded-for'];
  const clientKey = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
    ?.split(',')[0]
    ?.trim() || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  for (const [key, attempt] of uploadAttempts) {
    if (attempt.resetAt <= now) uploadAttempts.delete(key);
  }
  const attempt = uploadAttempts.get(clientKey);
  if (attempt && attempt.count >= UPLOAD_MAX_PER_WINDOW) {
    throw new Error('Too many CV uploads from this connection. Please try again later.');
  }
  uploadAttempts.set(clientKey, attempt
    ? { ...attempt, count: attempt.count + 1 }
    : { count: 1, resetAt: now + UPLOAD_WINDOW_MS });
}

async function ensureDatabaseInitialized(): Promise<void> {
  databaseInitialization ??= initializeTursoDatabase().catch((error: unknown) => {
    databaseInitialization = undefined;
    throw error;
  });
  return databaseInitialization;
}

function sendError(response: ServerResponse, status: number, message: string): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ success: false, error: message }));
}

export default async function handler(request: CareerCvRequest, response: ServerResponse): Promise<void> {
  response.setHeader('Cache-Control', 'private, no-store');

  if (request.method === 'POST') {
    try {
      checkUploadRateLimit(request);
      const body = await readBody(request);
      const filenameHeader = request.headers['x-cv-filename'];
      const filename = Array.isArray(filenameHeader) ? filenameHeader[0] : filenameHeader;
      if (!filename || filename.length > 160) {
        sendError(response, 400, 'A valid CV filename is required.');
        return;
      }
      const contentTypeHeader = request.headers['content-type'];
      const contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
      let decodedFilename: string;
      try {
        decodedFilename = decodeURIComponent(filename);
      } catch {
        sendError(response, 400, 'The CV filename is invalid.');
        return;
      }
      const storagePath = await storeCareerCv({
        filename: decodedFilename,
        contentType: contentType || '',
        body,
      });
      response.statusCode = 201;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ success: true, storagePath }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not upload the CV.';
      const status = /Too many/.test(message) ? 429 : /exceeds|Upload|valid CV|file type/.test(message) ? 400 : 503;
      if (status === 503) console.error('[Careers] CV upload failed:', error);
      sendError(response, status, message);
    }
    return;
  }

  if (request.method === 'GET') {
    try {
      await requireAdminSession(request.headers.cookie);
      const url = new URL(request.url || '/', 'http://localhost');
      const applicationId = url.searchParams.get('id') || '';
      if (!/^[0-9a-f-]{36}$/i.test(applicationId)) {
        sendError(response, 400, 'A valid application ID is required.');
        return;
      }
      await ensureDatabaseInitialized();
      const application = await getTursoDocument('careerApplications', '', applicationId);
      const storagePath = application?.data.cvStoragePath;
      const fileName = application?.data.cvFileName;
      if (typeof storagePath !== 'string' || typeof fileName !== 'string') {
        sendError(response, 404, 'CV not found for this application.');
        return;
      }
      const cv = await readCareerCv(storagePath);
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'applicant-cv';
      response.statusCode = 200;
      response.setHeader('Content-Type', cv.contentType);
      response.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.end(cv.body);
    } catch (error) {
      if (error instanceof AdminSessionAuthError) {
        sendError(response, error.statusCode, error.message);
        return;
      }
      console.error('[Careers] Admin CV retrieval failed:', error);
      sendError(response, 503, 'The CV could not be retrieved.');
    }
    return;
  }

  response.setHeader('Allow', 'GET, POST');
  sendError(response, 405, 'Method not allowed.');
}
