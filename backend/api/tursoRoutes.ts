import { Router, Request, Response } from 'express';
import { notifyForVerifiedSubmission } from '../services/submissionAlerts.js';
import {
  checkTursoConnection,
  clearTursoCollection,
  ensureCustomerCode,
  getTursoDocument,
  nextCareerApplicationReference,
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
import { normaliseSriLankaPhone, parseNic } from '../../src/utils/sriLankaIdentity.js';

export interface DatabaseAccess {
  role: 'admin' | 'customer' | 'public';
  identity?: FirebaseIdentity;
}

function sanitizePublicSettingsValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizePublicSettingsValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !PRIVATE_PUBLIC_SETTINGS_FIELDS.has(key))
      .map(([key, nestedValue]) => [key, sanitizePublicSettingsValue(nestedValue)])
  );
}

export function sanitizePublicSettingsDocument(document: TursoDocument): TursoDocument {
  return {
    ...document,
    data: sanitizePublicSettingsValue(document.data) as Record<string, unknown>,
  };
}

function sanitizePublicMediaDeletionRegistryDocument(document: TursoDocument): TursoDocument {
  const deletedIds = Array.isArray(document.data.deletedIds)
    ? document.data.deletedIds.filter((value): value is string => typeof value === 'string')
    : [];
  const deletedUrls = Array.isArray(document.data.deletedUrls)
    ? document.data.deletedUrls.filter((value): value is string => typeof value === 'string')
    : [];

  return {
    ...document,
    data: { deletedIds, deletedUrls },
  };
}

const PUBLIC_IMAGE_COLLECTIONS = new Set(['gallery', 'media_assets', 'portfolio', 'products', 'services']);
const INLINE_IMAGE_FIELDS = ['imageUrl', 'url', 'mediaUrl', 'thumbnailUrl', 'image'];

export function compactPublicImageDocument(collection: string, document: TursoDocument): TursoDocument {
  if (!PUBLIC_IMAGE_COLLECTIONS.has(collection)) return document;

  const data = { ...document.data };
  const inlineImage = (value: unknown): value is string =>
    typeof value === 'string' && value.startsWith('data:image/');
  const imageArray = Array.isArray(data.images) ? data.images.filter((value) => typeof value === 'string') as string[] : null;
  const preferImageUrl = ['portfolio', 'products', 'services'].includes(collection);
  const preferredField = preferImageUrl ? 'imageUrl' : 'url';
  const imageFields = collection === 'gallery'
    ? ['url', 'mediaUrl', 'thumbnailUrl', 'imageUrl', 'image']
    : preferImageUrl
      ? ['imageUrl', 'url', 'mediaUrl', 'thumbnailUrl', 'image']
      : ['url', 'mediaUrl', 'thumbnailUrl', 'imageUrl', 'image'];
  const explicitPreferredValue = inlineImage(data[preferredField])
    ? data[preferredField] as string
    : undefined;
  const fallbackField = imageFields.find((field) => inlineImage(data[field]));
  const fallbackValue = fallbackField ? data[fallbackField] as string : undefined;
  const imageSources = imageArray?.length
    ? [...new Set(imageArray)]
    : explicitPreferredValue
      ? [explicitPreferredValue]
      : fallbackValue
        ? [fallbackValue]
        : [];
  const retainedField = imageArray?.length
    ? preferImageUrl && explicitPreferredValue
      ? preferredField
      : undefined
    : explicitPreferredValue
      ? preferredField
      : fallbackField;

  if (imageArray?.length) {
    const uniqueImages = [...new Set(imageArray)];
    data.images = preferImageUrl && explicitPreferredValue
      ? uniqueImages.filter((image) => image !== explicitPreferredValue)
      : uniqueImages;
  }
  for (const field of INLINE_IMAGE_FIELDS) {
    const value = data[field];
    if (
      inlineImage(value) &&
      imageSources.includes(value) &&
      !(preferImageUrl && explicitPreferredValue && field === preferredField) &&
      field !== retainedField
    ) {
      delete data[field];
    }
  }

  return { ...document, data };
}

const PUBLIC_READ_COLLECTIONS = new Set([
  'announcements',
  'banners',
  'categories',
  'careerOpenings',
  // Published legal text (privacy, terms, refunds...) shown on public pages.
  'legalPages',
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
const MAX_PUBLIC_READ_BATCH_SIZE = 8;
const MAX_PUBLIC_LIST_ROWS = 1000;
const MAX_PUBLIC_READ_BATCH_RESPONSE_BYTES = 3_500_000;
const CUSTOMER_OWNED_COLLECTIONS = new Set(['users', 'orders', 'bookings', 'payments']);
const ADMIN_ONLY_READ_COLLECTIONS = new Set([
  'analyticsEvents',
  'careerApplications',
  'contactSubmissions',
  'inquiries',
  'quoteRequests',
]);
const PUBLIC_CREATE_COLLECTIONS = new Set([
  'analyticsEvents',
  'careerApplications',
  'contactSubmissions',
  'inquiries',
  'orders',
  'bookings',
  'quoteRequests',
]);
const analyticsWriteAttempts = new Map<string, { count: number; resetAt: number }>();
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
  // Set once at registration; date of birth and gender are derived from it on the server.
  'nic',
  'dateOfBirth',
  'gender',
]);
const MAX_PROFILE_NAME_LENGTH = 100;
const PRIVATE_PUBLIC_SETTINGS_FIELDS = new Set([
  'superAdminEmail',
  'superAdminName',
  'testTimestamp',
  'testWrite',
  'dailyBackupEnabled',
  'enableStockAlertEmails',
]);

const ADMIN_MANAGED_COLLECTIONS = new Set([
  'admins',
  'announcements',
  'auditLogs',
  'banners',
  'blog',
  'careerApplications',
  'careerOpenings',
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
  if (
    collection === 'careerApplications' &&
    item.type === 'set' &&
    item.merge !== true
  ) return false;
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
  if (body.action === 'multiRead') {
    if (
      !Array.isArray(body.requests) ||
      body.requests.length === 0 ||
      body.requests.length > MAX_PUBLIC_READ_BATCH_SIZE ||
      body.requests.some((request) => {
        if (!request || typeof request !== 'object' || Array.isArray(request)) return true;
        const read = request as Record<string, unknown>;
        return (
          (read.action !== 'get' && read.action !== 'list') ||
          typeof read.collection !== 'string' ||
          !PUBLIC_READ_COLLECTIONS.has(read.collection)
        );
      })
    ) {
      throw new AdminSessionAuthError('Invalid public read batch.', 400);
    }
    return { role: 'public' };
  }

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
  const isPublicMediaDirectoryRead =
    body.action === 'list' &&
    collection === 'media_blobs' &&
    (!body.parentPath || body.parentPath === '');
  const isPublicMediaDeletionRegistryRead =
    body.action === 'get' &&
    collection === 'system_metadata' &&
    body.id === 'deleted_media' &&
    (!body.parentPath || body.parentPath === '');
  const isPrivilegedAction =
    requiresAdminForDatabaseAction(input) ||
    body.action === 'clear' ||
    body.action === 'batch' ||
    isPublicMediaDirectoryRead ||
    (collection === 'system_metadata' && !isPublicMediaDeletionRegistryRead) ||
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
  if (
    isRead &&
    (
      [...collections].every((name) => PUBLIC_READ_COLLECTIONS.has(name)) ||
      isPublicMediaDeletionRegistryRead
    )
  ) {
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

/**
 * Checks the identity fields of a customer's own profile write and returns the
 * values to store. The NIC can be set once and never changed by the customer,
 * belongs to one account only, and is the only source of date of birth and
 * gender (values sent by the browser are ignored). Phone numbers are stored as +94….
 */
async function verifyCustomerIdentityFields(
  data: Record<string, unknown>,
  identity: FirebaseIdentity,
  existing: TursoDocument | null,
): Promise<Record<string, unknown>> {
  const verified: Record<string, unknown> = {};

  if (data.name !== undefined) {
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    if (!name || name.length > MAX_PROFILE_NAME_LENGTH) throw new Error('Enter your full name (up to 100 characters).');
    verified.name = name;
  }
  if (data.phone !== undefined && data.phone !== '') {
    const phone = typeof data.phone === 'string' ? normaliseSriLankaPhone(data.phone) : null;
    if (!phone) throw new Error('Enter a valid Sri Lankan contact number.');
    verified.phone = phone;
  }

  // Saves that do not touch identity fields need no extra read: the merge leaves the
  // stored NIC, date of birth and gender as they are.
  if (data.nic === undefined && data.dateOfBirth === undefined && data.gender === undefined) return verified;

  const storedNic = typeof existing?.data.nic === 'string' ? existing.data.nic : '';
  if (data.nic === undefined || data.nic === storedNic) {
    // Keep the stored identity: date of birth and gender cannot be edited on their own.
    if (storedNic) {
      verified.dateOfBirth = existing?.data.dateOfBirth;
      verified.gender = existing?.data.gender;
    } else {
      verified.dateOfBirth = null;
      verified.gender = null;
    }
    return verified;
  }

  if (storedNic) {
    throw new AdminSessionAuthError('Your NIC number cannot be changed. Please contact us if it is wrong.', 403);
  }
  const nic = typeof data.nic === 'string' ? parseNic(data.nic) : null;
  if (!nic) throw new Error('Enter a valid NIC number (e.g. 951234567V or 199512345678).');
  const holders = await listTursoDocuments('users', '', [{ field: 'nic', operator: '==', value: nic.nic }], undefined, 2);
  if (holders.some((holder) => holder.id !== identity.uid)) {
    throw new Error('This NIC number is already registered to another account. Please sign in or contact us.');
  }
  return { ...verified, nic: nic.nic, dateOfBirth: nic.dateOfBirth, gender: nic.gender };
}

const MAX_PROFILE_TEXT_LENGTH = 200;
const MAX_AVATAR_URL_LENGTH = 2048;
const CUSTOMER_PREFERENCE_FLAGS = ['orderNotifications', 'promotionalUpdates', 'smsAlerts', 'twoFactorEnabled'];
const CUSTOMER_CONTACT_METHODS = new Set(['whatsapp', 'email', 'phone']);

function profileText(value: unknown, label: string, maxLength = MAX_PROFILE_TEXT_LENGTH): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new Error(`${label} must be text of up to ${maxLength} characters.`);
  }
  return value.trim();
}

/**
 * Checks the free-form fields of a customer's own profile write (photo, company,
 * address, preferences) and returns the cleaned values. Photos must be https or
 * this site's own paths; a photo already on the profile is accepted unchanged.
 */
function verifyCustomerProfileFields(
  data: Record<string, unknown>,
  existing: TursoDocument | null,
): Record<string, unknown> {
  const verified: Record<string, unknown> = {};

  for (const field of ['avatarUrl', 'photoURL', 'photoUrl'] as const) {
    if (data[field] === undefined) continue;
    const url = profileText(data[field], 'Profile photo address', MAX_AVATAR_URL_LENGTH);
    const unchanged = url === existing?.data[field];
    const allowed = !url || /^https:\/\/[^\s"'<>]+$/i.test(url) || /^\/(?!\/)[^\s"'<>]*$/.test(url);
    if (!unchanged && !allowed) throw new Error('The profile photo must be an uploaded image.');
    verified[field] = url;
  }
  if (data.displayName !== undefined) verified.displayName = profileText(data.displayName, 'Display name', MAX_PROFILE_NAME_LENGTH);
  if (data.company !== undefined) verified.company = profileText(data.company, 'Company name', 120);
  if (data.accountType !== undefined) {
    if (data.accountType !== 'individual' && data.accountType !== 'corporate') throw new Error('Choose a valid account type.');
    verified.accountType = data.accountType;
  }
  if (data.address !== undefined) {
    if (!data.address || typeof data.address !== 'object' || Array.isArray(data.address)) throw new Error('The address is not valid.');
    const address = data.address as Record<string, unknown>;
    verified.address = {
      street: profileText(address.street, 'Street address'),
      city: profileText(address.city, 'City', 100),
      postalCode: profileText(address.postalCode, 'Postal code', 20),
      country: profileText(address.country, 'Country', 60) || 'Sri Lanka',
      ...(address.apartment !== undefined ? { apartment: profileText(address.apartment, 'Apartment', 100) } : {}),
      ...(address.state !== undefined ? { state: profileText(address.state, 'Province', 60) } : {}),
    };
  }
  if (data.preferences !== undefined) {
    if (!data.preferences || typeof data.preferences !== 'object' || Array.isArray(data.preferences)) {
      throw new Error('The preferences are not valid.');
    }
    const preferences = data.preferences as Record<string, unknown>;
    const cleaned: Record<string, unknown> = { currency: 'LKR' };
    for (const flag of CUSTOMER_PREFERENCE_FLAGS) {
      if (preferences[flag] !== undefined) cleaned[flag] = preferences[flag] === true;
    }
    if (typeof preferences.preferredContactMethod === 'string' && CUSTOMER_CONTACT_METHODS.has(preferences.preferredContactMethod)) {
      cleaned.preferredContactMethod = preferences.preferredContactMethod;
    }
    verified.preferences = cleaned;
  }
  return verified;
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
    const existing = await getTursoDocument('users', '', identity.uid);
    // A suspended account cannot edit (or reactivate) itself.
    if (existing && existing.data.status === 'suspended') {
      throw new AdminSessionAuthError('This account is suspended. Please contact us.', 403);
    }
    // Role, status and creation date are server-owned: whatever the browser sends is dropped.
    const { role: _role, status: _status, createdAt: _createdAt, ...customerData } = write.data;
    const now = new Date().toISOString();
    const data = {
      ...customerData,
      ...verifyCustomerProfileFields(customerData, existing),
      ...(await verifyCustomerIdentityFields(customerData, identity, existing)),
      uid: identity.uid,
      ...(identity.email ? { email: identity.email } : {}),
      role: 'customer',
      ...(existing ? {} : { status: 'active', createdAt: now }),
      updatedAt: now,
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

interface OrderPricingVerification {
  verified: boolean;
  verifiedSubtotal: number;
  clientSubtotal: number | null;
  mismatches: Array<{ productId: string; reason: string; clientUnitPrice?: number; catalogueUnitPrice?: number }>;
  checkedAt: string;
}

async function verifyOrderPricing(data: Record<string, unknown>): Promise<OrderPricingVerification> {
  const items = Array.isArray(data.items) ? data.items.slice(0, 200) : [];
  const mismatches: OrderPricingVerification['mismatches'] = [];
  let verifiedSubtotal = 0;
  const productCache = new Map<string, Record<string, unknown> | null>();

  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const item = rawItem as Record<string, unknown>;
    const productId = typeof item.productId === 'string' ? item.productId : '';
    const quantity = Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      mismatches.push({ productId, reason: 'invalid product or quantity' });
      continue;
    }
    if (!productCache.has(productId)) {
      productCache.set(productId, (await getTursoDocument('products', '', productId))?.data ?? null);
    }
    const product = productCache.get(productId);
    if (!product) {
      mismatches.push({ productId, reason: 'product not found' });
      continue;
    }
    const variantId = item.selectedVariant && typeof item.selectedVariant === 'object'
      ? (item.selectedVariant as Record<string, unknown>).id
      : undefined;
    const variant = variantId && Array.isArray(product.variants)
      ? (product.variants as Array<Record<string, unknown>>).find((candidate) => candidate?.id === variantId)
      : undefined;
    const catalogueUnitPrice = Number(variant?.price ?? product.price);
    if (!Number.isFinite(catalogueUnitPrice)) {
      mismatches.push({ productId, reason: 'catalogue price unavailable' });
      continue;
    }
    verifiedSubtotal += catalogueUnitPrice * quantity;
    const clientUnitPrice = Number(item.unitPrice ?? item.price);
    if (!Number.isFinite(clientUnitPrice) || Math.abs(clientUnitPrice - catalogueUnitPrice) > 0.005) {
      mismatches.push({ productId, reason: 'unit price differs from catalogue', clientUnitPrice, catalogueUnitPrice });
    }
  }

  const clientSubtotal = Number.isFinite(Number(data.subtotal)) ? Number(data.subtotal) : null;
  if (clientSubtotal !== null && Math.abs(clientSubtotal - verifiedSubtotal) > 0.005) {
    mismatches.push({ productId: '', reason: 'subtotal differs from catalogue total' });
  }
  return {
    verified: mismatches.length === 0,
    verifiedSubtotal: Math.round(verifiedSubtotal * 100) / 100,
    clientSubtotal,
    mismatches: mismatches.slice(0, 50),
    checkedAt: new Date().toISOString(),
  };
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
  if (write.collection === 'analyticsEvents') {
    const data = write.data;
    const allowedEventTypes = new Set([
      'page_view',
      'division_view',
      'product_view',
      'service_view',
      'add_to_cart',
      'remove_from_cart',
      'checkout_started',
      'purchase_completed',
      'booking_started',
      'booking_completed',
      'contact_submitted',
      'quote_requested',
      'search_performed',
      'download_brochure',
      'custom',
    ]);
    const path = typeof data.path === 'string' ? data.path : '';
    const sessionId = typeof data.sessionId === 'string' ? data.sessionId : '';
    if (
      !/^[a-zA-Z0-9_-]{8,80}$/.test(write.id) ||
      !allowedEventTypes.has(String(data.type)) ||
      !path.startsWith('/') ||
      path.length > 300 ||
      path.includes('?') ||
      path.includes('#') ||
      !/^[a-zA-Z0-9_-]{8,80}$/.test(sessionId)
    ) {
      throw new Error('Analytics event data is invalid.');
    }
    const nowMs = Date.now();
    for (const [key, attempt] of analyticsWriteAttempts) {
      if (attempt.resetAt <= nowMs) analyticsWriteAttempts.delete(key);
    }
    const attempt = analyticsWriteAttempts.get(sessionId);
    if (attempt && attempt.count >= 120) {
      throw new Error('Analytics event rate limit exceeded.');
    }
    analyticsWriteAttempts.set(sessionId, attempt
      ? { ...attempt, count: attempt.count + 1 }
      : { count: 1, resetAt: nowMs + 60_000 });
    const now = new Date(nowMs).toISOString();
    const title = typeof data.title === 'string' ? data.title.slice(0, 160) : '';
    const divisionId = typeof data.divisionId === 'string' && /^[a-z0-9_-]{1,40}$/i.test(data.divisionId)
      ? data.divisionId
      : undefined;
    const metadata = data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? data.metadata as Record<string, unknown>
      : {};
    const referrerHost = typeof metadata.referrerHost === 'string' &&
      /^[a-z0-9.-]{1,253}$/i.test(metadata.referrerHost)
      ? metadata.referrerHost
      : 'Direct';
    const deviceType = ['mobile', 'tablet', 'desktop'].includes(String(metadata.deviceType))
      ? String(metadata.deviceType)
      : 'unknown';
    const campaignMetadata = Object.fromEntries(
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
        .flatMap((key) => {
          const value = metadata[key];
          return typeof value === 'string' && value.trim()
            ? [[key, value.trim().slice(0, 200)]]
            : [];
        })
    );
    return {
      ...write,
      data: {
        id: write.id,
        type: data.type,
        timestamp: now,
        path,
        title,
        sessionId,
        ...(divisionId ? { divisionId } : {}),
        metadata: { referrerHost, deviceType, ...campaignMetadata },
      },
    };
  }
  if (write.collection === 'careerApplications') {
    const allowedFields = new Set([
      'openingId',
      'candidateName',
      'email',
      'phone',
      'portfolioUrl',
      'coverLetter',
      'cvStoragePath',
      'cvFileName',
    ]);
    const invalidFields = Object.keys(write.data).filter((field) => !allowedFields.has(field));
    if (invalidFields.length) {
      throw new Error(`Unsupported career application fields: ${invalidFields.join(', ')}.`);
    }

    const text = (field: string, maxLength: number, required = true) => {
      const value = write.data?.[field];
      if (!required && value === undefined) return '';
      if (typeof value !== 'string' || (required && !value.trim()) || value.length > maxLength) {
        throw new Error(`Career application ${field} is invalid.`);
      }
      return value.trim();
    };
    const openingId = text('openingId', 100);
    const opening = await getTursoDocument('careerOpenings', '', openingId);
    if (!opening || opening.data.status !== 'published') {
      throw new Error('This career opportunity is no longer accepting applications.');
    }

    const email = text('email', 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Enter a valid email address.');
    }
    const cvStoragePath = text('cvStoragePath', 160);
    if (!/^career-cvs\/[0-9a-f-]{36}_[a-zA-Z0-9._-]{1,100}$/.test(cvStoragePath)) {
      throw new Error('The uploaded CV reference is invalid.');
    }
    const submittedPortfolioUrl = text('portfolioUrl', 2048, false);
    let portfolioUrl = '';
    if (submittedPortfolioUrl) {
      let parsedPortfolioUrl: URL;
      try {
        parsedPortfolioUrl = new URL(submittedPortfolioUrl);
      } catch {
        throw new Error('Career application portfolioUrl is invalid.');
      }
      if (
        !['http:', 'https:'].includes(parsedPortfolioUrl.protocol) ||
        parsedPortfolioUrl.username ||
        parsedPortfolioUrl.password
      ) {
        throw new Error('Career application portfolioUrl is invalid.');
      }
      portfolioUrl = parsedPortfolioUrl.toString();
    }

    const reference = await nextCareerApplicationReference();
    return {
      ...write,
      data: {
        reference,
        openingId,
        candidateName: text('candidateName', 160),
        email: email.toLowerCase(),
        phone: text('phone', 40),
        portfolioUrl,
        coverLetter: text('coverLetter', 5000, false),
        cvStoragePath,
        cvFileName: text('cvFileName', 120),
        status: 'new',
        createdAt: new Date().toISOString(),
      },
    };
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
    // Prices in a public order come from the browser and cannot be trusted.
    // Recalculate each line from the catalogue and flag differences for the
    // admin, who reviews every order before it is confirmed or paid.
    const pricing = write.collection === 'orders' ? await verifyOrderPricing(data) : undefined;
    return {
      ...write,
      data: {
        ...data,
        ...(pricing ? { pricingVerification: pricing } : {}),
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

function parseFilterGroups(value: unknown): TursoFilter[][] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 10) {
    throw new Error('Query filter groups must be an array with no more than 10 alternatives.');
  }
  return value.map((group) => {
    const filters = parseFilters(group);
    if (filters.length === 0 || filters.length > 10) {
      throw new Error('Each query filter group must contain between 1 and 10 filters.');
    }
    return filters;
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
      } else if (
        access.role === 'public' ||
        (write.collection === 'careerApplications' && write.type === 'set' && !write.merge)
      ) {
        write = await preparePublicWrite(write);
      }
      await writeTursoDocument(write);
      // A customer's own profile write returns the identity read from their NIC, so the
      // browser does not need a second request to show date of birth and gender.
      const savedNic = access.role === 'customer' && write.collection === 'users' && typeof write.data?.nic === 'string'
        ? { nic: write.data.nic, dateOfBirth: write.data.dateOfBirth ?? null, gender: write.data.gender ?? null }
        : null;
      // A customer's profile gets its readable customer ID ("mahdev-cus-001") on first save.
      const customerCode = access.role === 'customer' && write.collection === 'users'
        ? await ensureCustomerCode(write.id)
        : null;
      return {
        status: 200,
        body: {
          success: true,
          ...(write.collection === 'careerApplications' && typeof write.data?.reference === 'string'
            ? { reference: write.data.reference }
            : {}),
          ...(savedNic ? { identity: savedNic } : {}),
          ...(customerCode ? { customerCode } : {}),
        },
      };
    }
    if (action === 'batch') {
      if (!Array.isArray(body.writes)) throw new Error('Batch writes must be an array.');
      await writeTursoBatch(body.writes.map(parseWrite));
      return { status: 200, body: { success: true } };
    }
    if (action === 'multiRead') {
      if (
        access.role !== 'public' ||
        !Array.isArray(body.requests) ||
        body.requests.length === 0 ||
        body.requests.length > MAX_PUBLIC_READ_BATCH_SIZE
      ) {
        throw new Error('Invalid public read batch.');
      }
      const requests = body.requests as unknown[];
      const results = await Promise.all(requests.map(async (request) => {
        if (!request || typeof request !== 'object' || Array.isArray(request)) {
          return { status: 400, body: { success: false, error: 'Invalid read request.' } };
        }
        const read = request as Record<string, unknown>;
        if (
          (read.action !== 'get' && read.action !== 'list') ||
          typeof read.collection !== 'string' ||
          !PUBLIC_READ_COLLECTIONS.has(read.collection)
        ) {
          return { status: 400, body: { success: false, error: 'Read is not allowed in a public batch.' } };
        }
        return handleTursoAction(read, { role: 'public' });
      }));
      const responseBytes = new TextEncoder().encode(JSON.stringify(results)).byteLength;
      if (responseBytes > MAX_PUBLIC_READ_BATCH_RESPONSE_BYTES) {
        return { status: 200, body: { fallbackToIndividualReads: true } };
      }
      return { status: 200, body: { results } };
    }

    const collection = requiredString(body.collection, 'Collection');
    const parentPath = typeof body.parentPath === 'string' ? body.parentPath : '';
    if (action === 'get') {
      const id = requiredString(body.id, 'Document ID');
      let document = await getTursoDocument(collection, parentPath, id);
      if (
        access.role === 'public' &&
        collection === 'careerOpenings' &&
        document?.data.status !== 'published'
      ) document = null;
      const visibleDocument = document && (
        access.role !== 'customer' ||
        (access.identity && customerOwnsDocument(document, access.identity, collection))
      ) ? document : null;
      // Existing customers get their readable customer ID the next time their profile loads.
      if (access.role === 'customer' && collection === 'users' && visibleDocument && !parentPath &&
        !(typeof visibleDocument.data.customerCode === 'string' && visibleDocument.data.customerCode)) {
        const customerCode = await ensureCustomerCode(visibleDocument.id);
        if (customerCode) visibleDocument.data.customerCode = customerCode;
      }
      const publicDocument = access.role === 'public' && collection === 'settings' && visibleDocument
        ? sanitizePublicSettingsDocument(visibleDocument)
        : access.role === 'public' &&
            collection === 'system_metadata' &&
            id === 'deleted_media' &&
            visibleDocument
          ? sanitizePublicMediaDeletionRegistryDocument(visibleDocument)
        : access.role === 'public' && visibleDocument
          ? compactPublicImageDocument(collection, visibleDocument)
          : visibleDocument;
      return {
        status: 200,
        body: { document: publicDocument },
      };
    }
    if (action === 'list') {
      const maxRows = body.limit === undefined ? undefined : Number(body.limit);
      const afterId = typeof body.afterId === 'string' ? body.afterId : undefined;
      const afterValue = typeof body.afterValue === 'string' || typeof body.afterValue === 'number'
        ? body.afterValue
        : undefined;
      const filters = parseFilters(body.filters);
      const filterGroups = parseFilterGroups(body.filterGroups);
      const order = parseOrder(body.order);
      if (access.role === 'public') {
        // Hidden settings fields are stripped from responses, but filtering or
        // sorting on them would still reveal their values (e.g. comparing
        // superAdminEmail with >= / < one character at a time). Refuse it.
        const touchesHiddenField = (field: string) =>
          collection === 'settings' && field.split('.').some((part) => PRIVATE_PUBLIC_SETTINGS_FIELDS.has(part));
        if (
          [...filters, ...filterGroups.flat()].some((filter) => touchesHiddenField(filter.field)) ||
          (order && touchesHiddenField(order.field))
        ) {
          throw new Error('Invalid query: this field cannot be used to filter or sort.');
        }
      }
      // Public lists are capped so one request cannot pull an unbounded table.
      const effectiveMaxRows = access.role === 'public'
        ? Math.min(maxRows ?? MAX_PUBLIC_LIST_ROWS, MAX_PUBLIC_LIST_ROWS)
        : maxRows;
      if (access.role === 'public' && collection === 'careerOpenings') {
        filters.push({ field: 'status', operator: '==', value: 'published' });
      }
      const documents = await listTursoDocuments(
        collection,
        parentPath,
        filters,
        order,
        effectiveMaxRows,
        afterId,
        access.role === 'customer' ? access.identity : undefined,
        afterValue,
        filterGroups
      );
      return {
        status: 200,
        body: {
          documents: access.role === 'public' && collection === 'settings'
            ? documents.map(sanitizePublicSettingsDocument)
            : access.role === 'public' && PUBLIC_IMAGE_COLLECTIONS.has(collection)
              ? documents.map((document) => compactPublicImageDocument(collection, document))
            : documents,
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
      message.startsWith('Enter ') ||
      message.includes(' is required.') ||
      message.includes(' is invalid.') ||
      message.includes('no longer accepting applications') ||
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
      // Same alert emails as the serverless API, sent after the response.
      if (result.status === 200 && result.body.success === true) {
        void notifyForVerifiedSubmission(req.body, access).catch((error: unknown) => {
          console.error('[Turso API] Verified submission alert failed:', error);
        });
      }
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
