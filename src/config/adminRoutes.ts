export const ADMIN_PORTAL_PATH = '/admin-yuvan1709';

const LEGACY_ADMIN_PATHS = [
  '/admin',
  '/admin-login',
  '/adminlogin',
  '/adminportal',
  '/admin-portal',
];

export function canonicalizeAdminPath(path: string): string {
  const normalizedPath = path.replace(/\/+$/, '') || '/';
  for (const legacyPath of LEGACY_ADMIN_PATHS) {
    if (normalizedPath === legacyPath) return ADMIN_PORTAL_PATH;
    if (normalizedPath.startsWith(`${legacyPath}/`)) {
      return `${ADMIN_PORTAL_PATH}${normalizedPath.slice(legacyPath.length)}`;
    }
  }
  return normalizedPath;
}

export function isAdminPortalPath(path: string): boolean {
  const normalizedPath = canonicalizeAdminPath(path);
  return normalizedPath === ADMIN_PORTAL_PATH || normalizedPath.startsWith(`${ADMIN_PORTAL_PATH}/`);
}

export function getAdminPortalPath(section?: string): string {
  return section ? `${ADMIN_PORTAL_PATH}/${section}` : ADMIN_PORTAL_PATH;
}
