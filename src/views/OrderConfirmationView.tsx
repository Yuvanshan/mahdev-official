import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Truck,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  Building,
  Copy,
  Printer,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  FileText,
  Check,
  Search,
  Lock,
  RefreshCw,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { Order } from '../types/order';
import { PaymentTransaction, VerificationResult } from '../types/payment';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SEOHead } from '../components/layout/SEOHead';
import { PaymentGatewayModal } from '../components/payment/PaymentGatewayModal';
import { COMPANY_INFO } from '../config/company';

interface OrderConfirmationViewProps {
  orderId?: string;
  onNavigate: (path: string) => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  orderId,
  onNavigate,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [lookupId, setLookupId] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [latestVerification, setLatestVerification] = useState<VerificationResult | null>(null);

  const loadOrderAndTransactions = async (id: string) => {
    const found = orderService.getOrderById(id);
    setOrder(found);
    if (found) {
      const txns = await paymentService.getOrderTransactions(found.id);
      setTransactions(txns);
      const paidTxn = txns.find((t) => t.paymentStatus === 'paid');
      if (paidTxn?.verificationResult) {
        setLatestVerification(paidTxn.verificationResult);
      }
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrderAndTransactions(orderId);
    } else {
      const all = orderService.getAllOrders();
      if (all.length > 0) {
        loadOrderAndTransactions(all[0].id);
      }
    }
  }, [orderId]);

  const handleCopyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    const found = orderService.getOrderById(lookupId);
    if (found) {
      loadOrderAndTransactions(found.id);
      setLookupError(null);
      onNavigate(`/order/${found.id}`);
    } else {
      setLookupError(`No order found matching "${lookupId}". Please check the ID format (e.g. ORD-2026-8941).`);
    }
  };

  const handlePaymentSuccess = async (verified: VerificationResult) => {
    setLatestVerification(verified);
    if (order) {
      await loadOrderAndTransactions(order.id);
    }
  };

  const getWhatsAppConciergeLink = () => {
    if (!order) return '#';
    const text = encodeURIComponent(
      `Hello Mahdev Concierge,\n\nI have placed an order with ID: *${order.id}* for $${order.total.toFixed(
        2
      )}.\n\nCustomer: ${order.customer.fullName} (${order.customer.email})\nPayment Status: ${order.paymentStatus.toUpperCase()}\n\nPlease verify receipt and transition details.`
    );
    return `https://wa.me/94750928078?text=${text}`;
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">
              We could not find an order matching that reference. You can lookup your order below using your Order ID.
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="e.g. ORD-2026-8941"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 uppercase font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <Button type="submit" variant="electric" size="sm" className="text-xs">
                Search
              </Button>
            </div>
            {lookupError && <p className="text-[11px] text-rose-600 text-left">{lookupError}</p>}
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => onNavigate('/catalog')} className="text-xs">
              Go to Catalog
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('/')} className="text-xs">
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <SEOHead
        title={`Order ${order.id} | Mahdev Pvt Ltd`}
        description={`Order confirmation and payment processing details for order ${order.id}.`}
        canonicalUrl={`https://mahdev.lk/order/${order.id}`}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Printable Corporate Invoice Header */}
        <div className="hidden print:flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-display">{COMPANY_INFO.legalName}</h1>
            <p className="text-xs text-slate-600 mt-1">Official Tax Invoice & Order Settlement Receipt</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Registration Ref: {COMPANY_INFO.registrationNumber} • VAT/SVAT Compliant</p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-0.5 font-sans">
            <p className="font-semibold text-slate-900">Colombo: {COMPANY_INFO.offices.colombo.address}</p>
            <p className="font-semibold text-slate-900">Trincomalee: {COMPANY_INFO.offices.trincomalee.address}</p>
            <p>Hotlines: {COMPANY_INFO.primaryPhone} | {COMPANY_INFO.secondaryPhone}</p>
            <p>Email: {COMPANY_INFO.email} • Web: {COMPANY_INFO.domain}</p>
          </div>
        </div>

        {/* Top Actions & Order Status Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}
              >
                {isPaid ? <ShieldCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Order Reference:</span>
                  <span className="font-mono text-base font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {order.id}
                  </span>
                  <button
                    onClick={handleCopyOrderId}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy Order ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <h1 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {isPaid ? 'Order Confirmed & Payment Verified' : 'Order Registered — Awaiting Payment'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on{' '}
                  {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                  order.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Status: {order.status.toUpperCase()}</span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payment: {order.paymentStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT GATEWAY STATE CARD */}
          {!isPaid ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-4 shadow-md">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">
                      Phase 13: Secure Payment Gateway Ready
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Amount Payable:{' '}
                      <strong className="text-emerald-400 font-mono">
                        ${order.total.toFixed(2)} {order.currency}
                      </strong>{' '}
                      • Server-side HMAC verified
                    </span>
                  </div>
                </div>

                <Button
                  variant="electric"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(true)}
                  rightIcon={<Zap className="w-4 h-4" />}
                  className="text-xs px-5 py-2.5 font-bold shadow-lg shadow-blue-500/20"
                >
                  Pay Now with Gateway
                </Button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Connect directly to our multi-gateway transaction processor (Stripe International Cards, LankaPay National Switch IPG, and Corporate Telegraphic Transfer). Payment status is verified cryptographically on the server before updating your order.
              </p>

              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>3D Secure 2.0 Strong Customer Authentication (SCA) Protected</span>
                </div>
                <a
                  href={getWhatsAppConciergeLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Concierge Verification</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-emerald-950">
                      Payment Confirmed & Verified Server-Side
                    </h3>
                    <span className="text-[11px] text-emerald-700">
                      Settlement verified cryptographically on Mahdev Core Server
                    </span>
                  </div>
                </div>

                <Badge size="sm" variant="default" className="bg-emerald-200 text-emerald-900 border-emerald-300 text-[10px]">
                  VERIFIED PAID
                </Badge>
              </div>

              {latestVerification && (
                <div className="p-3.5 bg-white rounded-xl border border-emerald-200/90 text-xs font-mono grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Auth Code:</span>
                    <strong className="text-slate-900">{latestVerification.authCode}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">RRN (Retrieval Ref):</span>
                    <strong className="text-slate-900">{latestVerification.rrn}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Verified Method:</span>
                    <strong className="text-slate-900">{latestVerification.cardBrand} ({latestVerification.maskedCard})</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Customer Information */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs">
                <User className="w-4 h-4 text-blue-600" />
                <span>Customer & Contact Information</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>
                  <strong className="text-slate-900">Name:</strong> {order.customer.fullName}
                </p>
                <p>
                  <strong className="text-slate-900">Email:</strong> {order.customer.email}
                </p>
                <p>
                  <strong className="text-slate-900">Phone:</strong> {order.customer.phone}
                </p>
                {order.customer.company && (
                  <p>
                    <strong className="text-slate-900">Company:</strong> {order.customer.company}
                  </p>
                )}
                <p>
                  <strong className="text-slate-900">Preferred Channel:</strong>{' '}
                  <span className="capitalize">{order.customer.preferredContact}</span>
                </p>
              </div>
            </div>

            {/* Delivery / Shipping Information */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Fulfillment & Dispatch Logistics</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>
                  <strong className="text-slate-900">Method:</strong> {order.deliveryInfo?.methodName || 'Standard'}
                </p>
                <p>
                  <strong className="text-slate-900">Estimated Delivery:</strong>{' '}
                  {order.deliveryInfo?.estimatedDelivery || '2-4 Business Days'}
                </p>
                {order.deliveryInfo?.address ? (
                  <p>
                    <strong className="text-slate-900">Destination Address:</strong>{' '}
                    {order.deliveryInfo.address.street}
                    {order.deliveryInfo.address.apartment && `, ${order.deliveryInfo.address.apartment}`},{' '}
                    {order.deliveryInfo.address.city}, {order.deliveryInfo.address.postalCode},{' '}
                    {order.deliveryInfo.address.country}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">Digital Fulfillment / Service</p>
                )}
                {order.deliveryInfo?.specialInstructions && (
                  <p>
                    <strong className="text-slate-900">Delivery Notes:</strong>{' '}
                    {order.deliveryInfo.specialInstructions}
                  </p>
                )}
              </div>
            </div>

            {/* Booking Information (if applicable) */}
            {order.bookingInfo && (
              <div className="md:col-span-2 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200 text-amber-900 font-bold">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>Service & Event Reservation Specifications</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Preferred Date:</span>
                    <strong className="text-slate-900">{order.bookingInfo.preferredDate || 'To be confirmed'}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Time Slot:</span>
                    <strong className="text-slate-900">{order.bookingInfo.preferredTimeSlot || 'Standard'}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Venue / Location:</span>
                    <strong className="text-slate-900">{order.bookingInfo.venueOrLocation || 'Not specified'}</strong>
                  </div>
                </div>
                {order.bookingInfo.specialRequirements && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <span className="text-[11px] text-slate-500 block">Requirements:</span>
                    <p className="text-slate-800 text-xs">{order.bookingInfo.specialRequirements}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Itemized Order Table */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
              Itemized Order Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Product / Service</th>
                    <th className="pb-2">Division</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="py-2.5">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                              <span>SKU: {item.sku}</span>
                              {item.selectedVariant && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-700 font-semibold">{item.selectedVariant.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600">{item.divisionName}</td>
                      <td className="py-3 text-center font-mono font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-700">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        ${item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Footer */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({order.totalQuantity} items):</span>
                  <span className="font-mono font-bold text-slate-900">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.productDiscounts > 0 && (
                  <div className="flex justify-between text-emerald-600 text-[11px]">
                    <span>Product Savings:</span>
                    <span className="font-mono font-bold">-${order.productDiscounts.toFixed(2)}</span>
                  </div>
                )}
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-[11px]">
                    <span>Promo Code ({order.appliedCouponCode}):</span>
                    <span className="font-mono font-bold">-${order.couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery & Courier:</span>
                  <span className="font-mono text-slate-900">
                    {order.shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `$${order.shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-lg text-[#0052FF]">
                    ${order.total.toFixed(2)} {order.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
                Print Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyOrderId}
                leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied ID!' : 'Copy Order ID'}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {!isPaid && (
                <Button
                  variant="electric"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(true)}
                  leftIcon={<Zap className="w-4 h-4" />}
                  className="text-xs font-bold"
                >
                  Pay Now
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => onNavigate('/catalog')}>
                Continue Shopping
              </Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate('/')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Home
              </Button>
            </div>
          </div>
        </div>

        {/* Server-Side Payment Verification Transactions Audit Log */}
        {transactions.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="font-display text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Payment Verification & Transaction Audit Log
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {transactions.length} Attempt(s) Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="pb-2">Txn Reference</th>
                    <th className="pb-2">Gateway Channel</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2 text-right">Auth Code / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((txn) => (
                    <tr key={txn.transactionId} className="py-2">
                      <td className="py-2.5 font-bold text-slate-900">{txn.transactionId}</td>
                      <td className="py-2.5 text-slate-600 font-sans">{txn.gatewayName}</td>
                      <td className="py-2.5 font-bold text-slate-900">${txn.amount.toFixed(2)}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            txn.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : txn.paymentStatus === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : txn.paymentStatus === 'cancelled'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {txn.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 text-[11px]">
                        {new Date(txn.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 text-right font-sans text-xs">
                        {txn.verificationResult?.authCode ? (
                          <span className="text-emerald-700 font-bold font-mono">
                            {txn.verificationResult.authCode}
                          </span>
                        ) : txn.failureReason?.code ? (
                          <span className="text-rose-600 text-[10px] font-mono">
                            {txn.failureReason.code}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Gateway Modal */}
      {isPaymentModalOpen && (
        <PaymentGatewayModal
          order={order}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
