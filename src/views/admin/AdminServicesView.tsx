import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  Clock,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  FolderTree,
  Copy,
  Barcode,
  Upload,
} from 'lucide-react';
import { CmsService, CmsCategory } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { firestoreServicesService } from '../../services/firestore/services';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { QuickCategoryCreator } from '../../components/admin/QuickCategoryCreator';
import { DivisionId } from '../../types';
import { formatCurrency, formatLKR } from '../../utils/currency';
import { compressDataUrl } from '../../utils/imageOptimizer';

export const AdminServicesView: React.FC = () => {
  const { refreshAll } = useFirestoreDataContext();
  const [services, setServices] = useState<CmsService[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingService, setEditingService] = useState<CmsService | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingService, setDeletingService] = useState<CmsService | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    divisionId: 'sws' as DivisionId,
    divisionName: 'SWS Event Management',
    category: '',
    title: '',
    sku: '',
    description: '',
    imageUrl: '',
    images: [] as string[],
    features: [''],
    iconName: 'Sparkles',
    popular: false,
    badge: 'Enterprise Tier',
    startingPrice: 75000,
    currency: 'LKR',
    turnaroundTime: '2-3 Weeks',
    isActive: true,
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSku(text);
    addToast('info', 'SKU Copied', `Copied "${text}" to clipboard.`);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadServices = () => {
    let data = cmsService.getAll<CmsService>('services', {
      divisionId: divisionFilter,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.sku && s.sku.toLowerCase().includes(q)) ||
          s.divisionName.toLowerCase().includes(q) ||
          (s.category && s.category.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== 'all') {
      data = data.filter(
        (s) => s.category === categoryFilter || s.badge === categoryFilter
      );
    }

    setServices(data);

    // Load available categories
    const allCats = cmsService.getAll<CmsCategory>('categories');
    setCategories(allCats);
  };

  useEffect(() => {
    loadServices();
    const unsubServices = cmsService.subscribe('services', loadServices);
    const unsubCategories = cmsService.subscribe('categories', loadServices);
    return () => {
      unsubServices();
      unsubCategories();
    };
  }, [searchQuery, divisionFilter, categoryFilter, statusFilter]);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const newOrder = [...services];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setServices(newOrder);

    try {
      const orderedIds = newOrder.map((s) => s.id);
      cmsService.reorder('services', orderedIds);
      await firestoreServicesService.reorderServices(orderedIds);
      addToast('info', 'Service Order Updated', 'New service display order saved and updated on website.');
      await refreshAll();
    } catch (err: any) {
      console.error('[AdminServices] Reorder error:', err);
      addToast('error', 'Reorder Failed', err.message || 'Failed to persist services order.');
    }
  };

  const generateServiceSku = (division: string, title?: string): string => {
    const divCode = (division || 'SWS').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    const cleanTitle = title
      ? title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
      : 'SRV';
    const rand = Math.floor(100 + Math.random() * 900);
    return `SRV-${divCode}-${cleanTitle || 'GEN'}-${rand}`;
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      divisionId: 'sws',
      divisionName: 'SWS Event Management',
      category: '',
      title: '',
      sku: generateServiceSku('sws'),
      description: '',
      imageUrl: '',
      images: [],
      features: ['24/7 Dedicated Concierge', 'Custom Architectural CAD Renderings', 'High Reliability Delivery'],
      iconName: 'Sparkles',
      popular: false,
      badge: 'Featured Offering',
      startingPrice: 75000,
      currency: 'LKR',
      turnaroundTime: '2-3 Weeks',
      isActive: true,
    });
    setImageUrlInput('');
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (srv: CmsService) => {
    const srvImages = (srv.images && srv.images.length > 0)
      ? srv.images.slice(0, 5)
      : (srv.imageUrl ? [srv.imageUrl] : []);

    setEditingService(srv);
    setFormData({
      divisionId: srv.divisionId,
      divisionName: srv.divisionName,
      category: srv.category || '',
      title: srv.title,
      sku: srv.sku || generateServiceSku(srv.divisionId, srv.title),
      description: srv.description,
      imageUrl: srvImages[0] || srv.imageUrl || '',
      images: srvImages,
      features: srv.features.length > 0 ? [...srv.features] : [''],
      iconName: srv.iconName || 'Sparkles',
      popular: srv.popular,
      badge: srv.badge,
      startingPrice: srv.startingPrice || srv.price || 50000,
      currency: srv.currency || 'LKR',
      turnaroundTime: srv.turnaroundTime || '2-3 Weeks',
      isActive: srv.isActive,
    });
    setImageUrlInput('');
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 5 - formData.images.length;
    if (availableSlots <= 0) {
      addToast('warning', 'Maximum Limit Reached', 'You can upload a maximum of 5 images per service.');
      e.target.value = '';
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      addToast('info', 'Images Capped', `Only ${availableSlots} more image(s) can be added (maximum 5 images).`);
    }

    const newImages: string[] = [];
    for (const file of filesToProcess) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const compressed = await compressDataUrl(base64, 1200, 0.82);
        newImages.push(compressed);
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }

    if (newImages.length > 0) {
      const merged = [...formData.images, ...newImages].slice(0, 5);
      setFormData((prev) => ({
        ...prev,
        images: merged,
        imageUrl: prev.imageUrl || merged[0] || '',
      }));
      setIsDirty(true);
      addToast('success', 'Images Uploaded', `Successfully added ${newImages.length} image(s) (Total: ${merged.length}/5).`);
    }
    e.target.value = '';
  };

  const handleAddImageUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (formData.images.length >= 5) {
      addToast('warning', 'Maximum Limit Reached', 'Maximum 5 images allowed per service.');
      return;
    }
    const merged = [...formData.images, trimmed].slice(0, 5);
    setFormData((prev) => ({
      ...prev,
      images: merged,
      imageUrl: prev.imageUrl || merged[0] || '',
    }));
    setImageUrlInput('');
    setIsDirty(true);
    addToast('success', 'Image Added', `Added image to service (${merged.length}/5).`);
  };

  const handleRemoveImage = (index: number) => {
    const nextImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      images: nextImages,
      imageUrl: nextImages[0] || '',
    }));
    setIsDirty(true);
  };

  const handleMakeCoverImage = (index: number) => {
    if (index === 0) return;
    const selected = formData.images[index];
    const nextImages = [selected, ...formData.images.filter((_, i) => i !== index)];
    setFormData((prev) => ({
      ...prev,
      images: nextImages,
      imageUrl: selected,
    }));
    setIsDirty(true);
    addToast('info', 'Primary Cover Updated', 'Image set as the primary cover.');
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

  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
    setIsDirty(true);
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...formData.features];
    updated[index] = val;
    setFormData({ ...formData, features: updated });
    setIsDirty(true);
  };

  const handleRemoveFeature = (index: number) => {
    const updated = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updated });
    setIsDirty(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Service Title is required';
    if (!formData.description.trim()) errors.description = 'Service Description is required';
    if (formData.startingPrice < 0) errors.startingPrice = 'Starting Price cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const cleanFeatures = formData.features.map((f) => f.trim()).filter(Boolean);
      const finalImages = formData.images.slice(0, 5);
      const primaryImage = finalImages[0] || formData.imageUrl.trim();
      const resolvedCategory = formData.category.trim() || formData.badge.trim() || 'General';

      // Ensure category exists in categories collection
      const existingCategory = cmsService
        .getAll<CmsCategory>('categories')
        .find((c) => c.name.toLowerCase() === resolvedCategory.toLowerCase());

      if (!existingCategory && resolvedCategory !== 'General') {
        cmsService.create<CmsCategory>('categories', {
          name: resolvedCategory,
          slug: resolvedCategory
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          divisionId: formData.divisionId,
          description: `Services category for ${resolvedCategory}`,
          iconName: 'Sparkles',
          itemCount: 1,
          displayOrder: 1,
          isActive: true,
        });
      }

      const finalSku = (formData.sku || generateServiceSku(formData.divisionId, formData.title)).trim().toUpperCase();

      const payload = {
        ...formData,
        sku: finalSku,
        category: resolvedCategory,
        imageUrl: primaryImage || undefined,
        images: finalImages.length > 0 ? finalImages : (primaryImage ? [primaryImage] : undefined),
        features: cleanFeatures.length > 0 ? cleanFeatures : ['Professional Service Consultation'],
      };

      const firestoreData = {
        title: payload.title,
        division: payload.divisionId as DivisionId,
        divisionName: payload.divisionName,
        category: payload.category,
        sku: payload.sku,
        description: payload.description,
        imageUrl: payload.imageUrl,
        images: payload.images,
        features: payload.features,
        price: payload.startingPrice,
        startingPrice: payload.startingPrice,
        currency: payload.currency,
        badge: payload.badge,
        popular: payload.popular,
        isActive: payload.isActive,
      };

      if (editingService) {
        cmsService.update<CmsService>('services', editingService.id, payload);
        await firestoreServicesService.saveService(editingService.id, firestoreData);
        addToast('success', 'Service Updated', `"${formData.title}" saved to Firestore.`);
      } else {
        const created = cmsService.create<CmsService>('services', payload);
        await firestoreServicesService.saveService(created.id, firestoreData);
        addToast('success', 'Service Created', `"${formData.title}" saved to Firestore.`);
      }
      await refreshAll();
      setIsDirty(false);
      setIsEditorOpen(false);
      loadServices();
    } catch (err: any) {
      console.error('[AdminServices] Save error:', err);
      addToast('error', 'Error Saving Service', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async (permanent: boolean) => {
    if (!deletingService) return;
    try {
      if (permanent) {
        cmsService.hardDelete('services', deletingService.id);
        await firestoreServicesService.deleteService(deletingService.id);
        addToast('warning', 'Permanent Deletion', `"${deletingService.title}" was permanently removed from Firestore.`);
      } else {
        cmsService.softDelete('services', deletingService.id);
        await firestoreServicesService.saveService(deletingService.id, { status: 'inactive', isPublished: false });
        addToast('info', 'Service Archived', `"${deletingService.title}" was archived.`);
      }
      await refreshAll();
    } catch (err: any) {
      console.error('[AdminServices] Delete error:', err);
      addToast('error', 'Delete Error', err.message || 'Failed to delete service.');
    }
    setDeletingService(null);
    loadServices();
  };

  const handleRestore = (srv: CmsService) => {
    cmsService.restore('services', srv.id);
    addToast('success', 'Service Restored', `"${srv.title}" is restored.`);
    loadServices();
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Services Catalog CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {services.length} Services
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Create and edit service offerings, package scopes, deliverables, and starting prices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Service
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service title, features..."
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
            <option value="sws">SWS Event Management</option>
            <option value="u1">U1 Studio</option>
            <option value="it">Mahdev IT & Solutions</option>
            <option value="travels">Mahdev Travels</option>
            <option value="mart">Mahdev Online Mart</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="deleted">Archived</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Order</th>
                <th className="py-3.5 px-4">Service & Division</th>
                <th className="py-3.5 px-4">Deliverables & Features</th>
                <th className="py-3.5 px-4">Starting Price</th>
                <th className="py-3.5 px-4">Turnaround</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No services found matching filters.
                  </td>
                </tr>
              ) : (
                services.map((srv, idx) => (
                  <tr key={srv.id} className={`hover:bg-slate-50/80 transition-colors ${srv.isDeleted ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-500 w-4 text-center">
                          {srv.order || idx + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === services.length - 1}
                            className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {srv.imageUrl || (srv.images && srv.images[0]) ? (
                          <img
                            src={srv.imageUrl || (srv.images && srv.images[0])}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{srv.title}</span>
                            {srv.popular && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                              {srv.divisionName}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(srv.sku || `SRV-${srv.divisionId.toUpperCase()}-${srv.id.slice(-4)}`)}
                              className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                              title="Click to copy SKU"
                            >
                              <Barcode className="w-2.5 h-2.5 text-slate-500" />
                              <span>{srv.sku || `SRV-${srv.divisionId.toUpperCase()}-${srv.id.slice(-4)}`}</span>
                              {copiedSku === (srv.sku || `SRV-${srv.divisionId.toUpperCase()}-${srv.id.slice(-4)}`) ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 text-slate-400" />
                              )}
                            </button>
                            {(srv.category || srv.badge) && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                                <FolderTree className="w-2.5 h-2.5 text-blue-500" />
                                {srv.category || srv.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-[11px] text-slate-600 block line-clamp-1 mb-1">{srv.description}</span>
                      <div className="flex flex-wrap gap-1">
                        {srv.features?.slice(0, 2).map((feat, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-mono truncate max-w-[140px]">
                            {feat}
                          </span>
                        ))}
                        {srv.features?.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold">+{srv.features.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(srv.startingPrice, srv.currency || 'LKR')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] font-mono">
                      <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                      {srv.turnaroundTime || 'Custom'}
                    </td>
                    <td className="py-3.5 px-4">
                      {srv.isDeleted ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : srv.isActive ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {srv.isDeleted ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(srv)} className="text-blue-600">
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(srv)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Service"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingService(srv)}
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

      {/* Service Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingService ? `Edit Service: ${editingService.title}` : 'Create New Service Offering'}
        subtitle="Specify division ownership, scope deliverables, pricing, and SLA turnaround."
        isDirty={isDirty}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-1 lg:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Service Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Cinema 8K Documentaries"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.title && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.title}</p>}
            </div>

            <div className="sm:col-span-1 lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Service SKU *</label>
                <button
                  type="button"
                  onClick={() => {
                    const newSku = generateServiceSku(formData.divisionId, formData.title);
                    setFormData((prev) => ({ ...prev, sku: newSku }));
                    setIsDirty(true);
                  }}
                  className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Generate
                </button>
              </div>
              <div className="relative">
                <Barcode className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => {
                    setFormData({ ...formData, sku: e.target.value.toUpperCase() });
                    setIsDirty(true);
                  }}
                  placeholder="e.g. SRV-SWS-CIN-101"
                  className="w-full pl-8 pr-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase text-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-1 lg:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Division *</label>
              <select
                value={formData.divisionId}
                onChange={(e) => handleDivisionChange(e.target.value as DivisionId)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="sws">SWS Event Management</option>
                <option value="u1">U1 Studio</option>
                <option value="it">Mahdev IT & Solutions</option>
                <option value="travels">Mahdev Travels</option>
                <option value="mart">Mahdev Online Mart</option>
              </select>
            </div>

            <div className="sm:col-span-1 lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Category</label>
                <QuickCategoryCreator
                  currentDivisionId={formData.divisionId}
                  onCategoryCreated={(newCat) => {
                    setCategories((prev) => Array.from(new Set([...prev, newCat])));
                    setFormData((prev) => ({
                      ...prev,
                      category: newCat.name,
                      badge: prev.badge || newCat.name,
                    }));
                    setIsDirty(true);
                    addToast(
                      'success',
                      'Category Created',
                      `"${newCat.name}" created and assigned to service.`
                    );
                  }}
                  buttonLabel="+ Manual Add"
                />
              </div>
              <select
                value={formData.category}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    category: val,
                    badge: formData.badge || val,
                  });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- General / No Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.divisionId.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Comprehensive summary of service capabilities and client value proposition..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {formErrors.description && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.description}</p>}
          </div>

          {/* Service Images / Media (Max 5 Images) */}
          <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-semibold text-purple-950 text-sm">
                  Service Images (Max 5 Images)
                </label>
                <p className="text-[11px] text-purple-700/80">
                  Upload up to 5 photos saved to Firestore and rendered on the website. The first image is the cover.
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                formData.images.length >= 5
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {formData.images.length} / 5 Images
              </span>
            </div>

            {/* Actions: Upload & URL */}
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  formData.images.length >= 5
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-xs'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  disabled={formData.images.length >= 5}
                  className="hidden"
                />
              </label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMediaPickerOpen(true)}
                disabled={formData.images.length >= 5}
                className="flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Media Library
              </Button>

              <div className="flex items-center gap-1 grow min-w-[200px]">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste image URL..."
                  disabled={formData.images.length >= 5}
                  className="grow px-3 py-1.5 border rounded-xl border-purple-200 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddImageUrl(imageUrlInput)}
                  disabled={!imageUrlInput.trim() || formData.images.length >= 5}
                  className="shrink-0 text-xs cursor-pointer"
                >
                  Add URL
                </Button>
              </div>
            </div>

            {/* Thumbnails grid */}
            {formData.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {formData.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-slate-100 shadow-2xs ${
                      idx === 0 ? 'border-purple-600 ring-2 ring-purple-600/20' : 'border-purple-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Service image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Cover badge */}
                    {idx === 0 ? (
                      <span className="absolute top-1.5 left-1.5 bg-purple-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeCoverImage(idx)}
                        className="absolute bottom-1.5 left-1.5 bg-purple-900/80 hover:bg-purple-700 text-white text-[9px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        Set Cover
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-slate-900/75 hover:bg-red-600 text-white p-1 rounded-lg text-[10px] transition cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-purple-200/80 rounded-xl text-center bg-white/60 text-purple-900/70 text-xs">
                No images added yet. Upload up to 5 images (stored in Firestore and displayed on the website).
              </div>
            )}
          </div>

          {/* Features / Deliverables List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">Included Features / Key Deliverables</label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {formData.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 text-center text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder="e.g. Cinema 8K RAW Multi-Camera Switchboard"
                    className="w-full px-3 py-1.5 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Starting Price (LKR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.startingPrice}
                  onChange={(e) => {
                    setFormData({ ...formData, startingPrice: parseFloat(e.target.value) || 0 });
                    setIsDirty(true);
                  }}
                  className="w-full pl-9 pr-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => {
                  setFormData({ ...formData, currency: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-bold font-mono"
              >
                <option value="LKR">LKR (Rs. Sri Lanka)</option>
                <option value="USD">USD ($ United States)</option>
                <option value="EUR">EUR (€ Europe)</option>
                <option value="GBP">GBP (£ United Kingdom)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Turnaround Time</label>
              <input
                type="text"
                value={formData.turnaroundTime}
                onChange={(e) => {
                  setFormData({ ...formData, turnaroundTime: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. 2-3 Weeks Delivery"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => {
                  setFormData({ ...formData, badge: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Media & Film"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
                  checked={formData.popular}
                  onChange={(e) => {
                    setFormData({ ...formData, popular: e.target.checked });
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span className="font-semibold text-slate-700">Mark as Popular</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        currentUrl={formData.imageUrl}
        onSelect={(url) => {
          handleAddImageUrl(url);
          setIsMediaPickerOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingService}
        title="Delete Service Offering"
        message={`Are you sure you want to remove or archive "${deletingService?.title}"?`}
        itemIdentifier={deletingService ? `${deletingService.title} (${deletingService.divisionName})` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingService?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingService(null)}
      />
    </div>
  );
};
