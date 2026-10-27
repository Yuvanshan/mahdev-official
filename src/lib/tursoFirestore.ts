import { getAuth } from 'firebase/auth';
import { isBrowserOnAdminPortal } from '../config/adminRoutes';
import {
  canEvaluateFilters,
  filterSnapshotDocuments,
  querySnapshotDocuments,
  whereAnyToFilterGroups,
  type SnapshotFilter,
  type SnapshotOrder,
} from './publicSnapshotQuery';

export type DocumentData = Record<string, any>;
export type Unsubscribe = () => void;

export interface TursoDatabase {
  readonly type: 'turso';
}

export interface DocumentReference {
  readonly kind: 'document';
  readonly collection: string;
  readonly parentPath: string;
  readonly id: string;
  readonly path: string;
}

export interface CollectionReference {
  readonly kind: 'collection';
  readonly collection: string;
  readonly parentPath: string;
  readonly path: string;
}

export interface DocumentSnapshot<T extends DocumentData = DocumentData> {
  readonly id: string;
  readonly ref: DocumentReference;
  exists(): boolean;
  data(): T | undefined;
}

export interface QueryConstraint {
  readonly type: 'where' | 'whereAny' | 'orderBy' | 'limit' | 'startAfter';
  readonly field?: string;
  readonly operator?: string;
  readonly value?: unknown;
  readonly direction?: 'asc' | 'desc';
}

export interface QuerySnapshot<T extends DocumentData = DocumentData> {
  readonly docs: DocumentSnapshot<T>[];
  readonly size: number;
  readonly empty: boolean;
  forEach(callback: (snapshot: DocumentSnapshot<T>) => void): void;
}

interface QueryReference {
  readonly kind: 'query';
  readonly collection: string;
  readonly parentPath: string;
  readonly constraints: QueryConstraint[];
}

interface ApiDocument {
  id: string;
  data: DocumentData;
}

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  document?: ApiDocument | null;
  documents?: ApiDocument[];
  deletedCount?: number;
  reference?: string;
}

export interface WriteBatch {
  set(reference: DocumentReference, data: DocumentData, options?: { merge?: boolean }): WriteBatch;
  update(reference: DocumentReference, data: DocumentData): WriteBatch;
  delete(reference: DocumentReference): WriteBatch;
  commit(): Promise<void>;
}

export class TursoApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'TursoApiError';
  }
}

const database: TursoDatabase = { type: 'turso' };
const DATABASE_REQUEST_TIMEOUT_MS = 12000;
// Admin portal reads return whole collections (incl. drafts), which can take longer.
const ADMIN_DATABASE_REQUEST_TIMEOUT_MS = 60000;

function getRequestTimeoutMs(): number {
  return isBrowserOnAdminPortal() ? ADMIN_DATABASE_REQUEST_TIMEOUT_MS : DATABASE_REQUEST_TIMEOUT_MS;
}
const inFlightReads = new Map<string, Promise<ApiResponse<unknown>>>();
const MAX_PUBLIC_READ_BATCH_SIZE = 8;
const PUBLIC_READ_BATCHABLE_COLLECTIONS = new Set([
  'announcements',
  'banners',
  'categories',
  'careerOpenings',
  'divisions',
  'faqs',
  'gallery',
  'googleReviews',
  'googleReviewsConfig',
  'heroSections',
  'milestones',
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

// ---------------------------------------------------------------------------
// Public snapshot: one CDN-cached GET (/api/public/snapshot) holding every
// public collection. Simple public reads (no filters or cursors) are answered
// from it, so a page load needs one request instead of one per collection.
// Fetched at most once per page session; no polling. Anything it cannot
// answer, or any failure, falls through to the normal batched reads below.
// ---------------------------------------------------------------------------
const PUBLIC_SNAPSHOT_TIMEOUT_MS = 15000;

interface PublicSnapshotPayload {
  version: string;
  collections: Record<string, ApiDocument[]>;
  documents: Record<string, ApiDocument | null>;
  omitted: string[];
}

let publicSnapshotPromise: Promise<PublicSnapshotPayload | null> | null = null;

function loadPublicSnapshot(): Promise<PublicSnapshotPayload | null> {
  if (publicSnapshotPromise) return publicSnapshotPromise;
  publicSnapshotPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_SNAPSHOT_TIMEOUT_MS);
    try {
      const response = await fetch('/api/public/snapshot', { credentials: 'same-origin', signal: controller.signal });
      if (!response.ok) return null;
      const snapshot = await response.json() as PublicSnapshotPayload;
      return snapshot && snapshot.collections && typeof snapshot.collections === 'object' ? snapshot : null;
    } catch (error) {
      console.warn('[TursoFirestore] Public snapshot unavailable; using standard reads.', error);
      return null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  })();
  return publicSnapshotPromise;
}

function isSnapshotEligible(action: string, payload: Record<string, unknown>): boolean {
  if (action !== 'get' && action !== 'list') return false;
  if (typeof payload.collection !== 'string' || payload.collection.includes('/')) return false;
  if (payload.parentPath) return false;
  if (isBrowserOnAdminPortal()) return false; // admin needs live, admin-visible data
  if (action === 'list') {
    // Cursors (pagination) always go to the server; simple == / in filters are evaluated locally.
    if (payload.afterId !== undefined || payload.afterValue !== undefined) return false;
    const filters = Array.isArray(payload.filters) ? payload.filters as SnapshotFilter[] : [];
    const groups = Array.isArray(payload.filterGroups) ? payload.filterGroups as SnapshotFilter[][] : [];
    if (!canEvaluateFilters(filters, groups)) return false;
  }
  return true;
}

async function readFromPublicSnapshot(
  action: string,
  payload: Record<string, unknown>
): Promise<ApiResponse<unknown> | null> {
  const snapshot = await loadPublicSnapshot();
  if (!snapshot) return null;
  const collection = payload.collection as string;

  if (action === 'get') {
    const key = `${collection}/${String(payload.id)}`;
    if (key in snapshot.documents) {
      const document = snapshot.documents[key];
      return { document: document ? structuredClone(document) : null };
    }
    const documents = snapshot.collections[collection];
    if (!documents) return null;
    const match = documents.find((document) => document.id === payload.id);
    return { document: match ? structuredClone(match) : null };
  }

  const documents = snapshot.collections[collection];
  if (!documents) return null;
  return {
    documents: structuredClone(querySnapshotDocuments(
      filterSnapshotDocuments(
        documents,
        Array.isArray(payload.filters) ? payload.filters as SnapshotFilter[] : [],
        Array.isArray(payload.filterGroups) ? payload.filterGroups as SnapshotFilter[][] : []
      ),
      payload.order as SnapshotOrder | undefined,
      typeof payload.limit === 'number' ? payload.limit : undefined
    )),
  };
}

interface PendingPublicRead {
  action: 'get' | 'list';
  payload: Record<string, unknown>;
  resolve: (response: ApiResponse<unknown>) => void;
  reject: (error: Error) => void;
}

let pendingPublicReads: PendingPublicRead[] = [];
let publicReadBatchTimer: number | null = null;

function normalizeSegments(segments: string[]): string[] {
  if (!segments.length || segments.some((segment) => !segment || segment.includes('/'))) {
    throw new Error('Invalid Turso collection or document path.');
  }
  return segments;
}

function collectionReference(segments: string[]): CollectionReference {
  normalizeSegments(segments);
  if (segments.length % 2 === 0) {
    throw new Error('Collection paths must contain an odd number of segments.');
  }
  const collection = segments.filter((_, index) => index % 2 === 0).join('/');
  const parentPath = segments.slice(0, -1).join('/');
  return {
    kind: 'collection',
    collection,
    parentPath,
    path: segments.join('/'),
  };
}

function documentReference(segments: string[]): DocumentReference {
  normalizeSegments(segments);
  if (segments.length % 2 !== 0) {
    throw new Error('Document paths must contain an even number of segments.');
  }
  const collectionSegments = segments.filter((_, index) => index % 2 === 0);
  const collection = collectionSegments.join('/');
  const parentPath = segments.length > 2 ? segments.slice(0, -2).join('/') : '';
  const id = segments[segments.length - 1];
  return {
    kind: 'document',
    collection,
    parentPath,
    id,
    path: segments.join('/'),
  };
}

export function doc(_database: TursoDatabase, ...segments: Array<string | CollectionReference | DocumentReference>): DocumentReference {
  if (segments[0] && typeof segments[0] === 'object') {
    const reference = segments[0];
    if (reference.kind === 'collection') {
      return documentReference([...reference.path.split('/'), String(segments[1] || '')]);
    }
    return documentReference([...reference.path.split('/'), ...segments.slice(1).map(String)]);
  }
  return documentReference(segments.map(String));
}

export function collection(
  _database: TursoDatabase | CollectionReference | DocumentReference,
  ...segments: Array<string | CollectionReference | DocumentReference>
): CollectionReference {
  if ('kind' in _database && _database.kind === 'document') {
    return collectionReference([..._database.path.split('/'), ...segments.map(String)]);
  }
  if ('kind' in _database && _database.kind === 'collection') {
    return collectionReference([..._database.path.split('/'), ...segments.map(String)]);
  }
  return collectionReference(segments.map(String));
}

export function query(
  reference: CollectionReference | QueryReference,
  ...constraints: QueryConstraint[]
): QueryReference {
  return {
    kind: 'query',
    collection: reference.collection,
    parentPath: reference.parentPath,
    constraints: [...('constraints' in reference ? reference.constraints : []), ...constraints],
  };
}

export function where(field: string, operator: string, value: unknown): QueryConstraint {
  return { type: 'where', field, operator, value };
}

export function whereAny(
  conditions: Array<{ field: string; operator: string; value: unknown }>
): QueryConstraint {
  return { type: 'whereAny', value: conditions };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, direction };
}

export function limit(value: number): QueryConstraint {
  return { type: 'limit', value };
}

export function startAfter(snapshot: DocumentSnapshot | string): QueryConstraint {
  return {
    type: 'startAfter',
    value: typeof snapshot === 'string'
      ? { id: snapshot }
      : { id: snapshot.id, data: snapshot.data() },
  };
}

function isDocumentReference(value: unknown): value is DocumentReference {
  return Boolean(value && typeof value === 'object' && (value as DocumentReference).kind === 'document');
}

function asQuery(reference: CollectionReference | QueryReference): QueryReference {
  return reference.kind === 'query' ? reference : query(reference);
}

async function request<T>(
  action: string,
  payload: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const isRead = action === 'get' || action === 'list';
  const readKey = isRead
    ? JSON.stringify([getAuth().currentUser?.uid || 'anonymous', action, payload])
    : '';
  const pendingRead = readKey ? inFlightReads.get(readKey) : undefined;
  if (pendingRead) return pendingRead as Promise<ApiResponse<T>>;

  if (isRead && isSnapshotEligible(action, payload)) {
    const snapshotResponse = await readFromPublicSnapshot(action, payload);
    if (snapshotResponse) return snapshotResponse as ApiResponse<T>;
  }

  const performRequest = async <TResponse>(
    requestAction: string,
    requestPayload: Record<string, unknown>
  ): Promise<ApiResponse<TResponse>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const currentUser = getAuth().currentUser;
    if (currentUser) {
      headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
    }
    const controller = new AbortController();
    const timeoutMs = getRequestTimeoutMs();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      timeoutMs
    );
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: requestAction, ...requestPayload }),
        signal: controller.signal,
      });
      if (response.status === 413) {
        throw new Error(
          'The database request is too large for the hosting platform. Upload media to storage first and save its URL instead of embedding image data.'
        );
      }
      const responseText = await response.text();
      let result: ApiResponse<T>;
      try {
        result = JSON.parse(responseText) as ApiResponse<T>;
      } catch {
        throw new Error(
          `Turso API returned a non-JSON response (HTTP ${response.status}). Check the Vercel API route configuration.`
        );
      }
      if (!response.ok) {
        throw new TursoApiError(
          result.error || `Turso request failed (${response.status}).`,
          response.status
        );
      }
      return result;
    } catch (error) {
      if (error instanceof TursoApiError) throw error;
      if (controller.signal.aborted) {
        throw new Error(
          `The database API request timed out after ${timeoutMs / 1000} seconds. Check the database service and retry.`
        );
      }
      if (
        error instanceof Error &&
        (error.message.startsWith('The database request is too large') ||
          error.message.startsWith('Turso API returned a non-JSON response'))
      ) {
        throw error;
      }
      const detail = error instanceof Error ? ` ${error.message}` : '';
      throw new Error(
        `Cannot reach the database API at /api/database. Check that the backend/API is deployed and reachable, then verify its Turso configuration.${detail}`
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const canBatchPublicRead = (
    (action === 'get' || action === 'list') &&
    !getAuth().currentUser &&
    // Admin sessions authenticate via cookie, but batched reads are always served
    // with public access, so admin portal reads go out individually. Public
    // pages keep batching unchanged.
    !isBrowserOnAdminPortal() &&
    typeof payload.collection === 'string' &&
    PUBLIC_READ_BATCHABLE_COLLECTIONS.has(payload.collection)
  );
  const requestPromise: Promise<ApiResponse<T>> = canBatchPublicRead
    ? new Promise<ApiResponse<unknown>>((resolve, reject) => {
        pendingPublicReads.push({ action, payload, resolve, reject });
        if (publicReadBatchTimer === null) {
          publicReadBatchTimer = window.setTimeout(flushPublicReadBatch, 0);
        }
      }) as Promise<ApiResponse<T>>
    : performRequest<T>(action, payload);

  if (readKey) {
    const cachedPromise = requestPromise as Promise<ApiResponse<unknown>>;
    inFlightReads.set(readKey, cachedPromise);
    void cachedPromise.then(
      () => {
        if (inFlightReads.get(readKey) === cachedPromise) inFlightReads.delete(readKey);
      },
      () => {
        if (inFlightReads.get(readKey) === cachedPromise) inFlightReads.delete(readKey);
      }
    );
  }
  return requestPromise;
}

function flushPublicReadBatch(): void {
  publicReadBatchTimer = null;
  const reads = pendingPublicReads.splice(0, MAX_PUBLIC_READ_BATCH_SIZE);
  if (pendingPublicReads.length > 0) {
    publicReadBatchTimer = window.setTimeout(() => {
      publicReadBatchTimer = null;
      flushPublicReadBatch();
    }, 0);
  }
  void sendPublicReadBatch(reads);
}

async function sendPublicReadBatch(reads: PendingPublicRead[]): Promise<void> {
  if (reads.length === 0) return;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DATABASE_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('/api/database', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'multiRead',
        requests: reads.map(({ action, payload }) => ({ action, ...payload })),
      }),
      signal: controller.signal,
    });
    if (response.status === 413) {
      await Promise.all(reads.map(async ({ action, payload, resolve, reject }) => {
        try {
          resolve(await requestWithoutBatch(action, payload));
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }));
      return;
    }
    const responseText = await response.text();
    let result: {
      error?: string;
      fallbackToIndividualReads?: boolean;
      results?: Array<{ status: number; body: ApiResponse<unknown> }>;
    };
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`Turso API returned a non-JSON response (HTTP ${response.status}). Check the Vercel API route configuration.`);
    }
    if (!response.ok) {
      throw new TursoApiError(result.error || `Turso request failed (${response.status}).`, response.status);
    }
    if (result.fallbackToIndividualReads) {
      await Promise.all(reads.map(async ({ action, payload, resolve, reject }) => {
        try {
          resolve(await requestWithoutBatch(action, payload));
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }));
      return;
    }
    if (!Array.isArray(result.results) || result.results.length !== reads.length) {
      throw new Error('Turso API returned an invalid batched read response.');
    }
    result.results.forEach((item, index) => {
      if (item.status < 200 || item.status >= 300) {
        reads[index].reject(new TursoApiError(
          item.body.error || `Turso request failed (${item.status}).`,
          item.status
        ));
      } else {
        reads[index].resolve(item.body);
      }
    });
  } catch (error) {
    const normalizedError = controller.signal.aborted
      ? new Error(`The database API request timed out after ${DATABASE_REQUEST_TIMEOUT_MS / 1000} seconds. Check the database service and retry.`)
      : error instanceof Error ? error : new Error(String(error));
    reads.forEach(({ reject }) => reject(normalizedError));
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function requestWithoutBatch(
  action: 'get' | 'list',
  payload: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DATABASE_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('/api/database', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    const text = await response.text();
    let result: ApiResponse<unknown>;
    try {
      result = JSON.parse(text) as ApiResponse<unknown>;
    } catch {
      throw new Error(
        `Turso API returned a non-JSON response (HTTP ${response.status}). Check the Vercel API route configuration.`
      );
    }
    if (!response.ok) {
      throw new TursoApiError(result.error || `Turso request failed (${response.status}).`, response.status);
    }
    return result;
  } catch (error) {
    if (error instanceof TursoApiError || error instanceof Error && error.message.startsWith('Turso API returned')) {
      throw error;
    }
    if (controller.signal.aborted) {
      throw new Error(
        `The database API request timed out after ${DATABASE_REQUEST_TIMEOUT_MS / 1000} seconds. Check the database service and retry.`
      );
    }
    const detail = error instanceof Error ? ` ${error.message}` : '';
    throw new Error(
      `Cannot reach the database API at /api/database. Check that the backend/API is deployed and reachable, then verify its Turso configuration.${detail}`
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function makeDocumentSnapshot<T extends DocumentData>(
  reference: DocumentReference,
  value: ApiDocument | null
): DocumentSnapshot<T> {
  return {
    id: value?.id || reference.id,
    ref: reference,
    exists: () => value !== null,
    data: () => value ? value.data as T : undefined,
  };
}

function makeQuerySnapshot<T extends DocumentData>(
  collectionRef: CollectionReference,
  values: ApiDocument[]
): QuerySnapshot<T> {
  const docs = values.map((value) =>
    makeDocumentSnapshot<T>(
      documentReference([...collectionRef.path.split('/'), value.id]),
      value
    )
  );
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (callback) => docs.forEach(callback),
  };
}

async function readQuery<T extends DocumentData>(
  reference: CollectionReference | QueryReference
): Promise<QuerySnapshot<T>> {
  const parsed = asQuery(reference);
  const filters = parsed.constraints
    .filter((constraint) => constraint.type === 'where')
    .map(({ field, operator, value }) => ({ field, operator, value }));
  const filterGroups = whereAnyToFilterGroups(
    parsed.constraints
      .filter((constraint) => constraint.type === 'whereAny')
      .map((constraint) => constraint.value as SnapshotFilter[])
  );
  const orderConstraint = parsed.constraints.find((constraint) => constraint.type === 'orderBy');
  const limitConstraint = parsed.constraints.find((constraint) => constraint.type === 'limit');
  const cursor = parsed.constraints.find((constraint) => constraint.type === 'startAfter');
  const cursorValue = cursor?.value && typeof cursor.value === 'object'
    ? cursor.value as { id?: unknown; data?: DocumentData }
    : undefined;
  const cursorId = typeof cursorValue?.id === 'string'
    ? cursorValue.id
    : typeof cursor?.value === 'string'
      ? cursor.value
      : undefined;
  const cursorData = cursorValue?.data;
  const afterValue = orderConstraint && cursorData
    ? cursorData[orderConstraint.field]
    : undefined;
  const result = await request('list', {
    collection: parsed.collection,
    parentPath: parsed.parentPath,
    filters,
    filterGroups,
    order: orderConstraint ? { field: orderConstraint.field, direction: orderConstraint.direction } : undefined,
    limit: limitConstraint?.value,
    afterId: cursorId,
    ...(typeof afterValue === 'string' || typeof afterValue === 'number'
      ? { afterValue }
      : {}),
  });
  const collectionRef: CollectionReference = {
    kind: 'collection',
    collection: parsed.collection,
    parentPath: parsed.parentPath,
    path: parsed.parentPath ? `${parsed.parentPath}/${parsed.collection.split('/').pop()}` : parsed.collection,
  };
  return makeQuerySnapshot<T>(collectionRef, result.documents || []);
}

export async function getDoc<T extends DocumentData = DocumentData>(
  reference: DocumentReference
): Promise<DocumentSnapshot<T>> {
  if (!isDocumentReference(reference)) throw new Error('Invalid document reference.');
  const result = await request('get', {
    collection: reference.collection,
    parentPath: reference.parentPath,
    id: reference.id,
  });
  return makeDocumentSnapshot<T>(reference, result.document || null);
}

export const getDocFromServer = getDoc;

export async function getDocs<T extends DocumentData = DocumentData>(
  reference: CollectionReference | QueryReference
): Promise<QuerySnapshot<T>> {
  return readQuery<T>(reference);
}

export async function setDoc(
  reference: DocumentReference,
  data: DocumentData,
  options: { merge?: boolean } = {}
): Promise<void> {
  await setDocWithResult(reference, data, options);
}

export async function setDocWithResult(
  reference: DocumentReference,
  data: DocumentData,
  options: { merge?: boolean } = {}
): Promise<{
  reference?: string;
  /** Customer profile writes: the NIC and the date of birth and gender read from it. */
  identity?: { nic: string; dateOfBirth: string | null; gender: 'male' | 'female' | null };
  /** Customer profile writes: the readable customer ID ("mahdev-cus-001"). */
  customerCode?: string;
}> {
  return request('write', {
    write: {
      type: 'set',
      collection: reference.collection,
      parentPath: reference.parentPath,
      id: reference.id,
      data,
      merge: options.merge === true,
    },
  });
}

export async function updateDoc(reference: DocumentReference, data: DocumentData): Promise<void> {
  await request('write', {
    write: {
      type: 'update',
      collection: reference.collection,
      parentPath: reference.parentPath,
      id: reference.id,
      data,
    },
  });
}

export async function deleteDoc(reference: DocumentReference): Promise<void> {
  await request('write', {
    write: {
      type: 'delete',
      collection: reference.collection,
      parentPath: reference.parentPath,
      id: reference.id,
    },
  });
}

export async function addDoc(
  reference: CollectionReference,
  data: DocumentData
): Promise<DocumentReference> {
  const newReference = documentReference([...reference.path.split('/'), crypto.randomUUID()]);
  await setDoc(newReference, data);
  return newReference;
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}

export function arrayUnion(...values: unknown[]): DocumentData {
  return { __tursoArrayUnion: values };
}

export function onSnapshot<T extends DocumentData = DocumentData>(
  reference: DocumentReference,
  onNext: (snapshot: DocumentSnapshot<T>) => void,
  onError?: (error: Error) => void,
  _pollIntervalMs?: number
): Unsubscribe;
export function onSnapshot<T extends DocumentData = DocumentData>(
  reference: CollectionReference | QueryReference,
  onNext: (snapshot: QuerySnapshot<T>) => void,
  onError?: (error: Error) => void,
  _pollIntervalMs?: number
): Unsubscribe;
export function onSnapshot<T extends DocumentData = DocumentData>(
  reference: DocumentReference | CollectionReference | QueryReference,
  onNext: ((snapshot: DocumentSnapshot<T>) => void) | ((snapshot: QuerySnapshot<T>) => void),
  onError?: (error: Error) => void,
  _pollIntervalMs?: number
): Unsubscribe {
  let stopped = false;

  const loadInitialSnapshot = async () => {
    try {
      const snapshot = isDocumentReference(reference)
        ? await getDoc<T>(reference)
        : await readQuery<T>(reference);
      if (stopped) return;
      (onNext as (value: DocumentSnapshot<T> | QuerySnapshot<T>) => void)(snapshot);
    } catch (error) {
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
      else console.error('[Turso] Database subscription failed:', error);
    }
  };

  void loadInitialSnapshot();
  return () => {
    stopped = true;
  };
}

export function writeBatch(_database: TursoDatabase): WriteBatch {
  const writes: Record<string, unknown>[] = [];
  const add = (type: string, reference: DocumentReference, data?: DocumentData, merge?: boolean) => {
    writes.push({
      type,
      collection: reference.collection,
      parentPath: reference.parentPath,
      id: reference.id,
      data,
      merge,
    });
    return batch;
  };
  const batch: WriteBatch = {
    set: (reference, data, options = {}) => add('set', reference, data, options.merge),
    update: (reference, data) => add('update', reference, data),
    delete: (reference) => add('delete', reference),
    commit: async () => {
      if (!writes.length) return;
      await request('batch', { writes });
    },
  };
  return batch;
}

export { database as db };
