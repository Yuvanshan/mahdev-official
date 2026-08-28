import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Users,
} from 'lucide-react';
import { CmsCoupon } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DivisionId } from '../../types';
import { DIVISIONS } from '../../config/divisions';

export const AdminCouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<CmsCoupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CmsCoupon | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Delete State
  const [deletingCoupon, setDeletingCoupon] = useState<CmsCoupon | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    currency: 'USD',
    minSpend: 0,
    maxDiscount: 0,
    validFrom: '',
    validUntil: '',
    usageLimit: 100,
    divisionRestriction: 'all' as DivisionId | 'all',
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

  const loadCoupons = () => {
    const data = cmsService.getAll<CmsCoupon>('coupons', {
      search: searchQuery,
      status: statusFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setCoupons(data);
  };

  useEffect(() => {
    loadCoupons();
    const unsub = cmsService.subscribe('coupons', loadCoupons);
    return () => unsub();
  }, [searchQuery, statusFilter]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    addToast('info', 'Code Copied', `Coupon code "${code}" copied to clipboard.`);
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: 'Exclusive client promotional discount.',
      discountType: 'percentage',
      discountValue: 15,
      currency: 'USD',
      minSpend: 50,
      maxDiscount: 500,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      usageLimit: 500,
      divisionRestriction: 'all',
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (coupon: CmsCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      currency: coupon.currency || 'USD',
      minSpend: coupon.minSpend || 0,
      maxDiscount: coupon.maxDiscount || 0,
      validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      usageLimit: coupon.usageLimit || 100,
      divisionRestriction: coupon.divisionRestriction || 'all',
      isActive: coupon.isActive,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) errors.code = 'Coupon code is required';
    if (!formData.discountValue || formData.discountValue <= 0) errors.discountValue = 'Must be greater than 0';
    if (formData.discountType === 'percentage' && formData.discountValue > 100) errors.discountValue = 'Percentage cannot exceed 100%';
    if (!formData.validUntil) errors.validUntil = 'Expiry date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const codeFormatted = formData.code.toUpperCase().trim().replace(/\s+/g, '');

      if (editingCoupon) {
        await cmsService.updateAsync<CmsCoupon>('coupons', editingCoupon.id, {
          code: codeFormatted,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          currency: formData.currency,
          minSpend: Number(formData.minSpend) || undefined,
          maxDiscount: Number(formData.maxDiscount) || undefined,
          validFrom: formData.validFrom,
          validUntil: formData.validUntil,
          usageLimit: Number(formData.usageLimit) || 100,
          divisionRestriction: formData.divisionRestriction,
          isActive: formData.isActive,
        });
        addToast('success', 'Coupon Updated', `Coupon code "${codeFormatted}" saved to Firestore.`);
      } else {
        await cmsService.createAsync<CmsCoupon>('coupons', {
          code: codeFormatted,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          currency: formData.currency,
          minSpend: Number(formData.minSpend) || undefined,
          maxDiscount: Number(formData.maxDiscount) || undefined,
          validFrom: formData.validFrom,
          validUntil: formData.validUntil,
          usageLimit: Number(formData.usageLimit) || 100,
          usageCount: 0,
          divisionRestriction: formData.divisionRestriction,
          isActive: formData.isActive,
        });
        addToast('success', 'Coupon Created', `Coupon "${codeFormatted}" is now active in Firestore.`);
      }

      setIsEditorOpen(false);
      setIsDirty(false);
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message || 'Unable to save coupon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (permanent: boolean) => {
    if (!deletingCoupon) return;
    try {
      if (permanent) {
        await cmsService.hardDeleteAsync('coupons', deletingCoupon.id);
        addToast('success', 'Coupon Purged', `Coupon "${deletingCoupon.code}" permanently deleted from Firestore.`);
      } else {
        await cmsService.softDeleteAsync('coupons', deletingCoupon.id);
        addToast('success', 'Coupon Archived', `Coupon "${deletingCoupon.code}" archived in Firestore.`);
      }
      setDeletingCoupon(null);
    } catch (err: any) {
      addToast('error', 'Deletion Error', err.message || 'Could not delete coupon.');
    }
  };

  const handleRestore = async (coupon: CmsCoupon) => {
    try {
      await cmsService.restoreAsync('coupons', coupon.id);
      addToast('success', 'Coupon Restored', `Coupon "${coupon.code}" restored in Firestore.`);
    } catch (err: any) {
      addToast('error', 'Restore Error', err.message || 'Could not restore coupon.');
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
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Promotional Discount Coupons & Vouchers ({coupons.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create discount vouchers, percentage off codes, usage thresholds, and division-restricted vouchers.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          Create Coupon
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
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
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="all">All Coupons</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="deleted">Archived</option>
          </select>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          const isDeleted = !!coupon.isDeleted;
          const isExpired = new Date(coupon.validUntil) < new Date();

          return (
            <div
              key={coupon.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all duration-200 ${
                isDeleted
                  ? 'border-red-200/80 bg-red-50/20 opacity-75'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="group flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl font-mono text-sm font-bold text-blue-700 transition-colors"
                      title="Click to copy code"
                    >
                      <span>{coupon.code}</span>
                      {copiedCode === coupon.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
                      )}
                    </button>
                  </div>

                  {isDeleted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700">
                      ARCHIVED
                    </span>
                  ) : isExpired ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                      EXPIRED
                    </span>
                  ) : coupon.isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700">
                      DISABLED
                    </span>
                  )}
                </div>

                <div className="py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xl font-bold text-slate-900">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% OFF`
                        : `$${coupon.discountValue} OFF`}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {coupon.usageCount || 0} / {coupon.usageLimit} used
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {coupon.description}
                  </p>

                  <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                    <div className="flex justify-between">
                      <span>Valid until:</span>
                      <strong className="text-slate-800">{new Date(coupon.validUntil).toLocaleDateString()}</strong>
                    </div>
                    {coupon.minSpend ? (
                      <div className="flex justify-between">
                        <span>Min spend:</span>
                        <strong className="text-slate-800">${coupon.minSpend}</strong>
                      </div>
                    ) : null}
                    <div className="flex justify-between">
                      <span>Scope:</span>
                      <strong className="text-blue-700 uppercase">
                        {coupon.divisionRestriction === 'all' || !coupon.divisionRestriction ? 'All Divisions' : coupon.divisionRestriction}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                {isDeleted ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(coupon)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                      className="text-xs h-8"
                    >
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingCoupon(coupon)}
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
                      onClick={() => handleOpenEdit(coupon)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      className="text-xs h-8"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingCoupon(coupon)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      className="text-xs h-8 hover:bg-red-50 hover:text-red-600"
                    >
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {coupons.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <Tag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-900">No coupons found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No promo vouchers match your search criteria.
            </p>
            <Button variant="electric" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Create Coupon
            </Button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Discount Voucher'}
        subtitle="Manage promotional promo code, discount amount, expiry date, and usage limits."
        isDirty={isDirty}
        onSave={handleSave}
        isSaving={isSaving}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value.toUpperCase() });
                  setIsDirty(true);
                }}
                placeholder="e.g. MAHDEVVIP20"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.code ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.code && <p className="text-[11px] text-red-500 mt-1">{formErrors.code}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Division Restriction
              </label>
              <select
                value={formData.divisionRestriction}
                onChange={(e) => {
                  setFormData({ ...formData, divisionRestriction: e.target.value as any });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="all">Global (All 5 Divisions)</option>
                {Object.values(DIVISIONS).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setIsDirty(true);
              }}
              placeholder="e.g. 15% discount on all corporate audio visual & stage packages"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => {
                  setFormData({ ...formData, discountType: e.target.value as any });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={formData.discountType === 'percentage' ? 100 : 10000}
                value={formData.discountValue}
                onChange={(e) => {
                  setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none ${
                  formErrors.discountValue ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Usage Limit
              </label>
              <input
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) => {
                  setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 100 });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valid From
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => {
                  setFormData({ ...formData, validFrom: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valid Until (Expiry) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => {
                  setFormData({ ...formData, validUntil: e.target.value });
                  setIsDirty(true);
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none ${
                  formErrors.validUntil ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Minimum Spend ($)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minSpend}
                onChange={(e) => {
                  setFormData({ ...formData, minSpend: parseFloat(e.target.value) || 0 });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Discount Cap ($)
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxDiscount}
                onChange={(e) => {
                  setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 });
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
              <span className="ml-2.5 text-xs font-bold text-slate-800">Coupon Active & Redeemable</span>
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingCoupon}
        onClose={() => setDeletingCoupon(null)}
        title={deletingCoupon?.isDeleted ? 'Purge Coupon Permanently?' : 'Archive Coupon?'}
        message={
          deletingCoupon?.isDeleted
            ? `Are you sure you want to permanently purge coupon code "${deletingCoupon?.code}"?`
            : `Archive "${deletingCoupon?.code}"?`
        }
        confirmText={deletingCoupon?.isDeleted ? 'Permanent Purge' : 'Archive Coupon'}
        isDangerous={!!deletingCoupon?.isDeleted}
        onConfirm={() => handleDelete(!!deletingCoupon?.isDeleted)}
      />
    </div>
  );
};
