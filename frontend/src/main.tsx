import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// After a new deployment, a tab opened on the previous build still asks for that
// build's chunk files, which no longer exist (404). Reload once to pick up the
// current build instead of showing a broken page.
const CHUNK_RELOAD_KEY = 'mahdev_chunk_reload_at';
window.addEventListener('vite:preloadError', (event) => {
  try {
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    // Guard against a reload loop if the chunk is genuinely missing.
    if (Date.now() - lastReload < 10_000) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode): still reload once; the browser keeps no loop state.
  }
  event.preventDefault();
  window.location.reload();
});

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Application root element is missing.');

  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
};

const appStylesheet = document.querySelector<HTMLLinkElement>('link[data-app-stylesheet]');
if (appStylesheet) {
  let hasRendered = false;
  const renderOnce = () => {
    if (hasRendered) return;
    hasRendered = true;
    renderApp();
  };

  appStylesheet.addEventListener('load', renderOnce, { once: true });
  appStylesheet.addEventListener(
    'error',
    (event) => {
      console.error('[startup] Failed to load the application stylesheet.', event);
      renderOnce();
    },
    { once: true },
  );
  appStylesheet.rel = 'stylesheet';
  if (appStylesheet.sheet) renderOnce();
} else {
  renderApp();
}

