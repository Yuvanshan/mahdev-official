import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import type { AdminRole, AdminUser } from '../src/types/admin';

const SESSION_COOKIE = 'mahdev_admin_session';
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;
const PASSWORD_HASH_BYTES = 64;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const DEFAULT_ADMIN_EMAIL = 'yuvanshan875@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'MahdevAdmin!2026';
const DEFAULT_SESSION_SECRET = 'mahdev-local-admin-session-secret-2026-32b';
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function resolveAdminRuntimeConfig() {
  const isLocalDevelopment = (process.env.NODE_ENV || 'development') !== 'production';
  const configuredEmail = process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase() || (isLocalDevelopment ? DEFAULT_ADMIN_EMAIL : '');
  const configuredHash = process.env.ADMIN_LOGIN_PASSWORD_HASH || (isLocalDevelopment ? hashAdminPassword(DEFAULT_ADMIN_PASSWORD) : '');
  const configuredSecret = process.env.ADMIN_SESSION_SECRET || (isLocalDevelopment ? DEFAULT_SESSION_SECRET : '');
  return { email: configuredEmail, passwordHash: configuredHash, sessionSecret: configuredSecret, isLocalDevelopment };
}

export class AdminSessionAuthError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'AdminSessionAuthError';
  }
}

function getSessionSecret(): string {
  const { sessionSecret, isLocalDevelopment } = resolveAdminRuntimeConfig();
  if (!sessionSecret || sessionSecret.length < 32) {
    if (isLocalDevelopment) {
      return DEFAULT_SESSION_SECRET;
    }
    throw new AdminSessionAuthError('Admin session is not configured.', 503);
  }
  return sessionSecret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) {
      return item.slice(separator + 1).trim();
    }
  }
  return null;
}

function makeAdminUser(email: string): AdminUser {
  return {
    id: email,
    name: email.split('@')[0],
    email,
    role: 'super_admin',
    department: 'Mahdev Administration',
    divisionAccess: ['all'],
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

function issueSession(email: string): { user: AdminUser; expiresAt: string; cookie: string } {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + SESSION_LIFETIME_SECONDS;
  const user = makeAdminUser(email);
  const payload = Buffer.from(JSON.stringify({
    email,
    role: 'super_admin' satisfies AdminRole,
    exp: expiresAtSeconds,
    iat: issuedAt,
    nonce: randomBytes(16).toString('base64url'),
  })).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return {
    user,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
    cookie: `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${SESSION_LIFETIME_SECONDS}${secure}`,
  };
}

export function clearAdminSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${secure}`;
}

export function getAdminSessionFromCookie(cookieHeader: string | undefined): {
  user: AdminUser;
  expiresAt: string;
} {
  const token = getCookieValue(cookieHeader, SESSION_COOKIE);
  if (!token) throw new AdminSessionAuthError('An admin session is required.', 401);

  const [payload, signature, ...extra] = token.split('.');
  if (!payload || !signature || extra.length) {
    throw new AdminSessionAuthError('The admin session is invalid.', 401);
  }

  let suppliedSignature: Buffer;
  let expectedSignature: Buffer;
  try {
    suppliedSignature = Buffer.from(signature, 'base64url');
    expectedSignature = Buffer.from(sign(payload), 'base64url');
  } catch (error) {
    if (error instanceof AdminSessionAuthError) throw error;
    throw new AdminSessionAuthError('The admin session is invalid.', 401);
  }
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    throw new AdminSessionAuthError('The admin session is invalid.', 401);
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: unknown;
      role?: unknown;
      exp?: unknown;
    };
    const configuredEmail = resolveAdminRuntimeConfig().email;
    const email = typeof session.email === 'string' ? session.email.toLowerCase() : '';
    const expiresAt = typeof session.exp === 'number' ? session.exp : 0;
    if (
      !configuredEmail ||
      email !== configuredEmail ||
      session.role !== 'super_admin' ||
      expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      throw new AdminSessionAuthError('The admin session has expired or is no longer authorized.', 401);
    }
    return {
      user: makeAdminUser(email),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    };
  } catch (error) {
    if (error instanceof AdminSessionAuthError) throw error;
    throw new AdminSessionAuthError('The admin session is invalid.', 401);
  }
}

function authenticateAdminCredentialsWithResolvedConfig(
  emailInput: unknown,
  passwordInput: unknown,
  clientKey: string,
  configuredEmail: string,
  passwordHash: string,
  sessionSecret: string
): { user: AdminUser; expiresAt: string; cookie: string } {
  const email = typeof emailInput === 'string' ? emailInput.trim().toLowerCase() : '';
  const password = typeof passwordInput === 'string' ? passwordInput : '';
  const encodedHash = passwordHash.split('.');

  if (!configuredEmail || !sessionSecret || sessionSecret.length < 32 || encodedHash.length !== 2) {
    throw new AdminSessionAuthError('Admin login is not configured on the server.', 503);
  }

  const now = Date.now();
  for (const [key, record] of loginAttempts) {
    if (record.resetAt <= now) loginAttempts.delete(key);
  }
  const attempts = loginAttempts.get(clientKey);
  if (attempts && attempts.resetAt > now && attempts.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    throw new AdminSessionAuthError('Too many login attempts. Please wait and try again.', 429);
  }
  if (!attempts || attempts.resetAt <= now) {
    loginAttempts.set(clientKey, { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  if (!email || email.length > 320 || !password || password.length > 1024) {
    loginAttempts.get(clientKey)!.count += 1;
    throw new AdminSessionAuthError('Invalid admin email or password.', 401);
  }

  let validPassword = false;
  try {
    const salt = Buffer.from(encodedHash[0], 'base64url');
    const expectedHash = Buffer.from(encodedHash[1], 'base64url');
    if (salt.length < 16 || expectedHash.length !== PASSWORD_HASH_BYTES) {
      throw new Error('Invalid configured password hash.');
    }
    const suppliedHash = scryptSync(password, salt, PASSWORD_HASH_BYTES);
    validPassword = timingSafeEqual(expectedHash, suppliedHash);
  } catch (error) {
    console.error('[Admin Auth] Password hash validation failed:', error);
    throw new AdminSessionAuthError('Admin login is not configured correctly.', 503);
  }

  if (email !== configuredEmail || !password || !validPassword) {
    const current = loginAttempts.get(clientKey)!;
    current.count += 1;
    throw new AdminSessionAuthError('Invalid admin email or password.', 401);
  }

  loginAttempts.delete(clientKey);
  return issueSession(configuredEmail);
}

export function authenticateAdminCredentials(
  emailInput: unknown,
  passwordInput: unknown,
  clientKey: string
): { user: AdminUser; expiresAt: string; cookie: string } {
  const { email: configuredEmail, passwordHash, sessionSecret, isLocalDevelopment } = resolveAdminRuntimeConfig();

  if (!configuredEmail || !sessionSecret || sessionSecret.length < 32 || !passwordHash || passwordHash.split('.').length !== 2) {
    if (isLocalDevelopment) {
      const fallbackHash = hashAdminPassword(DEFAULT_ADMIN_PASSWORD);
      process.env.ADMIN_LOGIN_EMAIL = DEFAULT_ADMIN_EMAIL;
      process.env.ADMIN_LOGIN_PASSWORD_HASH = fallbackHash;
      process.env.ADMIN_SESSION_SECRET = DEFAULT_SESSION_SECRET;
      const safeConfig = resolveAdminRuntimeConfig();
      return authenticateAdminCredentialsWithResolvedConfig(
        emailInput,
        passwordInput,
        clientKey,
        safeConfig.email,
        safeConfig.passwordHash,
        safeConfig.sessionSecret
      );
    }
    throw new AdminSessionAuthError('Admin login is not configured on the server.', 503);
  }

  return authenticateAdminCredentialsWithResolvedConfig(
    emailInput,
    passwordInput,
    clientKey,
    configuredEmail,
    passwordHash,
    sessionSecret
  );
}

export function hashAdminPassword(password: string): string {
  if (password.length < 12) throw new Error('Admin passwords must be at least 12 characters long.');
  const salt = randomBytes(16);
  return `${salt.toString('base64url')}.${scryptSync(password, salt, PASSWORD_HASH_BYTES).toString('base64url')}`;
}
