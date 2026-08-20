import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Boxes,
  Tag,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { CmsProduct, CmsCategory } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DivisionId } from '../../types';

export const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CmsProduct | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockEditingProduct, setStockEditingProduct] = useState<CmsProduct | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<number>(0);

  // Delete State
  const [deletingProduct, setDeletingProduct] = useState<CmsProduct | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    slug: '',
    divisionId: 'mart' as DivisionId,
    divisionName: 'Mahdev Online Mart',
    categoryId: 'cat-cameras',
    categoryName: 'Cinema & Studio Cameras',
    price: 999,
    compareAtPrice: 1199,
    currency: 'USD',
    shortDescription: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    galleryImages: [] as string[],
    stockQuantity: 25,
    stockStatus: 'in_stock' as const,
    lowStockThreshold: 10,
    isFeatured: false,
    tags: [] as string[],
    specifications: {} as Record<string, string>,
    warrantyInfo: '1-Year Official Manufacturer Warranty',
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadData = () => {
    const prods = cmsService.getAll<CmsProduct>('products', {
      search: searchQuery,
      divisionId: divisionFilter,
      status: stockFilter,
      includeDeleted: stockFilter === 'deleted' || stockFilter === 'all',
    });
    setProducts(prods);

    const cats = cmsService.getAll<CmsCategory>('categories');
    setCategories(cats);
  };

  useEffect(() => {
    loadData();
    const unsub = cmsService.subscribe('products', loadData);
    return () => unsub();
  }, [searchQuery, divisionFilter, stockFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    const defaultCat = categories[0] || { id: 'cat-hardware', name: 'Hardware' };
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      name: '',
      slug: '',
      divisionId: 'mart',
      divisionName: 'Mahdev Online Mart',
      categoryId: defaultCat.id,
      categoryName: defaultCat.name,
      price: 199,
      compareAtPrice: 249,
      currency: 'USD',
      shortDescription: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      galleryImages: [],
      stockQuantity: 20,
      stockStatus: 'in_stock',
      lowStockThreshold: 8,
      isFeatured: false,
      tags: ['Hardware', 'Authorized'],
      specifications: { Warranty: '1-Year Island-wide' },
      warrantyInfo: '1-Year Official Manufacturer Warranty',
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (prod: CmsProduct) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      slug: prod.slug,
      divisionId: prod.divisionId,
      divisionName: prod.divisionName,
      categoryId: prod.categoryId,
      categoryName: prod.categoryName,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice || prod.price,
      currency: prod.currency || 'USD',
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      imageUrl: prod.imageUrl,
      galleryImages: prod.galleryImages || [],
      stockQuantity: prod.stockQuantity,
      stockStatus: prod.stockStatus,
      lowStockThreshold: prod.lowStockThreshold || 10,
      isFeatured: prod.isFeatured,
      tags: prod.tags || [],
      specifications: prod.specifications || {},
      warrantyInfo: prod.warrantyInfo || '1-Year Official Manufacturer Warranty',
      isActive: prod.isActive,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleDivisionChange = (divId: DivisionId) => {
    const divNames: Record<DivisionId, string> = {
      sws: 'SWS Event Management',
      u1: 'U1 Studio',
      it: 'Mahdev IT & Solutions',
      travels: 'Mahdev Travels',
      mart: 'Mahdev Online Mart',
    };
    setFormData({
      ...formData,
      divisionId: divId,
      divisionName: divNames[divId],
    });
    setIsDirty(true);
  };

  const handleCategoryChange = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    setFormData({
      ...formData,
      categoryId: catId,
      categoryName: cat ? cat.name : 'General Category',
    });
    setIsDirty(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU identifier is required';
    if (formData.price < 0) errors.price = 'Price must be positive';
    if (formData.stockQuantity < 0) errors.stockQuantity = 'Stock quantity cannot be negative';
    if (!formData.imageUrl.trim()) errors.imageUrl = 'Main product image URL is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const stockStatus =
        formData.stockQuantity === 0
          ? 'out_of_stock'
          : formData.stockQuantity <= formData.lowStockThreshold
          ? 'low_stock'
          : 'in_stock';

      const payload = {
        ...formData,
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        stockStatus,
      };

      if (editingProduct) {
        cmsService.update<CmsProduct>('products', editingProduct.id, payload);
        addToast('success', 'Product Updated', `SKU ${payload.sku} "${payload.name}" saved.`);
      } else {
        cmsService.create<CmsProduct>('products', payload);
        addToast('success', 'Product Created', `"${payload.name}" added to catalog.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadData();
    } catch (err: any) {
      addToast('error', 'Error Saving Product', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenStockQuickEdit = (p: CmsProduct) => {
    setStockEditingProduct(p);
    setQuickStockValue(p.stockQuantity);
    setIsStockModalOpen(true);
  };

  const handleSaveQuickStock = () => {
    if (!stockEditingProduct) return;
    const stockStatus =
      quickStockValue === 0
        ? 'out_of_stock'
        : quickStockValue <= (stockEditingProduct.lowStockThreshold || 10)
        ? 'low_stock'
        : 'in_stock';

    cmsService.update<CmsProduct>('products', stockEditingProduct.id, {
      stockQuantity: quickStockValue,
      stockStatus,
    });
    addToast('success', 'Stock Adjusted', `Stock for SKU ${stockEditingProduct.sku} set to ${quickStockValue}.`);
    setIsStockModalOpen(false);
    setStockEditingProduct(null);
    loadData();
  };

  const handleDeleteConfirm = (permanent: boolean) => {
    if (!deletingProduct) return;
    if (permanent) {
      cmsService.hardDelete('products', deletingProduct.id);
      addToast('warning', 'Permanent Deletion', `Product "${deletingProduct.name}" removed from inventory.`);
    } else {
      cmsService.softDelete('products', deletingProduct.id);
      addToast('info', 'Product Archived', `Product "${deletingProduct.name}" archived.`);
    }
    setDeletingProduct(null);
    loadData();
  };

  const handleRestore = (prod: CmsProduct) => {
    cmsService.restore('products', prod.id);
    addToast('success', 'Product Restored', `"${prod.name}" restored to active inventory.`);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Products & Inventory CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {products.length} SKUs
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Full enterprise inventory matrix with live stock thresholds, pricing, specifications, and media.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Product SKU
          </Button>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, title, category..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer"
          >
            <option value="all">All Divisions</option>
            <option value="mart">Mahdev Online Mart</option>
            <option value="u1">U1 Studio Gear</option>
            <option value="it">Mahdev IT Licenses</option>
            <option value="sws">SWS Event Gear</option>
            <option value="travels">Travel Merchandise</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock ({'>'}10)</option>
            <option value="low_stock">Low Stock (Alert)</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="deleted">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">SKU & Product</th>
                <th className="py-3.5 px-4">Division & Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className={`hover:bg-slate-50/80 transition-colors ${prod.isDeleted ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-xs">{prod.name}</span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold">{prod.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{prod.categoryName}</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">{prod.divisionName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${prod.price?.toFixed(2)}
                      {prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                        <span className="text-slate-400 line-through text-[10px] ml-1 font-normal">
                          ${prod.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{prod.stockQuantity} units</span>
                        <button
                          onClick={() => handleOpenStockQuickEdit(prod)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                        >
                          Adjust
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {prod.isDeleted ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : prod.stockQuantity === 0 ? (
                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : prod.stockQuantity <= (prod.lowStockThreshold || 10) ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {prod.isDeleted ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(prod)} className="text-blue-600">
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingProduct(prod)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Archive / Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product SKU'}
        subtitle="Configure physical hardware details, pricing, inventory safety stock, and media."
        isDirty={isDirty}
        maxWidth="3xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Sony FX9 Full-Frame Cinema Camera Body"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.name && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU Code *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => {
                  setFormData({ ...formData, sku: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="SKU-SNY-FX901"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              {formErrors.sku && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.sku}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Division *</label>
              <select
                value={formData.divisionId}
                onChange={(e) => handleDivisionChange(e.target.value as DivisionId)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="mart">Mahdev Online Mart</option>
                <option value="u1">U1 Studio Gear</option>
                <option value="it">Mahdev IT Licenses</option>
                <option value="sws">SWS Event Equipment</option>
                <option value="travels">Travel Merchandise</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catalog Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({((c as any).divisionId || (c as any).division || 'mart').toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sale Price (USD) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Compare-At Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => {
                  setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock Quantity *</label>
              <input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => {
                  setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Low Stock Alert</label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) => {
                  setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 5 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Media Image Manager */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Primary Product Image *</label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMediaPickerOpen(true)}
                className="shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5 mr-1" />
                Select Media
              </Button>
            </div>
            {formData.imageUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={formData.imageUrl}
                  alt="Thumbnail"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50"
                />
                <span className="text-[11px] text-slate-500">Live image preview verified.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Short Product Summary</label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => {
                setFormData({ ...formData, shortDescription: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Brief bullet summary of hardware grade..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Detailed technical specifications, warranty terms, and inclusions..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => {
                    setFormData({ ...formData, isActive: e.target.checked });
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => {
                    setFormData({ ...formData, isFeatured: e.target.checked });
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span className="font-semibold text-slate-700">Featured</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product SKU'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Quick Stock Adjustment Modal */}
      <AdminModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Adjust Physical Stock Inventory"
        subtitle={`SKU: ${stockEditingProduct?.sku} — ${stockEditingProduct?.name}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block">Current Registered Quantity:</span>
            <span className="font-mono text-xl font-bold text-slate-900">
              {stockEditingProduct?.stockQuantity} Units
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Physical Inventory Count</label>
            <input
              type="number"
              min="0"
              value={quickStockValue}
              onChange={(e) => setQuickStockValue(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono text-base font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsStockModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveQuickStock}>
              Update Stock Level
            </Button>
          </div>
        </div>
      </AdminModal>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        currentUrl={formData.imageUrl}
        onSelect={(url) => {
          setFormData({ ...formData, imageUrl: url });
          setIsDirty(true);
        }}
      />

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!deletingProduct}
        title="Delete Product SKU"
        message={`Are you sure you want to remove "${deletingProduct?.name}" from inventory?`}
        itemIdentifier={deletingProduct ? `${deletingProduct.sku} — ${deletingProduct.name}` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingProduct?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
};
