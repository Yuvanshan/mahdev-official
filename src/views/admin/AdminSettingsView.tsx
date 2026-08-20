import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Shield,
  RotateCcw,
  CheckCircle2,
  Globe,
  Share2,
  Clock,
  Sparkles,
  Megaphone,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import {
  firestoreSettingsService,
  getDefaultCompanySettings,
  getDefaultSiteSettings,
} from '../../services/firestore/settings';
import { FirestoreCompanySettings, FirestoreSiteSettings } from '../../types/firestore';
import { cmsService } from '../../services/cmsService';

export const AdminSettingsView: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'company' | 'commerce' | 'announcement' | 'security'>('company');

  // Firestore Live State
  const [companyData, setCompanyData] = useState<FirestoreCompanySettings>(() => getDefaultCompanySettings());
  const [systemSettings, setSystemSettings] = useState<FirestoreSiteSettings>(() => getDefaultSiteSettings());

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const unsubCompany = firestoreSettingsService.subscribeCompanySettings(
      (data) => {
        if (mounted) {
          setCompanyData(data);
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('[AdminSettings] Company subscription fallback:', err);
        if (mounted) setIsLoading(false);
      }
    );

    const unsubSite = firestoreSettingsService.subscribeSiteSettings(
      (data) => {
        if (mounted) {
          setSystemSettings(data);
        }
      },
      (err) => {
        console.warn('[AdminSettings] Site settings subscription fallback:', err);
      }
    );

    return () => {
      mounted = false;
      unsubCompany();
      unsubSite();
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Commit to Firestore database (Single Source of Truth)
      await Promise.all([
        firestoreSettingsService.updateCompanySettings(companyData),
        firestoreSettingsService.updateSiteSettings({
          ...systemSettings,
          currency: systemSettings.defaultCurrency || systemSettings.currency || 'USD',
        }),
      ]);

      // 2. Also keep CMS in-memory cache synchronized
      cmsService.updateCompanyInfo(companyData as any);

      addToast(
        'success',
        'Settings Saved Successfully',
        'Company information and system settings have been securely committed to Cloud Firestore in real-time.'
      );
    } catch (err: any) {
      console.error('[AdminSettings] Save error:', err);
      addToast(
        'error',
        'Save Failed',
        err?.message || 'Could not commit settings to Firestore. Please verify your permissions.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset company and site settings to official Mahdev default values in Firestore?'
      )
    ) {
      setIsSaving(true);
      try {
        const defaultCompany = getDefaultCompanySettings();
        const defaultSite = getDefaultSiteSettings();

        setCompanyData(defaultCompany);
        setSystemSettings(defaultSite);

        await Promise.all([
          firestoreSettingsService.updateCompanySettings(defaultCompany),
          firestoreSettingsService.updateSiteSettings(defaultSite),
        ]);

        cmsService.updateCompanyInfo(defaultCompany as any);

        addToast(
          'info',
          'Defaults Restored',
          'Official Mahdev corporate details and system settings have been restored in Cloud Firestore.'
        );
      } catch (err: any) {
        addToast(
          'error',
          'Reset Failed',
          err?.message || 'Could not reset default settings in Firestore.'
        );
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Connecting to Cloud Firestore...</p>
        <p className="text-xs text-slate-400">Loading authoritative company & system configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      <AdminToast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              System Settings & Global Company Information
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cloud Firestore Single Source of Truth • Real-time synchronization across all devices and public visitors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefaults}
            disabled={isSaving}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Reset Defaults
          </Button>

          <Button
            variant="electric"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            className="text-xs font-bold shrink-0"
          >
            {isSaving ? 'Saving to Firestore...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'company'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          Company & Offices
        </button>

        <button
          onClick={() => setActiveTab('commerce')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'commerce'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Commerce & Policies
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'announcement'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Announcement Banner
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security & Controls
        </button>
      </div>

      {/* Tab 1: Company & Offices */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Corporate Identity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">Corporate Legal Identity</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Brand Display Name
                </label>
                <input
                  type="text"
                  value={companyData.name || ''}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Legal Registered Entity Name
                </label>
                <input
                  type="text"
                  value={companyData.legalName || ''}
                  onChange={(e) => setCompanyData({ ...companyData, legalName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company Tagline
                </label>
                <input
                  type="text"
                  value={companyData.tagline || ''}
                  onChange={(e) => setCompanyData({ ...companyData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company Description
                </label>
                <textarea
                  rows={3}
                  value={companyData.description || ''}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Official Communications & Hotlines */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Phone className="w-4 h-4 text-blue-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">Official Hotlines & Email</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Contact Hotline
                </label>
                <input
                  type="text"
                  value={companyData.primaryPhone || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      primaryPhone: e.target.value,
                      phones: [e.target.value, companyData.secondaryPhone || ''],
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  placeholder="075 092 8078"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Secondary Support Hotline
                </label>
                <input
                  type="text"
                  value={companyData.secondaryPhone || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      secondaryPhone: e.target.value,
                      phones: [companyData.primaryPhone || '', e.target.value],
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  placeholder="076 898 8970"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Centralized Email
                </label>
                <input
                  type="email"
                  value={companyData.email || ''}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-600 focus:bg-white focus:outline-none"
                  placeholder="info.mahdev.lk@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Domain
                </label>
                <input
                  type="text"
                  value={companyData.domain || ''}
                  onChange={(e) => setCompanyData({ ...companyData, domain: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                  placeholder="mahdev.lk"
                />
              </div>
            </div>
          </div>

          {/* 3. Colombo Office */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-display text-sm font-bold text-slate-900">Colombo Office (Headquarters)</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Main HQ
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Office Name
                </label>
                <input
                  type="text"
                  value={companyData.offices?.colombo?.name || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      offices: {
                        ...companyData.offices,
                        colombo: { ...companyData.offices?.colombo, name: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={companyData.offices?.colombo?.address || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      offices: {
                        ...companyData.offices,
                        colombo: {
                          ...companyData.offices?.colombo,
                          address: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  placeholder="41/22, Pickings Road, Colombo 13, Sri Lanka"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={companyData.offices?.colombo?.city || ''}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        offices: {
                          ...companyData.offices,
                          colombo: { ...companyData.offices?.colombo, city: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={companyData.offices?.colombo?.country || ''}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        offices: {
                          ...companyData.offices,
                          colombo: { ...companyData.offices?.colombo, country: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Trincomalee Office */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="font-display text-sm font-bold text-slate-900">Trincomalee Office (Regional Branch)</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                Branch
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Office Name
                </label>
                <input
                  type="text"
                  value={companyData.offices?.trincomalee?.name || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      offices: {
                        ...companyData.offices,
                        trincomalee: { ...companyData.offices?.trincomalee, name: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={companyData.offices?.trincomalee?.address || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      offices: {
                        ...companyData.offices,
                        trincomalee: {
                          ...companyData.offices?.trincomalee,
                          address: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  placeholder="95/15, Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={companyData.offices?.trincomalee?.city || ''}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        offices: {
                          ...companyData.offices,
                          trincomalee: { ...companyData.offices?.trincomalee, city: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={companyData.offices?.trincomalee?.country || ''}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        offices: {
                          ...companyData.offices,
                          trincomalee: { ...companyData.offices?.trincomalee, country: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Social Media & Channels */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Share2 className="w-4 h-4 text-purple-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">Official Social Media & Channels</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  WhatsApp Direct Channel
                </label>
                <input
                  type="text"
                  value={companyData.socials?.whatsapp || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      socials: { ...companyData.socials, whatsapp: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                  placeholder="https://wa.me/94750928078"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="text"
                  value={companyData.socials?.linkedin || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      socials: { ...companyData.socials, linkedin: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Facebook Page
                </label>
                <input
                  type="text"
                  value={companyData.socials?.facebook || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      socials: { ...companyData.socials, facebook: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={companyData.socials?.instagram || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      socials: { ...companyData.socials, instagram: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  YouTube Channel
                </label>
                <input
                  type="text"
                  value={companyData.socials?.youtube || ''}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      socials: { ...companyData.socials, youtube: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Commerce & Policies */}
      {activeTab === 'commerce' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">Commerce & Currency Setup</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Platform Currency
                </label>
                <select
                  value={systemSettings.defaultCurrency || systemSettings.currency || 'USD'}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      defaultCurrency: e.target.value,
                      currency: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="LKR">LKR (Rs.)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  VAT / Sales Tax (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={systemSettings.vatTaxPercentage ?? 0}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      vatTaxPercentage: parseFloat(e.target.value) || 0,
                      taxRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Required Booking Deposit Retainer (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={systemSettings.bookingDepositPercent ?? 30}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      bookingDepositPercent: parseFloat(e.target.value) || 30,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">Legal Registration</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Registration Number
              </label>
              <input
                type="text"
                value={systemSettings.legalRegistrationNumber || companyData.registrationNumber || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSystemSettings({ ...systemSettings, legalRegistrationNumber: val });
                  setCompanyData({ ...companyData, registrationNumber: val });
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                placeholder="PV-00289410"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Announcement Banner */}
      {activeTab === 'announcement' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Megaphone className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">Public Announcement Bar</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Show Announcement Banner</span>
                <span className="text-[11px] text-slate-500">
                  Displays a prominent top banner across all public pages
                </span>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.announcement?.enabled ?? true}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    announcement: {
                      enabled: e.target.checked,
                      text: systemSettings.announcement?.text || '',
                      link: systemSettings.announcement?.link || '',
                    },
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Banner Message Text
              </label>
              <input
                type="text"
                value={systemSettings.announcement?.text || ''}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    announcement: {
                      enabled: systemSettings.announcement?.enabled ?? true,
                      text: e.target.value,
                      link: systemSettings.announcement?.link || '',
                    },
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                placeholder="Universal Enterprise Ecosystem Active • Colombo & Trincomalee Hotlines Online"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Link (Optional)
              </label>
              <input
                type="text"
                value={systemSettings.announcement?.link || ''}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    announcement: {
                      enabled: systemSettings.announcement?.enabled ?? true,
                      text: systemSettings.announcement?.text || '',
                      link: e.target.value,
                    },
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                placeholder="/contact"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Platform Controls */}
      {activeTab === 'security' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">Security, Maintenance & Alerts</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Maintenance Mode</span>
                <span className="text-[11px] text-slate-500">
                  Show maintenance landing notice to public visitors
                </span>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.enableMaintenanceMode || systemSettings.maintenanceMode || false}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    enableMaintenanceMode: e.target.checked,
                    maintenanceMode: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Automated Stock Alerts</span>
                <span className="text-[11px] text-slate-500">
                  Notify operations team on low warehouse quantities
                </span>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.enableStockAlertEmails ?? true}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, enableStockAlertEmails: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Daily Audit Backup Snapshots</span>
                <span className="text-[11px] text-slate-500">
                  Generate encrypted snapshots of orders and bookings
                </span>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.dailyBackupEnabled ?? true}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, dailyBackupEnabled: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
