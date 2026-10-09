import { getAuth } from 'firebase/auth';

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
  readonly type: 'where' | 'orderBy' | 'limit' | 'startAfter';
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
}

export interface WriteBatch {
  set(reference: DocumentReference, data: DocumentData, options?: { merge?: boolean }): WriteBatch;
  update(reference: DocumentReference, data: DocumentData): WriteBatch;
  delete(reference: DocumentReference): WriteBatch;
  commit(): Promise<void>;
}

const database: TursoDatabase = { type: 'turso' };
// These HTTP-backed subscriptions each issue Turso reads, so avoid tight polling.
const SNAPSHOT_POLL_INTERVAL_MS = 30000;
const inFlightReads = new Map<string, Promise<ApiResponse<unknown>>>();

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

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, direction };
}

export function limit(value: number): QueryConstraint {
  return { type: 'limit', value };
}

export function startAfter(snapshot: DocumentSnapshot | string): QueryConstraint {
  return { type: 'startAfter', value: typeof snapshot === 'string' ? snapshot : snapshot.id };
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

  const requestPromise = (async (): Promise<ApiResponse<T>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const currentUser = getAuth().currentUser;
    if (currentUser) {
      headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
    }
    let response: Response;
    try {
      response = await fetch('/api/database', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, ...payload }),
      });
    } catch (error) {
      const detail = error instanceof Error ? ` ${error.message}` : '';
      throw new Error(
        `Cannot reach the database API at /api/database. Check that the backend/API is deployed and reachable, then verify its Turso configuration.${detail}`
      );
    }
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
    if (!response.ok) throw new Error(result.error || `Turso request failed (${response.status}).`);
    return result;
  })();

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
  const orderConstraint = parsed.constraints.find((constraint) => constraint.type === 'orderBy');
  const limitConstraint = parsed.constraints.find((constraint) => constraint.type === 'limit');
  const cursor = parsed.constraints.find((constraint) => constraint.type === 'startAfter');
  const result = await request('list', {
    collection: parsed.collection,
    parentPath: parsed.parentPath,
    filters,
    order: orderConstraint ? { field: orderConstraint.field, direction: orderConstraint.direction } : undefined,
    limit: limitConstraint?.value,
    afterId: cursor?.value,
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
  await request('write', {
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
  pollIntervalMs?: number
): Unsubscribe;
export function onSnapshot<T extends DocumentData = DocumentData>(
  reference: CollectionReference | QueryReference,
  onNext: (snapshot: QuerySnapshot<T>) => void,
  onError?: (error: Error) => void,
  pollIntervalMs?: number
): Unsubscribe;
export function onSnapshot<T extends DocumentData = DocumentData>(
  reference: DocumentReference | CollectionReference | QueryReference,
  onNext: ((snapshot: DocumentSnapshot<T>) => void) | ((snapshot: QuerySnapshot<T>) => void),
  onError?: (error: Error) => void,
  pollIntervalMs = SNAPSHOT_POLL_INTERVAL_MS
): Unsubscribe {
  let stopped = false;
  let hasEmitted = false;
  let lastSnapshot = '';
  let polling = false;

  const poll = async () => {
    if (stopped || polling || document.hidden) return;
    polling = true;
    try {
      const readSnapshot = async () => {
        if (isDocumentReference(reference)) {
          const documentSnapshot = await getDoc<T>(reference);
          return {
            snapshot: documentSnapshot as DocumentSnapshot<T> | QuerySnapshot<T>,
            serialized: JSON.stringify({
              exists: documentSnapshot.exists(),
              data: documentSnapshot.data(),
            }),
          };
        }
        const querySnapshot = await readQuery<T>(reference);
        return {
          snapshot: querySnapshot as DocumentSnapshot<T> | QuerySnapshot<T>,
          serialized: JSON.stringify(querySnapshot.docs.map((document) => ({
            id: document.id,
            data: document.data(),
          }))),
        };
      };
      const { snapshot, serialized } = await readSnapshot();
      if (stopped) return;
      if (!hasEmitted || serialized !== lastSnapshot) {
        hasEmitted = true;
        lastSnapshot = serialized;
        (onNext as (value: DocumentSnapshot<T> | QuerySnapshot<T>) => void)(snapshot);
      }
    } catch (error) {
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
      else console.error('[Turso] Database subscription failed:', error);
    } finally {
      polling = false;
    }
  };

  const handleVisibilityChange = () => {
    if (!document.hidden) void poll();
  };

  void poll();
  const timer = window.setInterval(() => void poll(), pollIntervalMs);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
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
