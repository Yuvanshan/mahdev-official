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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';

export interface StoredMediaItem {
  id: string;
  title: string;
  category: 'events' | 'cinema' | 'it' | 'travels' | 'hardware' | 'logos' | 'banners';
  url: string;
  dimensions: string;
  fileSize: string;
  mimeType: string;
  tags: string[];
  createdAt: string;
}

const DEFAULT_MEDIA_ITEMS: StoredMediaItem[] = [
  {
    id: 'med-ev-01',
    title: 'BMICH Grand Gala 4K LED Matrix',
    category: 'events',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1920x1080',
    fileSize: '420 KB',
    mimeType: 'image/jpeg',
    tags: ['bmich', 'stage', 'led', 'concert'],
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'med-ev-02',
    title: 'Luxury Floral Mandap Bentota',
    category: 'events',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1920x1280',
    fileSize: '510 KB',
    mimeType: 'image/jpeg',
    tags: ['wedding', 'floral', 'bentota'],
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'med-ci-01',
    title: 'Cinema 8K RED V-Raptor Rig',
    category: 'cinema',
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1920x1080',
    fileSize: '620 KB',
    mimeType: 'image/jpeg',
    tags: ['red', 'cinema', 'anamorphic', '8k'],
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'med-ci-02',
    title: 'Fine-Art Editorial Studio Portrait',
    category: 'cinema',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1200x1600',
    fileSize: '390 KB',
    mimeType: 'image/jpeg',
    tags: ['portrait', 'fashion', 'studio'],
    createdAt: '2026-01-18T10:00:00Z',
  },
  {
    id: 'med-it-01',
    title: 'Cloud Telemetry & Operations Wall',
    category: 'it',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1920x1080',
    fileSize: '480 KB',
    mimeType: 'image/jpeg',
    tags: ['devops', 'cloud', 'monitoring'],
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'med-tr-01',
    title: 'Bespoke Highland Helicopter Expedition',
    category: 'travels',
    url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1920x1280',
    fileSize: '650 KB',
    mimeType: 'image/jpeg',
    tags: ['helicopter', 'sigiriya', 'luxury'],
    createdAt: '2026-01-22T10:00:00Z',
  },
  {
    id: 'med-hw-01',
    title: 'Sony Cinema Line FX9 Broadcast Camera',
    category: 'hardware',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1200x1200',
    fileSize: '340 KB',
    mimeType: 'image/jpeg',
    tags: ['sony', 'fx9', 'camera', 'mart'],
    createdAt: '2026-01-25T10:00:00Z',
  },
  {
    id: 'med-logo-01',
    title: 'Enterprise Client Logo Badge',
    category: 'logos',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
    dimensions: '400x200',
    fileSize: '80 KB',
    mimeType: 'image/png',
    tags: ['logo', 'partner'],
    createdAt: '2026-01-28T10:00:00Z',
  },
];

const MEDIA_STORAGE_KEY = 'mahdev_cms_media_assets_v1';

export const AdminMediaView: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<StoredMediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<StoredMediaItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<StoredMediaItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Upload State
  const [uploadData, setUploadData] = useState({
    title: '',
    category: 'events' as StoredMediaItem['category'],
    url: '',
    dimensions: '1920x1080',
    fileSize: '450 KB',
    tags: '',
  });

  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadMedia = () => {
    const stored = localStorage.getItem(MEDIA_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(DEFAULT_MEDIA_ITEMS));
      setMediaItems(DEFAULT_MEDIA_ITEMS);
    } else {
      try {
        setMediaItems(JSON.parse(stored));
      } catch {
        setMediaItems(DEFAULT_MEDIA_ITEMS);
      }
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const saveMediaToStorage = (items: StoredMediaItem[]) => {
    setMediaItems(items);
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(items));
  };

  const handleCopyUrl = (item: StoredMediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('info', 'Asset URL Copied', `Direct image URL copied to clipboard.`);
  };

  const handleOpenUpload = () => {
    setUploadData({
      title: '',
      category: 'events',
      url: '',
      dimensions: '1920x1080',
      fileSize: '450 KB',
      tags: 'hd, web, showcase',
    });
    setUploadErrors({});
    setIsDirty(false);
    setIsUploadOpen(true);
  };

  const handleSaveUpload = async () => {
    const errors: Record<string, string> = {};
    if (!uploadData.title.trim()) errors.title = 'Asset title is required';
    if (!uploadData.url.trim()) errors.url = 'Valid asset URL is required';
    setUploadErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      const newItem: StoredMediaItem = {
        id: `med-custom-${Date.now()}`,
        title: uploadData.title,
        category: uploadData.category,
        url: uploadData.url,
        dimensions: uploadData.dimensions || '1920x1080',
        fileSize: uploadData.fileSize || '380 KB',
        mimeType: 'image/jpeg',
        tags: uploadData.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        createdAt: new Date().toISOString(),
      };

      const updated = [newItem, ...mediaItems];
      saveMediaToStorage(updated);
      addToast('success', 'Media Registered', `"${uploadData.title}" was added to media catalog.`);
      setIsUploadOpen(false);
      setIsDirty(false);
    } catch (err: any) {
      addToast('error', 'Upload Error', err.message || 'Could not register asset.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    const filtered = mediaItems.filter((m) => m.id !== deletingItem.id);
    saveMediaToStorage(filtered);
    addToast('success', 'Media Asset Removed', `"${deletingItem.title}" has been deleted.`);
    setDeletingItem(null);
  };

  // Filtered Assets
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
              Media Asset Management & CDN Repository ({mediaItems.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized media library for gallery images, service banners, manufacturer logos, and 4K showcase photographs.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleOpenUpload}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          Add / Register Media
        </Button>
      </div>

      {/* Filters & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="all">All Media ({mediaItems.length})</option>
            <option value="events">Events & Production</option>
            <option value="cinema">Cinema & Photography</option>
            <option value="it">Enterprise IT & Cloud</option>
            <option value="travels">Luxury Travels</option>
            <option value="hardware">Hardware & Mart</option>
            <option value="logos">Logos & Badges</option>
            <option value="banners">Banners & Promos</option>
          </select>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((item) => {
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
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-white uppercase">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white hover:bg-slate-900 text-xs"
                      title="Preview Full Size"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-1.5 rounded-lg bg-red-600/90 backdrop-blur-xs text-white hover:bg-red-600 text-xs"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <h4 className="font-display text-xs font-bold text-slate-900 line-clamp-1">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{item.dimensions}</span>
                    <span>{item.fileSize}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUrl(item)}
                  leftIcon={
                    copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                  className="w-full text-xs h-8 font-medium"
                >
                  {copiedId === item.id ? 'Copied' : 'Copy CDN URL'}
                </Button>
              </div>
            </div>
          );
        })}

        {filteredMedia.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <FileImage className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-900">No media assets found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No images or media match your search query.
            </p>
            <Button variant="electric" size="sm" onClick={handleOpenUpload} leftIcon={<Plus className="w-4 h-4" />}>
              Add Media Asset
            </Button>
          </div>
        )}
      </div>

      {/* Upload / Register Modal */}
      <AdminModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Register New Media Asset"
        subtitle="Add image URLs or CDN paths into the centralized asset manager."
        isDirty={isDirty}
        onSave={handleSaveUpload}
        isSaving={isSaving}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Asset Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={uploadData.title}
              onChange={(e) => {
                setUploadData({ ...uploadData, title: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. Cinema 8K RED V-Raptor Nuwara Eliya Rig"
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                uploadErrors.title ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {uploadErrors.title && <p className="text-[11px] text-red-500 mt-1">{uploadErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={uploadData.category}
                onChange={(e) => {
                  setUploadData({ ...uploadData, category: e.target.value as any });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="events">Events & Production</option>
                <option value="cinema">Cinema & Photography</option>
                <option value="it">Enterprise IT & Cloud</option>
                <option value="travels">Luxury Travels</option>
                <option value="hardware">Hardware & Mart</option>
                <option value="logos">Logos & Badges</option>
                <option value="banners">Banners & Promos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dimensions (e.g. 1920x1080)
              </label>
              <input
                type="text"
                value={uploadData.dimensions}
                onChange={(e) => {
                  setUploadData({ ...uploadData, dimensions: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="1920x1080"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Direct Image URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={uploadData.url}
              onChange={(e) => {
                setUploadData({ ...uploadData, url: e.target.value });
                setIsDirty(true);
              }}
              placeholder="https://images.unsplash.com/... or /assets/..."
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                uploadErrors.url ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {uploadErrors.url && <p className="text-[11px] text-red-500 mt-1">{uploadErrors.url}</p>}
          </div>

          {uploadData.url && (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
              <img
                src={uploadData.url}
                alt="Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={uploadData.tags}
              onChange={(e) => {
                setUploadData({ ...uploadData, tags: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. stage, lighting, colombo, 4k"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </AdminModal>

      {/* Lightbox / Preview Modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full border border-slate-800 shadow-2xl"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold">{previewItem.title}</h3>
                <span className="text-xs text-slate-400 font-mono">{previewItem.dimensions} • {previewItem.fileSize}</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
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
            <div className="p-4 bg-white flex items-center justify-between">
              <div className="flex gap-1">
                {previewItem.tags.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono">
                    #{t}
                  </span>
                ))}
              </div>
              <Button
                variant="electric"
                size="sm"
                onClick={() => handleCopyUrl(previewItem)}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy URL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Delete Media Asset?"
        message={`Are you sure you want to permanently delete "${deletingItem?.title}" from the media repository?`}
        confirmText="Delete Media Asset"
        isDangerous={true}
        onConfirm={handleDelete}
      />
    </div>
  );
};
