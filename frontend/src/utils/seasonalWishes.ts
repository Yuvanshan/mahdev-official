import type { SeasonalWishCampaign } from '../types/cms';

function localDateTimeInZone(value: string, timeZone: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute
  ) return null;
  const expected = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = expected;
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const parts = Object.fromEntries(formatter.formatToParts(timestamp).map((part) => [part.type, part.value]));
      const observed = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute)
      );
      timestamp += expected - observed;
    }
    const resolved = Object.fromEntries(formatter.formatToParts(timestamp).map((part) => [part.type, part.value]));
    if (
      Number(resolved.year) !== year ||
      Number(resolved.month) !== month ||
      Number(resolved.day) !== day ||
      Number(resolved.hour) !== hour ||
      Number(resolved.minute) !== minute
    ) return null;
    return timestamp;
  } catch (error) {
    console.error(`[SeasonalWishes] Invalid campaign timezone "${timeZone}":`, error);
    return null;
  }
}

export function campaignDateTimeToTimestamp(value: string, timeZone: string): number | null {
  return localDateTimeInZone(value, timeZone);
}

export function isSeasonalWishCampaignActive(
  campaign: SeasonalWishCampaign,
  timestamp = Date.now()
): boolean {
  if (!campaign.isActive || campaign.isDeleted) return false;
  const start = localDateTimeInZone(campaign.startAt, campaign.timezone);
  const end = localDateTimeInZone(campaign.endAt, campaign.timezone);
  return start !== null && end !== null && end > start && start <= timestamp && timestamp < end;
}

export function formatCampaignExpiry(campaign: SeasonalWishCampaign): string {
  const timestamp = localDateTimeInZone(campaign.endAt, campaign.timezone);
  if (timestamp === null) return campaign.endAt;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: campaign.timezone,
  }).format(timestamp);
}

export function formatCouponExpiry(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    !year || !month || !day ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}
