import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CalendarDays, CheckCircle2, CreditCard, MapPin, Phone, User, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/layout/SEOHead';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, AuthSubmit } from '../../components/auth/AuthFields';
import { ProgressRing } from '../../components/account/ProgressRing';
import { getProfileCompletion, hasRealName } from '../../utils/profileCompletion';
import { ageFromDateOfBirth, formatSriLankaPhone, normaliseNic, normaliseSriLankaPhone, parseNic } from '../../utils/sriLankaIdentity';
import { CANONICAL_SITE_ORIGIN } from '../../config/site';

interface CompleteProfileViewProps {
  onNavigate: (path: string) => void;
  /** Where to continue afterwards (same-site path). */
  redirectPath?: string;
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Asks a signed-in customer for the details their account is missing — typically
 * after "Continue with Google", which only shares a name and email. Can be skipped;
 * the account pages keep showing a reminder until it is done.
 */
export const CompleteProfileView: React.FC<CompleteProfileViewProps> = ({ onNavigate, redirectPath = '/account' }) => {
  const { user, completeProfile } = useAuth();
  const next = redirectPath.startsWith('/') && !redirectPath.startsWith('//') && !redirectPath.startsWith('/account/complete') ? redirectPath : '/account';

  const [form, setForm] = useState(() => ({
    fullName: user && hasRealName(user) ? user.fullName : '',
    nic: '',
    phone: user?.phone ? formatSriLankaPhone(user.phone) : '',
    city: user?.address?.city || '',
  }));
  const [errors, setErrors] = useState<{ fullName?: string; nic?: string; phone?: string }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const nicDetails = useMemo(() => parseNic(form.nic), [form.nic]);
  const nicLooksComplete = /^(\d{9}[VvXx]|\d{12})$/.test(normaliseNic(form.nic));
  const completion = user ? getProfileCompletion(user) : null;

  // Nothing missing (e.g. opened again later): continue straight away.
  useEffect(() => {
    if (completion?.isComplete && !saved) onNavigate(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || !completion) return null;
  const needsNic = !user.nic;

  // Live percentage as the form is filled in (saved items plus valid new entries).
  const livePercent = Math.round(
    (completion.items.filter((item) => {
      if (item.key === 'fullName') return form.fullName.trim().length >= 3;
      if (item.key === 'phone') return Boolean(normaliseSriLankaPhone(form.phone));
      if (item.key === 'nic') return !needsNic || Boolean(nicDetails);
      return item.done;
    }).length / completion.items.length) * 100
  );

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const found: typeof errors = {};
    if (form.fullName.trim().length < 3) found.fullName = 'Enter your full name as shown on your NIC.';
    if (needsNic && !nicDetails) found.nic = 'Enter a valid NIC, e.g. 951234567V or 199512345678.';
    if (!normaliseSriLankaPhone(form.phone)) found.phone = 'Enter a valid Sri Lankan number, e.g. 077 123 4567.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSaving(true);
    const result = await completeProfile({
      fullName: form.fullName,
      phone: form.phone,
      nic: needsNic ? form.nic : undefined,
      address: form.city.trim() ? { city: form.city.trim() } : undefined,
    });
    setIsSaving(false);
    if (!result.success) {
      const message = result.error || 'Could not save your details.';
      if (/NIC/i.test(message)) setErrors({ nic: message });
      else setErrorMessage(message);
      return;
    }
    setSaved(true);
    setTimeout(() => onNavigate(next), 1400);
  };

  return (
    <>
      <SEOHead title="Complete Your Profile" description="Complete your Mahdev profile." canonicalUrl={`${CANONICAL_SITE_ORIGIN}/account/complete`} noIndex />
      <AuthShell
        icon={<UserCheck className="h-6 w-6" />}
        title={saved ? 'All set!' : 'Complete your profile'}
        subtitle={saved ? 'Thank you. Taking you to your account…' : 'A few details so we can confirm your bookings and orders.'}
        footer={
          !saved && (
            <button type="button" onClick={() => onNavigate(next)} className="font-semibold text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline">
              Skip for now
            </button>
          )
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {saved ? (
            <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center py-6 text-emerald-600">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
                <CheckCircle2 className="h-20 w-20" aria-hidden="true" />
              </motion.span>
            </motion.div>
          ) : (
            <motion.form key="form" exit={{ opacity: 0 }} onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl bg-blue-50 p-4 text-[#0052FF]">
                <ProgressRing percent={livePercent} />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Your profile is {livePercent}% complete</p>
                  <p className="text-xs text-slate-500">Signed in as {user.email}</p>
                </div>
              </div>

              <AuthAlert tone="error" message={errorMessage} />

              <AuthField
                label="Full name"
                autoComplete="name"
                icon={<User className="h-4 w-4" />}
                placeholder="As shown on your NIC"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                error={errors.fullName}
                autoFocus={!form.fullName}
              />

              {needsNic && (
                <>
                  <AuthField
                    label="NIC number"
                    icon={<CreditCard className="h-4 w-4" />}
                    placeholder="951234567V or 199512345678"
                    autoComplete="off"
                    maxLength={14}
                    value={form.nic}
                    onChange={(e) => update('nic', e.target.value.toUpperCase())}
                    error={errors.nic || (nicLooksComplete && !nicDetails ? 'This NIC number is not valid.' : null)}
                    hint="Your date of birth and gender are read from your NIC. It can't be changed later."
                  />
                  <AnimatePresence>
                    {nicDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3">
                          {[
                            { icon: CalendarDays, label: 'Born', value: formatDate(nicDetails.dateOfBirth) },
                            { icon: Users, label: 'Gender', value: nicDetails.gender === 'female' ? 'Female' : 'Male' },
                            { icon: CheckCircle2, label: 'Age', value: `${ageFromDateOfBirth(nicDetails.dateOfBirth)}` },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="min-w-0">
                              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                <Icon className="h-3 w-3" aria-hidden="true" /> {label}
                              </span>
                              <span className="block truncate text-sm font-semibold text-slate-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              <AuthField
                label="Contact number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                icon={<Phone className="h-4 w-4" />}
                placeholder="077 123 4567"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                error={errors.phone}
              />
              <AuthField
                label="City (optional)"
                autoComplete="address-level2"
                icon={<MapPin className="h-4 w-4" />}
                placeholder="Trincomalee"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />

              <AuthSubmit busy={isSaving} busyLabel="Saving…">
                Save and continue <ArrowRight className="h-4 w-4" />
              </AuthSubmit>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthShell>
    </>
  );
};
