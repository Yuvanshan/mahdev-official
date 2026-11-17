import { apiFetch } from '../lib/apiClient';

export interface SearchHistoryRecord {
  id: string;
  query: string;
  scope: string;
  createdAt: string;
}

const PATH = '/search-history';

// Sends one header-search term so the admin can see what customers look for.
// Fire and forget: a failed report must never block the search itself.
export function reportSearch(query: string, scope: string): void {
  void apiFetch(PATH, { method: 'POST', body: JSON.stringify({ query, scope }) }).catch(() => undefined);
}

// Admin only: uses the admin session cookie.
export async function listSearchHistory(): Promise<SearchHistoryRecord[]> {
  const result = await apiFetch<{ searches: SearchHistoryRecord[] }>(PATH, { credentials: 'include' });
  return result.searches;
}

export async function deleteSearchHistory(id: string): Promise<void> {
  await apiFetch(PATH, { method: 'DELETE', params: { id }, credentials: 'include' });
}
