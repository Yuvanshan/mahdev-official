// What this visitor searched for and looked at, kept only in this browser (localStorage).
// It is never sent to the server; it only orders the "Suggested for You" row.
const STORAGE_KEY = 'mahdev_usage_v1';
const MAX_SEARCHES = 20;
const MAX_VIEWS = 40;
const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'from', 'your', 'our', 'all', 'new']);

interface UsageProfile {
  searches: string[];
  views: string[];
}

function load(): UsageProfile {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Partial<UsageProfile>;
    return {
      searches: Array.isArray(parsed.searches) ? parsed.searches.filter((item) => typeof item === 'string') : [],
      views: Array.isArray(parsed.views) ? parsed.views.filter((item) => typeof item === 'string') : [],
    };
  } catch {
    return { searches: [], views: [] };
  }
}

function save(profile: UsageProfile): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage may be full or blocked; suggestions just fall back to popular items.
  }
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 120);

export function recordSearch(query: string): void {
  const value = clean(query);
  if (value.length < 2) return;
  const profile = load();
  save({ ...profile, searches: [value, ...profile.searches.filter((item) => item !== value)].slice(0, MAX_SEARCHES) });
}

/** Text describing something the visitor opened (name, category, tags). */
export function recordView(text: string): void {
  const value = clean(text);
  if (!value) return;
  const profile = load();
  save({ ...profile, views: [value, ...profile.views.filter((item) => item !== value)].slice(0, MAX_VIEWS) });
}

/** Word weights from the profile: searches count double, newer entries count more. */
export function getInterestWeights(): Map<string, number> {
  const profile = load();
  const weights = new Map<string, number>();
  const add = (entries: string[], factor: number) =>
    entries.forEach((entry, index) => {
      const recency = 1 - index / (entries.length + 1);
      entry.split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word)).forEach((word) =>
        weights.set(word, (weights.get(word) || 0) + factor * recency));
    });
  add(profile.searches, 2);
  add(profile.views, 1);
  return weights;
}

/** How well a record's text matches the visitor's interests (0 when nothing matches). */
export function scoreInterest(text: string, weights: Map<string, number>): number {
  if (weights.size === 0) return 0;
  const words = new Set(clean(text).split(/[^a-z0-9]+/));
  let score = 0;
  weights.forEach((weight, word) => {
    if (words.has(word)) score += weight;
  });
  return score;
}

/** Latest searches first, for the search box drop-down. */
export function getRecentSearches(limit = 8): string[] {
  return load().searches.slice(0, limit);
}

export function clearSearches(): void {
  save({ ...load(), searches: [] });
}
