import { useEffect, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { CANONICAL_SITE_ORIGIN } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import {
  buildSsoReturnUrl,
  exchangeSsoCode,
  getSafeSsoBrokerUrl,
  getSafeSsoReturnUrl,
  getSsoFragment,
  getSsoTargetBridgeUrl,
  issueSsoCode,
  isSsoSessionValid,
  replaceSsoFragment,
} from '../../services/ssoService';

const SYNCED_UID_KEY = 'mahdev:sso:synced-uid';
const CHECKED_SESSION_KEY = 'mahdev:sso:checked';
const PENDING_SESSION_KEY = 'mahdev:sso:pending-at';
const PENDING_MAX_AGE_MS = 120_000;

function isCrawler(): boolean {
  return /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegrambot/i.test(navigator.userAgent);
}

function isLocalDevelopment(): boolean {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function currentReturnUrl(): URL {
  return new URL(window.location.href);
}

export function SsoSessionBridge() {
  const { status, user } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated') return;
    const validateSession = () => {
      if (document.visibilityState !== 'visible' || !auth.currentUser) return;
      void isSsoSessionValid().then(async (valid) => {
        if (valid) return;
        localStorage.removeItem(SYNCED_UID_KEY);
        sessionStorage.removeItem(CHECKED_SESSION_KEY);
        await signOut(auth);
      }).catch((error: unknown) => {
        console.error('[SSO] Could not validate the active sign-in after returning to this website:', error);
      });
    };
    document.addEventListener('visibilitychange', validateSession);
    return () => document.removeEventListener('visibilitychange', validateSession);
  }, [status, user]);

  useEffect(() => {
    if (
      status === 'loading' ||
      status === 'error' ||
      window.location.pathname.replace(/\/+$/, '') === '/auth/sso' ||
      window.location.pathname.startsWith('/admin') ||
      isLocalDevelopment() ||
      isCrawler()
    ) return;

    const fragment = getSsoFragment();
    const fragmentAction = fragment?.get('__mahdev_sso');
    const returnHash = fragment?.get('returnHash') || '';
    if (fragmentAction === 'complete') {
      if (auth.currentUser) localStorage.setItem(SYNCED_UID_KEY, auth.currentUser.uid);
      sessionStorage.removeItem(PENDING_SESSION_KEY);
      sessionStorage.setItem(CHECKED_SESSION_KEY, '1');
      replaceSsoFragment(returnHash);
      return;
    }
    if (fragmentAction === 'none') {
      sessionStorage.removeItem(PENDING_SESSION_KEY);
      sessionStorage.setItem(CHECKED_SESSION_KEY, '1');
      replaceSsoFragment(returnHash);
      return;
    }
    if (fragmentAction) return;

    const currentUser = auth.currentUser;
    if (currentUser) {
      void (async () => {
        if (!(await isSsoSessionValid())) {
          localStorage.removeItem(SYNCED_UID_KEY);
          sessionStorage.removeItem(CHECKED_SESSION_KEY);
          await signOut(auth);
          return;
        }
        if (window.location.origin === CANONICAL_SITE_ORIGIN) {
          localStorage.setItem(SYNCED_UID_KEY, currentUser.uid);
          return;
        }
        if (localStorage.getItem(SYNCED_UID_KEY) === currentUser.uid) return;
        const pendingAt = Number(sessionStorage.getItem(PENDING_SESSION_KEY));
        if (Number.isFinite(pendingAt) && Date.now() - pendingAt < PENDING_MAX_AGE_MS) return;
        sessionStorage.setItem(PENDING_SESSION_KEY, String(Date.now()));
        const code = await issueSsoCode(CANONICAL_SITE_ORIGIN);
        window.location.replace(getSafeSsoBrokerUrl(currentReturnUrl(), code).toString());
      })().catch((error: unknown) => {
        sessionStorage.removeItem(PENDING_SESSION_KEY);
        console.error('[SSO] Could not validate or synchronize the signed-in session:', error);
      });
      return;
    }

    if (sessionStorage.getItem(CHECKED_SESSION_KEY) === '1') return;
    sessionStorage.setItem(CHECKED_SESSION_KEY, '1');
    const returnUrl = currentReturnUrl();
    const brokerUrl = getSafeSsoBrokerUrl(returnUrl);
    window.location.replace(brokerUrl.toString());
  }, [status, user]);

  return null;
}

export function SsoBridgePage() {
  const { status } = useAuth();
  const [message, setMessage] = useState('Connecting your Mahdev sign-in…');
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (status === 'loading' || started.current) return;
    started.current = true;
    const process = async () => {
      const params = getSsoFragment();
      const code = params?.get('__mahdev_sso');
      const returnHash = params?.get('returnHash') || '';
      const returnUrl = getSafeSsoReturnUrl(params?.get('return') || null);

      if (!params || !code || code === 'start') {
        if (!returnUrl) {
          setError('This sign-in request is invalid. Return to the website and try again.');
          return;
        }
        try {
          if (auth.currentUser) {
            setMessage('Connecting your account to this website…');
            const ssoCode = await issueSsoCode(returnUrl.origin);
            const destination = getSsoTargetBridgeUrl(returnUrl, ssoCode);
            window.location.replace(destination.toString());
          } else {
            window.location.replace(buildSsoReturnUrl(returnUrl, 'none', returnUrl.hash).toString());
          }
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : 'Could not connect your Mahdev sign-in.');
        }
        return;
      }

      try {
        setMessage('Verifying your sign-in…');
        const uid = await exchangeSsoCode(code);
        localStorage.setItem(SYNCED_UID_KEY, uid);
        replaceSsoFragment();
        if (returnUrl) {
          const destination = buildSsoReturnUrl(returnUrl, 'complete', returnUrl.hash);
          window.location.replace(destination.toString());
          return;
        }
        replaceSsoFragment(returnHash);
        setMessage('You are signed in. Continue to your page.');
      } catch (reason) {
        replaceSsoFragment();
        setError(reason instanceof Error ? reason.message : 'Could not complete cross-site sign-in.');
      }
    };
    void process();
  }, [status]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-6 text-[#1B1B1B]">
      <section className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Mahdev sign-in</h1>
        <p className="mt-3 text-sm text-slate-600" role={error ? 'alert' : 'status'}>
          {error || message}
        </p>
        {error && (
          <a className="mt-6 inline-flex rounded-full bg-[#1B1B1B] px-5 py-3 text-sm font-medium text-white" href="/">
            Return to the website
          </a>
        )}
      </section>
    </main>
  );
}
