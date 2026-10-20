/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_FIREBASE_FIRESTORE_DATABASE_ID?: string;
  readonly VITE_FIREBASE_RECAPTCHA_SITE_KEY?: string;
  /** 'enterprise' (default) or 'v3'; must match the App Check provider registered in Firebase. */
  readonly VITE_FIREBASE_APPCHECK_PROVIDER?: 'enterprise' | 'v3';
  readonly VITE_SITE_DEPLOYMENT_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
