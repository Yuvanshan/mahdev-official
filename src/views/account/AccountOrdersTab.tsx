import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  ChevronRight,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Order } from '../../types/order';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface AccountOrdersTabProps {
  orders: Order[];
  onNavigate: (path: string) => void;
}

export const AccountOrdersTab: React.FC<AccountOrdersTabProps> = ({ orders, onNavigate }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filterStatus === 'all' || o.paymentStatus === filterStatus || o.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              My Orders Repository ({orders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Filtered strictly to your authorized customer credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by SKU or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'paid', label: 'Paid & Settled' },
            { id: 'pending_payment', label: 'Payment Pending' },
            { id: 'dispatched', label: 'Dispatched / In Transit' },
            { id: 'confirmed', label: 'Confirmed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-slate-900">No Orders Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || filterStatus !== 'all'
                ? 'No orders match your filter criteria. Try clearing your search.'
                : "You haven't placed any merchandise orders under this customer account yet."}
            </p>
          </div>
          <Button
            variant="electric"
            size="sm"
            onClick={() => onNavigate('/catalog')}
            leftIcon={<ShoppingBag className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Explore Product Catalog
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onNavigate(`/order/${order.id}`)}
              className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4 cursor-pointer group"
            >
              {/* Order Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <span>{order.id}</span>
                    <button
                      onClick={(e) => handleCopy(order.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy Order ID"
                    >
                      {copiedId === order.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    Payment: {order.paymentStatus.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      order.status === 'confirmed' || order.status === 'dispatched'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Status: {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 shrink-0 text-xs"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-8 h-8 rounded-lg object-cover bg-white"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 truncate max-w-[140px]">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Qty: {item.quantity} • ${item.unitPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.deliveryInfo?.address && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Destination: {order.deliveryInfo.address.city},{' '}
                        {order.deliveryInfo.address.country} (
                        {order.deliveryInfo.methodName})
                      </span>
                    </div>
                  )}
                </div>

                {/* Price & Action */}
                <div className="md:col-span-4 flex md:flex-col items-center md:items-end justify-between gap-1 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Order Total:</span>
                    <span className="font-mono text-base font-bold text-slate-900">
                      ${order.total.toFixed(2)} {order.currency}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    <span>View Receipt & Invoice</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
