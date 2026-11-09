/**
 * Alternative URLs for each division page (e.g. /sws-event-management -> /sws).
 * The app canonicalises these in the browser, vercel.json answers them with a
 * 301 redirect, and the sitemap lists only the canonical URL. Keep vercel.json's
 * "redirects" in sync when adding an alias (a test checks this).
 */
export const DIVISION_ROUTE_ALIASES: Record<string, string> = {
  '/sws-event-management': '/sws',
  '/sws-events': '/sws',
  '/sws-event': '/sws',
  '/event-management': '/sws',
  '/events-management': '/sws',
  '/events': '/sws',
  '/decorations': '/sws',
  '/decor': '/sws',
  '/u1-studio': '/u1',
  '/u1-cinema': '/u1',
  '/studio': '/u1',
  '/photography': '/u1',
  '/cinema': '/u1',
  '/it-solutions': '/it',
  '/mahdev-it': '/it',
  '/solutions': '/it',
  '/software': '/it',
  '/it-services': '/it',
  '/mahdev-travels': '/travels',
  '/tourism': '/travels',
  '/tours': '/travels',
  '/travel': '/travels',
  '/online-mart': '/mart',
  '/mahdev-mart': '/mart',
  '/shop': '/mart',
  '/store': '/mart',
};

export function canonicalizeDivisionRoute(path: string): string {
  const normalizedPath = `/${(path || '').replace(/^\/+|\/+$/g, '').toLowerCase()}`;
  const divisionRoute = normalizedPath.match(/^\/(?:divisions|division)\/(sws|u1|it|travels|mart)(\/.*)?$/);
  if (divisionRoute) return `/${divisionRoute[1]}${divisionRoute[2] || ''}`;

  // Any other SWS spelling (/sws-event, /sws_events, /swsevents, /SWS-Event-Management)
  // goes to /sws; mirrors the pattern redirect in vercel.json.
  if (/^\/sws(?:(?:[-_]|%20| )?[a-z0-9]+)+$/.test(normalizedPath)) return '/sws';

  const alias = Object.entries(DIVISION_ROUTE_ALIASES).find(
    ([route]) => normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  );
  return alias
    ? `${alias[1]}${normalizedPath.slice(alias[0].length)}`
    : normalizedPath || '/';
}
