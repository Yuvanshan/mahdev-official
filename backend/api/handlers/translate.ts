import type { IncomingMessage, ServerResponse } from 'node:http';
import { isTranslationLang } from '../../../shared/config/translatableFields.js';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../security/rateLimit.js';
import { getPublicTranslationService } from '../../services/translation/index.js';
import type { TranslationService } from '../../services/translation/translationService.js';

export const MAX_TEXTS = 60;
export const MAX_TEXT_CHARS = 1500;
export const MAX_TOTAL_CHARS = 20000;
const REQUEST_LIMIT = { limit: 30, windowMs: 60_000 };

interface TranslateRequest extends IncomingMessage {
  body?: unknown;
}

export type ValidatedTranslateBody =
  | { ok: true; lang: 'ta' | 'si'; texts: string[] }
  | { ok: false; error: string };

/** Strict validation of the public request body. */
export function validateTranslateBody(body: unknown): ValidatedTranslateBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'A JSON body is required.' };
  const { lang, texts } = body as Record<string, unknown>;
  if (!isTranslationLang(lang)) return { ok: false, error: 'lang must be "ta" or "si".' };
  if (!Array.isArray(texts) || texts.length === 0) return { ok: false, error: 'texts must be a non-empty array.' };
  if (texts.length > MAX_TEXTS) return { ok: false, error: `At most ${MAX_TEXTS} texts are allowed.` };
  let total = 0;
  for (const text of texts) {
    if (typeof text !== 'string') return { ok: false, error: 'Every text must be a string.' };
    if (text.length > MAX_TEXT_CHARS) return { ok: false, error: `Each text must be at most ${MAX_TEXT_CHARS} characters.` };
    total += text.length;
  }
  if (total > MAX_TOTAL_CHARS) return { ok: false, error: `Total text must be at most ${MAX_TOTAL_CHARS} characters.` };
  return { ok: true, lang, texts: texts as string[] };
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

/**
 * POST /api/translate  { lang: 'ta' | 'si', texts: string[] }
 * -> { success: true, translations: { [originalText]: translatedText } }
 * Texts that could not be translated are left out; the website keeps the English.
 */
export async function handleTranslate(
  request: TranslateRequest,
  response: ServerResponse,
  service: TranslationService = getPublicTranslationService(),
): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { success: false, error: 'Only POST requests are supported.' });
    return;
  }
  const parsed = validateTranslateBody(request.body);
  if ('error' in parsed) {
    sendJson(response, 400, { success: false, error: parsed.error });
    return;
  }
  try {
    await consumeRateLimit(`translate:${getClientIp(request)}`, REQUEST_LIMIT.limit, REQUEST_LIMIT.windowMs);
  } catch (error) {
    if (error instanceof RateLimitError) {
      sendJson(response, 429, { success: false, error: 'Too many translation requests. Please try again shortly.' });
      return;
    }
    console.error('[Translate] Rate limiter unavailable:', error instanceof Error ? error.name : 'error');
    sendJson(response, 503, { success: false, error: 'Translation is temporarily unavailable.' });
    return;
  }
  const translations = await service.translate(parsed.texts, parsed.lang);
  sendJson(response, 200, { success: true, translations });
}

export default handleTranslate;
