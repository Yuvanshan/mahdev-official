import { consumeRateLimit, RateLimitError } from '../../security/rateLimit.js';
import { TursoTranslationCache } from './cache.js';
import { GeminiTranslationProvider } from './provider.js';
import { TranslationService } from './translationService.js';

const DEFAULT_DAILY_MISS_LIMIT = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;

function dailyMissLimit(): number {
  const parsed = Number.parseInt(process.env.TRANSLATE_DAILY_MISS_LIMIT ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DAILY_MISS_LIMIT;
}

/** Shared, database-backed daily cap on provider translations from public requests. */
async function reservePublicMisses(count: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  try {
    await consumeRateLimit(`translate-misses:${day}`, dailyMissLimit(), DAY_MS, count);
    return true;
  } catch (error) {
    if (error instanceof RateLimitError) return false;
    throw error;
  }
}

function createProvider(): GeminiTranslationProvider | null {
  // Gemini is switched off until TRANSLATE_ENABLED=true (credits depleted). Cached translations still serve.
  if (process.env.TRANSLATE_ENABLED !== 'true') return null;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey ? new GeminiTranslationProvider(apiKey, process.env.TRANSLATE_MODEL?.trim() || undefined) : null;
}

const warn = (message: string) => console.warn(message);

let publicService: TranslationService | undefined;
let adminService: TranslationService | undefined;

/** For anonymous website visitors: capped by TRANSLATE_DAILY_MISS_LIMIT. */
export function getPublicTranslationService(): TranslationService {
  publicService ??= new TranslationService({
    provider: createProvider(),
    cache: new TursoTranslationCache(),
    reserveMisses: reservePublicMisses,
    warn,
  });
  return publicService;
}

/** For authenticated admin saves and backfill: no daily cap (the admin is trusted). */
export function getAdminTranslationService(): TranslationService {
  adminService ??= new TranslationService({
    provider: createProvider(),
    cache: new TursoTranslationCache(),
    warn,
  });
  return adminService;
}
