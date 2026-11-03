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
  adminView: 'latest' | 'published' | null = null,
): Promise<SeasonalThemeConfig> {
  const query = adminView === 'published'
    ? '?draft=1&published=1'
    : adminView === 'latest'
      ? '?draft=1'
      : '';
  const response = await fetch(`/api/seasonal-theme${query}`, {
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
    const result = await requestTheme('published', undefined, 'latest');
    return { ...DEFAULT_SEASONAL_THEME, ...result };
  },

  async getPublishedForAdmin(): Promise<SeasonalThemeConfig> {
    const result = await requestTheme('published', undefined, 'published');
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
