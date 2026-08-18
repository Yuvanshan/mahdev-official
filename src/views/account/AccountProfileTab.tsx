import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  Shield,
  Save,
  Globe,
  Bell,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { CustomerUser } from '../../types/customer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

interface AccountProfileTabProps {
  user: CustomerUser;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
];

export const AccountProfileTab: React.FC<AccountProfileTabProps> = ({ user }) => {
  const { updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    company: user.company || '',
    avatarUrl: user.avatarUrl || AVATAR_PRESETS[0],
    address: {
      street: user.address?.street || '',
      apartment: user.address?.apartment || '',
      city: user.address?.city || 'Colombo',
      state: user.address?.state || 'Western Province',
      postalCode: user.address?.postalCode || '00700',
      country: user.address?.country || 'Sri Lanka',
    },
    preferences: {
      currency: user.preferences?.currency || 'USD',
      preferredContactMethod: user.preferences?.preferredContactMethod || 'whatsapp',
      orderNotifications: user.preferences?.orderNotifications ?? true,
      promotionalUpdates: user.preferences?.promotionalUpdates ?? true,
      smsAlerts: user.preferences?.smsAlerts ?? true,
      twoFactorEnabled: user.preferences?.twoFactorEnabled ?? false,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSaving(true);
    const result = await updateProfile({
      fullName: formData.fullName,
      phone: formData.phone,
      company: formData.company,
      avatarUrl: formData.avatarUrl,
      address: formData.address,
      preferences: formData.preferences,
    });
    setIsSaving(false);

    if (result.success) {
      setSuccessMessage('Profile and preferences updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(result.error || 'Failed to update profile.');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Toast Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* 1. Identity & Avatar */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="font-display text-sm font-bold text-slate-900">Personal & Corporate Identity</h3>
        </div>

        {/* Avatar Picker */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">Profile Avatar</label>
          <div className="flex items-center gap-4 flex-wrap">
            <img
              src={formData.avatarUrl}
              alt={formData.fullName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm shrink-0"
            />
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 block">Choose an executive avatar preset:</span>
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarUrl: preset })}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      formData.avatarUrl === preset
                        ? 'border-blue-600 scale-105 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 flex items-center justify-between">
              <span>Primary Email</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </label>
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Phone / WhatsApp Number *</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Company / Organization</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Ceylon Horizon Ventures PLC"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Default Shipping & Dispatch Address */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <h3 className="font-display text-sm font-bold text-slate-900">Default Shipping & Fulfillment Address</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2 space-y-1">
            <label className="font-semibold text-slate-700">Street Address</label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value },
                })
              }
              placeholder="42 Gregory Road"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Apartment / Suite / Floor</label>
            <input
              type="text"
              value={formData.address.apartment}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, apartment: e.target.value },
                })
              }
              placeholder="Suite 8B, Tower One"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">City</label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">State / Province</label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Postal Code / ZIP</label>
            <input
              type="text"
              value={formData.address.postalCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, postalCode: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Account Preferences */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Globe className="w-4 h-4 text-purple-600" />
          <h3 className="font-display text-sm font-bold text-slate-900">Preferences & Dispatch Channels</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Preferred Display Currency</label>
            <select
              value={formData.preferences.currency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: { ...formData.preferences, currency: e.target.value as any },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="USD">USD ($) — International Settlement</option>
              <option value="LKR">LKR (Rs) — Sri Lankan Rupees</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Preferred Support Channel</label>
            <select
              value={formData.preferences.preferredContactMethod}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    preferredContactMethod: e.target.value as any,
                  },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="whatsapp">24/7 WhatsApp Concierge</option>
              <option value="email">Corporate Email Dispatches</option>
              <option value="phone">Direct Phone Call</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Real-Time Order & Booking Tracking</span>
              <span className="text-[11px] text-slate-500">Receive instant push & email updates when orders are dispatched or services confirmed.</span>
            </div>
            <input
              type="checkbox"
              checked={formData.preferences.orderNotifications}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: { ...formData.preferences, orderNotifications: e.target.checked },
                })
              }
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Two-Factor Authentication (2FA)</span>
              <span className="text-[11px] text-slate-500">Require an SMS / Authenticator confirmation code for major invoice and booking updates.</span>
            </div>
            <input
              type="checkbox"
              checked={formData.preferences.twoFactorEnabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: { ...formData.preferences, twoFactorEnabled: e.target.checked },
                })
              }
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="electric"
          disabled={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          className="px-8 py-3 text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
        >
          {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
        </Button>
      </div>
    </form>
  );
};
