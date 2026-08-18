import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Star,
  CheckCircle2,
  XCircle,
  Building2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { CmsTestimonial } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { DivisionId } from '../../types';
import { DIVISIONS } from '../../config/divisions';

export const AdminTestimonialsView: React.FC = () => {
  const [testimonials, setTestimonials] = useState<CmsTestimonial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<CmsTestimonial | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Delete State
  const [deletingTestimonial, setDeletingTestimonial] = useState<CmsTestimonial | null>(null);

  // Media Picker
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    author: '',
    role: '',
    company: '',
    quote: '',
    rating: 5,
    divisionId: 'sws' as DivisionId,
    avatarInitials: '',
    photoUrl: '',
    date: '2026',
    verified: true,
    isFeatured: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadTestimonials = () => {
    const data = cmsService.getAll<CmsTestimonial>('testimonials', {
      search: searchQuery,
      divisionId: divisionFilter === 'all' ? undefined : divisionFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });
    setTestimonials(data);
  };

  useEffect(() => {
    loadTestimonials();
    const unsub = cmsService.subscribe('testimonials', loadTestimonials);
    return () => unsub();
  }, [searchQuery, divisionFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingTestimonial(null);
    setFormData({
      author: '',
      role: 'Chief Executive Officer',
      company: '',
      quote: '',
      rating: 5,
      divisionId: 'sws',
      avatarInitials: '',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      date: new Date().getFullYear().toString(),
      verified: true,
      isFeatured: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (testimonial: CmsTestimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      author: testimonial.author,
      role: testimonial.role,
      company: testimonial.company,
      quote: testimonial.quote,
      rating: testimonial.rating || 5,
      divisionId: testimonial.divisionId || 'sws',
      avatarInitials: testimonial.avatarInitials,
      photoUrl: testimonial.photoUrl || '',
      date: testimonial.date || '2026',
      verified: testimonial.verified,
      isFeatured: testimonial.isFeatured,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.author.trim()) errors.author = 'Author name is required';
    if (!formData.company.trim()) errors.company = 'Company / organization name is required';
    if (!formData.quote.trim()) errors.quote = 'Testimonial quote is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const divisionName = DIVISIONS[formData.divisionId]?.name || 'Mahdev Group';
      const initials = formData.avatarInitials.trim() || formData.author.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

      if (editingTestimonial) {
        await cmsService.update<CmsTestimonial>('testimonials', editingTestimonial.id, {
          author: formData.author,
          role: formData.role,
          company: formData.company,
          quote: formData.quote,
          rating: Number(formData.rating),
          divisionId: formData.divisionId,
          divisionName: divisionName,
          avatarInitials: initials,
          photoUrl: formData.photoUrl,
          date: formData.date,
          verified: formData.verified,
          isFeatured: formData.isFeatured,
        });
        addToast('success', 'Testimonial Updated', `Review from ${formData.author} was successfully updated.`);
      } else {
        await cmsService.create<CmsTestimonial>('testimonials', {
          author: formData.author,
          role: formData.role,
          company: formData.company,
          quote: formData.quote,
          rating: Number(formData.rating),
          divisionId: formData.divisionId,
          divisionName: divisionName,
          avatarInitials: initials,
          photoUrl: formData.photoUrl,
          date: formData.date,
          verified: formData.verified,
          isFeatured: formData.isFeatured,
        });
        addToast('success', 'Testimonial Created', `New review from ${formData.author} has been added.`);
      }

      setIsEditorOpen(false);
      setIsDirty(false);
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message || 'Unable to save testimonial.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (permanent: boolean) => {
    if (!deletingTestimonial) return;
    try {
      if (permanent) {
        await cmsService.permanentDelete('testimonials', deletingTestimonial.id);
        addToast('success', 'Testimonial Purged', `Review from "${deletingTestimonial.author}" permanently deleted.`);
      } else {
        await cmsService.softDelete('testimonials', deletingTestimonial.id);
        addToast('success', 'Testimonial Archived', `Review from "${deletingTestimonial.author}" archived.`);
      }
      setDeletingTestimonial(null);
    } catch (err: any) {
      addToast('error', 'Deletion Error', err.message || 'Could not delete testimonial.');
    }
  };

  const handleRestore = async (testimonial: CmsTestimonial) => {
    try {
      await cmsService.restore('testimonials', testimonial.id);
      addToast('success', 'Testimonial Restored', `Review from "${testimonial.author}" restored.`);
    } catch (err: any) {
      addToast('error', 'Restore Error', err.message || 'Could not restore testimonial.');
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
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Client Testimonials & Executive Reviews ({testimonials.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage verified client endorsements, quotes, star ratings, and divisional attributions.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          Add Testimonial
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search testimonials by author, company, quote..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Division:</span>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">All Divisions</option>
              {Object.values(DIVISIONS).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">All Reviews</option>
              <option value="active">Active Only</option>
              <option value="deleted">Archived (Deleted)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.map((t) => {
          const isDeleted = !!t.isDeleted;
          const division = t.divisionId ? DIVISIONS[t.divisionId] : null;

          return (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all duration-200 ${
                isDeleted
                  ? 'border-red-200/80 bg-red-50/20 opacity-75'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs overflow-hidden border border-blue-200 shrink-0">
                      {t.photoUrl ? (
                        <img
                          src={t.photoUrl}
                          alt={t.author}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{t.avatarInitials || 'MD'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {t.author}
                        {t.verified && (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold" title="Verified Client">
                            ✓
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {t.role}, <span className="font-semibold text-slate-700">{t.company}</span>
                      </p>
                    </div>
                  </div>

                  {division && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {division.shortName}
                    </span>
                  )}
                </div>

                <div className="py-3 space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (t.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono font-bold text-slate-700 ml-1">
                      {t.rating ? t.rating.toFixed(1) : '5.0'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic line-clamp-3 leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[11px] font-mono text-slate-400">
                  {t.date || '2026'}
                </div>

                <div className="flex items-center gap-1.5">
                  {isDeleted ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(t)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                        className="text-xs h-8"
                      >
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingTestimonial(t)}
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
                        onClick={() => handleOpenEdit(t)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        className="text-xs h-8"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingTestimonial(t)}
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

        {testimonials.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-900">No testimonials found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No executive reviews match your filter parameters.
            </p>
            <Button variant="electric" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Add First Testimonial
            </Button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingTestimonial ? `Edit Testimonial: ${editingTestimonial.author}` : 'Add Client Review'}
        subtitle="Manage client review attribution, division tag, star rating, and verification."
        isDirty={isDirty}
        onSave={handleSave}
        isSaving={isSaving}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client / Author Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => {
                  setFormData({ ...formData, author: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Dr. Ananda Jayasuriya"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.author ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.author && <p className="text-[11px] text-red-500 mt-1">{formErrors.author}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Role / Title
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Managing Director & Board Chair"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company / Organization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => {
                  setFormData({ ...formData, company: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Ceylon Commercial Bank"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.company ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.company && <p className="text-[11px] text-red-500 mt-1">{formErrors.company}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Associated Division
              </label>
              <select
                value={formData.divisionId}
                onChange={(e) => {
                  setFormData({ ...formData, divisionId: e.target.value as DivisionId });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
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
              Testimonial Quote <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.quote}
              onChange={(e) => {
                setFormData({ ...formData, quote: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Enter client quote and review comments..."
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                formErrors.quote ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.quote && <p className="text-[11px] text-red-500 mt-1">{formErrors.quote}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Star Rating (1 - 5)
              </label>
              <select
                value={formData.rating}
                onChange={(e) => {
                  setFormData({ ...formData, rating: Number(e.target.value) });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value={5}>5.0 - Exceptional (⭐⭐⭐⭐⭐)</option>
                <option value={4.5}>4.5 - Outstanding (⭐⭐⭐⭐½)</option>
                <option value={4}>4.0 - High Caliber (⭐⭐⭐⭐)</option>
                <option value={3}>3.0 - Standard (⭐⭐⭐)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date / Year
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="2026"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Initials
              </label>
              <input
                type="text"
                maxLength={3}
                value={formData.avatarInitials}
                onChange={(e) => {
                  setFormData({ ...formData, avatarInitials: e.target.value.toUpperCase() });
                  setIsDirty(true);
                }}
                placeholder="AJ"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Photo Avatar URL
              </label>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Media Library
              </button>
            </div>
            <input
              type="url"
              value={formData.photoUrl}
              onChange={(e) => {
                setFormData({ ...formData, photoUrl: e.target.value });
                setIsDirty(true);
              }}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) => {
                  setFormData({ ...formData, verified: e.target.checked });
                  setIsDirty(true);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-800">Verified Client Badge</span>
            </label>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => {
                  setFormData({ ...formData, isFeatured: e.target.checked });
                  setIsDirty(true);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-800">Feature on Homepage Carousel</span>
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Media Picker */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          setFormData({ ...formData, photoUrl: url });
          setIsDirty(true);
          setIsMediaPickerOpen(false);
        }}
        initialCategory="cinema"
      />

      {/* Confirm Delete / Restore Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingTestimonial}
        onClose={() => setDeletingTestimonial(null)}
        title={deletingTestimonial?.isDeleted ? 'Purge Testimonial?' : 'Archive Testimonial?'}
        message={
          deletingTestimonial?.isDeleted
            ? `Permanently purge review from "${deletingTestimonial?.author}"? This cannot be undone.`
            : `Archive review from "${deletingTestimonial?.author}"?`
        }
        confirmText={deletingTestimonial?.isDeleted ? 'Permanent Purge' : 'Archive Testimonial'}
        isDangerous={!!deletingTestimonial?.isDeleted}
        onConfirm={() => handleDelete(!!deletingTestimonial?.isDeleted)}
      />
    </div>
  );
};
