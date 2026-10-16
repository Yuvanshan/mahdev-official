export const ADMIN_PORTAL_PATH = '/admin-yuvan1709';

// Old admin entry points. These are intentionally NOT redirected to the portal
// so the private admin URL is never revealed; they render the 404 page instead.
const RETIRED_ADMIN_PATHS = [
  '/admin',
  '/admin-login',
  '/adminlogin',
  '/adminportal',
  '/admin-portal',
];

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

// Kept for existing call sites: only trims trailing slashes, never rewrites
// legacy admin paths to the private portal path.
export function canonicalizeAdminPath(path: string): string {
  return normalizePath(path);
}

export function isAdminPortalPath(path: string): boolean {
  const normalizedPath = normalizePath(path);
  return normalizedPath === ADMIN_PORTAL_PATH || normalizedPath.startsWith(`${ADMIN_PORTAL_PATH}/`);
}

export function isRetiredAdminPath(path: string): boolean {
  const normalizedPath = normalizePath(path).toLowerCase();
  return RETIRED_ADMIN_PATHS.some(
    (legacyPath) => normalizedPath === legacyPath || normalizedPath.startsWith(`${legacyPath}/`)
  );
}

// True when the browser is currently on the admin portal (path or hash route).
export function isBrowserOnAdminPortal(): boolean {
  if (typeof window === 'undefined') return false;
  const hashRoute = window.location.hash.startsWith('#/')
    ? window.location.hash.slice(1).split('?')[0]
    : '';
  return isAdminPortalPath(hashRoute || window.location.pathname || '/');
}

export function getAdminPortalPath(section?: string): string {
  return section ? `${ADMIN_PORTAL_PATH}/${section}` : ADMIN_PORTAL_PATH;
}
