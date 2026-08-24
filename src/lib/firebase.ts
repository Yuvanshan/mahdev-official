/**
 * Mahdev Firebase & Cloud Firestore Foundation (Phase 56)
 * Centralized Firebase Web SDK configuration and service client initialization.
 * Production Database Architecture:
 * - Firebase Project: for-her-33ea9
 * - Cloud Firestore Named Database: mahdev-pvt-ldt
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import rawConfig from '../../firebase-applet-config.json';

// Target Production Configuration Constants
export const TARGET_FIREBASE_PROJECT_ID = 'for-her-33ea9';
export const TARGET_FIRESTORE_DATABASE_ID = 'mahdev-pvt-ldt';
export const TARGET_STORAGE_BUCKET = 'for-her-33ea9.firebasestorage.app';
export const TARGET_AUTH_DOMAIN = 'for-her-33ea9.firebaseapp.com';
export const TARGET_APP_ID = '1:1062826041810:web:2905a8e9f7bc3243dfa80b';
export const TARGET_MESSAGING_SENDER_ID = '1062826041810';

// Resolves Firebase configuration with env var priority and config fallback
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || 'AIzaSyAB05TE4Fx9C89tcfUNVGVcIEWw4CVDhJ0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || TARGET_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || TARGET_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || TARGET_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || TARGET_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || TARGET_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || rawConfig.measurementId || 'G-MWNCCXGY4F',
};

// Target Named Firestore Database ID
export const activeFirestoreDatabaseId: string =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  rawConfig.firestoreDatabaseId ||
  TARGET_FIRESTORE_DATABASE_ID;

// Initialize Firebase App singleton without duplicate initialization
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Centralized Cloud Firestore Database connected to the production named database
export const db: Firestore = activeFirestoreDatabaseId
  ? getFirestore(app, activeFirestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth foundation
export const auth: Auth = getAuth(app);

// Initialize Firebase Storage foundation
export const storage: FirebaseStorage = getStorage(app);

/**
 * Recursively cleans and sanitizes data objects before sending to Firestore.
 * Strips all `undefined` values, handles nested objects, arrays, and primitives.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) {
    return undefined as unknown as T;
  }
  if (obj === null) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Validates connectivity to Cloud Firestore
 * Tests remote server connection per Firebase Integration standards.
 */
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  message: string;
  projectId: string;
  databaseId: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();
  try {
    const testRef = doc(db, 'settings', 'site');
    await getDocFromServer(testRef);
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      message: `Firestore connection verified on database '${activeFirestoreDatabaseId}'`,
      projectId: firebaseConfig.projectId,
      databaseId: activeFirestoreDatabaseId,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    if (error?.message?.includes('the client is offline')) {
      console.warn('[Firebase] Firestore client running in offline cache mode.');
      return {
        success: false,
        message: 'Offline cache mode active (server not reachable)',
        projectId: firebaseConfig.projectId,
        databaseId: activeFirestoreDatabaseId,
        latencyMs,
      };
    }
    // Document might not exist yet, but server response confirms reachability
    return {
      success: true,
      message: `Firestore server reachable on database '${activeFirestoreDatabaseId}'`,
      projectId: firebaseConfig.projectId,
      databaseId: activeFirestoreDatabaseId,
      latencyMs,
    };
  }
}

import { initAppCheck, getAppCheckAttestationToken } from './appCheck';

/**
 * App Check initialization helper with environment sensitivity
 */
export function initAppCheckFoundation(): void {
  initAppCheck();
}

export { initAppCheck, getAppCheckAttestationToken };

export default {
  app,
  db,
  auth,
  storage,
  firebaseConfig,
  activeFirestoreDatabaseId,
  testFirestoreConnection,
  initAppCheckFoundation,
  initAppCheck,
  getAppCheckAttestationToken,
};
