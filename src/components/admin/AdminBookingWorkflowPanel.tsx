import React, { useEffect, useState } from 'react';
import { Check, ListChecks, Plus, Receipt, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { bookingService } from '../../services/bookingService';
import { formatCurrency } from '../../utils/currency';
import type { Booking, BookingLineItem, BookingStatus } from '../../types/booking';

interface AdminBookingWorkflowPanelProps {
  booking: Booking;
  /** Admin name added to the internal notes when the step changes. */
  adminName: string;
  notify: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  onSaved: () => void;
  /** Cancel and reject ask for a reason in the page's own dialogs. */
  onCancel: () => void;
  onReject: () => void;
}

// Same steps the customer sees on their booking in My Account.
const PROCESS_STEPS: Array<{ status: BookingStatus; label: string }> = [
  { status: 'pending', label: 'Requested' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Completed' },
];

const inputClass = 'w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white';
const round = (value: number) => Math.round(value * 100) / 100;

/** Line items to edit: the saved ones, or one line for the booked item and its price. */
function initialLines(booking: Booking): BookingLineItem[] {
  if (booking.lineItems?.length) return booking.lineItems.map((item) => ({ ...item }));
  const base = booking.subtotal ?? Math.max(0, booking.price - (booking.deliveryFee || 0) + (booking.discount || 0));
  return [{ name: booking.serviceName, description: booking.packageName || '', quantity: 1, unitPrice: round(base) }];
}

/**
 * Booking process and charges for the admin:
 * - move the booking to any step (the customer is told in their account Alerts);
 * - edit invoice lines, discount and transport / delivery fee (the total follows).
 */
export const AdminBookingWorkflowPanel: React.FC<AdminBookingWorkflowPanelProps> = ({
  booking,
  adminName,
  notify,
  onSaved,
  onCancel,
  onReject,
}) => {
  const currency = booking.currency || 'LKR';
  const [isSaving, setIsSaving] = useState(false);
  const [lines, setLines] = useState<BookingLineItem[]>(() => initialLines(booking));
  const [discount, setDiscount] = useState(String(booking.discount || 0));
  const [deliveryFee, setDeliveryFee] = useState(String(booking.deliveryFee || 0));
  const [note, setNote] = useState('');

  // Reload the editor when another booking opens or the saved charges change.
  useEffect(() => {
    setLines(initialLines(booking));
    setDiscount(String(booking.discount || 0));
    setDeliveryFee(String(booking.deliveryFee || 0));
    setNote('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.id, booking.price, booking.updatedAt]);

  const stopped = booking.status === 'cancelled' || booking.status === 'rejected';
  const currentIndex = PROCESS_STEPS.findIndex((step) => step.status === booking.status);

  const moveTo = async (status: BookingStatus, label: string) => {
    if (status === booking.status) return;
    if (!window.confirm(`Move booking ${booking.id} to "${label}"? The customer will see this update.`)) return;
    setIsSaving(true);
    const result = await bookingService.adminSetStatus(booking.id, status, {
      adminNote: `[${adminName} - ${new Date().toLocaleDateString('en-GB')}]: Step changed to ${label}.`,
    });
    setIsSaving(false);
    if (result.success) {
      notify('success', 'Step Updated', `Booking ${booking.id} is now "${label}".`);
      onSaved();
    } else {
      notify('error', 'Could Not Update', result.error || 'The step could not be saved.');
    }
  };

  const subtotal = round(lines.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0));
  const total = round(subtotal - (Number(discount) || 0) + (Number(deliveryFee) || 0));
  const changed =
    total !== round(booking.price) ||
    JSON.stringify(lines) !== JSON.stringify(initialLines(booking)) ||
    Number(discount) !== (booking.discount || 0) ||
    Number(deliveryFee) !== (booking.deliveryFee || 0);

  const updateLine = (index: number, changes: Partial<BookingLineItem>) =>
    setLines((current) => current.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  const saveCharges = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const result = await bookingService.adminUpdateCharges(booking.id, {
      lineItems: lines,
      discount: Number(discount) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      note,
    });
    setIsSaving(false);
    if (result.success) {
      notify('success', 'Charges Updated', `Total for ${booking.id} is now ${formatCurrency(result.booking?.price || 0, currency)}.`);
      onSaved();
    } else {
      notify('error', 'Could Not Save', result.error || 'The charges could not be saved.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Booking process */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
          <ListChecks className="w-4 h-4 text-blue-600" /> Booking Process
        </div>
        {stopped && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
            This booking was {booking.status === 'cancelled' ? 'cancelled' : 'rejected'}. Choose a step below to reopen it.
          </p>
        )}
        <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PROCESS_STEPS.map((step, index) => {
            const isCurrent = step.status === booking.status;
            const isDone = !stopped && currentIndex > index;
            return (
              <li key={step.status}>
                <button
                  type="button"
                  disabled={isSaving || isCurrent}
                  onClick={() => void moveTo(step.status, step.label)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition-colors disabled:cursor-default ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : isDone
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${isCurrent ? 'bg-white text-blue-700' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {isDone ? <Check className="h-2.5 w-2.5" /> : index + 1}
                    </span>
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {!stopped && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving} className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50">
              Cancel booking
            </Button>
            {booking.status === 'pending' && (
              <Button variant="outline" size="sm" onClick={onReject} disabled={isSaving} className="h-8 text-xs text-slate-700">
                Reject (not available)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Charges: invoice lines, discount, transport / delivery */}
      <form onSubmit={saveCharges} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
          <Receipt className="w-4 h-4 text-blue-600" /> Charges & Total Fare
        </div>

        <div className="space-y-2">
          {lines.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-6">
                {index === 0 && <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Item</label>}
                <input className={inputClass} value={item.name} onChange={(e) => updateLine(index, { name: e.target.value })} placeholder="Item or service" />
              </div>
              <div className="col-span-3 sm:col-span-2">
                {index === 0 && <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Qty</label>}
                <input className={inputClass} type="number" min={1} value={item.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })} />
              </div>
              <div className="col-span-6 sm:col-span-3">
                {index === 0 && <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Unit price ({currency})</label>}
                <input className={inputClass} type="number" min={0} value={item.unitPrice} onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })} />
              </div>
              <div className="col-span-3 sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                  disabled={lines.length === 1}
                  className="p-2 text-rose-500 hover:text-rose-700 disabled:opacity-30"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((current) => [...current, { name: '', description: '', quantity: 1, unitPrice: 0 }])}
            className="h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add item
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Discount ({currency})</label>
            <input className={inputClass} type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Transport / delivery ({currency})</label>
            <input className={inputClass} type="number" min={0} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Note for the customer (optional)</label>
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Transport added for Trincomalee venue" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs">
          <span className="text-slate-600">
            Subtotal <strong className="font-mono">{formatCurrency(subtotal, currency)}</strong>
            {' '}- discount + transport =
          </span>
          <strong className="font-mono text-sm text-blue-700">{formatCurrency(total, currency)}</strong>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="electric" size="sm" disabled={isSaving || !changed} className="h-8 text-xs">
            Save charges & notify customer
          </Button>
        </div>
      </form>
    </div>
  );
};
