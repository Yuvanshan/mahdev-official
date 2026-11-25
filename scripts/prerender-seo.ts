// TypeScript (run with tsx after `vite build`).
//
// Writes a static HTML file per public route (dist/<route>/index.html) with
// that route's own <title>, description, canonical URL, Open Graph tags and a
// crawlable <h1>. Vercel serves these files before any rewrite, so crawlers
// get correct metadata without running JavaScript. Also writes
// dist/app-shell.html: the neutral SPA shell used for every other route.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadEnv } from 'vite';
import type { RouteSeo } from '../backend/seo/publicRoutes';
import { renderSeoHtml } from '../backend/seo/renderSeoHtml';

// Load .env files exactly as `vite build` does, so prerendered pages use the
// same VITE_SITE_URL domain as index.html (Vercel already sets process.env).
const fileEnv = loadEnv(process.env.NODE_ENV === 'development' ? 'development' : 'production', process.cwd(), '');
process.env.VITE_SITE_URL ||= fileEnv.VITE_SITE_URL || fileEnv.PUBLIC_SITE_URL || '';
// Imported after the env is loaded, because the site origin is read at import time.
const { PRERENDERED_ROUTES, SITE_ORIGIN } = await import('../backend/seo/publicRoutes');

const DIST = 'dist';
const builtHtml = readFileSync(join(DIST, 'index.html'), 'utf8');

const preloadStylesheet = (html: string) => {
  const stylesheetLinks = html.match(/<link\b(?=[^>]*\brel="stylesheet")[^>]*>/g) || [];
  if (stylesheetLinks.length !== 1) {
    throw new Error(`Expected one application stylesheet link; found ${stylesheetLinks.length}.`);
  }

  const stylesheetLink = stylesheetLinks[0];
  const href = stylesheetLink.match(/\bhref="([^"]+)"/)?.[1];
  if (!href) throw new Error('The application stylesheet link is missing its href.');
  const crossorigin = /\bcrossorigin(?:\s|>)/.test(stylesheetLink) ? ' crossorigin' : '';
  const preload = `<link rel="preload" as="style" href="${href}"${crossorigin} data-app-stylesheet />`;
  const noScriptStylesheet = `<noscript><link rel="stylesheet" href="${href}"${crossorigin} /><style>#startup-shimmer{display:none!important}#seo-fallback{position:static!important;width:auto!important;height:auto!important;padding:1.5rem!important;margin:0 auto!important;overflow:visible!important;clip:auto!important;white-space:normal!important;border:0!important;max-width:70ch}</style></noscript>`;

  return html.replace(stylesheetLink, `${preload}\n    ${noScriptStylesheet}`);
};

const baseHtml = preloadStylesheet(builtHtml);
writeFileSync(join(DIST, 'index.html'), baseHtml);

const removeHomeOnly = (html: string) => html.replace(/^\s*<!-- Home only:.*\n/m, '').replace(/^\s*<link[^>]*data-home-only[^>]*>\n/m, '');

// Throws (failing the build) if dist/index.html stops matching the expected tags.
const renderRoute = (route: RouteSeo) => renderSeoHtml(removeHomeOnly(baseHtml), route, SITE_ORIGIN);

for (const route of PRERENDERED_ROUTES) {
  const file = join(DIST, route.path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, renderRoute(route));
}

// Neutral shell for dynamic routes: no home canonical/og:url (the app sets the
// right ones at runtime) and no home-only preloads.
const shell = removeHomeOnly(baseHtml)
  .replace(/^\s*<link rel="canonical" href="[^"]*" \/>\n/m, '')
  .replace(/^\s*<meta property="og:url" content="[^"]*" \/>\n/m, '');
writeFileSync(join(DIST, 'app-shell.html'), shell);

console.log(`[prerender-seo] Wrote ${PRERENDERED_ROUTES.length} route pages and dist/app-shell.html.`);
