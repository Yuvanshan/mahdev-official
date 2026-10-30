export type SeasonalThemeId = 'default' | 'christmas' | 'newYear' | 'valentines' | 'diwali';
export type SeasonalIntensity = 'low' | 'medium' | 'high';

export interface SeasonalThemeSchedule {
  id: string;
  theme: Exclude<SeasonalThemeId, 'default'>;
  startAt: string;
  endAt: string;
}

export interface SeasonalThemeConfig {
  enabled: boolean;
  activeTheme: SeasonalThemeId;
  timezone: 'Asia/Colombo';
  activationMode: 'manual' | 'schedule';
  effectIntensity: SeasonalIntensity;
  snowAmount: number;
  heartsAmount: number;
  fireworksAmount: number;
  sparklesAmount: number;
  desktop: boolean;
  mobile: boolean;
  heroAnimation: boolean;
  schedules: SeasonalThemeSchedule[];
  seasonalLogo?: string;
  seasonalFavicon?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_SEASONAL_THEME: SeasonalThemeConfig = {
  enabled: false,
  activeTheme: 'default',
  timezone: 'Asia/Colombo',
  activationMode: 'manual',
  effectIntensity: 'medium',
  snowAmount: 100,
  heartsAmount: 100,
  fireworksAmount: 100,
  sparklesAmount: 100,
  desktop: true,
  mobile: true,
  heroAnimation: true,
  schedules: [],
};
