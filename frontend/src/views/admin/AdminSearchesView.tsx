import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Trash2 } from 'lucide-react';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { deleteSearchHistory, listSearchHistory, SearchHistoryRecord } from '../../services/searchHistoryService';

// What customers typed in the header search: top terms and the latest searches.
export const AdminSearchesView: React.FC = () => {
  const [searches, setSearches] = useState<SearchHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = (type: ToastMessage['type'], message: string) =>
    setToasts((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, type, message }]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setSearches(await listSearchHistory());
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Search history could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const topTerms = useMemo(() => {
    const counts = new Map<string, number>();
    searches.forEach((entry) => counts.set(entry.query, (counts.get(entry.query) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [searches]);

  const visible = searches.filter((entry) => entry.query.includes(query.trim().toLowerCase()));

  const remove = async (entry: SearchHistoryRecord) => {
    try {
      await deleteSearchHistory(entry.id);
      setSearches((prev) => prev.filter((item) => item.id !== entry.id));
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'The entry could not be deleted.');
    }
  };

  return (
    <div className="space-y-4">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Search History</h1>
          <p className="text-xs text-slate-500">Latest {searches.length} searches from the website header. No customer details are stored. Delete any entry that holds personal data.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-600">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {topTerms.length > 0 && (
        <section aria-label="Most searched terms" className="rounded-sm border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Most searched</h2>
          <ul className="flex flex-wrap gap-2">
            {topTerms.map(([term, count]) => (
              <li key={term} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-800">
                {term} <span className="font-semibold text-blue-700">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <label className="flex items-center gap-2 rounded-sm border border-slate-300 bg-white px-3">
        <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter searches" aria-label="Filter searches" className="w-full bg-transparent py-2 text-sm outline-none" />
      </label>

      <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Search</th>
              <th className="px-3 py-2">Searched in</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((entry) => (
              <tr key={entry.id}>
                <td className="px-3 py-2 font-medium text-slate-900">{entry.query}</td>
                <td className="px-3 py-2 capitalize">{entry.scope}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString('en-GB')}</td>
                <td className="px-3 py-2 text-right">
                  <button type="button" onClick={() => void remove(entry)} aria-label={`Delete search ${entry.query}`} className="p-1.5 text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && visible.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-10 text-center text-sm text-slate-500">No searches yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
