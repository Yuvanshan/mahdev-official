import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  DEFAULT_SEASONAL_THEME,
  type SeasonalThemeConfig,
  type SeasonalThemeSchedule,
  type SeasonalThemeId,
} from '../../../src/types/seasonalTheme.js';
import { getTursoDocument, initializeTursoDatabase, writeTursoDocument } from '../../db/tursoDatabase.js';
import { requireAdminSession, AdminSessionAuthError } from '../../auth/adminCredentialAuth.js';
import { isFromThisSite } from '../../security/sameSite.js';

interface SeasonalThemeRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

const THEME_IDS = new Set<SeasonalThemeId>(['default', 'christmas', 'newYear', 'valentines', 'diwali']);
const FESTIVAL_IDS = new Set<SeasonalThemeId>(['christmas', 'newYear', 'valentines', 'diwali']);
const INTENSITIES = new Set(['low', 'medium', 'high']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function safeAssetUrl(value: unknown, label: string): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 2048) throw new Error(`${label} is invalid.`);
  if (/[\u0000-\u001f\\]/.test(value)) throw new Error(`${label} is invalid.`);
  if (value.startsWith('firestore://')) {
    if (!value.startsWith('firestore://media_blobs/')) throw new Error(`${label} has an invalid media path.`);
    return value;
  }
  if (value.startsWith('//')) throw new Error(`${label} must be a site path or HTTPS URL.`);
  if (!value.startsWith('/')) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${label} must be a site path or HTTPS URL.`);
    }
    if (url.protocol !== 'https:') throw new Error(`${label} must use HTTPS.`);
  }
  return value;
}

function effectAmount(value: unknown, label: string): number {
  if (value === undefined) return 100;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} must be a number from 0 to 100.`);
  }
  return value;
}

function parseSchedules(value: unknown): SeasonalThemeSchedule[] {
  if (!Array.isArray(value) || value.length > 32) throw new Error('Provide no more than 32 seasonal schedules.');
  const schedules = value.map((raw, index) => {
    if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id || raw.id.length > 80) {
      throw new Error(`Schedule ${index + 1} is invalid.`);
    }
    if (typeof raw.theme !== 'string' || !FESTIVAL_IDS.has(raw.theme as SeasonalThemeId)) {
      throw new Error(`Schedule ${index + 1} must use a supported festival theme.`);
    }
    if (typeof raw.startAt !== 'string' || typeof raw.endAt !== 'string') {
      throw new Error(`Schedule ${index + 1} needs a start and end time.`);
    }
    const start = Date.parse(raw.startAt);
    const end = Date.parse(raw.endAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error(`Schedule ${index + 1} has an invalid time range.`);
    }
    return {
      id: raw.id,
      theme: raw.theme as SeasonalThemeSchedule['theme'],
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
    };
  });

  const ordered = [...schedules].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  for (let index = 1; index < ordered.length; index += 1) {
    if (Date.parse(ordered[index].startAt) < Date.parse(ordered[index - 1].endAt)) {
      throw new Error(`Seasonal schedules "${ordered[index - 1].id}" and "${ordered[index].id}" overlap.`);
    }
  }
  return schedules;
}

function validateTheme(value: unknown): SeasonalThemeConfig {
  if (!isRecord(value)) throw new Error('Seasonal theme settings are required.');
  if (typeof value.activeTheme !== 'string' || !THEME_IDS.has(value.activeTheme as SeasonalThemeId)) {
    throw new Error('Choose a supported seasonal theme.');
  }
  if (value.activationMode !== 'manual' && value.activationMode !== 'schedule') {
    throw new Error('Choose a supported activation mode.');
  }
  if (value.effectIntensity !== undefined && !INTENSITIES.has(String(value.effectIntensity))) {
    throw new Error('Choose a supported effect intensity.');
  }
  const schedules = parseSchedules(value.schedules ?? []);
  const activeTheme = value.activeTheme as SeasonalThemeId;
  const activationMode = value.activationMode;
  return {
    ...DEFAULT_SEASONAL_THEME,
    enabled: value.enabled === true && (activationMode === 'schedule' || activeTheme !== 'default'),
    activeTheme,
    timezone: 'Asia/Colombo',
    activationMode,
    effectIntensity: (value.effectIntensity as SeasonalThemeConfig['effectIntensity']) || 'medium',
    snowAmount: effectAmount(value.snowAmount, 'Snowfall amount'),
    heartsAmount: effectAmount(value.heartsAmount, 'Hearts amount'),
    fireworksAmount: effectAmount(value.fireworksAmount, 'Fireworks amount'),
    sparklesAmount: effectAmount(value.sparklesAmount, 'Sparkles amount'),
    desktop: value.desktop !== false,
    mobile: value.mobile !== false,
    schedules,
    seasonalLogo: safeAssetUrl(value.seasonalLogo, 'Seasonal logo'),
    seasonalFavicon: safeAssetUrl(value.seasonalFavicon, 'Seasonal favicon'),
  };
}

function effectivePublishedTheme(theme: SeasonalThemeConfig): SeasonalThemeConfig {
  if (!theme.enabled) return { ...theme, activeTheme: 'default' };
  if (theme.activationMode === 'manual') return theme;

  const now = Date.now();
  const activeSchedule = theme.schedules.find((schedule) =>
    Date.parse(schedule.startAt) <= now && now < Date.parse(schedule.endAt)
  );
  return activeSchedule
    ? { ...theme, activeTheme: activeSchedule.theme }
    : { ...theme, activeTheme: 'default' };
}

export default async function handler(
  request: SeasonalThemeRequest,
  response: ServerResponse
): Promise<void> {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'GET') {
    try {
      const requestUrl = new URL(request.url || '/', 'http://localhost');
      if (requestUrl.searchParams.get('draft') === '1') {
        const cookie = Array.isArray(request.headers.cookie)
          ? request.headers.cookie[0]
          : request.headers.cookie;
        await requireAdminSession(cookie);
        await initializeTursoDatabase();
        const draftDocument = await getTursoDocument('settings', '', 'draftSeasonalTheme');
        const publishedDocument = draftDocument
          ? null
          : await getTursoDocument('settings', '', 'publishedSeasonalTheme');
        sendJson(response, 200, {
          success: true,
          theme: draftDocument
            ? validateTheme(draftDocument.data)
            : publishedDocument
              ? validateTheme(publishedDocument.data)
              : DEFAULT_SEASONAL_THEME,
        });
        return;
      }
      await initializeTursoDatabase();
      const document = await getTursoDocument('settings', '', 'publishedSeasonalTheme');
      const rawTheme = document ? validateTheme(document.data) : DEFAULT_SEASONAL_THEME;
      sendJson(response, 200, { success: true, theme: effectivePublishedTheme(rawTheme) });
    } catch (error) {
      console.error('[Seasonal Theme] Published theme could not be loaded:', error);
      const status = error instanceof AdminSessionAuthError ? error.statusCode : 503;
      sendJson(response, status, {
        success: false,
        error: status === 503 ? 'Seasonal appearance is temporarily unavailable.' : error.message,
      });
    }
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    sendJson(response, 405, { success: false, error: 'Only GET and POST requests are supported.' });
    return;
  }
  if (!isFromThisSite(request)) {
    sendJson(response, 404, { success: false, error: 'Not found.' });
    return;
  }

  let saving = false;
  try {
    const cookie = Array.isArray(request.headers.cookie)
      ? request.headers.cookie[0]
      : request.headers.cookie;
    const session = await requireAdminSession(cookie);
    if (!isRecord(request.body) || (request.body.action !== 'save-draft' && request.body.action !== 'publish')) {
      sendJson(response, 400, { success: false, error: 'Unsupported seasonal theme action.' });
      return;
    }
    const theme = validateTheme(request.body.theme);
    saving = true;
    await initializeTursoDatabase();
    const collectionId = request.body.action === 'publish'
      ? 'publishedSeasonalTheme'
      : 'draftSeasonalTheme';
    const savedTheme: Record<string, unknown> = {
      ...theme,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
    };
    await writeTursoDocument({
      type: 'set',
      collection: 'settings',
      parentPath: '',
      id: collectionId,
      data: savedTheme,
    });
    sendJson(response, 200, { success: true, theme: savedTheme });
  } catch (error) {
    const status = error instanceof AdminSessionAuthError
      ? error.statusCode
      : !saving
        ? 400
        : 503;
    if (status === 503) console.error('[Seasonal Theme] Theme changes could not be saved:', error);
    sendJson(response, status, {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Seasonal appearance could not be saved.',
    });
  }
}
