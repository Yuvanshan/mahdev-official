import React, { useState } from 'react';
import { ImageDown, Loader2 } from 'lucide-react';
import {
  InlineImageScanItem,
  migrateInlineImages,
  scanInlineImages,
} from '../../services/inlineImageMigration';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

/**
 * Manual, click-only tool. It makes no requests on mount: "Scan" reads services
 * and gallery once, "Optimise" uploads the inline images and saves the URLs.
 */
export const AdminInlineImageTool: React.FC = () => {
  const { refreshAll } = useFirestoreDataContext();
  const [items, setItems] = useState<InlineImageScanItem[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'migrating'>('idle');
  const [message, setMessage] = useState('');

  const totalKb = Math.round((items || []).reduce((sum, item) => sum + item.inlineBytes, 0) / 1024);

  const scan = async () => {
    setStatus('scanning');
    setMessage('');
    try {
      setItems(await scanInlineImages());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Scan failed.');
    } finally {
      setStatus('idle');
    }
  };

  const migrate = async () => {
    if (!items?.length) return;
    if (!window.confirm(`Upload ${items.length} record(s) of inline images to media storage and save the new URLs?`)) return;
    setStatus('migrating');
    try {
      const result = await migrateInlineImages((done, total) => setMessage(`Optimising ${done} of ${total}…`));
      setMessage(
        `Moved ${result.migratedImages} image(s) across ${result.migratedRecords} record(s).` +
        (result.failures.length ? ` ${result.failures.length} failed: ${result.failures.map((f) => `${f.collection}/${f.id} (${f.error})`).join('; ')}` : '')
      );
      setItems(null);
      // One refresh so the admin lists show the updated records.
      await refreshAll(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Optimisation failed.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ImageDown className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Optimise inline images</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Moves images saved directly inside service and gallery records into media storage, so pages load faster.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={scan}
            disabled={status !== 'idle'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {status === 'scanning' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Scan
          </button>
          <button
            type="button"
            onClick={migrate}
            disabled={status !== 'idle' || !items?.length}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'migrating' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Optimise
          </button>
        </div>
      </div>
      {items && (
        <div className="mt-3 text-xs text-slate-600">
          {items.length === 0 ? (
            <p>No inline images found. Everything is already optimised.</p>
          ) : (
            <>
              <p className="font-semibold">{items.length} record(s) hold about {totalKb} KB of inline images:</p>
              <ul className="mt-1 list-disc pl-5">
                {items.map((item) => (
                  <li key={`${item.collection}:${item.id}`}>
                    {item.collection} · {item.title} · {item.inlineImageCount} image(s), {Math.round(item.inlineBytes / 1024)} KB
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {message && <p className="mt-3 text-xs text-slate-700">{message}</p>}
    </div>
  );
};
