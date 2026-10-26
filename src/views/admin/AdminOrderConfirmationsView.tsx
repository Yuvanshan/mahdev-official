import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Mail,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { ImageUploader } from '../../components/common/ImageUploader';
import { DIVISIONS } from '../../config/divisions';
import { BANK_DETAILS } from '../../config/company';
import { formatCurrency } from '../../utils/currency';
import {
  cancelConfirmation,
  createConfirmation,
  deleteConfirmation,
  listConfirmations,
  logWhatsAppShare,
  sendConfirmationLink,
  type ConfirmationInput,
  type ConfirmationItem,
  type OrderConfirmation,
} from '../../services/orderConfirmationService';

const emptyItem = (): ConfirmationItem => ({ name: '', description: '', quantity: 1, unitPrice: 0 });

const emptyForm = (): ConfirmationInput => ({
  title: '',
  divisionId: 'sws',
  divisionName: DIVISIONS.sws.name,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  designImages: [],
  items: [emptyItem()],
  eventDate: '',
  eventTime: '',
  venue: '',
  notes: '',
  discount: 0,
  deliveryFee: 0,
  advanceAmount: 0,
  expiresInDays: 14,
});

const STATUS_STYLES: Record<OrderConfirmation['status'], string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  expired: 'bg-rose-50 text-rose-700 border-rose-200',
};

const inputClass =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white';

/** wa.me link that opens WhatsApp with the message ready to send (no API needed). */
function whatsAppUrl(phone: string, text: string): string {
  // Saved numbers are +94…; wa.me wants digits only.
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;
}

const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** Sign-off: the division, then the company ("SWS Event Management," / "Mahdev Pvt Ltd"). */
const signature = (divisionName?: string) => (divisionName ? [`${divisionName},`, 'Mahdev Pvt Ltd'] : ['Mahdev Pvt Ltd']);

/** The confirmation link, sent before the customer confirms. */
function linkMessage(confirmation: OrderConfirmation): string {
  return [
    `Hello ${confirmation.customerName.split(' ')[0]},`,
    '',
    `Thank you for approving your design "${confirmation.title}" with ${confirmation.divisionName || 'Mahdev'}.`,
    '',
    'Please review the design and decoration details, enter your details and confirm your order here:',
    confirmation.shareUrl,
    '',
    `This link is valid until ${formatDay(confirmation.expiresAt)}.`,
    '',
    ...signature(confirmation.divisionName),
  ].join('\n');
}

/** The order confirmation reply, sent after the customer confirms. */
function receiptMessage(confirmation: OrderConfirmation): string {
  const name = confirmation.confirmedCustomer?.name || confirmation.customerName;
  const accountUrl = `${new URL(confirmation.shareUrl).origin}/account/bookings`;
  return [
    `Hello ${name.split(' ')[0]},`,
    '',
    `Your booking ${confirmation.bookingId} for "${confirmation.title}" is confirmed. Thank you!`,
    '',
    ...confirmation.items.map((item) => `- ${item.name} x${item.quantity}: ${formatCurrency(item.quantity * item.unitPrice, 'LKR')}`),
    `Total: ${formatCurrency(confirmation.total, 'LKR')}`,
    ...(confirmation.advanceAmount > 0 ? [`Advance to reserve the date: ${formatCurrency(confirmation.advanceAmount, 'LKR')}`] : []),
    ...(confirmation.eventDate ? [`Event date: ${formatDay(confirmation.eventDate)}`] : []),
    '',
    'Payment details (bank transfer):',
    `Account name: ${BANK_DETAILS.accountName}`,
    `Bank: ${BANK_DETAILS.bankName}`,
    ...(BANK_DETAILS.branch ? [`Branch: ${BANK_DETAILS.branch}`] : []),
    ...(BANK_DETAILS.accountNumber ? [`Account number: ${BANK_DETAILS.accountNumber}`] : []),
    'Please send the transfer slip here with your booking reference.',
    '',
    `Track your booking and view your invoice: ${accountUrl}`,
    '',
    ...signature(confirmation.divisionName),
  ].join('\n');
}

export const AdminOrderConfirmationsView: React.FC = () => {
  const [confirmations, setConfirmations] = useState<OrderConfirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderConfirmation['status']>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formData, setFormData] = useState<ConfirmationInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Remounts the uploader after each image so the next one can be added.
  const [uploaderKey, setUploaderKey] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [sharing, setSharing] = useState<OrderConfirmation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<OrderConfirmation | null>(null);
  const [deleting, setDeleting] = useState<OrderConfirmation | null>(null);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setConfirmations(await listConfirmations());
    } catch (err) {
      addToast('error', 'Could Not Load', err instanceof Error ? err.message : 'Confirmations could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return confirmations.filter((c) =>
      (statusFilter === 'all' || c.status === statusFilter) &&
      (!query ||
        [c.id, c.title, c.customerName, c.customerPhone, c.customerEmail, c.bookingId]
          .some((value) => String(value || '').toLowerCase().includes(query)))
    );
  }, [confirmations, searchQuery, statusFilter]);

  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    return { subtotal, total: subtotal - (Number(formData.discount) || 0) + (Number(formData.deliveryFee) || 0) };
  }, [formData.items, formData.discount, formData.deliveryFee]);

  const update = <K extends keyof ConfirmationInput>(key: K, value: ConfirmationInput[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: '' }));
    setIsDirty(true);
  };

  const updateItem = (index: number, patch: Partial<ConfirmationItem>) => {
    update('items', formData.items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addImage = (url: string) => {
    const clean = url.trim();
    if (!clean) return;
    if (formData.designImages.includes(clean)) return;
    update('designImages', [...formData.designImages, clean]);
  };

  const handleOpenCreate = () => {
    setFormData(emptyForm());
    setFormErrors({});
    setIsDirty(false);
    setImageUrlInput('');
    setUploaderKey((key) => key + 1);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (formData.customerName.trim().length < 2) errors.customerName = 'Customer name is required';
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) errors.customerEmail = 'Invalid email';
    if (!formData.customerEmail.trim() && !formData.customerPhone.trim()) errors.customerPhone = 'Add a phone or email to share the link';
    if (!formData.title.trim()) errors.title = 'Design title is required';
    if (formData.designImages.length === 0) errors.designImages = 'Add at least one design image';
    if (formData.items.some((item) => !item.name.trim())) errors.items = 'Every item needs a name';
    if (formData.discount > totals.subtotal) errors.discount = 'Discount is more than the subtotal';
    if (formData.advanceAmount > totals.total) errors.advanceAmount = 'Advance is more than the total';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const created = await createConfirmation({
        ...formData,
        items: formData.items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
        discount: Number(formData.discount) || 0,
        deliveryFee: Number(formData.deliveryFee) || 0,
        advanceAmount: Number(formData.advanceAmount) || 0,
      });
      setIsEditorOpen(false);
      setIsDirty(false);
      setConfirmations((current) => [created, ...current]);
      setSharing(created);
      addToast('success', 'Link Created', `Confirmation ${created.id} is ready to share.`);
    } catch (err) {
      addToast('error', 'Could Not Create', err instanceof Error ? err.message : 'Unable to create the confirmation link.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (confirmation: OrderConfirmation) => {
    try {
      await navigator.clipboard.writeText(confirmation.shareUrl);
      setCopiedId(confirmation.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast('warning', 'Copy Failed', 'Select the link and copy it manually.');
    }
  };

  const handleSendEmail = async (confirmation: OrderConfirmation) => {
    setIsSending(true);
    try {
      const { email } = await sendConfirmationLink(confirmation.id);
      if (email?.delivered) addToast('success', 'Email Sent', `The link was emailed to ${confirmation.customerEmail}.`);
      else addToast('warning', 'Email Not Sent', `${email?.notice || 'The email could not be sent.'} Use WhatsApp or copy the link instead.`);
      void load();
    } catch (err) {
      addToast('error', 'Send Failed', err instanceof Error ? err.message : 'Could not send the link.');
    } finally {
      setIsSending(false);
    }
  };

  // Opening WhatsApp happens in the browser; this only records it in the share history.
  const handleWhatsAppOpened = (confirmation: OrderConfirmation, kind: 'link' | 'receipt') => {
    logWhatsAppShare(confirmation.id, kind)
      .then(() => load())
      .catch((err) => console.warn('[DesignConfirmations] Could not record WhatsApp share:', err));
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteConfirmation(deleting.id);
      addToast('success', 'Link Deleted', deleting.status === 'confirmed'
        ? `${deleting.id} was deleted. Booking ${deleting.bookingId} is kept in Bookings.`
        : `${deleting.id} was deleted and can no longer be opened.`);
      setConfirmations((current) => current.filter((c) => c.id !== deleting.id));
      if (sharing?.id === deleting.id) setSharing(null);
      setDeleting(null);
    } catch (err) {
      addToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete the link.');
    }
  };

  const handleCancel = async () => {
    if (!cancelling) return;
    try {
      await cancelConfirmation(cancelling.id);
      addToast('success', 'Link Cancelled', `${cancelling.id} can no longer be confirmed.`);
      setCancelling(null);
      setSharing(null);
      void load();
    } catch (err) {
      addToast('error', 'Cancel Failed', err instanceof Error ? err.message : 'Could not cancel the link.');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-blue-600" /> Design Confirmations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Share a link with the approved design and decoration details. The customer creates an account and confirms, and the order appears in Orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={isLoading}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> New Confirmation Link
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone, design or reference..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={`${inputClass} sm:w-44`}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading && confirmations.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading confirmations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            {confirmations.length === 0 ? 'No confirmation links yet. Create one after a customer approves a design.' : 'No confirmations match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono font-bold">
                <tr>
                  <th className="py-3 px-4">Design</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {c.designImages[0] && <img src={c.designImages[0]} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />}
                        <div>
                          <div className="font-semibold text-slate-900">{c.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.id}{c.status === 'confirmed' ? ` → ${c.bookingId}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900">{c.customerName}</div>
                      <div className="text-[11px] text-slate-500">{c.customerPhone || c.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(c.total, 'LKR')}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => setSharing(c)}>
                          {c.status === 'pending' ? <><Send className="w-3.5 h-3.5 mr-1" /> Share</> : 'View'}
                        </Button>
                        {c.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => setCancelling(c)} title="Cancel link">
                            <Ban className="w-3.5 h-3.5 text-amber-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(c)} title="Delete link">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title="New Confirmation Link"
        subtitle="Design and decoration details the customer will confirm."
        isDirty={isDirty}
        onSave={handleSave}
        isSaving={isSaving}
        saveLabel="Create Link"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Customer name *" error={formErrors.customerName}>
              <input className={inputClass} value={formData.customerName} onChange={(e) => update('customerName', e.target.value)} />
            </Field>
            <Field label="WhatsApp / phone" error={formErrors.customerPhone}>
              <input className={inputClass} type="tel" placeholder="077 123 4567" value={formData.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} />
            </Field>
            <Field label="Email" error={formErrors.customerEmail}>
              <input className={inputClass} type="email" value={formData.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} />
            </Field>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Field label="Design title *" error={formErrors.title}>
                <input className={inputClass} placeholder="e.g. Wedding stage – gold & white theme" value={formData.title} onChange={(e) => update('title', e.target.value)} />
              </Field>
            </div>
            <Field label="Division">
              <select
                className={inputClass}
                value={formData.divisionId}
                onChange={(e) => {
                  const division = Object.values(DIVISIONS).find((d) => d.id === e.target.value);
                  setFormData((current) => ({ ...current, divisionId: e.target.value, divisionName: division?.name || e.target.value }));
                  setIsDirty(true);
                }}
              >
                {Object.values(DIVISIONS).map((division) => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </select>
            </Field>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Event date">
              <input className={inputClass} type="date" value={formData.eventDate} onChange={(e) => update('eventDate', e.target.value)} />
            </Field>
            <Field label="Time">
              <input className={inputClass} placeholder="e.g. 4:00 PM – 10:00 PM" value={formData.eventTime} onChange={(e) => update('eventTime', e.target.value)} />
            </Field>
            <Field label="Venue">
              <input className={inputClass} value={formData.venue} onChange={(e) => update('venue', e.target.value)} />
            </Field>
          </section>

          {/* Design images */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Design images *</h4>
            {formData.designImages.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {formData.designImages.map((url) => (
                  <div key={url} className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => update('designImages', formData.designImages.filter((image) => image !== url))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-rose-600 hover:bg-white"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <ImageUploader
              key={uploaderKey}
              category="portfolio"
              subfolder="design-confirmations"
              label="Upload Design Image"
              helperText="Upload each approved design image (up to 10)."
              onUploadSuccess={(item) => {
                addImage(item.url);
                setUploaderKey((key) => key + 1);
              }}
              disabled={formData.designImages.length >= 10}
              options={{ maxWidth: 1920, quality: 0.85, targetFormat: 'image/webp' }}
            />
            <div className="flex gap-2">
              <input className={inputClass} placeholder="…or paste an image URL" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addImage(imageUrlInput);
                  setImageUrlInput('');
                }}
              >
                Add
              </Button>
            </div>
            {formErrors.designImages && <p className="text-xs text-rose-600">{formErrors.designImages}</p>}
          </section>

          {/* Line items */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Decoration details *</h4>
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="col-span-12 md:col-span-5 space-y-2">
                  <input className={inputClass} placeholder="Item (e.g. Main stage backdrop)" value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} />
                  <textarea className={inputClass} rows={2} placeholder="Details: colours, flowers, size, materials…" value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="text-[10px] text-slate-500 font-semibold">Qty</label>
                  <input className={inputClass} type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} />
                </div>
                <div className="col-span-5 md:col-span-3">
                  <label className="text-[10px] text-slate-500 font-semibold">Unit price (LKR)</label>
                  <input className={inputClass} type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} />
                </div>
                <div className="col-span-3 md:col-span-2 flex items-end justify-end gap-1 h-full pt-4">
                  <span className="text-xs font-mono font-bold text-slate-700">{formatCurrency(item.quantity * item.unitPrice, 'LKR')}</span>
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => update('items', formData.items.filter((_, i) => i !== index))} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" aria-label="Remove item">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {formErrors.items && <p className="text-xs text-rose-600">{formErrors.items}</p>}
            <Button variant="outline" size="sm" onClick={() => update('items', [...formData.items, emptyItem()])} disabled={formData.items.length >= 50}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add item
            </Button>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Discount (LKR)" error={formErrors.discount}>
              <input className={inputClass} type="number" min={0} value={formData.discount} onChange={(e) => update('discount', Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Transport & setup (LKR)">
              <input className={inputClass} type="number" min={0} value={formData.deliveryFee} onChange={(e) => update('deliveryFee', Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Advance (LKR)" error={formErrors.advanceAmount}>
              <input className={inputClass} type="number" min={0} value={formData.advanceAmount} onChange={(e) => update('advanceAmount', Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Link valid for (days)">
              <input className={inputClass} type="number" min={1} max={60} value={formData.expiresInDays} onChange={(e) => update('expiresInDays', Math.min(60, Math.max(1, Math.floor(Number(e.target.value) || 14))))} />
            </Field>
          </section>

          <Field label="Notes shown to the customer">
            <textarea className={inputClass} rows={3} placeholder="Payment terms, what is included, setup time…" value={formData.notes} onChange={(e) => update('notes', e.target.value)} />
          </Field>

          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{formatCurrency(totals.subtotal, 'LKR')}</span></div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1"><span>Total</span><span className="font-mono">{formatCurrency(totals.total, 'LKR')}</span></div>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Share */}
      <AdminModal
        isOpen={Boolean(sharing)}
        onClose={() => setSharing(null)}
        title={sharing?.status === 'pending' ? 'Share Confirmation Link' : 'Confirmation Details'}
        subtitle={sharing ? `${sharing.id} · ${sharing.customerName}` : ''}
        maxWidth="xl"
      >
        {sharing && (
          <div className="space-y-5">
            {sharing.status === 'confirmed' ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900">
                  Confirmed{sharing.confirmedAt ? ` on ${new Date(sharing.confirmedAt).toLocaleString('en-GB')}` : ''}. Booking <strong className="font-mono">{sharing.bookingId}</strong> is in Bookings, where you can update its progress and record the advance and balance.
                </div>
                {(sharing.confirmedCustomer?.phone || sharing.customerPhone) ? (
                  <a
                    href={whatsAppUrl(sharing.confirmedCustomer?.phone || sharing.customerPhone, receiptMessage(sharing))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleWhatsAppOpened(sharing, 'receipt')}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5"
                  >
                    <MessageCircle className="w-4 h-4" /> Send Confirmation on WhatsApp
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">No phone number on this order to send a WhatsApp confirmation.</p>
                )}
              </div>
            ) : sharing.status !== 'pending' ? (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">This link is {sharing.status} and can no longer be confirmed.</div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Customer link</label>
                  <div className="flex gap-2">
                    <input readOnly value={sharing.shareUrl} className={`${inputClass} font-mono text-xs`} onFocus={(e) => e.target.select()} />
                    <Button variant="outline" size="sm" onClick={() => void handleCopy(sharing)}>
                      {copiedId === sharing.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <a href={sharing.shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 rounded-xl border border-slate-200 hover:bg-slate-50" title="Preview">
                      <ExternalLink className="w-4 h-4 text-slate-600" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500">Valid until {new Date(sharing.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Anyone with this link can confirm, so share it only with the customer.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sharing.customerPhone ? (
                    <a
                      href={whatsAppUrl(sharing.customerPhone, linkMessage(sharing))}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleWhatsAppOpened(sharing, 'link')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Send on WhatsApp
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 py-2">No phone number for WhatsApp</span>
                  )}
                  <Button variant="outline" size="sm" onClick={() => void handleSendEmail(sharing)} disabled={isSending || !sharing.customerEmail}>
                    <Mail className="w-4 h-4 mr-1.5" /> {isSending ? 'Sending...' : 'Send by Email'}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">"Send on WhatsApp" opens WhatsApp with the message ready; press send there.</p>
              </>
            )}

            {sharing.shareLog && sharing.shareLog.length > 0 && (
              <div className="text-xs text-slate-500 space-y-0.5">
                {sharing.shareLog.map((entry, index) => (
                  <div key={index}>
                    {entry.channel === 'email'
                      ? `Email ${entry.delivered ? 'sent' : 'not delivered'}`
                      : entry.channel === 'whatsapp_receipt'
                        ? 'WhatsApp confirmation opened'
                        : 'WhatsApp link opened'}{' '}
                    · {new Date(entry.at).toLocaleString('en-GB')}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-sm">
              <span className="text-slate-600">{sharing.items.length} item(s)</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(sharing.total, 'LKR')}</span>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminConfirmDialog
        isOpen={Boolean(deleting)}
        title="Delete confirmation link"
        message={deleting?.status === 'confirmed'
          ? `Delete the link for "${deleting.title}"? The customer's booking ${deleting.bookingId} stays in Bookings with its payments and invoice.`
          : `Delete the link for "${deleting?.title}"? The customer will no longer be able to open or confirm it.`}
        confirmLabel="Delete Link"
        allowSoftDelete={false}
        requireKeywordConfirm={false}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />

      <AdminConfirmDialog
        isOpen={Boolean(cancelling)}
        title="Cancel confirmation link"
        message={`The customer will no longer be able to confirm "${cancelling?.title}" with this link.`}
        confirmLabel="Cancel Link"
        cancelLabel="Keep Link"
        allowSoftDelete={false}
        onConfirm={handleCancel}
        onClose={() => setCancelling(null)}
      />
    </div>
  );
};

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-semibold text-slate-700">{label}</label>
    {children}
    {error && <p className="text-xs text-rose-600">{error}</p>}
  </div>
);
