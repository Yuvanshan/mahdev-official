import {
  DEFAULT_SEASONAL_THEME,
  SeasonalThemeConfig,
  SeasonalThemeSchedule,
} from '../types/seasonalTheme';

interface SeasonalThemeResponse {
  success?: boolean;
  theme?: SeasonalThemeConfig;
  error?: string;
}

async function requestTheme(
  action: 'published' | 'save-draft' | 'publish',
  theme?: SeasonalThemeConfig,
  draft = false,
): Promise<SeasonalThemeConfig> {
  const response = await fetch(`/api/seasonal-theme${draft ? '?draft=1' : ''}`, {
    method: action === 'published' ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: action === 'published' ? undefined : { 'Content-Type': 'application/json' },
    body: action === 'published' ? undefined : JSON.stringify({ action, theme }),
  });
  const result = await response.json() as SeasonalThemeResponse;
  if (!response.ok || result.success !== true || !result.theme) {
    throw new Error(result.error || 'Seasonal appearance could not be loaded or saved.');
  }
  return result.theme;
}

export const seasonalThemeService = {
  async getPublished(): Promise<SeasonalThemeConfig> {
    const result = await requestTheme('published');
    return { ...DEFAULT_SEASONAL_THEME, ...result };
  },

  async getDraft(): Promise<SeasonalThemeConfig> {
    const result = await requestTheme('published', undefined, true);
    return { ...DEFAULT_SEASONAL_THEME, ...result };
  },

  saveDraft(theme: SeasonalThemeConfig): Promise<SeasonalThemeConfig> {
    return requestTheme('save-draft', theme);
  },

  publish(theme: SeasonalThemeConfig): Promise<SeasonalThemeConfig> {
    return requestTheme('publish', theme);
  },
};

export function findScheduleConflict(
  schedules: SeasonalThemeSchedule[],
  candidate: SeasonalThemeSchedule
): SeasonalThemeSchedule | undefined {
  const candidateStart = Date.parse(candidate.startAt);
  const candidateEnd = Date.parse(candidate.endAt);
  return schedules.find((schedule) => {
    if (schedule.id === candidate.id) return false;
    return candidateStart < Date.parse(schedule.endAt) && candidateEnd > Date.parse(schedule.startAt);
  });
}
