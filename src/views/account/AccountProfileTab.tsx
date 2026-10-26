import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BadgeCheck,
  Building,
  CalendarDays,
  CreditCard,
  KeyRound,
  Lock,
  MailWarning,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  User,
} from 'lucide-react';
import { CustomerUser } from '../../types/customer';
import { useAuth } from '../../context/AuthContext';
import { ImageUploader } from '../../components/common/ImageUploader';
import { AuthAlert, AuthField, PasswordField } from '../../components/auth/AuthFields';
import { MIN_PASSWORD_LENGTH } from '../../services/authService';
import { ageFromDateOfBirth, formatSriLankaPhone, normaliseSriLankaPhone, parseNic } from '../../utils/sriLankaIdentity';
import { doc, setDoc } from '../../lib/tursoFirestore';
import { db } from '../../lib/firebase';

interface AccountProfileTabProps {
  user: CustomerUser;
}

const formatDate = (iso?: string) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

/** Masks all but the last 4 characters, e.g. ••••••567V, until the customer chooses to show it. */
const maskNic = (nic: string) => `${'•'.repeat(Math.max(0, nic.length - 4))}${nic.slice(-4)}`;

const Section: React.FC<{ icon: React.ElementType; title: string; subtitle?: string; delay?: number; children: React.ReactNode; tone?: string }> = ({
  icon: Icon,
  title,
  subtitle,
  delay = 0,
  children,
  tone = 'text-blue-600 bg-blue-50',
}) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8"
    >
      <header className="flex items-start gap-3 border-b border-slate-100 pb-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </header>
      {children}
    </motion.section>
  );
};

export const AccountProfileTab: React.FC<AccountProfileTabProps> = ({ user }) => {
  const { updateProfile, changePassword, sendVerificationEmail, refreshEmailVerification, refreshUser } = useAuth();

  // ---- Personal details, address and preferences ----
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phone: user.phone ? formatSriLankaPhone(user.phone) : '',
    company: user.company || '',
    avatarUrl: user.avatarUrl || '',
    address: {
      street: user.address?.street || '',
      apartment: user.address?.apartment || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || 'Sri Lanka',
    },
    preferences: {
      ...user.preferences,
      currency: 'LKR' as const,
      preferredContactMethod: user.preferences?.preferredContactMethod || 'whatsapp',
      orderNotifications: user.preferences?.orderNotifications ?? true,
      promotionalUpdates: user.preferences?.promotionalUpdates ?? true,
    },
  });
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const setAddress = (key: keyof typeof formData.address, value: string) =>
    setFormData((current) => ({ ...current, address: { ...current.address, [key]: value } }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    const errors: typeof profileErrors = {};
    if (formData.fullName.trim().length < 3) errors.fullName = 'Enter your full name.';
    if (formData.phone && !normaliseSriLankaPhone(formData.phone)) errors.phone = 'Enter a valid Sri Lankan number.';
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;

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
    setProfileMessage(result.success
      ? { tone: 'success', text: 'Your profile has been saved.' }
      : { tone: 'error', text: result.error || 'Could not save your profile.' });
    if (result.success) setTimeout(() => setProfileMessage(null), 4000);
  };

  // ---- Identity (NIC) ----
  const [showNic, setShowNic] = useState(false);
  const [nicInput, setNicInput] = useState('');
  const [nicError, setNicError] = useState<string | null>(null);
  const [isSavingNic, setIsSavingNic] = useState(false);
  const nicPreview = useMemo(() => parseNic(nicInput), [nicInput]);
  const age = user.dateOfBirth ? ageFromDateOfBirth(user.dateOfBirth) : null;

  // Accounts created before NIC registration can add it once; the server derives the rest.
  const handleAddNic = async () => {
    setNicError(null);
    if (!nicPreview) {
      setNicError('Enter a valid NIC, e.g. 951234567V or 199512345678.');
      return;
    }
    setIsSavingNic(true);
    try {
      await setDoc(doc(db, 'users', user.uid || user.id), { nic: nicPreview.nic, updatedAt: new Date().toISOString() }, { merge: true });
      // Reload the profile so the server-derived date of birth and gender appear.
      window.location.reload();
    } catch (err) {
      setNicError(err instanceof Error ? err.message : 'Could not save your NIC.');
      setIsSavingNic(false);
    }
  };

  // ---- Security ----
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [passwordMessage, setPasswordMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [isVerifyBusy, setIsVerifyBusy] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    const errors: typeof passwordErrors = {};
    if (!passwords.current) errors.current = 'Enter your current password.';
    if (passwords.next.length < MIN_PASSWORD_LENGTH) errors.next = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (passwords.next === passwords.current) errors.next = 'Choose a password different from your current one.';
    if (passwords.confirm !== passwords.next) errors.confirm = 'Passwords do not match.';
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setIsChangingPassword(true);
    const result = await changePassword(passwords.current, passwords.next);
    setIsChangingPassword(false);
    if (result.success) {
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordMessage({ tone: 'success', text: 'Your password has been changed.' });
    } else {
      setPasswordMessage({ tone: 'error', text: result.error || 'Could not change your password.' });
    }
  };

  const handleResendVerification = async () => {
    setIsVerifyBusy(true);
    const result = await sendVerificationEmail();
    setIsVerifyBusy(false);
    setVerifyMessage(result.success
      ? { tone: 'success', text: `A new confirmation link was sent to ${user.email}.` }
      : { tone: 'error', text: result.error || 'Could not send the email.' });
  };

  const handleCheckVerification = async () => {
    setIsVerifyBusy(true);
    const verified = await refreshEmailVerification().catch(() => false);
    setIsVerifyBusy(false);
    refreshUser();
    setVerifyMessage(verified
      ? { tone: 'success', text: 'Thank you, your email address is confirmed.' }
      : { tone: 'error', text: 'Not confirmed yet. Please open the link in the email we sent you.' });
  };

  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-xs transition hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/15';

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Profile header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061033] via-[#0b1f5c] to-[#0052FF] p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8"
      >
        <div aria-hidden="true" className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt={user.fullName} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/20" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 font-display text-2xl font-bold ring-4 ring-white/10">
              {user.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-2xl font-bold">{user.fullName}</h2>
            <p className="truncate text-sm text-blue-100/90">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              {user.emailVerified ? (
                <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-emerald-100 ring-1 ring-emerald-300/30">
                  <BadgeCheck className="h-3.5 w-3.5" /> Email verified
                </motion.span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-amber-100 ring-1 ring-amber-300/30">
                  <MailWarning className="h-3.5 w-3.5" /> Email not verified
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <CalendarDays className="h-3.5 w-3.5" /> Member since {formatDate(user.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <User className="h-3.5 w-3.5" /> {user.accountType === 'corporate' ? 'Business account' : 'Personal account'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Identity (read-only) */}
      <Section icon={CreditCard} title="Identity" subtitle="From your National Identity Card. These details cannot be edited here." tone="text-emerald-700 bg-emerald-50" delay={0.05}>
        {user.nic ? (
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              {
                label: 'NIC number',
                value: (
                  <button type="button" onClick={() => setShowNic((v) => !v)} className="font-mono underline-offset-4 hover:underline" aria-label={showNic ? 'Hide NIC number' : 'Show NIC number'}>
                    {showNic ? user.nic : maskNic(user.nic)}
                  </button>
                ),
              },
              { label: 'Date of birth', value: formatDate(user.dateOfBirth) },
              { label: 'Gender', value: user.gender === 'female' ? 'Female' : user.gender === 'male' ? 'Male' : '—' },
              { label: 'Age', value: age !== null ? `${age} years` : '—' },
            ].map(({ label, value }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.06 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5"
              >
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <Lock className="h-3 w-3" aria-hidden="true" /> {label}
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-slate-900">{value}</span>
              </motion.div>
            ))}
            <p className="text-xs text-slate-500 sm:col-span-4">
              Something wrong? Please contact us and we will correct it after checking your NIC.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Add your NIC to complete your profile. You can only add it once.</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1">
                <AuthField
                  label="NIC number"
                  icon={<CreditCard className="h-4 w-4" />}
                  placeholder="951234567V or 199512345678"
                  maxLength={14}
                  value={nicInput}
                  onChange={(e) => {
                    setNicInput(e.target.value.toUpperCase());
                    setNicError(null);
                  }}
                  error={nicError}
                  hint={nicPreview ? `Born ${formatDate(nicPreview.dateOfBirth)} · ${nicPreview.gender === 'female' ? 'Female' : 'Male'}` : undefined}
                />
              </div>
              <button
                type="button"
                onClick={handleAddNic}
                disabled={isSavingNic}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isSavingNic ? 'Saving…' : 'Add NIC'}
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* 3. Personal details, address and preferences */}
      <form onSubmit={handleSave} noValidate className="space-y-6">
        <Section icon={User} title="Personal details" subtitle="How we address you and reach you about bookings." delay={0.1}>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              label="Full name"
              autoComplete="name"
              icon={<User className="h-4 w-4" />}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              error={profileErrors.fullName}
            />
            <AuthField
              label="Contact number"
              type="tel"
              autoComplete="tel"
              icon={<Phone className="h-4 w-4" />}
              placeholder="077 123 4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={profileErrors.phone}
            />
            <AuthField
              label="Company (optional)"
              autoComplete="organization"
              icon={<Building className="h-4 w-4" />}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">Email address</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
          <div className="pt-1">
            <ImageUploader
              category="users"
              subfolder={user.id || user.uid}
              targetUserId={user.id || user.uid}
              currentImageUrl={formData.avatarUrl}
              onUploadSuccess={(item) => setFormData((prev) => ({ ...prev, avatarUrl: item.url }))}
              label="Profile photo"
              helperText="JPEG, PNG or WebP. It is resized and compressed automatically."
              options={{ maxWidth: 600, maxHeight: 600, quality: 0.9, targetFormat: 'image/webp' }}
            />
          </div>
        </Section>

        <Section icon={MapPin} title="Delivery address" subtitle="Used for Mahdev Mart deliveries and on-site bookings." tone="text-amber-700 bg-amber-50" delay={0.15}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-700">Street address</span>
              <input className={inputClass} autoComplete="address-line1" value={formData.address.street} onChange={(e) => setAddress('street', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">Apartment, floor (optional)</span>
              <input className={inputClass} autoComplete="address-line2" value={formData.address.apartment} onChange={(e) => setAddress('apartment', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">City</span>
              <input className={inputClass} autoComplete="address-level2" placeholder="Trincomalee" value={formData.address.city} onChange={(e) => setAddress('city', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">Province</span>
              <input className={inputClass} autoComplete="address-level1" placeholder="Eastern Province" value={formData.address.state} onChange={(e) => setAddress('state', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">Postal code</span>
              <input className={`${inputClass} font-mono`} autoComplete="postal-code" value={formData.address.postalCode} onChange={(e) => setAddress('postalCode', e.target.value)} />
            </label>
          </div>
        </Section>

        <Section icon={Settings2} title="Preferences" tone="text-purple-700 bg-purple-50" delay={0.2}>
          <label className="block space-y-1.5 sm:max-w-sm">
            <span className="block text-xs font-semibold text-slate-700">Preferred way to contact you</span>
            <select
              className={inputClass}
              value={formData.preferences.preferredContactMethod}
              onChange={(e) =>
                setFormData({ ...formData, preferences: { ...formData.preferences, preferredContactMethod: e.target.value as 'email' | 'phone' | 'whatsapp' } })
              }
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="phone">Phone call</option>
            </select>
          </label>
          {[
            { key: 'orderNotifications' as const, title: 'Order and booking updates', text: 'Tell me when an order ships or a booking is confirmed.' },
            { key: 'promotionalUpdates' as const, title: 'Offers and news', text: 'Occasional promotions from Mahdev divisions.' },
          ].map(({ key, title, text }) => (
            <label key={key} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span>
                <span className="block text-sm font-semibold text-slate-900">{title}</span>
                <span className="block text-xs text-slate-500">{text}</span>
              </span>
              {/* Animated switch */}
              <span className="relative inline-flex h-6 w-11 shrink-0">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={formData.preferences[key]}
                  onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, [key]: e.target.checked } })}
                />
                <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#0052FF] peer-focus-visible:ring-4 peer-focus-visible:ring-blue-600/20" />
                <motion.span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  initial={false}
                  animate={{ left: formData.preferences[key] ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              </span>
            </label>
          ))}
        </Section>

        <div className="sticky bottom-4 z-10 space-y-3">
          <AuthAlert tone={profileMessage?.tone || 'success'} message={profileMessage?.text || null} />
          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={isSaving ? undefined : { y: -1 }}
              whileTap={isSaving ? undefined : { scale: 0.98 }}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#0052FF] to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save changes'}
            </motion.button>
          </div>
        </div>
      </form>

      {/* 4. Security */}
      <Section icon={ShieldCheck} title="Security" subtitle="Email confirmation and password." tone="text-rose-700 bg-rose-50" delay={0.25}>
        <AnimatePresence initial={false}>
          {!user.emailVerified && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-start gap-2 text-sm text-amber-900">
                  <MailWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Please confirm your email address using the link we sent to {user.email}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleResendVerification} disabled={isVerifyBusy} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 transition hover:bg-amber-100 disabled:opacity-60">
                    Resend link
                  </button>
                  <button type="button" onClick={handleCheckVerification} disabled={isVerifyBusy} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60">
                    <RefreshCw className={`h-3.5 w-3.5 ${isVerifyBusy ? 'animate-spin' : ''}`} /> I have confirmed it
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AuthAlert tone={verifyMessage?.tone || 'success'} message={verifyMessage?.text || null} />

        <form onSubmit={handleChangePassword} noValidate className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" /> Change password
          </h4>
          <AuthAlert tone={passwordMessage?.tone || 'success'} message={passwordMessage?.text || null} />
          <div className="grid gap-4 sm:grid-cols-3">
            <PasswordField
              label="Current password"
              autoComplete="current-password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              error={passwordErrors.current}
            />
            <PasswordField
              label="New password"
              autoComplete="new-password"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
              error={passwordErrors.next}
              showStrength
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              error={passwordErrors.confirm}
            />
          </div>
          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={isChangingPassword}
              whileTap={{ scale: 0.98 }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isChangingPassword ? 'Updating…' : 'Update password'}
            </motion.button>
          </div>
        </form>
      </Section>
    </div>
  );
};
