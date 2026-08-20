import React, { useState } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Link,
  Sparkles,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StorageCategory } from '../../types/storage';
import { storageService } from '../../services/storageService';

export interface MediaAssetPreset {
  id: string;
  title: string;
  category: 'events' | 'cinema' | 'it' | 'travels' | 'hardware' | 'logos' | 'banners';
  url: string;
  dimensions: string;
  thumbnail: string;
}

const MEDIA_PRESETS: MediaAssetPreset[] = [
  // Events
  {
    id: 'med-ev-01',
    title: 'BMICH Grand Gala 4K LED Matrix',
    category: 'events',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1080',
  },
  {
    id: 'med-ev-02',
    title: 'Luxury Floral Mandap Bentota',
    category: 'events',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1280',
  },
  {
    id: 'med-ev-03',
    title: 'Concert Line Array & Intelligent Beams',
    category: 'events',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1080',
  },
  // Cinema & Studio
  {
    id: 'med-ci-01',
    title: 'Cinema 8K RED V-Raptor Rig',
    category: 'cinema',
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1080',
  },
  {
    id: 'med-ci-02',
    title: 'Fine-Art Editorial Studio Portrait',
    category: 'cinema',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    dimensions: '1200x1600',
  },
  {
    id: 'med-ci-03',
    title: 'Cinema Anamorphic Prime Lenses',
    category: 'cinema',
    url: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1200',
  },
  // IT & Cloud
  {
    id: 'med-it-01',
    title: 'Cloud Telemetry & Operations Wall',
    category: 'it',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1080',
  },
  {
    id: 'med-it-02',
    title: 'Enterprise Server Rack Infrastructure',
    category: 'it',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1200',
  },
  // Travels
  {
    id: 'med-tr-01',
    title: 'Bespoke Highland Helicopter Expedition',
    category: 'travels',
    url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1280',
  },
  {
    id: 'med-tr-02',
    title: 'Private Ceylon Heritage Tea Bungalow',
    category: 'travels',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1080',
  },
  // Hardware & Retail
  {
    id: 'med-hw-01',
    title: 'Authorized Sony FX9 Broadcast Camera',
    category: 'hardware',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1280',
  },
  {
    id: 'med-hw-02',
    title: 'Professional Studio Audio & Podcasting Rig',
    category: 'hardware',
    url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
    dimensions: '1920x1080',
  },
  // Logos
  {
    id: 'med-lg-01',
    title: 'Mahdev Corporate Monogram Badge',
    category: 'logos',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=400&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
    dimensions: '400x400',
  },
  // Banners
  {
    id: 'med-bn-01',
    title: 'Corporate Executive Synergy Banner',
    category: 'banners',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
    dimensions: '1600x600',
  },
];

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  onSelectMultiple?: (urls: string[]) => void;
  currentUrl?: string;
  multiple?: boolean;
  title?: string;
  category?: string;
  storageCategory?: StorageCategory;
}

const VALID_STORAGE_CATEGORIES: StorageCategory[] = [
  'branding',
  'company',
  'divisions',
  'services',
  'products',
  'portfolio',
  'gallery',
  'testimonials',
  'users',
  'documents',
  'invoices',
  'banners',
  'general',
];

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  currentUrl = '',
  multiple = false,
  title = 'Media Asset Manager',
  category,
  storageCategory,
}) => {
  const uploadCategory: StorageCategory =
    storageCategory ||
    (category && VALID_STORAGE_CATEGORIES.includes(category as StorageCategory)
      ? (category as StorageCategory)
      : 'products');
  const [activeTab, setActiveTab] = useState<'presets' | 'url' | 'upload'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState(currentUrl);
  const [selectedUrls, setSelectedUrls] = useState<string[]>(currentUrl ? [currentUrl] : []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredPresets = MEDIA_PRESETS.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleToggleSelect = (url: string) => {
    if (multiple) {
      if (selectedUrls.includes(url)) {
        setSelectedUrls(selectedUrls.filter((u) => u !== url));
      } else {
        setSelectedUrls([...selectedUrls, url]);
      }
    } else {
      setSelectedUrls([url]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image is too large. Please choose a smaller image (maximum allowed is 10 MB).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const result = await storageService.uploadFile(
      file,
      uploadCategory,
      undefined,
      {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.88,
        onProgress: (p) => setUploadProgress(p),
      }
    );

    setIsUploading(false);

    if (result.success && result.url) {
      setUploadedUrl(result.url);
      setSelectedUrls([result.url]);
    } else {
      setUploadError(result.error || 'Failed to upload image to Firebase Storage.');
    }
  };

  const handleConfirm = () => {
    if (activeTab === 'url') {
      if (customUrl.trim()) {
        onSelect(customUrl.trim());
        if (multiple && onSelectMultiple) {
          onSelectMultiple([customUrl.trim()]);
        }
      }
    } else {
      if (multiple && onSelectMultiple) {
        onSelectMultiple(selectedUrls);
      } else if (selectedUrls.length > 0) {
        onSelect(selectedUrls[0]);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500">
                {multiple ? 'Select multiple media items' : 'Select or upload an image asset'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'presets'
                ? 'bg-white border-blue-600 text-blue-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Curated Library ({MEDIA_PRESETS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'url'
                ? 'bg-white border-blue-600 text-blue-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            Direct URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'upload'
                ? 'bg-white border-blue-600 text-blue-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto grow custom-scrollbar">
          {/* Tab 1: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative grow w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search curated assets..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {['all', 'events', 'cinema', 'it', 'travels', 'hardware', 'logos', 'banners'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Images */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedUrls.includes(preset.url);
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleToggleSelect(preset.url)}
                      className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all aspect-4/3 bg-slate-100 ${
                        isSelected
                          ? 'ring-2 ring-blue-600 border-blue-600 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={preset.thumbnail}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                        <span className="text-white text-[11px] font-bold truncate">{preset.title}</span>
                        <span className="text-slate-300 text-[9px] uppercase">{preset.category}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Direct URL */}
          {activeTab === 'url' && (
            <div className="space-y-4 max-w-lg mx-auto py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Image URL (HTTPS)
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {customUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 block">Image Preview</span>
                  <div className="h-56 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center relative">
                    <img
                      src={customUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Upload to Firebase Storage */}
          {activeTab === 'upload' && (
            <div className="space-y-4 max-w-md mx-auto py-4 text-center">
              <label
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isUploading
                    ? 'border-blue-500 bg-blue-50/50 cursor-wait'
                    : 'border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30'
                }`}
              >
                {isUploading ? (
                  <div className="space-y-3 w-full max-w-xs">
                    <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="space-y-1">
                      <span className="font-display font-bold text-slate-900 text-sm block">
                        Uploading to Firebase Storage ({uploadProgress}%)
                      </span>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="font-display font-bold text-slate-900 text-sm">
                      Click to choose image file
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      PNG, JPG, WebP, SVG up to 10MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <div className="text-xs font-medium text-rose-600 bg-rose-50 p-3 rounded-xl flex items-start gap-2 border border-rose-200 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadedUrl && (
                <div className="space-y-2 text-left bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Upload Successful! Asset ready to use.</span>
                  </div>
                  <div className="h-44 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={uploadedUrl}
                      alt="Uploaded asset"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {activeTab === 'url'
              ? customUrl
                ? 'URL entered'
                : 'No URL specified'
              : `${selectedUrls.length} image(s) selected`}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              disabled={isUploading || (activeTab === 'url' ? !customUrl.trim() : selectedUrls.length === 0)}
            >
              Use Selected Asset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
