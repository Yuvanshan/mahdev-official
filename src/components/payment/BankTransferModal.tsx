import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Check, CheckCircle2, Copy, Loader2, MessageCircle, Upload, X } from 'lucide-react';
import { BANK_DETAILS } from '../../config/company';
import { MAHDEV_WHATSAPP_NUMBER } from '../../utils/whatsapp';
import { formatCurrency } from '../../utils/currency';
import { uploadPaymentSlip } from '../../services/bookingService';
import { PaymentSlipField } from './PaymentSlipField';
import type { BookingPaymentSlip } from '../../types/booking';

/**
 * "Pay now" while online card / LankaPay payments are switched off
 * (ONLINE_PAYMENT_GATEWAY_ENABLED): shows the bank account to transfer to and
 * lets the customer send the slip on WhatsApp, or upload it for a booking.
 * Nothing is marked as paid here; the admin accepts the slip once the money is received.
 */
interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Order or booking reference the customer should quote. */
  reference: string;
  /** Amount to pay now (e.g. the advance or the balance). */
  amount: number;
  /** Shown above the amount, e.g. "Advance" or "Balance due". */
  amountLabel?: string;
  currency?: string;
  /** For a booking: the slip is uploaded to it here (WhatsApp stays as a fallback). */
  bookingId?: string;
  onSlipUploaded?: (slip: BookingPaymentSlip) => void;
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  isOpen,
  onClose,
  reference,
  amount,
  amountLabel = 'Amount to pay',
  currency = 'LKR',
  bookingId,
  onSlipUploaded,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipAmount, setSlipAmount] = useState(() => (amount > 0 ? String(amount) : ''));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<BookingPaymentSlip | null>(null);
  if (!isOpen || typeof document === 'undefined') return null;

  const handleUpload = async () => {
    if (!bookingId) return;
    const value = Number(slipAmount);
    if (!slipFile) {
      setUploadError('Choose the slip photo or PDF first.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setUploadError('Enter the amount you transferred.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const slip = await uploadPaymentSlip(bookingId, slipFile, value);
      setUploaded(slip);
      onSlipUploaded?.(slip);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'The slip could not be uploaded. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked: the value is still visible to copy by hand.
    }
  };

  const rows: Array<[string, string]> = [
    ['Account name', BANK_DETAILS.accountName],
    ['Bank', BANK_DETAILS.bankName],
    ['Branch', BANK_DETAILS.branch],
    ['Account number', BANK_DETAILS.accountNumber],
  ].filter(([, value]) => value) as Array<[string, string]>;

  const slipMessage = [
    'Hello Mahdev,',
    '',
    amount > 0
      ? `I have made a bank transfer of ${formatCurrency(amount, currency)} for ${reference}.`
      : `I have made a bank transfer for ${reference}.`,
    'Please find the transfer slip attached.',
  ].join('\n');

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-transfer-title"
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-y-auto max-h-[calc(100vh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 id="bank-transfer-title" className="font-display font-bold text-base">Pay by bank transfer</h2>
              <p className="text-xs text-indigo-200">Reference: <span className="font-mono">{reference}</span></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            {/* No amount yet (price on quotation): pay what was agreed with our team. */}
            {amount > 0 ? (
              <>
                <div className="text-xs text-slate-500">{amountLabel}</div>
                <div className="font-mono text-3xl font-bold text-slate-900">{formatCurrency(amount, currency)}</div>
              </>
            ) : (
              <p className="text-sm text-slate-600">Pay the advance agreed with our team and enter the amount below.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="flex items-center gap-1.5">
                  <strong className="text-slate-900 font-mono">{value}</strong>
                  {(label === 'Account number' || label === 'Account name') && (
                    <button
                      type="button"
                      onClick={() => void copy(label, value)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      aria-label={`Copy ${label.toLowerCase()}`}
                    >
                      {copied === label ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-slate-500">Payment reference</span>
              <span className="flex items-center gap-1.5">
                <strong className="text-slate-900 font-mono">{reference}</strong>
                <button type="button" onClick={() => void copy('Reference', reference)} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Copy reference">
                  {copied === 'Reference' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
            </div>
          </div>

          <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
            <li>Transfer the amount to the account above using your bank app or at the bank.</li>
            <li>Use <strong>{reference}</strong> as the payment reference.</li>
            <li>
              {bookingId
                ? 'Upload the transfer slip below. We will update your booking once the payment is checked.'
                : 'Send us the transfer slip on WhatsApp. We will update your payment once it is received.'}
            </li>
          </ol>

          {bookingId && (uploaded ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>
                <div className="font-bold">Slip uploaded: {formatCurrency(uploaded.amount, currency)}</div>
                <p className="text-xs mt-0.5">Our team will check the payment and update your booking.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <PaymentSlipField
                file={slipFile}
                onFileChange={(file) => {
                  setSlipFile(file);
                  setUploadError(null);
                }}
                amount={slipAmount}
                onAmountChange={setSlipAmount}
                currency={currency}
                fileError={uploadError || undefined}
              />
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={uploading}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white text-sm font-semibold py-3 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading…' : 'Upload slip'}
              </button>
            </div>
          ))}

          <a
            href={`https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(slipMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={
              bookingId
                ? 'flex items-center justify-center gap-2 w-full rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold py-2.5'
                : 'flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3'
            }
          >
            <MessageCircle className="w-4 h-4" /> {bookingId ? 'Or send the slip on WhatsApp' : 'Send transfer slip on WhatsApp'}
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};
