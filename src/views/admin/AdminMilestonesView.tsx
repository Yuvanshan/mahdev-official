import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Radio,
  Layers,
  Archive,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { FirestoreMilestone } from '../../types/firestore';
import { firestoreMilestonesService } from '../../services/firestore/milestones';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

export const AdminMilestonesView: React.FC = () => {
  const { refreshAll } = useFirestoreDataContext();
  const [milestones, setMilestones] = useState<FirestoreMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<FirestoreMilestone | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingMilestone, setDeletingMilestone] = useState<FirestoreMilestone | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    year: '2025',
    date: '',
    title: '',
    description: '',
    badge: 'Milestone',
    metric: '',
    keyOutcome: '',
    divisionId: 'all',
    iconName: 'Sparkles',
    order: 1,
    isPublished: true,
    status: 'published' as 'active' | 'published' | 'draft' | 'archived',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Real-time Firestore sync
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = firestoreMilestonesService.subscribeMilestones(
      (data) => {
        setMilestones(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('[AdminMilestonesView] Firestore subscribe error:', err);
        addToast('error', 'Sync Warning', 'Failed to receive real-time milestone updates from Firestore.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingMilestone(null);
    setFormData({
      year: new Date().getFullYear().toString(),
      date: '',
      title: '',
      description: '',
      badge: 'Expansion',
      metric: 'Enterprise Landmark',
      keyOutcome: '',
      divisionId: 'all',
      iconName: 'Sparkles',
      order: milestones.length + 1,
      isPublished: true,
      status: 'published',
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (m: FirestoreMilestone) => {
    setEditingMilestone(m);
    setFormData({
      year: m.year,
      date: m.date || '',
      title: m.title,
      description: m.description,
      badge: m.badge || 'Milestone',
      metric: m.metric || '',
      keyOutcome: m.keyOutcome || '',
      divisionId: m.divisionId || 'all',
      iconName: m.iconName || 'Sparkles',
      order: m.order || 1,
      isPublished: m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived',
      status: m.status || (m.isPublished === false ? 'draft' : 'published'),
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
    if (!validateForm()) {
      addToast('warning', 'Validation Incomplete', 'Please provide a valid year, title, and description for the milestone.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<FirestoreMilestone> = {
        year: formData.year.trim(),
        date: formData.date.trim() || undefined,
        title: formData.title.trim(),
        description: formData.description.trim(),
        badge: formData.badge.trim() || undefined,
        metric: formData.metric.trim() || undefined,
        keyOutcome: formData.keyOutcome.trim() || formData.metric.trim() || undefined,
        divisionId: formData.divisionId === 'all' ? undefined : formData.divisionId,
        iconName: formData.iconName || 'Sparkles',
        order: Number(formData.order) || 1,
        isPublished: formData.isPublished,
        status: formData.status,
      };

      if (editingMilestone) {
        await firestoreMilestonesService.saveMilestone(editingMilestone.id, payload);
        addToast('success', 'Milestone Updated', `"${payload.title}" saved successfully.`);
      } else {
        await firestoreMilestonesService.createMilestone(payload as any);
        addToast('success', 'Milestone Created', `"${payload.title}" published to timeline.`);
      }

      setIsDirty(false);
      setIsEditorOpen(false);
      if (typeof refreshAll === 'function') {
        refreshAll().catch((rErr) => console.warn('[AdminMilestonesView] refresh notice:', rErr));
      }
    } catch (err: any) {
      console.error('[AdminMilestonesView] Save error:', err);
      addToast('error', 'Error Saving Milestone', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (m: FirestoreMilestone) => {
    const nextState = !(m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived');
    try {
      await firestoreMilestonesService.togglePublish(m.id, nextState);
      addToast(
        'success',
        nextState ? 'Milestone Published' : 'Milestone Un-published (Draft)',
        `"${m.title}" is now ${nextState ? 'visible publicly on the website' : 'saved as a draft'}.`
      );
      await refreshAll();
    } catch (err: any) {
      addToast('error', 'Toggle Error', err.message || 'Could not update publication status.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;

    const newOrder = [...milestones];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    try {
      const orderedIds = newOrder.map((item) => item.id);
      await firestoreMilestonesService.reorderMilestones(orderedIds);
      addToast('info', 'Timeline Reordered', 'New chronological display order saved to Firestore.');
      await refreshAll();
    } catch (err: any) {
      addToast('error', 'Reorder Error', err.message || 'Failed to reorder milestones in Firestore.');
    }
  };

  const handleDeleteConfirm = async (permanent: boolean) => {
    if (!deletingMilestone) return;

    try {
      if (permanent) {
        await firestoreMilestonesService.deleteMilestone(deletingMilestone.id);
        addToast('warning', 'Permanent Deletion', `"${deletingMilestone.title}" removed from Firestore.`);
      } else {
        await firestoreMilestonesService.saveMilestone(deletingMilestone.id, {
          status: 'archived',
          isPublished: false,
        });
        addToast('info', 'Milestone Archived', `"${deletingMilestone.title}" archived.`);
      }
      await refreshAll();
    } catch (err: any) {
      addToast('error', 'Deletion Error', err.message || 'Failed to delete milestone.');
    } finally {
      setDeletingMilestone(null);
    }
  };

  const handleRestore = async (m: FirestoreMilestone) => {
    try {
      await firestoreMilestonesService.saveMilestone(m.id, {
        status: 'published',
        isPublished: true,
      });
      addToast('success', 'Milestone Restored', `"${m.title}" restored to active timeline.`);
      await refreshAll();
    } catch (err: any) {
      addToast('error', 'Restore Error', err.message || 'Failed to restore milestone.');
    }
  };

  // Filtered milestones
  const filteredMilestones = milestones.filter((m) => {
    const isPub = m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived';
    const isArchived = m.status === 'archived';
    const isDraft = m.status === 'draft' || m.isPublished === false;

    // Status filter
    if (statusFilter === 'published' && !isPub) return false;
    if (statusFilter === 'draft' && !isDraft) return false;
    if (statusFilter === 'archived' && !isArchived) return false;

    // Division filter
    if (divisionFilter !== 'all') {
      const div = m.divisionId || 'all';
      if (div !== divisionFilter && div !== 'all') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchYear = m.year.toLowerCase().includes(q);
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchMetric = (m.metric || '').toLowerCase().includes(q);
      const matchBadge = (m.badge || '').toLowerCase().includes(q);
      return matchTitle || matchYear || matchDesc || matchMetric || matchBadge;
    }

    return true;
  });

  const publishedCount = milestones.filter((m) => m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived').length;
  const draftCount = milestones.filter((m) => m.status === 'draft' || m.isPublished === false).length;
  const archivedCount = milestones.filter((m) => m.status === 'archived').length;

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-display text-lg font-bold text-slate-900">Corporate Milestones & History</h2>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Firestore Sync
            </span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {milestones.length} Total ({publishedCount} Published)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time synchronization with Cloud Firestore <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">milestones</code> collection. Any modifications immediately reflect on the public website.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Milestone
          </Button>
        </div>
      </div>

      {/* Stats and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search milestone title, year, outcome, metric..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold cursor-pointer text-xs"
        >
          <option value="all">All Statuses ({milestones.length})</option>
          <option value="published">Published Only ({publishedCount})</option>
          <option value="draft">Drafts Only ({draftCount})</option>
          <option value="archived">Archived ({archivedCount})</option>
        </select>

        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold cursor-pointer text-xs"
        >
          <option value="all">All Divisions</option>
          <option value="sws">SWS Event Management</option>
          <option value="u1">U1 Studio Cinema</option>
          <option value="it">Mahdev IT & Tech</option>
          <option value="travels">Mahdev Travels</option>
          <option value="mart">Mahdev Online Mart</option>
        </select>
      </div>

      {/* Milestones Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">Order</th>
                <th className="py-3.5 px-4">Year & Title</th>
                <th className="py-3.5 px-4">Division & Badge</th>
                <th className="py-3.5 px-4">Impact / Metric</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading milestones from Cloud Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMilestones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Layers className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">No milestones found</p>
                      <p className="text-slate-400 text-xs">
                        {searchQuery ? 'Try adjusting your search query or status filter.' : 'Click "Add Milestone" to create your first Firestore milestone document.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMilestones.map((m, idx) => {
                  const isPub = m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived';
                  const isArchived = m.status === 'archived';

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isArchived ? 'bg-slate-50/50 opacity-60' : ''
                      }`}
                    >
                      {/* Order and Reorder Buttons */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-mono font-bold text-slate-400 text-[11px] w-4 text-center">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMove(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === filteredMilestones.length - 1}
                              className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Year & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-9 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-blue-100">
                            {m.year}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{m.title}</span>
                            <span className="text-slate-500 text-[11px] line-clamp-1 max-w-sm">
                              {m.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Division & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {m.divisionId ? m.divisionId.toUpperCase() : 'GROUP'}
                          </span>
                          {m.badge && (
                            <span className="text-[11px] font-semibold text-blue-600">
                              {m.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Impact / Metric */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-100 inline-block max-w-[200px] truncate">
                          {m.keyOutcome || m.metric || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isArchived ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <Archive className="w-3 h-3" /> Archived
                          </span>
                        ) : isPub ? (
                          <button
                            onClick={() => handleTogglePublish(m)}
                            className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit hover:bg-emerald-200 transition-colors cursor-pointer"
                            title="Click to switch to Draft"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTogglePublish(m)}
                            className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit hover:bg-amber-200 transition-colors cursor-pointer"
                            title="Click to Publish"
                          >
                            <EyeOff className="w-3 h-3" /> Draft
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isArchived ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(m)}
                              className="text-blue-600"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Restore
                            </Button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleTogglePublish(m)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title={isPub ? 'Unpublish (Set to Draft)' : 'Publish to Live Website'}
                              >
                                {isPub ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit Milestone"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingMilestone(m)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete Milestone"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingMilestone ? `Edit Milestone: ${editingMilestone.title}` : 'Add New Corporate Milestone'}
        subtitle="Saved directly to Cloud Firestore `milestones` collection and visible on public website."
        isDirty={isDirty}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Timeline Year / Label *</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => {
                  setFormData({ ...formData, year: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="2025 or 2025 - Present"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              {formErrors.year && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.year}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Specific Date (Optional)</label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Q3 2025 or 2025-08-15"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Associated Division</label>
              <select
                value={formData.divisionId}
                onChange={(e) => {
                  setFormData({ ...formData, divisionId: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Parent Group (All Divisions)</option>
                <option value="sws">SWS Event Management</option>
                <option value="u1">U1 Studio Cinema</option>
                <option value="it">Mahdev IT & Tech</option>
                <option value="travels">Mahdev Travels</option>
                <option value="mart">Mahdev Online Mart</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Milestone Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Cloud Telemetry & AI Solutions Rollout"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.title && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Badge / Tag</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => {
                  setFormData({ ...formData, badge: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Tech Engineering"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institutional Outcome / Key Metric</label>
            <input
              type="text"
              value={formData.keyOutcome || formData.metric}
              onChange={(e) => {
                setFormData({ ...formData, keyOutcome: e.target.value, metric: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. 50+ Luxury Resorts Onboarded with Sub-50ms Sync"
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
              placeholder="Full narrative context, strategic significance, and operational expansion details..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {formErrors.description && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Publication Status</label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setFormData({
                    ...formData,
                    status: val,
                    isPublished: val === 'published' || val === 'active',
                  });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              >
                <option value="published">Published (Visible on Public Website)</option>
                <option value="draft">Draft (Admin Only)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Display Sort Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => {
                  setFormData({ ...formData, order: parseInt(e.target.value) || 1 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    isPublished: checked,
                    status: checked ? 'published' : 'draft',
                  });
                  setIsDirty(true);
                }}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="font-semibold text-slate-700">Publish Immediately on Public Website</span>
            </label>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving to Firestore...' : editingMilestone ? 'Update Firestore Milestone' : 'Create Firestore Milestone'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingMilestone}
        title="Delete Milestone"
        message={`Are you sure you want to remove milestone "${deletingMilestone?.title}"?`}
        itemIdentifier={deletingMilestone ? `${deletingMilestone.year} — ${deletingMilestone.title}` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingMilestone?.status === 'archived'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingMilestone(null)}
      />
    </div>
  );
};

export default AdminMilestonesView;
