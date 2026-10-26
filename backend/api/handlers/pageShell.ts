import type { IncomingMessage, ServerResponse } from 'node:http';
import { initializeTursoDatabase } from '../../db/tursoDatabase.js';
import { handleTursoAction } from '../tursoRoutes.js';
import { APP_ROUTE_SEGMENTS, RETIRED_ADMIN_SEGMENTS } from '../../seo/publicRoutes.js';
import { resolveDynamicRouteSeo } from '../../seo/dynamicRouteSeo.js';
import { renderSeoHtml } from '../../seo/renderSeoHtml.js';
import { CANONICAL_SITE_ORIGIN } from '../../../src/config/site.js';

/**
 * GET /api/page-shell?route=/some/route (or the original page URL via a rewrite)
 *
 * Serves the single-page-app shell for routes that are not prerendered, with
 * the correct HTTP status: 404 for unknown URLs and retired admin paths, so
 * search engines stop indexing "soft 404s". Responses are CDN-cached.
 * Fails open: if anything goes wrong the shell is served with 200, so a
 * problem here can never take the website down.
 */

const PAGES_CACHE_MS = 60_000;
let shellCache: { html: string; origin: string } | null = null;
let publishedSlugs: { slugs: Set<string>; loadedAt: number } | null = null;

async function getShell(origin: string): Promise<string> {
  if (shellCache && shellCache.origin === origin) return shellCache.html;
  for (const file of ['/app-shell.html', '/index.html']) {
    const response = await fetch(`${origin}${file}`);
    if (response.ok) {
      const html = await response.text();
      shellCache = { html, origin };
      return html;
    }
  }
  throw new Error('App shell is unavailable.');
}

// Published CMS page slugs ("about-x", "insights/y"), cached briefly per instance.
async function getPublishedSlugs(): Promise<Set<string>> {
  if (publishedSlugs && Date.now() - publishedSlugs.loadedAt < PAGES_CACHE_MS) return publishedSlugs.slugs;
  await initializeTursoDatabase();
  const result = await handleTursoAction({ action: 'list', collection: 'pages', parentPath: '' }, { role: 'public' });
  const slugs = new Set<string>();
  for (const document of (result.body.documents as Array<{ data: Record<string, unknown> }> | undefined) || []) {
    const { slug, isPublished, category } = document.data;
    if (isPublished && typeof slug === 'string' && slug) {
      slugs.add((category === 'insights' ? `insights/${slug}` : slug).toLowerCase());
    }
  }
  publishedSlugs = { slugs, loadedAt: Date.now() };
  return slugs;
}

async function resolveStatus(path: string): Promise<200 | 404> {
  const normalised = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  // "%" also ends the segment so legacy "/services%{slug}" category links resolve as /services.
  const firstSegment = normalised.split('/')[0].split('%')[0] || '';
  if (RETIRED_ADMIN_SEGMENTS.has(firstSegment) || firstSegment === '__denied') return 404;
  if (APP_ROUTE_SEGMENTS.has(firstSegment)) return 200;
  return (await getPublishedSlugs()).has(normalised) ? 200 : 404;
}

/** Serves the website's HTML 404 page (used for unknown API addresses opened in a browser). */
export function sendNotFoundPage(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return serveShell(req, res, 404);
}

export default function pageShellHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return serveShell(req, res);
}

async function serveShell(req: IncomingMessage, res: ServerResponse, forcedStatus?: 404): Promise<void> {
  const url = new URL(req.url || '/', 'http://localhost');
  // Vercel passes the original page URL to rewritten requests; a direct call
  // uses ?route=. ("path" is avoided: Vercel injects it for api/[...path].ts.)
  const path = url.pathname.startsWith('/api/') ? url.searchParams.get('route') || '/' : url.pathname;
  const host = (Array.isArray(req.headers['x-forwarded-host']) ? req.headers['x-forwarded-host'][0] : req.headers['x-forwarded-host'])
    || req.headers.host || 'localhost';
  const origin = `${host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https'}://${host}`;

  let status: 200 | 404 = forcedStatus ?? 200;
  try {
    if (!forcedStatus) status = await resolveStatus(path);
  } catch (error) {
    console.error('[PageShell] Could not resolve route status; serving 200:', error);
  }

  let html: string;
  try {
    html = await getShell(origin);
  } catch (error) {
    console.error('[PageShell] App shell unavailable:', error);
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('The website is temporarily unavailable. Please refresh in a moment.');
    return;
  }

  if (status === 200) {
    // Single service/product/project/gallery URLs get their own title, description and canonical.
    try {
      const seo = await resolveDynamicRouteSeo(path, url.searchParams);
      if (seo) html = renderSeoHtml(html, seo, CANONICAL_SITE_ORIGIN);
    } catch (error) {
      console.error('[PageShell] Could not add page SEO; serving the plain shell:', error);
    }
  }

  if (status === 404) {
    // Tell crawlers not to index the not-found page.
    html = html.replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex, follow" />');
    res.setHeader('X-Robots-Tag', 'noindex, follow');
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.end(html);
}
