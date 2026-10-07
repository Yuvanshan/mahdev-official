/**
 * Firebase Authentication and Storage configuration.
 * Application data is served by the server-side Turso adapter.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  inMemoryPersistence,
  getAuth,
  setPersistence,
  Auth,
} from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import rawConfig from '../../firebase-applet-config.json';
import { db } from './tursoFirestore';
import { initAppCheck, getAppCheckAttestationToken } from './appCheck';

export const TARGET_FIREBASE_PROJECT_ID = 'for-her-33ea9';
export const TARGET_STORAGE_BUCKET = 'for-her-33ea9.firebasestorage.app';
export const TARGET_AUTH_DOMAIN = 'for-her-33ea9.firebaseapp.com';
export const TARGET_APP_ID = '1:1062826041810:web:2905a8e9f7bc3243dfa80b';
export const TARGET_MESSAGING_SENDER_ID = '1062826041810';
export const activeDatabaseName =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURSO_DATABASE_NAME) ||
  'Turso';

function getEnvVar(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || rawConfig.apiKey || '',
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || rawConfig.authDomain || TARGET_AUTH_DOMAIN,
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || rawConfig.projectId || TARGET_FIREBASE_PROJECT_ID,
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || rawConfig.storageBucket || TARGET_STORAGE_BUCKET,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || rawConfig.messagingSenderId || TARGET_MESSAGING_SENDER_ID,
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || rawConfig.appId || TARGET_APP_ID,
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID') || rawConfig.measurementId || 'G-MWNCCXGY4F',
};

export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = (() => {
  if (typeof window === 'undefined') return getAuth(app);
  try {
    const inMemoryAuth = initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
    window.localStorage.removeItem(`firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`);
    return inMemoryAuth;
  } catch {
    const existingAuth = getAuth(app);
    void setPersistence(existingAuth, inMemoryPersistence).catch((error) => {
      console.error('[Firebase Auth] Could not use in-memory persistence:', error);
    });
    try {
      window.localStorage.removeItem(`firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`);
    } catch (error) {
      console.error('[Firebase Auth] Could not clear legacy persisted credentials:', error);
    }
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
      throw new Error(result.error || `Turso health check failed (${response.status}).`);
    }
    return {
      success: true,
      message: 'Turso database connection verified.',
      projectId: 'Turso',
      databaseId: activeDatabaseName,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Turso database connection failed.',
      projectId: 'Turso',
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
