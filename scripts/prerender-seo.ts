// TypeScript (run with tsx after `vite build`).
//
// Writes a static HTML file per public route (dist/<route>/index.html) with
// that route's own <title>, description, canonical URL, Open Graph tags and a
// crawlable <h1>. Vercel serves these files before any rewrite, so crawlers
// get correct metadata without running JavaScript. Also writes
// dist/app-shell.html: the neutral SPA shell used for every other route.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PRERENDERED_ROUTES, SITE_ORIGIN, type RouteSeo } from '../backend/seo/publicRoutes';

const DIST = 'dist';
const baseHtml = readFileSync(join(DIST, 'index.html'), 'utf8');

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Replace one tag; fail the build loudly if index.html stops matching.
function replaceTag(html: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(html)) throw new Error(`[prerender-seo] Could not find ${label} in dist/index.html.`);
  return html.replace(pattern, replacement);
}

const removeHomeOnly = (html: string) => html.replace(/^\s*<!-- Home only:.*\n/m, '').replace(/^\s*<link[^>]*data-home-only[^>]*>\n/m, '');

function renderRoute(route: RouteSeo): string {
  const url = `${SITE_ORIGIN}${route.path}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  let html = removeHomeOnly(baseHtml);
  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, '<title>');
  html = replaceTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`, 'meta description');
  html = replaceTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, 'canonical');
  html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`, 'og:title');
  html = replaceTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`, 'og:description');
  html = replaceTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`, 'og:url');
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`, 'twitter:title');
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${description}" />`, 'twitter:description');
  // Route-specific crawlable copy inside the (visually hidden) fallback block.
  html = replaceTag(
    html,
    /(<main id="seo-fallback"[^>]*>)[\s\S]*?(<\/main>)/,
    `$1\n        <h1>${escapeHtml(route.heading)}</h1>\n        <p>${escapeHtml(route.intro)}</p>\n        <p>${description}</p>\n        <p><a href="/">Mahdev home</a> · <a href="/services">Services</a> · <a href="/contact">Contact</a></p>\n      $2`,
    'seo-fallback block'
  );
  return html;
}

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
