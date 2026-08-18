import React, { useState, useEffect } from 'react';
import {
  Flag,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { CmsMilestone } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';

export const AdminMilestonesView: React.FC = () => {
  const [milestones, setMilestones] = useState<CmsMilestone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<CmsMilestone | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingMilestone, setDeletingMilestone] = useState<CmsMilestone | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    year: '2025',
    title: '',
    description: '',
    metric: '100% Client Satisfaction',
    iconName: 'Sparkles',
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
    const data = cmsService.getAll<CmsMilestone>('milestones', {
      search: searchQuery,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setMilestones(data);
  };

  useEffect(() => {
    loadData();
    const unsub = cmsService.subscribe('milestones', loadData);
    return () => unsub();
  }, [searchQuery, statusFilter]);

  const handleOpenCreate = () => {
    setEditingMilestone(null);
    setFormData({
      year: new Date().getFullYear().toString(),
      title: '',
      description: '',
      metric: 'Enterprise Expansion',
      iconName: 'Sparkles',
      sortOrder: milestones.length + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (m: CmsMilestone) => {
    setEditingMilestone(m);
    setFormData({
      year: m.year,
      title: m.title,
      description: m.description,
      metric: m.metric || '',
      iconName: m.iconName || 'Sparkles',
      sortOrder: m.sortOrder || 1,
      isActive: m.isActive,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.year.trim()) errors.year = 'Year is required';
    if (!formData.title.trim()) errors.title = 'Milestone title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingMilestone) {
        cmsService.update<CmsMilestone>('milestones', editingMilestone.id, formData);
        addToast('success', 'Milestone Updated', `"${formData.title}" saved.`);
      } else {
        cmsService.create<CmsMilestone>('milestones', formData);
        addToast('success', 'Milestone Created', `"${formData.title}" added to timeline.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadData();
    } catch (err: any) {
      addToast('error', 'Error Saving Milestone', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = (permanent: boolean) => {
    if (!deletingMilestone) return;
    if (permanent) {
      cmsService.hardDelete('milestones', deletingMilestone.id);
      addToast('warning', 'Permanent Deletion', `"${deletingMilestone.title}" removed.`);
    } else {
      cmsService.softDelete('milestones', deletingMilestone.id);
      addToast('info', 'Milestone Archived', `"${deletingMilestone.title}" archived.`);
    }
    setDeletingMilestone(null);
    loadData();
  };

  const handleRestore = (m: CmsMilestone) => {
    cmsService.restore('milestones', m.id);
    addToast('success', 'Milestone Restored', `"${m.title}" restored.`);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Corporate Milestones & History CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {milestones.length} Milestones
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Publish historical expansion landmarks, capital investments, and flagship achievements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Milestone
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search milestone title, year, metric..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold cursor-pointer text-xs"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="deleted">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Year & Title</th>
                <th className="py-3.5 px-4">Description & Impact</th>
                <th className="py-3.5 px-4">Key Metric Highlight</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {milestones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No milestones found matching filter.
                  </td>
                </tr>
              ) : (
                milestones.map((m) => (
                  <tr key={m.id} className={`hover:bg-slate-50/80 transition-colors ${m.isDeleted ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-8 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                          {m.year}
                        </div>
                        <span className="font-bold text-slate-900">{m.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {m.description}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {m.metric || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.isDeleted ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : m.isActive ? (
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
                        {m.isDeleted ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(m)} className="text-blue-600">
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingMilestone(m)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
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
        title={editingMilestone ? `Edit Milestone: ${editingMilestone.title}` : 'Add Milestone Landmark'}
        subtitle="Specify timeline year, strategic accomplishments, and quantifiable metric."
        isDirty={isDirty}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Year / Period *</label>
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
              {formErrors.year && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.year}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Milestone Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. AI-Powered Hospitality Cloud Rollout"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.title && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.title}</p>}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Key Impact Metric</label>
            <input
              type="text"
              value={formData.metric}
              onChange={(e) => {
                setFormData({ ...formData, metric: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. 50+ Luxury Resorts Onboarded"
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Context and business significance of this corporate achievement..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {formErrors.description && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.description}</p>}
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
              <span className="font-semibold text-slate-700">Active on Timeline</span>
            </label>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingMilestone ? 'Update Milestone' : 'Add Milestone'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!deletingMilestone}
        title="Delete Milestone"
        message={`Are you sure you want to remove milestone "${deletingMilestone?.title}"?`}
        itemIdentifier={deletingMilestone ? `${deletingMilestone.year} — ${deletingMilestone.title}` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingMilestone?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingMilestone(null)}
      />
    </div>
  );
};
