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
} from 'lucide-react';
import { CmsGalleryItem } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DivisionId } from '../../types';

export const AdminGalleryView: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<CmsGalleryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CmsGalleryItem | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingItem, setDeletingItem] = useState<CmsGalleryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    divisionId: 'sws' as DivisionId,
    caption: '',
    mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80',
    type: 'image' as 'image' | 'video',
    aspectRatio: '16:9',
    tags: ['Stage', 'Lighting'],
    sortOrder: 1,
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
    const data = cmsService.getAll<CmsGalleryItem>('gallery', {
      search: searchQuery,
      divisionId: divisionFilter,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setGalleryItems(data);
  };

  useEffect(() => {
    loadData();
    const unsub = cmsService.subscribe('gallery', loadData);
    return () => unsub();
  }, [searchQuery, divisionFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      divisionId: 'sws',
      caption: '',
      mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80',
      type: 'image',
      aspectRatio: '16:9',
      tags: ['Corporate', 'Live'],
      sortOrder: galleryItems.length + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: CmsGalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      divisionId: item.divisionId,
      caption: item.caption || '',
      mediaUrl: item.mediaUrl,
      thumbnailUrl: item.thumbnailUrl || item.mediaUrl,
      type: item.type || 'image',
      aspectRatio: item.aspectRatio || '16:9',
      tags: item.tags || [],
      sortOrder: item.sortOrder || 1,
      isActive: item.isActive,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.mediaUrl.trim()) errors.mediaUrl = 'Media URL is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        thumbnailUrl: formData.thumbnailUrl || formData.mediaUrl,
      };

      if (editingItem) {
        await cmsService.updateAsync<CmsGalleryItem>('gallery', editingItem.id, payload);
        addToast('success', 'Gallery Item Saved', `"${formData.title}" saved to Firestore.`);
      } else {
        await cmsService.createAsync<CmsGalleryItem>('gallery', payload);
        addToast('success', 'Gallery Item Created', `"${formData.title}" created in Firestore.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadData();
    } catch (err: any) {
      addToast('error', 'Error Saving Gallery', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async (permanent: boolean) => {
    if (!deletingItem) return;
    try {
      if (permanent) {
        await cmsService.hardDeleteAsync('gallery', deletingItem.id);
        addToast('warning', 'Permanent Deletion', `"${deletingItem.title}" permanently removed from Firestore.`);
      } else {
        await cmsService.softDeleteAsync('gallery', deletingItem.id);
        addToast('info', 'Gallery Item Archived', `"${deletingItem.title}" archived in Firestore.`);
      }
      setDeletingItem(null);
      loadData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Operation failed.');
    }
  };

  const handleRestore = async (item: CmsGalleryItem) => {
    try {
      await cmsService.restoreAsync('gallery', item.id);
      addToast('success', 'Gallery Item Restored', `"${item.title}" restored in Firestore.`);
      loadData();
    } catch (err: any) {
      addToast('error', 'Restore Failed', err.message || 'Operation failed.');
    }
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="deleted">Archived</option>
          </select>
        </div>
      </div>

      {/* Grid of Gallery Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {galleryItems.length === 0 ? (
          <div className="col-span-full py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No gallery assets found matching filters.
          </div>
        ) : (
          galleryItems.map((item) => (
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
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {item.divisionId}
                </div>
              </div>

              <div className="p-4 grow flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-xs truncate">{item.title}</h4>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Media URL *</label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={formData.mediaUrl}
                onChange={(e) => {
                  setFormData({ ...formData, mediaUrl: e.target.value });
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
                Select
              </Button>
            </div>
            {formData.mediaUrl && (
              <div className="mt-2">
                <img
                  src={formData.mediaUrl}
                  alt="Preview"
                  className="h-32 w-full object-cover rounded-xl border border-slate-200"
                />
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
          setFormData({ ...formData, mediaUrl: url, thumbnailUrl: url });
          setIsDirty(true);
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
