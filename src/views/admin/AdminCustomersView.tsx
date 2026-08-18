import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ShieldCheck,
  Building,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  DollarSign,
  Clock,
  Sparkles,
  Award,
  CreditCard,
  Layers,
  MapPin,
  MessageSquare,
  Send,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { orderService } from '../../services/orderService';
import { bookingService } from '../../services/bookingService';
import { CustomerUser } from '../../types/customer';
import { Order } from '../../types/order';
import { Booking } from '../../types/booking';
import { Button } from '../../components/ui/Button';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { AdminModal } from '../../components/admin/AdminModal';

export const AdminCustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'bookings' | 'payments' | 'activity'>('profile');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Customer Orders & Bookings
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);

  // CRM Note state
  const [newCrmNote, setNewCrmNote] = useState('');
  const [crmNotes, setCrmNotes] = useState<Record<string, { id: string; author: string; text: string; date: string }[]>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadCustomers = () => {
    const list = authService.getAllCustomers();
    setCustomers(list);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenCustomer = (customer: CustomerUser) => {
    setSelectedCustomer(customer);
    setActiveTab('profile');

    // Load customer-specific orders & bookings
    const orders = orderService.getOrdersByEmail(customer.email);
    setCustomerOrders(orders);

    const bookings = bookingService.getAllBookings().filter(
      (b) => b.customer.email.toLowerCase() === customer.email.toLowerCase()
    );
    setCustomerBookings(bookings);
  };

  const handleAddCrmNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newCrmNote.trim()) return;

    const noteObj = {
      id: Date.now().toString(),
      author: 'Operations CRM Lead',
      text: newCrmNote.trim(),
      date: new Date().toISOString(),
    };

    setCrmNotes((prev) => ({
      ...prev,
      [selectedCustomer.id]: [noteObj, ...(prev[selectedCustomer.id] || [])],
    }));

    addToast('success', 'CRM Note Logged', `Note recorded for ${selectedCustomer.fullName}.`);
    setNewCrmNote('');
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.corporateTier?.toLowerCase().includes(q)
    );
  });

  // Calculate stats for customer
  const calculateCustomerLtv = (email: string) => {
    const orders = orderService.getOrdersByEmail(email);
    const bookings = bookingService.getAllBookings().filter(
      (b) => b.customer.email.toLowerCase() === email.toLowerCase()
    );
    const orderSum = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
    const bookingSum = bookings.filter((b) => b.paymentStatus === 'paid' || b.paymentStatus === 'deposit_paid').reduce((s, b) => s + b.price, 0);
    return orderSum + bookingSum;
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Customer CRM & Client Dossiers ({customers.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic client accounts, corporate tier memberships, unified order histories, reservation logs, and lifetime value analytics.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, email, company, tier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono font-bold">
              <tr>
                <th className="p-4">Customer & Account</th>
                <th className="p-4">Corporate Entity</th>
                <th className="p-4">Tier / Loyalty</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Est. Lifetime Value (LTV)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No customers found matching filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const ltv = calculateCustomerLtv(cust.email);
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {cust.avatarUrl ? (
                            <img
                              src={cust.avatarUrl}
                              alt={cust.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                              {cust.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{cust.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{cust.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {cust.company ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-blue-600" />
                            {cust.company}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Individual Consumer</span>
                        )}
                      </td>
                      <td className="p-4">
                        {cust.corporateTier ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <Award className="w-3 h-3 text-amber-600" />
                            {cust.corporateTier}
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-slate-800 block text-[11px]">{cust.email}</span>
                        <span className="font-mono text-slate-500 block text-[10px]">{cust.phone}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600 text-sm">
                        ${ltv.toFixed(2)} USD
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCustomer(cust)}
                          className="h-8 px-2.5 text-xs text-blue-600 hover:bg-blue-50 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Dossier
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Customer Dossier Modal */}
      {selectedCustomer && (
        <AdminModal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Client Dossier: ${selectedCustomer.fullName}`}
          subtitle={`${selectedCustomer.company ? `${selectedCustomer.company} • ` : ''}${selectedCustomer.accountType.toUpperCase()} ACCOUNT`}
          maxWidth="4xl"
        >
          <div className="space-y-5 text-xs text-slate-700">
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-2.5 px-3 font-semibold text-xs transition-colors relative whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Profile & Dossier
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-2.5 px-3 font-semibold text-xs transition-colors relative whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Commercial Orders ({customerOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`pb-2.5 px-3 font-semibold text-xs transition-colors relative whitespace-nowrap cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Service Bookings ({customerBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-2.5 px-3 font-semibold text-xs transition-colors relative whitespace-nowrap cursor-pointer ${
                  activeTab === 'payments'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Payments & LTV
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-2.5 px-3 font-semibold text-xs transition-colors relative whitespace-nowrap cursor-pointer ${
                  activeTab === 'activity'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Activity Timeline & CRM Notes
              </button>
            </div>

            {/* TAB 1: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Basics */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="font-bold text-slate-900 text-xs block pb-1 border-b border-slate-200">
                      Primary Contact Information
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Full Name:</span>
                      <span className="font-bold text-slate-900">{selectedCustomer.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Corporate Email:</span>
                      <span className="font-mono text-slate-900">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Direct Phone:</span>
                      <span className="font-mono text-slate-900">{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.company && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Organization:</span>
                        <span className="font-bold text-blue-600">{selectedCustomer.company}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account Type:</span>
                      <span className="uppercase font-mono text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                        {selectedCustomer.accountType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Corporate Tier:</span>
                      <span className="font-bold text-amber-700">
                        {selectedCustomer.corporateTier || 'Standard Consumer'}
                      </span>
                    </div>
                  </div>

                  {/* Address & Preferences */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="font-bold text-slate-900 text-xs block pb-1 border-b border-slate-200">
                      Billing & Delivery Address
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {selectedCustomer.address?.street || '42 Gregory Road'}
                      {selectedCustomer.address?.apartment ? `, ${selectedCustomer.address.apartment}` : ''}
                      <br />
                      {selectedCustomer.address?.city || 'Colombo'}, {selectedCustomer.address?.country || 'Sri Lanka'}
                      <br />
                      <span className="font-mono text-slate-500 text-[11px]">
                        Postal: {selectedCustomer.address?.postalCode || '00700'}
                      </span>
                    </p>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-900 text-xs block mb-1">Preferences & Security</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          2FA Verified
                        </span>
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          Currency: {selectedCustomer.preferences?.currency || 'USD'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Orders */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {customerOrders.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No physical or digital product orders placed yet.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">Total Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {customerOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-900">{o.id}</td>
                            <td className="p-3 font-mono text-slate-500">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800">{o.items[0]?.name}</span>
                              {o.items.length > 1 && (
                                <span className="text-[10px] text-slate-500 ml-1">+{o.items.length - 1} more</span>
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-900">${o.total.toFixed(2)}</td>
                            <td className="p-3">
                              <span className="capitalize font-semibold text-[11px] text-slate-700">
                                {o.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {o.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Bookings */}
            {activeTab === 'bookings' && (
              <div className="space-y-3">
                {customerBookings.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No service reservations recorded.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-3">Booking ID</th>
                          <th className="p-3">Service</th>
                          <th className="p-3">Reserved Date</th>
                          <th className="p-3">Package / Scope</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {customerBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-900">{b.id}</td>
                            <td className="p-3 font-bold text-slate-900">{b.serviceName}</td>
                            <td className="p-3 font-mono text-blue-600 font-semibold">{b.date}</td>
                            <td className="p-3 text-slate-700">{b.packageName}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">${b.price.toFixed(2)}</td>
                            <td className="p-3">
                              <span className="capitalize font-semibold text-[11px] text-slate-700">
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Payments & LTV */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-950">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Lifetime Value</span>
                    <span className="font-mono text-xl font-bold text-emerald-800 mt-1 block">
                      ${calculateCustomerLtv(selectedCustomer.email).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-blue-950">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Total Commercial Transactions</span>
                    <span className="font-mono text-xl font-bold text-blue-800 mt-1 block">
                      {customerOrders.length + customerBookings.length} Orders & Bookings
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Member Since</span>
                    <span className="font-mono text-sm font-semibold text-slate-700 mt-2 block">
                      {new Date(selectedCustomer.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Activity & CRM Notes */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {/* Note Form */}
                <form onSubmit={handleAddCrmNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newCrmNote}
                    onChange={(e) => setNewCrmNote(e.target.value)}
                    placeholder="Add CRM note (e.g. VIP client meeting, custom discount agreement, special requirements)..."
                    className="w-full px-3.5 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-slate-50"
                  />
                  <Button variant="electric" size="sm" type="submit" className="shrink-0">
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Save Note
                  </Button>
                </form>

                {/* Timeline & Notes */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-900 text-xs block">Recent Account Activity & Notes</span>

                  {(crmNotes[selectedCustomer.id] || []).map((note) => (
                    <div key={note.id} className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-blue-700">
                        <span className="font-bold">{note.author}</span>
                        <span className="font-mono">{new Date(note.date).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800">{note.text}</p>
                    </div>
                  ))}

                  {/* Seed Activities */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold text-slate-700">Authentication Service</span>
                      <span className="font-mono">{new Date(selectedCustomer.lastLogin || Date.now()).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">Verified session login via Web Portal.</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold text-slate-700">Registration Event</span>
                      <span className="font-mono">{new Date(selectedCustomer.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700">Corporate client profile provisioned and activated.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
};
