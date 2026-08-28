import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Globe,
  Layers,
  FileText,
} from 'lucide-react';
import { CmsPage } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';

export const AdminPagesView: React.FC = () => {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'deleted'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Delete State
  const [deletingPage, setDeletingPage] = useState<CmsPage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    category: 'legal' as 'legal' | 'corporate' | 'landing' | 'custom',
    metaDescription: '',
    heroHeading: '',
    heroSubheading: '',
    content: '',
    sections: [] as { heading: string; body: string; imageUrl?: string }[],
    isPublished: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadPages = () => {
    const data = cmsService.getAll<CmsPage>('pages', {
      search: searchQuery,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      includeDeleted: statusFilter === 'deleted' || statusFilter === 'all',
    });

    const filtered = data.filter((p) => {
      if (statusFilter === 'published') return p.isPublished && !p.isDeleted;
      if (statusFilter === 'draft') return !p.isPublished && !p.isDeleted;
      return true;
    });

    setPages(filtered);
  };

  useEffect(() => {
    loadPages();
    const unsub = cmsService.subscribe('pages', loadPages);
    return () => unsub();
  }, [searchQuery, categoryFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      category: 'custom',
      metaDescription: '',
      heroHeading: '',
      heroSubheading: '',
      content: '### Overview\nEnter your page overview and rich text specifications here.',
      sections: [{ heading: 'Key Provisions', body: 'Detailed description and guidelines.' }],
      isPublished: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (page: CmsPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      category: page.category,
      metaDescription: page.metaDescription,
      heroHeading: page.heroHeading,
      heroSubheading: page.heroSubheading || '',
      content: page.content,
      sections: page.sections || [],
      isPublished: page.isPublished,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Page title is required';
    if (!formData.slug.trim()) errors.slug = 'URL slug is required';
    if (!formData.metaDescription.trim()) errors.metaDescription = 'Meta description is required for SEO';
    if (!formData.heroHeading.trim()) errors.heroHeading = 'Hero display heading is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const slugFormatted = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      if (editingPage) {
        await cmsService.update<CmsPage>('pages', editingPage.id, {
          slug: slugFormatted,
          title: formData.title,
          category: formData.category,
          metaDescription: formData.metaDescription,
          heroHeading: formData.heroHeading,
          heroSubheading: formData.heroSubheading,
          content: formData.content,
          sections: formData.sections,
          isPublished: formData.isPublished,
          publishedAt: formData.isPublished ? (editingPage.publishedAt || now) : undefined,
        });
        addToast('success', 'Page Updated', `"${formData.title}" was successfully updated.`);
      } else {
        await cmsService.create<CmsPage>('pages', {
          slug: slugFormatted,
          title: formData.title,
          category: formData.category,
          metaDescription: formData.metaDescription,
          heroHeading: formData.heroHeading,
          heroSubheading: formData.heroSubheading,
          content: formData.content,
          sections: formData.sections,
          isPublished: formData.isPublished,
          publishedAt: formData.isPublished ? now : undefined,
        });
        addToast('success', 'Page Created', `"${formData.title}" was published to custom pages.`);
      }

      setIsEditorOpen(false);
      setIsDirty(false);
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message || 'Unable to save page.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (permanent: boolean) => {
    if (!deletingPage) return;
    try {
      if (permanent) {
        await cmsService.permanentDelete('pages', deletingPage.id);
        addToast('success', 'Page Purged', `"${deletingPage.title}" was permanently purged.`);
      } else {
        await cmsService.softDelete('pages', deletingPage.id);
        addToast('success', 'Page Archived', `"${deletingPage.title}" was archived.`);
      }
      setDeletingPage(null);
    } catch (err: any) {
      addToast('error', 'Deletion Error', err.message || 'Could not delete page.');
    }
  };

  const handleRestore = async (page: CmsPage) => {
    try {
      await cmsService.restore('pages', page.id);
      addToast('success', 'Page Restored', `"${page.title}" was restored to active pages.`);
    } catch (err: any) {
      addToast('error', 'Restore Error', err.message || 'Could not restore page.');
    }
  };

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [...formData.sections, { heading: 'New Section', body: 'Add section narrative here...' }],
    });
    setIsDirty(true);
  };

  const removeSection = (idx: number) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((_, i) => i !== idx),
    });
    setIsDirty(true);
  };

  const updateSection = (idx: number, field: 'heading' | 'body', val: string) => {
    const updated = [...formData.sections];
    updated[idx][field] = val;
    setFormData({ ...formData, sections: updated });
    setIsDirty(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Pages & Static Content Architecture ({pages.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage legal policies, corporate governance disclaimers, custom landing layouts, and route definitions.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          Create New Page
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pages by title, slug, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="legal">Legal & Compliance</option>
              <option value="corporate">Corporate Governance</option>
              <option value="landing">Landing & Campaign</option>
              <option value="custom">Custom Content</option>
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
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
              <option value="deleted">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((p) => {
          const isDeleted = !!p.isDeleted;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all duration-200 ${
                isDeleted
                  ? 'border-red-200/80 bg-red-50/20 opacity-75'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {p.category}
                    </span>
                    <h3 className="font-display text-sm font-bold text-slate-900 mt-2 line-clamp-1">{p.title}</h3>
                  </div>

                  {isDeleted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700">
                      ARCHIVED
                    </span>
                  ) : p.isPublished ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PUBLISHED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      DRAFT
                    </span>
                  )}
                </div>

                <div className="py-3 space-y-2">
                  <div className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>/{p.slug}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.metaDescription || p.heroHeading}
                  </p>

                  <div className="text-[11px] text-slate-400 font-medium">
                    {p.sections?.length || 0} sub-sections defined
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  {isDeleted ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(p)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                        className="text-xs h-8"
                      >
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingPage(p)}
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
                        onClick={() => handleOpenEdit(p)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        className="text-xs h-8"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingPage(p)}
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

        {pages.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <FileCode className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-900">No pages found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No static or legal pages match your filters.
            </p>
            <Button variant="electric" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Create New Page
            </Button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingPage ? `Edit Page: ${editingPage.title}` : 'Create Custom Page'}
        subtitle="Manage page content, SEO metadata, hero headings, and dynamic sub-sections."
        isDirty={isDirty}
        onSave={handleSave}
        isSaving={isSaving}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Page Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Master Terms of Service & SLA"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.title ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.title && <p className="text-[11px] text-red-500 mt-1">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value as any });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="legal">Legal & Compliance</option>
                <option value="corporate">Corporate Governance</option>
                <option value="landing">Landing & Campaign</option>
                <option value="custom">Custom Content</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                URL Route Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                  mahdev.lk/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData({ ...formData, slug: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="terms-of-service"
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-r-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    formErrors.slug ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {formErrors.slug && <p className="text-[11px] text-red-500 mt-1">{formErrors.slug}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Heading <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.heroHeading}
                onChange={(e) => {
                  setFormData({ ...formData, heroHeading: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="Large display title at top of page"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.heroHeading ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Meta Description (SEO) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.metaDescription}
              onChange={(e) => {
                setFormData({ ...formData, metaDescription: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Search engine summary snippet..."
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                formErrors.metaDescription ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hero Subheading
            </label>
            <input
              type="text"
              value={formData.heroSubheading}
              onChange={(e) => {
                setFormData({ ...formData, heroSubheading: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Subtext accompanying the hero heading"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Page Content Body (Markdown / Narrative)
            </label>
            <textarea
              rows={6}
              value={formData.content}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Enter markdown formatted text..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Sub-sections builder */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Dynamic Sub-Sections ({formData.sections.length})
              </label>
              <button
                type="button"
                onClick={addSection}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            <div className="space-y-3">
              {formData.sections.map((sec, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={sec.heading}
                      onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                      placeholder="Section Heading"
                      className="w-2/3 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeSection(idx)}
                      className="text-red-500 hover:text-red-700 p-1 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={sec.body}
                    onChange={(e) => updateSection(idx, 'body', e.target.value)}
                    placeholder="Section body text..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => {
                  setFormData({ ...formData, isPublished: e.target.checked });
                  setIsDirty(true);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-800">
                {formData.isPublished ? 'Published & Live on Web' : 'Saved as Draft (Hidden)'}
              </span>
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingPage}
        onClose={() => setDeletingPage(null)}
        title={deletingPage?.isDeleted ? 'Purge Page Permanently?' : 'Archive Page?'}
        message={
          deletingPage?.isDeleted
            ? `Are you sure you want to permanently purge "${deletingPage?.title}"? All route mappings will be erased.`
            : `Archive "${deletingPage?.title}"? It can be restored at any time.`
        }
        confirmText={deletingPage?.isDeleted ? 'Permanent Purge' : 'Archive Page'}
        isDangerous={!!deletingPage?.isDeleted}
        onConfirm={() => handleDelete(!!deletingPage?.isDeleted)}
      />
    </div>
  );
};
