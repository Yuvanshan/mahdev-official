import { rewrite } from '@vercel/functions';
import { getDivisionSiteForHost } from './src/config/divisionSites.js';

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!api(?:/|$)|assets(?:/|$)|uploads(?:/|$)|admin-yuvan1709(?:/|$)|.*\\.).*)'],
};

export default function middleware(request: Request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return;

  const url = new URL(request.url);
  if (!getDivisionSiteForHost(url.hostname)) return;

  const destination = new URL('/api/page-shell', url);
  destination.searchParams.set('route', url.pathname);
  url.searchParams.forEach((value, key) => {
    if (key !== 'route') destination.searchParams.append(key, value);
  });
  return rewrite(destination);
}
