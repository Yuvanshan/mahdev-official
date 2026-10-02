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
  Eye,
  Copy,
  Check,
  Upload,
  Loader2,
  X,
} from 'lucide-react';
import { CmsProduct, CmsCategory } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { QuickCategoryCreator } from '../../components/admin/QuickCategoryCreator';
import { firestoreProductsService } from '../../services/firestore/products';
import { DivisionId } from '../../types';
import { formatCurrency, formatLKR } from '../../utils/currency';
import { uploadMediaAsset } from '../../services/mediaUploadService';
import { compressDataUrl } from '../../utils/imageOptimizer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

export const AdminProductsView: React.FC = () => {
  const { refreshAll } = useFirestoreDataContext();
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal & Inspector States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CmsProduct | null>(null);
  const [inspectedProduct, setInspectedProduct] = useState<CmsProduct | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
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
    price: 45000,
    compareAtPrice: 52000,
    currency: 'LKR',
    shortDescription: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    galleryImages: [] as string[],
    stockQuantity: 25,
    stockStatus: 'in_stock' as CmsProduct['stockStatus'],
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
    const seen = new Set<string>();
    const uniqueProds = prods.filter((p) => !seen.has(p.id) && seen.add(p.id));
    setProducts(uniqueProds);

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
      price: 25000,
      compareAtPrice: 28500,
      currency: 'LKR',
      shortDescription: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      galleryImages: [],
      stockQuantity: 20,
      stockStatus: 'in_stock',
      lowStockThreshold: 8,
      isFeatured: false,
      tags: ['Hardware', 'Authorized'],
      specifications: { Warranty: '1-Year Island-wide Official Warranty' },
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
      currency: prod.currency || 'LKR',
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      imageUrl: prod.imageUrl || (prod.images && prod.images[0]) || (prod.galleryImages && prod.galleryImages[0]) || '',
      galleryImages: prod.galleryImages || prod.images || [],
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

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadMediaAsset(file);
      if (uploadedUrl) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: uploadedUrl,
          galleryImages: [uploadedUrl, ...(prev.galleryImages || []).filter((g) => g !== uploadedUrl)],
        }));
        setIsDirty(true);
        addToast('success', 'Image Uploaded', 'Product image uploaded and attached.');
      }
    } catch (err: any) {
      console.warn('Direct media upload fallback:', err);
      try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const rawBase64 = ev.target?.result as string;
          const compressed = await compressDataUrl(rawBase64, 1200, 0.85);
          setFormData((prev) => ({
            ...prev,
            imageUrl: compressed,
            galleryImages: [compressed, ...(prev.galleryImages || []).filter((g) => g !== compressed)],
          }));
          setIsDirty(true);
          addToast('info', 'Image Attached', 'Local image ready for save.');
        };
        reader.readAsDataURL(file);
      } catch (readErr: any) {
        addToast('error', 'Upload Failed', err.message || 'Could not process image.');
      }
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('warning', 'Validation Incomplete', 'Please fill in product name, SKU, price, and image before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const stockStatus: CmsProduct['stockStatus'] =
        formData.stockQuantity === 0
          ? 'out_of_stock'
          : formData.stockQuantity <= formData.lowStockThreshold
          ? 'low_stock'
          : 'in_stock';

      const primaryImg = formData.imageUrl.trim();
      const otherImgs = (formData.galleryImages || []).filter((u) => u && u !== primaryImg);
      const allImgs = primaryImg ? [primaryImg, ...otherImgs] : otherImgs;

      const payload: CmsProduct = {
        ...formData,
        imageUrl: primaryImg,
        images: allImgs,
        galleryImages: allImgs,
        division: formData.divisionId,
        divisionId: formData.divisionId,
        stock: formData.stockQuantity,
        stockQuantity: formData.stockQuantity,
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        stockStatus,
      } as any;

      let cloudSynced = true;
      if (editingProduct) {
        cmsService.update<CmsProduct>('products', editingProduct.id, payload as any);
        try {
          await firestoreProductsService.saveProduct(editingProduct.id, {
            ...payload,
            id: editingProduct.id,
            imageUrl: primaryImg,
            images: allImgs,
            galleryImages: allImgs,
            division: formData.divisionId,
            divisionId: formData.divisionId,
            stock: formData.stockQuantity,
            stockQuantity: formData.stockQuantity,
            isPublished: formData.isActive,
            status: formData.isActive ? 'active' : 'draft',
          } as any);
        } catch (fErr) {
          cloudSynced = false;
          console.warn('[AdminProducts] Firestore save notice:', fErr);
        }
      } else {
        const created = cmsService.create<CmsProduct>('products', payload as any);
        try {
          await firestoreProductsService.saveProduct(created.id, {
            ...payload,
            id: created.id,
            imageUrl: primaryImg,
            images: allImgs,
            galleryImages: allImgs,
            division: formData.divisionId,
            divisionId: formData.divisionId,
            stock: formData.stockQuantity,
            stockQuantity: formData.stockQuantity,
            isPublished: formData.isActive,
            status: formData.isActive ? 'active' : 'draft',
          } as any);
        } catch (fErr) {
          cloudSynced = false;
          console.warn('[AdminProducts] Firestore create notice:', fErr);
        }
      }

      if (cloudSynced) {
        addToast('success', editingProduct ? 'Product Updated' : 'Product Created', `"${payload.name}" saved and synced to Cloud Firestore.`);
      } else {
        addToast('warning', 'Saved on this Device Only', `"${payload.name}" saved locally. Cloud sync failed. Use "Push Device Data to Cloud" on the Dashboard when online.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadData();
      try {
        await refreshAll();
      } catch (rErr) {
        console.warn('refreshAll notice:', rErr);
      }
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
    firestoreProductsService.saveProduct(stockEditingProduct.id, {
      stock: quickStockValue,
    } as any).catch(() => {});
    addToast('success', 'Stock Adjusted', `Stock for SKU ${stockEditingProduct.sku} set to ${quickStockValue}.`);
    setIsStockModalOpen(false);
    setStockEditingProduct(null);
    loadData();
  };

  const handleDeleteConfirm = async (permanent: boolean) => {
    if (!deletingProduct) return;
    const itemToDelete = deletingProduct;
    if (permanent) {
      cmsService.hardDelete('products', itemToDelete.id);
      try {
        await firestoreProductsService.deleteProduct(itemToDelete.id);
      } catch (fErr) {
        console.warn('[AdminProducts] Firestore delete notice:', fErr);
      }
      addToast('warning', 'Permanent Deletion', `Product "${itemToDelete.name}" removed from inventory.`);
    } else {
      cmsService.softDelete('products', itemToDelete.id);
      try {
        await firestoreProductsService.saveProduct(itemToDelete.id, { status: 'draft', isPublished: false } as any);
      } catch (fErr) {
        console.warn('[AdminProducts] Firestore archive notice:', fErr);
      }
      addToast('info', 'Product Archived', `Product "${itemToDelete.name}" archived.`);
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

      {/* Toolbar Filter & SKU Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU no (e.g. SKU-...), title, category..."
            className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setInspectedProduct(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              ×
            </button>
          )}
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

      {/* SKU Quick Inspector & Media Details Card (When SKU is searched or inspected) */}
      {(() => {
        const activeItem =
          inspectedProduct ||
          (searchQuery.trim().length >= 2
            ? products.find(
                (p) =>
                  p.sku.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                  p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
              )
            : null);

        if (!activeItem) return null;

        const copyWhatsAppResponse = () => {
          const text = `✅ *Mahdev Inventory Confirmation*\n• *Item:* ${activeItem.name}\n• *SKU:* \`${activeItem.sku}\`\n• *Price:* ${formatCurrency(activeItem.price, 'LKR')}\n• *Stock:* ${activeItem.stockQuantity} available\n• *Warranty:* ${activeItem.warrantyInfo || 'Official Manufacturer Warranty'}\n• *Reference Image:* ${activeItem.imageUrl}`;
          navigator.clipboard.writeText(text);
          setCopiedSku(activeItem.sku);
          addToast('success', 'Copied to Clipboard', `WhatsApp reply copied for SKU ${activeItem.sku}`);
          setTimeout(() => setCopiedSku(null), 3000);
        };

        return (
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 p-5 rounded-2xl border-2 border-blue-200 shadow-sm animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <h3 className="font-display text-sm font-bold text-slate-900">
                  SKU Search & Media Inspector
                </h3>
                <span className="bg-blue-600 text-white font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md tracking-wider">
                  {activeItem.sku}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyWhatsAppResponse}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {copiedSku === activeItem.sku ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy WhatsApp Response</span>
                    </>
                  )}
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(activeItem)}
                  className="text-xs"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit Product
                </Button>
                <button
                  onClick={() => setInspectedProduct(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
                  title="Close Inspector"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
              {/* Image Preview Column */}
              <div className="md:col-span-4 lg:col-span-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-xs group">
                  <img
                    src={activeItem.imageUrl}
                    alt={activeItem.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (fb) fb.classList.remove('hidden');
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="hidden w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <Package className="w-10 h-10 mb-2 text-slate-300" />
                    <span className="text-[11px] font-medium text-slate-500">{activeItem.name}</span>
                  </div>
                  <a
                    href={activeItem.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-[10px] flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View HD</span>
                  </a>
                </div>
                {activeItem.galleryImages && activeItem.galleryImages.length > 0 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    {activeItem.galleryImages.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-white"
                      >
                        <img
                          src={img}
                          alt="Gallery"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Specifications & Live Details */}
              <div className="md:col-span-8 lg:col-span-9 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {activeItem.divisionName}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {activeItem.categoryName}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      ID: {activeItem.id}
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-slate-900 leading-snug">
                    {activeItem.name}
                  </h4>
                  {activeItem.shortDescription && (
                    <p className="text-xs text-slate-600 mt-1">{activeItem.shortDescription}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Price (LKR)
                    </span>
                    <span className="font-mono text-sm font-bold text-blue-700">
                      {formatCurrency(activeItem.price, 'LKR')}
                    </span>
                    {activeItem.compareAtPrice && activeItem.compareAtPrice > activeItem.price && (
                      <span className="text-[10px] text-slate-400 line-through block font-mono">
                        {formatCurrency(activeItem.compareAtPrice, 'LKR')}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Stock Level
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {activeItem.stockQuantity} Units
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Alert at ≤ {activeItem.lowStockThreshold || 10}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Status
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {activeItem.stockStatus === 'in_stock'
                        ? 'Available'
                        : activeItem.stockStatus === 'low_stock'
                        ? 'Low Stock'
                        : 'Out of Stock'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Warranty
                    </span>
                    <span className="text-[11px] text-slate-700 font-medium line-clamp-1">
                      {activeItem.warrantyInfo || 'Official Warranty'}
                    </span>
                  </div>
                </div>

                {/* Technical Specifications */}
                {activeItem.specifications && Object.keys(activeItem.specifications).length > 0 && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Technical Specifications & Parameters
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                      {Object.entries(activeItem.specifications).map(([key, val]) => (
                        <div key={key} className="flex justify-between border-b border-slate-100 py-0.5">
                          <span className="text-slate-500">{key}:</span>
                          <span className="font-medium text-slate-800">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                              if (fb) fb.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center shrink-0 ${prod.imageUrl ? 'hidden' : ''}`}>
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
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
                      {formatCurrency(prod.price, 'LKR')}
                      {prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                        <span className="text-slate-400 line-through text-[10px] ml-1.5 font-normal">
                          {formatCurrency(prod.compareAtPrice, 'LKR')}
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
                              onClick={() => {
                                setInspectedProduct(prod);
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Inspect SKU & Image Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Catalog Category *</label>
                <QuickCategoryCreator
                  currentDivisionId={formData.divisionId}
                  onCategoryCreated={(newCat) => {
                    setCategories((prev) => Array.from(new Set([...prev, newCat])));
                    handleCategoryChange(newCat.id);
                    setIsDirty(true);
                    addToast(
                      'success',
                      'Category Created',
                      `"${newCat.name}" created and selected.`
                    );
                  }}
                  buttonLabel="+ Manual Add"
                />
              </div>
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
              <label className="block font-semibold text-slate-700 mb-1">Sale Price (LKR / Rs.) *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Compare-At Price (LKR / Rs.)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.compareAtPrice}
                onChange={(e) => {
                  setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-600"
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
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">Primary Product Image *</label>
              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, imageUrl: '', galleryImages: [] });
                    setIsDirty(true);
                  }}
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Clear Image
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    imageUrl: e.target.value,
                    galleryImages: e.target.value ? [e.target.value] : [],
                  });
                  setIsDirty(true);
                }}
                placeholder="https://images.unsplash.com/... or click Upload"
                className="grow px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
              />

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="text-xs"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      Upload File
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="text-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1" />
                  Media Library
                </Button>
              </div>
            </div>

            {formErrors.imageUrl && (
              <p className="text-red-600 text-[10px] mt-1">{formErrors.imageUrl}</p>
            )}

            {formData.imageUrl && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                    <img
                      src={formData.imageUrl}
                      alt="Thumbnail"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fb) fb.classList.remove('hidden');
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="hidden w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900">Active Attached Image</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono truncate max-w-xs block mt-0.5">
                      {formData.imageUrl.startsWith('data:') ? 'Local Image Attached (Base64 WebP)' : formData.imageUrl}
                    </span>
                  </div>
                </div>

                <a
                  href={formData.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview
                </a>
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
