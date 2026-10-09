import { Router, Request, Response } from 'express';
import {
  checkTursoConnection,
  clearTursoCollection,
  getTursoDocument,
  listTursoDocuments,
  TursoDocument,
  TursoFilter,
  TursoOrder,
  TursoWrite,
  writeTursoBatch,
  writeTursoDocument,
} from '../db/tursoDatabase.js';
import {
  AdminSessionAuthError,
  getAdminSessionFromCookie,
} from '../auth/adminCredentialAuth.js';
import {
  FirebaseTokenError,
  type FirebaseIdentity,
  verifyFirebaseIdToken,
} from '../auth/firebaseIdToken.js';

export interface DatabaseAccess {
  role: 'admin' | 'customer' | 'public';
  identity?: FirebaseIdentity;
}

const PUBLIC_READ_COLLECTIONS = new Set([
  'announcements',
  'banners',
  'categories',
  'divisions',
  'faqs',
  'gallery',
  'googleReviews',
  'googleReviewsConfig',
  'heroSections',
  'milestones',
  'media_assets',
  'media_blobs',
  'navigation',
  'packages',
  'pages',
  'portfolio',
  'products',
  'services',
  'settings',
  'team',
  'testimonials',
  'trustedCompanies',
  'websiteContent',
]);
const CUSTOMER_OWNED_COLLECTIONS = new Set(['users', 'orders', 'bookings', 'payments']);
const ADMIN_ONLY_READ_COLLECTIONS = new Set([
  'contactSubmissions',
  'inquiries',
  'quoteRequests',
]);
const PUBLIC_CREATE_COLLECTIONS = new Set([
  'contactSubmissions',
  'inquiries',
  'orders',
  'bookings',
  'quoteRequests',
]);
const CUSTOMER_PROFILE_FIELDS = new Set([
  'uid',
  'email',
  'role',
  'status',
  'createdAt',
  'updatedAt',
  'name',
  'displayName',
  'phone',
  'avatarUrl',
  'photoURL',
  'photoUrl',
  'address',
  'company',
  'accountType',
  'preferences',
]);

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
    if (collection === 'admins' || collection === 'auditLogs' || ADMIN_ONLY_READ_COLLECTIONS.has(collection)) return true;
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
  cookieHeader: string | undefined,
  authorizationHeader?: string
): Promise<DatabaseAccess> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid database request.');
  }
  const body = input as Record<string, unknown>;
  if (body.action === 'health') return { role: 'public' };

  const writes = body.action === 'write'
    ? [body.write]
    : body.action === 'batch' && Array.isArray(body.writes)
      ? body.writes
      : [];
  const collection = typeof body.collection === 'string' ? body.collection.split('/')[0] : '';
  const writeCollections = writes.map((write) => {
    if (!write || typeof write !== 'object') return '';
    const name = (write as Record<string, unknown>).collection;
    return typeof name === 'string' ? name.split('/')[0] : '';
  });
  const collections = new Set([collection, ...writeCollections].filter(Boolean));
  const isPrivilegedAction =
    requiresAdminForDatabaseAction(input) ||
    body.action === 'clear' ||
    body.action === 'batch' ||
    (body.action === 'write' && !(
      writeCollections.length === 1 &&
      (CUSTOMER_OWNED_COLLECTIONS.has(writeCollections[0]) ||
        PUBLIC_CREATE_COLLECTIONS.has(writeCollections[0]))
    ));

  if (cookieHeader) {
    try {
      const { user } = getAdminSessionFromCookie(cookieHeader);
      if (requiresSuperAdminForDatabaseAction(input) && user.role !== 'super_admin') {
        throw new AdminSessionAuthError('Super administrator access is required for this action.', 403);
      }
      return { role: 'admin' };
    } catch (error) {
      if (error instanceof AdminSessionAuthError && error.statusCode === 403) throw error;
      if (isPrivilegedAction) {
        throw new AdminSessionAuthError('An administrator session is required.', 401);
      }
    }
  }

  if (isPrivilegedAction) {
    throw new AdminSessionAuthError('An administrator session is required.', 401);
  }

  const isRead = body.action === 'get' || body.action === 'list';
  if (isRead && [...collections].every((name) => PUBLIC_READ_COLLECTIONS.has(name))) {
    return { role: 'public' };
  }

  const isCustomerRead = isRead &&
    [...collections].every((name) => CUSTOMER_OWNED_COLLECTIONS.has(name));
  const isCustomerWrite = body.action === 'write' &&
    writeCollections.length === 1 &&
    CUSTOMER_OWNED_COLLECTIONS.has(writeCollections[0]);
  const requiresCustomerToken = isCustomerRead || (
    isCustomerWrite &&
    (!PUBLIC_CREATE_COLLECTIONS.has(writeCollections[0]) || Boolean(authorizationHeader))
  );
  if (requiresCustomerToken) {
    return {
      role: 'customer',
      identity: await verifyFirebaseIdToken(authorizationHeader),
    };
  }

  const isPublicCreate = body.action === 'write' &&
    writeCollections.length === 1 &&
    PUBLIC_CREATE_COLLECTIONS.has(writeCollections[0]) &&
    body.write !== null && typeof body.write === 'object' &&
    (body.write as Record<string, unknown>).type === 'set' &&
    (body.write as Record<string, unknown>).merge !== true;
  if (isPublicCreate) return { role: 'public' };

  throw new AdminSessionAuthError('This database action is not available to this account.', 403);
}

function customerOwnsDocument(document: TursoDocument, identity: FirebaseIdentity, collection: string): boolean {
  if (collection === 'users') {
    return document.id === identity.uid ||
      document.data.uid === identity.uid ||
      Boolean(identity.email && typeof document.data.email === 'string' &&
        document.data.email.toLowerCase() === identity.email);
  }
  return document.data.customerId === identity.uid ||
    document.data.userId === identity.uid ||
    document.data.uid === identity.uid ||
    Boolean(identity.email && [
      document.data.customerEmail,
      document.data.email,
      (document.data.customer as Record<string, unknown> | undefined)?.email,
    ]
      .some((email) => typeof email === 'string' && email.toLowerCase() === identity.email));
}

async function prepareCustomerWrite(write: TursoWrite, identity: FirebaseIdentity): Promise<TursoWrite> {
  if (write.parentPath) {
    throw new AdminSessionAuthError('Customer writes must target their own top-level record.', 403);
  }
  if (write.collection === 'users') {
    if (write.id !== identity.uid || write.type === 'delete' || !write.data) {
      throw new AdminSessionAuthError('Customers may only update their own profile.', 403);
    }
    const unsupportedFields = Object.keys(write.data).filter((field) => !CUSTOMER_PROFILE_FIELDS.has(field));
    if (unsupportedFields.length) {
      throw new Error(`Customer profile fields cannot be changed: ${unsupportedFields.join(', ')}.`);
    }
    const data = {
      ...write.data,
      uid: identity.uid,
      ...(identity.email ? { email: identity.email } : {}),
      role: 'customer',
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    return { ...write, type: 'set', merge: true, data };
  }

  if (!['orders', 'bookings'].includes(write.collection) ||
    write.type !== 'set' || write.merge || !write.data) {
    throw new AdminSessionAuthError('Customer order and booking records can only be created.', 403);
  }
  if (await getTursoDocument(write.collection, '', write.id)) {
    throw new Error(`The ${write.collection.slice(0, -1)} already exists.`);
  }
  const data = {
    ...write.data,
    customerId: identity.uid,
    userId: identity.uid,
    uid: identity.uid,
    ...(identity.email ? { customerEmail: identity.email, email: identity.email } : {}),
    ...(write.collection === 'orders'
      ? { paymentStatus: 'unpaid', status: 'pending_payment', orderStatus: 'pending_payment' }
      : { paymentStatus: 'unpaid', status: 'pending' }),
  };
  return { ...write, data };
}

async function preparePublicWrite(write: TursoWrite): Promise<TursoWrite> {
  if (
    write.type !== 'set' ||
    write.merge ||
    write.parentPath ||
    !PUBLIC_CREATE_COLLECTIONS.has(write.collection) ||
    !write.data
  ) {
    throw new AdminSessionAuthError('Public access is limited to new submissions.', 403);
  }
  if (await getTursoDocument(write.collection, '', write.id)) {
    throw new Error('A record with this ID already exists.');
  }
  if (write.collection === 'orders' || write.collection === 'bookings') {
    const {
      uid: _uid,
      userId: _userId,
      customerId: _customerId,
      email: _email,
      customerEmail: _customerEmail,
      paymentStatus: _paymentStatus,
      status: _status,
      orderStatus: _orderStatus,
      customer: rawCustomer,
      ...data
    } = write.data;
    const customer = rawCustomer && typeof rawCustomer === 'object' && !Array.isArray(rawCustomer)
      ? Object.fromEntries(
          Object.entries(rawCustomer as Record<string, unknown>)
            .filter(([field]) => field !== 'email' && field !== 'customerEmail')
        )
      : rawCustomer;
    return {
      ...write,
      data: {
        ...data,
        ...(customer === undefined ? {} : { customer }),
        ...(write.collection === 'orders'
          ? { paymentStatus: 'unpaid', status: 'pending_payment', orderStatus: 'pending_payment' }
          : { paymentStatus: 'unpaid', status: 'pending' }),
      },
    };
  }
  return write;
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

export async function handleTursoAction(
  input: unknown,
  access: DatabaseAccess = { role: 'admin' }
): Promise<{
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
      let write = parseWrite(body.write);
      if (access.role === 'customer' && access.identity) {
        write = await prepareCustomerWrite(write, access.identity);
      } else if (access.role === 'public') {
        write = await preparePublicWrite(write);
      }
      await writeTursoDocument(write);
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
      const document = await getTursoDocument(collection, parentPath, id);
      const visibleDocument = document && (
        access.role !== 'customer' ||
        (access.identity && customerOwnsDocument(document, access.identity, collection))
      ) ? document : null;
      return {
        status: 200,
        body: { document: visibleDocument },
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
            afterId,
            access.role === 'customer' ? access.identity : undefined
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
    if (error instanceof AdminSessionAuthError || error instanceof FirebaseTokenError) {
      return { status: error.statusCode, body: { success: false, error: message } };
    }
    const clientError =
      message.startsWith('Invalid ') ||
      message.startsWith('Unsupported ') ||
      message.includes(' is required.') ||
      message.startsWith('A Turso write batch') ||
      message.includes('cannot be changed:') ||
      message.endsWith('already exists.');
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
      const access = await authorizeDatabaseAction(
        req.body,
        req.header('cookie'),
        req.header('authorization')
      );
      const result = await handleTursoAction(req.body, access);
      res.status(result.status).json(result.body);
    } catch (error) {
      const status = error instanceof AdminSessionAuthError || error instanceof FirebaseTokenError
        ? error.statusCode
        : 403;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Admin authorization failed.',
      });
    }
  });
  return router;
}
