import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Plus,
  Minus,
  Edit2,
  Package,
  Layers,
  Save,
  RotateCcw,
  Sparkles,
  Barcode,
  History,
  TrendingDown,
  TrendingUp,
  Tag,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { CmsProduct } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { AdminModal } from '../../components/admin/AdminModal';

interface StockAdjustmentLog {
  id: string;
  sku: string;
  productName: string;
  previousQty: number;
  newQty: number;
  delta: number;
  reason: string;
  timestamp: string;
  author: string;
}

const STOCK_LOGS_KEY = 'mahdev_stock_adjustment_logs_v1';

export const AdminInventoryView: React.FC = () => {
  const { admin, logAuditAction } = useAdminAuth();
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Adjustment State
  const [adjustingProduct, setAdjustingProduct] = useState<CmsProduct | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustSku, setAdjustSku] = useState<string>('');
  const [adjustStatus, setAdjustStatus] = useState<CmsProduct['stockStatus']>('in_stock');
  const [adjustThreshold, setAdjustThreshold] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Restock Supplier Purchase Order');
  const [isSaving, setIsSaving] = useState(false);

  // Adjustment History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [adjustmentLogs, setAdjustmentLogs] = useState<StockAdjustmentLog[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadLogs = () => {
    try {
      const stored = localStorage.getItem(STOCK_LOGS_KEY);
      if (stored) {
        setAdjustmentLogs(JSON.parse(stored));
      } else {
        const seedLogs: StockAdjustmentLog[] = [
          {
            id: 'LOG-001',
            sku: 'MD-TEA-ST01-100G',
            productName: 'Royal Ceylon Silver Tips Reserve Tea',
            previousQty: 12,
            newQty: 45,
            delta: 33,
            reason: 'Restock Supplier Purchase Order (Estate Batch #2026-A)',
            timestamp: '2026-08-15T08:30:00.000Z',
            author: 'Warehouse Lead Niluka',
          },
          {
            id: 'LOG-002',
            sku: 'MD-SPC-ALBA01',
            productName: 'Organic Ceylon Alba Grade Cinnamon Quills',
            previousQty: 60,
            newQty: 52,
            delta: -8,
            reason: 'Physical Inventory Count Correction',
            timestamp: '2026-08-14T14:10:00.000Z',
            author: 'Operations Admin',
          },
        ];
        setAdjustmentLogs(seedLogs);
        localStorage.setItem(STOCK_LOGS_KEY, JSON.stringify(seedLogs));
      }
    } catch {
      setAdjustmentLogs([]);
    }
  };

  const loadInventory = () => {
    const data = cmsService.getAll<CmsProduct>('products', {
      search: searchQuery,
      includeDeleted: false,
    });

    const filtered = data.filter((p) => {
      if (stockFilter !== 'all' && p.stockStatus !== stockFilter) return false;
      return true;
    });

    setProducts(filtered);
  };

  useEffect(() => {
    loadInventory();
    loadLogs();
    const unsub = cmsService.subscribe('products', loadInventory);
    return () => unsub();
  }, [searchQuery, stockFilter]);

  const handleQuickAdjust = (product: CmsProduct) => {
    setAdjustingProduct(product);
    setAdjustQty(product.stockQuantity);
    setAdjustSku(product.sku);
    setAdjustStatus(product.stockStatus);
    setAdjustThreshold(product.lowStockThreshold || 10);
    setAdjustReason('Restock Supplier Purchase Order');
  };

  const handleSaveAdjust = async () => {
    if (!adjustingProduct) return;
    setIsSaving(true);

    try {
      let derivedStatus = adjustStatus;
      if (adjustQty <= 0 && adjustStatus !== 'preorder') {
        derivedStatus = 'out_of_stock';
      } else if (adjustQty > 0 && adjustQty <= adjustThreshold && adjustStatus !== 'preorder') {
        derivedStatus = 'low_stock';
      } else if (adjustQty > adjustThreshold && adjustStatus === 'out_of_stock') {
        derivedStatus = 'in_stock';
      }

      const delta = adjustQty - adjustingProduct.stockQuantity;
      const author = admin ? admin.name : 'Operations Admin';

      await cmsService.updateAsync<CmsProduct>('products', adjustingProduct.id, {
        sku: adjustSku.trim() || adjustingProduct.sku,
        stockQuantity: Math.max(0, adjustQty),
        stockStatus: derivedStatus,
        lowStockThreshold: adjustThreshold,
      });

      // Log Adjustment
      const newLog: StockAdjustmentLog = {
        id: `LOG-${Date.now().toString().slice(-6)}`,
        sku: adjustSku.trim() || adjustingProduct.sku,
        productName: adjustingProduct.name,
        previousQty: adjustingProduct.stockQuantity,
        newQty: Math.max(0, adjustQty),
        delta,
        reason: adjustReason,
        timestamp: new Date().toISOString(),
        author,
      };

      const updatedLogs = [newLog, ...adjustmentLogs];
      setAdjustmentLogs(updatedLogs);
      localStorage.setItem(STOCK_LOGS_KEY, JSON.stringify(updatedLogs));

      logAuditAction(
        'INVENTORY_STOCK_ADJUSTMENT',
        'Inventory',
        adjustingProduct.id,
        `SKU ${adjustingProduct.sku}: ${adjustingProduct.stockQuantity} -> ${adjustQty} (${delta >= 0 ? `+${delta}` : delta}). Reason: ${adjustReason}`
      );

      addToast('success', 'Stock Adjusted', `Updated SKU ${adjustSku} quantity to ${adjustQty} units (${delta >= 0 ? `+${delta}` : delta}).`);
      setAdjustingProduct(null);
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not adjust stock level.');
    } finally {
      setIsSaving(false);
    }
  };

  // Summary Metrics
  const lowStockCount = products.filter((p) => p.stockStatus === 'low_stock').length;
  const outOfStockCount = products.filter((p) => p.stockStatus === 'out_of_stock' || p.stockQuantity === 0).length;
  const totalUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Inventory & Warehouse Management ({products.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time SKU availability, physical warehouse counts, safety thresholds, and adjustment audit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryModalOpen(true)}
            leftIcon={<History className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Adjustment History ({adjustmentLogs.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInventory}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Refresh Counts
          </Button>
        </div>
      </div>

      {/* Low-Stock Alert Banner if critical */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Warehouse Stock Replenishment Required</span>
              <p className="text-xs text-amber-800 mt-0.5">
                {outOfStockCount} item{outOfStockCount !== 1 ? 's' : ''} currently depleted (0 stock) and{' '}
                {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below safety threshold.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStockFilter('low_stock')}
              className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 font-bold text-xs text-amber-900 transition-colors cursor-pointer"
            >
              Filter Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out_of_stock')}
              className="px-3 py-1.5 rounded-xl bg-rose-200 hover:bg-rose-300 font-bold text-xs text-rose-900 transition-colors cursor-pointer"
            >
              Filter Depleted
            </button>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Units In Stock</span>
          <span className="font-mono text-xl font-bold text-slate-900 mt-1 block">{totalUnits.toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Active SKUs</span>
          <span className="font-mono text-xl font-bold text-blue-600 mt-1 block">{products.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 block">Low Stock Alerts</span>
          <span className="font-mono text-xl font-bold text-amber-700 mt-1 block">{lowStockCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-600 block">Out of Stock (Zero)</span>
          <span className="font-mono text-xl font-bold text-rose-700 mt-1 block">{outOfStockCount}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU code, product title, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Availability States</option>
            <option value="in_stock">In Stock (Available)</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="preorder">Pre-Order Only</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono font-bold">
              <tr>
                <th className="p-4">SKU & Item Details</th>
                <th className="p-4">Product Category</th>
                <th className="p-4 text-center">Physical Stock</th>
                <th className="p-4 text-center">Safety Threshold</th>
                <th className="p-4">Availability</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {products.map((p) => {
                const isLow = p.stockQuantity <= (p.lowStockThreshold || 10) && p.stockQuantity > 0;
                const isOut = p.stockQuantity === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{p.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {p.sku}
                            </span>
                            <span className="text-[10px] text-slate-400">${p.price.toFixed(2)} USD</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="text-slate-700 capitalize font-medium">{p.categoryName || (p as any).category || 'Commodities'}</span>
                      <span className="text-[10px] text-slate-400 block">{p.divisionName || (p as any).productType || 'General'}</span>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`font-mono text-sm font-bold ${
                          isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {p.stockQuantity} units
                      </span>
                    </td>

                    <td className="p-4 text-center font-mono text-slate-500 font-semibold">
                      {p.lowStockThreshold || 10} units
                    </td>

                    <td className="p-4">
                      {p.stockStatus === 'in_stock' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          IN STOCK
                        </span>
                      ) : p.stockStatus === 'low_stock' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          LOW STOCK
                        </span>
                      ) : p.stockStatus === 'out_of_stock' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          OUT OF STOCK
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          PRE-ORDER
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAdjust(p)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        className="text-xs h-8 text-blue-600 hover:bg-blue-50 font-semibold"
                      >
                        Adjust Stock
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No catalog items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <AdminModal
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          title={`Adjust Inventory: ${adjustingProduct.name}`}
          subtitle={`Current Physical Stock: ${adjustingProduct.stockQuantity} units`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Stock Keeping Unit (SKU) Code *
              </label>
              <input
                type="text"
                value={adjustSku}
                onChange={(e) => setAdjustSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Warehouse Stock Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustQty((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="w-full text-center py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAdjustQty((prev) => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Previous: {adjustingProduct.stockQuantity} units</span>
                <span className={`font-mono font-bold ${
                  adjustQty - adjustingProduct.stockQuantity >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  Adjustment: {adjustQty - adjustingProduct.stockQuantity >= 0 ? `+${adjustQty - adjustingProduct.stockQuantity}` : adjustQty - adjustingProduct.stockQuantity} units
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Adjustment Reason / Authority *
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="Restock Supplier Purchase Order">Restock Supplier Purchase Order</option>
                <option value="Physical Inventory Count Correction">Physical Inventory Count Correction</option>
                <option value="Damaged / Written Off Stock">Damaged / Written Off Stock</option>
                <option value="Customer Return Restocked">Customer Return Restocked</option>
                <option value="Internal Production Sample / Testing">Internal Production Sample / Testing</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustThreshold}
                  onChange={(e) => setAdjustThreshold(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Availability State
                </label>
                <select
                  value={adjustStatus}
                  onChange={(e) => setAdjustStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="preorder">Pre-Order</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setAdjustingProduct(null)}>
                Cancel
              </Button>
              <Button variant="electric" size="sm" onClick={handleSaveAdjust} isLoading={isSaving}>
                Save Adjustment
              </Button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Stock Adjustment Ledger History Modal */}
      <AdminModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Inventory Adjustment Audit Ledger"
        subtitle="Historical log of warehouse stock counts, batch receipts, and inventory corrections."
        maxWidth="3xl"
      >
        <div className="space-y-3 text-xs">
          {adjustmentLogs.length === 0 ? (
            <p className="text-center py-8 text-slate-400">No stock adjustment entries logged yet.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="p-3">SKU & Item</th>
                    <th className="p-3">Delta / Units</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Timestamp & User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {adjustmentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{log.productName}</span>
                        <span className="font-mono text-[10px] text-blue-600">{log.sku}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-mono font-bold text-xs ${
                            log.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {log.delta >= 0 ? `+${log.delta}` : log.delta} units
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {log.previousQty} &rarr; {log.newQty}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{log.reason}</td>
                      <td className="p-3 text-[11px] font-mono text-slate-500">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        <span className="block text-slate-400 font-sans text-[10px]">By {log.author}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
};
