import type { IncomingMessage, ServerResponse } from 'node:http';
import { AdminSessionAuthError, requireAdminSession } from '../../../auth/adminCredentialAuth.js';
import {
  getTursoDocument,
  initializeTursoDatabase,
  listTursoDocuments,
  writeTursoBatch,
  type TursoWrite,
} from '../../../db/tursoDatabase.js';
import {
  extractTranslatable,
  getTranslatableFields,
  TRANSLATABLE_FIELDS,
  TRANSLATION_LANGS,
} from '../../../../shared/config/translatableFields.js';
import { addTranslationsToWrites } from '../../../services/translation/adminWriteTranslation.js';
import { getAdminTranslationService } from '../../../services/translation/index.js';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 25;
const BACKFILL_TIMEOUT_MS = 25_000;
const BACKFILL_COLLECTIONS = new Set(Object.keys(TRANSLATABLE_FIELDS).map((key) => key.split('/')[0]));

interface BackfillRequest extends IncomingMessage {
  body?: unknown;
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function lacksTranslations(collection: string, id: string, data: Record<string, unknown>): boolean {
  if (!getTranslatableFields(`${collection}/${id}`)) return false;
  if (data.translationsPending === true) return true;
  const paths = Object.keys(extractTranslatable(`${collection}/${id}`, { ...data, id }));
  const bag = (data.translations ?? {}) as Record<string, Record<string, unknown> | undefined>;
  return paths.some((path) => TRANSLATION_LANGS.some((lang) => typeof bag[lang]?.[path] !== 'string'));
}

/**
 * POST /api/admin/translate-backfill  { collection, limit?, cursor? }   (admin only)
 * Translates one page of existing records that have no (or incomplete) translations.
 * -> { success, scanned, updated, nextCursor }. Call again with nextCursor until it is null.
 */
export default async function handler(request: BackfillRequest, response: ServerResponse): Promise<void> {
  try {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, { success: false, error: 'Only POST requests are supported.' });
      return;
    }
    await requireAdminSession(request.headers.cookie);
    const body = (request.body && typeof request.body === 'object' ? request.body : {}) as Record<string, unknown>;
    const collection = typeof body.collection === 'string' ? body.collection : '';
    if (!BACKFILL_COLLECTIONS.has(collection)) {
      sendJson(response, 400, { success: false, error: 'collection must be a translatable collection.' });
      return;
    }
    const requested = Number(body.limit);
    const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    const cursor = typeof body.cursor === 'string' && body.cursor && !body.cursor.includes('/') ? body.cursor : undefined;

    await initializeTursoDatabase();
    const page = await listTursoDocuments(collection, '', [], undefined, limit, cursor);
    const writes: TursoWrite[] = page
      .filter((doc) => lacksTranslations(collection, doc.id, doc.data))
      .map((doc) => ({ type: 'update', collection, parentPath: '', id: doc.id, data: {}, merge: true }));

    // Same code path as an admin save: it fills only the missing fields.
    const translated = await addTranslationsToWrites(writes, {
      service: getAdminTranslationService(),
      loadExisting: (write) => getTursoDocument(write.collection, write.parentPath, write.id),
      timeoutMs: BACKFILL_TIMEOUT_MS,
    });
    if (translated.length > 0) await writeTursoBatch(translated);

    sendJson(response, 200, {
      success: true,
      scanned: page.length,
      updated: translated.length,
      stillPending: translated.filter((write) => write.data?.translationsPending === true).length,
      nextCursor: page.length === limit ? page[page.length - 1].id : null,
    });
  } catch (error) {
    if (error instanceof AdminSessionAuthError) {
      sendJson(response, error.statusCode, { success: false, error: error.message });
      return;
    }
    console.error('[Translate backfill] Failed:', error instanceof Error ? error.name : 'error');
    sendJson(response, 500, { success: false, error: 'Translation backfill failed.' });
  }
}
