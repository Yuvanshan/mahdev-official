import React, { useState, useEffect } from 'react';
import {
  FileText,
  Building2,
  ShieldCheck,
  Save,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Globe,
  Tag,
  Monitor,
  Tablet,
  Smartphone,
  X,
  ExternalLink,
  ChevronRight,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import {
  AboutUsContent,
  LegalDocument,
  LegalSection,
  CoreValueItem,
  AboutDivisionItem,
  TimelineMilestoneItem,
  CompanyLocationItem,
} from '../../types/websiteContent';
import {
  websiteContentService,
  DEFAULT_ABOUT_US_CONTENT,
  DEFAULT_TERMS_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
} from '../../services/firestore/websiteContent';

interface AdminWebsiteContentViewProps {
  initialTab?: 'about' | 'terms' | 'privacy';
  onNavigate?: (route: string) => void;
}

export const AdminWebsiteContentView: React.FC<AdminWebsiteContentViewProps> = ({
  initialTab = 'about',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'terms' | 'privacy'>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // About Us State
  const [aboutContent, setAboutContent] = useState<AboutUsContent>(DEFAULT_ABOUT_US_CONTENT);
  const [aboutSubTab, setAboutSubTab] = useState<
    'hero' | 'intro' | 'vision_mission' | 'values' | 'divisions' | 'timeline' | 'locations' | 'cta'
  >('hero');

  // Terms State
  const [termsDoc, setTermsDoc] = useState<LegalDocument>(DEFAULT_TERMS_CONTENT);
  const [termsHasChanges, setTermsHasChanges] = useState(false);

  // Privacy State
  const [privacyDoc, setPrivacyDoc] = useState<LegalDocument>(DEFAULT_PRIVACY_CONTENT);
  const [privacyHasChanges, setPrivacyHasChanges] = useState(false);

  // Live Multi-Device Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'about' | 'terms' | 'privacy'>('about');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load content from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [about, terms, privacy] = await Promise.all([
          websiteContentService.getAboutUsContent(),
          websiteContentService.getLegalDocument('termsAndConditions', true),
          websiteContentService.getLegalDocument('privacyPolicy', true),
        ]);
        if (isMounted) {
          setAboutContent(about);
          setTermsDoc(terms);
          setPrivacyDoc(privacy);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading website content:', err);
        if (isMounted) {
          addToast('Failed to load content from Firestore. Using baseline data.', 'error');
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save About Us Content
  const handleSaveAbout = async () => {
    setIsSaving(true);
    try {
      await websiteContentService.saveAboutUsContent(aboutContent);
      addToast('About Us content saved successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to save About Us:', err);
      addToast(err?.message || 'Failed to save About Us content', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Legal Draft
  const handleSaveLegalDraft = async (type: 'terms' | 'privacy') => {
    setIsSaving(true);
    const docId = type === 'terms' ? 'termsAndConditions' : 'privacyPolicy';
    const currentDoc = type === 'terms' ? termsDoc : privacyDoc;
    try {
      await websiteContentService.saveLegalDraft(docId, currentDoc.sections);
      if (type === 'terms') setTermsHasChanges(false);
      else setPrivacyHasChanges(false);
      addToast(`${currentDoc.title} draft saved successfully.`, 'success');
    } catch (err: any) {
      console.error(`Failed to save draft for ${type}:`, err);
      addToast(err?.message || 'Failed to save draft', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Legal Document
  const handlePublishLegal = async (type: 'terms' | 'privacy') => {
    setIsSaving(true);
    const docId = type === 'terms' ? 'termsAndConditions' : 'privacyPolicy';
    const currentDoc = type === 'terms' ? termsDoc : privacyDoc;
    try {
      const published = await websiteContentService.publishLegalDocument(
        docId,
        currentDoc.sections,
        undefined
      );
      if (type === 'terms') {
        setTermsDoc(published);
        setTermsHasChanges(false);
      } else {
        setPrivacyDoc(published);
        setPrivacyHasChanges(false);
      }
      addToast(`${published.title} published to live website (v${published.version})!`, 'success');
    } catch (err: any) {
      console.error(`Failed to publish ${type}:`, err);
      addToast(err?.message || 'Failed to publish document', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Preview
  const handleOpenPreview = (type: 'about' | 'terms' | 'privacy') => {
    setPreviewType(type);
    setPreviewModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notifications */}
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="electric" size="sm">
              Website Content CMS
            </Badge>
            <span className="text-xs font-mono text-slate-500">Live Firestore Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Company & Legal Information Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Manage public production content for About Us, Terms & Conditions, and Privacy Policy. All changes are stored directly in Firestore with instant preview and version control.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenPreview(activeTab)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Live Preview
          </Button>

          {activeTab === 'about' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAbout}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveLegalDraft(activeTab)}
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePublishLegal(activeTab)}
                isLoading={isSaving}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Publish Live
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Category Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'about'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>About Us Page</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'terms'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms & Conditions</span>
          {termsDoc.status === 'published' ? (
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-mono font-bold">
              v{termsDoc.version}
            </span>
          ) : (
            <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-mono font-bold">
              Draft
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'privacy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
          {privacyDoc.status === 'published' ? (
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-mono font-bold">
              v{privacyDoc.version}
            </span>
          ) : (
            <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-mono font-bold">
              Draft
            </span>
          )}
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-100 rounded w-full"></div>
          <div className="h-32 bg-slate-100 rounded w-full"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: ABOUT US */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* About Us Sub Navigation */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl">
                {[
                  { id: 'hero', label: 'Hero Section' },
                  { id: 'intro', label: 'Who We Are (Intro)' },
                  { id: 'vision_mission', label: 'Vision & Mission' },
                  { id: 'values', label: 'Core Values (4)' },
                  { id: 'divisions', label: 'Our Divisions (5)' },
                  { id: 'timeline', label: 'Company Journey' },
                  { id: 'locations', label: 'Our Locations (2)' },
                  { id: 'cta', label: 'Call to Action' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setAboutSubTab(sub.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      aboutSubTab === sub.id
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab: Hero */}
              {aboutSubTab === 'hero' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Hero Section</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Hero Title
                      </label>
                      <input
                        type="text"
                        value={aboutContent.hero.title}
                        onChange={(e) =>
                          setAboutContent({
                            ...aboutContent,
                            hero: { ...aboutContent.hero, title: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={aboutContent.hero.subtitle}
                        onChange={(e) =>
                          setAboutContent({
                            ...aboutContent,
                            hero: { ...aboutContent.hero, subtitle: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Short Introductory Text
                    </label>
                    <textarea
                      rows={3}
                      value={aboutContent.hero.description}
                      onChange={(e) =>
                        setAboutContent({
                          ...aboutContent,
                          hero: { ...aboutContent.hero, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={aboutContent.hero.buttonText}
                        onChange={(e) =>
                          setAboutContent({
                            ...aboutContent,
                            hero: { ...aboutContent.hero, buttonText: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Button Link Route
                      </label>
                      <input
                        type="text"
                        value={aboutContent.hero.buttonRoute}
                        onChange={(e) =>
                          setAboutContent({
                            ...aboutContent,
                            hero: { ...aboutContent.hero, buttonRoute: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: Intro */}
              {aboutSubTab === 'intro' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                    Company Introduction ("Who We Are")
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={aboutContent.companyIntro.heading}
                      onChange={(e) =>
                        setAboutContent({
                          ...aboutContent,
                          companyIntro: { ...aboutContent.companyIntro, heading: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Full Description (Paragraphs)
                    </label>
                    <textarea
                      rows={6}
                      value={aboutContent.companyIntro.description}
                      onChange={(e) =>
                        setAboutContent({
                          ...aboutContent,
                          companyIntro: { ...aboutContent.companyIntro, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Sub-tab: Vision & Mission */}
              {aboutSubTab === 'vision_mission' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vision */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 border-b pb-2">Our Vision</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Vision Heading
                      </label>
                      <input
                        type="text"
                        value={aboutContent.vision.heading}
                        onChange={(e) =>
                          setAboutContent({
                            ...aboutContent,
                            vision: { ...aboutContent.vision, heading: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Vision Statement
                      </label>
                      <textarea
                        rows={4}
                        value={aboutContent.vision.description}
                        onChange={(e) =>
                          setAboutContent({
                            ...aboutContent,
                            vision: { ...aboutContent.vision, description: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Mission */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 border-b pb-2">Our Mission</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Mission Heading
                      </label>
                      <input
                        type="text"
                        value={aboutContent.mission.heading}
                        onChange={(e) =>
                          setAboutContent({
                            ...aboutContent,
                            mission: { ...aboutContent.mission, heading: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Mission Statement
                      </label>
                      <textarea
                        rows={4}
                        value={aboutContent.mission.description}
                        onChange={(e) =>
                          setAboutContent({
                            ...aboutContent,
                            mission: { ...aboutContent.mission, description: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: Values */}
              {aboutSubTab === 'values' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-slate-900">Core Values</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newId = `val-${Date.now()}`;
                        const newValues: CoreValueItem[] = [
                          ...aboutContent.values,
                          {
                            id: newId,
                            title: 'New Value',
                            description: 'Value description here.',
                            order: aboutContent.values.length + 1,
                            enabled: true,
                          },
                        ];
                        setAboutContent({ ...aboutContent, values: newValues });
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Value
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aboutContent.values.map((val, idx) => (
                      <div
                        key={val.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Value #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newValues = aboutContent.values.map((v) =>
                                  v.id === val.id ? { ...v, enabled: !v.enabled } : v
                                );
                                setAboutContent({ ...aboutContent, values: newValues });
                              }}
                              className={`text-xs px-2 py-0.5 rounded font-bold cursor-pointer ${
                                val.enabled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {val.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const arr = [...aboutContent.values];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx - 1];
                                  arr[idx - 1] = temp;
                                  setAboutContent({ ...aboutContent, values: arr });
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < aboutContent.values.length - 1) {
                                  const arr = [...aboutContent.values];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx + 1];
                                  arr[idx + 1] = temp;
                                  setAboutContent({ ...aboutContent, values: arr });
                                }
                              }}
                              disabled={idx === aboutContent.values.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newValues = aboutContent.values.filter((v) => v.id !== val.id);
                                setAboutContent({ ...aboutContent, values: newValues });
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={val.title}
                            onChange={(e) => {
                              const newValues = aboutContent.values.map((v) =>
                                v.id === val.id ? { ...v, title: e.target.value } : v
                              );
                              setAboutContent({ ...aboutContent, values: newValues });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={val.description}
                            onChange={(e) => {
                              const newValues = aboutContent.values.map((v) =>
                                v.id === val.id ? { ...v, description: e.target.value } : v
                              );
                              setAboutContent({ ...aboutContent, values: newValues });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab: Divisions */}
              {aboutSubTab === 'divisions' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                    Our Divisions Display on About Page
                  </h3>

                  <div className="space-y-4">
                    {aboutContent.divisions.map((div, idx) => (
                      <div
                        key={div.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded font-mono">
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{div.name}</span>
                            <span className="text-xs text-slate-500 font-mono">({div.route})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newDivs = aboutContent.divisions.map((d) =>
                                  d.id === div.id ? { ...d, enabled: !d.enabled } : d
                                );
                                setAboutContent({ ...aboutContent, divisions: newDivs });
                              }}
                              className={`text-xs px-2.5 py-1 rounded font-bold cursor-pointer ${
                                div.enabled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {div.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const arr = [...aboutContent.divisions];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx - 1];
                                  arr[idx - 1] = temp;
                                  setAboutContent({ ...aboutContent, divisions: arr });
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < aboutContent.divisions.length - 1) {
                                  const arr = [...aboutContent.divisions];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx + 1];
                                  arr[idx + 1] = temp;
                                  setAboutContent({ ...aboutContent, divisions: arr });
                                }
                              }}
                              disabled={idx === aboutContent.divisions.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Division Display Name
                            </label>
                            <input
                              type="text"
                              value={div.name}
                              onChange={(e) => {
                                const newDivs = aboutContent.divisions.map((d) =>
                                  d.id === div.id ? { ...d, name: e.target.value } : d
                                );
                                setAboutContent({ ...aboutContent, divisions: newDivs });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Route Path
                            </label>
                            <input
                              type="text"
                              value={div.route}
                              onChange={(e) => {
                                const newDivs = aboutContent.divisions.map((d) =>
                                  d.id === div.id ? { ...d, route: e.target.value } : d
                                );
                                setAboutContent({ ...aboutContent, divisions: newDivs });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={div.description}
                            onChange={(e) => {
                              const newDivs = aboutContent.divisions.map((d) =>
                                d.id === div.id ? { ...d, description: e.target.value } : d
                              );
                              setAboutContent({ ...aboutContent, divisions: newDivs });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Highlighted Services (Comma-separated)
                          </label>
                          <input
                            type="text"
                            value={div.services.join(', ')}
                            onChange={(e) => {
                              const services = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                              const newDivs = aboutContent.divisions.map((d) =>
                                d.id === div.id ? { ...d, services } : d
                              );
                              setAboutContent({ ...aboutContent, divisions: newDivs });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab: Timeline */}
              {aboutSubTab === 'timeline' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-slate-900">Company Journey / Timeline</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newId = `time-${Date.now()}`;
                        const newTimeline: TimelineMilestoneItem[] = [
                          ...aboutContent.timeline,
                          {
                            id: newId,
                            year: `${new Date().getFullYear()}`,
                            title: 'New Milestone',
                            description: 'Milestone description.',
                            order: aboutContent.timeline.length + 1,
                            enabled: true,
                          },
                        ];
                        setAboutContent({ ...aboutContent, timeline: newTimeline });
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Milestone
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {aboutContent.timeline.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded font-mono">
                              {item.year}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{item.title}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newT = aboutContent.timeline.map((t) =>
                                  t.id === item.id ? { ...t, enabled: !t.enabled } : t
                                );
                                setAboutContent({ ...aboutContent, timeline: newT });
                              }}
                              className={`text-xs px-2 py-0.5 rounded font-bold cursor-pointer ${
                                item.enabled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {item.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const arr = [...aboutContent.timeline];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx - 1];
                                  arr[idx - 1] = temp;
                                  setAboutContent({ ...aboutContent, timeline: arr });
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < aboutContent.timeline.length - 1) {
                                  const arr = [...aboutContent.timeline];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx + 1];
                                  arr[idx + 1] = temp;
                                  setAboutContent({ ...aboutContent, timeline: arr });
                                }
                              }}
                              disabled={idx === aboutContent.timeline.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newT = aboutContent.timeline.filter((t) => t.id !== item.id);
                                setAboutContent({ ...aboutContent, timeline: newT });
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-1">
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Year
                            </label>
                            <input
                              type="text"
                              value={item.year}
                              onChange={(e) => {
                                const newT = aboutContent.timeline.map((t) =>
                                  t.id === item.id ? { ...t, year: e.target.value } : t
                                );
                                setAboutContent({ ...aboutContent, timeline: newT });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Milestone Title
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const newT = aboutContent.timeline.map((t) =>
                                  t.id === item.id ? { ...t, title: e.target.value } : t
                                );
                                setAboutContent({ ...aboutContent, timeline: newT });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(e) => {
                              const newT = aboutContent.timeline.map((t) =>
                                t.id === item.id ? { ...t, description: e.target.value } : t
                              );
                              setAboutContent({ ...aboutContent, timeline: newT });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab: Locations */}
              {aboutSubTab === 'locations' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-slate-900">Our Locations</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newId = `loc-${Date.now()}`;
                        const newLocs: CompanyLocationItem[] = [
                          ...aboutContent.locations,
                          {
                            id: newId,
                            city: 'New Branch',
                            address: 'Branch Address, Sri Lanka',
                            phone: '075 092 8078',
                            email: 'info.mahdev.lk@gmail.com',
                            order: aboutContent.locations.length + 1,
                            enabled: true,
                          },
                        ];
                        setAboutContent({ ...aboutContent, locations: newLocs });
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Location
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aboutContent.locations.map((loc, idx) => (
                      <div
                        key={loc.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded font-mono">
                            {loc.city} Branch
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newL = aboutContent.locations.map((l) =>
                                  l.id === loc.id ? { ...l, enabled: !l.enabled } : l
                                );
                                setAboutContent({ ...aboutContent, locations: newL });
                              }}
                              className={`text-xs px-2 py-0.5 rounded font-bold cursor-pointer ${
                                loc.enabled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {loc.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newL = aboutContent.locations.filter((l) => l.id !== loc.id);
                                setAboutContent({ ...aboutContent, locations: newL });
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            City / District
                          </label>
                          <input
                            type="text"
                            value={loc.city}
                            onChange={(e) => {
                              const newL = aboutContent.locations.map((l) =>
                                l.id === loc.id ? { ...l, city: e.target.value } : l
                              );
                              setAboutContent({ ...aboutContent, locations: newL });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Physical Address
                          </label>
                          <textarea
                            rows={2}
                            value={loc.address}
                            onChange={(e) => {
                              const newL = aboutContent.locations.map((l) =>
                                l.id === loc.id ? { ...l, address: e.target.value } : l
                              );
                              setAboutContent({ ...aboutContent, locations: newL });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Phone
                            </label>
                            <input
                              type="text"
                              value={loc.phone}
                              onChange={(e) => {
                                const newL = aboutContent.locations.map((l) =>
                                  l.id === loc.id ? { ...l, phone: e.target.value } : l
                                );
                                setAboutContent({ ...aboutContent, locations: newL });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Email
                            </label>
                            <input
                              type="text"
                              value={loc.email}
                              onChange={(e) => {
                                const newL = aboutContent.locations.map((l) =>
                                  l.id === loc.id ? { ...l, email: e.target.value } : l
                                );
                                setAboutContent({ ...aboutContent, locations: newL });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Google Maps Search URL
                          </label>
                          <input
                            type="text"
                            value={loc.mapUrl || ''}
                            onChange={(e) => {
                              const newL = aboutContent.locations.map((l) =>
                                l.id === loc.id ? { ...l, mapUrl: e.target.value } : l
                              );
                              setAboutContent({ ...aboutContent, locations: newL });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                            placeholder="https://maps.google.com/?q=..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab: CTA */}
              {aboutSubTab === 'cta' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                    About Page Call to Action (CTA)
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      CTA Title
                    </label>
                    <input
                      type="text"
                      value={aboutContent.cta.title}
                      onChange={(e) =>
                        setAboutContent({
                          ...aboutContent,
                          cta: { ...aboutContent.cta, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      CTA Description
                    </label>
                    <textarea
                      rows={3}
                      value={aboutContent.cta.description}
                      onChange={(e) =>
                        setAboutContent({
                          ...aboutContent,
                          cta: { ...aboutContent.cta, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                      <span className="text-xs font-bold text-slate-800">Primary Button</span>
                      <div>
                        <label className="block text-[11px] text-slate-500">Button Text</label>
                        <input
                          type="text"
                          value={aboutContent.cta.primaryButtonText}
                          onChange={(e) =>
                            setAboutContent({
                              ...aboutContent,
                              cta: { ...aboutContent.cta, primaryButtonText: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500">Button Route</label>
                        <input
                          type="text"
                          value={aboutContent.cta.primaryButtonRoute}
                          onChange={(e) =>
                            setAboutContent({
                              ...aboutContent,
                              cta: { ...aboutContent.cta, primaryButtonRoute: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                      <span className="text-xs font-bold text-slate-800">Secondary Button</span>
                      <div>
                        <label className="block text-[11px] text-slate-500">Button Text</label>
                        <input
                          type="text"
                          value={aboutContent.cta.secondaryButtonText}
                          onChange={(e) =>
                            setAboutContent({
                              ...aboutContent,
                              cta: { ...aboutContent.cta, secondaryButtonText: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500">Button Route</label>
                        <input
                          type="text"
                          value={aboutContent.cta.secondaryButtonRoute}
                          onChange={(e) =>
                            setAboutContent({
                              ...aboutContent,
                              cta: { ...aboutContent.cta, secondaryButtonRoute: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 & 3: LEGAL PAGES (Terms or Privacy) */}
          {(activeTab === 'terms' || activeTab === 'privacy') && (
            <div className="space-y-6">
              {(() => {
                const isTerms = activeTab === 'terms';
                const doc = isTerms ? termsDoc : privacyDoc;
                const setDocState = isTerms ? setTermsDoc : setPrivacyDoc;
                const setHasChanges = isTerms ? setTermsHasChanges : setPrivacyHasChanges;

                return (
                  <>
                    {/* Document Header & Metadata Controls */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{doc.title}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                              doc.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Status: {doc.status.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            Version: {doc.version}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Last Updated: <strong className="text-slate-800">{doc.lastUpdated}</strong>
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newId = `sec-${Date.now()}`;
                              const newSections: LegalSection[] = [
                                ...doc.sections,
                                {
                                  id: newId,
                                  number: doc.sections.length + 1,
                                  heading: 'New Section Heading',
                                  content: ['Add section paragraph details here.'],
                                  order: doc.sections.length + 1,
                                },
                              ];
                              setDocState({ ...doc, sections: newSections });
                              setHasChanges(true);
                            }}
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                          >
                            Add Section
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Document Title
                          </label>
                          <input
                            type="text"
                            value={doc.title}
                            onChange={(e) => {
                              setDocState({ ...doc, title: e.target.value });
                              setHasChanges(true);
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-semibold bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Sub-heading / Descriptor
                          </label>
                          <input
                            type="text"
                            value={doc.subtitle}
                            onChange={(e) => {
                              setDocState({ ...doc, subtitle: e.target.value });
                              setHasChanges(true);
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section Blocks */}
                    <div className="space-y-4">
                      {doc.sections.map((section, idx) => (
                        <div
                          key={section.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Section {idx + 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (idx > 0) {
                                    const arr = [...doc.sections];
                                    const temp = arr[idx];
                                    arr[idx] = arr[idx - 1];
                                    arr[idx - 1] = temp;
                                    setDocState({ ...doc, sections: arr });
                                    setHasChanges(true);
                                  }
                                }}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (idx < doc.sections.length - 1) {
                                    const arr = [...doc.sections];
                                    const temp = arr[idx];
                                    arr[idx] = arr[idx + 1];
                                    arr[idx + 1] = temp;
                                    setDocState({ ...doc, sections: arr });
                                    setHasChanges(true);
                                  }
                                }}
                                disabled={idx === doc.sections.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const arr = doc.sections.filter((s) => s.id !== section.id);
                                  setDocState({ ...doc, sections: arr });
                                  setHasChanges(true);
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer ml-2"
                                title="Delete Section"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Section Heading
                            </label>
                            <input
                              type="text"
                              value={section.heading}
                              onChange={(e) => {
                                const arr = doc.sections.map((s) =>
                                  s.id === section.id ? { ...s, heading: e.target.value } : s
                                );
                                setDocState({ ...doc, sections: arr });
                                setHasChanges(true);
                              }}
                              className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Paragraphs & Bullet Content (Use separate paragraphs; lines starting with • render as styled list items)
                            </label>
                            <textarea
                              rows={4}
                              value={section.content.join('\n\n')}
                              onChange={(e) => {
                                const content = e.target.value
                                  .split('\n\n')
                                  .map((p) => p.trim())
                                  .filter(Boolean);
                                const arr = doc.sections.map((s) =>
                                  s.id === section.id ? { ...s, content } : s
                                );
                                setDocState({ ...doc, sections: arr });
                                setHasChanges(true);
                              }}
                              className="w-full px-3 py-2 text-xs leading-relaxed border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* MULTI-DEVICE LIVE PREVIEW MODAL */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in">
          {/* Modal Header Bar */}
          <div className="w-full max-w-5xl bg-slate-900 text-white rounded-t-2xl px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Live Preview:
              </span>
              <span className="text-sm font-semibold">
                {previewType === 'about'
                  ? 'About MAHDEV Pvt Ltd'
                  : previewType === 'terms'
                  ? termsDoc.title
                  : privacyDoc.title}
              </span>
            </div>

            {/* Device Switcher Controls */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View (Full Width)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>

              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'tablet'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </button>

              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              onClick={() => setPreviewModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Preview Stage Frame */}
          <div className="w-full max-w-5xl h-[80vh] bg-slate-100 rounded-b-2xl overflow-y-auto flex justify-center p-4">
            <div
              className={`bg-white shadow-xl transition-all duration-200 overflow-y-auto rounded-xl border border-slate-200 ${
                previewDevice === 'desktop'
                  ? 'w-full max-w-4xl p-8'
                  : previewDevice === 'tablet'
                  ? 'w-[768px] p-6'
                  : 'w-[375px] p-4'
              }`}
            >
              {previewType === 'about' ? (
                <div className="space-y-8 text-slate-900">
                  {/* Hero Preview */}
                  <div className="border-b pb-6 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      About MAHDEV Pvt Ltd
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
                      {aboutContent.hero.title}
                    </h1>
                    <p className="text-sm font-semibold text-blue-700">
                      {aboutContent.hero.subtitle}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {aboutContent.hero.description}
                    </p>
                    <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
                      {aboutContent.hero.buttonText}
                    </button>
                  </div>

                  {/* Intro Preview */}
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {aboutContent.companyIntro.heading}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                      {aboutContent.companyIntro.description}
                    </p>
                  </div>

                  {/* Vision & Mission */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                      <h3 className="text-sm font-bold text-blue-950">
                        {aboutContent.vision.heading}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">{aboutContent.vision.description}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900">
                        {aboutContent.mission.heading}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">{aboutContent.mission.description}</p>
                    </div>
                  </div>

                  {/* Core Values */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">Core Values</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aboutContent.values
                        .filter((v) => v.enabled)
                        .map((v) => (
                          <div key={v.id} className="p-3 border rounded-xl bg-white shadow-2xs">
                            <span className="text-xs font-bold text-blue-600">{v.title}</span>
                            <p className="text-[11px] text-slate-600 mt-1">{v.description}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Divisions */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">Our Divisions</h3>
                    <div className="space-y-3">
                      {aboutContent.divisions
                        .filter((d) => d.enabled)
                        .map((d) => (
                          <div key={d.id} className="p-3 border rounded-xl bg-slate-50">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{d.name}</span>
                              <span className="text-[10px] font-mono text-blue-600">{d.route}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">{d.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {d.services.slice(0, 6).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Journey */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">Company Journey</h3>
                    <div className="space-y-2 border-l-2 border-blue-200 pl-3">
                      {aboutContent.timeline
                        .filter((t) => t.enabled)
                        .map((t) => (
                          <div key={t.id}>
                            <span className="text-[10px] font-bold font-mono text-blue-600">
                              {t.year}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                            <p className="text-[11px] text-slate-600">{t.description}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">Our Locations</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aboutContent.locations
                        .filter((l) => l.enabled)
                        .map((l) => (
                          <div key={l.id} className="p-3 border rounded-xl bg-slate-50 text-xs">
                            <span className="font-bold text-slate-900">{l.city} Branch</span>
                            <p className="text-[11px] text-slate-600 mt-1">{l.address}</p>
                            <p className="text-[11px] text-blue-600 mt-1 font-mono">{l.phone}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Legal Document Preview */
                <div className="space-y-6 text-slate-900">
                  <div className="border-b pb-4">
                    <span className="text-[10px] font-mono text-blue-600 font-bold uppercase">
                      Official Document • v
                      {previewType === 'terms' ? termsDoc.version : privacyDoc.version}
                    </span>
                    <h1 className="text-2xl font-bold font-display text-slate-900 mt-1">
                      {previewType === 'terms' ? termsDoc.title : privacyDoc.title}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Last Updated:{' '}
                      {previewType === 'terms' ? termsDoc.lastUpdated : privacyDoc.lastUpdated}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    {(previewType === 'terms' ? termsDoc.sections : privacyDoc.sections).map(
                      (sec, idx) => (
                        <div key={sec.id} className="space-y-1.5">
                          <h2 className="text-sm font-bold text-slate-900">
                            {idx + 1}. {sec.heading}
                          </h2>
                          {sec.content.map((p, pIdx) => (
                            <p key={pIdx} className="text-slate-600 leading-relaxed">
                              {p}
                            </p>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
