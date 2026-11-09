import { createHash, createSign, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { CANONICAL_SITE_ORIGIN } from '../../../frontend/src/config/site.js';
import { getTursoClient } from '../../db/tursoDatabase.js';
import { verifyFirebaseIdToken, FirebaseTokenError } from '../../auth/firebaseIdToken.js';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../security/rateLimit.js';

interface SsoRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

const CODE_TTL_MS = 60_000;
const FIREBASE_CUSTOM_TOKEN_AUDIENCE =
  'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://mahdev.lk',
  'https://www.mahdev.lk',
  'https://mahdev-official.vercel.app',
  'https://sws-events.vercel.app',
  'https://u1-studio.vercel.app',
  'https://mahdev-it.vercel.app',
  'https://mahdev-mart.vercel.app',
  'https://mahdev-travels.vercel.app',
];

let tableReady: Promise<void> | undefined;

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function configuredOrigins(): Set<string> {
  const values = [
    CANONICAL_SITE_ORIGIN,
    ...DEFAULT_ALLOWED_ORIGINS,
    process.env.APP_URL,
    process.env.PUBLIC_SITE_URL,
    process.env.VITE_SITE_URL,
    process.env.VITE_APP_URL,
    process.env.VITE_SWS_SITE_URL,
    process.env.VITE_U1_SITE_URL,
    process.env.VITE_IT_SITE_URL,
    process.env.VITE_MART_SITE_URL,
    process.env.VITE_TRAVELS_SITE_URL,
    ...(process.env.SSO_ALLOWED_ORIGINS || '').split(','),
  ];
  const origins = new Set<string>();
  for (const value of values) {
    if (!value?.trim()) continue;
    try {
      const url = new URL(value.trim());
      if (url.protocol === 'https:' && url.origin === value.trim().replace(/\/$/, '')) {
        origins.add(url.origin);
      }
    } catch {
      throw new Error('An SSO allowed origin is not a valid HTTPS origin.');
    }
  }
  if (process.env.NODE_ENV !== 'production') origins.add('http://localhost:5173');
  return origins;
}

function requestOrigin(req: SsoRequest): string {
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || !configuredOrigins().has(origin)) {
    throw new SsoRequestError('This website is not allowed to use Mahdev sign-in.', 403);
  }
  return origin;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function ensureCodeTable(): Promise<void> {
  tableReady ??= (async () => {
    const client = getTursoClient();
    await Promise.all([
      client.execute(
        `CREATE TABLE IF NOT EXISTS sso_codes (
          code_hash TEXT PRIMARY KEY,
          uid TEXT NOT NULL,
          auth_time INTEGER NOT NULL DEFAULT 0,
          target_origin TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )`
      ),
      client.execute(
        `CREATE TABLE IF NOT EXISTS sso_sessions (
          uid TEXT PRIMARY KEY,
          logged_out_at INTEGER NOT NULL
        )`
      ),
    ]);

    const schema = await client.execute('PRAGMA table_info(sso_codes)');
    const hasAuthTime = schema.rows.some((column) => column.name === 'auth_time');
    if (!hasAuthTime) {
      try {
        await client.execute('ALTER TABLE sso_codes ADD COLUMN auth_time INTEGER NOT NULL DEFAULT 0');
      } catch (error) {
        const refreshedSchema = await client.execute('PRAGMA table_info(sso_codes)');
        if (!refreshedSchema.rows.some((column) => column.name === 'auth_time')) throw error;
      }
    }
  })().catch((error: unknown) => {
    tableReady = undefined;
    throw error;
  });
  return tableReady;
}

function effectiveAuthTime(identity: { authTime: number; ssoAuthTime?: number }): number {
  return Math.min(identity.authTime, identity.ssoAuthTime ?? identity.authTime);
}

async function createSsoCode(uid: string, authTime: number, targetOrigin: string): Promise<string> {
  const code = randomBytes(32).toString('base64url');
  const now = Date.now();
  await ensureCodeTable();
  await getTursoClient().batch([
    { sql: 'DELETE FROM sso_codes WHERE expires_at <= ?', args: [now] },
    {
      sql: `INSERT INTO sso_codes
        (code_hash, uid, auth_time, target_origin, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        createHash('sha256').update(code).digest('hex'),
        uid,
        authTime,
        targetOrigin,
        now + CODE_TTL_MS,
        now,
      ],
    },
  ]);
  return code;
}

function serviceAccount(): { projectId: string; clientEmail: string; privateKey: string } {
  const serialized = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serialized) throw new Error('Firebase service-account signing is not configured.');

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    const escapedPrivateKey = serialized.replace(
      /("private_key"\s*:\s*")([\s\S]*?)("\s*[,}])/,
      (_match, prefix: string, privateKey: string, suffix: string) =>
        `${prefix}${privateKey.replace(/\r?\n/g, '\\n')}${suffix}`
    );
    try {
      value = JSON.parse(escapedPrivateKey);
    } catch {
      throw new Error('Firebase service-account configuration is invalid.');
    }
  }
  if (!isRecord(value)) throw new Error('Firebase service-account configuration is invalid.');

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
  if (
    value.project_id !== projectId ||
    typeof value.client_email !== 'string' ||
    typeof value.private_key !== 'string' ||
    !value.private_key.includes('PRIVATE KEY')
  ) {
    throw new Error('Firebase service-account signing is not configured for this project.');
  }
  return {
    projectId,
    clientEmail: value.client_email,
    privateKey: value.private_key.replace(/\\n/g, '\n'),
  };
}

function createFirebaseCustomToken(uid: string, authTime: number): string {
  const account = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = [
    encode({ alg: 'RS256', typ: 'JWT' }),
    encode({
      iss: account.clientEmail,
      sub: account.clientEmail,
      aud: FIREBASE_CUSTOM_TOKEN_AUDIENCE,
      iat: now,
      exp: now + 5 * 60,
      uid,
      claims: { mahdev_sso_auth_time: authTime },
    }),
  ].join('.');
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(account.privateKey).toString('base64url')}`;
}

class SsoRequestError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'SsoRequestError';
  }
}

export default async function ssoHandler(
  req: SsoRequest,
  res: ServerResponse,
  action: 'issue' | 'exchange' | 'session' | 'logout',
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { success: false, error: 'Only POST requests are supported.' });
    return;
  }

  try {
    const origin = requestOrigin(req);
    await consumeRateLimit(`sso:${action}:${getClientIp(req)}`, action === 'session' ? 120 : 30, 10 * 60_000);
    if (!isRecord(req.body)) throw new SsoRequestError('A valid request body is required.', 400);

    if (action === 'issue' || action === 'session' || action === 'logout') {
      const authorization = req.headers.authorization;
      const identity = await verifyFirebaseIdToken(typeof authorization === 'string' ? authorization : undefined);

      if (action === 'session') {
        await ensureCodeTable();
        const result = await getTursoClient().execute({
          sql: 'SELECT logged_out_at FROM sso_sessions WHERE uid = ?',
          args: [identity.uid],
        });
        const loggedOutAt = Number(result.rows[0]?.logged_out_at ?? 0);
        sendJson(res, 200, { success: true, sessionValid: effectiveAuthTime(identity) > loggedOutAt });
        return;
      }

      if (action === 'logout') {
        await ensureCodeTable();
        const loggedOutAt = Math.floor(Date.now() / 1000);
        const previousLogout = await getTursoClient().execute({
          sql: 'SELECT logged_out_at FROM sso_sessions WHERE uid = ?',
          args: [identity.uid],
        });
        if (effectiveAuthTime(identity) <= Number(previousLogout.rows[0]?.logged_out_at ?? 0)) {
          sendJson(res, 200, { success: true });
          return;
        }
        await getTursoClient().batch([
          {
            sql: `INSERT INTO sso_sessions (uid, logged_out_at) VALUES (?, ?)
              ON CONFLICT(uid) DO UPDATE SET logged_out_at = excluded.logged_out_at`,
            args: [identity.uid, loggedOutAt],
          },
          { sql: 'DELETE FROM sso_codes WHERE uid = ?', args: [identity.uid] },
        ]);
        sendJson(res, 200, { success: true });
        return;
      }

      const targetOrigin = req.body.targetOrigin;
      if (typeof targetOrigin !== 'string' || !configuredOrigins().has(targetOrigin) || targetOrigin === origin) {
        throw new SsoRequestError('The destination website is not allowed.', 400);
      }
      await ensureCodeTable();
      const sessionResult = await getTursoClient().execute({
        sql: 'SELECT logged_out_at FROM sso_sessions WHERE uid = ?',
        args: [identity.uid],
      });
      if (effectiveAuthTime(identity) <= Number(sessionResult.rows[0]?.logged_out_at ?? 0)) {
        throw new SsoRequestError('Your sign-in has expired. Please sign in again.', 401);
      }
      const code = await createSsoCode(identity.uid, effectiveAuthTime(identity), targetOrigin);
      sendJson(res, 200, { success: true, code, expiresIn: CODE_TTL_MS / 1000 });
      return;
    }

    const code = req.body.code;
    if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
      throw new SsoRequestError('This sign-in link is invalid or has expired.', 400);
    }
    await ensureCodeTable();
    const result = await getTursoClient().execute({
      sql: `DELETE FROM sso_codes
        WHERE code_hash = ? AND target_origin = ? AND expires_at > ?
        RETURNING uid, auth_time`,
      args: [createHash('sha256').update(code).digest('hex'), origin, Date.now()],
    });
    const uid = result.rows[0]?.uid;
    const authTime = Number(result.rows[0]?.auth_time);
    if (typeof uid !== 'string' || !uid || uid.length > 128 || !Number.isSafeInteger(authTime)) {
      throw new SsoRequestError('This sign-in link is invalid, expired, or already used.', 401);
    }
    const sessionResult = await getTursoClient().execute({
      sql: 'SELECT logged_out_at FROM sso_sessions WHERE uid = ?',
      args: [uid],
    });
    if (authTime <= Number(sessionResult.rows[0]?.logged_out_at ?? 0)) {
      throw new SsoRequestError('This sign-in link has expired. Please try again.', 401);
    }
    sendJson(res, 200, { success: true, customToken: createFirebaseCustomToken(uid, authTime) });
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof SsoRequestError || error instanceof FirebaseTokenError) {
      sendJson(res, error.statusCode, { success: false, error: error.message });
      return;
    }
    console.error(`[SSO] Could not ${action} a cross-site sign-in:`, error);
    sendJson(res, 503, { success: false, error: 'Cross-site sign-in is temporarily unavailable.' });
  }
}
