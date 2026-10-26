import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Check, Copy, MessageCircle, X } from 'lucide-react';
import { BANK_DETAILS } from '../../config/company';
import { MAHDEV_WHATSAPP_NUMBER } from '../../utils/whatsapp';
import { formatCurrency } from '../../utils/currency';

/**
 * "Pay now" while online card / LankaPay payments are switched off
 * (ONLINE_PAYMENT_GATEWAY_ENABLED): shows the bank account to transfer to and
 * lets the customer send the slip on WhatsApp. Nothing is marked as paid here;
 * the admin records the payment once the money is received.
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
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  isOpen,
  onClose,
  reference,
  amount,
  amountLabel = 'Amount to pay',
  currency = 'LKR',
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  if (!isOpen || typeof document === 'undefined') return null;

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
    `I have made a bank transfer of ${formatCurrency(amount, currency)} for ${reference}.`,
    'Please find the transfer slip attached.',
  ].join('\n');

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-transfer-title"
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
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
            <div className="text-xs text-slate-500">{amountLabel}</div>
            <div className="font-mono text-3xl font-bold text-slate-900">{formatCurrency(amount, currency)}</div>
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
            <li>Send us the transfer slip on WhatsApp. We will update your payment once it is received.</li>
          </ol>

          <a
            href={`https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(slipMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3"
          >
            <MessageCircle className="w-4 h-4" /> Send transfer slip on WhatsApp
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};
