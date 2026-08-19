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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { ImageUploader } from '../../components/common/ImageUploader';
import { StorageCategory, UploadedMediaItem } from '../../types/storage';
import { storageService } from '../../services/storageService';
import { formatBytes } from '../../utils/imageOptimizer';

export interface StoredMediaItem {
  id: string;
  title: string;
  category: StorageCategory;
  url: string;
  storagePath?: string;
  dimensions: string;
  fileSize: string;
  mimeType: string;
  tags: string[];
  createdAt: string;
}

const DEFAULT_MEDIA_ITEMS: StoredMediaItem[] = [
  {
    id: 'med-co-01',
    title: 'Mahdev Enterprise Executive Corporate Emblem',
    category: 'company',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'company/corp_headquarters.webp',
    dimensions: '1920x1080',
    fileSize: '380 KB',
    mimeType: 'image/webp',
    tags: ['corporate', 'colombo', 'headquarters'],
    createdAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'med-div-01',
    title: 'SWS Sound Wave Studio Production Floor',
    category: 'divisions',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'divisions/sws/production_floor.webp',
    dimensions: '1920x1080',
    fileSize: '450 KB',
    mimeType: 'image/webp',
    tags: ['sws', 'audio', 'studio', 'division'],
    createdAt: '2026-01-08T10:00:00Z',
  },
  {
    id: 'med-srv-01',
    title: 'BMICH Grand Gala 4K LED Matrix Stage Service',
    category: 'services',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'services/events/bmich_gala.webp',
    dimensions: '1920x1080',
    fileSize: '420 KB',
    mimeType: 'image/webp',
    tags: ['bmich', 'stage', 'led', 'concert', 'service'],
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'med-prod-01',
    title: 'Mahdev Ceylon Single-Estate Earl Grey Collection',
    category: 'products',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'products/tea/earl_grey_tin.webp',
    dimensions: '1200x1200',
    fileSize: '320 KB',
    mimeType: 'image/webp',
    tags: ['tea', 'ceylon', 'earlgrey', 'mart', 'product'],
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'med-port-01',
    title: 'Fine-Art Editorial Studio Shoot Portfolio',
    category: 'portfolio',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'portfolio/shoots/editorial_cover.webp',
    dimensions: '1200x1600',
    fileSize: '390 KB',
    mimeType: 'image/webp',
    tags: ['portrait', 'fashion', 'studio', 'portfolio'],
    createdAt: '2026-01-18T10:00:00Z',
  },
  {
    id: 'med-gal-01',
    title: 'Bespoke Highland Safari & Expedition Showcase',
    category: 'gallery',
    url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'gallery/travels/highland_expedition.webp',
    dimensions: '1920x1280',
    fileSize: '510 KB',
    mimeType: 'image/webp',
    tags: ['travels', 'sigiriya', 'gallery', 'safari'],
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'med-test-01',
    title: 'Client Testimonial Executive Verified Portrait',
    category: 'testimonials',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    storagePath: 'testimonials/client_dr_perera.webp',
    dimensions: '400x400',
    fileSize: '95 KB',
    mimeType: 'image/webp',
    tags: ['testimonial', 'portrait', 'executive'],
    createdAt: '2026-01-22T10:00:00Z',
  },
];

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

export const AdminMediaView: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<StoredMediaItem[]>(() => {
    const saved = localStorage.getItem('mahdev_admin_media_v1');
    return saved ? JSON.parse(saved) : DEFAULT_MEDIA_ITEMS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StorageCategory>('products');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaTags, setMediaTags] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadedPath, setUploadedPath] = useState('');
  const [uploadedMeta, setUploadedMeta] = useState<UploadedMediaItem | null>(null);

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

  const saveMedia = (items: StoredMediaItem[]) => {
    setMediaItems(items);
    localStorage.setItem('mahdev_admin_media_v1', JSON.stringify(items));
  };

  const handleCopyUrl = (item: StoredMediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    addToast('success', `Copied URL for "${item.title}" to clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenUpload = () => {
    setMediaTitle('');
    setMediaTags('');
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

  const handleSaveToLibrary = () => {
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
      url: uploadedUrl,
      storagePath: uploadedPath || `${selectedCategory}/${mediaTitle.toLowerCase().replace(/\s+/g, '_')}.webp`,
      dimensions: uploadedMeta?.dimensions && uploadedMeta.dimensions.width > 0
        ? `${uploadedMeta.dimensions.width}x${uploadedMeta.dimensions.height}`
        : '1920x1080',
      fileSize: uploadedMeta ? formatBytes(uploadedMeta.sizeBytes) : '350 KB',
      mimeType: uploadedMeta?.mimeType || 'image/webp',
      tags: mediaTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...mediaItems];
    saveMedia(updated);
    setIsUploadOpen(false);
    addToast('success', `Media asset "${newItem.title}" saved to ${newItem.category} repository.`);
  };

  const handleDeletePrompt = (item: StoredMediaItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.storagePath) {
      await storageService.deleteFile(itemToDelete.storagePath);
    }

    const updated = mediaItems.filter((m) => m.id !== itemToDelete.id);
    saveMedia(updated);
    setDeleteConfirmOpen(false);
    addToast('info', `Deleted "${itemToDelete.title}" from storage.`);
    setItemToDelete(null);
  };

  const filteredMedia = mediaItems.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchTag) return false;
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
              Firebase Storage Media Repository ({mediaItems.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cloud-backed asset directory supporting client-side downscaling, WebP compression, organized paths, and role-based storage permissions.
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
              placeholder="Search assets by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Storage Bucket:</span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600">
              for-her-33ea9.firebasestorage.app
            </span>
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
      {filteredMedia.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <FileImage className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-display text-sm font-bold text-slate-700">No media assets found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No assets matched your search "${searchQuery}".`
              : `No assets currently in the ${categoryFilter} repository.`}
          </p>
          <Button variant="outline" size="sm" onClick={handleOpenUpload} className="text-xs">
            Upload First Asset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
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
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                      {item.category}/
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
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
                  <h4 className="font-display text-xs font-bold text-slate-900 line-clamp-1" title={item.title}>
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{item.dimensions}</span>
                    <span>{item.fileSize}</span>
                    <span className="uppercase">{item.mimeType.split('/')[1]}</span>
                  </div>

                  {item.storagePath && (
                    <div className="text-[10px] text-slate-400 font-mono truncate" title={item.storagePath}>
                      📁 {item.storagePath}
                    </div>
                  )}

                  {item.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[9px] text-slate-400">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(item)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
          ))}
        </div>
      )}

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
          {/* Target Category Selection */}
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

          {/* Metadata Title and Tags */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Asset Title *
              </label>
              <input
                type="text"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                placeholder="e.g. Luxury Bentota Beachfront Studio Setup"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                placeholder="e.g. studio, 4k, bentota, showcase"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyUrl(previewItem)}
                className="text-xs h-7 text-white border-slate-700 hover:bg-slate-800"
              >
                Copy CDN Link
              </Button>
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
