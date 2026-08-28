import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  Sparkles,
  Tag,
  Building,
  Star,
} from 'lucide-react';
import { CmsPortfolioProject } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DivisionId } from '../../types';

const DIVISION_NAMES: Record<DivisionId, string> = {
  sws: 'SWS Event Management',
  u1: 'U1 Studio',
  it: 'Mahdev IT & Solutions',
  travels: 'Mahdev Travels',
  mart: 'Mahdev Online Mart',
};

export const AdminPortfolioView: React.FC = () => {
  const [portfolioItems, setPortfolioItems] = useState<CmsPortfolioProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CmsPortfolioProject | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingItem, setDeletingItem] = useState<CmsPortfolioProject | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    divisionId: 'sws' as DivisionId,
    category: 'Gala & Summits',
    client: '',
    year: '2025',
    summary: '',
    fullDescription: '',
    highlightsText: 'Executive Keynote Setup\nMulti-Camera 4K Broadcast\nInteractive Stage Lighting',
    deliverablesText: 'Event Production, Live Stream, Post-production Recap',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    tagsText: 'Summit, Production, Corporate',
    liveUrl: '',
    isFeatured: false,
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
    const data = cmsService.getAll<CmsPortfolioProject>('portfolio', {
      search: searchQuery,
      divisionId: divisionFilter,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setPortfolioItems(data);
  };

  useEffect(() => {
    loadData();
    const unsub = cmsService.subscribe('portfolio', loadData);
    return () => unsub();
  }, [searchQuery, divisionFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      divisionId: 'sws',
      category: 'Gala & Summits',
      client: '',
      year: new Date().getFullYear().toString(),
      summary: '',
      fullDescription: '',
      highlightsText: 'Keynote Audio Visuals\n4K Multi-cam Live Production\nInteractive Stage Design',
      deliverablesText: 'Event Production, Live Stream, Photo & Video Documentation',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      tagsText: 'Enterprise, Production, Corporate',
      liveUrl: 'https://mahdev.lk',
      isFeatured: false,
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: CmsPortfolioProject) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      divisionId: item.divisionId,
      category: item.category,
      client: item.client || '',
      year: item.year || '2025',
      summary: item.summary || '',
      fullDescription: item.fullDescription || item.summary || '',
      highlightsText: (item.highlights || []).join('\n'),
      deliverablesText: (item.deliverables || []).join(', '),
      imageUrl: item.imageUrl,
      tagsText: (item.tags || []).join(', '),
      liveUrl: item.liveUrl || '',
      isFeatured: !!item.isFeatured,
      isActive: item.isActive !== false,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Project title is required';
    if (!formData.client.trim()) errors.client = 'Client or partner name is required';
    if (!formData.summary.trim()) errors.summary = 'Summary is required';
    if (!formData.imageUrl.trim()) errors.imageUrl = 'Cover image URL is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload: Partial<CmsPortfolioProject> = {
        title: formData.title,
        divisionId: formData.divisionId,
        category: formData.category,
        client: formData.client,
        year: formData.year,
        summary: formData.summary,
        fullDescription: formData.fullDescription || formData.summary,
        highlights: formData.highlightsText.split('\n').map((s) => s.trim()).filter(Boolean),
        deliverables: formData.deliverablesText.split(',').map((s) => s.trim()).filter(Boolean),
        imageUrl: formData.imageUrl,
        galleryImages: [formData.imageUrl],
        tags: formData.tagsText.split(',').map((s) => s.trim()).filter(Boolean),
        liveUrl: formData.liveUrl || undefined,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        impactMetrics: [{ label: 'Impact Score', value: '100%' }],
      };

      if (editingItem) {
        await cmsService.updateAsync<CmsPortfolioProject>('portfolio', editingItem.id, payload);
        addToast('success', 'Case Study Saved', `"${formData.title}" saved in Firestore.`);
      } else {
        await cmsService.createAsync<CmsPortfolioProject>('portfolio', payload);
        addToast('success', 'Case Study Created', `"${formData.title}" created in Firestore.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadData();
    } catch (err: any) {
      addToast('error', 'Error Saving Portfolio', err.message || 'Operation failed. Please check network.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async (permanent: boolean) => {
    if (!deletingItem) return;
    try {
      if (permanent) {
        await cmsService.hardDeleteAsync('portfolio', deletingItem.id);
        addToast('warning', 'Permanent Deletion', `"${deletingItem.title}" removed from Firestore.`);
      } else {
        await cmsService.softDeleteAsync('portfolio', deletingItem.id);
        addToast('info', 'Case Study Archived', `"${deletingItem.title}" archived in Firestore.`);
      }
      setDeletingItem(null);
      loadData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Failed to delete item.');
    }
  };

  const handleRestore = async (item: CmsPortfolioProject) => {
    try {
      await cmsService.restoreAsync('portfolio', item.id);
      addToast('success', 'Case Study Restored', `"${item.title}" restored in Firestore.`);
      loadData();
    } catch (err: any) {
      addToast('error', 'Restore Failed', err.message || 'Failed to restore item.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Portfolio & Case Studies CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {portfolioItems.length} Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Showcase enterprise deliverables, client engagements, high-profile summits, and media productions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="electric" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Case Study
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project title, client..."
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Case Study & Visual</th>
                <th className="py-3.5 px-4">Division & Client</th>
                <th className="py-3.5 px-4">Scope & Summary</th>
                <th className="py-3.5 px-4">Year</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {portfolioItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No portfolio projects found matching filter.
                  </td>
                </tr>
              ) : (
                portfolioItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${item.isDeleted ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{item.title}</span>
                            {item.isFeatured && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                FEATURED
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{item.client}</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">
                        {DIVISION_NAMES[item.divisionId] || item.divisionId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {item.summary}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                      {item.year || '2025'}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isDeleted ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : item.isActive !== false ? (
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
                        {item.isDeleted ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(item)} className="text-blue-600">
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Portfolio"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingItem ? `Edit Project: ${editingItem.title}` : 'Create Portfolio Case Study'}
        subtitle="Manage client engagement showcase, high-res photography, and division attribution."
        isDirty={isDirty}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Ceylon Petroleum Global Energy Gala"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.title && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Client / Organization *</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => {
                  setFormData({ ...formData, client: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Forbes Marshall Ceylon"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.client && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.client}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Division *</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Category / Type</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Live Production"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => {
                  setFormData({ ...formData, year: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="2025"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Media Image */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Cover Image *</label>
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
                  alt="Preview"
                  className="w-16 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                />
                <span className="text-[11px] text-slate-500">Live preview rendered.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Summary *</label>
            <textarea
              rows={2}
              value={formData.summary}
              onChange={(e) => {
                setFormData({ ...formData, summary: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Brief summary of the engagement..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {formErrors.summary && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.summary}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
            <textarea
              rows={3}
              value={formData.fullDescription}
              onChange={(e) => {
                setFormData({ ...formData, fullDescription: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Scope of work, execution complexity, attendance, and technical deliverables..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Key Highlights (1 per line)</label>
              <textarea
                rows={3}
                value={formData.highlightsText}
                onChange={(e) => {
                  setFormData({ ...formData, highlightsText: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="Executive Keynote Setup&#10;Multi-Camera Broadcast"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deliverables & Tags (comma separated)</label>
              <textarea
                rows={3}
                value={formData.tagsText}
                onChange={(e) => {
                  setFormData({ ...formData, tagsText: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="Summit, Production, LED Wall"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
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
              <Button variant="electric" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingItem ? 'Update Project' : 'Create Case Study'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Media Picker */}
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
        isOpen={!!deletingItem}
        title="Delete Portfolio Case Study"
        message={`Are you sure you want to remove project "${deletingItem?.title}"?`}
        itemIdentifier={deletingItem ? `${deletingItem.title} (${deletingItem.client})` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingItem?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
};
