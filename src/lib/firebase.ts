/**
 * Firebase Authentication and Storage configuration.
 * Application data is served by the server-side Turso adapter.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  inMemoryPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  setPersistence,
  Auth,
} from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { db } from './tursoFirestore';
import { initAppCheck, getAppCheckAttestationToken } from './appCheck';
import { CANONICAL_SITE_HOST } from '../config/site';
import { clientEnv } from '../config/env';

export const activeDatabaseName = clientEnv.databaseName || 'Not configured';

/**
 * On the live site, sign-in pages are served from the site's own domain (vercel.json
 * proxies /__/auth/* to Firebase), so the Google window and email links show the
 * website's address instead of the Firebase project's, and the sign-in window can
 * hand its result back (browsers block that across different domains). Preview and
 * local builds keep Firebase's default domain, which Google already accepts.
 */
function resolveAuthDomain(): string {
  const configured = clientEnv.firebase.authDomain;
  if (typeof window !== 'undefined' && window.location.host === CANONICAL_SITE_HOST) return CANONICAL_SITE_HOST;
  return configured;
}

const missingFirebaseConfig = [
  ['VITE_FIREBASE_API_KEY', clientEnv.firebase.apiKey],
  ['VITE_FIREBASE_AUTH_DOMAIN', clientEnv.firebase.authDomain],
  ['VITE_FIREBASE_PROJECT_ID', clientEnv.firebase.projectId],
  ['VITE_FIREBASE_STORAGE_BUCKET', clientEnv.firebase.storageBucket],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', clientEnv.firebase.messagingSenderId],
  ['VITE_FIREBASE_APP_ID', clientEnv.firebase.appId],
].filter(([, value]) => !value).map(([name]) => name);

if (missingFirebaseConfig.length) {
  throw new Error(`Firebase client configuration is incomplete. Set: ${missingFirebaseConfig.join(', ')}.`);
}

export const firebaseConfig = {
  apiKey: clientEnv.firebase.apiKey,
  authDomain: resolveAuthDomain(),
  projectId: clientEnv.firebase.projectId,
  storageBucket: clientEnv.firebase.storageBucket,
  messagingSenderId: clientEnv.firebase.messagingSenderId,
  appId: clientEnv.firebase.appId,
  measurementId: clientEnv.firebase.measurementId,
};

export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Sign-in stays on this device: it survives refreshes, new tabs and browser restarts,
 * and ends only when the customer signs out or clears the site's data. Firebase keeps
 * it in IndexedDB, falling back to localStorage, then the tab, then memory where a
 * browser blocks storage (some private modes).
 */
const DEVICE_PERSISTENCE = [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence];

export const auth: Auth = (() => {
  if (typeof window === 'undefined') return getAuth(app);
  try {
    return initializeAuth(app, {
      persistence: DEVICE_PERSISTENCE,
      // Required for signInWithPopup / signInWithRedirect (Google sign-in). Without it,
      // initializeAuth leaves popups unsupported and they fail with auth/argument-error.
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // Auth was already created (e.g. hot reload): keep it on the device as well.
    const existingAuth = getAuth(app);
    void setPersistence(existingAuth, indexedDBLocalPersistence).catch((error) => {
      console.error('[database Auth] Could not keep the sign-in on this device:', error);
    });
    return existingAuth;
  }
})();

export const storage: FirebaseStorage = getStorage(app);

export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) cleaned[key] = sanitizeForFirestore(value);
    }
    return cleaned as T;
  }
  return obj;
}

export async function testTursoConnection(): Promise<{
  success: boolean;
  message: string;
  projectId: string;
  databaseId: string;
  latencyMs?: number;
}> {
  const startedAt = Date.now();
  try {
    const response = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health' }),
    });
    const result = await response.json() as { success?: boolean; error?: string };
    if (!response.ok || !result.success) {
      throw new Error(result.error || `Database health check failed (${response.status}).`);
    }
    return {
      success: true,
      message: 'Database connection verified.',
      projectId: firebaseConfig.projectId,
      databaseId: activeDatabaseName,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Database connection failed.',
      projectId: firebaseConfig.projectId,
      databaseId: activeDatabaseName,
      latencyMs: Date.now() - startedAt,
    };
  }
}

export function initAppCheckFoundation(): void {
  initAppCheck();
}

export { initAppCheck, getAppCheckAttestationToken, db };

export default {
  app,
  db,
  auth,
  storage,
  firebaseConfig,
  activeDatabaseName,
  testTursoConnection,
  initAppCheckFoundation,
  initAppCheck,
  getAppCheckAttestationToken,
};
