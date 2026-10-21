/**
 * The website's public origin (canonical URLs, sitemap, structured data,
 * robots.txt and llms.txt). Set VITE_SITE_URL in the environment and redeploy
 * to move the site to a new domain; this default is used when it is unset.
 */
export const DEFAULT_SITE_ORIGIN = 'https://mahdev-official.vercel.app';

/** Validates a configured URL and returns its bare origin (no trailing slash). */
export function resolveSiteOrigin(configured?: string | null): string {
  const value = configured?.trim();
  if (!value) return DEFAULT_SITE_ORIGIN;
  const parsed = new URL(value);
  if (!/^https?:$/.test(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`VITE_SITE_URL must be an origin without a path, query, or fragment (got "${value}").`);
  }
  return parsed.origin;
}

function readConfiguredSiteUrl(): string | undefined {
  // Vite inlines import.meta.env into the browser bundle at build time.
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  // Build scripts and the API run in Node, where the value comes from process.env.
  const nodeEnv = typeof process !== 'undefined' ? process.env : undefined;
  return viteEnv?.VITE_SITE_URL || nodeEnv?.VITE_SITE_URL || nodeEnv?.PUBLIC_SITE_URL;
}

export const CANONICAL_SITE_ORIGIN = resolveSiteOrigin(readConfiguredSiteUrl());

/** Host name only (e.g. "mahdev-official.vercel.app"), for display in the admin. */
export const CANONICAL_SITE_HOST = new URL(CANONICAL_SITE_ORIGIN).host;

/**
 * The name Google shows above search results ("site name"). Google reads it from
 * the home page's WebSite structured data, og:site_name and title, so all of them
 * use these exact values. Without them Google falls back to the host ("Vercel").
 */
export const SITE_NAME = 'Mahdev (Pvt) Ltd';
export const SITE_ALTERNATE_NAMES = ['Mahdev', 'Mahdev Pvt Ltd', 'MAHDEV Pvt. Ltd.'];
/** Legal name; keep identical to the Google Business Profile listing. */
export const ORGANIZATION_LEGAL_NAME = 'MAHDEV Pvt. Ltd.';
