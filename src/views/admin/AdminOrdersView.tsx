import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Printer,
  ChevronDown,
  X,
  CreditCard,
  User,
  MapPin,
  RefreshCw,
  Clock,
  RotateCcw,
  Tag,
  FileText,
  Send,
  MessageSquare,
  ShieldCheck,
  Package,
  Building,
  ArrowUpRight,
} from 'lucide-react';
import { Order, OrderStatus, OrderPaymentStatus } from '../../types/order';
import { orderService } from '../../services/orderService';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';

export const AdminOrdersView: React.FC = () => {
  const { admin, logAuditAction } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Customer requested order cancellation');
  const [restockInventory, setRestockInventory] = useState(true);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Dispatch / Tracking Modal
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Certis Lanka Logistics');

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadOrders = () => {
    const all = orderService.getAllOrders();
    setOrders(all);
    if (selectedOrder) {
      const updated = all.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsub = orderService.subscribe(loadOrders);
    return () => unsub();
  }, []);

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orderService.updateOrderStatus(orderId, newStatus);
    if (updated) {
      logAuditAction(
        'ORDER_STATUS_UPDATE',
        'Order',
        orderId,
        `Status updated to ${newStatus.toUpperCase()}`
      );
      addToast('success', 'Status Updated', `Order ${orderId} marked as ${newStatus.replace('_', ' ').toUpperCase()}`);
      loadOrders();
    }
  };

  const handleUpdatePaymentStatus = (orderId: string, newPaymentStatus: OrderPaymentStatus) => {
    const updated = orderService.updateOrderPaymentStatus(orderId, newPaymentStatus);
    if (updated) {
      logAuditAction(
        'ORDER_PAYMENT_STATUS_UPDATE',
        'Order',
        orderId,
        `Payment status updated to ${newPaymentStatus.toUpperCase()}`
      );
      addToast('success', 'Payment Status Changed', `Order ${orderId} marked as ${newPaymentStatus.toUpperCase()}`);
      loadOrders();
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newAdminNote.trim()) return;

    const author = admin ? admin.name : 'Operations Admin';
    orderService.addAdminNote(selectedOrder.id, author, newAdminNote.trim());
    logAuditAction('ORDER_NOTE_ADDED', 'Order', selectedOrder.id, `Internal note appended: "${newAdminNote.slice(0, 30)}..."`);
    addToast('info', 'Note Recorded', 'Internal administrative note added to order dossier.');
    setNewAdminNote('');
    setIsAddingNote(false);
    loadOrders();
  };

  const handleOpenRefundModal = () => {
    if (!selectedOrder) return;
    const totalRefunded = (selectedOrder.refunds || []).reduce((sum, r) => sum + r.amount, 0);
    const maxRefundable = Math.max(0, selectedOrder.total - totalRefunded);
    setRefundAmount(maxRefundable);
    setRefundReason('Customer requested cancellation prior to dispatch');
    setRestockInventory(true);
    setIsRefundModalOpen(true);
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const author = admin ? admin.name : 'Finance Admin';
    const res = orderService.processRefund(
      selectedOrder.id,
      Number(refundAmount),
      refundReason,
      restockInventory,
      author
    );

    if (res.success && res.order) {
      logAuditAction(
        'ORDER_REFUND_PROCESSED',
        'Order',
        selectedOrder.id,
        `Processed refund of $${Number(refundAmount).toFixed(2)}. Reason: ${refundReason}`
      );
      addToast('warning', 'Refund Processed', `Issued refund of $${Number(refundAmount).toFixed(2)} for ${selectedOrder.id}.`);
      setIsRefundModalOpen(false);
      loadOrders();
    } else {
      addToast('error', 'Refund Failed', res.error || 'Could not execute refund transaction.');
    }
  };

  const handleOpenTrackingModal = () => {
    if (!selectedOrder) return;
    setTrackingNumber(selectedOrder.trackingNumber || `LK-EXP-${Math.floor(1000000 + Math.random() * 9000000)}`);
    setCarrier(selectedOrder.carrier || 'Certis Lanka Logistics');
    setIsTrackingModalOpen(true);
  };

  const handleSaveTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !trackingNumber.trim()) return;

    orderService.updateTracking(selectedOrder.id, trackingNumber.trim(), carrier);
    logAuditAction(
      'ORDER_DISPATCH_UPDATED',
      'Order',
      selectedOrder.id,
      `Carrier: ${carrier}, Tracking #: ${trackingNumber}`
    );
    addToast('success', 'Order Dispatched', `Tracking code ${trackingNumber} assigned via ${carrier}.`);
    setIsTrackingModalOpen(false);
    loadOrders();
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      o.id.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q) ||
      (o.customer.company && o.customer.company.toLowerCase().includes(q)) ||
      o.items.some((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));

    return matchesStatus && matchesPayment && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'dispatched':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Truck className="w-3 h-3" /> Dispatched
          </span>
        );
      case 'processing':
        return (
          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> Processing
          </span>
        );
      case 'confirmed':
        return (
          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <X className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Pending Payment
          </span>
        );
    }
  };

  const getPaymentBadge = (status: OrderPaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            PAID
          </span>
        );
      case 'refunded':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            REFUNDED
          </span>
        );
      case 'failed':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            FAILED
          </span>
        );
      default:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            UNPAID
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Orders & Commercial Fulfillment ({orders.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Process direct customer orders, manage island-wide/international logistics, handle refunds, and inspect transaction telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, customer name, email, SKU..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer text-slate-700"
          >
            <option value="all">All Order Statuses</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
            <option value="dispatched">Dispatched</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer text-slate-700"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="unpaid">Unpaid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer & Account</th>
                <th className="py-3.5 px-4">Purchased Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Fulfillment Status</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No commercial orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-[13px]">{order.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{order.customer.fullName}</span>
                      <span className="text-[11px] text-slate-500 block">{order.customer.email}</span>
                      {order.customer.company && (
                        <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" /> {order.customer.company}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                        ))}
                        <div>
                          <span className="font-semibold text-slate-800 text-[11px] block truncate max-w-[140px]">
                            {order.items[0]?.name || 'Items'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {order.totalQuantity} {order.totalQuantity === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      ${order.total.toFixed(2)}
                      {order.couponDiscount > 0 && (
                        <span className="block text-[9px] text-emerald-600 font-normal">
                          -${order.couponDiscount.toFixed(2)} off ({order.appliedCouponCode})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-4">{getPaymentBadge(order.paymentStatus)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Dossier
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Order Dossier Modal */}
      {selectedOrder && (
        <AdminModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Dossier: ${selectedOrder.id}`}
          subtitle={`Placed on ${new Date(selectedOrder.createdAt).toLocaleDateString()} at ${new Date(selectedOrder.createdAt).toLocaleTimeString()}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Quick Status Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Order Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="h-7 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Payment</span>
                  {getPaymentBadge(selectedOrder.paymentStatus)}
                </div>
              </div>

              {/* Status Update Quick Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="pending_payment">Pending Payment</option>
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenTrackingModal}
                  className="h-8 text-xs text-blue-600 border-blue-200"
                >
                  <Truck className="w-3.5 h-3.5 mr-1" />
                  {selectedOrder.trackingNumber ? 'Edit Tracking' : 'Dispatch & Track'}
                </Button>

                {selectedOrder.paymentStatus === 'paid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenRefundModal}
                    className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Process Refund
                  </Button>
                )}
              </div>
            </div>

            {/* Tracking Banner if Dispatched */}
            {selectedOrder.trackingNumber && (
              <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-xl flex items-center justify-between text-blue-900">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold">Carrier: {selectedOrder.carrier || 'Logistics Partner'}</span>
                    <span className="text-slate-600 ml-2 font-mono">Tracking: #{selectedOrder.trackingNumber}</span>
                  </div>
                </div>
                <span className="bg-blue-200/70 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  In Transit
                </span>
              </div>
            )}

            {/* 2-Column Info Matrix: Customer & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
                  <User className="w-4 h-4 text-blue-600" />
                  Customer Information
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-semibold text-slate-900">{selectedOrder.customer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono text-slate-900">{selectedOrder.customer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-900">{selectedOrder.customer.phone}</span>
                  </div>
                  {selectedOrder.customer.company && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company:</span>
                      <span className="font-semibold text-blue-600">{selectedOrder.customer.company}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Pref:</span>
                    <span className="uppercase font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {selectedOrder.customer.preferredContact}
                    </span>
                  </div>
                  {selectedOrder.deliveryInfo?.address && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-500 block text-[11px] font-bold mb-0.5">Shipping Address:</span>
                      <p className="text-slate-700">
                        {selectedOrder.deliveryInfo.address.street}
                        {selectedOrder.deliveryInfo.address.apartment ? `, ${selectedOrder.deliveryInfo.address.apartment}` : ''}
                        <br />
                        {selectedOrder.deliveryInfo.address.city}, {selectedOrder.deliveryInfo.address.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Commercial Details */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payment & Commercial Ledger
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold capitalize text-slate-900">
                      {selectedOrder.paymentMethod ? selectedOrder.paymentMethod.replace('_', ' ') : 'Credit Card (Stripe)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono text-slate-900 text-[11px]">
                      {selectedOrder.transactionId || 'TXN-DIRECT-SETTLED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-mono text-slate-900">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({selectedOrder.appliedCouponCode}):</span>
                      <span className="font-mono">-${selectedOrder.couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shipping Fee:</span>
                    <span className="font-mono text-slate-900">
                      {selectedOrder.shippingFee === 0 ? 'FREE' : `$${selectedOrder.shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-slate-900">
                    <span>Total Settled:</span>
                    <span className="font-mono text-emerald-600">${selectedOrder.total.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                Line Items ({selectedOrder.items.length})
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Item Details</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{item.name}</span>
                              <span className="text-[10px] text-blue-600 font-medium">{item.divisionName}</span>
                              {item.selectedVariant && (
                                <span className="text-[10px] text-slate-500 block">
                                  Variant: {item.selectedVariant.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{item.sku}</td>
                        <td className="py-2.5 px-3 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${item.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Refunds Section if any */}
            {selectedOrder.refunds && selectedOrder.refunds.length > 0 && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  Refund Transactions History
                </div>
                <div className="space-y-1.5">
                  {selectedOrder.refunds.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-rose-200/80 text-xs">
                      <div>
                        <span className="font-bold text-rose-700">Refund #{ref.id}: -${ref.amount.toFixed(2)}</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Reason: {ref.reason}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-mono">
                        <span>{new Date(ref.processedAt).toLocaleDateString()}</span>
                        <span className="block text-slate-400">By {ref.processedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Internal Admin Notes Thread */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Administrative Audit Notes ({(selectedOrder.adminNotesList || []).length})
                </div>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  placeholder="Type an internal note regarding fulfillment, quality check, or client instruction..."
                  className="w-full px-3.5 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-slate-50"
                />
                <Button variant="electric" size="sm" type="submit" className="shrink-0">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Add Note
                </Button>
              </form>

              {/* Notes List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(selectedOrder.adminNotesList || []).length === 0 ? (
                  <p className="text-slate-400 text-center py-2 text-[11px]">No internal notes recorded yet.</p>
                ) : (
                  (selectedOrder.adminNotesList || []).map((n) => (
                    <div key={n.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-bold text-slate-700">{n.author}</span>
                        <span className="font-mono">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700">{n.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Customer Special Notes */}
            {selectedOrder.customerNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                <span className="font-bold text-[11px] block mb-0.5">Customer Delivery Notes:</span>
                <p>{selectedOrder.customerNotes}</p>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* Process Refund Modal */}
      {selectedOrder && (
        <AdminModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          title={`Process Refund: Order ${selectedOrder.id}`}
          subtitle={`Total order amount: $${selectedOrder.total.toFixed(2)} USD`}
          maxWidth="md"
        >
          <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Refund Amount ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedOrder.total}
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-sm"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Max refundable: ${selectedOrder.total.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Refund Reason *</label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium text-slate-800"
              >
                <option value="Customer requested order cancellation">Customer requested order cancellation</option>
                <option value="Item damaged / defective during transit">Item damaged / defective during transit</option>
                <option value="Duplicate payment settlement">Duplicate payment settlement</option>
                <option value="Inventory shortage / out of stock">Inventory shortage / out of stock</option>
                <option value="Client dissatisfaction / agreement adjustment">Client dissatisfaction / agreement adjustment</option>
              </select>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restockInventory}
                  onChange={(e) => setRestockInventory(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <span className="font-semibold text-slate-700">
                  Return items to stock / increment physical inventory
                </span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsRefundModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" type="submit">
                Execute ${Number(refundAmount).toFixed(2)} Refund
              </Button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Dispatch / Tracking Modal */}
      {selectedOrder && (
        <AdminModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
          title={`Dispatch & Tracking: ${selectedOrder.id}`}
          subtitle="Assign logistics courier tracking details and notify client."
          maxWidth="md"
        >
          <form onSubmit={handleSaveTracking} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Carrier / Logistics Service *</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
              >
                <option value="Certis Lanka Logistics">Certis Lanka Logistics (Domestic Island-Wide)</option>
                <option value="Pronto Lanka Courier">Pronto Lanka Courier (Express Metro)</option>
                <option value="DHL Express International">DHL Express International</option>
                <option value="FedEx Express International">FedEx Express International</option>
                <option value="Mahdev Dedicated Fleet">Mahdev Dedicated Corporate Fleet</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tracking / Waybill Number *</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. LK-EXP-9920182 or DHL-8821940"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsTrackingModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="electric" size="sm" type="submit">
                Confirm Dispatch & Tracking
              </Button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};
