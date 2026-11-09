import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  getDivisionSiteOrigin,
  DIVISION_SITE_IDS,
} from '../config/divisionSites';

// Keep the original company Vercel host as the shared-login broker. Firebase
// browser persistence is origin-scoped, so changing this to mahdev.lk would
// strand sessions that customers already have on mahdev-official.vercel.app.
export const SSO_BROKER_ORIGIN = 'https://mahdev-official.vercel.app';

const KNOWN_SSO_ORIGINS = [
  'https://mahdev.lk',
  'https://www.mahdev.lk',
  'https://mahdev-official.vercel.app',
  'https://sws-events.vercel.app',
  'https://u1-studio.vercel.app',
  'https://mahdev-it.vercel.app',
  'https://mahdev-mart.vercel.app',
  'https://mahdev-travels.vercel.app',
];

export const SSO_RETURN_HASH_PARAMETER = 'returnHash';

function allowedOrigins(): Set<string> {
  return new Set([
    SSO_BROKER_ORIGIN,
    ...KNOWN_SSO_ORIGINS,
    ...DIVISION_SITE_IDS.map(getDivisionSiteOrigin).filter((origin): origin is string => Boolean(origin)),
  ]);
}

function safeReturnUrl(value: string | null): URL | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname.replace(/\/+$/, '') === '/auth/sso' ||
      !allowedOrigins().has(url.origin)
    ) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

async function postSso<T>(
  path: 'issue' | 'exchange' | 'session' | 'logout',
  body: Record<string, string>,
  idToken?: string,
): Promise<T> {
  const response = await fetch(`/api/sso/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
    credentials: 'omit',
    cache: 'no-store',
  });
  const result = await response.json() as { success?: boolean; error?: string } & T;
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Cross-site sign-in is temporarily unavailable.');
  }
  return result;
}

export async function issueSsoCode(targetOrigin: string): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sign in before connecting this website.');
  const response = await postSso<{ code: string }>(
    'issue',
    { targetOrigin },
    await currentUser.getIdToken(),
  );
  if (typeof response.code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(response.code)) {
    throw new Error('The sign-in service returned an invalid handoff code.');
  }
  return response.code;
}

export async function exchangeSsoCode(code: string): Promise<string> {
  const response = await postSso<{ customToken: string }>('exchange', { code });
  if (typeof response.customToken !== 'string' || !response.customToken) {
    throw new Error('The sign-in service returned an invalid session.');
  }
  const credential = await signInWithCustomToken(auth, response.customToken);
  return credential.user.uid;
}

export async function isSsoSessionValid(): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  const response = await postSso<{ sessionValid: boolean }>(
    'session',
    {},
    await currentUser.getIdToken(),
  );
  if (typeof response.sessionValid !== 'boolean') {
    throw new Error('The sign-in service returned an invalid session status.');
  }
  return response.sessionValid;
}

export async function registerSsoLogout(): Promise<void> {
  if (typeof window !== 'undefined' && window.location.protocol !== 'https:') return;
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  await postSso('logout', {}, await currentUser.getIdToken());
}

export function getSafeSsoReturnUrl(value: string | null): URL | undefined {
  return safeReturnUrl(value);
}

export function getSafeSsoBrokerUrl(returnUrl: URL, code?: string): URL {
  const brokerUrl = new URL('/auth/sso', SSO_BROKER_ORIGIN);
  brokerUrl.hash = new URLSearchParams({
    __mahdev_sso: code || 'start',
    return: returnUrl.toString(),
    [SSO_RETURN_HASH_PARAMETER]: returnUrl.hash,
  }).toString();
  return brokerUrl;
}

export function getSsoBrokerLoginUrl(returnUrl: URL): URL {
  const brokerLoginUrl = new URL('/login', SSO_BROKER_ORIGIN);
  const handoffUrl = new URL('/auth/sso', SSO_BROKER_ORIGIN);
  const defaultDestination = new URL('/account', returnUrl.origin);
  const requestedPath = returnUrl.searchParams.get('redirect');
  if (requestedPath?.startsWith('/') && !requestedPath.startsWith('//')) {
    const requestedDestination = new URL(requestedPath, returnUrl.origin);
    if (
      requestedDestination.origin === returnUrl.origin &&
      !['/login', '/register', '/auth/sso'].includes(requestedDestination.pathname.replace(/\/+$/, ''))
    ) {
      defaultDestination.pathname = requestedDestination.pathname;
      defaultDestination.search = requestedDestination.search;
      defaultDestination.hash = requestedDestination.hash;
    }
  }
  handoffUrl.searchParams.set('return', defaultDestination.toString());
  brokerLoginUrl.searchParams.set('redirect', `${handoffUrl.pathname}${handoffUrl.search}`);
  return brokerLoginUrl;
}

export function buildSsoReturnUrl(
  returnUrl: URL,
  fragmentValue: string,
  returnHash = '',
): URL {
  const result = new URL(returnUrl);
  result.hash = new URLSearchParams({
    __mahdev_sso: fragmentValue,
    ...(returnHash ? { [SSO_RETURN_HASH_PARAMETER]: returnHash } : {}),
  }).toString();
  return result;
}

export function getSsoTargetBridgeUrl(returnUrl: URL, code: string): URL {
  const bridgeUrl = new URL('/auth/sso', returnUrl.origin);
  bridgeUrl.hash = new URLSearchParams({
    __mahdev_sso: code,
    return: returnUrl.toString(),
    [SSO_RETURN_HASH_PARAMETER]: returnUrl.hash,
  }).toString();
  return bridgeUrl;
}

export function getSsoFragment(): URLSearchParams | undefined {
  if (typeof window === 'undefined' || !window.location.hash.startsWith('#__mahdev_sso=')) return undefined;
  return new URLSearchParams(window.location.hash.slice(1));
}

export function replaceSsoFragment(returnHash = ''): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.hash = returnHash;
  window.history.replaceState(window.history.state, '', url);
}
