import { createClient, type Client, type InStatement } from '@libsql/client';
import crypto from 'crypto';
import type { FirebaseIdentity } from '../auth/firebaseIdToken.js';

const CORE_COLLECTIONS = [
  'admins',
  'announcements',
  'auditLogs',
  'blog',
  'bookings',
  'banners',
  'categories',
  'clients',
  'companySettings',
  'contactMessages',
  'contactSubmissions',
  'coupons',
  'divisions',
  'faqs',
  'gallery',
  'googleReviews',
  'googleReviewsConfig',
  'heroSections',
  'inquiries',
  'legalPages',
  'media_blobs',
  'media_assets',
  'milestones',
  'navigation',
  'notifications',
  'orders',
  'orderItems',
  'pages',
  'payments',
  'packages',
  'portfolio',
  'products',
  'productVariants',
  'projects',
  'quoteRequests',
  'roles',
  'services',
  'settings',
  'statistics',
  'system_metadata',
  'team',
  'testimonials',
  'trustedCompanies',
  'users',
  'websiteContent',
  'inventory',
  'media_blobs/chunks',
];

type SqlValue = string | number | bigint | ArrayBuffer | null;

let client: Client | undefined;
let databaseInitialization: Promise<void> | undefined;
const collectionTables = new Map<string, string>();
const collectionTableInitializations = new Map<string, Promise<string>>();

export interface TursoDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface TursoFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface TursoOrder {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TursoWrite {
  type: 'set' | 'update' | 'delete';
  collection: string;
  parentPath: string;
  id: string;
  data?: Record<string, unknown>;
  merge?: boolean;
}

export function getTursoClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error('Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  }

  client = createClient({ url, authToken });
  return client;
}

function validateCollection(collection: string): string {
  if (
    typeof collection !== 'string' ||
    !collection ||
    collection.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error('Invalid collection path.');
  }
  return collection;
}

function tableNameFor(collection: string): string {
  const safeName = collection.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40) || 'collection';
  const hash = crypto.createHash('sha256').update(collection).digest('hex').slice(0, 12);
  return `c_${safeName}_${hash}`;
}

export async function ensureCollectionTable(collectionPath: string): Promise<string> {
  const collection = validateCollection(collectionPath);
  const existingTable = collectionTables.get(collection);
  if (existingTable) return existingTable;

  const pendingInitialization = collectionTableInitializations.get(collection);
  if (pendingInitialization) return pendingInitialization;

  const tableName = tableNameFor(collection);
  const initialization = getTursoClient().batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS "${tableName}" (
        parent_path TEXT NOT NULL DEFAULT '',
        id TEXT NOT NULL,
        data TEXT NOT NULL CHECK (json_valid(data)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (parent_path, id)
      )`,
    },
    {
      sql: 'INSERT OR IGNORE INTO turso_collections (collection_path, table_name) VALUES (?, ?)',
      args: [collection, tableName],
    },
  ], 'write').then(() => {
    collectionTables.set(collection, tableName);
    return tableName;
  }).finally(() => {
    collectionTableInitializations.delete(collection);
  });
  collectionTableInitializations.set(collection, initialization);
  return initialization;
}

export function initializeTursoDatabase(): Promise<void> {
  if (databaseInitialization) return databaseInitialization;

  const db = getTursoClient();
  const statements: InStatement[] = [
    {
      sql: `CREATE TABLE IF NOT EXISTS turso_collections (
      collection_path TEXT PRIMARY KEY,
      table_name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS turso_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    },
    {
      sql: 'INSERT OR IGNORE INTO turso_migrations (version) VALUES (1)',
    },
  ];
  for (const collection of CORE_COLLECTIONS) {
    const tableName = tableNameFor(collection);
    statements.push({
      sql: `CREATE TABLE IF NOT EXISTS "${tableName}" (
        parent_path TEXT NOT NULL DEFAULT '',
        id TEXT NOT NULL,
        data TEXT NOT NULL CHECK (json_valid(data)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (parent_path, id)
      )`,
    });
    statements.push({
      sql: 'INSERT OR IGNORE INTO turso_collections (collection_path, table_name) VALUES (?, ?)',
      args: [collection, tableName],
    });
  }
  databaseInitialization = db.batch(statements, 'write').then(() => {
    for (const collection of CORE_COLLECTIONS) {
      collectionTables.set(collection, tableNameFor(collection));
    }
  }).catch((error: unknown) => {
    databaseInitialization = undefined;
    throw error;
  });
  return databaseInitialization;
}

function jsonPath(field: string): string {
  if (!field || field.split('.').some((part) => !part || /[\u0000-\u001f]/.test(part))) {
    throw new Error(`Invalid query field: ${field}`);
  }
  return `$${field.split('.').map((part) => `."${part.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join('')}`;
}

function sqlValue(value: unknown): SqlValue {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'boolean') return Number(value);
  if (value instanceof Uint8Array) {
    return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
  }
  if (value instanceof ArrayBuffer) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  throw new Error('Unsupported Turso query value.');
}

function whereSql(filter: TursoFilter): { sql: string; args: SqlValue[] } {
  const path = jsonPath(filter.field);
  const valueSql = 'json_extract(data, ?)';
  switch (filter.operator) {
    case '==':
      return { sql: `${valueSql} IS ?`, args: [path, sqlValue(filter.value)] };
    case '!=':
      return { sql: `${valueSql} IS NOT ?`, args: [path, sqlValue(filter.value)] };
    case '>':
    case '>=':
    case '<':
    case '<=':
      return { sql: `${valueSql} ${filter.operator} ?`, args: [path, sqlValue(filter.value)] };
    case 'in':
    case 'not-in': {
      if (!Array.isArray(filter.value) || filter.value.length === 0) {
        throw new Error(`The "${filter.operator}" filter requires a non-empty array.`);
      }
      return {
        sql: `${valueSql} ${filter.operator === 'in' ? 'IN' : 'NOT IN'} (${filter.value.map(() => '?').join(', ')})`,
        args: [path, ...filter.value.map(sqlValue)],
      };
    }
    case 'array-contains':
      return {
        sql: `EXISTS (SELECT 1 FROM json_each(${valueSql}) WHERE value IS ?)`,
        args: [path, sqlValue(filter.value)],
      };
    default:
      throw new Error(`Unsupported Turso query operator: ${filter.operator}`);
  }
}

export async function getTursoDocument(
  collection: string,
  parentPath: string,
  id: string
): Promise<TursoDocument | null> {
  const table = await ensureCollectionTable(collection);
  const result = await getTursoClient().execute({
    sql: `SELECT id, data FROM "${table}" WHERE parent_path = ? AND id = ?`,
    args: [parentPath, id],
  });
  const row = result.rows[0];
  if (!row) return null;
  return { id: String(row.id), data: JSON.parse(String(row.data)) as Record<string, unknown> };
}

export async function listTursoDocuments(
  collection: string,
  parentPath: string,
  filters: TursoFilter[] = [],
  order?: TursoOrder,
  maxRows?: number,
  afterId?: string,
  owner?: FirebaseIdentity
): Promise<TursoDocument[]> {
  const table = await ensureCollectionTable(collection);
  const conditions = ['parent_path = ?'];
  const args: SqlValue[] = [parentPath];

  for (const filter of filters) {
    const parsed = whereSql(filter);
    conditions.push(parsed.sql);
    args.push(...parsed.args);
  }
  if (afterId) {
    conditions.push('id > ?');
    args.push(afterId);
  }
  if (owner) {
    if (collection === 'users') {
      const ownership = ['id = ?', "json_extract(data, '$.uid') = ?"];
      args.push(owner.uid, owner.uid);
      if (owner.email) {
        ownership.push("lower(json_extract(data, '$.email')) = ?");
        args.push(owner.email);
      }
      conditions.push(`(${ownership.join(' OR ')})`);
    } else {
      const ownership = [
        "json_extract(data, '$.customerId') = ?",
        "json_extract(data, '$.userId') = ?",
        "json_extract(data, '$.uid') = ?",
      ];
      args.push(owner.uid, owner.uid, owner.uid);
      if (owner.email) {
        ownership.push("lower(json_extract(data, '$.customerEmail')) = ?");
        ownership.push("lower(json_extract(data, '$.email')) = ?");
        ownership.push("lower(json_extract(data, '$.customer.email')) = ?");
        args.push(owner.email, owner.email, owner.email);
      }
      conditions.push(`(${ownership.join(' OR ')})`);
    }
  }

  let sql = `SELECT id, data FROM "${table}" WHERE ${conditions.join(' AND ')}`;
  if (order) {
    sql += ` ORDER BY json_extract(data, ?) ${order.direction.toUpperCase()}, id ${order.direction.toUpperCase()}`;
    args.push(jsonPath(order.field));
  } else {
    sql += ' ORDER BY id ASC';
  }
  if (maxRows !== undefined) {
    if (!Number.isInteger(maxRows) || maxRows < 1 || maxRows > 10000) {
      throw new Error('Query limit must be an integer between 1 and 10000.');
    }
    sql += ' LIMIT ?';
    args.push(maxRows);
  }

  const result = await getTursoClient().execute({ sql, args });
  return result.rows.map((row) => ({
    id: String(row.id),
    data: JSON.parse(String(row.data)) as Record<string, unknown>,
  }));
}

function mergeData(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      '__tursoArrayUnion' in value &&
      Array.isArray((value as { __tursoArrayUnion: unknown }).__tursoArrayUnion)
    ) {
      const current = Array.isArray(merged[key]) ? (merged[key] as unknown[]) : [];
      const additions = (value as { __tursoArrayUnion: unknown[] }).__tursoArrayUnion;
      merged[key] = [...current];
      for (const item of additions) {
        if (!current.some((currentValue) => JSON.stringify(currentValue) === JSON.stringify(item))) {
          (merged[key] as unknown[]).push(item);
        }
      }
    } else if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      merged[key] &&
      typeof merged[key] === 'object' &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = mergeData(
        merged[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export async function writeTursoDocument(write: TursoWrite): Promise<void> {
  const table = await ensureCollectionTable(write.collection);
  if (!write.id || write.id.includes('/')) throw new Error('Invalid document ID.');
  if (write.type === 'delete') {
    await getTursoClient().execute({
      sql: `DELETE FROM "${table}" WHERE parent_path = ? AND id = ?`,
      args: [write.parentPath, write.id],
    });
    return;
  }
  if (!write.data || typeof write.data !== 'object' || Array.isArray(write.data)) {
    throw new Error('Document data must be an object.');
  }

  const existing = write.merge || write.type === 'update'
    ? await getTursoDocument(write.collection, write.parentPath, write.id)
    : null;
  if (write.type === 'update' && !existing) {
    throw new Error(`Cannot update missing document "${write.id}".`);
  }
  const data = mergeData(
    existing && (write.merge || write.type === 'update') ? existing.data : {},
    write.data
  );
  await getTursoClient().execute({
    sql: `INSERT INTO "${table}" (parent_path, id, data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(parent_path, id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
    args: [write.parentPath, write.id, JSON.stringify(data)],
  });
}

export async function writeTursoBatch(writes: TursoWrite[]): Promise<void> {
  if (writes.length > 500) throw new Error('A Turso write batch cannot exceed 500 operations.');
  const collections = [...new Set(writes.map((write) => validateCollection(write.collection)))];
  const tables = new Map(
    await Promise.all(collections.map(async (collection) => [
      collection,
      await ensureCollectionTable(collection),
    ] as const))
  );
  const statements: InStatement[] = [];
  for (const write of writes) {
    const table = tables.get(write.collection)!;
    if (!write.id || write.id.includes('/')) throw new Error('Invalid document ID.');
    if (write.type === 'delete') {
      statements.push({
        sql: `DELETE FROM "${table}" WHERE parent_path = ? AND id = ?`,
        args: [write.parentPath, write.id],
      });
      continue;
    }
    if (!write.data || typeof write.data !== 'object' || Array.isArray(write.data)) {
      throw new Error('Document data must be an object.');
    }
    const existing = write.merge || write.type === 'update'
      ? await getTursoDocument(write.collection, write.parentPath, write.id)
      : null;
    if (write.type === 'update' && !existing) {
      throw new Error(`Cannot update missing document "${write.id}".`);
    }
    const data = mergeData(
      existing && (write.merge || write.type === 'update') ? existing.data : {},
      write.data
    );
    statements.push({
      sql: `INSERT INTO "${table}" (parent_path, id, data, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(parent_path, id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
      args: [write.parentPath, write.id, JSON.stringify(data)],
    });
  }

  if (statements.length) {
    await getTursoClient().batch(statements, 'write');
  }
}

export async function clearTursoCollection(collection: string): Promise<number> {
  const table = await ensureCollectionTable(collection);
  const result = await getTursoClient().execute(`DELETE FROM "${table}"`);
  return Number(result.rowsAffected);
}

export async function checkTursoConnection(): Promise<void> {
  await getTursoClient().execute('SELECT 1');
}

export async function importMigratedDocuments(
  collection: string,
  documents: TursoDocument[],
  overwriteExisting = false
): Promise<{ inserted: number; overwritten: number; skipped: number }> {
  const table = await ensureCollectionTable(collection);
  const uniqueDocuments = new Map<string, TursoDocument>();
  for (const document of documents) {
    if (overwriteExisting || !uniqueDocuments.has(document.id)) {
      uniqueDocuments.set(document.id, document);
    }
  }

  let inserted = 0;
  let overwritten = 0;
  let skipped = documents.length - uniqueDocuments.size;
  const distinctDocuments = [...uniqueDocuments.values()];
  for (let offset = 0; offset < distinctDocuments.length; offset += 200) {
    const batchDocuments = distinctDocuments.slice(offset, offset + 200);
    let existingIds = new Set<string>();
    if (overwriteExisting) {
      const existing = await getTursoClient().execute({
        sql: `SELECT id FROM "${table}" WHERE parent_path = '' AND id IN (${batchDocuments.map(() => '?').join(', ')})`,
        args: batchDocuments.map(({ id }) => id),
      });
      existingIds = new Set(existing.rows.map((row) => String(row.id)));
    }
    const statements: InStatement[] = batchDocuments.map(({ id, data }) => ({
      sql: overwriteExisting
        ? `INSERT INTO "${table}" (parent_path, id, data, updated_at)
          VALUES ('', ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(parent_path, id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`
        : `INSERT OR IGNORE INTO "${table}" (parent_path, id, data)
          VALUES ('', ?, ?)`,
      args: [id, JSON.stringify(data)],
    }));
    const results = await getTursoClient().batch(statements, 'write');
    if (overwriteExisting) {
      overwritten += existingIds.size;
      inserted += batchDocuments.length - existingIds.size;
    } else {
      const batchInserted = results.reduce((count, result) => count + Number(result.rowsAffected), 0);
      inserted += batchInserted;
      skipped += batchDocuments.length - batchInserted;
    }
  }
  return { inserted, overwritten, skipped };
}

export async function provisionTursoCollections(collections: string[]): Promise<void> {
  await initializeTursoDatabase();
  for (const collection of collections) await ensureCollectionTable(collection);
}
