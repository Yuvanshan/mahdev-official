import type { IncomingMessage, ServerResponse } from 'node:http';

interface FirebaseAuthRequest extends IncomingMessage {
  method?: string;
  url?: string;
}

const MAX_AUTH_REQUEST_BYTES = 2 * 1024 * 1024;
const RESPONSE_HEADERS = [
  'cache-control',
  'content-security-policy',
  'content-type',
  'etag',
  'expires',
  'location',
  'vary',
] as const;

function configuredAuthOrigin(): URL {
  const configuredDomain = process.env.FIREBASE_AUTH_DOMAIN
    || process.env.VITE_FIREBASE_AUTH_DOMAIN
    || '';
  if (!configuredDomain) throw new Error('Firebase Auth domain is not configured.');

  const origin = new URL(
    configuredDomain.includes('://') ? configuredDomain : `https://${configuredDomain}`
  );
  if (
    origin.protocol !== 'https:' ||
    !origin.hostname ||
    origin.username ||
    origin.password ||
    (origin.pathname !== '/' && origin.pathname !== '') ||
    origin.search ||
    origin.hash
  ) {
    throw new Error('Firebase Auth domain must be a valid HTTPS origin.');
  }
  return origin;
}

async function readRequestBody(req: FirebaseAuthRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const data = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk);
    size += data.length;
    if (size > MAX_AUTH_REQUEST_BYTES) throw new Error('Firebase Auth request body is too large.');
    chunks.push(data);
  }
  return Buffer.concat(chunks);
}

export default async function firebaseAuthProxy(
  req: FirebaseAuthRequest,
  res: ServerResponse
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const authOrigin = configuredAuthOrigin();
    const incomingUrl = new URL(req.url || '/', 'https://localhost');
    const authPath = incomingUrl.pathname.replace(/^\/api\/firebase-auth/, '/__/auth');
    const targetUrl = new URL(`${authPath}${incomingUrl.search}`, authOrigin);
    const method = req.method || 'GET';
    const headers = new Headers();
    for (const headerName of ['accept', 'content-type', 'cookie', 'origin', 'referer', 'user-agent']) {
      const value = req.headers[headerName];
      if (typeof value === 'string') headers.set(headerName, value);
    }

    const body = method === 'GET' || method === 'HEAD' ? undefined : await readRequestBody(req);
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      ...(body?.length ? { body, duplex: 'half' } : {}),
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    } as RequestInit);

    res.statusCode = upstream.status;
    for (const headerName of RESPONSE_HEADERS) {
      const value = upstream.headers.get(headerName);
      if (value) res.setHeader(headerName, value);
    }
    const cookies = upstream.headers.getSetCookie();
    if (cookies.length) res.setHeader('Set-Cookie', cookies);

    if (method === 'HEAD' || !upstream.body) {
      res.end();
      return;
    }
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise<void>((resolve) => res.once('drain', resolve));
      }
    }
    res.end();
  } catch (error) {
    console.error('[Firebase Auth Proxy] Request failed:', error);
    if (!res.headersSent) {
      res.statusCode = error instanceof Error && error.message.includes('too large') ? 413 : 502;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    res.end('Firebase Authentication is temporarily unavailable.');
  }
}
