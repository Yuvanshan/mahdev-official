import type { IncomingMessage } from 'node:http';
import { CANONICAL_SITE_ORIGIN } from '../../src/config/site.js';
import {
  getDivisionSiteForHost,
  getDivisionSiteOrigin,
} from '../../src/config/divisionSites.js';

export function getRequestSiteOrigin(req: IncomingMessage): string {
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host;
  const host = (Array.isArray(rawHost) ? rawHost[0] : rawHost)
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  if (!host) return CANONICAL_SITE_ORIGIN;

  let hostname: string;
  try {
    hostname = new URL(`https://${host}`).hostname;
  } catch {
    return CANONICAL_SITE_ORIGIN;
  }

  const canonicalHostname = new URL(CANONICAL_SITE_ORIGIN).hostname.toLowerCase();
  if (hostname === canonicalHostname || hostname === `www.${canonicalHostname}`) {
    return CANONICAL_SITE_ORIGIN;
  }

  const division = getDivisionSiteForHost(hostname);
  return division ? getDivisionSiteOrigin(division) || CANONICAL_SITE_ORIGIN : CANONICAL_SITE_ORIGIN;
}
