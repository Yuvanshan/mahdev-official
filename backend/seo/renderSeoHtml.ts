/**
 * Writes a route's own <title>, description, canonical URL, Open Graph tags,
 * JSON-LD and crawlable <h1> into the site's HTML shell. Used by the build-time
 * prerender step (scripts/prerender-seo.ts) for fixed pages and by the page
 * shell (api /page-shell) for service, product, project and gallery pages, so
 * crawlers never see the home page's head on those URLs.
 */

import type { RouteSeo } from './publicRoutes.js';
import { SOCIAL_PROFILES } from '../../src/config/company.js';

// Official profiles as plain links, so crawlers that do not run JavaScript still find them.
const SOCIAL_LINKS_HTML = SOCIAL_PROFILES
  .map(({ label, url }) => `<a href="${escapeHtml(url)}" rel="me noopener">${escapeHtml(label)}</a>`)
  .join(' · ');

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Replace one tag; throw if the shell stops matching, so a broken template is caught.
// A function replacement keeps "$" in content (e.g. prices) from being read as a pattern.
function replaceTag(html: string, pattern: RegExp, replacement: string | ((match: string, ...groups: string[]) => string), label: string): string {
  if (!pattern.test(html)) throw new Error(`[seo] Could not find ${label} in the HTML shell.`);
  return html.replace(pattern, typeof replacement === 'string' ? () => replacement : replacement);
}

// The app shell has no canonical or og:url (see prerender-seo.ts), so add them when missing.
function upsertTag(html: string, pattern: RegExp, tag: string): string {
  if (pattern.test(html)) return html.replace(pattern, () => tag);
  return replaceTag(html, /<meta name="description" content="[^"]*" \/>/, (match) => `${match}\n    ${tag}`, 'meta description');
}

/** Absolute URL for a site path ("/assets/x.jpg") or an already absolute image URL. */
const absoluteUrl = (value: string, origin: string) => (/^https?:\/\//i.test(value) ? value : `${origin}${value}`);

export function renderSeoHtml(baseHtml: string, route: RouteSeo, origin: string): string {
  const url = escapeHtml(`${origin}${route.path}`);
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  let html = baseHtml;
  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, '<title>');
  html = replaceTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`, 'meta description');
  html = upsertTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`, 'og:title');
  html = replaceTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`, 'og:description');
  html = upsertTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`, 'twitter:title');
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${description}" />`, 'twitter:description');
  if (route.ogImage) {
    const image = escapeHtml(absoluteUrl(route.ogImage, origin));
    html = replaceTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${image}" />`, 'og:image');
    html = replaceTag(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${image}" />`, 'twitter:image');
  }
  // Route-specific crawlable copy inside the (visually hidden) fallback block.
  html = replaceTag(
    html,
    /(<main id="seo-fallback"[^>]*>)[\s\S]*?(<\/main>)/,
    (_match, open, close) => `${open}\n        <h1>${escapeHtml(route.heading)}</h1>\n        <p>${escapeHtml(route.intro)}</p>\n        <p>${description}</p>\n        <p><a href="/">Mahdev home</a> · <a href="/services">Services</a> · <a href="/contact">Contact</a></p>\n        <p>Follow Mahdev: ${SOCIAL_LINKS_HTML}</p>\n      ${close}`,
    'seo-fallback block'
  );
  if (route.structuredData?.length) {
    // JSON-LD is data, not script code: escape "<" so content can never close the tag.
    const blocks = route.structuredData
      .map((block) => `    <script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`)
      .join('\n');
    html = replaceTag(html, /<\/head>/, `${blocks}\n  </head>`, '</head>');
  }
  return html;
}
