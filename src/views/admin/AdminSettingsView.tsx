import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  ExternalLink,
  Check,
  Smartphone,
  Sun,
  Moon,
  Wrench,
  Radio,
  Power,
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { DatabaseDiagnosticsPanel } from '../../components/admin/DatabaseDiagnosticsPanel';
import {
  firestoreSettingsService,
  getDefaultCompanySettings,
  getDefaultSiteSettings,
} from '../../services/firestore/settings';
import {
  FirestoreCompanySettings,
  FirestoreSiteSettings,
  FirestoreMaintenanceSettings,
} from '../../types/firestore';
import { cmsService } from '../../services/cmsService';
import { storageService } from '../../services/storageService';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { adminService, syncAdminServerSession } from '../../services/adminService';
import { auth } from '../../lib/firebase';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getRentalAssetCount } from '../../utils/assetMetrics';

export const AdminSettingsView: React.FC = () => {
  const {
    updateSiteSettings: updateContextSiteSettings,
    updateCompanySettings: updateContextCompanySettings,
    refreshAll,
    products,
  } = useFirestoreDataContext();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'company' | 'branding' | 'commerce' | 'announcement' | 'maintenance' | 'security' | 'database'
  >('company');

  // Upload States
  const [uploadingField, setUploadingField] = useState<
    'logo' | 'darkLogo' | 'mobileLogo' | 'favicon' | 'maintenanceImage' | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRefLogo = useRef<HTMLInputElement>(null);
  const fileInputRefDarkLogo = useRef<HTMLInputElement>(null);
  const fileInputRefMobileLogo = useRef<HTMLInputElement>(null);
  const fileInputRefFavicon = useRef<HTMLInputElement>(null);
  const fileInputRefMaintenanceImage = useRef<HTMLInputElement>(null);

  // Firestore Live State
  const [companyData, setCompanyData] = useState<FirestoreCompanySettings>(() => getDefaultCompanySettings());
  const [systemSettings, setSystemSettings] = useState<FirestoreSiteSettings>(() => getDefaultSiteSettings());

  const currentAdmin = adminService.getCurrentAdmin();

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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo' | 'darkLogo' | 'mobileLogo' | 'favicon' | 'maintenanceImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    setUploadProgress(10);

    try {
      const isFavicon = field === 'favicon';
      const result = await storageService.uploadFile(file, 'branding', field, {
        maxWidth: isFavicon ? 128 : 1200,
        maxHeight: isFavicon ? 128 : 800,
        quality: 0.95,
        targetFormat: file.type.includes('svg') || file.name.toLowerCase().endsWith('.ico') ? 'original' : 'image/png',
        onProgress: (p) => setUploadProgress(p),
      });

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed. Please check file format and administrator privileges.');
      }

      const updatedSettings: Partial<FirestoreSiteSettings> = {
        ...systemSettings,
        brandingUpdatedAt: new Date().toISOString(),
        brandingVersion: (systemSettings.brandingVersion || 1) + 1,
      };

      if (field === 'logo') {
        updatedSettings.logoUrl = result.url;
        setCompanyData((prev) => ({ ...prev, logoUrl: result.url }));
        await firestoreSettingsService.updateCompanySettings({ logoUrl: result.url });
        cmsService.updateCompanyInfo({ ...companyData, logoUrl: result.url } as any);
        try {
          await updateContextCompanySettings({ logoUrl: result.url });
          await updateContextSiteSettings({ logoUrl: result.url });
        } catch {}
      } else if (field === 'darkLogo') {
        updatedSettings.darkLogoUrl = result.url;
        try {
          await updateContextCompanySettings({ darkLogoUrl: result.url });
          await updateContextSiteSettings({ darkLogoUrl: result.url });
        } catch {}
      } else if (field === 'mobileLogo') {
        updatedSettings.mobileLogoUrl = result.url;
      } else if (field === 'favicon') {
        updatedSettings.faviconUrl = result.url;
        try {
          await updateContextCompanySettings({ faviconUrl: result.url });
          await updateContextSiteSettings({ faviconUrl: result.url });
        } catch {}
      } else if (field === 'maintenanceImage') {
        updatedSettings.maintenance = {
          ...(systemSettings.maintenance || {
            enabled: systemSettings.enableMaintenanceMode || systemSettings.maintenanceMode || false,
            title: 'Systems Upgrade in Progress',
            message:
              'Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance.',
            estimatedReturn: 'Within 2 hours',
            contactPhone: companyData.primaryPhone,
            contactEmail: companyData.email,
          }),
          imageUrl: result.url,
        };
      }

      setSystemSettings(updatedSettings as FirestoreSiteSettings);

      // Auto-save to Firestore immediately
      await firestoreSettingsService.updateSiteSettings(updatedSettings);

      adminService.logAudit({
        action: 'ADMIN_BRANDING_UPLOAD',
        entityType: 'StorageAsset',
        entityId: field,
        details: `Administrator updated ${field} with asset ${file.name} in Firebase Storage repository.`,
        status: 'success',
      });

      addToast(
        'success',
        'Asset Uploaded & Live',
        `The ${
          field === 'favicon'
            ? 'favicon'
            : field === 'maintenanceImage'
            ? 'maintenance cover image'
            : 'brand logo'
        } was verified, stored in Firebase Storage, and published live across the site.`
      );
    } catch (err: any) {
      console.error('[AdminSettings] Asset upload error:', err);
      addToast(
        'error',
        'Upload Failed',
        err?.message || 'Could not complete media upload. Please verify file size and administrator privileges.'
      );
    } finally {
      setUploadingField(null);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleClearAsset = async (
    field: 'logo' | 'darkLogo' | 'mobileLogo' | 'favicon' | 'maintenanceImage'
  ) => {
    const updatedSettings: Partial<FirestoreSiteSettings> = {
      ...systemSettings,
      brandingUpdatedAt: new Date().toISOString(),
      brandingVersion: (systemSettings.brandingVersion || 1) + 1,
    };

    if (field === 'logo') {
      updatedSettings.logoUrl = '';
      setCompanyData((prev) => ({ ...prev, logoUrl: '' }));
      await firestoreSettingsService.updateCompanySettings({ logoUrl: '' });
      cmsService.updateCompanyInfo({ ...companyData, logoUrl: '' } as any);
      try {
        await updateContextCompanySettings({ logoUrl: '' });
        await updateContextSiteSettings({ logoUrl: '' });
      } catch {}
    } else if (field === 'darkLogo') {
      updatedSettings.darkLogoUrl = '';
      try {
        await updateContextCompanySettings({ darkLogoUrl: '' });
        await updateContextSiteSettings({ darkLogoUrl: '' });
      } catch {}
    } else if (field === 'mobileLogo') {
      updatedSettings.mobileLogoUrl = '';
    } else if (field === 'favicon') {
      updatedSettings.faviconUrl = '';
      try {
        await updateContextCompanySettings({ faviconUrl: '' });
        await updateContextSiteSettings({ faviconUrl: '' });
      } catch {}
    } else if (field === 'maintenanceImage') {
      if (updatedSettings.maintenance) {
        updatedSettings.maintenance = {
          ...updatedSettings.maintenance,
          imageUrl: '',
        };
      }
    }

    setSystemSettings(updatedSettings as FirestoreSiteSettings);
    await firestoreSettingsService.updateSiteSettings(updatedSettings);

    addToast('info', 'Asset Cleared', `Reverted ${field} to default state.`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentAdmin) {
        syncAdminServerSession(currentAdmin).catch((authErr) => {
          console.warn('[AdminSettings] Admin session check notice:', authErr);
        });
      }

      const activeCurrency = systemSettings.currency || systemSettings.defaultCurrency || 'LKR';

      // 1. Commit to Firestore database & multi-device sync channels
      await Promise.all([
        firestoreSettingsService.updateCompanySettings(companyData),
        firestoreSettingsService.updateSiteSettings({
          ...systemSettings,
          currency: activeCurrency,
          defaultCurrency: activeCurrency,
        }),
      ]);

      // 2. Also keep Context and CMS in-memory cache synchronized
      cmsService.updateCompanyInfo(companyData as any);
      try {
        await updateContextCompanySettings(companyData);
        await updateContextSiteSettings({
          ...systemSettings,
          currency: activeCurrency,
          defaultCurrency: activeCurrency,
        });
        await refreshAll();
      } catch {}

      addToast(
        'success',
        'Settings Saved Successfully',
        'Company information, brand media, and system settings have been securely saved and synchronized in real-time across all devices.'
      );
    } catch (err: any) {
      console.error('[AdminSettings] Save error:', err);
      addToast(
        'error',
        'Save Failed',
        err?.message || 'Could not commit settings. Please verify your connection.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBrandingAssets = async () => {
    setIsSaving(true);
    try {
      const resolvedLogo = systemSettings.logoUrl || companyData.logoUrl || '';
      const resolvedDarkLogo = systemSettings.darkLogoUrl || companyData.darkLogoUrl || '';
      const resolvedFavicon = systemSettings.faviconUrl || companyData.faviconUrl || '';
      const resolvedMobileLogo = systemSettings.mobileLogoUrl || '';

      const updatedSite: FirestoreSiteSettings = {
        ...systemSettings,
        logoUrl: resolvedLogo,
        darkLogoUrl: resolvedDarkLogo,
        faviconUrl: resolvedFavicon,
        mobileLogoUrl: resolvedMobileLogo,
        brandingUpdatedAt: new Date().toISOString(),
        brandingVersion: (systemSettings.brandingVersion || 1) + 1,
      };
      await Promise.all([
        firestoreSettingsService.updateCompanySettings({
          ...companyData,
          logoUrl: resolvedLogo,
          darkLogoUrl: resolvedDarkLogo,
          faviconUrl: resolvedFavicon,
        }),
        firestoreSettingsService.updateSiteSettings(updatedSite),
      ]);
      try {
        await updateContextCompanySettings({
          ...companyData,
          logoUrl: resolvedLogo,
          darkLogoUrl: resolvedDarkLogo,
          faviconUrl: resolvedFavicon,
        });
        await updateContextSiteSettings(updatedSite);
        await refreshAll();
      } catch {}
      addToast(
        'success',
        'Branding & Logo Assets Published',
        'Your custom logos and favicon are now updated and synchronized live across all public portals.'
      );
    } catch (err: any) {
      addToast('error', 'Error Publishing Branding', err?.message || 'Firestore error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    setIsSaving(true);
    try {
      const announcementData = {
        ...systemSettings,
        announcement: systemSettings.announcement,
      };
      await firestoreSettingsService.updateSiteSettings(announcementData);
      try {
        await updateContextSiteSettings(announcementData);
        await refreshAll();
      } catch {}
      addToast(
        'success',
        'Announcement Banner Published',
        'The top announcement banner is now broadcasted in real-time to all website visitors.'
      );
    } catch (err: any) {
      addToast('error', 'Error Saving Banner', err?.message || 'Firestore error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMaintenance = async () => {
    setIsSaving(true);
    try {
      const maintenanceData = {
        ...systemSettings,
        maintenance: systemSettings.maintenance,
        enableMaintenanceMode: systemSettings.enableMaintenanceMode ?? systemSettings.maintenance?.enabled,
        maintenanceMode: systemSettings.maintenanceMode ?? systemSettings.maintenance?.enabled,
      };
      await firestoreSettingsService.updateSiteSettings(maintenanceData);
      try {
        await updateContextSiteSettings(maintenanceData);
        await refreshAll();
      } catch {}
      addToast(
        'success',
        'Maintenance Settings Saved',
        'Maintenance configuration parameters have been synchronized with Firestore.'
      );
    } catch (err: any) {
      addToast('error', 'Error Saving Maintenance', err?.message || 'Firestore error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      if (currentAdmin) {
        syncAdminServerSession(currentAdmin).catch(() => {});
      }
      await firestoreSettingsService.updateCompanySettings(companyData);
      cmsService.updateCompanyInfo(companyData as any);
      try {
        await updateContextCompanySettings(companyData);
        await refreshAll();
      } catch {}
      addToast(
        'success',
        'Company & Office Settings Saved',
        'Corporate legal identity, communications, office locations, and social links saved.'
      );
    } catch (err: any) {
      addToast('error', 'Save Failed', err?.message || 'Failed to save company settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCommerce = async () => {
    setIsSaving(true);
    try {
      const activeCurrency = systemSettings.currency || systemSettings.defaultCurrency || 'LKR';
      const updated = {
        ...systemSettings,
        currency: activeCurrency,
        defaultCurrency: activeCurrency,
      };
      await Promise.all([
        firestoreSettingsService.updateCompanySettings(companyData),
        firestoreSettingsService.updateSiteSettings(updated),
      ]);
      await updateContextCompanySettings(companyData);
      await updateContextSiteSettings(updated);
      addToast(
        'success',
        'Commerce Settings Saved',
        `Platform currency set to ${activeCurrency} and tax configuration saved.`
      );
    } catch (err: any) {
      addToast('error', 'Save Failed', err?.message || 'Failed to save commerce settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurityAlerts = async () => {
    setIsSaving(true);
    try {
      await firestoreSettingsService.updateSiteSettings(systemSettings);
      await updateContextSiteSettings(systemSettings);
      addToast(
        'success',
        'Security & Alerts Saved',
        'Maintenance status, corporate SMS alerts, and audit settings have been committed to Cloud Firestore.'
      );
    } catch (err: any) {
      addToast('error', 'Save Failed', err?.message || 'Failed to save security settings.');
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
        try {
          await updateContextCompanySettings(defaultCompany);
          await updateContextSiteSettings(defaultSite);
          await refreshAll();
        } catch {}

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
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'branding'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Branding & Logo
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
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-500" />
          <span>Maintenance Mode</span>
          {(systemSettings.maintenance?.enabled ??
            systemSettings.enableMaintenanceMode ??
            systemSettings.maintenanceMode) && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 animate-pulse">
              LIVE
            </span>
          )}
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

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'database'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-blue-600" />
          Database Architecture & Health
        </button>
      </div>

      {/* Hidden File Upload Inputs */}
      <input
        ref={fileInputRefLogo}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'logo')}
      />
      <input
        ref={fileInputRefDarkLogo}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'darkLogo')}
      />
      <input
        ref={fileInputRefMobileLogo}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'mobileLogo')}
      />
      <input
        ref={fileInputRefFavicon}
        type="file"
        accept="image/x-icon,image/png,image/svg+xml,image/vnd.microsoft.icon"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'favicon')}
      />
      <input
        ref={fileInputRefMaintenanceImage}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'maintenanceImage')}
      />

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
                  placeholder="075 092 8078"
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
                  placeholder="41/22, Pickerings Road, Kotahena, Colombo 13, Sri Lanka"
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

          {/* Company Tab Save Action Footer */}
          <div className="lg:col-span-2 pt-3 pb-1 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Corporate & Office Information</p>
                <p className="text-[11px] text-slate-500">
                  Changes update legal documents, invoices, contact channels, and website footer.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshAll}
                className="cursor-pointer"
              >
                Discard Edits
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSaveCompany}
                disabled={isSaving}
                className="cursor-pointer shadow-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {isSaving ? 'Saving Company...' : 'Save Company & Offices'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Branding & Logo Management */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {/* Executive Storage Authorization Status Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Firebase Storage Authorization: Active & Synchronized
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Check className="w-3 h-3" /> Verified Admin
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Logged in as <span className="font-semibold text-slate-800">{currentAdmin?.name || 'Yuvanshan Prabakaran'}</span> ({currentAdmin?.email || 'info.mahdev.lk@gmail.com'}) • Write access enabled for <code className="text-blue-700 bg-blue-100/60 px-1 py-0.5 rounded font-mono text-[11px]">branding/</code> repository.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                v{systemSettings.brandingVersion || 1} • {systemSettings.brandingUpdatedAt ? new Date(systemSettings.brandingUpdatedAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>

          {/* Main Grid: Upload Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Primary Brand Logo */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Primary Logo (Light Theme & Header)
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                    Main Nav
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Used across the main website navigation bar, invoices, and light background views. Transparent PNG or SVG recommended.
                </p>

                {/* Upload & Progress UI */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefLogo.current?.click()}
                    disabled={uploadingField === 'logo'}
                    leftIcon={
                      uploadingField === 'logo' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )
                    }
                    className="text-xs font-semibold"
                  >
                    {uploadingField === 'logo'
                      ? `Uploading (${uploadProgress}%)...`
                      : 'Upload Image File'}
                  </Button>

                  {systemSettings.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearAsset('logo')}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Direct URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Direct Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={systemSettings.logoUrl || ''}
                      onChange={(e) => {
                        const url = e.target.value;
                        setSystemSettings({ ...systemSettings, logoUrl: url });
                        setCompanyData({ ...companyData, logoUrl: url });
                      }}
                      onBlur={async () => {
                        if (systemSettings.logoUrl) {
                          try {
                            const trimmed = systemSettings.logoUrl.trim();
                            await firestoreSettingsService.updateSiteSettings({ logoUrl: trimmed });
                            await firestoreSettingsService.updateCompanySettings({ logoUrl: trimmed });
                            await updateContextCompanySettings({ logoUrl: trimmed });
                            await updateContextSiteSettings({ logoUrl: trimmed });
                          } catch {}
                        }
                      }}
                      placeholder="https://storage.googleapis.com/.../logo.png"
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const trimmed = (systemSettings.logoUrl || '').trim();
                          await firestoreSettingsService.updateSiteSettings({ logoUrl: trimmed });
                          await firestoreSettingsService.updateCompanySettings({ logoUrl: trimmed });
                          await updateContextCompanySettings({ logoUrl: trimmed });
                          await updateContextSiteSettings({ logoUrl: trimmed });
                          await refreshAll();
                          addToast('success', 'Logo URL Applied', 'Brand logo URL saved and published live to website.');
                        } catch (err: any) {
                          addToast('error', 'Failed to Apply Logo', err?.message || 'Error saving URL');
                        }
                      }}
                      className="text-xs shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Live Preview on Light Background
                </span>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center min-h-[70px]">
                  <BrandLogo size="lg" logoUrl={systemSettings.logoUrl} theme="light" />
                </div>
              </div>
            </div>

            {/* 2. Dark Mode / Contrast Logo */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Dark / Footer Logo (Contrast Theme)
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    Footer & Drawers
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Used inside the dark footer, mobile menu drawers, and dark backgrounds. White or light colored logo recommended.
                </p>

                {/* Upload & Progress UI */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefDarkLogo.current?.click()}
                    disabled={uploadingField === 'darkLogo'}
                    leftIcon={
                      uploadingField === 'darkLogo' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )
                    }
                    className="text-xs font-semibold"
                  >
                    {uploadingField === 'darkLogo'
                      ? `Uploading (${uploadProgress}%)...`
                      : 'Upload Image File'}
                  </Button>

                  {systemSettings.darkLogoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearAsset('darkLogo')}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Direct URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Direct Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={systemSettings.darkLogoUrl || ''}
                      onChange={(e) => setSystemSettings({ ...systemSettings, darkLogoUrl: e.target.value })}
                      onBlur={async () => {
                        if (systemSettings.darkLogoUrl) {
                          try {
                            const trimmed = systemSettings.darkLogoUrl.trim();
                            await firestoreSettingsService.updateSiteSettings({ darkLogoUrl: trimmed });
                            await firestoreSettingsService.updateCompanySettings({ darkLogoUrl: trimmed });
                            await updateContextCompanySettings({ darkLogoUrl: trimmed });
                            await updateContextSiteSettings({ darkLogoUrl: trimmed });
                          } catch {}
                        }
                      }}
                      placeholder="https://storage.googleapis.com/.../dark_logo.png"
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const trimmed = (systemSettings.darkLogoUrl || '').trim();
                          await firestoreSettingsService.updateSiteSettings({ darkLogoUrl: trimmed });
                          await firestoreSettingsService.updateCompanySettings({ darkLogoUrl: trimmed });
                          await updateContextCompanySettings({ darkLogoUrl: trimmed });
                          await updateContextSiteSettings({ darkLogoUrl: trimmed });
                          await refreshAll();
                          addToast('success', 'Dark Logo URL Applied', 'Dark contrast logo URL saved and published live.');
                        } catch (err: any) {
                          addToast('error', 'Failed to Apply Dark Logo', err?.message || 'Error saving URL');
                        }
                      }}
                      className="text-xs shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Live Preview on Dark Canvas
                </span>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center min-h-[70px]">
                  <BrandLogo
                    size="lg"
                    logoUrl={systemSettings.darkLogoUrl || systemSettings.logoUrl}
                    theme="dark"
                  />
                </div>
              </div>
            </div>

            {/* 3. Mobile / Compact Icon */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Mobile & Compact App Icon
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Mobile View
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Used for compact screen displays, mobile headers, and mobile PWA manifests. Square icon recommended.
                </p>

                {/* Upload & Progress UI */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefMobileLogo.current?.click()}
                    disabled={uploadingField === 'mobileLogo'}
                    leftIcon={
                      uploadingField === 'mobileLogo' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )
                    }
                    className="text-xs font-semibold"
                  >
                    {uploadingField === 'mobileLogo'
                      ? `Uploading (${uploadProgress}%)...`
                      : 'Upload Image File'}
                  </Button>

                  {systemSettings.mobileLogoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearAsset('mobileLogo')}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Direct URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Direct Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={systemSettings.mobileLogoUrl || ''}
                      onChange={(e) => setSystemSettings({ ...systemSettings, mobileLogoUrl: e.target.value })}
                      onBlur={async () => {
                        if (systemSettings.mobileLogoUrl) {
                          try {
                            const trimmed = systemSettings.mobileLogoUrl.trim();
                            await firestoreSettingsService.updateSiteSettings({ mobileLogoUrl: trimmed });
                            await updateContextSiteSettings({ mobileLogoUrl: trimmed });
                          } catch {}
                        }
                      }}
                      placeholder="https://storage.googleapis.com/.../mobile_icon.png"
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const trimmed = (systemSettings.mobileLogoUrl || '').trim();
                          await firestoreSettingsService.updateSiteSettings({ mobileLogoUrl: trimmed });
                          await updateContextSiteSettings({ mobileLogoUrl: trimmed });
                          await refreshAll();
                          addToast('success', 'Mobile Icon URL Applied', 'Mobile app icon URL saved and published live.');
                        } catch (err: any) {
                          addToast('error', 'Failed to Apply Mobile Icon', err?.message || 'Error saving URL');
                        }
                      }}
                      className="text-xs shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Live Preview (Compact Mobile)
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xs">
                    {systemSettings.mobileLogoUrl ? (
                      <>
                        <img
                          src={systemSettings.mobileLogoUrl}
                          alt="Mobile Icon"
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (fb) fb.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          {(companyData.name || 'M').charAt(0).toUpperCase()}
                        </div>
                      </>
                    ) : (
                      <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        M
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      {companyData.name || 'Mahdev Pvt Ltd'}
                    </p>
                    <p className="text-[10px] text-slate-400">Mobile Navigation Bar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Favicon & Browser Tab */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Browser Favicon (.ico / .png / .svg)
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                    Tab Icon
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Displayed on user browser tabs, bookmarks, and mobile home screen shortcuts. Synchronized live in Firestore.
                </p>

                {/* Upload & Progress UI */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefFavicon.current?.click()}
                    disabled={uploadingField === 'favicon'}
                    leftIcon={
                      uploadingField === 'favicon' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )
                    }
                    className="text-xs font-semibold"
                  >
                    {uploadingField === 'favicon'
                      ? `Uploading (${uploadProgress}%)...`
                      : 'Upload Favicon File'}
                  </Button>

                  {systemSettings.faviconUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearAsset('favicon')}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Direct URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Direct Favicon URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={systemSettings.faviconUrl || ''}
                      onChange={(e) => setSystemSettings({ ...systemSettings, faviconUrl: e.target.value })}
                      onBlur={async () => {
                        if (systemSettings.faviconUrl) {
                          try {
                            const trimmed = systemSettings.faviconUrl.trim();
                            await firestoreSettingsService.updateSiteSettings({ faviconUrl: trimmed });
                            await firestoreSettingsService.updateCompanySettings({ faviconUrl: trimmed });
                            await updateContextCompanySettings({ faviconUrl: trimmed });
                            await updateContextSiteSettings({ faviconUrl: trimmed });
                          } catch {}
                        }
                      }}
                      placeholder="https://storage.googleapis.com/.../favicon.ico"
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const trimmed = (systemSettings.faviconUrl || '').trim();
                          await firestoreSettingsService.updateSiteSettings({ faviconUrl: trimmed });
                          await firestoreSettingsService.updateCompanySettings({ faviconUrl: trimmed });
                          await updateContextCompanySettings({ faviconUrl: trimmed });
                          await updateContextSiteSettings({ faviconUrl: trimmed });
                          await refreshAll();
                          addToast('success', 'Favicon URL Applied', 'Browser tab favicon URL saved and published live.');
                        } catch (err: any) {
                          addToast('error', 'Failed to Apply Favicon', err?.message || 'Error saving URL');
                        }
                      }}
                      className="text-xs shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>

              {/* Browser Tab Simulation */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Browser Tab Simulation
                </span>
                <div className="bg-slate-200/70 p-2 rounded-xl border border-slate-300/80">
                  <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-2xs border border-slate-200 max-w-full">
                    {systemSettings.faviconUrl ? (
                      <>
                        <img
                          src={systemSettings.faviconUrl}
                          alt="Favicon"
                          className="w-4 h-4 object-contain rounded-xs"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (fb) fb.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-4 h-4 bg-blue-600 rounded-xs flex items-center justify-center text-white font-bold text-[9px]">
                          {(companyData.name || 'M').charAt(0).toUpperCase()}
                        </div>
                      </>
                    ) : (
                      <div className="w-4 h-4 bg-blue-600 rounded-xs flex items-center justify-center text-white font-bold text-[9px]">
                        {(companyData.name || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
                      {companyData.name || 'Mahdev Pvt Ltd'} — Official Portal
                    </span>
                    <span className="text-slate-300 text-xs ml-1">×</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Navigation Bar Sandbox Simulation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Live Navigation Bar Preview Sandbox
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Shows exact rendering in public visitor desktop header
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
                <BrandLogo
                  size="md"
                  logoUrl={systemSettings.logoUrl}
                  theme="light"
                />

                <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-600">
                  <span className="text-blue-600 font-bold">Home</span>
                  <span>Divisions</span>
                  <span>Catalog</span>
                  <span>Portfolio</span>
                  <span>About</span>
                  <span>Contact</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold shadow-2xs">
                    Client Portal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Instant Publish Bar for Branding */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display text-white">Publish Branding & Logo Assets</h4>
                <p className="text-[11px] text-slate-400">Save and sync all logo assets, favicon, and dark themes across all public views immediately.</p>
              </div>
            </div>
            <Button
              variant="electric"
              size="sm"
              onClick={handleSaveBrandingAssets}
              disabled={isSaving}
              leftIcon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              className="text-xs font-bold shrink-0 self-end sm:self-center"
            >
              {isSaving ? 'Publishing...' : 'Save & Publish Branding'}
            </Button>
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

          {/* Rental Assets & Inventory Metrics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">Rental Assets & Equipment Inventory Metrics</h3>
                  <p className="text-[11px] text-slate-500">Configure the public rental asset metric badge displayed across marketing headers, SWS portals, and search ribbons.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono self-start sm:self-auto">
                Auto-calculated: {getRentalAssetCount(products)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Public Asset Count Metric (Custom Override)
                </label>
                <input
                  type="text"
                  value={companyData.rentalAssetCount || systemSettings.rentalAssetCount || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCompanyData({ ...companyData, rentalAssetCount: val });
                    setSystemSettings({ ...systemSettings, rentalAssetCount: val });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  placeholder="e.g. 5,000+ or 1,200+ (Leave blank to use auto-calculated count)"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  When left blank or cleared, the website automatically computes the live rental stock ({getRentalAssetCount(products)}) based on active products added for rent.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Live Catalog Rental Inventory</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Currently detecting <strong className="text-blue-600">{products.filter((p: any) => p.isRental || p.tags?.includes('rental') || p.divisionKey === 'sws' || p.divisionId === 'sws').length}</strong> rental products registered in the database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyData({ ...companyData, rentalAssetCount: '' });
                    setSystemSettings({ ...systemSettings, rentalAssetCount: '' });
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline self-start cursor-pointer"
                >
                  Reset to Auto-Calculate from Products
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCommerce}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Commerce & Rental Settings</span>
              </Button>
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

            {/* Instant Save Bar for Announcement Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md border border-blue-800 mt-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-display text-white">Publish Announcement Banner</h4>
                  <p className="text-[11px] text-blue-200">Broadcast banner message and target URL to all public portal visitors in real-time.</p>
                </div>
              </div>
              <Button
                variant="electric"
                size="sm"
                onClick={handleSaveAnnouncement}
                disabled={isSaving}
                leftIcon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                className="text-xs font-bold shrink-0 self-end sm:self-center"
              >
                {isSaving ? 'Publishing...' : 'Save & Broadcast Banner'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Maintenance Mode (Phase 50) */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* 1. Status Indicator & Quick Activation Bar */}
          {(() => {
            const isMaintActive = Boolean(
              systemSettings.maintenance?.enabled ??
                systemSettings.enableMaintenanceMode ??
                systemSettings.maintenanceMode
            );
            const currentMaint = systemSettings.maintenance || {
              enabled: isMaintActive,
              title: 'Systems Upgrade in Progress',
              message:
                'Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance.',
              imageUrl:
                'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
              estimatedReturn: 'Within 2 hours',
              contactPhone: companyData.primaryPhone || '075 092 8078',
              contactEmail: companyData.email || 'info@mahdev.lk',
            };

            const handleToggleQuick = async () => {
              const nextState = !isMaintActive;
              const now = new Date().toISOString();
              const updatedMaintenance: FirestoreMaintenanceSettings = {
                ...currentMaint,
                enabled: nextState,
                ...(nextState ? { lastActivatedAt: now } : { lastDeactivatedAt: now }),
              };

              const updatedSettings: Partial<FirestoreSiteSettings> = {
                ...systemSettings,
                maintenanceMode: nextState,
                enableMaintenanceMode: nextState,
                maintenance: updatedMaintenance,
              };

              setSystemSettings(updatedSettings as FirestoreSiteSettings);
              setIsSaving(true);
              try {
                await firestoreSettingsService.updateSiteSettings(updatedSettings);
                try {
                  await updateContextSiteSettings(updatedSettings);
                  await refreshAll();
                } catch {}
                addToast(
                  nextState ? 'warning' : 'success',
                  nextState ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
                  nextState
                    ? 'Public visitors are now redirected to the Maintenance Landing Page in real-time.'
                    : 'System is back ONLINE. Public visitors can access all pages and portals.'
                );
              } catch (err: any) {
                addToast('error', 'Error updating maintenance mode', err?.message || 'Firestore error');
              } finally {
                setIsSaving(false);
              }
            };

            const imagePresets = [
              {
                label: 'Tech Infrastructure',
                url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
              },
              {
                label: 'Cinema Studio',
                url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
              },
              {
                label: 'Corporate HQ',
                url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
              },
              {
                label: 'Dark Luxury Gradient',
                url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
              },
            ];

            const returnTimePresets = [
              'Within 1 Hour',
              'Within 2 Hours',
              'Today by 6:00 PM',
              'Tonight by 11:59 PM',
              'Tomorrow by 9:00 AM',
            ];

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form Controls */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Status Banner */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      isMaintActive
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isMaintActive
                              ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                          }`}
                        >
                          {isMaintActive ? (
                            <Wrench className="w-5 h-5 animate-pulse" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                isMaintActive
                                  ? 'bg-amber-500 text-slate-950 font-mono'
                                  : 'bg-emerald-600 text-white font-mono'
                              }`}
                            >
                              {isMaintActive ? 'MAINTENANCE MODE ACTIVE' : 'SYSTEM ONLINE'}
                            </span>
                            {isMaintActive && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {isMaintActive
                              ? 'Public traffic is currently locked and presented with the maintenance notice.'
                              : 'All web portals, commerce stores, and booking engines are operating normally.'}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant={isMaintActive ? 'outline' : 'electric'}
                        size="sm"
                        onClick={handleToggleQuick}
                        disabled={isSaving}
                        leftIcon={
                          isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )
                        }
                        className={`text-xs font-bold shrink-0 ${
                          isMaintActive
                            ? 'border-amber-500 text-amber-700 hover:bg-amber-100/50'
                            : ''
                        }`}
                      >
                        {isMaintActive ? 'Deactivate Maintenance' : 'Activate Maintenance'}
                      </Button>
                    </div>
                  </div>

                  {/* Settings Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-500" />
                        <h3 className="font-display text-sm font-bold text-slate-900">
                          Maintenance Mode Configuration
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Path: settings/site.maintenance
                      </span>
                    </div>

                    {/* 1. Switch Enable/Disable */}
                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
                      <div className="pr-4">
                        <span className="text-xs font-bold text-slate-900 block">
                          Enable Maintenance Mode
                        </span>
                        <span className="text-[11px] text-slate-500">
                          When checked, any non-administrator visiting public pages will see this maintenance view.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isMaintActive}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setSystemSettings({
                            ...systemSettings,
                            enableMaintenanceMode: val,
                            maintenanceMode: val,
                            maintenance: {
                              ...currentMaint,
                              enabled: val,
                            },
                          });
                        }}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-5 h-5 shrink-0"
                      />
                    </label>

                    {/* 2. Notice Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Notice Headline / Title
                        </label>
                        <span className="text-[11px] text-slate-400">Display heading on page</span>
                      </div>
                      <input
                        type="text"
                        value={currentMaint.title || ''}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            maintenance: {
                              ...currentMaint,
                              title: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                        placeholder="Mahdev Pvt Ltd Systems Upgrade in Progress"
                      />
                    </div>

                    {/* 3. Notice Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Explanation Message
                        </label>
                        <span className="text-[11px] text-slate-400">Visitor details & rationale</span>
                      </div>
                      <textarea
                        rows={3}
                        value={currentMaint.message || ''}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            maintenance: {
                              ...currentMaint,
                              message: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none leading-relaxed"
                        placeholder="Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance."
                      />
                    </div>

                    {/* 4. Cover / Banner Image */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Maintenance Cover Image
                        </label>
                        <span className="text-[11px] text-slate-400">Optional hero banner</span>
                      </div>

                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={currentMaint.imageUrl || ''}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              maintenance: {
                                ...currentMaint,
                                imageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                          placeholder="https://images.unsplash.com/..."
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRefMaintenanceImage.current?.click()}
                          disabled={uploadingField === 'maintenanceImage'}
                          leftIcon={
                            uploadingField === 'maintenanceImage' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )
                          }
                          className="text-xs shrink-0"
                        >
                          {uploadingField === 'maintenanceImage' ? 'Uploading...' : 'Upload'}
                        </Button>
                        {currentMaint.imageUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearAsset('maintenanceImage')}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Image Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          Presets:
                        </span>
                        {imagePresets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              setSystemSettings({
                                ...systemSettings,
                                maintenance: {
                                  ...currentMaint,
                                  imageUrl: preset.url,
                                },
                              })
                            }
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                              currentMaint.imageUrl === preset.url
                                ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. Estimated Return Time */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Estimated Return
                        </label>
                        <span className="text-[11px] text-slate-400">Target completion time</span>
                      </div>

                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={currentMaint.estimatedReturn || ''}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              maintenance: {
                                ...currentMaint,
                                estimatedReturn: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                          placeholder="Within 2 hours / Tonight by 11:59 PM"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          Quick Picks:
                        </span>
                        {returnTimePresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setSystemSettings({
                                ...systemSettings,
                                maintenance: {
                                  ...currentMaint,
                                  estimatedReturn: preset,
                                },
                              })
                            }
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                              currentMaint.estimatedReturn === preset
                                ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 6. Contact Information (Hotline & Email) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Emergency Hotline Phone
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setSystemSettings({
                                ...systemSettings,
                                maintenance: {
                                  ...currentMaint,
                                  contactPhone: companyData.primaryPhone || '075 092 8078',
                                },
                              })
                            }
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            Use Group Phone
                          </button>
                        </div>
                        <input
                          type="text"
                          value={currentMaint.contactPhone || ''}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              maintenance: {
                                ...currentMaint,
                                contactPhone: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                          placeholder="075 092 8078"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Corporate Inquiries Email
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setSystemSettings({
                                ...systemSettings,
                                maintenance: {
                                  ...currentMaint,
                                  contactEmail: companyData.email || 'info@mahdev.lk',
                                },
                              })
                            }
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            Use Group Email
                          </button>
                        </div>
                        <input
                          type="email"
                          value={currentMaint.contactEmail || ''}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              maintenance: {
                                ...currentMaint,
                                contactEmail: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                          placeholder="info@mahdev.lk"
                        />
                      </div>
                    </div>

                    {/* Instant Save Bar for Maintenance Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 mt-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold font-display text-white">Save Maintenance Configuration</h4>
                          <p className="text-[11px] text-slate-400">Commit headline, explanation copy, cover image, and emergency contacts to Firestore.</p>
                        </div>
                      </div>
                      <Button
                        variant="electric"
                        size="sm"
                        onClick={handleSaveMaintenance}
                        disabled={isSaving}
                        leftIcon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        className="text-xs font-bold shrink-0 self-end sm:self-center bg-amber-500 hover:bg-amber-400 text-slate-950"
                      >
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Interactive Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-800 text-white shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 ml-2">
                          Live Public Visitor Preview
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Viewport Simulation
                      </span>
                    </div>

                    {/* Preview Screen Body */}
                    <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 text-center relative overflow-hidden">
                      {currentMaint.imageUrl ? (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4 border border-slate-800">
                          <img
                            src={currentMaint.imageUrl}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                          <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 text-[9px] font-bold">
                            <Wrench className="w-2.5 h-2.5" />
                            <span>MAINTENANCE</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                          <Wrench className="w-6 h-6 text-amber-400" />
                        </div>
                      )}

                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold mb-2">
                        <Shield className="w-3 h-3" />
                        <span>System Maintenance</span>
                      </div>

                      <h4 className="text-sm font-bold text-white font-display leading-snug mb-2">
                        {currentMaint.title || 'Systems Upgrade in Progress'}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                        {currentMaint.message || 'System maintenance is active.'}
                      </p>

                      {currentMaint.estimatedReturn && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 mb-4">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Return:</span>
                          <span className="font-bold text-amber-300">
                            {currentMaint.estimatedReturn}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px]">
                        <div className="truncate">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">
                            Hotline
                          </span>
                          <span className="text-slate-200 font-mono">
                            {currentMaint.contactPhone || companyData.primaryPhone}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">
                            Email
                          </span>
                          <span className="text-slate-200 font-mono">
                            {currentMaint.contactEmail || companyData.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Admin Portal Bypass:</strong>
                      <span>
                        Even while Maintenance Mode is enabled, authenticated staff and administrators can continue accessing the Admin Portal without interruption.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 5: Security & Platform Controls */}
      {activeTab === 'security' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">Security, Maintenance & Alerts</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Maintenance Mode</span>
                  {Boolean(
                    systemSettings.maintenance?.enabled ??
                      systemSettings.enableMaintenanceMode ??
                      systemSettings.maintenanceMode
                  ) && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Redirect all public visitors to the maintenance landing view.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('maintenance')}
                  className="text-[11px] font-bold text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <span>Configure titles, messages, banner & return timer</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <input
                type="checkbox"
                checked={Boolean(
                  systemSettings.maintenance?.enabled ??
                    systemSettings.enableMaintenanceMode ??
                    systemSettings.maintenanceMode
                )}
                onChange={(e) => {
                  const val = e.target.checked;
                  setSystemSettings({
                    ...systemSettings,
                    enableMaintenanceMode: val,
                    maintenanceMode: val,
                    maintenance: {
                      ...(systemSettings.maintenance || {
                        enabled: val,
                        title: 'Systems Upgrade in Progress',
                        message:
                          'Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance.',
                        estimatedReturn: 'Within 2 hours',
                        contactPhone: companyData.primaryPhone,
                        contactEmail: companyData.email,
                      }),
                      enabled: val,
                    },
                  });
                }}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>

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
                <span className="text-xs font-bold text-slate-800 block">Corporate SMS & WhatsApp Alerts</span>
                <span className="text-[11px] text-slate-500">
                  Transmit real-time booking confirmations, tracking SMS & dispatch notifications to clients
                </span>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.enableSmsAlerts ?? systemSettings.smsAlertsEnabled ?? true}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    enableSmsAlerts: e.target.checked,
                    smsAlertsEnabled: e.target.checked,
                  })
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

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSecurityAlerts}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Security & Alerts</span>
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <DatabaseDiagnosticsPanel />
          </div>
        </div>
      )}

      {/* Tab 6: Database Architecture & Live Health Diagnostics */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <DatabaseDiagnosticsPanel />
        </div>
      )}
    </div>
  );
};
