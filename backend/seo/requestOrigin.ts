import type { IncomingMessage } from 'node:http';
import { CANONICAL_SITE_ORIGIN } from '../../shared/config/site.js';

// One website: every host serves the corporate origin's canonical URLs.
export function getRequestSiteOrigin(_req: IncomingMessage): string {
  return CANONICAL_SITE_ORIGIN;
}
