import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
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
  Video,
  Plus,
  Trash2,
  Award,
  Film,
  Briefcase,
  Building2,
  ArrowUp,
  ArrowDown,
  Smartphone,
  Monitor,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { getYouTubeEmbedUrl, extractYouTubeId } from '../../utils/youtube';
import { cmsService } from '../../services/cmsService';
import {
  HomepageCmsConfig,
  CmsService as CmsServiceEntity,
  CmsProduct,
  CmsPortfolioProject,
  DecorationShowcaseVideo,
  AchievementItem,
  DynamicSectionItem,
} from '../../types/cms';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../../services/firestore/settings';
import { compressDataUrl } from '../../utils/imageOptimizer';
import { uploadMediaAsset } from '../../services/mediaUploadService';
import { resolveMediaUrl } from '../../services/firestoreMediaService';

export const AdminHomepageView: React.FC = () => {
  const { homepageConfig, updateHomepageConfig } = useFirestoreDataContext();
  const [config, setConfig] = useState<HomepageCmsConfig>(() => homepageConfig || cmsService.getHomepageConfig());
  const [activeTab, setActiveTab] = useState<
    'sections' | 'hero' | 'intro' | 'services' | 'products' | 'portfolio' | 'showcase' | 'milestones' | 'companies' | 'cta' | 'seo'
  >('sections');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingDefaultImage, setIsUploadingDefaultImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'hero' | 'seo' | string>('hero');
  const [previewVideoSrc, setPreviewVideoSrc] = useState<string>('');

  const currentHeroVideo = config.hero.videoUrl || (config.hero.mediaType === 'video' ? config.hero.mediaUrl : '');

  useEffect(() => {
    let isMounted = true;
    if (!currentHeroVideo) {
      setPreviewVideoSrc('');
      return;
    }
    if (currentHeroVideo.startsWith('firestore://media_blobs/')) {
      resolveMediaUrl(currentHeroVideo).then((url) => {
        if (isMounted) setPreviewVideoSrc(url);
      });
    } else {
      setPreviewVideoSrc(currentHeroVideo);
    }
    return () => {
      isMounted = false;
    };
  }, [currentHeroVideo]);

  // Available entities for multi-selectors
  const [allServices, setAllServices] = useState<CmsServiceEntity[]>([]);
  const [allProducts, setAllProducts] = useState<CmsProduct[]>([]);
  const [allProjects, setAllProjects] = useState<CmsPortfolioProject[]>([]);

  // Local helper for dynamic sections
  const sectionsList: DynamicSectionItem[] = config.sectionsOrder && config.sectionsOrder.length > 0
    ? config.sectionsOrder
    : DEFAULT_HOMEPAGE_SECTIONS;

  const handleToggleSection = (index: number) => {
    const nextSections = [...sectionsList];
    nextSections[index] = {
      ...nextSections[index],
      enabled: !nextSections[index].enabled,
    };
    setConfig((prev) => ({ ...prev, sectionsOrder: nextSections }));
    setIsDirty(true);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sectionsList.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const nextSections = [...sectionsList];
    const temp = nextSections[index];
    nextSections[index] = nextSections[targetIndex];
    nextSections[targetIndex] = temp;
    nextSections.forEach((sec, idx) => {
      sec.order = idx + 1;
    });
    setConfig((prev) => ({ ...prev, sectionsOrder: nextSections }));
    setIsDirty(true);
  };

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!isDirty) {
      if (homepageConfig) {
        // Ensure milestones has default achievements if empty
        const milestonesData = homepageConfig.milestones || ({} as any);
        const achievements =
          milestonesData.achievements && milestonesData.achievements.length > 0
            ? milestonesData.achievements
            : (cmsService.getHomepageConfig().milestones.achievements || []);
        setConfig({
          ...homepageConfig,
          milestones: {
            ...milestonesData,
            achievements,
            achievementsTitle: milestonesData.achievementsTitle || 'Key Verified Achievements',
            achievementsSubtitle: milestonesData.achievementsSubtitle || 'Official Company Metrics',
          },
        });
      } else {
        const loaded = cmsService.getHomepageConfig();
        setConfig(loaded);
      }
    }
    setAllServices(cmsService.getAll<CmsServiceEntity>('services'));
    setAllProducts(cmsService.getAll<CmsProduct>('products'));
    setAllProjects(cmsService.getAll<CmsPortfolioProject>('portfolio'));
  }, [homepageConfig, isDirty]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateHomepageConfig(config);
      setIsDirty(false);
      addToast('success', 'Homepage Published', 'Homepage configuration updated and live across all public pages.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not update homepage configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all homepage content and layout settings to factory corporate defaults?')) {
      const resetConf = cmsService.resetHomepageConfig();
      setConfig(resetConf);
      await updateHomepageConfig(resetConf);
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

  const handleHeroMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setUploadProgress(10);
    try {
      const isVideo =
        file.type.startsWith('video/') ||
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.webm') ||
        file.name.toLowerCase().endsWith('.ogg') ||
        file.name.toLowerCase().endsWith('.mov') ||
        file.name.toLowerCase().endsWith('.m4v');

      addToast('info', 'Uploading Media', `Uploading ${isVideo ? 'video' : 'picture'} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
      const mediaUrl = await uploadMediaAsset(file, (pct) => setUploadProgress(pct));

      // Update local state and immediately persist to Firestore
      const updatedHero = {
        ...config.hero,
        mediaUrl,
        mediaType: isVideo ? ('video' as const) : ('image' as const),
        ...(isVideo ? { videoUrl: mediaUrl } : { defaultImageUrl: mediaUrl, imageUrl: mediaUrl }),
      };

      const updatedConfig: HomepageCmsConfig = {
        ...config,
        hero: updatedHero,
      };

      setConfig(updatedConfig);
      await updateHomepageConfig(updatedConfig);
      setIsDirty(false);
      addToast('success', 'Media Uploaded & Saved', `${isVideo ? 'Hero video' : 'Picture'} saved to Firestore. Live on website!`);
    } catch (err: any) {
      console.error('Failed to process media upload:', err);
      addToast('error', 'Upload Notice', err.message || 'Could not upload media file.');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleHeroDefaultImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDefaultImage(true);
    setUploadProgress(10);
    try {
      addToast('info', 'Uploading Default Poster', `Uploading default poster image (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
      const imageUrl = await uploadMediaAsset(file, (pct) => setUploadProgress(pct));

      const updatedHero = {
        ...config.hero,
        defaultImageUrl: imageUrl,
        imageUrl: imageUrl,
      };

      const updatedConfig: HomepageCmsConfig = {
        ...config,
        hero: updatedHero,
      };

      setConfig(updatedConfig);
      await updateHomepageConfig(updatedConfig);
      setIsDirty(false);
      addToast('success', 'Default Poster Saved', 'Default image saved to Firestore. Displays while video loads.');
    } catch (err: any) {
      console.error('Failed to upload default poster:', err);
      addToast('error', 'Upload Notice', err.message || 'Could not upload default image.');
    } finally {
      setIsUploadingDefaultImage(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleQuickSaveHeroMedia = async () => {
    setIsSaving(true);
    try {
      await updateHomepageConfig(config);
      setIsDirty(false);
      addToast('success', 'Hero Media Published', 'Hero video, poster image, and headlines saved to Firestore.');
    } catch (err: any) {
      addToast('error', 'Save Notice', err.message || 'Could not save hero media settings.');
    } finally {
      setIsSaving(false);
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
          { id: 'sections', label: '0. Sections & Widgets', icon: SlidersHorizontal },
          { id: 'hero', label: '1. Hero & Media', icon: Sparkles },
          { id: 'intro', label: '2. Advantage Pillars', icon: ShieldCheck },
          { id: 'services', label: '3. Featured Services', icon: Layers },
          { id: 'products', label: '4. Featured Hardware', icon: Tag },
          { id: 'portfolio', label: '5. Portfolio & Cases', icon: Star },
          { id: 'showcase', label: '6. Event Showcase', icon: Video },
          { id: 'milestones', label: '7. Milestones & Achievements', icon: TrendingUp },
          { id: 'companies', label: '8. Corporate Partners', icon: Globe },
          { id: 'cta', label: '9. Global CTA Bar', icon: Phone },
          { id: 'seo', label: '10. Homepage SEO', icon: Globe },
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
        {/* ===================== TAB 0: SECTIONS & WIDGETS MANAGER ===================== */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Homepage Section & Widget Order Control
                </h3>
                <p className="text-xs text-slate-500">
                  Toggle visibility ON/OFF and reorder sections live across desktop and mobile devices.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>{sectionsList.filter(s => s.enabled !== false).length} Active / {sectionsList.length} Total Sections</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {sectionsList.map((sec, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === sectionsList.length - 1;
                const isEnabled = sec.enabled !== false;

                // Mapping section key to tab
                const getTabTarget = (key: string) => {
                  if (key === 'welcomeAnimation') return null;
                  if (key === 'hero') return 'hero';
                  if (key === 'about') return 'intro';
                  if (key === 'services') return 'services';
                  if (key === 'gallery' || key === 'portfolio') return 'portfolio';
                  if (key === 'decorationShowcase') return 'showcase';
                  if (key === 'milestones') return 'milestones';
                  if (key === 'trustedCompanies' || key === 'companies') return 'companies';
                  if (key === 'cta') return 'cta';
                  return null;
                };

                const tabTarget = getTabTarget(sec.sectionKey);

                return (
                  <div
                    key={sec.id || sec.sectionKey}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                      isEnabled
                        ? 'bg-slate-50/70 border-slate-200/90 shadow-2xs'
                        : 'bg-slate-100/40 border-dashed border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveSection(idx, 'up')}
                          className={`p-1 rounded-md border text-slate-600 transition-colors ${
                            isFirst
                              ? 'opacity-30 cursor-not-allowed border-slate-200 bg-white'
                              : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border-slate-200 bg-white cursor-pointer'
                          }`}
                          title="Move section up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveSection(idx, 'down')}
                          className={`p-1 rounded-md border text-slate-600 transition-colors ${
                            isLast
                              ? 'opacity-30 cursor-not-allowed border-slate-200 bg-white'
                              : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border-slate-200 bg-white cursor-pointer'
                          }`}
                          title="Move section down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{sec.name}</h4>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                            {sec.sectionKey}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isEnabled ? 'Live and visible on public website' : 'Hidden from public website'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {tabTarget && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab(tabTarget as any)}
                          className="text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                        >
                          Edit Content
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleSection(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Active (ON)</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Disabled (OFF)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                <label className="block font-bold text-blue-900 uppercase tracking-wider mb-1">Hero Media Display</label>
                <select
                  value={config.hero.mediaType}
                  onChange={(e) => updateNested('hero', 'mediaType', e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-blue-50/50 border border-blue-200 rounded-xl font-medium focus:bg-white focus:outline-none"
                >
                  <option value="video">Cinematic Video (Upload or Embed)</option>
                  <option value="image">Showcase HD Picture (Upload or URL)</option>
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
                  <label className="block font-bold text-blue-700 uppercase tracking-wider mb-1">Title Highlight (Electric Blue)</label>
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
                  rows={2}
                  value={config.hero.description}
                  onChange={(e) => updateNested('hero', 'description', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              {/* Media Upload & URL Configuration (Video or Image) */}
              <div className="md:col-span-2 p-5 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 rounded-2xl border border-blue-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                        Full-Screen Hero Media Backdrop
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Firestore Sync Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure high-performance cinematic video loop and fallback poster image displayed while buffering.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        updateNested('hero', 'mediaType', 'image');
                        setIsDirty(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        config.hero.mediaType === 'image'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Picture Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateNested('hero', 'mediaType', 'video');
                        setIsDirty(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        config.hero.mediaType === 'video'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cinematic Video Loop
                    </button>
                  </div>
                </div>

                {/* 1. Dedicated Hero Video Loop Controls */}
                <div className="p-4 bg-white rounded-xl border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                        1. Hero Video Loop URL (MP4, WebM, MOV, YouTube, Vimeo, Firebase)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Plays seamlessly in background, auto-looping without sound.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition ${
                        isUploadingMedia
                          ? 'bg-blue-400 text-white cursor-wait opacity-80'
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingMedia ? `Uploading ${uploadProgress}%...` : 'Upload Video File'}
                        <input
                          type="file"
                          disabled={isUploadingMedia}
                          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                          onChange={handleHeroMediaUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={config.hero.videoUrl || (config.hero.mediaType === 'video' ? config.hero.mediaUrl : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig((prev) => ({
                          ...prev,
                          hero: {
                            ...prev.hero,
                            videoUrl: val,
                            mediaUrl: val,
                            mediaType: 'video',
                          },
                        }));
                        setIsDirty(true);
                      }}
                      placeholder="https://.../cinematic-reel.mp4 or https://youtube.com/watch?v=... or https://vimeo.com/..."
                      className="grow px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleQuickSaveHeroMedia}
                      className="text-xs shrink-0 cursor-pointer font-semibold"
                    >
                      Save Video
                    </Button>
                  </div>
                </div>

                {/* 2. Dedicated Default Fallback Image (Poster) Controls */}
                <div className="p-4 bg-white rounded-xl border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                        2. Default Fallback Image (Poster Image - Shows while video loads)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Displays immediately on load to eliminate any black flash while the video buffers.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition ${
                        isUploadingDefaultImage
                          ? 'bg-slate-400 text-white cursor-wait opacity-80'
                          : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer'
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingDefaultImage ? `Uploading ${uploadProgress}%...` : 'Upload Default Image'}
                        <input
                          type="file"
                          disabled={isUploadingDefaultImage}
                          accept="image/*"
                          onChange={handleHeroDefaultImageUpload}
                          className="hidden"
                        />
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMediaPickerTarget('hero');
                          setIsMediaPickerOpen(true);
                        }}
                        className="text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Library
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={config.hero.defaultImageUrl || config.hero.imageUrl || (config.hero.mediaType === 'image' ? config.hero.mediaUrl : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig((prev) => ({
                          ...prev,
                          hero: {
                            ...prev.hero,
                            defaultImageUrl: val,
                            imageUrl: val,
                            ...(prev.hero.mediaType === 'image' ? { mediaUrl: val } : {}),
                          },
                        }));
                        setIsDirty(true);
                      }}
                      placeholder="https://images.unsplash.com/... or /uploads/... HD poster image URL"
                      className="grow px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleQuickSaveHeroMedia}
                      className="text-xs shrink-0 cursor-pointer font-semibold"
                    >
                      Save Poster
                    </Button>
                  </div>
                </div>

                {/* 3. Live Active Preview Box with Status Badge */}
                {(config.hero.videoUrl || config.hero.mediaUrl || config.hero.defaultImageUrl) && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Active Live Preview ({config.hero.mediaType === 'video' ? 'Cinematic Video Loop' : 'Picture Backdrop'}):
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Autoplay & Loop Enabled
                      </span>
                    </div>

                    <div className="relative w-full max-w-xl h-52 rounded-xl overflow-hidden border border-blue-200 bg-slate-950 shadow-md">
                      {/* Underneath Poster Image */}
                      <img
                        src={
                          config.hero.defaultImageUrl ||
                          config.hero.imageUrl ||
                          'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85'
                        }
                        alt="Hero Poster"
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />

                      {/* Video Player on Top if Video Mode */}
                      {config.hero.mediaType === 'video' && (config.hero.videoUrl || config.hero.mediaUrl) ? (
                        extractYouTubeId(config.hero.videoUrl || config.hero.mediaUrl) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(config.hero.videoUrl || config.hero.mediaUrl, { autoplay: true, mute: true, loop: true, controls: false }) || ''}
                            title="Hero Video Preview"
                            className="w-full h-full object-cover pointer-events-none relative z-1"
                          />
                        ) : (
                          <video
                            src={previewVideoSrc || config.hero.videoUrl || config.hero.mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover relative z-1"
                          />
                        )
                      ) : null}

                      {/* Left Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none z-2" />

                      {/* Mock Headline on Top */}
                      <div className="absolute bottom-3 left-4 text-white z-3">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{config.hero.badgeText || 'Mahdev Group'}</p>
                        <p className="text-sm font-bold leading-tight">{config.hero.titleLine1 || 'Creating Moments'}</p>
                        <p className="text-xs font-semibold text-blue-300">{config.hero.titleHighlight || 'Capturing Memories'}</p>
                      </div>

                      <div className="absolute top-2 right-2 z-4 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            updateNested('hero', 'videoUrl', '');
                            updateNested('hero', 'mediaUrl', '');
                            setIsDirty(true);
                          }}
                          className="bg-black/75 hover:bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer"
                          title="Remove media"
                        >
                          Clear Video
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

        {/* ===================== TAB 6: EVENT & DECORATION SHOWCASE ===================== */}
        {activeTab === 'showcase' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Cinematic Event & Decoration Showcase
                </h3>
                <p className="text-xs text-slate-500">
                  Manage the video reel cards, categories, video links, thumbnails, venue types, and highlights.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.decorationShowcase?.enabled !== false}
                  onChange={(e) => {
                    const current = config.decorationShowcase || {
                      badge: 'SWS Precision Event Engineering',
                      title: 'Cinematic Event & Decoration Showcase',
                      subtitle: 'Experience the craftsmanship, lighting architectures, kinetic florals, and multi-camera live production engineered by Mahdev Event Management (SWS).',
                      enabled: true,
                      videos: [],
                    };
                    setConfig((prev) => ({
                      ...prev,
                      decorationShowcase: { ...current, enabled: e.target.checked },
                    }));
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Show Event Showcase Reel</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Badge</label>
                <input
                  type="text"
                  value={config.decorationShowcase?.badge || 'SWS Precision Event Engineering'}
                  onChange={(e) => {
                    const current = config.decorationShowcase || {
                      badge: '',
                      title: 'Cinematic Event & Decoration Showcase',
                      subtitle: '',
                      enabled: true,
                      videos: [],
                    };
                    setConfig((prev) => ({
                      ...prev,
                      decorationShowcase: { ...current, badge: e.target.value },
                    }));
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Section Title</label>
                <input
                  type="text"
                  value={config.decorationShowcase?.title || 'Cinematic Event & Decoration Showcase'}
                  onChange={(e) => {
                    const current = config.decorationShowcase || {
                      badge: 'SWS Precision Event Engineering',
                      title: '',
                      subtitle: '',
                      enabled: true,
                      videos: [],
                    };
                    setConfig((prev) => ({
                      ...prev,
                      decorationShowcase: { ...current, title: e.target.value },
                    }));
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  value={config.decorationShowcase?.subtitle || ''}
                  onChange={(e) => {
                    const current = config.decorationShowcase || {
                      badge: 'SWS Precision Event Engineering',
                      title: 'Cinematic Event & Decoration Showcase',
                      subtitle: '',
                      enabled: true,
                      videos: [],
                    };
                    setConfig((prev) => ({
                      ...prev,
                      decorationShowcase: { ...current, subtitle: e.target.value },
                    }));
                    setIsDirty(true);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Video Cards Management */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Film className="w-4 h-4 text-blue-600" />
                    Showcase Videos & Deliverables
                  </h4>
                  <p className="text-xs text-slate-500">
                    Add or modify video reels displayed in the spotlight player and interactive selector.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5 text-blue-600" />}
                  onClick={() => {
                    const current = config.decorationShowcase?.videos || [];
                    const newVideo: DecorationShowcaseVideo = {
                      id: `decor-vid-${Date.now()}`,
                      title: 'New Luxury Event Production',
                      category: 'Weddings',
                      location: 'Colombo, Sri Lanka',
                      duration: '0:45',
                      videoUrl: 'firestore://media_blobs/vid_corporate_hero_v1',
                      thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
                      description: 'Custom engineered stagecraft and lighting production.',
                      venueType: '5-Star Luxury Ballroom',
                      divisionName: 'SWS Event Management',
                      highlights: ['Bespoke Decor', 'Lighting Staging'],
                    };
                    setConfig((prev) => ({
                      ...prev,
                      decorationShowcase: {
                        ...(prev.decorationShowcase || {
                          badge: 'SWS Precision Event Engineering',
                          title: 'Cinematic Event & Decoration Showcase',
                          subtitle: '',
                          enabled: true,
                        }),
                        videos: [newVideo, ...current],
                      },
                    }));
                    setIsDirty(true);
                  }}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Add Video
                </Button>
              </div>

              <div className="space-y-4">
                {(config.decorationShowcase?.videos || []).map((video, idx) => (
                  <div
                    key={video.id || idx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{video.title || `Video #${idx + 1}`}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (config.decorationShowcase?.videos || []).filter((_, i) => i !== idx);
                          setConfig((prev) => ({
                            ...prev,
                            decorationShowcase: {
                              ...(prev.decorationShowcase as any),
                              videos: updated,
                            },
                          }));
                          setIsDirty(true);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Remove Video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Title</label>
                        <input
                          type="text"
                          value={video.title}
                          onChange={(e) => {
                            const updated = [...(config.decorationShowcase?.videos || [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setConfig((prev) => ({
                              ...prev,
                              decorationShowcase: { ...(prev.decorationShowcase as any), videos: updated },
                            }));
                            setIsDirty(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Category</label>
                        <select
                          value={video.category}
                          onChange={(e) => {
                            const updated = [...(config.decorationShowcase?.videos || [])];
                            updated[idx] = { ...updated[idx], category: e.target.value };
                            setConfig((prev) => ({
                              ...prev,
                              decorationShowcase: { ...(prev.decorationShowcase as any), videos: updated },
                            }));
                            setIsDirty(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Weddings">Weddings</option>
                          <option value="Floral & Canopy">Floral & Canopy</option>
                          <option value="Lighting & Truss">Lighting & Truss</option>
                          <option value="Corporate Galas">Corporate Galas</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Location</label>
                        <input
                          type="text"
                          value={video.location}
                          onChange={(e) => {
                            const updated = [...(config.decorationShowcase?.videos || [])];
                            updated[idx] = { ...updated[idx], location: e.target.value };
                            setConfig((prev) => ({
                              ...prev,
                              decorationShowcase: { ...(prev.decorationShowcase as any), videos: updated },
                            }));
                            setIsDirty(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Video MP4 URL
                        </label>
                        <input
                          type="url"
                          value={video.videoUrl}
                          onChange={(e) => {
                            const updated = [...(config.decorationShowcase?.videos || [])];
                            updated[idx] = { ...updated[idx], videoUrl: e.target.value };
                            setConfig((prev) => ({
                              ...prev,
                              decorationShowcase: { ...(prev.decorationShowcase as any), videos: updated },
                            }));
                            setIsDirty(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Duration</label>
                        <input
                          type="text"
                          value={video.duration}
                          onChange={(e) => {
                            const updated = [...(config.decorationShowcase?.videos || [])];
                            updated[idx] = { ...updated[idx], duration: e.target.value };
                            setConfig((prev) => ({
                              ...prev,
                              decorationShowcase: { ...(prev.decorationShowcase as any), videos: updated },
                            }));
                            setIsDirty(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          placeholder="0:45"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Thumbnail Image URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={video.thumbnailUrl}
                            onChange={(e) => {
                              const updated = [...(config.decorationShowcase?.videos || [])];
                              updated[idx] = { ...updated[idx], thumbnailUrl: e.target.value };
                              setConfig((prev) => ({
                                ...prev,
                                decorationShowcase: { ...(prev.decorationShowcase as any), videos: updated },
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Venue Type</label>
                        <input
                          type="text"
                          value={video.venueType || ''}
                          onChange={(e) => {
                            const updated = [...(config.decorationShowcase?.videos || [])];
                            updated[idx] = { ...updated[idx], venueType: e.target.value };
                            setConfig((prev) => ({
                              ...prev,
                              decorationShowcase: { ...(prev.decorationShowcase as any), videos: updated },
                            }));
                            setIsDirty(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          placeholder="5-Star Luxury Ballroom"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={video.description}
                          onChange={(e) => {
                            const updated = [...(config.decorationShowcase?.videos || [])];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setConfig((prev) => ({
                              ...prev,
                              decorationShowcase: { ...(prev.decorationShowcase as any), videos: updated },
                            }));
                            setIsDirty(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 7: MILESTONES & KEY ACHIEVEMENTS ===================== */}
        {activeTab === 'milestones' && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Milestones of Excellence & Key Verified Achievements
                </h3>
                <p className="text-xs text-slate-500">
                  Control the timeline headlines and customize the Key Verified Achievements / By the Numbers grid cards.
                </p>
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
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Timeline Badge</label>
                <input
                  type="text"
                  value={config.milestones.badge}
                  onChange={(e) => updateNested('milestones', 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Timeline Title</label>
                <input
                  type="text"
                  value={config.milestones.title}
                  onChange={(e) => updateNested('milestones', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Timeline Subtitle</label>
                <textarea
                  rows={2}
                  value={config.milestones.subtitle}
                  onChange={(e) => updateNested('milestones', 'subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* KEY VERIFIED ACHIEVEMENTS CUSTOMIZATION */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Key Verified Achievements Cards (Editable)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Edit the metrics, labels, descriptions, and badge indicators shown below the trajectory timeline.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5 text-blue-600" />}
                  onClick={() => {
                    const current = config.milestones.achievements || [];
                    const newAchievement: AchievementItem = {
                      id: `achieve-${Date.now()}`,
                      metric: '100+',
                      label: 'New Milestone Metric',
                      description: 'Certified deliverable benchmark achieved by Mahdev Group.',
                      badge: 'Verified Benchmark',
                      iconName: 'Sparkles',
                      highlight: false,
                    };
                    updateNested('milestones', 'achievements', [...current, newAchievement]);
                  }}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Add Metric Card
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Achievements Heading Title
                  </label>
                  <input
                    type="text"
                    value={config.milestones.achievementsTitle || 'Key Verified Achievements'}
                    onChange={(e) => updateNested('milestones', 'achievementsTitle', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Achievements Subtitle
                  </label>
                  <input
                    type="text"
                    value={config.milestones.achievementsSubtitle || 'Official Company Metrics'}
                    onChange={(e) => updateNested('milestones', 'achievementsSubtitle', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(config.milestones.achievements || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                      item.highlight ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        Card #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (config.milestones.achievements || []).filter((_, i) => i !== idx);
                          updateNested('milestones', 'achievements', updated);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Remove Metric"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Metric (e.g. 1,800+)
                        </label>
                        <input
                          type="text"
                          value={item.metric}
                          onChange={(e) => {
                            const updated = [...(config.milestones.achievements || [])];
                            updated[idx] = { ...updated[idx], metric: e.target.value };
                            updateNested('milestones', 'achievements', updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Label</label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const updated = [...(config.milestones.achievements || [])];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            updateNested('milestones', 'achievements', updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Badge Tag
                        </label>
                        <input
                          type="text"
                          value={item.badge}
                          onChange={(e) => {
                            const updated = [...(config.milestones.achievements || [])];
                            updated[idx] = { ...updated[idx], badge: e.target.value };
                            updateNested('milestones', 'achievements', updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Icon</label>
                        <select
                          value={item.iconName || 'Sparkles'}
                          onChange={(e) => {
                            const updated = [...(config.milestones.achievements || [])];
                            updated[idx] = { ...updated[idx], iconName: e.target.value };
                            updateNested('milestones', 'achievements', updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Briefcase">Briefcase</option>
                          <option value="CheckCircle2">CheckCircle2</option>
                          <option value="TrendingUp">TrendingUp</option>
                          <option value="Layers">Layers</option>
                          <option value="MapPin">MapPin</option>
                          <option value="Sparkles">Sparkles</option>
                          <option value="Award">Award</option>
                          <option value="ShieldCheck">ShieldCheck</option>
                          <option value="Building2">Building2</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...(config.milestones.achievements || [])];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            updateNested('milestones', 'achievements', updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="col-span-2 flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!item.highlight}
                            onChange={(e) => {
                              const updated = [...(config.milestones.achievements || [])];
                              updated[idx] = { ...updated[idx], highlight: e.target.checked };
                              updateNested('milestones', 'achievements', updated);
                            }}
                            className="w-3.5 h-3.5 rounded text-blue-600"
                          />
                          Highlight card with blue emphasis border
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
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
