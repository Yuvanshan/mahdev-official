import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Building,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Search,
  Eye,
  X,
} from 'lucide-react';
import { Order } from '../../types/order';
import { CustomerUser } from '../../types/customer';
import { Button } from '../../components/ui/Button';
import { COMPANY_INFO } from '../../config/company';

interface AccountInvoicesTabProps {
  user: CustomerUser;
  orders: Order[];
  onNavigate: (path: string) => void;
}

export const AccountInvoicesTab: React.FC<AccountInvoicesTabProps> = ({
  user,
  orders,
  onNavigate,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((o) => {
    return (
      searchQuery === '' ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Tax Invoices & Settlement Vouchers ({orders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Official commercial invoices issued by Mahdev Pvt Ltd (PV 00284910).
            </p>
          </div>

          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices by reference..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
            />
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-slate-900">No Invoices Available</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Invoices are automatically generated when merchandise orders or service reservations are created.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    INV-{order.id.replace('ORD-', '')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className="font-display text-sm font-bold text-slate-900 truncate">
                    Order Ref: {order.id}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Issued: {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Items: {order.totalQuantity} • Recipient: {order.customer.fullName}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Amount Billed:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    ${order.total.toFixed(2)} {order.currency}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoice(order)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  className="flex-1 text-xs py-2 font-bold cursor-pointer"
                >
                  View Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedInvoice(order);
                    setTimeout(() => window.print(), 300);
                  }}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  className="text-xs py-2 cursor-pointer"
                  title="Print Invoice"
                >
                  Print
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal Preview */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border border-slate-200 relative print:border-none print:shadow-none print:p-0">
            {/* Close Button */}
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Invoice Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                <span className="text-xs font-mono font-bold tracking-wider text-[#0052FF] uppercase block">
                  Commercial Tax Invoice
                </span>
                <h2 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
                  {COMPANY_INFO.legalName}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Colombo: {COMPANY_INFO.offices.colombo.address}<br />
                  Trincomalee: {COMPANY_INFO.offices.trincomalee.address}<br />
                  {COMPANY_INFO.email} • {COMPANY_INFO.primaryPhone} / {COMPANY_INFO.secondaryPhone}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 block">
                  INV-{selectedInvoice.id.replace('ORD-', '')}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  Date:{' '}
                  {new Date(selectedInvoice.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span
                  className={`inline-block mt-2 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                    selectedInvoice.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  STATUS: {selectedInvoice.paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Bill To Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Billed To:</span>
                <strong className="text-slate-900 block">{selectedInvoice.customer.fullName}</strong>
                {selectedInvoice.customer.company && <p>{selectedInvoice.customer.company}</p>}
                <p className="text-slate-600">{selectedInvoice.customer.email}</p>
                <p className="text-slate-600">{selectedInvoice.customer.phone}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Fulfillment Details:</span>
                <p className="text-slate-600">Method: {selectedInvoice.deliveryInfo?.methodName || 'Standard Delivery'}</p>
                {selectedInvoice.deliveryInfo?.address ? (
                  <p className="text-slate-600">
                    {selectedInvoice.deliveryInfo.address.street}, {selectedInvoice.deliveryInfo.address.city}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">Digital Service / In-Person Reservation</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.productDiscounts > 0 && (
                  <div className="flex justify-between text-emerald-600 text-[11px]">
                    <span>Discount:</span>
                    <span className="font-mono">-${selectedInvoice.productDiscounts.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery & Handling:</span>
                  <span className="font-mono">${selectedInvoice.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Due / Paid:</span>
                  <span className="font-mono text-[#0052FF]">
                    ${selectedInvoice.total.toFixed(2)} {selectedInvoice.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified by Mahdev Secure Financial Accounting Service</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
                <Button variant="electric" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
