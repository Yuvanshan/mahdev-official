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
  Tag,
  DollarSign,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { CmsPackage } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DivisionId } from '../../types';

export const AdminPackagesView: React.FC = () => {
  const [packages, setPackages] = useState<CmsPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CmsPackage | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingPackage, setDeletingPackage] = useState<CmsPackage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    divisionId: 'sws' as DivisionId,
    tagline: '',
    price: 3500,
    currency: 'USD',
    billingCycle: 'one-time' as string,
    features: [''],
    popular: false,
    badge: 'Enterprise Signature',
    ctaText: 'Reserve Tier Engagement',
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

  const loadPackages = () => {
    const data = cmsService.getAll<CmsPackage>('packages', {
      search: searchQuery,
      divisionId: divisionFilter,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setPackages(data);
  };

  useEffect(() => {
    loadPackages();
    const unsub = cmsService.subscribe('packages', loadPackages);
    return () => unsub();
  }, [searchQuery, divisionFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      divisionId: 'sws',
      tagline: 'Comprehensive turnkey production & full executive management',
      price: 4500,
      currency: 'USD',
      billingCycle: 'one-time',
      features: ['Full Turnkey Architecture', 'Dedicated Executive Project Lead', '24/7 Operations Oversight'],
      popular: false,
      badge: 'Signature Tier',
      ctaText: 'Book Package Now',
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (pkg: CmsPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      divisionId: pkg.divisionId,
      tagline: pkg.tagline || '',
      price: pkg.price,
      currency: pkg.currency || 'USD',
      billingCycle: pkg.billingCycle || 'one-time',
      features: pkg.features.length > 0 ? [...pkg.features] : [''],
      popular: pkg.popular || false,
      badge: pkg.badge || '',
      ctaText: pkg.ctaText || 'Get Started',
      isActive: pkg.isActive,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
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
    if (!formData.name.trim()) errors.name = 'Package name is required';
    if (formData.price < 0) errors.price = 'Price must be positive';
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
        features: cleanFeatures.length > 0 ? cleanFeatures : ['Professional Service Deliverable'],
      };

      if (editingPackage) {
        cmsService.update<CmsPackage>('packages', editingPackage.id, payload);
        addToast('success', 'Package Updated', `Package "${formData.name}" updated.`);
      } else {
        cmsService.create<CmsPackage>('packages', payload);
        addToast('success', 'Package Created', `Package "${formData.name}" created.`);
      }
      setIsDirty(false);
      setIsEditorOpen(false);
      loadPackages();
    } catch (err: any) {
      addToast('error', 'Error Saving Package', err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = (permanent: boolean) => {
    if (!deletingPackage) return;
    if (permanent) {
      cmsService.hardDelete('packages', deletingPackage.id);
      addToast('warning', 'Permanent Deletion', `Package "${deletingPackage.name}" removed.`);
    } else {
      cmsService.softDelete('packages', deletingPackage.id);
      addToast('info', 'Package Archived', `Package "${deletingPackage.name}" archived.`);
    }
    setDeletingPackage(null);
    loadPackages();
  };

  const handleRestore = (pkg: CmsPackage) => {
    cmsService.restore('packages', pkg.id);
    addToast('success', 'Package Restored', `"${pkg.name}" restored.`);
    loadPackages();
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">Service Packages & Bundles CMS</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {packages.length} Bundles
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Create structured tier pricing, bespoke deliverables, and popular featured packages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Package
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
            placeholder="Search package name, features..."
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Package & Division</th>
                <th className="py-3.5 px-4">Tagline & Deliverables</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Badge / Tier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No packages found matching filter.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className={`hover:bg-slate-50/80 transition-colors ${pkg.isDeleted ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{pkg.name}</span>
                            {pkg.popular && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold uppercase">{pkg.divisionId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-slate-700 block truncate font-medium mb-0.5">{pkg.tagline}</span>
                      <span className="text-[10px] text-slate-400">{pkg.features?.length || 0} inclusions</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${pkg.price?.toFixed(2)} {pkg.currency || 'USD'}
                      <span className="text-slate-400 text-[10px] font-normal block">/{pkg.billingCycle}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {pkg.badge ? (
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {pkg.badge}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {pkg.isDeleted ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : pkg.isActive ? (
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
                        {pkg.isDeleted ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(pkg)} className="text-blue-600">
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(pkg)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Package"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingPackage(pkg)}
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
        title={editingPackage ? `Edit Package: ${editingPackage.name}` : 'Create Pricing Package'}
        subtitle="Configure package deliverables, price, billing cycle, and popular badge."
        isDirty={isDirty}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Package Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Presidential Gala Sovereign Tier"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {formErrors.name && <p className="text-red-600 text-[10px] mt-0.5">{formErrors.name}</p>}
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Price (USD) *</label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Cycle</label>
              <select
                value={formData.billingCycle}
                onChange={(e) => {
                  setFormData({ ...formData, billingCycle: e.target.value as any });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="one-time">One-Time Engagement</option>
                <option value="per-day">Per Day / Daily</option>
                <option value="monthly">Monthly Retainer</option>
                <option value="yearly">Annual License</option>
              </select>
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
                placeholder="Enterprise Choice"
                className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tagline / Overview</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => {
                setFormData({ ...formData, tagline: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Turnkey executive production with 24/7 dedicated lead..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">Included Deliverables</label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Feature
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
                    placeholder="e.g. 8K Multicam Live Broadcast Suite"
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
                <span className="font-semibold text-slate-700">Mark Popular</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!deletingPackage}
        title="Delete Package Tier"
        message={`Are you sure you want to remove package "${deletingPackage?.name}"?`}
        itemIdentifier={deletingPackage ? `${deletingPackage.name} (${deletingPackage.divisionId})` : undefined}
        allowSoftDelete={true}
        isCurrentlyDeleted={deletingPackage?.isDeleted}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPackage(null)}
      />
    </div>
  );
};
