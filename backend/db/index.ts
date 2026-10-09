import {
  checkTursoConnection,
  getTursoClient,
  initializeTursoDatabase,
  listTursoDocuments,
} from './tursoDatabase.js';

const PUBLIC_COLLECTIONS = new Set(['products', 'settings']);

export async function runMigrations(): Promise<{ collections: number; connected: boolean }> {
  await initializeTursoDatabase();
  await checkTursoConnection();

  const result = await getTursoClient().execute(
    'SELECT COUNT(*) AS count FROM turso_collections'
  );
  return {
    collections: Number(result.rows[0]?.count ?? 0),
    connected: true,
  };
}

export async function getDatabaseStatus() {
  const migration = await runMigrations();
  const result = await getTursoClient().execute(
    'SELECT MAX(version) AS version FROM turso_migrations'
  );
  return {
    status: 'ready',
    database: 'turso',
    migrationVersion: Number(result.rows[0]?.version ?? 0),
    collections: migration.collections,
    connected: migration.connected,
  };
}

export async function listPublicCollection(collection: 'products' | 'settings') {
  if (!PUBLIC_COLLECTIONS.has(collection)) {
    throw new Error('The requested collection is not public.');
  }
  return listTursoDocuments(collection, '');
}

export async function listCustomersForAdmin() {
  return listTursoDocuments('users', '');
}
