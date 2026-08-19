/**
 * Mahdev Enterprise Client-Side Environment Configuration System (Phase 30)
 * 
 * Safely accesses and validates public browser environment variables.
 * Complies with strict security rules: Only VITE_ prefixed public variables are read here.
 * Provides environment detection across Development, Preview, and Production.
 */

export type AppEnvironment = 'development' | 'preview' | 'production';

export interface ClientEnvironmentConfig {
  /** Current operating environment */
  env: AppEnvironment;
  isDevelopment: boolean;
  isPreview: boolean;
  isProduction: boolean;

  /** Application Base URL */
  appUrl: string;

  /** Firebase Client Configuration */
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
    firestoreDatabaseId?: string;
    recaptchaSiteKey?: string;
  };

  /** Analytics & Tracking */
  analytics: {
    measurementId?: string;
    enabled: boolean;
  };

  /** Google Maps & Location Services */
  maps: {
    apiKey?: string;
  };

  /** External Public Endpoints */
  api: {
    baseUrl: string;
  };
}

/**
 * Detects the runtime client environment
 */
function detectEnvironment(): AppEnvironment {
  const mode = import.meta.env.MODE;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (mode === 'production' || hostname.includes('mahdev.lk') || hostname.includes('asia-southeast1.run.app')) {
    if (hostname.includes('ais-pre-') || hostname.includes('preview') || hostname.includes('staging')) {
      return 'preview';
    }
    return 'production';
  }

  if (hostname.includes('ais-dev-') || mode === 'development' || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }

  return 'development';
}

const currentEnv = detectEnvironment();

export const clientEnv: ClientEnvironmentConfig = {
  env: currentEnv,
  isDevelopment: currentEnv === 'development',
  isPreview: currentEnv === 'preview',
  isProduction: currentEnv === 'production',

  appUrl: import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://mahdev.lk'),

  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'for-her-33ea9.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'for-her-33ea9',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'for-her-33ea9.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1062826041810',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1062826041810:web:2905a8e9f7bc3243dfa80b',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-MWNCCXGY4F',
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined,
    recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || undefined,
  },

  analytics: {
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || import.meta.env.VITE_GA_MEASUREMENT_ID || undefined,
    enabled: currentEnv !== 'development',
  },

  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || undefined,
  },

  api: {
    baseUrl: '/api',
  },
};

/**
 * Validates essential client environment parameters and logs status in dev mode
 */
export function validateClientEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check if critical Firebase attributes are populated
  if (!clientEnv.firebase.projectId) {
    missing.push('VITE_FIREBASE_PROJECT_ID');
  }

  if (clientEnv.isDevelopment) {
    console.info(`[Environment] Mode: ${clientEnv.env} | BaseURL: ${clientEnv.appUrl}`);
    if (missing.length > 0) {
      console.warn(`[Environment] Non-critical variables missing: ${missing.join(', ')}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
