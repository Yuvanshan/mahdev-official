import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRequestSiteOrigin } from '../../seo/requestOrigin.js';

const DISALLOWED_PATHS = [
  '/admin',
  '/admin/',
  '/admin-yuvan1709',
  '/admin-login',
  '/adminlogin',
  '/adminportal',
  '/admin-portal',
  '/account',
  '/account/',
  '/checkout',
  '/cart',
  '/bookings',
  '/order',
  '/order/',
  '/orders',
  '/track-order',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth',
  '/book/service/',
  '/book/gallery/',
  '/book/product/',
  '/api/',
];

export function buildRobotsTxt(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

export default function robotsHandler(req: IncomingMessage, res: ServerResponse): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method not allowed');
    return;
  }

  const body = buildRobotsTxt(getRequestSiteOrigin(req));
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.end(req.method === 'HEAD' ? undefined : body);
}
