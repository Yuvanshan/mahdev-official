import React, { useMemo, useState } from 'react';
import { Download, Eye, FileText, Loader2, Search, X } from 'lucide-react';
import { Order } from '../../types/order';
import { Booking } from '../../types/booking';
import { CustomerUser } from '../../types/customer';
import { BANK_DETAILS, COMPANY_INFO } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { formatCurrency } from '../../utils/currency';
import {
  bookingHasInvoice,
  formatInvoiceDate,
  invoiceFromBooking,
  invoiceFromOrder,
  type InvoiceDocument,
  type InvoiceStatus,
} from '../../utils/invoiceDocument';
import { downloadInvoicePdf } from '../../utils/invoicePdf';

interface AccountInvoicesTabProps {
  user: CustomerUser;
  orders: Order[];
  bookings: Booking[];
  onNavigate: (path: string) => void;
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Advance paid': 'bg-blue-50 text-blue-700 border-blue-200',
  'Partly paid': 'bg-blue-50 text-blue-700 border-blue-200',
  Unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
  Refunded: 'bg-slate-100 text-slate-600 border-slate-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const AccountInvoicesTab: React.FC<AccountInvoicesTabProps> = ({ orders, bookings }) => {
  const { companySettings } = useFirestoreDataContext();
  const company = {
    legalName: companySettings?.legalName || COMPANY_INFO.legalName,
    addresses: [
      companySettings?.offices?.colombo?.address || COMPANY_INFO.offices.colombo.address,
      companySettings?.offices?.trincomalee?.address || COMPANY_INFO.offices.trincomalee.address,
    ],
    phone: companySettings?.primaryPhone || COMPANY_INFO.primaryPhone,
    email: companySettings?.email || COMPANY_INFO.email,
  };
  const [selected, setSelected] = useState<InvoiceDocument | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const invoices = useMemo(
    () =>
      [...bookings.filter(bookingHasInvoice).map(invoiceFromBooking), ...orders.map(invoiceFromOrder)].sort(
        (a, b) => new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime()
      ),
    [orders, bookings]
  );

  const filtered = invoices.filter((invoice) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      !query ||
      [invoice.number, invoice.reference, invoice.title, ...invoice.items.map((item) => item.name)]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  });

  const handleDownload = async (invoice: InvoiceDocument) => {
    setDownloading(invoice.number);
    setDownloadError(null);
    try {
      await downloadInvoicePdf(invoice, company);
    } catch (error) {
      console.error('[Invoices] PDF download failed:', error);
      setDownloadError('The invoice could not be downloaded. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const DownloadButton: React.FC<{ invoice: InvoiceDocument; primary?: boolean }> = ({ invoice, primary }) => (
    <button
      type="button"
      onClick={() => void handleDownload(invoice)}
      disabled={downloading === invoice.number}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${
        primary ? 'bg-[#1e1b4b] text-white hover:bg-[#312e81]' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {downloading === invoice.number ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      Download PDF
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">Invoices ({invoices.length})</h3>
          <p className="text-xs text-slate-500">Invoices for your bookings and orders with {company.legalName}.</p>
        </div>
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
          />
        </div>
      </div>

      {downloadError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{downloadError}</div>}

      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="font-display text-base font-bold text-slate-900">No invoices yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'No invoices match your search.' : 'Invoices appear here once you confirm a booking or place an order.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((invoice) => (
            <div key={invoice.number} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="h-1.5 bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#c49a2c]" />
              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-[#1e1b4b]">{invoice.number}</span>
                    <h4 className="font-display text-sm font-bold text-slate-900 truncate mt-0.5">{invoice.title || invoice.items[0]?.name || invoice.reference}</h4>
                    <p className="text-[11px] text-slate-500">{invoice.divisionName || (invoice.kind === 'order' ? 'Order' : 'Booking')} · {formatInvoiceDate(invoice.issuedAt)}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[invoice.status]}`}>{invoice.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <span className="block text-[10px] text-slate-500">Total</span>
                    <strong className="font-mono text-slate-900">{formatCurrency(invoice.total, invoice.currency)}</strong>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <span className="block text-[10px] text-slate-500">Balance due</span>
                    <strong className={`font-mono ${invoice.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{formatCurrency(invoice.balance, invoice.currency)}</strong>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(invoice)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <DownloadButton invoice={invoice} primary />
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-6" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-[#1e1b4b] text-white px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#c49a2c]">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-1.5">
                  <img src="/logo.png" alt={company.legalName} className="h-12 w-auto" />
                </div>
                <div>
                  <div className="font-display font-bold">{selected.divisionName || company.legalName}</div>
                  {selected.divisionName && <div className="text-xs text-indigo-200">{company.legalName}</div>}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="font-display text-2xl font-bold tracking-wide">INVOICE</div>
                <div className="font-mono text-sm text-[#e8c766]">{selected.number}</div>
                <div className="text-xs text-indigo-200">Issued {formatInvoiceDate(selected.issuedAt)}</div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="absolute right-6 top-6 sm:static p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#c49a2c]">From</div>
                  <div className="font-bold text-slate-900">{selected.divisionName || company.legalName}</div>
                  {company.addresses.map((address) => <div key={address} className="text-slate-500">{address}</div>)}
                  <div className="text-slate-500">{company.phone} · {company.email}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#c49a2c]">Billed to</div>
                  <div className="font-bold text-slate-900">{selected.billedTo.name}</div>
                  {selected.billedTo.company && <div className="text-slate-500">{selected.billedTo.company}</div>}
                  {selected.billedTo.address && <div className="text-slate-500">{selected.billedTo.address}</div>}
                  <div className="text-slate-500">{selected.billedTo.phone}</div>
                  <div className="text-slate-500">{selected.billedTo.email}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#c49a2c]">{selected.kind === 'booking' ? 'Booking' : 'Order'}</div>
                  <div className="font-bold text-slate-900">{selected.title || selected.reference}</div>
                  <div className="text-slate-500">Ref: <span className="font-mono">{selected.reference}</span></div>
                  {selected.event?.date && <div className="text-slate-500">Event: {formatInvoiceDate(selected.event.date)}{selected.event.time && selected.event.time !== 'To be confirmed' ? `, ${selected.event.time}` : ''}</div>}
                  {selected.event?.venue && <div className="text-slate-500">Venue: {selected.event.venue}</div>}
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[selected.status]}`}>{selected.status}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1e1b4b] text-white text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit price</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.items.map((item, index) => (
                      <tr key={index} className={index % 2 ? 'bg-slate-50/60' : ''}>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.description && <div className="text-[11px] text-slate-500 whitespace-pre-line">{item.description}</div>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unitPrice, selected.currency)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(item.amount, selected.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 text-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1e1b4b] mb-1">Payment details (bank transfer)</div>
                  {[
                    ['Account name', BANK_DETAILS.accountName],
                    ['Bank', BANK_DETAILS.bankName],
                    ['Branch', BANK_DETAILS.branch],
                    ['Account no.', BANK_DETAILS.accountNumber],
                    ['Reference', selected.reference],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3">
                      <span className="text-slate-500">{label}</span>
                      <strong className="font-mono text-slate-900">{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="text-xs space-y-1.5">
                  <Row label="Subtotal" value={formatCurrency(selected.subtotal, selected.currency)} />
                  {selected.discount > 0 && <Row label="Discount" value={`- ${formatCurrency(selected.discount, selected.currency)}`} tone="text-emerald-700" />}
                  {selected.fee > 0 && <Row label={selected.feeLabel} value={formatCurrency(selected.fee, selected.currency)} />}
                  {selected.tax > 0 && <Row label="Tax" value={formatCurrency(selected.tax, selected.currency)} />}
                  <div className="flex justify-between rounded-xl bg-[#1e1b4b] text-white px-3 py-2 text-sm font-bold">
                    <span>Total</span>
                    <span className="font-mono">{formatCurrency(selected.total, selected.currency)}</span>
                  </div>
                  <Row label="Paid" value={formatCurrency(selected.paid, selected.currency)} />
                  <Row
                    label="Balance due"
                    value={formatCurrency(selected.balance, selected.currency)}
                    tone={selected.balance > 0 ? 'text-[#a47f1c] font-bold text-sm' : 'text-emerald-700 font-bold text-sm'}
                  />
                  {selected.advanceAmount > 0 && selected.paid < selected.advanceAmount && (
                    <p className="text-[11px] text-amber-700">Advance to reserve the date: {formatCurrency(selected.advanceAmount, selected.currency)}</p>
                  )}
                </div>
              </div>

              {selected.payments.length > 0 && (
                <div className="text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#c49a2c] mb-1.5">Payments received</div>
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {selected.payments.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-2">
                        <span className="text-slate-600">{formatInvoiceDate(payment.date)} · {payment.label} · {payment.method}</span>
                        <strong className="font-mono text-slate-900">{formatCurrency(payment.amount, selected.currency)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.notes && (
                <div className="text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#c49a2c] mb-1">Notes & terms</div>
                  <p className="text-slate-600 whitespace-pre-line">{selected.notes}</p>
                </div>
              )}
            </div>

            <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">Thank you for choosing {selected.divisionName || COMPANY_INFO.name}.</span>
              <DownloadButton invoice={selected} primary />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone = 'text-slate-600' }) => (
  <div className={`flex justify-between px-1 ${tone}`}>
    <span>{label}</span>
    <span className="font-mono">{value}</span>
  </div>
);
