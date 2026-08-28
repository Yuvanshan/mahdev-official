import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Image as ImageIcon,
  Calendar,
  Layers,
} from 'lucide-react';
import { CmsBanner } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { DivisionId } from '../../types';
import { DIVISIONS } from '../../config/divisions';

export const AdminBannersView: React.FC = () => {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [placementFilter, setPlacementFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CmsBanner | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Delete State
  const [deletingBanner, setDeletingBanner] = useState<CmsBanner | null>(null);

  // Media Picker
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    placement: 'home_hero' as CmsBanner['placement'],
    divisionId: 'all' as DivisionId | 'all',
    targetUrl: '',
    buttonText: 'Explore Now',
    imageUrl: '',
    bgGradient: 'from-blue-900/90 via-slate-900 to-indigo-950',
    badgeText: 'SPECIAL OFFER',
    startDate: '',
    endDate: '',
    isActive: true,
    priority: 1,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadBanners = () => {
    const data = cmsService.getAll<CmsBanner>('banners', {
      search: searchQuery,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });

    const filtered = data.filter((b) => {
      if (placementFilter !== 'all' && b.placement !== placementFilter) return false;
      return true;
    });

    setBanners(filtered);
  };

  useEffect(() => {
    loadBanners();
    const unsub = cmsService.subscribe('banners', loadBanners);
    return () => unsub();
  }, [searchQuery, placementFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      placement: 'home_hero',
      divisionId: 'all',
      targetUrl: '/booking',
      buttonText: 'Book Consultation',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      bgGradient: 'from-blue-900/90 via-slate-900 to-indigo-950',
      badgeText: 'ENTERPRISE SPOTLIGHT',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      isActive: true,
      priority: banners.length + 1,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (banner: CmsBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      placement: banner.placement,
      divisionId: banner.divisionId || 'all',
      targetUrl: banner.targetUrl,
      buttonText: banner.buttonText || 'Learn More',
      imageUrl: banner.imageUrl || '',
      bgGradient: banner.bgGradient || 'from-blue-900/90 via-slate-900 to-indigo-950',
      badgeText: banner.badgeText || '',
      startDate: banner.startDate || '',
      endDate: banner.endDate || '',
      isActive: banner.isActive,
      priority: banner.priority || 1,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Banner headline is required';
    if (!formData.targetUrl.trim()) errors.targetUrl = 'Target URL or route is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      if (editingBanner) {
        await cmsService.updateAsync<CmsBanner>('banners', editingBanner.id, {
          title: formData.title,
          subtitle: formData.subtitle,
          placement: formData.placement,
          divisionId: formData.divisionId,
          targetUrl: formData.targetUrl,
          buttonText: formData.buttonText,
          imageUrl: formData.imageUrl,
          bgGradient: formData.bgGradient,
          badgeText: formData.badgeText,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          priority: Number(formData.priority),
        });
        addToast('success', 'Banner Updated', `"${formData.title}" was saved to Firestore.`);
      } else {
        await cmsService.createAsync<CmsBanner>('banners', {
          title: formData.title,
          subtitle: formData.subtitle,
          placement: formData.placement,
          divisionId: formData.divisionId,
          targetUrl: formData.targetUrl,
          buttonText: formData.buttonText,
          imageUrl: formData.imageUrl,
          bgGradient: formData.bgGradient,
          badgeText: formData.badgeText,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          priority: Number(formData.priority),
        });
        addToast('success', 'Banner Created', `"${formData.title}" is now active in Firestore.`);
      }

      setIsEditorOpen(false);
      setIsDirty(false);
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message || 'Unable to save banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (permanent: boolean) => {
    if (!deletingBanner) return;
    try {
      if (permanent) {
        await cmsService.hardDeleteAsync('banners', deletingBanner.id);
        addToast('success', 'Banner Purged', `"${deletingBanner.title}" permanently erased from Firestore.`);
      } else {
        await cmsService.softDeleteAsync('banners', deletingBanner.id);
        addToast('success', 'Banner Archived', `"${deletingBanner.title}" was archived in Firestore.`);
      }
      setDeletingBanner(null);
    } catch (err: any) {
      addToast('error', 'Deletion Error', err.message || 'Could not delete banner.');
    }
  };

  const handleRestore = async (banner: CmsBanner) => {
    try {
      await cmsService.restoreAsync('banners', banner.id);
      addToast('success', 'Banner Restored', `"${banner.title}" restored in Firestore.`);
    } catch (err: any) {
      addToast('error', 'Restore Error', err.message || 'Could not restore banner.');
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
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Promotional Banners & Announcements ({banners.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage homepage hero takeovers, sticky top announcement strips, division-specific campaigns, and seasonal sales.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          Create New Banner
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search banners by title or subtitle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Placement:</span>
            <select
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">All Placements</option>
              <option value="home_hero">Homepage Hero</option>
              <option value="announcement_bar">Top Announcement Bar</option>
              <option value="division_banner">Division Banner</option>
              <option value="mart_sale">Online Mart Sale Bar</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="deleted">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => {
          const isDeleted = !!banner.isDeleted;

          return (
            <div
              key={banner.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all duration-200 ${
                isDeleted
                  ? 'border-red-200/80 bg-red-50/20 opacity-75'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                      {banner.placement.replace('_', ' ')}
                    </span>
                    {banner.badgeText && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {banner.badgeText}
                      </span>
                    )}
                  </div>

                  {isDeleted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700">
                      ARCHIVED
                    </span>
                  ) : banner.isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                      DISABLED
                    </span>
                  )}
                </div>

                {/* Banner Live Graphic Preview */}
                <div className="mt-3 relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center p-4">
                  {banner.imageUrl && (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-35"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="relative z-10 space-y-1">
                    <h3 className="font-display text-base font-bold text-white leading-tight">
                      {banner.title}
                    </h3>
                    <p className="text-xs text-slate-200 line-clamp-1">
                      {banner.subtitle}
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xs text-white rounded-lg text-[10px] font-bold">
                        {banner.buttonText} →
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Target: <code className="text-blue-600 font-mono">{banner.targetUrl}</code></span>
                  <span>Priority: <strong className="text-slate-800 font-mono">#{banner.priority}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {banner.startDate && banner.endDate ? `${banner.startDate} to ${banner.endDate}` : 'Continuous'}
                </span>

                <div className="flex items-center gap-1.5">
                  {isDeleted ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(banner)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                        className="text-xs h-8"
                      >
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingBanner(banner)}
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
                        onClick={() => handleOpenEdit(banner)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        className="text-xs h-8"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingBanner(banner)}
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

        {banners.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-900">No banners found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No promotional banners match your current filters.
            </p>
            <Button variant="electric" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Create First Banner
            </Button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingBanner ? `Edit Banner: ${editingBanner.title}` : 'Create Promotional Banner'}
        subtitle="Manage banner text, CTA buttons, background graphics, dates, and placement channels."
        isDirty={isDirty}
        onSave={handleSave}
        isSaving={isSaving}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Banner Headline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. 2026 Enterprise SWS Event Bookings Open"
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                formErrors.title ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.title && <p className="text-[11px] text-red-500 mt-1">{formErrors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subtitle / Supporting Text
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => {
                setFormData({ ...formData, subtitle: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. Reserve state-of-the-art concert sound systems and 4K LED volume rigs."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Placement Location
              </label>
              <select
                value={formData.placement}
                onChange={(e) => {
                  setFormData({ ...formData, placement: e.target.value as any });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="home_hero">Homepage Hero Strip</option>
                <option value="announcement_bar">Sticky Top Announcement Bar</option>
                <option value="division_banner">Division Overview Banner</option>
                <option value="mart_sale">Online Mart Flash Sale Strip</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Division Filter
              </label>
              <select
                value={formData.divisionId}
                onChange={(e) => {
                  setFormData({ ...formData, divisionId: e.target.value as any });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="all">All Divisions (Global)</option>
                {Object.values(DIVISIONS).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target URL / Route <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.targetUrl}
                onChange={(e) => {
                  setFormData({ ...formData, targetUrl: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="/booking or /mart"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.targetUrl ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Button Text
              </label>
              <input
                type="text"
                value={formData.buttonText}
                onChange={(e) => {
                  setFormData({ ...formData, buttonText: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Book Now"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Background Image / Media picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Background Image Graphic
              </label>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Select Media
              </button>
            </div>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => {
                setFormData({ ...formData, imageUrl: e.target.value });
                setIsDirty(true);
              }}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Badge Text
              </label>
              <input
                type="text"
                value={formData.badgeText}
                onChange={(e) => {
                  setFormData({ ...formData, badgeText: e.target.value.toUpperCase() });
                  setIsDirty(true);
                }}
                placeholder="LIMITED TIME"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => {
                  setFormData({ ...formData, isActive: e.target.checked });
                  setIsDirty(true);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-800">Banner Enabled (Active)</span>
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Media Picker */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          setFormData({ ...formData, imageUrl: url });
          setIsDirty(true);
          setIsMediaPickerOpen(false);
        }}
        initialCategory="banners"
      />

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingBanner}
        onClose={() => setDeletingBanner(null)}
        title={deletingBanner?.isDeleted ? 'Purge Banner Permanently?' : 'Archive Banner?'}
        message={
          deletingBanner?.isDeleted
            ? `Are you sure you want to permanently erase "${deletingBanner?.title}"?`
            : `Archive "${deletingBanner?.title}"?`
        }
        confirmText={deletingBanner?.isDeleted ? 'Permanent Purge' : 'Archive Banner'}
        isDangerous={!!deletingBanner?.isDeleted}
        onConfirm={() => handleDelete(!!deletingBanner?.isDeleted)}
      />
    </div>
  );
};
