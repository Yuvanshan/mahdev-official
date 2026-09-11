import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Tag,
  Package,
} from 'lucide-react';
import { CmsCategory } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DivisionId } from '../../types';

export const AdminCategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CmsCategory | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState<CmsCategory | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    divisionId: 'mart' as DivisionId,
    description: '',
    iconName: 'FolderTree',
    itemCount: 0,
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

  const loadCategories = () => {
    const data = cmsService.getAll<CmsCategory>('categories', {
      search: searchQuery,
      divisionId: divisionFilter,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
    const unsub = cmsService.subscribe('categories', loadCategories);
    return () => unsub();
  }, [searchQuery, divisionFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      divisionId: 'mart',
      description: '',
      iconName: 'FolderTree',
      itemCount: 0,
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (cat: CmsCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      divisionId: cat.divisionId,
      description: cat.description || '',
      iconName: cat.iconName || 'FolderTree',
      itemCount: cat.itemCount || 0,
      isActive: cat.isActive,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Category name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const slug = (formData.slug || '').trim() || String(formData.name || 'category').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = { ...formData, slug };

      if (editingCategory) {
        cmsService.update<CmsCategory>('categories', editingCategory.id, payload);
        addToast('success', 'Category Updated', `Category "${formData.name}" saved.`);
      } else {
        cmsService.create<CmsCategory>('categories', payload);
        addToast('success', 'Category Created', `Category "${formData.name}" created.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadCategories();
    } catch (err: any) {
      addToast('error', 'Error Saving Category', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = (permanent: boolean) => {
    if (!deletingCategory) return;
    if (permanent) {
      cmsService.hardDelete('categories', deletingCategory.id);
      addToast('warning', 'Permanent Deletion', `Category "${deletingCategory.name}" removed permanently.`);
    } else {
      cmsService.softDelete('categories', deletingCategory.id);
      addToast('info', 'Category Archived', `Category "${deletingCategory.name}" archived.`);
    }
    setDeletingCategory(null);
    loadCategories();
  };

  const handleRestore = (cat: CmsCategory) => {
    cmsService.restore('categories', cat.id);
    addToast('success', 'Category Restored', `"${cat.name}" restored.`);
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Taxonomy Categories CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Organize catalog structures, filtering taxonomy, and product groupings across business pillars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Category
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search category name, slug..."
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
            <option value="sws">SWS Event Management</option>
            <option value="u1">U1 Studio</option>
            <option value="it">Mahdev IT & Solutions</option>
            <option value="travels">Mahdev Travels</option>
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4">Division & Slug</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Items Count</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No categories found matching filter.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className={`hover:bg-slate-50/80 transition-colors ${cat.isDeleted ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FolderTree className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] text-blue-600 font-bold uppercase block">{cat.divisionId}</span>
                      <span className="font-mono text-[10px] text-slate-500">/{cat.slug}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {cat.description || 'No description provided.'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {cat.itemCount || 0} Products
                    </td>
                    <td className="py-3.5 px-4">
                      {cat.isDeleted ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : cat.isActive ? (
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
                        {cat.isDeleted ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(cat)} className="text-blue-600">
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingCategory(cat)}
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

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Taxonomy Category'}
        subtitle="Specify category title, division assignment, URL slug, and summary."
        isDirty={isDirty}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category Title *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. Cinema & Studio Cameras"
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {formErrors.name && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Division Assignment *</label>
              <select
                value={formData.divisionId}
                onChange={(e) => {
                  setFormData({ ...formData, divisionId: e.target.value as DivisionId });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="mart">Mahdev Online Mart</option>
                <option value="sws">SWS Event Management</option>
                <option value="u1">U1 Studio</option>
                <option value="it">Mahdev IT & Solutions</option>
                <option value="travels">Mahdev Travels</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">URL Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  setFormData({ ...formData, slug: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="cinema-cameras"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Scope and purpose of this catalog taxonomy..."
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
                {isSaving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!deletingCategory}
        title="Delete Category"
        message={`Are you sure you want to remove category "${deletingCategory?.name}"?`}
        itemIdentifier={deletingCategory ? `${deletingCategory.name} (${deletingCategory.divisionId})` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingCategory?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
};
