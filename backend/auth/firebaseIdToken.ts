import { createVerify } from 'node:crypto';

const CERTIFICATE_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const FALLBACK_CERTIFICATE_TTL_MS = 5 * 60 * 1000;
const MAX_CLOCK_SKEW_SECONDS = 5 * 60;

export interface FirebaseIdentity {
  uid: string;
  email?: string;
}

interface FirebaseTokenClaims {
  aud?: unknown;
  auth_time?: unknown;
  exp?: unknown;
  iat?: unknown;
  iss?: unknown;
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
}

interface FirebaseTokenHeader {
  alg?: unknown;
  kid?: unknown;
}

interface CachedCertificates {
  expiresAt: number;
  values: Record<string, string>;
}

let cachedCertificates: CachedCertificates | undefined;
let certificateRequest: Promise<CachedCertificates> | undefined;

export class FirebaseTokenError extends Error {
  constructor(message: string, readonly statusCode: number = 401) {
    super(message);
    this.name = 'FirebaseTokenError';
  }
}

function firebaseProjectId(): string {
  return process.env.FIREBASE_PROJECT_ID
    || process.env.VITE_FIREBASE_PROJECT_ID
    || 'for-her-33ea9';
}

async function loadCertificates(forceRefresh = false): Promise<CachedCertificates> {
  if (!forceRefresh && cachedCertificates && cachedCertificates.expiresAt > Date.now()) {
    return cachedCertificates;
  }
  if (certificateRequest) return certificateRequest;

  certificateRequest = (async () => {
    let response: Response;
    try {
      response = await fetch(CERTIFICATE_URL, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      console.error('[Firebase Auth] Certificate request failed:', error);
      throw new FirebaseTokenError('Customer authentication is temporarily unavailable.', 503);
    }
    if (!response.ok) {
      throw new FirebaseTokenError('Customer authentication is temporarily unavailable.', 503);
    }

    const values = await response.json() as unknown;
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      throw new FirebaseTokenError('Customer authentication is temporarily unavailable.', 503);
    }
    const maxAge = response.headers.get('cache-control')?.match(/max-age=(\d+)/i)?.[1];
    const certificates = {
      values: values as Record<string, string>,
      expiresAt: Date.now() + (maxAge ? Number(maxAge) * 1000 : FALLBACK_CERTIFICATE_TTL_MS),
    };
    cachedCertificates = certificates;
    return certificates;
  })().finally(() => {
    certificateRequest = undefined;
  });
  return certificateRequest;
}

function decodePart<T>(part: string): T {
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as T;
  } catch {
    throw new FirebaseTokenError('Customer authentication token is invalid.');
  }
}

export async function verifyFirebaseIdToken(authorization: string | undefined): Promise<FirebaseIdentity> {
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match) throw new FirebaseTokenError('A valid customer sign-in is required.');

  const tokenParts = match[1].split('.');
  if (tokenParts.length !== 3) throw new FirebaseTokenError('Customer authentication token is invalid.');
  const [encodedHeader, encodedClaims, encodedSignature] = tokenParts;
  const header = decodePart<FirebaseTokenHeader>(encodedHeader);
  const claims = decodePart<FirebaseTokenClaims>(encodedClaims);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
    throw new FirebaseTokenError('Customer authentication token is invalid.');
  }

  let certificates = await loadCertificates();
  let certificate = certificates.values[header.kid];
  if (!certificate) {
    certificates = await loadCertificates(true);
    certificate = certificates.values[header.kid];
  }
  if (!certificate) throw new FirebaseTokenError('Customer authentication token is invalid.');

  let signatureValid = false;
  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedClaims}`);
    verifier.end();
    signatureValid = verifier.verify(certificate, Buffer.from(encodedSignature, 'base64url'));
  } catch (error) {
    console.error('[Firebase Auth] Token signature verification failed:', error);
  }
  if (!signatureValid) throw new FirebaseTokenError('Customer authentication token is invalid.');

  const now = Math.floor(Date.now() / 1000);
  const projectId = firebaseProjectId();
  if (
    claims.aud !== projectId ||
    claims.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof claims.sub !== 'string' ||
    claims.sub.length === 0 ||
    claims.sub.length > 128 ||
    typeof claims.exp !== 'number' ||
    claims.exp <= now ||
    typeof claims.iat !== 'number' ||
    claims.iat > now + MAX_CLOCK_SKEW_SECONDS ||
    typeof claims.auth_time !== 'number' ||
    claims.auth_time > now + MAX_CLOCK_SKEW_SECONDS
  ) {
    throw new FirebaseTokenError('Customer authentication token is invalid or expired.');
  }

  return {
    uid: claims.sub,
    ...(claims.email_verified === true && typeof claims.email === 'string'
      ? { email: claims.email.toLowerCase() }
      : {}),
  };
}
