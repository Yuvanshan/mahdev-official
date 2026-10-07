import { Router, Request, Response } from 'express';
import {
  checkTursoConnection,
  clearTursoCollection,
  getTursoDocument,
  listTursoDocuments,
  TursoFilter,
  TursoOrder,
  TursoWrite,
  writeTursoBatch,
  writeTursoDocument,
} from './tursoDatabase';
import {
  AdminAuthenticationError,
  getBearerToken,
  verifyFirebaseAdminToken,
} from './firebaseAdminAuth';

const ADMIN_MANAGED_COLLECTIONS = new Set([
  'admins',
  'announcements',
  'auditLogs',
  'banners',
  'blog',
  'categories',
  'companySettings',
  'coupons',
  'divisions',
  'faqs',
  'gallery',
  'googleReviews',
  'googleReviewsConfig',
  'heroSections',
  'inventory',
  'legalPages',
  'media_assets',
  'media_blobs',
  'milestones',
  'navigation',
  'pages',
  'packages',
  'portfolio',
  'productVariants',
  'products',
  'projects',
  'services',
  'settings',
  'statistics',
  'team',
  'testimonials',
  'trustedCompanies',
  'websiteContent',
]);

function requiresAdminForWrite(write: unknown): boolean {
  if (!write || typeof write !== 'object') return false;
  const item = write as Record<string, unknown>;
  const collection = typeof item.collection === 'string' ? item.collection.split('/')[0] : '';
  if (ADMIN_MANAGED_COLLECTIONS.has(collection)) return true;

  if (['orders', 'bookings', 'payments'].includes(collection)) {
    return item.type !== 'set' || item.merge === true;
  }
  return false;
}

export function requiresAdminForDatabaseAction(input: unknown): boolean {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const body = input as Record<string, unknown>;
  if (body.action === 'clear') return true;
  if (body.action === 'get' || body.action === 'list') {
    const collection = typeof body.collection === 'string' ? body.collection.split('/')[0] : '';
    if (collection === 'admins' || collection === 'auditLogs') return true;
  }
  if (body.action === 'write') return requiresAdminForWrite(body.write);
  if (body.action === 'batch' && Array.isArray(body.writes)) {
    return body.writes.some(requiresAdminForWrite);
  }
  return false;
}

export function requiresSuperAdminForDatabaseAction(input: unknown): boolean {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const body = input as Record<string, unknown>;
  if (body.action === 'clear') return true;
  if (body.action === 'get' || body.action === 'list') {
    const collection = typeof body.collection === 'string' ? body.collection.split('/')[0] : '';
    return collection === 'admins';
  }
  const isAdminWrite = (write: unknown): boolean => {
    if (!write || typeof write !== 'object') return false;
    const collection = (write as Record<string, unknown>).collection;
    return typeof collection === 'string' && collection.split('/')[0] === 'admins';
  };
  if (body.action === 'write') return isAdminWrite(body.write);
  if (body.action === 'batch' && Array.isArray(body.writes)) {
    return body.writes.some(isAdminWrite);
  }
  return false;
}

export async function authorizeDatabaseAction(
  input: unknown,
  authorizationHeader: string | undefined
): Promise<void> {
  if (!requiresAdminForDatabaseAction(input)) return;
  try {
    const admin = await verifyFirebaseAdminToken(getBearerToken(authorizationHeader));
    if (requiresSuperAdminForDatabaseAction(input) && admin.role !== 'super_admin') {
      throw new AdminAuthenticationError('Super administrator access is required for this action.', 403);
    }
  } catch (error) {
    if (error instanceof AdminAuthenticationError) throw error;
    throw new AdminAuthenticationError('Firebase admin authentication failed.', 401);
  }
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) throw new Error(`${label} is required.`);
  return value;
}

function parseFilters(value: unknown): TursoFilter[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Query filters must be an array.');
  return value.map((filter) => {
    if (!filter || typeof filter !== 'object') throw new Error('Invalid query filter.');
    const item = filter as Record<string, unknown>;
    return {
      field: requiredString(item.field, 'Filter field'),
      operator: requiredString(item.operator, 'Filter operator'),
      value: item.value,
    };
  });
}

function parseOrder(value: unknown): TursoOrder | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object') throw new Error('Invalid query ordering.');
  const item = value as Record<string, unknown>;
  const direction = item.direction === 'desc' ? 'desc' : 'asc';
  return { field: requiredString(item.field, 'Order field'), direction };
}

function parseWrite(value: unknown): TursoWrite {
  if (!value || typeof value !== 'object') throw new Error('Invalid database write.');
  const write = value as Record<string, unknown>;
  const type = write.type;
  if (type !== 'set' && type !== 'update' && type !== 'delete') {
    throw new Error('Write type must be set, update, or delete.');
  }
  return {
    type,
    collection: requiredString(write.collection, 'Collection'),
    parentPath: typeof write.parentPath === 'string' ? write.parentPath : '',
    id: requiredString(write.id, 'Document ID'),
    data: write.data as Record<string, unknown> | undefined,
    merge: write.merge === true,
  };
}

export async function handleTursoAction(input: unknown): Promise<{
  status: number;
  body: Record<string, unknown>;
}> {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Invalid database request.');
    }
    const body = input as Record<string, unknown>;
    const action = requiredString(body.action, 'Action');

    if (action === 'health') {
      await checkTursoConnection();
      return { status: 200, body: { success: true, provider: 'turso' } };
    }

    if (action === 'write') {
      await writeTursoDocument(parseWrite(body.write));
      return { status: 200, body: { success: true } };
    }
    if (action === 'batch') {
      if (!Array.isArray(body.writes)) throw new Error('Batch writes must be an array.');
      await writeTursoBatch(body.writes.map(parseWrite));
      return { status: 200, body: { success: true } };
    }

    const collection = requiredString(body.collection, 'Collection');
    const parentPath = typeof body.parentPath === 'string' ? body.parentPath : '';
    if (action === 'get') {
      const id = requiredString(body.id, 'Document ID');
      return {
        status: 200,
        body: { document: await getTursoDocument(collection, parentPath, id) },
      };
    }
    if (action === 'list') {
      const maxRows = body.limit === undefined ? undefined : Number(body.limit);
      const afterId = typeof body.afterId === 'string' ? body.afterId : undefined;
      return {
        status: 200,
        body: {
          documents: await listTursoDocuments(
            collection,
            parentPath,
            parseFilters(body.filters),
            parseOrder(body.order),
            maxRows,
            afterId
          ),
        },
      };
    }
    if (action === 'clear') {
      return { status: 200, body: { deletedCount: await clearTursoCollection(collection) } };
    }
    throw new Error(`Unsupported database action: ${action}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Turso database request failed.';
    console.error('[Turso API] Database operation failed:', error);
    const clientError =
      message.startsWith('Invalid ') ||
      message.startsWith('Unsupported ') ||
      message.includes(' is required.') ||
      message.startsWith('A Turso write batch');
    return {
      status: clientError ? 400 : 500,
      body: { success: false, error: message },
    };
  }
}

export function createTursoRouter(): Router {
  const router = Router();
  router.post('/', async (req: Request, res: Response) => {
    try {
      await authorizeDatabaseAction(req.body, req.header('authorization'));
    } catch (error) {
      const status = error instanceof AdminAuthenticationError ? error.statusCode : 401;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Admin authorization failed.',
      });
      return;
    }
    const result = await handleTursoAction(req.body);
    res.status(result.status).json(result.body);
  });
  return router;
}
