import type { IncomingMessage, ServerResponse } from 'http';
import {
  AdminSessionAuthError,
  getAdminSessionFromCookie,
} from '../../../auth/adminCredentialAuth.js';
import { createAdminMediaUpload } from '../../../services/adminMediaUpload.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readJsonBody(
  req: IncomingMessage
): Promise<{ filename: unknown; contentType: unknown; size: unknown }> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += data.length;
    if (size > 16 * 1024) throw new Error('Upload initialization request is too large.');
    chunks.push(data);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  return {
    filename: body.filename,
    contentType: body.contentType,
    size: body.size,
  };
}

export default async function handler(req: IncomingMessage & { method?: string }, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = req.method === 'GET' ? 200 : 405;
    res.end(JSON.stringify(
      req.method === 'GET'
        ? { status: 'active', endpoint: '/api/upload/media' }
        : { success: false, error: 'Method not allowed.' }
    ));
    return;
  }

  try {
    getAdminSessionFromCookie(req.headers.cookie);
    const body = await readJsonBody(req);
    const upload = await createAdminMediaUpload(body);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, ...upload }));
  } catch (error) {
    const statusCode = error instanceof AdminSessionAuthError
      ? error.statusCode
      : error instanceof SyntaxError
        ? 400
        : error instanceof Error && /Unsupported media type|Media size|request is too large/.test(error.message)
          ? 400
          : 503;
    if (statusCode === 503) {
      console.error('[AdminMediaUpload] Could not initialize secure upload:', error);
    }
    res.statusCode = statusCode;
    res.end(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Could not initialize media upload.',
    }));
  }
}
