import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  Filter,
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
  HardDrive,
  Eye,
  FileImage,
  RefreshCw,
  FolderTree,
  Pencil,
  Tag,
  Sliders,
  Building,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { ImageUploader } from '../../components/common/ImageUploader';
import { StorageCategory, UploadedMediaItem } from '../../types/storage';
import { storageService } from '../../services/storageService';
import { formatBytes } from '../../utils/imageOptimizer';
import { safeStorage } from '../../utils/safeStorage';
import {
  mediaService,
  StoredMediaItem,
} from '../../services/firestore/media';

export type { StoredMediaItem };

const STORAGE_CATEGORIES: { id: StorageCategory; label: string; count?: number }[] = [
  { id: 'company', label: 'Company Brand Assets' },
  { id: 'divisions', label: 'Division Portals' },
  { id: 'services', label: 'Service Offerings' },
  { id: 'products', label: 'Product Catalog' },
  { id: 'portfolio', label: 'Portfolio & Case Studies' },
  { id: 'gallery', label: 'Public Media Gallery' },
  { id: 'testimonials', label: 'Client Testimonials' },
  { id: 'users', label: 'User Profiles & Avatars' },
  { id: 'documents', label: 'Enterprise Documents' },
  { id: 'invoices', label: 'Invoices & Statements' },
];

const DIVISION_OPTIONS = [
  { id: '', label: 'General / Global (All Divisions)' },
  { id: 'u1', label: 'U1 Studio (Photography & Cinema)' },
  { id: 'it', label: 'IT Solutions (Digital & Tech)' },
  { id: 'mart', label: 'Online Mart (E-Commerce)' },
  { id: 'sws', label: 'SWS Event Management' },
  { id: 'travels', label: 'Mahdev Travels' },
];

export const AdminMediaView: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<StoredMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StorageCategory>('products');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [mediaTags, setMediaTags] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadedPath, setUploadedPath] = useState('');
  const [uploadedMeta, setUploadedMeta] = useState<UploadedMediaItem | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoredMediaItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<StorageCategory>('products');
  const [editDivision, setEditDivision] = useState<string>('');
  const [editTags, setEditTags] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDimensions, setEditDimensions] = useState('');
  const [editFileSize, setEditFileSize] = useState('');
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Preview Lightbox
  const [previewItem, setPreviewItem] = useState<StoredMediaItem | null>(null);

  // Delete Confirm Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StoredMediaItem | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  // Real-time Firestore synchronization
  useEffect(() => {
    setIsLoading(true);
    const unsub = mediaService.subscribeToMediaAssets(
      (items) => {
        setMediaItems(items);
        setIsLoading(false);
      },
      (err) => {
        console.error('[AdminMediaView] Firestore sync notice:', err);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleCopyUrl = (item: StoredMediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    addToast('success', `Copied URL for "${item.title}" to clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenUpload = () => {
    setMediaTitle('');
    setMediaDescription('');
    setMediaTags('');
    setSelectedDivision('');
    setUploadedUrl('');
    setUploadedPath('');
    setUploadedMeta(null);
    setSelectedCategory(categoryFilter !== 'all' ? (categoryFilter as StorageCategory) : 'products');
    setIsUploadOpen(true);
  };

  const handleUploadSuccess = (item: UploadedMediaItem) => {
    setUploadedUrl(item.url);
    setUploadedPath(item.storagePath);
    setUploadedMeta(item);
    if (!mediaTitle) {
      setMediaTitle(item.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const handleSaveToLibrary = async () => {
    if (!uploadedUrl) {
      addToast('error', 'Please upload or select an image file first.');
      return;
    }
    if (!mediaTitle.trim()) {
      addToast('error', 'Please provide a title for this media asset.');
      return;
    }

    const newItem: StoredMediaItem = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: mediaTitle.trim(),
      category: selectedCategory,
      division: selectedDivision || undefined,
      divisionId: selectedDivision || undefined,
      description: mediaDescription.trim() || undefined,
      url: uploadedUrl,
      storagePath: uploadedPath || `${selectedCategory}/${mediaTitle.toLowerCase().replace(/\s+/g, '_')}.webp`,
      dimensions:
        uploadedMeta?.dimensions && uploadedMeta.dimensions.width > 0
          ? `${uploadedMeta.dimensions.width}x${uploadedMeta.dimensions.height}`
          : '1920x1080',
      fileSize: uploadedMeta ? formatBytes(uploadedMeta.sizeBytes) : '350 KB',
      mimeType: uploadedMeta?.mimeType || 'image/webp',
      tags: mediaTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    try {
      await mediaService.saveMediaAsset(newItem);
      setIsUploadOpen(false);
      addToast('success', `Media asset "${newItem.title}" saved to Firestore (${newItem.category}).`);
    } catch (err: any) {
      addToast('error', `Failed to save media asset: ${err?.message || err}`);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: StoredMediaItem) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditCategory(item.category || 'products');
    setEditDivision(item.division || (item as any).divisionId || '');
    setEditTags(item.tags ? item.tags.join(', ') : '');
    setEditDescription((item as any).description || '');
    setEditUrl(item.url || '');
    setEditDimensions(item.dimensions || '');
    setEditFileSize(item.fileSize || '');
    setIsReplacingImage(false);
    setIsEditOpen(true);
  };

  const handleEditUploadSuccess = (item: UploadedMediaItem) => {
    setEditUrl(item.url);
    if (item.dimensions) setEditDimensions(`${item.dimensions.width}x${item.dimensions.height}`);
    if (item.sizeBytes) setEditFileSize(formatBytes(item.sizeBytes));
    setIsReplacingImage(false);
    addToast('success', 'New image uploaded and staged. Click "Save Changes" to apply.');
  };

  // Persist Edit
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!editTitle.trim()) {
      addToast('error', 'Please provide a title for this media asset.');
      return;
    }
    if (!editUrl.trim()) {
      addToast('error', 'Asset URL cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const parsedTags = editTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const updatedFields: Partial<StoredMediaItem> = {
        title: editTitle.trim(),
        category: editCategory,
        division: editDivision || undefined,
        divisionId: editDivision || undefined,
        description: editDescription.trim() || undefined,
        tags: parsedTags,
        url: editUrl.trim(),
        dimensions: editDimensions.trim() || editingItem.dimensions,
        fileSize: editFileSize.trim() || editingItem.fileSize,
      };

      await mediaService.saveMediaAsset(editingItem.id, updatedFields);

      // Optimistic update
      setMediaItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...item, ...updatedFields } : item))
      );

      addToast('success', `Media asset "${editTitle.trim()}" updated successfully.`);
      setIsEditOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('[AdminMediaView] Error saving edit:', err);
      addToast('error', `Failed to update asset: ${err?.message || err}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePrompt = (item: StoredMediaItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;

    const targetItem = itemToDelete;
    setIsDeleting(true);

    // Optimistically remove from local state immediately for instant responsive UX
    setMediaItems((prev) => prev.filter((m) => m.id !== targetItem.id && (!targetItem.url || m.url !== targetItem.url)));
    setDeleteConfirmOpen(false);

    try {
      // Execute multi-tier deletion: Firestore doc, deletedIds registry, Storage, and chunked blobs
      const result = await mediaService.deleteMediaAsset(
        targetItem.id,
        targetItem.storagePath,
        targetItem.url
      );

      if (result.success) {
        addToast('success', `Permanently deleted "${targetItem.title}" from Firestore and storage.`);
      } else {
        addToast('warning', `Deleted locally: ${result.error}`);
      }
    } catch (err: any) {
      console.error('[AdminMediaView] Delete error:', err);
      addToast('error', `Failed to delete from Firestore: ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const filteredMedia = mediaItems.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (divisionFilter !== 'all') {
      const itemDiv = (item.division || (item as any).divisionId || '').toLowerCase();
      if (divisionFilter === 'none') {
        if (itemDiv !== '') return false;
      } else if (itemDiv !== divisionFilter.toLowerCase()) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
      const matchDiv = (item.division || (item as any).divisionId || '').toLowerCase().includes(q);
      const matchDesc = ((item as any).description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTag && !matchDiv && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Media Asset Repository ({mediaItems.length})
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Firestore Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, edit, categorize, and organize assets across U1 Studio and all enterprise divisions.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleOpenUpload}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold shrink-0 cursor-pointer"
        >
          Upload & Optimize Media
        </Button>
      </div>

      {/* Filters & Category Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assets by title, tags, division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Division Filter Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 shrink-0">Division:</span>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Divisions ({mediaItems.length})</option>
              <option value="u1">U1 Studio ({mediaItems.filter((m) => (m.division || (m as any).divisionId || '').toLowerCase() === 'u1').length})</option>
              <option value="it">IT Solutions ({mediaItems.filter((m) => (m.division || (m as any).divisionId || '').toLowerCase() === 'it').length})</option>
              <option value="mart">Online Mart ({mediaItems.filter((m) => (m.division || (m as any).divisionId || '').toLowerCase() === 'mart').length})</option>
              <option value="sws">SWS Events ({mediaItems.filter((m) => (m.division || (m as any).divisionId || '').toLowerCase() === 'sws').length})</option>
              <option value="travels">Mahdev Travels ({mediaItems.filter((m) => (m.division || (m as any).divisionId || '').toLowerCase() === 'travels').length})</option>
              <option value="none">Global / Unassigned ({mediaItems.filter((m) => !(m.division || (m as any).divisionId)).length})</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Repositories ({mediaItems.length})
          </button>
          {STORAGE_CATEGORIES.map((cat) => {
            const count = mediaItems.filter((m) => m.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <h3 className="font-display text-sm font-bold text-slate-700">Connecting to Firestore Media Library...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Retrieving synced assets, categories, and binary metadata from the cloud database.
          </p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <FileImage className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-display text-sm font-bold text-slate-700">No media assets found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No assets matched your search "${searchQuery}".`
              : `No assets currently in this filter view.`}
          </p>
          <Button variant="outline" size="sm" onClick={handleOpenUpload} className="text-xs">
            Upload First Asset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => {
            const itemDiv = item.division || (item as any).divisionId;
            const divLabel =
              itemDiv === 'u1'
                ? 'U1 Studio'
                : itemDiv === 'it'
                ? 'IT Solutions'
                : itemDiv === 'mart'
                ? 'Online Mart'
                : itemDiv === 'sws'
                ? 'SWS Events'
                : itemDiv === 'travels'
                ? 'Travels'
                : itemDiv;

            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                        {item.category}/
                      </span>
                      {itemDiv && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-xs text-[10px] font-semibold text-white tracking-wide">
                          {divLabel}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs cursor-pointer shadow-sm"
                        title="Edit Asset Details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white hover:bg-slate-900 text-xs cursor-pointer"
                        title="Preview Full Size"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white hover:bg-slate-900 text-xs cursor-pointer"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-xs font-bold text-slate-900 line-clamp-1" title={item.title}>
                        {item.title}
                      </h4>
                    </div>

                    {(item as any).description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1" title={(item as any).description}>
                        {(item as any).description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{item.dimensions || 'Dynamic'}</span>
                      <span>{item.fileSize || ''}</span>
                      <span className="uppercase">{item.mimeType?.split('/')[1] || 'IMAGE'}</span>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {item.tags.slice(0, 4).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 4 && (
                          <span className="text-[9px] text-slate-400">+{item.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer"
                    title="Edit Asset Details"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      copiedId === item.id
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePrompt(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Media Modal */}
      <AdminModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Media Asset"
        description="Update title, division assignment, storage repository, search tags, or replace image content."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button
              variant="electric"
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editTitle.trim() || !editUrl.trim()}
              className="cursor-pointer font-bold"
            >
              {isSavingEdit ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Current Image & Replacement Section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Asset Image Preview
              </span>
              <button
                type="button"
                onClick={() => setIsReplacingImage((prev) => !prev)}
                className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>{isReplacingImage ? 'Keep Current Image' : 'Replace Image File'}</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200 relative">
                <img
                  src={editUrl}
                  alt={editTitle}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="text-[11px] font-mono text-slate-600 truncate" title={editUrl}>
                  {editUrl}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {editDimensions || 'Dynamic size'} • {editFileSize || 'Optimized'}
                </div>
              </div>
            </div>

            {isReplacingImage && (
              <div className="pt-2 border-t border-slate-200 animate-in fade-in">
                <ImageUploader
                  category={editCategory}
                  onUploadSuccess={handleEditUploadSuccess}
                  label="Upload Replacement Image"
                  helperText="Replaces the image asset in Firebase Storage with automatic WebP conversion."
                  options={{
                    maxWidth: 1920,
                    maxHeight: 1920,
                    quality: 0.85,
                    targetFormat: 'image/webp',
                  }}
                />
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Division Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Division
              </label>
              <select
                value={editDivision}
                onChange={(e) => setEditDivision(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                {DIVISION_OPTIONS.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category / Repository */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Storage Repository / Category *
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as StorageCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                {STORAGE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.id}/)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Asset Title *
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. 12 x 18 Premium Teak Frames"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="e.g. Fine art archival framing for exhibition prints and portraits."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Search Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="e.g. frame, photo, 12x18, studio, cinema, wedding"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Image URL
              </label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dimensions
              </label>
              <input
                type="text"
                value={editDimensions}
                onChange={(e) => setEditDimensions(e.target.value)}
                placeholder="e.g. 1920x1080"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Upload Media Modal */}
      <AdminModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload & Optimize Media Asset"
        description="Upload an asset to Firebase Storage with automatic WebP conversion, dimension normalization, and path organization."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="electric"
              size="sm"
              onClick={handleSaveToLibrary}
              disabled={!uploadedUrl || !mediaTitle.trim()}
              className="cursor-pointer font-bold"
            >
              Save to {selectedCategory}/ Repository
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Target Division & Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                {DIVISION_OPTIONS.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Storage Repository / Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as StorageCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                {STORAGE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.id}/)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Image Uploader with Drag & Drop */}
          <div>
            <ImageUploader
              category={selectedCategory}
              onUploadSuccess={handleUploadSuccess}
              onDelete={() => {
                setUploadedUrl('');
                setUploadedPath('');
                setUploadedMeta(null);
              }}
              label="Drop or Select File"
              helperText="Auto-resizes to max 1920px & encodes to modern WebP format before storage."
              options={{
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 0.85,
                targetFormat: 'image/webp',
              }}
            />
          </div>

          {/* Metadata Title, Description, and Tags */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Asset Title *
              </label>
              <input
                type="text"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                placeholder="e.g. 12 x 18 Premium Teak Frames"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description / Notes
              </label>
              <textarea
                rows={2}
                value={mediaDescription}
                onChange={(e) => setMediaDescription(e.target.value)}
                placeholder="e.g. Fine art archival framing for exhibition prints."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Search Tags (comma-separated)
              </label>
              <input
                type="text"
                value={mediaTags}
                onChange={(e) => setMediaTags(e.target.value)}
                placeholder="e.g. frame, photo, 12x18, studio, cinema"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Lightbox / Preview Modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full border border-slate-800 shadow-2xl"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold">{previewItem.title}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {previewItem.category}/ • {previewItem.dimensions} • {previewItem.fileSize}
                </span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden p-2">
              <img
                src={previewItem.url}
                alt={previewItem.title}
                className="max-h-[68vh] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono truncate max-w-md">{previewItem.url}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewItem(null);
                    handleOpenEdit(previewItem);
                  }}
                  className="text-xs h-7 text-white border-slate-700 hover:bg-slate-800"
                >
                  Edit Asset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUrl(previewItem)}
                  className="text-xs h-7 text-white border-slate-700 hover:bg-slate-800"
                >
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Media Asset"
        message={`Are you sure you want to permanently remove "${itemToDelete?.title}" from Firebase Storage repository? Any pages referencing this URL will need updating.`}
        confirmText="Delete Asset"
        variant="danger"
      />
    </div>
  );
};
