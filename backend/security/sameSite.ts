import type { IncomingMessage } from 'node:http';

function headerValue(req: IncomingMessage, name: string): string {
  const value = req.headers[name];
  return (Array.isArray(value) ? value[0] : value) || '';
}

/**
 * True when the request comes from a page on this same site. Browsers set
 * Sec-Fetch-Site themselves (pages cannot fake it); older browsers fall back
 * to the Origin/Referer host. Direct visits, other websites and scripts fail.
 * This slows down scripted use; it is not access control on its own.
 */
export function isFromThisSite(req: IncomingMessage): boolean {
  const fetchSite = headerValue(req, 'sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin';
  const host = headerValue(req, 'x-forwarded-host') || headerValue(req, 'host');
  const source = headerValue(req, 'origin') || headerValue(req, 'referer');
  try {
    return Boolean(host && source && new URL(source).host === host);
  } catch {
    return false;
  }
}
