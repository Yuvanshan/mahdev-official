import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { CmsService } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DivisionId } from '../../types';

export const AdminServicesView: React.FC = () => {
  const [services, setServices] = useState<CmsService[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingService, setEditingService] = useState<CmsService | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingService, setDeletingService] = useState<CmsService | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    divisionId: 'sws' as DivisionId,
    divisionName: 'SWS Event Management',
    title: '',
    description: '',
    features: [''],
    iconName: 'Sparkles',
    popular: false,
    badge: 'Enterprise Tier',
    startingPrice: 1500,
    currency: 'USD',
    turnaroundTime: '2-3 Weeks',
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

  const loadServices = () => {
    const data = cmsService.getAll<CmsService>('services', {
      search: searchQuery,
      divisionId: divisionFilter,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setServices(data);
  };

  useEffect(() => {
    loadServices();
    const unsub = cmsService.subscribe('services', loadServices);
    return () => unsub();
  }, [searchQuery, divisionFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      divisionId: 'sws',
      divisionName: 'SWS Event Management',
      title: '',
      description: '',
      features: ['24/7 Dedicated Concierge', 'Custom Architectural CAD Renderings', 'High Reliability Delivery'],
      iconName: 'Sparkles',
      popular: false,
      badge: 'Featured Offering',
      startingPrice: 1800,
      currency: 'USD',
      turnaroundTime: '2-3 Weeks',
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (srv: CmsService) => {
    setEditingService(srv);
    setFormData({
      divisionId: srv.divisionId,
      divisionName: srv.divisionName,
      title: srv.title,
      description: srv.description,
      features: srv.features.length > 0 ? [...srv.features] : [''],
      iconName: srv.iconName || 'Sparkles',
      popular: srv.popular,
      badge: srv.badge,
      startingPrice: srv.startingPrice || 1000,
      currency: srv.currency || 'USD',
      turnaroundTime: srv.turnaroundTime || '2-3 Weeks',
      isActive: srv.isActive,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleDivisionChange = (divId: DivisionId) => {
    const divNames: Record<DivisionId, string> = {
      sws: 'SWS Event Management',
      u1: 'U1 Studio',
      it: 'Mahdev IT & Solutions',
      travels: 'Mahdev Travels',
      mart: 'Mahdev Online Mart',
    };
    setFormData({
      ...formData,
      divisionId: divId,
      divisionName: divNames[divId],
    });
    setIsDirty(true);
  };

  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
    setIsDirty(true);
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...formData.features];
    updated[index] = val;
    setFormData({ ...formData, features: updated });
    setIsDirty(true);
  };

  const handleRemoveFeature = (index: number) => {
    const updated = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updated });
    setIsDirty(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Service Title is required';
    if (!formData.description.trim()) errors.description = 'Service Description is required';
    if (formData.startingPrice < 0) errors.startingPrice = 'Starting Price cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const cleanFeatures = formData.features.map((f) => f.trim()).filter(Boolean);
      const payload = {
        ...formData,
        features: cleanFeatures.length > 0 ? cleanFeatures : ['Professional Service Consultation'],
      };

      if (editingService) {
        cmsService.update<CmsService>('services', editingService.id, payload);
        addToast('success', 'Service Updated', `"${formData.title}" has been saved.`);
      } else {
        cmsService.create<CmsService>('services', payload);
        addToast('success', 'Service Created', `"${formData.title}" is now available.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadServices();
    } catch (err: any) {
      addToast('error', 'Error Saving Service', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = (permanent: boolean) => {
    if (!deletingService) return;
    if (permanent) {
      cmsService.hardDelete('services', deletingService.id);
      addToast('warning', 'Permanent Deletion', `"${deletingService.title}" was permanently removed.`);
    } else {
      cmsService.softDelete('services', deletingService.id);
      addToast('info', 'Service Archived', `"${deletingService.title}" was archived.`);
    }
    setDeletingService(null);
    loadServices();
  };

  const handleRestore = (srv: CmsService) => {
    cmsService.restore('services', srv.id);
    addToast('success', 'Service Restored', `"${srv.title}" is restored.`);
    loadServices();
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Services Catalog CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {services.length} Services
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Create and edit service offerings, package scopes, deliverables, and starting prices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Service
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service title, features..."
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
            <option value="inactive">Inactive Only</option>
            <option value="deleted">Archived</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Service & Division</th>
                <th className="py-3.5 px-4">Deliverables & Features</th>
                <th className="py-3.5 px-4">Starting Price</th>
                <th className="py-3.5 px-4">Turnaround</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No services found matching filters.
                  </td>
                </tr>
              ) : (
                services.map((srv) => (
                  <tr key={srv.id} className={`hover:bg-slate-50/80 transition-colors ${srv.isDeleted ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{srv.title}</span>
                            {srv.popular && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                            {srv.divisionName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-[11px] text-slate-600 block line-clamp-1 mb-1">{srv.description}</span>
                      <div className="flex flex-wrap gap-1">
                        {srv.features?.slice(0, 2).map((feat, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-mono truncate max-w-[140px]">
                            {feat}
                          </span>
                        ))}
                        {srv.features?.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold">+{srv.features.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${srv.startingPrice?.toFixed(2) || '0.00'} {srv.currency || 'USD'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] font-mono">
                      <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                      {srv.turnaroundTime || 'Custom'}
                    </td>
                    <td className="py-3.5 px-4">
                      {srv.isDeleted ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : srv.isActive ? (
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
                        {srv.isDeleted ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(srv)} className="text-blue-600">
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(srv)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Service"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingService(srv)}
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

      {/* Service Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingService ? `Edit Service: ${editingService.title}` : 'Create New Service Offering'}
        subtitle="Specify division ownership, scope deliverables, pricing, and SLA turnaround."
        isDirty={isDirty}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Cinema 8K Documentaries & Commercials"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.title && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Division *</label>
              <select
                value={formData.divisionId}
                onChange={(e) => handleDivisionChange(e.target.value as DivisionId)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="sws">SWS Event Management</option>
                <option value="u1">U1 Studio</option>
                <option value="it">Mahdev IT & Solutions</option>
                <option value="travels">Mahdev Travels</option>
                <option value="mart">Mahdev Online Mart</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Comprehensive summary of service capabilities and client value proposition..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {formErrors.description && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.description}</p>}
          </div>

          {/* Features / Deliverables List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">Included Features / Key Deliverables</label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {formData.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 text-center text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder="e.g. Cinema 8K RAW Multi-Camera Switchboard"
                    className="w-full px-3 py-1.5 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Starting Price (USD)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.startingPrice}
                onChange={(e) => {
                  setFormData({ ...formData, startingPrice: parseFloat(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Turnaround Time</label>
              <input
                type="text"
                value={formData.turnaroundTime}
                onChange={(e) => {
                  setFormData({ ...formData, turnaroundTime: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. 2-3 Weeks Delivery"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => {
                  setFormData({ ...formData, badge: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Media & Film"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
                  checked={formData.popular}
                  onChange={(e) => {
                    setFormData({ ...formData, popular: e.target.checked });
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span className="font-semibold text-slate-700">Mark as Popular</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingService}
        title="Delete Service Offering"
        message={`Are you sure you want to remove or archive "${deletingService?.title}"?`}
        itemIdentifier={deletingService ? `${deletingService.title} (${deletingService.divisionName})` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingService?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingService(null)}
      />
    </div>
  );
};
