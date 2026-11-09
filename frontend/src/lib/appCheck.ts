/**
 * Mahdev Enterprise Firebase App Check & Attestation Layer (Phase 27)
 * 
 * Provides runtime integrity attestation to ensure only the legitimate Mahdev application
 * communicates with Cloud Firestore, Firebase Storage, and Backend APIs.
 * Supports reCAPTCHA Enterprise / v3 and Development Debug Provider.
 */

import {
  AppCheck,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  CustomProvider,
  getToken,
} from 'firebase/app-check';
import { app } from './firebase';

let appCheckInstance: AppCheck | null = null;
let isAppCheckInitialized = false;

export interface AppCheckStatus {
  initialized: boolean;
  provider: 'recaptcha-enterprise' | 'recaptcha-v3' | 'debug-attestation' | 'none';
  environment: 'development' | 'production';
}

// Must match the provider the web app is registered with in Firebase Console >
// App Check. The production app is registered for reCAPTCHA Enterprise; with the
// v3 provider Firebase answers "App not registered", so tokens were never verified.
const RECAPTCHA_PROVIDER: 'recaptcha-enterprise' | 'recaptcha-v3' =
  import.meta.env?.VITE_FIREBASE_APPCHECK_PROVIDER === 'v3' ? 'recaptcha-v3' : 'recaptcha-enterprise';

function createRecaptchaProvider(siteKey: string) {
  return RECAPTCHA_PROVIDER === 'recaptcha-v3'
    ? new ReCaptchaV3Provider(siteKey)
    : new ReCaptchaEnterpriseProvider(siteKey);
}

/**
 * Initializes Firebase App Check with environment sensitivity
 */
export function initAppCheck(): AppCheckStatus {
  if (isAppCheckInitialized && appCheckInstance) {
    return {
      initialized: true,
      provider: import.meta.env.PROD ? RECAPTCHA_PROVIDER : 'debug-attestation',
      environment: import.meta.env.PROD ? 'production' : 'development',
    };
  }

  if (typeof window === 'undefined') {
    return { initialized: false, provider: 'none', environment: 'production' };
  }

  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
  const siteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || '';

  try {
    if (isDev) {
      // In development mode, use self-hosted debug token to prevent blocking dev tools
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
        import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || true;

      // Custom / Debug provider in development
      const customDebugProvider = new CustomProvider({
        getToken: async () => {
          return {
            token: `dev-attested-token-${Date.now()}`,
            expireTimeMillis: Date.now() + 3600 * 1000,
          };
        },
      });

      appCheckInstance = initializeAppCheck(app, {
        provider: siteKey ? createRecaptchaProvider(siteKey) : customDebugProvider,
        isTokenAutoRefreshEnabled: true,
      });

      isAppCheckInitialized = true;
      console.info('[AppCheck] Initialized in development attestation mode.');
      return { initialized: true, provider: 'debug-attestation', environment: 'development' };
    } else {
      // Production mode with reCAPTCHA v3 or custom provider fallback
      if (siteKey) {
        appCheckInstance = initializeAppCheck(app, {
          provider: createRecaptchaProvider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
        isAppCheckInitialized = true;
        console.info(`[AppCheck] Initialized with ${RECAPTCHA_PROVIDER} provider.`);
        return { initialized: true, provider: RECAPTCHA_PROVIDER, environment: 'production' };
      } else {
        console.error(
          '[AppCheck] Production App Check is not initialized. Set VITE_FIREBASE_RECAPTCHA_SITE_KEY and enable App Check enforcement in the hosting console.'
        );
        return { initialized: false, provider: 'none', environment: 'production' };
      }
    }
  } catch (err) {
    console.error(
      '[AppCheck] Could not initialize attestation. Protected requests may be rejected; verify the site key and the hosting console registration.',
      err
    );
    return { initialized: false, provider: 'none', environment: isDev ? 'development' : 'production' };
  }
}

/**
 * Retrieves the current App Check attestation token for HTTP requests
 */
export async function getAppCheckAttestationToken(): Promise<string | null> {
  if (!appCheckInstance) {
    if (import.meta.env.PROD) {
      throw new Error('App Check is not initialized; no attestation token is available.');
    }
    return null;
  }
  try {
    const result = await getToken(appCheckInstance, false);
    return result.token;
  } catch (err) {
    if (import.meta.env.PROD) {
      console.error('[AppCheck] Could not retrieve a production attestation token:', err);
      throw new Error('App Check could not issue an attestation token.');
    }
    console.warn('[AppCheck] Token retrieval notice:', err);
    return null;
  }
}
