import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  FolderTree,
  Copy,
  Barcode,
  Check,
  Upload,
  X,
} from 'lucide-react';
import { CmsGalleryItem, CmsCategory } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { QuickCategoryCreator } from '../../components/admin/QuickCategoryCreator';
import { DivisionId } from '../../types';
import { compressDataUrl } from '../../utils/imageOptimizer';
import { uploadMediaAsset } from '../../services/mediaUploadService';
import { firestoreGalleryService } from '../../services/firestore/gallery';
import { purgeRemovedStudioPostsFromFirestore } from '../../services/firestore/databaseManagement';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

const PRESET_GALLERY_CATEGORIES = [
  'Weddings',
  'Corporate',
  'Birthdays & Socials',
  'Stage & Lighting',
  'Dining & Decor',
  'Studio Photography',
  'Exhibition & Stalls',
  'Private Celebrations',
  'Other / Custom',
];

export const AdminGalleryView: React.FC = () => {
  const { refreshAll } = useFirestoreDataContext();
  const [galleryItems, setGalleryItems] = useState<CmsGalleryItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    PRESET_GALLERY_CATEGORIES.filter((c) => c !== 'Other / Custom')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CmsGalleryItem | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Delete State
  const [deletingItem, setDeletingItem] = useState<CmsGalleryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    divisionId: 'sws' as DivisionId,
    category: 'Weddings',
    caption: '',
    mediaUrl: '',
    thumbnailUrl: '',
    images: [] as string[],
    type: 'image' as 'image' | 'video',
    aspectRatio: '16:9',
    tags: ['Stage', 'Lighting'],
    sortOrder: 1,
    isActive: true,
  });

  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSku(text);
    addToast('info', 'SKU Copied', `Copied "${text}" to clipboard.`);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const generateGallerySku = (division: string, title?: string): string => {
    const divCode = (division || 'SWS').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    const cleanTitle = title
      ? title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
      : 'GAL';
    const rand = Math.floor(100 + Math.random() * 900);
    return `GAL-${divCode}-${cleanTitle || 'GEN'}-${rand}`;
  };

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadData = () => {
    let data = cmsService.getAll<CmsGalleryItem>('gallery', {
      divisionId: divisionFilter,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (g.caption && g.caption.toLowerCase().includes(q)) ||
          (g.sku && g.sku.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q)) ||
          (Array.isArray(g.tags) && g.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    setGalleryItems(data);

    // Refresh categories from CMS and current gallery items
    const cmsCats = cmsService.getAll<CmsCategory>('categories');
    const allGalleryItems = cmsService.getAll<CmsGalleryItem>('gallery');
    const itemCats = allGalleryItems.map((g) => g.category).filter(Boolean) as string[];
    const merged = Array.from(
      new Set([
        ...PRESET_GALLERY_CATEGORIES.filter((c) => c !== 'Other / Custom'),
        ...cmsCats.map((c) => c.name),
        ...itemCats,
      ])
    ).sort();
    setAvailableCategories(merged);
  };

  useEffect(() => {
    loadData();
    const unsubGallery = cmsService.subscribe('gallery', loadData);
    const unsubCategories = cmsService.subscribe('categories', loadData);
    return () => {
      unsubGallery();
      unsubCategories();
    };
  }, [searchQuery, divisionFilter, categoryFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      sku: generateGallerySku('sws'),
      divisionId: 'sws',
      category: 'Weddings',
      caption: '',
      mediaUrl: '',
      thumbnailUrl: '',
      images: [],
      type: 'image',
      aspectRatio: '16:9',
      tags: ['Weddings'],
      sortOrder: galleryItems.length + 1,
      isActive: true,
    });
    setMediaUrlInput('');
    setCustomCategoryInput('');
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: CmsGalleryItem) => {
    setEditingItem(item);
    const existingCat = item.category || (Array.isArray(item.tags) && item.tags[0]) || 'Weddings';
    const isPreset = PRESET_GALLERY_CATEGORIES.includes(existingCat);
    const itemImages = (item.images && item.images.length > 0)
      ? item.images.slice(0, 3)
      : (item.mediaUrl ? [item.mediaUrl] : []);

    setFormData({
      title: item.title,
      sku: item.sku || generateGallerySku(item.divisionId, item.title),
      divisionId: item.divisionId,
      category: isPreset ? existingCat : 'Other / Custom',
      caption: item.caption || '',
      mediaUrl: itemImages[0] || item.mediaUrl || '',
      thumbnailUrl: item.thumbnailUrl || itemImages[0] || item.mediaUrl || '',
      images: itemImages,
      type: item.type || 'image',
      aspectRatio: item.aspectRatio || '16:9',
      tags: item.tags || [],
      sortOrder: item.sortOrder || 1,
      isActive: item.isActive,
    });
    setMediaUrlInput('');
    setCustomCategoryInput(isPreset ? '' : existingCat);
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 3 - formData.images.length;
    if (availableSlots <= 0) {
      addToast('warning', 'Maximum Limit Reached', 'You can upload a maximum of 3 images for gallery.');
      e.target.value = '';
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      addToast('info', 'Images Capped', `Only ${availableSlots} more image(s) can be added (maximum 3 images).`);
    }

    const newImages: string[] = [];
    for (const file of filesToProcess) {
      try {
        const uploadedUrl = await uploadMediaAsset(file);
        if (uploadedUrl) {
          newImages.push(uploadedUrl);
        }
      } catch (err) {
        console.warn('Direct upload fallback:', err);
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const compressed = await compressDataUrl(base64, 800, 0.7);
          newImages.push(compressed);
        } catch (compErr) {
          console.error('Failed to process gallery image:', compErr);
        }
      }
    }

    if (newImages.length > 0) {
      const merged = [...formData.images, ...newImages].slice(0, 3);
      setFormData((prev) => ({
        ...prev,
        images: merged,
        mediaUrl: prev.mediaUrl || merged[0] || '',
        thumbnailUrl: prev.thumbnailUrl || merged[0] || '',
      }));
      setIsDirty(true);
      addToast('success', 'Images Uploaded', `Added ${newImages.length} image(s) to gallery (Total: ${merged.length}/3).`);
    }
    e.target.value = '';
  };

  const handleAddImageUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (formData.images.length >= 3) {
      addToast('warning', 'Maximum Limit Reached', 'Maximum 3 images allowed for gallery item.');
      return;
    }
    const merged = [...formData.images, trimmed].slice(0, 3);
    setFormData((prev) => ({
      ...prev,
      images: merged,
      mediaUrl: prev.mediaUrl || merged[0] || '',
      thumbnailUrl: prev.thumbnailUrl || merged[0] || '',
    }));
    setMediaUrlInput('');
    setIsDirty(true);
    addToast('success', 'Image Added', `Added image to gallery (${merged.length}/3).`);
  };

  const handleRemoveImage = (index: number) => {
    const nextImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      images: nextImages,
      mediaUrl: nextImages[0] || '',
      thumbnailUrl: nextImages[0] || '',
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
      mediaUrl: selected,
      thumbnailUrl: selected,
    }));
    setIsDirty(true);
    addToast('info', 'Primary Photo Set', 'Selected photo is now the primary image.');
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.images.length && !formData.mediaUrl.trim()) {
      errors.mediaUrl = 'At least 1 media image is required (max 3)';
    }
    if (formData.category === 'Other / Custom' && !customCategoryInput.trim()) {
      errors.category = 'Please enter a custom category name';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('warning', 'Validation Incomplete', 'Please provide a title and at least one image before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const resolvedCategory =
        formData.category === 'Other / Custom' && customCategoryInput.trim()
          ? customCategoryInput.trim()
          : (formData.category || 'Weddings');

      // Ensure this category is registered in the central categories collection
      const existingCategory = cmsService
        .getAll<CmsCategory>('categories')
        .find((c) => c.name.toLowerCase() === resolvedCategory.toLowerCase());

      if (!existingCategory) {
        cmsService.create<CmsCategory>('categories', {
          name: resolvedCategory,
          slug: resolvedCategory
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          divisionId: formData.divisionId,
          description: `Gallery collection for ${resolvedCategory}`,
          iconName: 'FolderTree',
          itemCount: 1,
          displayOrder: 1,
          isActive: true,
        });
      }

      const finalImages = formData.images.slice(0, 3);
      const primaryMedia = finalImages[0] || formData.mediaUrl.trim();
      const primaryThumbnail = finalImages[0] || formData.thumbnailUrl?.trim() || primaryMedia;

      const finalSku = (formData.sku || generateGallerySku(formData.divisionId, formData.title)).trim().toUpperCase();

      const payload = {
        ...formData,
        sku: finalSku,
        mediaUrl: primaryMedia,
        thumbnailUrl: primaryThumbnail,
        images: finalImages.length > 0 ? finalImages : (primaryMedia ? [primaryMedia] : undefined),
        category: resolvedCategory,
        tags: Array.from(new Set([resolvedCategory, ...(formData.tags || [])])),
      };

      const firestoreData = {
        title: payload.title,
        division: payload.divisionId,
        url: primaryMedia,
        mediaUrl: primaryMedia,
        thumbnailUrl: primaryThumbnail,
        images: payload.images,
        category: payload.category,
        caption: payload.caption,
        aspectRatio: payload.aspectRatio,
        tags: payload.tags,
        order: payload.sortOrder,
        sku: payload.sku,
        type: payload.type,
        status: payload.isActive ? ('published' as const) : ('hidden' as const),
      };

      if (editingItem) {
        cmsService.update<CmsGalleryItem>('gallery', editingItem.id, payload);
        firestoreGalleryService.saveGallery(editingItem.id, firestoreData).catch((fErr) => {
          console.warn('[AdminGallery] Firestore background sync notice:', fErr);
        });
        addToast('success', 'Gallery Item Saved', `"${formData.title}" saved successfully.`);
      } else {
        const created = cmsService.create<CmsGalleryItem>('gallery', payload);
        firestoreGalleryService.saveGallery(created.id, firestoreData).catch((fErr) => {
          console.warn('[AdminGallery] Firestore background sync notice:', fErr);
        });
        addToast('success', 'Gallery Item Created', `"${formData.title}" saved successfully.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadData();
      if (typeof refreshAll === 'function') {
        refreshAll().catch((rErr) => console.warn('[AdminGallery] refresh notice:', rErr));
      }
    } catch (err: any) {
      console.error('[AdminGallery] Save error:', err);
      addToast('error', 'Error Saving Gallery', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const [isPurgingStudio, setIsPurgingStudio] = useState(false);

  const handleDeleteConfirm = async (permanent: boolean) => {
    if (!deletingItem) return;
    const itemToDelete = deletingItem;
    try {
      if (permanent) {
        cmsService.hardDelete('gallery', itemToDelete.id);
        try {
          await firestoreGalleryService.deleteGallery(itemToDelete.id);
        } catch (fErr) {
          console.warn('[AdminGallery] Firestore deletion warning:', fErr);
        }
        addToast('warning', 'Permanent Deletion', `"${itemToDelete.title}" permanently removed from Firestore & storage.`);
      } else {
        cmsService.softDelete('gallery', itemToDelete.id);
        try {
          await firestoreGalleryService.saveGallery(itemToDelete.id, { status: 'hidden' });
        } catch (fErr) {
          console.warn('[AdminGallery] Firestore archive warning:', fErr);
        }
        addToast('info', 'Gallery Item Archived', `"${itemToDelete.title}" archived.`);
      }
      await refreshAll();
    } finally {
      setDeletingItem(null);
      loadData();
    }
  };

  const handlePurgeStudioPosts = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all removed/archived Studio posts from Firestore? This cannot be undone.')) {
      return;
    }
    setIsPurgingStudio(true);
    try {
      const res = await purgeRemovedStudioPostsFromFirestore(false);
      addToast(
        res.success ? 'success' : 'warning',
        'Studio Posts Cleaned',
        `Cleaned ${res.galleryDeleted} gallery items and ${res.portfolioDeleted} portfolio items from Firestore.`
      );
      loadData();
    } catch (err: any) {
      addToast('error', 'Cleanup Failed', err.message || 'Could not purge studio posts.');
    } finally {
      setIsPurgingStudio(false);
    }
  };

  const handleRestore = (item: CmsGalleryItem) => {
    cmsService.restore('gallery', item.id);
    addToast('success', 'Gallery Item Restored', `"${item.title}" restored.`);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Media Gallery CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {galleryItems.length} Assets
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Publish high-resolution photo galleries, event staging visuals, and cinematic captures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePurgeStudioPosts}
            disabled={isPurgingStudio}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {isPurgingStudio ? 'Cleaning Firestore...' : 'Purge Removed Studio Posts'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Gallery Asset
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gallery title, caption..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer text-slate-700"
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
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer text-slate-700"
          >
            <option value="all">All Categories ({availableCategories.length})</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer text-slate-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="deleted">Archived</option>
          </select>
        </div>
      </div>

      {/* Grid of Gallery Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {galleryItems.filter((item) => {
          if (categoryFilter !== 'all') {
            const itemCat = item.category || (Array.isArray(item.tags) && item.tags[0]);
            if (itemCat !== categoryFilter) return false;
          }
          return true;
        }).length === 0 ? (
          <div className="col-span-full py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No gallery assets found matching filters.
          </div>
        ) : (
          galleryItems
            .filter((item) => {
              if (categoryFilter !== 'all') {
                const itemCat = item.category || (Array.isArray(item.tags) && item.tags[0]);
                if (itemCat !== categoryFilter) return false;
              }
              return true;
            })
            .map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col transition-all hover:shadow-md ${
                item.isDeleted ? 'opacity-60 bg-slate-50' : ''
              }`}
            >
              <div className="relative aspect-16/10 bg-slate-100 overflow-hidden group">
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  {item.category || (Array.isArray(item.tags) && item.tags[0]) || 'Weddings'}
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {item.divisionId}
                </div>
              </div>

              <div className="p-4 grow flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-display font-bold text-slate-900 text-xs truncate">{item.title}</h4>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.sku || `GAL-${item.divisionId.toUpperCase()}-${item.id.slice(-4)}`)}
                      className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer shrink-0"
                      title="Click to copy SKU"
                    >
                      <Barcode className="w-2.5 h-2.5 text-slate-500" />
                      <span>{item.sku || `GAL-${item.divisionId.toUpperCase()}-${item.id.slice(-4)}`}</span>
                      {copiedSku === (item.sku || `GAL-${item.divisionId.toUpperCase()}-${item.id.slice(-4)}`) ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                  {item.caption && <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.caption}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {item.isDeleted ? (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Archived
                      </span>
                    ) : item.isActive ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {item.isDeleted ? (
                      <Button variant="outline" size="sm" onClick={() => handleRestore(item)} className="text-blue-600">
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Restore
                      </Button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingItem ? `Edit Asset: ${editingItem.title}` : 'Add Gallery Media Asset'}
        subtitle="Upload or select high-resolution imagery for brand portfolio grids."
        isDirty={isDirty}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Lotus Tower Drone Sunset Panorama"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.title && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.title}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Gallery SKU *</label>
                <button
                  type="button"
                  onClick={() => {
                    const newSku = generateGallerySku(formData.divisionId, formData.title);
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
                  placeholder="e.g. GAL-SWS-WED-101"
                  className="w-full pl-8 pr-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Division Assignment</label>
              <select
                value={formData.divisionId}
                onChange={(e) => {
                  setFormData({ ...formData, divisionId: e.target.value as DivisionId });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="sws">SWS Event Management</option>
                <option value="u1">U1 Studio</option>
                <option value="it">Mahdev IT & Solutions</option>
                <option value="travels">Mahdev Travels</option>
                <option value="mart">Mahdev Online Mart</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Category *</label>
                <QuickCategoryCreator
                  currentDivisionId={formData.divisionId}
                  onCategoryCreated={(newCat) => {
                    setAvailableCategories((prev) =>
                      Array.from(new Set([...prev, newCat.name])).sort()
                    );
                    setFormData((prev) => ({ ...prev, category: newCat.name }));
                    setCustomCategoryInput('');
                    setIsDirty(true);
                    addToast(
                      'success',
                      'Category Created',
                      `"${newCat.name}" is now created and applied.`
                    );
                  }}
                  buttonLabel="+ Manual Add"
                />
              </div>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Other / Custom">+ Other / Custom</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Aspect Ratio</label>
              <select
                value={formData.aspectRatio}
                onChange={(e) => {
                  setFormData({ ...formData, aspectRatio: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              >
                <option value="16:9">16:9 Landscape (Widescreen)</option>
                <option value="4:3">4:3 Standard</option>
                <option value="1:1">1:1 Square</option>
                <option value="9:16">9:16 Portrait (Mobile)</option>
              </select>
            </div>
          </div>

          {formData.category === 'Other / Custom' && (
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
              <label className="block font-semibold text-blue-900 mb-1">Custom Category Name *</label>
              <input
                type="text"
                value={customCategoryInput}
                onChange={(e) => {
                  setCustomCategoryInput(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Traditional Weddings, High Tea, Fashion Show..."
                className="w-full px-3 py-2 border rounded-lg border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
              {formErrors.category && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.category}</p>}
            </div>
          )}

          {/* Gallery Media Images (Max 3 Images) */}
          <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-semibold text-purple-950 text-sm">
                  Gallery Photos (Max 3 Images) *
                </label>
                <p className="text-[11px] text-purple-700/80">
                  Upload up to 3 showcase photos stored in Firestore and visible on the website. First image acts as primary cover.
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                formData.images.length >= 3
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {formData.images.length} / 3 Images
              </span>
            </div>

            {/* Actions: Upload & URL */}
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  formData.images.length >= 3
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-xs'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  disabled={formData.images.length >= 3}
                  className="hidden"
                />
              </label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMediaPickerOpen(true)}
                disabled={formData.images.length >= 3}
                className="flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Media Library
              </Button>

              <div className="flex items-center gap-1 grow min-w-[200px]">
                <input
                  type="url"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  placeholder="Paste image URL..."
                  disabled={formData.images.length >= 3}
                  className="grow px-3 py-1.5 border rounded-xl border-purple-200 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddImageUrl(mediaUrlInput)}
                  disabled={!mediaUrlInput.trim() || formData.images.length >= 3}
                  className="shrink-0 text-xs cursor-pointer"
                >
                  Add URL
                </Button>
              </div>
            </div>

            {formErrors.mediaUrl && <p className="text-red-600 text-[10px]">{formErrors.mediaUrl}</p>}

            {/* Thumbnails grid */}
            {formData.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {formData.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`group relative aspect-video rounded-xl overflow-hidden border-2 bg-slate-100 shadow-2xs ${
                      idx === 0 ? 'border-purple-600 ring-2 ring-purple-600/20' : 'border-purple-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Gallery item ${idx + 1}`}
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
                        Set as Cover
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
                No gallery photos added yet. Upload up to 3 images (stored in Firestore and showcased on the website).
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Caption / Notes</label>
            <input
              type="text"
              value={formData.caption}
              onChange={(e) => {
                setFormData({ ...formData, caption: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. 4K LED multi-angle stage installation at BMICH"
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
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

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingItem ? 'Update Asset' : 'Add Asset'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Media Picker */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        currentUrl={formData.mediaUrl}
        onSelect={(url) => {
          handleAddImageUrl(url);
          setIsMediaPickerOpen(false);
        }}
      />

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!deletingItem}
        title="Delete Gallery Asset"
        message={`Are you sure you want to remove "${deletingItem?.title}"?`}
        itemIdentifier={deletingItem ? `${deletingItem.title} (${deletingItem.divisionId})` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingItem?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
};
