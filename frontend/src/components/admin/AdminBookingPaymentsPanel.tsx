import React, { useEffect, useState } from 'react';
import { Check, Download, ExternalLink, FileText, Plus, Receipt, Trash2, Wallet, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { bookingService, paymentSlipUrl } from '../../services/bookingService';
import { formatCurrency } from '../../utils/currency';
import { invoiceFromBooking, formatInvoiceDate } from '../../utils/invoiceDocument';
import { downloadInvoicePdf } from '../../utils/invoicePdf';
import type { Booking, BookingPaymentKind, BookingPaymentRecord, BookingPaymentSlip } from '../../types/booking';

interface AdminBookingPaymentsPanelProps {
  booking: Booking;
  /** Admin name stored on each payment record. */
  recordedBy: string;
  notify: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  onSaved: () => void;
}

const PAYMENT_METHODS = ['Bank transfer', 'Cash', 'Card', 'Cheque', 'Online'];
const KIND_LABELS: Record<BookingPaymentKind, string> = { advance: 'Advance', balance: 'Balance', other: 'Other' };
const SLIP_STATUS: Record<BookingPaymentSlip['status'], { label: string; tone: string }> = {
  submitted: { label: 'Waiting for review', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  accepted: { label: 'Accepted', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const inputClass = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white';
const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Advance & balance for a booking: set the advance needed to reserve the date,
 * record payments as they arrive (the payment status follows), and download the
 * invoice the customer sees.
 */
export const AdminBookingPaymentsPanel: React.FC<AdminBookingPaymentsPanelProps> = ({ booking, recordedBy, notify, onSaved }) => {
  const currency = booking.currency || 'LKR';
  const payments = booking.payments || [];
  // Newest first, so the slip waiting for review is at the top.
  const slips = [...(booking.paymentSlips || [])].reverse();
  const paid = booking.amountPaid ?? round(payments.reduce((sum, payment) => sum + payment.amount, 0));
  const balance = round(Math.max(0, booking.price - paid));
  const advance = booking.advanceAmount || 0;
  const advanceOutstanding = round(Math.max(0, advance - paid));

  const [advanceInput, setAdvanceInput] = useState(String(advance));
  const [form, setForm] = useState({ kind: 'advance' as BookingPaymentKind, amount: '', method: PAYMENT_METHODS[0], paidAt: new Date().toISOString().slice(0, 10), note: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAdvanceInput(String(booking.advanceAmount || 0));
  }, [booking.id, booking.advanceAmount]);

  const save = async (
    changes: { advanceAmount?: number; payments?: BookingPaymentRecord[] },
    success: string,
    customerUpdate: { title: string; message: string }
  ) => {
    setIsSaving(true);
    // customerUpdate appears in the customer's account Alerts.
    const result = await bookingService.updateBookingPayments(booking.id, changes, customerUpdate);
    setIsSaving(false);
    if (result.success) {
      notify('success', 'Payments Updated', success);
      onSaved();
      return true;
    }
    notify('error', 'Could Not Save', result.error || 'The payment could not be saved.');
    return false;
  };

  const handleSaveAdvance = () => {
    const value = Number(advanceInput);
    if (!Number.isFinite(value) || value < 0) {
      notify('warning', 'Check the Advance', 'Enter a valid advance amount.');
      return;
    }
    void save({ advanceAmount: round(value) }, `Advance set to ${formatCurrency(value, currency)}.`, {
      title: 'Advance amount updated',
      message: `The advance to reserve your date for ${booking.serviceName} is ${formatCurrency(value, currency)}.`,
    });
  };

  const prefill = (kind: BookingPaymentKind, amount: number) => setForm((current) => ({ ...current, kind, amount: String(amount) }));

  const handleAddPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = round(Number(form.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      notify('warning', 'Check the Amount', 'Enter the amount received.');
      return;
    }
    if (amount > balance + 0.005) {
      notify('warning', 'Too Much', `Only ${formatCurrency(balance, currency)} is outstanding on this booking.`);
      return;
    }
    const record: BookingPaymentRecord = {
      id: `PAY-${Date.now().toString(36).toUpperCase()}`,
      kind: form.kind,
      amount,
      method: form.method,
      note: form.note.trim() || undefined,
      paidAt: form.paidAt,
      recordedBy,
    };
    const saved = await save({ payments: [...payments, record] }, `${KIND_LABELS[form.kind]} of ${formatCurrency(amount, currency)} recorded.`, {
      title: 'Payment received',
      message: `We received your ${KIND_LABELS[form.kind].toLowerCase()} payment of ${formatCurrency(amount, currency)} for ${booking.serviceName}. Thank you.`,
    });
    if (saved) setForm((current) => ({ ...current, amount: '', note: '', kind: 'balance' }));
  };

  const handleRemove = (record: BookingPaymentRecord) => {
    if (!window.confirm(`Remove the ${KIND_LABELS[record.kind].toLowerCase()} payment of ${formatCurrency(record.amount, currency)}?`)) return;
    void save({ payments: payments.filter((payment) => payment.id !== record.id) }, 'Payment removed.', {
      title: 'Payment record corrected',
      message: `A payment of ${formatCurrency(record.amount, currency)} on your booking for ${booking.serviceName} was corrected by our team.`,
    });
  };

  /** Records the slip as a bank transfer payment and confirms a pending booking. */
  const handleAcceptSlip = async (slip: BookingPaymentSlip) => {
    const input = window.prompt(
      `Amount received for slip ${slip.id} (${currency}). Check it against your bank statement.`,
      String(Math.min(slip.amount, balance))
    );
    if (input === null) return;
    setIsSaving(true);
    const result = await bookingService.adminReviewPaymentSlip(booking.id, slip.id, { accept: true, amount: Number(input), reviewedBy: recordedBy });
    setIsSaving(false);
    if (!result.success) {
      notify('error', 'Could Not Accept', result.error || 'The slip could not be accepted.');
      return;
    }
    notify(
      'success',
      'Slip Accepted',
      booking.status === 'pending'
        ? `${formatCurrency(Number(input), currency)} recorded and the booking is confirmed.`
        : `${formatCurrency(Number(input), currency)} recorded.`
    );
    onSaved();
  };

  const handleRejectSlip = async (slip: BookingPaymentSlip) => {
    const reason = window.prompt('Why is this slip not accepted? The customer will see this.', 'The amount was not received in our account.');
    if (reason === null) return;
    setIsSaving(true);
    const result = await bookingService.adminReviewPaymentSlip(booking.id, slip.id, { accept: false, reason, reviewedBy: recordedBy });
    setIsSaving(false);
    if (!result.success) {
      notify('error', 'Could Not Reject', result.error || 'The slip could not be updated.');
      return;
    }
    notify('warning', 'Slip Rejected', 'The customer has been told why.');
    onSaved();
  };

  const handleDownload = async () => {
    try {
      await downloadInvoicePdf(invoiceFromBooking(booking));
    } catch (error) {
      console.error('[AdminBookingPayments] Invoice download failed:', error);
      notify('error', 'Download Failed', 'The invoice could not be created.');
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Wallet className="w-4 h-4 text-blue-600" /> Payments: Advance & Balance
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleDownload()} className="h-8 text-xs">
          <Download className="w-3.5 h-3.5 mr-1" /> Invoice PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          ['Total', formatCurrency(booking.price, currency), 'text-slate-900'],
          ['Advance needed', formatCurrency(advance, currency), 'text-blue-700'],
          ['Paid', formatCurrency(paid, currency), 'text-emerald-700'],
          ['Balance due', formatCurrency(balance, currency), balance > 0 ? 'text-amber-700' : 'text-emerald-700'],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
            <span className="block text-[10px] text-slate-500">{label}</span>
            <strong className={`font-mono text-sm ${tone}`}>{value}</strong>
          </div>
        ))}
      </div>

      {/* Advance needed to reserve the date */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-44">
          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Advance needed ({currency})</label>
          <input className={inputClass} type="number" min={0} max={booking.price} value={advanceInput} onChange={(e) => setAdvanceInput(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSaveAdvance} disabled={isSaving || Number(advanceInput) === advance}>
          Save advance
        </Button>
        {[25, 50].map((percent) => (
          <button
            key={percent}
            type="button"
            onClick={() => setAdvanceInput(String(round((booking.price * percent) / 100)))}
            className="text-[11px] font-semibold text-blue-700 hover:underline"
          >
            {percent}%
          </button>
        ))}
      </div>

      {/* Transfer slips uploaded by the customer */}
      {slips.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <Receipt className="w-3.5 h-3.5 text-blue-600" /> Customer transfer slips
          </div>
          {slips.map((slip) => {
            const url = paymentSlipUrl(booking.id, slip.id);
            const status = SLIP_STATUS[slip.status] || SLIP_STATUS.submitted;
            return (
              <div key={slip.id} className="flex flex-col sm:flex-row gap-3 rounded-lg border border-slate-200 p-3">
                <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0" title="Open the slip">
                  {slip.contentType.startsWith('image/') ? (
                    <img src={url} alt={`Transfer slip ${slip.id}`} className="w-28 h-28 rounded-lg object-cover border border-slate-200 bg-slate-50" />
                  ) : (
                    <div className="w-28 h-28 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-500">
                      <FileText className="w-7 h-7" />
                      <span className="text-[10px] font-semibold">PDF</span>
                    </div>
                  )}
                </a>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-mono text-sm text-slate-900">{formatCurrency(slip.amount, currency)}</strong>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${status.tone}`}>{status.label}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {slip.id} · uploaded {new Date(slip.uploadedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{slip.fileName}</div>
                  {slip.reviewedAt && (
                    <div className="text-[11px] text-slate-500">
                      Reviewed by {slip.reviewedBy || 'Admin'} on {formatInvoiceDate(slip.reviewedAt)}
                      {slip.reviewNote ? ` · ${slip.reviewNote}` : ''}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <ExternalLink className="w-3.5 h-3.5" /> Open slip
                    </a>
                    {slip.status === 'submitted' && (
                      <>
                        <Button variant="primary" size="sm" className="h-8 text-xs" disabled={isSaving || booking.price <= 0} onClick={() => void handleAcceptSlip(slip)}>
                          <Check className="w-3.5 h-3.5 mr-1" /> {booking.status === 'pending' ? 'Accept & confirm booking' : 'Accept payment'}
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs text-rose-700" disabled={isSaving} onClick={() => void handleRejectSlip(slip)}>
                          <X className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                  {slip.status === 'submitted' && booking.price <= 0 && (
                    <p className="text-[11px] text-amber-700">Set the booking charges above before accepting this payment.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record a payment */}
      {balance > 0 ? (
        <form onSubmit={handleAddPayment} className="rounded-lg border border-dashed border-slate-300 p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-semibold text-slate-700">Record payment:</span>
            {advanceOutstanding > 0 && (
              <button type="button" onClick={() => prefill('advance', advanceOutstanding)} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100">
                Advance {formatCurrency(advanceOutstanding, currency)}
              </button>
            )}
            <button type="button" onClick={() => prefill('balance', balance)} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100">
              Full balance {formatCurrency(balance, currency)}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <select className={inputClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as BookingPaymentKind })}>
              <option value="advance">Advance</option>
              <option value="balance">Balance</option>
              <option value="other">Other</option>
            </select>
            <input className={inputClass} type="number" min={0} step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <select className={inputClass} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
            </select>
            <input className={inputClass} type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
            <input className={inputClass} placeholder="Slip no. / note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" className="h-8 text-xs" disabled={isSaving}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {isSaving ? 'Saving...' : 'Add payment'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-[11px] text-emerald-700 font-semibold">Fully paid.</p>
      )}

      {payments.length > 0 && (
        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div>
                <span className="font-semibold text-slate-900">{KIND_LABELS[payment.kind]}</span>
                <span className="text-slate-500"> · {payment.method} · {formatInvoiceDate(payment.paidAt)}</span>
                {payment.note && <span className="text-slate-400"> · {payment.note}</span>}
              </div>
              <div className="flex items-center gap-2">
                <strong className="font-mono text-slate-900">{formatCurrency(payment.amount, currency)}</strong>
                <button type="button" onClick={() => handleRemove(payment)} className="p-1 text-rose-500 hover:bg-rose-50 rounded" aria-label="Remove payment" disabled={isSaving}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
