import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import {
  initializeTursoDatabase,
  provisionTursoCollections,
  TursoDocument,
  importMigratedDocuments,
} from '../backend/db/tursoDatabase';

interface FirestoreBackup {
  [collection: string]: unknown;
}

function getDocumentId(collection: string, document: Record<string, unknown>): string {
  for (const key of ['_id', 'id', 'uid']) {
    const value = document[key];
    if (typeof value === 'string' && value && !value.includes('/')) return value;
  }
  throw new Error(`A document in "${collection}" has no valid _id, id, or uid; refusing to skip it.`);
}

async function migrateBackup(filePath: string, overwriteExisting: boolean): Promise<void> {
  const input = JSON.parse(await readFile(filePath, 'utf8')) as FirestoreBackup;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('The Firestore backup must be an object keyed by collection name.');
  }

  const collections = Object.entries(input).filter(([, value]) => Array.isArray(value));
  await initializeTursoDatabase();
  await provisionTursoCollections(collections.map(([name]) => name));

  let totalImported = 0;
  let totalOverwritten = 0;
  let totalSkipped = 0;
  for (const [collection, entries] of collections) {
    const documents: TursoDocument[] = (entries as unknown[]).map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error(`Invalid document found in Firestore collection "${collection}".`);
      }
      const data = entry as Record<string, unknown>;
      return { id: getDocumentId(collection, data), data };
    });

    for (let offset = 0; offset < documents.length; offset += 200) {
      const result = await importMigratedDocuments(
        collection,
        documents.slice(offset, offset + 200),
        overwriteExisting
      );
      totalImported += result.inserted;
      totalOverwritten += result.overwritten;
      totalSkipped += result.skipped;
    }
    console.info(`[Turso migration] ${collection}: ${documents.length} source documents processed.`);
  }

  console.info(
    `[Turso migration] Complete. Inserted ${totalImported}, overwritten ${totalOverwritten}, ` +
      `skipped existing IDs ${totalSkipped}, across ${collections.length} collections.`
  );
}

const argumentsList = process.argv.slice(2);
const overwriteExisting = argumentsList.includes('--overwrite');
const backupPath = argumentsList.find((argument) => argument !== '--overwrite') || 'firestore-dump.json';
migrateBackup(backupPath, overwriteExisting).catch((error: unknown) => {
  console.error('[Turso migration] Failed:', error);
  process.exitCode = 1;
});
