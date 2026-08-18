import React, { useState } from 'react';
import {
  Settings,
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Bell,
  Shield,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  HardDrive,
  Globe,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { COMPANY_INFO } from '../../config/company';

const SETTINGS_STORAGE_KEY = 'mahdev_cms_system_settings_v1';

export const AdminSettingsView: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      companyName: COMPANY_INFO.legalName,
      legalRegistrationNumber: 'PV-00284912',
      primaryEmail: COMPANY_INFO.email,
      supportEmail: COMPANY_INFO.email,
      phoneHotline: `${COMPANY_INFO.primaryPhone} / ${COMPANY_INFO.secondaryPhone}`,
      headquartersAddress: `${COMPANY_INFO.offices.colombo.fullAddress} | Trincomalee: ${COMPANY_INFO.offices.trincomalee.fullAddress}`,
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD', 'LKR', 'EUR', 'GBP'],
      vatTaxPercentage: 8,
      bookingDepositPercent: 30,
      enableMaintenanceMode: false,
      enablePublicRegistration: true,
      enableStockAlertEmails: true,
      dailyBackupEnabled: true,
    };
  });

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      addToast('success', 'Settings Saved', 'System configurations successfully updated.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save settings.');
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
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              System Settings & Global Configurations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company profile, tax computations, booking policies, currency presets, and platform controls.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Company Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">Corporate Legal Identity</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Registration No
              </label>
              <input
                type="text"
                value={settings.legalRegistrationNumber}
                onChange={(e) => setSettings({ ...settings, legalRegistrationNumber: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Headquarters Address
              </label>
              <input
                type="text"
                value={settings.headquartersAddress}
                onChange={(e) => setSettings({ ...settings, headquartersAddress: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Communications & Contact */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Mail className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">Communication & Notifications</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primary Inquiry Email
              </label>
              <input
                type="email"
                value={settings.primaryEmail}
                onChange={(e) => setSettings({ ...settings, primaryEmail: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Support Desk
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                24/7 Telephone Hotline
              </label>
              <input
                type="text"
                value={settings.phoneHotline}
                onChange={(e) => setSettings({ ...settings, phoneHotline: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Financial & Policies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">Commerce & Booking Policies</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="LKR">LKR (Rs)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
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
                value={settings.vatTaxPercentage}
                onChange={(e) => setSettings({ ...settings, vatTaxPercentage: parseFloat(e.target.value) || 0 })}
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
                value={settings.bookingDepositPercent}
                onChange={(e) => setSettings({ ...settings, bookingDepositPercent: parseFloat(e.target.value) || 30 })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4. Platform Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">Security & Maintenance</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Maintenance Mode</span>
                <span className="text-[11px] text-slate-500">Show maintenance landing screen to public visitors</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableMaintenanceMode}
                onChange={(e) => setSettings({ ...settings, enableMaintenanceMode: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Automated Stock Alerts</span>
                <span className="text-[11px] text-slate-500">Notify operations team on low warehouse quantities</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableStockAlertEmails}
                onChange={(e) => setSettings({ ...settings, enableStockAlertEmails: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Daily Audit Backup Snapshots</span>
                <span className="text-[11px] text-slate-500">Generate encrypted snapshots of orders and bookings</span>
              </div>
              <input
                type="checkbox"
                checked={settings.dailyBackupEnabled}
                onChange={(e) => setSettings({ ...settings, dailyBackupEnabled: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
