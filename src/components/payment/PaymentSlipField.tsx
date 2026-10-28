import React, { useEffect, useId, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { PAYMENT_SLIP_TYPES, paymentSlipFileError } from '../../services/bookingService';

interface PaymentSlipFieldProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  currency?: string;
  /** Shown under the file picker / the amount. */
  fileError?: string;
  amountError?: string;
  /** False when the slip may be added later (e.g. price still on quotation). */
  required?: boolean;
}

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/15';

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Bank transfer slip picker (image or PDF) with the amount transferred. */
export const PaymentSlipField: React.FC<PaymentSlipFieldProps> = ({
  file,
  onFileChange,
  amount,
  onAmountChange,
  currency = 'LKR',
  fileError,
  amountError,
  required = true,
}) => {
  const inputId = useId();
  const amountId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  // Image slips get a thumbnail; the object URL is released when the file changes.
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] || null;
    event.target.value = ''; // Lets the same file be picked again after removing it.
    if (!picked) return;
    const problem = paymentSlipFileError(picked);
    setPickError(problem);
    if (!problem) onFileChange(picked);
  };

  const shownFileError = pickError || fileError;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-slate-700">
          Transfer slip {required ? '' : '(optional)'}
        </span>
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            {preview ? (
              <img src={preview} alt="Selected transfer slip" className="h-14 w-14 rounded-lg object-cover border border-emerald-200 bg-white" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-white border border-emerald-200 flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-rose-600"
              aria-label="Remove slip"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors hover:bg-slate-50 ${
              shownFileError ? 'border-rose-300 bg-rose-50/40' : 'border-slate-300'
            }`}
          >
            <Upload className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">Upload slip photo or PDF</span>
            <span className="text-[11px] text-slate-500">JPG, PNG, WebP or PDF, up to 10 MB</span>
          </label>
        )}
        <input
          id={inputId}
          type="file"
          accept={PAYMENT_SLIP_TYPES.join(',')}
          onChange={handlePick}
          className="sr-only"
          aria-invalid={shownFileError ? true : undefined}
        />
        {shownFileError && <p role="alert" className="text-xs font-medium text-rose-600">{shownFileError}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={amountId} className="block text-xs font-semibold text-slate-700">
          Amount transferred ({currency})
        </label>
        <input
          id={amountId}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className={INPUT_CLASS}
          aria-invalid={amountError ? true : undefined}
        />
        {amountError && <p className="text-xs font-medium text-rose-600">{amountError}</p>}
      </div>
    </div>
  );
};
