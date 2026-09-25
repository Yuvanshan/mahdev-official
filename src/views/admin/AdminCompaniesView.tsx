import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Globe,
  Award,
  Image as ImageIcon,
} from 'lucide-react';
import { CmsTrustedCompany } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { firestoreTrustedCompaniesService } from '../../services/firestore/trustedCompanies';

export const AdminCompaniesView: React.FC = () => {
  const [companies, setCompanies] = useState<CmsTrustedCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CmsTrustedCompany | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Delete State
  const [deletingCompany, setDeletingCompany] = useState<CmsTrustedCompany | null>(null);

  // Media Picker State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    partnershipType: 'Enterprise Partner',
    logoUrl: '',
    website: '',
    description: '',
    featured: true,
    order: 1,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadCompanies = () => {
    const data = cmsService.getAll<CmsTrustedCompany>('companies', {
      search: searchQuery,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setCompanies(data);
  };

  useEffect(() => {
    loadCompanies();
    const unsub = cmsService.subscribe('companies', loadCompanies);
    return () => unsub();
  }, [searchQuery, statusFilter]);

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      industry: 'Technology & Telecommunications',
      partnershipType: 'Strategic Technology Partner',
      logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      website: 'https://example.com',
      description: 'Key collaborative enterprise partner.',
      featured: true,
      order: companies.length + 1,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (company: CmsTrustedCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry,
      partnershipType: company.partnershipType,
      logoUrl: company.logoUrl || '',
      website: company.website || '',
      description: company.description,
      featured: company.featured,
      order: company.order || 1,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Company name is required';
    if (!formData.industry.trim()) errors.industry = 'Industry classification is required';
    if (!formData.partnershipType.trim()) errors.partnershipType = 'Partnership tier is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      if (editingCompany) {
        await cmsService.update<CmsTrustedCompany>('companies', editingCompany.id, {
          name: formData.name,
          industry: formData.industry,
          partnershipType: formData.partnershipType,
          logoUrl: formData.logoUrl,
          website: formData.website,
          description: formData.description,
          featured: formData.featured,
          order: Number(formData.order),
        });
        firestoreTrustedCompaniesService.saveTrustedCompany(editingCompany.id, {
          name: formData.name,
          industry: formData.industry,
          logoUrl: formData.logoUrl,
          website: formData.website,
          description: formData.description,
          featured: formData.featured,
          order: Number(formData.order),
        }).catch(() => {});
        addToast('success', 'Partner Updated', `"${formData.name}" has been successfully updated.`);
      } else {
        const created = await cmsService.create<CmsTrustedCompany>('companies', {
          name: formData.name,
          industry: formData.industry,
          partnershipType: formData.partnershipType,
          logoUrl: formData.logoUrl,
          website: formData.website,
          description: formData.description,
          featured: formData.featured,
          order: Number(formData.order),
        });
        firestoreTrustedCompaniesService.saveTrustedCompany(created.id, {
          name: formData.name,
          industry: formData.industry,
          logoUrl: formData.logoUrl,
          website: formData.website,
          description: formData.description,
          featured: formData.featured,
          order: Number(formData.order),
        }).catch(() => {});
        addToast('success', 'Partner Created', `"${formData.name}" has been added to trusted enterprise partners.`);
      }

      setIsEditorOpen(false);
      setIsDirty(false);
      loadCompanies();
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message || 'Unable to save partner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (permanent: boolean) => {
    if (!deletingCompany) return;
    try {
      if (permanent) {
        await cmsService.permanentDelete('companies', deletingCompany.id);
        firestoreTrustedCompaniesService.deleteTrustedCompany(deletingCompany.id).catch(() => {});
        addToast('success', 'Partner Removed', `"${deletingCompany.name}" was permanently deleted.`);
      } else {
        await cmsService.softDelete('companies', deletingCompany.id);
        addToast('success', 'Partner Archived', `"${deletingCompany.name}" was archived (soft deleted).`);
      }
      setDeletingCompany(null);
    } catch (err: any) {
      addToast('error', 'Deletion Error', err.message || 'Could not delete partner.');
    }
  };

  const handleRestore = async (company: CmsTrustedCompany) => {
    try {
      await cmsService.restore('companies', company.id);
      addToast('success', 'Partner Restored', `"${company.name}" has been restored to active partners.`);
    } catch (err: any) {
      addToast('error', 'Restore Error', err.message || 'Could not restore partner.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Trusted Companies & Partner Network ({companies.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage corporate affiliations, client brands, and strategic alliance logos displayed across the web portal.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          Add Partner Company
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search partners by name, industry, tier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Partners</option>
            <option value="active">Active Only</option>
            <option value="deleted">Archived (Deleted)</option>
          </select>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => {
          const isDeleted = !!company.isDeleted;

          return (
            <div
              key={company.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all duration-200 ${
                isDeleted
                  ? 'border-red-200/80 bg-red-50/20 opacity-75'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Building className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-900 line-clamp-1">{company.name}</h3>
                      <span className="text-[11px] text-slate-500 font-medium">{company.industry}</span>
                    </div>
                  </div>

                  {isDeleted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200">
                      ARCHIVED
                    </span>
                  ) : company.featured ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Award className="w-3 h-3" /> FEATURED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                      PARTNER
                    </span>
                  )}
                </div>

                <div className="py-3 space-y-2">
                  <div className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-mono">
                      {company.partnershipType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {company.description || 'Enterprise collaboration partner with Mahdev conglomerate.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[11px] font-mono text-slate-400">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  ) : (
                    <span>No URL</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isDeleted ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(company)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                        className="text-xs h-8"
                      >
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingCompany(company)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
                        className="text-xs h-8 text-red-600 hover:bg-red-50"
                      >
                        Purge
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(company)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        className="text-xs h-8"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingCompany(company)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        className="text-xs h-8 hover:bg-red-50 hover:text-red-600"
                      >
                        Archive
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {companies.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <Building className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-900">No partner companies found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No corporate entities match your active filters. Click below to add a trusted enterprise partner.
            </p>
            <Button variant="electric" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Add First Partner
            </Button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingCompany ? `Edit Partner: ${editingCompany.name}` : 'Add New Partner Company'}
        subtitle="Manage partner corporate identity, industry classification, and promotional logo."
        isDirty={isDirty}
        onSave={handleSave}
        isSaving={isSaving}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
            >
              {isSaving ? 'Saving Partner...' : editingCompany ? 'Save Partner Company' : 'Create Partner Company'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Sony Broadcast APAC"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.name ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Industry Classification <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => {
                  setFormData({ ...formData, industry: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Media & Broadcast Hardware"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.industry ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.industry && <p className="text-[11px] text-red-500 mt-1">{formErrors.industry}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Partnership Tier / Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.partnershipType}
                onChange={(e) => {
                  setFormData({ ...formData, partnershipType: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Authorized Hardware Distributor"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => {
                  setFormData({ ...formData, website: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="https://company.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Logo URL with Media Picker button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Logo Asset URL
              </label>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Select from Media Library
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => {
                  setFormData({ ...formData, logoUrl: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {formData.logoUrl && (
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 p-1 shrink-0 overflow-hidden">
                  <img
                    src={formData.logoUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Partnership Scope
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Brief summary of collaborative capabilities and historical projects..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => {
                  setFormData({ ...formData, order: parseInt(e.target.value) || 1 });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => {
                    setFormData({ ...formData, featured: e.target.checked });
                    setIsDirty(true);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-800">Feature on Homepage</span>
              </label>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          setFormData({ ...formData, logoUrl: url });
          setIsDirty(true);
          setIsMediaPickerOpen(false);
        }}
        initialCategory="logos"
      />

      {/* Confirm Delete / Restore Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingCompany}
        onClose={() => setDeletingCompany(null)}
        title={deletingCompany?.isDeleted ? 'Purge Partner Record?' : 'Archive Partner Company?'}
        message={
          deletingCompany?.isDeleted
            ? `Are you sure you want to permanently delete "${deletingCompany?.name}"? This action cannot be undone.`
            : `Are you sure you want to archive "${deletingCompany?.name}"? It can be restored later from the archive tab.`
        }
        confirmText={deletingCompany?.isDeleted ? 'Permanent Purge' : 'Archive Partner'}
        isDangerous={!!deletingCompany?.isDeleted}
        onConfirm={() => handleDelete(!!deletingCompany?.isDeleted)}
      />
    </div>
  );
};
