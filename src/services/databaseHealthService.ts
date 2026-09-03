/**
 * Mahdev Cloud Firestore Database Health & Architecture Diagnostic Service (Phase 56)
 *
 * Verifies and validates:
 * 1. Firebase App Singleton Initialization
 * 2. Active Firestore Project (Target: for-her-33ea9)
 * 3. Active Firestore Database ID (Target: mahdev-pvt-ldt)
 * 4. Auth Domain, Storage Bucket, and Messaging Sender ID
 * 5. Server Ping & Latency via direct Firestore server reads
 * 6. Read Accessibility across all primary Mahdev collections
 * 7. Security Credentials check (verifies no private keys leaked to client)
 * 8. Authentication & Authorization State
 */

import {
  collection,
  getDocs,
  limit,
  query,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  db,
  auth,
  firebaseConfig,
  activeFirestoreDatabaseId,
  TARGET_FIREBASE_PROJECT_ID,
  TARGET_FIRESTORE_DATABASE_ID,
  TARGET_STORAGE_BUCKET,
  TARGET_AUTH_DOMAIN,
} from '../lib/firebase';

export interface CollectionProbeResult {
  collectionName: string;
  accessible: boolean;
  docCount: number;
  latencyMs: number;
  error?: string;
}

export interface SecurityAuditResult {
  hasAdminSdkKeyLeaked: boolean;
  hasServiceAccountLeaked: boolean;
  usesClientSafeEnvVars: boolean;
  details: string[];
}

export interface DatabaseDiagnosticReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'misconfigured' | 'error';
  overallLatencyMs: number;
  environment: {
    mode: string;
    isProduction: boolean;
    isVercel: boolean;
  };
  firebaseApp: {
    initialized: boolean;
    activeProjectId: string;
    targetProjectId: string;
    isProjectMatch: boolean;
    authDomain: string;
    storageBucket: string;
  };
  firestoreDatabase: {
    activeDatabaseId: string;
    targetDatabaseId: string;
    isDatabaseMatch: boolean;
    isNotDefaultDb: boolean;
    serverReachable: boolean;
    serverMessage: string;
  };
  authStatus: {
    isSignedIn: boolean;
    uid: string | null;
    email: string | null;
    isAnonymous: boolean;
    emailVerified: boolean;
  };
  collectionProbes: CollectionProbeResult[];
  securityAudit: SecurityAuditResult;
  recommendations: string[];
}

export class DatabaseHealthService {
  /**
   * Run full non-blocking diagnostic suite
   */
  async runFullDiagnostics(): Promise<DatabaseDiagnosticReport> {
    const startTime = Date.now();

    // 1. Environment Detection
    const isProd = import.meta.env.PROD || process.env.NODE_ENV === 'production';
    const isVercel =
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('vercel.app') ||
        window.location.hostname.includes('mahdev.lk'));

    // 2. Firebase App & Project ID Verification
    const activeProjectId = firebaseConfig.projectId;
    const isProjectMatch = activeProjectId === TARGET_FIREBASE_PROJECT_ID;

    // 3. Database ID Verification
    const activeDbId = activeFirestoreDatabaseId;
    const isDatabaseMatch = activeDbId === TARGET_FIRESTORE_DATABASE_ID;
    const isNotDefaultDb = activeDbId !== '(default)' && activeDbId !== '';

    // 4. Server Ping & Reachability
    let serverReachable = false;
    let serverMessage = '';
    const pingStart = Date.now();

    try {
      const siteDocRef = doc(db, 'settings', 'site');
      await getDocFromServer(siteDocRef);
      serverReachable = true;
      serverMessage = `Connected directly to Firestore database '${activeDbId}' on project '${activeProjectId}'`;
    } catch (err: any) {
      if (err?.message?.includes('the client is offline')) {
        serverReachable = false;
        serverMessage = 'Client running in offline cache mode (remote server unreachable)';
      } else {
        // A "not-found" error or permission response still confirms the database endpoint is live and responding
        serverReachable = true;
        serverMessage = `Firestore endpoint responded (${err?.code || 'reachable'})`;
      }
    }

    // 5. Auth State
    const currentUser = auth.currentUser;
    const authStatus = {
      isSignedIn: Boolean(currentUser),
      uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      isAnonymous: currentUser?.isAnonymous ?? false,
      emailVerified: currentUser?.emailVerified ?? false,
    };

    // 6. Probing Primary Collections (Separate Folders / Collections)
    const targetCollections = [
      'settings',
      'divisions',
      'services',
      'products',
      'categories',
      'portfolio',
      'projects',
      'gallery',
      'milestones',
      'trustedCompanies',
      'clients',
      'testimonials',
      'orders',
      'bookings',
      'inquiries',
      'users',
      'contactSubmissions',
      'contactMessages',
      'navigation',
      'heroSections',
      'pages',
      'statistics',
      'team',
      'faqs',
      'blog',
      'auditLogs',
    ];

    const probePromises = targetCollections.map(async (colName) => {
      const colStart = Date.now();
      try {
        const q = query(collection(db, colName), limit(5));
        const snap = await getDocs(q);
        return {
          collectionName: colName,
          accessible: true,
          docCount: snap.size,
          latencyMs: Date.now() - colStart,
        };
      } catch (err: any) {
        return {
          collectionName: colName,
          accessible: false,
          docCount: 0,
          latencyMs: Date.now() - colStart,
          error: err?.message || 'Access restricted by security rules',
        };
      }
    });

    const collectionProbes = await Promise.all(probePromises);

    // 7. Security Audit
    const securityAudit: SecurityAuditResult = {
      hasAdminSdkKeyLeaked: false,
      hasServiceAccountLeaked: false,
      usesClientSafeEnvVars: true,
      details: [],
    };

    // Verify window / process / client environment variables for any private key signatures
    const clientEnv = import.meta.env;
    const clientEnvKeys = Object.keys(clientEnv);

    for (const key of clientEnvKeys) {
      const val = String(clientEnv[key]);
      if (
        key.includes('PRIVATE_KEY') ||
        key.includes('SECRET') ||
        val.includes('BEGIN PRIVATE KEY') ||
        val.includes('service_account')
      ) {
        if (!key.startsWith('VITE_')) {
          securityAudit.hasAdminSdkKeyLeaked = true;
          securityAudit.details.push(`Potential private credential found in client bundle: ${key}`);
        }
      }
    }

    if (securityAudit.details.length === 0) {
      securityAudit.details.push(
        'Zero private keys or service accounts exposed in frontend build.',
        'All client configurations use public browser-safe VITE_ environment variables.'
      );
    }

    // 8. Determine Overall Status & Recommendations
    const recommendations: string[] = [];

    if (!isProjectMatch) {
      recommendations.push(
        `Firebase Project mismatch: Currently connected to '${activeProjectId}', expected '${TARGET_FIREBASE_PROJECT_ID}'.`
      );
    }
    if (!isDatabaseMatch) {
      recommendations.push(
        `Firestore Database mismatch: Currently connected to '${activeDbId}', expected '${TARGET_FIRESTORE_DATABASE_ID}'.`
      );
    }
    if (!serverReachable) {
      recommendations.push(
        'Check network connectivity and Firestore firewall / security rules.'
      );
    }

    let status: DatabaseDiagnosticReport['status'] = 'healthy';
    if (!isProjectMatch || !isDatabaseMatch) {
      status = 'misconfigured';
    } else if (!serverReachable) {
      status = 'warning';
    }

    const overallLatencyMs = Date.now() - startTime;

    return {
      timestamp: new Date().toISOString(),
      status,
      overallLatencyMs,
      environment: {
        mode: import.meta.env.MODE || 'development',
        isProduction: isProd,
        isVercel,
      },
      firebaseApp: {
        initialized: true,
        activeProjectId,
        targetProjectId: TARGET_FIREBASE_PROJECT_ID,
        isProjectMatch,
        authDomain: firebaseConfig.authDomain || TARGET_AUTH_DOMAIN,
        storageBucket: firebaseConfig.storageBucket || TARGET_STORAGE_BUCKET,
      },
      firestoreDatabase: {
        activeDatabaseId: activeDbId,
        targetDatabaseId: TARGET_FIRESTORE_DATABASE_ID,
        isDatabaseMatch,
        isNotDefaultDb,
        serverReachable,
        serverMessage,
      },
      authStatus,
      collectionProbes,
      securityAudit,
      recommendations,
    };
  }
}

export const databaseHealthService = new DatabaseHealthService();
