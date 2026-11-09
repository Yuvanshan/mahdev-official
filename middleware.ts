import { rewrite } from '@vercel/functions';
import {
  DIVISION_SITE_BRANDING,
  getDivisionSiteForHost,
} from './frontend/src/config/divisionSites.js';

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!api(?:/|$)|assets(?:/|$)|uploads(?:/|$)|admin-yuvan1709(?:/|$)|.*\\.).*)',
    '/favicon.ico',
    '/favicon.png',
    '/favicon-48x48.png',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/icon-192.png',
    '/icon-512.png',
    '/site.webmanifest',
  ],
};

export default function middleware(request: Request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return;

  const url = new URL(request.url);
  const division = getDivisionSiteForHost(url.hostname);
  if (!division) return;

  const { logoPath, name, shortName } = DIVISION_SITE_BRANDING[division];
  if (url.pathname === '/site.webmanifest') {
    const type = logoPath.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg';
    const body = request.method === 'HEAD'
      ? null
      : JSON.stringify({
          name,
          short_name: shortName,
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#FAF9F6',
          theme_color: '#0052FF',
          icons: [{ src: logoPath, sizes: 'any', type, purpose: 'any' }],
        });
    return new Response(body, {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  }
  if (
    url.pathname === '/favicon.ico' ||
    url.pathname === '/favicon.png' ||
    url.pathname === '/favicon-48x48.png' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/apple-touch-icon-precomposed.png' ||
    url.pathname === '/icon-192.png' ||
    url.pathname === '/icon-512.png'
  ) {
    return rewrite(new URL(logoPath, url));
  }

  const destination = new URL('/api/page-shell', url);
  destination.searchParams.set('route', url.pathname);
  url.searchParams.forEach((value, key) => {
    if (key !== 'route') destination.searchParams.append(key, value);
  });
  return rewrite(destination);
}
