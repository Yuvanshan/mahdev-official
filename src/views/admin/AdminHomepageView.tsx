import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  Layers,
  LayoutTemplate,
  Sliders,
  Type,
  Image as ImageIcon,
  Compass,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Star,
  Globe,
  Tag,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { cmsService } from '../../services/cmsService';
import { HomepageCmsConfig, CmsService as CmsServiceEntity, CmsProduct, CmsPortfolioProject } from '../../types/cms';

export const AdminHomepageView: React.FC = () => {
  const [config, setConfig] = useState<HomepageCmsConfig>(() => cmsService.getHomepageConfig());
  const [activeTab, setActiveTab] = useState<
    'hero' | 'intro' | 'services' | 'products' | 'portfolio' | 'milestones' | 'companies' | 'cta' | 'seo'
  >('hero');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'hero' | 'seo'>('hero');

  // Available entities for multi-selectors
  const [allServices, setAllServices] = useState<CmsServiceEntity[]>([]);
  const [allProducts, setAllProducts] = useState<CmsProduct[]>([]);
  const [allProjects, setAllProjects] = useState<CmsPortfolioProject[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const loaded = cmsService.getHomepageConfig();
    setConfig(loaded);
    setAllServices(cmsService.getAll<CmsServiceEntity>('services'));
    setAllProducts(cmsService.getAll<CmsProduct>('products'));
    setAllProjects(cmsService.getAll<CmsPortfolioProject>('portfolio'));
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      cmsService.updateHomepageConfig(config);
      setIsDirty(false);
      addToast('success', 'Homepage Published', 'Homepage configuration updated and live on public site.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not update homepage configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all homepage content and layout settings to factory corporate defaults?')) {
      const resetConf = cmsService.resetHomepageConfig();
      setConfig(resetConf);
      setIsDirty(false);
      addToast('info', 'Factory Reset', 'Homepage content restored to corporate defaults.');
    }
  };

  // Helper updater
  const updateNested = <K extends keyof HomepageCmsConfig>(
    section: K,
    key: keyof HomepageCmsConfig[K],
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value,
      },
    }));
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
            <LayoutTemplate className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Corporate Homepage CMS & Layout Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time management of hero headlines, media backdrops, featured division showcases, portfolio highlights, and CTA blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-semibold cursor-pointer"
          >
            Reset Defaults
          </Button>

          <Button
            variant="electric"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="text-xs font-bold cursor-pointer"
          >
            {isSaving ? 'Publishing...' : 'Save & Publish Live'}
          </Button>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'hero', label: '1. Hero & Media', icon: Sparkles },
          { id: 'intro', label: '2. Advantage Pillars', icon: ShieldCheck },
          { id: 'services', label: '3. Featured Services', icon: Layers },
          { id: 'products', label: '4. Featured Hardware', icon: Tag },
          { id: 'portfolio', label: '5. Portfolio & Cases', icon: Star },
          { id: 'milestones', label: '6. Milestones Matrix', icon: TrendingUp },
          { id: 'companies', label: '7. Corporate Partners', icon: Globe },
          { id: 'cta', label: '8. Global CTA Bar', icon: Phone },
          { id: 'seo', label: '9. Homepage SEO', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Body based on Active Tab */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* ===================== TAB 1: HERO & MEDIA ===================== */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-bold text-slate-900">Hero Section Content & Backdrop</h3>
              <p className="text-xs text-slate-500">Configure the primary public headline, accent emphasis words, subtext, and media background.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={config.hero.badgeText}
                  onChange={(e) => updateNested('hero', 'badgeText', e.target.value)}
                  placeholder="e.g. Mahdev Pvt Ltd • Parent Enterprise"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Media Type</label>
                <select
                  value={config.hero.mediaType}
                  onChange={(e) => updateNested('hero', 'mediaType', e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
                >
                  <option value="gradient">Clean Corporate Gradient</option>
                  <option value="image">Backdrop Background Image</option>
                  <option value="video">Cinematic Video Embed</option>
                </select>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Title Line 1</label>
                  <input
                    type="text"
                    value={config.hero.titleLine1}
                    onChange={(e) => updateNested('hero', 'titleLine1', e.target.value)}
                    placeholder="Creating Moments."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-blue-600 uppercase tracking-wider mb-1">Title Highlight (Blue)</label>
                  <input
                    type="text"
                    value={config.hero.titleHighlight}
                    onChange={(e) => updateNested('hero', 'titleHighlight', e.target.value)}
                    placeholder="Capturing Memories."
                    className="w-full px-3.5 py-2 bg-blue-50/60 border border-blue-200 text-blue-900 font-semibold rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Title Line 2</label>
                  <input
                    type="text"
                    value={config.hero.titleLine2}
                    onChange={(e) => updateNested('hero', 'titleLine2', e.target.value)}
                    placeholder="Delivering Innovation."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Supporting Description</label>
                <textarea
                  rows={3}
                  value={config.hero.description}
                  onChange={(e) => updateNested('hero', 'description', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              {config.hero.mediaType === 'image' && (
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">Backdrop Image URL</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('hero');
                        setIsMediaPickerOpen(true);
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Select Media Library
                    </button>
                  </div>
                  <input
                    type="url"
                    value={config.hero.mediaUrl}
                    onChange={(e) => updateNested('hero', 'mediaUrl', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {/* Call to Action Buttons */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Primary CTA Label</label>
                <input
                  type="text"
                  value={config.hero.primaryCtaLabel}
                  onChange={(e) => updateNested('hero', 'primaryCtaLabel', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Secondary CTA Label</label>
                <input
                  type="text"
                  value={config.hero.secondaryCtaLabel}
                  onChange={(e) => updateNested('hero', 'secondaryCtaLabel', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: ADVANTAGE PILLARS ===================== */}
        {activeTab === 'intro' && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-bold text-slate-900">The Mahdev Advantage & Strategic Pillars</h3>
              <p className="text-xs text-slate-500">Corporate introduction section conveying our integrated multi-division synergies.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Badge</label>
                <input
                  type="text"
                  value={config.intro.badge}
                  onChange={(e) => updateNested('intro', 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Headline</label>
                <input
                  type="text"
                  value={config.intro.headline}
                  onChange={(e) => updateNested('intro', 'headline', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subheadline</label>
                <input
                  type="text"
                  value={config.intro.subheadline}
                  onChange={(e) => updateNested('intro', 'subheadline', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Introduction Body</label>
                <textarea
                  rows={3}
                  value={config.intro.description}
                  onChange={(e) => updateNested('intro', 'description', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: FEATURED SERVICES ===================== */}
        {activeTab === 'services' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Featured Services Showcase</h3>
                <p className="text-xs text-slate-500">Enable and curate flagship offerings shown on the corporate homepage.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.featuredServices.enabled}
                  onChange={(e) => updateNested('featuredServices', 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Show Section on Homepage</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Badge</label>
                <input
                  type="text"
                  value={config.featuredServices.badge}
                  onChange={(e) => updateNested('featuredServices', 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Title</label>
                <input
                  type="text"
                  value={config.featuredServices.title}
                  onChange={(e) => updateNested('featuredServices', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  value={config.featuredServices.subtitle}
                  onChange={(e) => updateNested('featuredServices', 'subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: FEATURED HARDWARE ===================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Enterprise Hardware & Online Mart Spotlight</h3>
                <p className="text-xs text-slate-500">Promote curated professional hardware, cinema cameras, and Ceylon goods.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.featuredProducts.enabled}
                  onChange={(e) => updateNested('featuredProducts', 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Show Section on Homepage</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Badge</label>
                <input
                  type="text"
                  value={config.featuredProducts.badge}
                  onChange={(e) => updateNested('featuredProducts', 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Title</label>
                <input
                  type="text"
                  value={config.featuredProducts.title}
                  onChange={(e) => updateNested('featuredProducts', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Spotlight Promo Banner Text</label>
                <input
                  type="text"
                  value={config.featuredProducts.spotlightBannerText || ''}
                  onChange={(e) => updateNested('featuredProducts', 'spotlightBannerText', e.target.value)}
                  placeholder="Official Sony FX9 and RED V-Raptor dealer in Sri Lanka."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: PORTFOLIO ===================== */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Portfolio & Case Studies Section</h3>
                <p className="text-xs text-slate-500">Configure the hallmark productions showcase section on the homepage.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.portfolio.enabled}
                  onChange={(e) => updateNested('portfolio', 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Show Portfolio Showcase</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Badge</label>
                <input
                  type="text"
                  value={config.portfolio.badge}
                  onChange={(e) => updateNested('portfolio', 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Title</label>
                <input
                  type="text"
                  value={config.portfolio.title}
                  onChange={(e) => updateNested('portfolio', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  value={config.portfolio.subtitle}
                  onChange={(e) => updateNested('portfolio', 'subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: MILESTONES ===================== */}
        {activeTab === 'milestones' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Milestones of Excellence (2018 - Present)</h3>
                <p className="text-xs text-slate-500">Control the verified track record chronological timeline visibility and copy.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.milestones.enabled}
                  onChange={(e) => updateNested('milestones', 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Show Milestones Section</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Badge</label>
                <input
                  type="text"
                  value={config.milestones.badge}
                  onChange={(e) => updateNested('milestones', 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Title</label>
                <input
                  type="text"
                  value={config.milestones.title}
                  onChange={(e) => updateNested('milestones', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  value={config.milestones.subtitle}
                  onChange={(e) => updateNested('milestones', 'subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 7: CORPORATE PARTNERS ===================== */}
        {activeTab === 'companies' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Corporate Partners & Clients</h3>
                <p className="text-xs text-slate-500">Configure the Trusted Enterprise Partners matrix on the public site.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.companies.enabled}
                  onChange={(e) => updateNested('companies', 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Show Partners Section</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Badge</label>
                <input
                  type="text"
                  value={config.companies.badge}
                  onChange={(e) => updateNested('companies', 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Title</label>
                <input
                  type="text"
                  value={config.companies.title}
                  onChange={(e) => updateNested('companies', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  value={config.companies.subtitle}
                  onChange={(e) => updateNested('companies', 'subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 8: GLOBAL CTA BAR ===================== */}
        {activeTab === 'cta' && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-bold text-slate-900">Homepage Call-to-Action & Contact Banner</h3>
              <p className="text-xs text-slate-500">Direct phone numbers, corporate office address, and primary dispatch buttons.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">CTA Badge</label>
                <input
                  type="text"
                  value={config.ctaSection.badge}
                  onChange={(e) => updateNested('ctaSection', 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Main Headline</label>
                <input
                  type="text"
                  value={config.ctaSection.headline}
                  onChange={(e) => updateNested('ctaSection', 'headline', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Supporting Copy</label>
                <textarea
                  rows={2}
                  value={config.ctaSection.subheadline}
                  onChange={(e) => updateNested('ctaSection', 'subheadline', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Direct Phone</label>
                <input
                  type="text"
                  value={config.ctaSection.contactPhone}
                  onChange={(e) => updateNested('ctaSection', 'contactPhone', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Direct Email</label>
                <input
                  type="email"
                  value={config.ctaSection.contactEmail}
                  onChange={(e) => updateNested('ctaSection', 'contactEmail', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Headquarters Location</label>
                <input
                  type="text"
                  value={config.ctaSection.corporateLocation}
                  onChange={(e) => updateNested('ctaSection', 'corporateLocation', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 9: HOMEPAGE SEO ===================== */}
        {activeTab === 'seo' && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-bold text-slate-900">Homepage Search Engine Optimization (SEO)</h3>
              <p className="text-xs text-slate-500">Configure page title, meta description, and OpenGraph social thumbnail for the home route.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Page Title &lt;title&gt;</label>
                <input
                  type="text"
                  value={config.seo.pageTitle}
                  onChange={(e) => updateNested('seo', 'pageTitle', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={config.seo.metaDescription}
                  onChange={(e) => updateNested('seo', 'metaDescription', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Canonical URL</label>
                  <input
                    type="url"
                    value={config.seo.canonicalUrl}
                    onChange={(e) => updateNested('seo', 'canonicalUrl', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">OG Share Image URL</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('seo');
                        setIsMediaPickerOpen(true);
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Media Library
                    </button>
                  </div>
                  <input
                    type="url"
                    value={config.seo.ogImage}
                    onChange={(e) => updateNested('seo', 'ogImage', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          if (mediaPickerTarget === 'hero') {
            updateNested('hero', 'mediaUrl', url);
          } else {
            updateNested('seo', 'ogImage', url);
          }
          setIsMediaPickerOpen(false);
        }}
        initialCategory="banners"
      />
    </div>
  );
};
