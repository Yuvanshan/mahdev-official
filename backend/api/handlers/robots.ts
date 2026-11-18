import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRequestSiteOrigin } from '../../seo/requestOrigin.js';

const DISALLOWED_PATHS = [
  '/admin',
  '/admin/',
  // The private admin URL is not listed here: robots.txt is public. It is protected by an X-Robots-Tag noindex header (vercel.json).
  '/admin-login',
  '/adminlogin',
  '/adminportal',
  '/admin-portal',
  '/account',
  '/account/',
  '/checkout',
  '/cart',
  '/wishlist',
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

// Search and AI answer engines may read the public pages (SEO, AEO, GEO).
const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot',
];

export function buildRobotsTxt(origin: string): string {
  const crawlerRules = AI_CRAWLERS.flatMap((agent) => [
    `User-agent: ${agent}`,
    'Allow: /',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    '',
  ]);
  return [
    ...crawlerRules,
    'User-agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    `# LLM guidance: ${origin}/llms.txt`,
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
