import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp } from 'firebase-admin/app';
import type { AdminRole, AdminUser } from '../src/types/admin';
import { getTursoDocument, listTursoDocuments } from './tursoDatabase';

export class AdminAuthenticationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = 'AdminAuthenticationError';
  }
}

const ADMIN_ROLES = new Set<AdminRole>([
  'super_admin',
  'operations_admin',
  'operations_manager',
  'finance_admin',
  'finance_manager',
  'booking_coordinator',
  'division_manager',
  'editor',
  'auditor',
]);

function getAdminApp() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    'for-her-33ea9';
  const existingApp = getApps().find((app) => app.name === 'mahdev-admin-auth');
  return existingApp || initializeApp({ projectId }, 'mahdev-admin-auth');
}

function getAllowedAdmins(): Map<string, AdminRole> {
  const configured = process.env.TURSO_ADMIN_EMAILS;
  if (!configured) return new Map();

  const entries = configured.split(',').map((entry) => entry.trim()).filter(Boolean);
  const admins = new Map<string, AdminRole>();
  for (const entry of entries) {
    const [rawEmail, rawRole] = entry.split(':').map((part) => part.trim());
    const email = rawEmail.toLowerCase();
    const role = (rawRole || 'super_admin') as AdminRole;
    if (!email || !email.includes('@') || !ADMIN_ROLES.has(role)) {
      throw new AdminAuthenticationError(
        'TURSO_ADMIN_EMAILS contains an invalid email or role.',
        503
      );
    }
    admins.set(email, role);
  }
  return admins;
}

export async function verifyFirebaseAdminToken(token: string): Promise<{
  uid: string;
  email: string;
  role: AdminRole;
  user: AdminUser;
}> {
  if (!token) {
    throw new AdminAuthenticationError('A Firebase sign-in token is required.', 401);
  }

  const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
  const email = (decoded.email || '').toLowerCase().trim();
  if (!email || decoded.email_verified !== true) {
    throw new AdminAuthenticationError('A verified Firebase email is required.', 403);
  }

  let role = getAllowedAdmins().get(email);
  if (!role) {
    try {
      const adminRecord = await getTursoDocument('admins', '', decoded.uid);
      const records = adminRecord &&
        typeof adminRecord.data.email === 'string' &&
        adminRecord.data.email.toLowerCase().trim() === email
        ? [adminRecord]
        : await listTursoDocuments('admins', '');
      for (const record of records) {
        const data = record.data;
        const recordEmail = typeof data.email === 'string' ? data.email.toLowerCase().trim() : '';
        const recordRole = typeof data.role === 'string' ? data.role as AdminRole : undefined;
        const active = data.isActive !== false && data.status !== 'inactive' && data.status !== 'disabled';
        if (recordEmail === email && active && recordRole && ADMIN_ROLES.has(recordRole)) {
          role = recordRole;
          break;
        }
      }
    } catch (error) {
      console.error('[Admin Auth] Could not read the Turso admin registry:', error);
      throw new AdminAuthenticationError('Admin registry is unavailable.', 503);
    }
  }
  if (!role) {
    throw new AdminAuthenticationError('This Firebase account is not authorized for admin access.', 403);
  }

  const name = typeof decoded.name === 'string' && decoded.name.trim()
    ? decoded.name.trim()
    : email;
  const user: AdminUser = {
    id: decoded.uid,
    name,
    email,
    role,
    department: 'Mahdev Administration',
    divisionAccess: ['all'],
    avatarUrl: typeof decoded.picture === 'string' ? decoded.picture : undefined,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date(decoded.auth_time * 1000).toISOString(),
  };

  return { uid: decoded.uid, email, role, user };
}

export function getBearerToken(header: string | undefined): string {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}
