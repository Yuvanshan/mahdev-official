import React, { useState } from 'react';
import {
  Search,
  Package,
  Calendar,
  CreditCard,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { Order } from '../types/order';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SEOHead } from '../components/layout/SEOHead';

interface OrderLookupViewProps {
  onNavigate: (path: string) => void;
}

export const OrderLookupView: React.FC<OrderLookupViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Order[] | null>(null);
  const [searched, setSearched] = useState(false);

  const allOrders = orderService.getAllOrders();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearched(true);
    const query = searchQuery.trim();

    // Check if query is an Order ID
    const singleOrder = orderService.getOrderById(query);
    if (singleOrder) {
      setResults([singleOrder]);
      return;
    }

    // Check if query is email or name
    const emailMatches = orderService.getOrdersByEmail(query);
    if (emailMatches.length > 0) {
      setResults(emailMatches);
      return;
    }

    // Partial search across ID, name, email
    const filtered = allOrders.filter(
      (o) =>
        o.id.toLowerCase().includes(query.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(query.toLowerCase()) ||
        o.customer.email.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Track & Lookup Orders | Mahdev Pvt Ltd Enterprise System"
        description="Search, view, and track the status of your orders, dispatch logistics, and booking reservation details across the Mahdev ecosystem."
        canonicalUrl="https://mahdev.lk/orders"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <Package className="w-3.5 h-3.5" />
            <span>Mahdev Enterprise Order Tracking</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Order Status & Fulfillment Lookup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Enter your Order ID (e.g. <code>ORD-2026-XXXX</code>) or your registered customer email to inspect delivery logistics and payment transition status.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID or Customer Email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-mono placeholder:normal-case placeholder:font-sans"
              />
            </div>
            <Button type="submit" variant="electric" size="sm" className="text-xs px-6 py-2.5">
              Track Order
            </Button>
          </form>
        </div>

        {/* Search Results */}
        {searched && (
          <div className="space-y-4">
            <h2 className="font-display text-sm font-bold text-slate-900">
              Lookup Results ({results?.length || 0})
            </h2>

            {(!results || results.length === 0) ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900">No Orders Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We could not find any order records matching "{searchQuery}". Please verify the Order ID on your receipt.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {order.id}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600">{order.customer.fullName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Created {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          {order.status.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Items Summary ({order.totalQuantity} items):
                        </span>
                        <ul className="space-y-1 text-slate-700">
                          {order.items.slice(0, 2).map((it, idx) => (
                            <li key={idx} className="line-clamp-1">
                              • {it.quantity}x {it.name} {it.selectedVariant ? `(${it.selectedVariant.name})` : ''}
                            </li>
                          ))}
                          {order.items.length > 2 && (
                            <li className="text-slate-400 text-[10px] italic">
                              + {order.items.length - 2} more item(s)...
                            </li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Fulfillment Logistics:
                        </span>
                        <p className="text-slate-700">
                          {order.deliveryInfo?.methodName || 'Standard Delivery'}
                        </p>
                        {order.deliveryInfo?.address && (
                          <p className="text-slate-500 text-[11px] line-clamp-1">
                            {order.deliveryInfo.address.city}, {order.deliveryInfo.address.country}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400">Total Amount:</span>
                        <div className="font-mono text-sm font-bold text-[#0052FF]">
                          ${order.total.toFixed(2)} {order.currency}
                        </div>
                      </div>

                      <Button
                        variant="electric"
                        size="sm"
                        onClick={() => onNavigate(`/order/${order.id}`)}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        View Full Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Recent Ecosystem Orders */}
        {!searched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-slate-900">
                Recent Orders in Mahdev System
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {allOrders.length} records available
              </span>
            </div>

            <div className="space-y-3">
              {allOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onNavigate(`/order/${order.id}`)}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {order.id}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">
                          {order.customer.fullName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {order.totalQuantity} items • {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        ${order.total.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {order.status}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
