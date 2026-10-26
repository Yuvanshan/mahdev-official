import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/layout/SEOHead';
import { AuthAlert, AuthField, AuthSubmit, PasswordField } from '../components/auth/AuthFields';
import { MIN_PASSWORD_LENGTH, passwordPolicyError } from '../services/authService';
import { markAccountDataStale } from '../services/customerAccountService';
import {
  checkCustomerDetails,
  confirmOrder,
  getPublicConfirmation,
  type AvailabilityResult,
  type PublicConfirmation,
} from '../services/orderConfirmationService';
import { normaliseNic, normaliseSriLankaPhone, parseNic } from '../utils/sriLankaIdentity';
import { formatCurrency } from '../utils/currency';
import { CANONICAL_SITE_ORIGIN } from '../config/site';

interface ConfirmOrderViewProps {
  token: string;
  onNavigate: (path: string) => void;
}

type CheckState = 'idle' | 'checking' | AvailabilityResult | 'error';
type FieldErrors = Partial<Record<'fullName' | 'nic' | 'phone' | 'email' | 'password' | 'confirmPassword' | 'agreeToTerms', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDate = (iso: string) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/**
 * Asks the server whether `value` is already registered, 500 ms after the
 * customer stops typing. Only runs once the value is locally valid.
 */
function useAvailability(token: string, field: 'email' | 'nic', value: string, enabled: boolean): CheckState {
  const [state, setState] = useState<CheckState>('idle');
  useEffect(() => {
    if (!enabled) {
      setState('idle');
      return;
    }
    let cancelled = false;
    setState('checking');
    const timer = window.setTimeout(() => {
      checkCustomerDetails(token, { [field]: value })
        .then((result) => !cancelled && setState(result[field] || 'error'))
        .catch(() => !cancelled && setState('error'));
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [token, field, value, enabled]);
  return state;
}

export const ConfirmOrderView: React.FC<ConfirmOrderViewProps> = ({ token, onNavigate }) => {
  const { user, isAuthenticated, isLoading: authLoading, register } = useAuth();
  const [confirmation, setConfirmation] = useState<PublicConfirmation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const [form, setForm] = useState({
    fullName: '',
    nic: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    notes: '',
    agreeToTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderId: string; emailSent?: boolean } | null>(null);
  const prefilled = useRef(false);

  const loginPath = `/login?redirect=${encodeURIComponent(`/confirm-order/${token}`)}`;

  useEffect(() => {
    let cancelled = false;
    getPublicConfirmation(token)
      .then((data) => {
        if (cancelled) return;
        setConfirmation(data);
        // Prefill what the admin already knows; the customer can change it.
        if (!prefilled.current) {
          prefilled.current = true;
          setForm((current) => ({
            ...current,
            fullName: data.customerName || '',
            email: data.customerEmail || '',
            phone: data.customerPhone ? data.customerPhone.replace(/^\+94/, '0') : '',
            address: data.venue || '',
          }));
        }
      })
      .catch((error: Error) => !cancelled && setLoadError(error.message));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const isPending = confirmation?.status === 'pending';
  const nicValid = Boolean(parseNic(form.nic));
  const emailValid = EMAIL_PATTERN.test(form.email.trim());
  // Live checks only matter for new customers on an open link.
  const checksEnabled = isPending && !isAuthenticated && !result;
  const emailCheck = useAvailability(token, 'email', form.email.trim().toLowerCase(), checksEnabled && emailValid);
  const nicCheck = useAvailability(token, 'nic', normaliseNic(form.nic), checksEnabled && nicValid);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const signedInMissing = useMemo(() => {
    if (!user) return [];
    return [!user.phone && 'contact number', !user.nic && 'NIC'].filter(Boolean) as string[];
  }, [user]);

  const finish = async () => {
    const confirmed = await confirmOrder(token, { address: form.address.trim(), notes: form.notes.trim() });
    markAccountDataStale();
    setResult(confirmed);
    setConfirmation((current) => (current ? { ...current, status: 'confirmed', orderId: confirmed.orderId } : current));
  };

  const validateNewCustomer = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (form.fullName.trim().length < 3) errors.fullName = 'Enter your full name.';
    if (!nicValid) errors.nic = 'Enter a valid NIC, e.g. 951234567V or 199512345678.';
    else if (nicCheck === 'taken') errors.nic = 'This NIC is already registered. Please sign in to confirm.';
    if (!normaliseSriLankaPhone(form.phone)) errors.phone = 'Enter a valid Sri Lankan number, e.g. 077 123 4567.';
    if (!emailValid) errors.email = 'Enter a valid email address.';
    else if (emailCheck === 'taken') errors.email = 'This email already has an account. Please sign in to confirm.';
    const passwordProblem = passwordPolicyError(form.password);
    if (passwordProblem) errors.password = passwordProblem;
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
    if (!form.agreeToTerms) errors.agreeToTerms = 'Please accept the Terms and Privacy Policy.';
    return errors;
  };

  const handleNewCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    const errors = validateNewCustomer();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSubmitting(true);
    try {
      // 1. Create the account (the server also refuses a NIC that is already registered).
      const registered = await register({
        fullName: form.fullName,
        nic: form.nic,
        phone: form.phone,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        agreeToTerms: form.agreeToTerms,
        accountType: 'individual',
      });
      if (!registered.success) {
        const message = registered.error || 'Could not create your account. Please try again.';
        if (/NIC/i.test(message)) setFieldErrors({ nic: message });
        else if (/email/i.test(message)) setFieldErrors({ email: message });
        else setErrorMessage(message);
        return;
      }
      // 2. Confirm the order on the new account.
      await finish();
    } catch (error) {
      // The account exists now; the signed-in panel lets them retry the confirmation.
      setErrorMessage(error instanceof Error ? `Your account was created, but the order could not be confirmed: ${error.message}` : 'Please try confirming again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignedIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!form.agreeToTerms) {
      setFieldErrors({ agreeToTerms: 'Please accept the Terms and Privacy Policy.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await finish();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not confirm your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkHint = (state: CheckState, label: string) => {
    if (state === 'checking') return <span className="flex items-center gap-1.5 text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> Checking…</span>;
    if (state === 'available') return <span className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> {label} is available.</span>;
    return undefined;
  };

  const takenError = (state: CheckState, label: string) =>
    state === 'taken' ? `This ${label} is already registered. Please sign in to confirm your order.` : state === 'invalid' ? `This ${label} is not valid.` : null;

  if (loadError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <SEOHead title="Confirm Your Order" description="Confirm your Mahdev order." canonicalUrl={`${CANONICAL_SITE_ORIGIN}/confirm-order`} noIndex />
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="font-display text-lg font-bold text-slate-900">Link not available</h1>
          <p className="text-sm text-slate-600">{loadError}</p>
          <p className="text-xs text-slate-500">If you think this is a mistake, please contact us on WhatsApp and we will send you a new link.</p>
        </div>
      </div>
    );
  }

  if (!confirmation) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-label="Loading your order" />
      </div>
    );
  }

  const images = confirmation.designImages || [];

  return (
    <div className="bg-slate-50 min-h-screen py-10 sm:py-14 px-4">
      <SEOHead title="Confirm Your Order" description="Review your design and confirm your Mahdev order." canonicalUrl={`${CANONICAL_SITE_ORIGIN}/confirm-order`} noIndex />
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Design & decoration details */}
        <section className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                {confirmation.divisionName}
              </span>
              <h1 className="font-display text-2xl font-bold text-slate-900 mt-3">{confirmation.title}</h1>
              <p className="text-xs text-slate-500 mt-1">Reference {confirmation.reference}</p>
            </div>

            {images.length > 0 && (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={images[activeImage]} alt={`Design for ${confirmation.title}`} className="w-full max-h-[480px] object-contain" />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 ${index === activeImage ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        aria-label={`Show design image ${index + 1}`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(confirmation.eventDate || confirmation.eventTime || confirmation.venue) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                {confirmation.eventDate && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" /> {formatDate(confirmation.eventDate)}
                  </div>
                )}
                {confirmation.eventTime && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <Clock className="w-4 h-4 text-purple-600 shrink-0" /> {confirmation.eventTime}
                  </div>
                )}
                {confirmation.venue && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" /> {confirmation.venue}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h2 className="font-display text-sm font-bold text-slate-900">Decoration details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit price</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {confirmation.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && <div className="text-[11px] text-slate-500 whitespace-pre-line mt-0.5">{item.description}</div>}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unitPrice, 'LKR')}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(item.unitPrice * item.quantity, 'LKR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex justify-end">
              <div className="w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{formatCurrency(confirmation.subtotal, 'LKR')}</span></div>
                {confirmation.discount > 0 && (
                  <div className="flex justify-between text-emerald-700"><span>Discount</span><span className="font-mono">-{formatCurrency(confirmation.discount, 'LKR')}</span></div>
                )}
                {confirmation.deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-600"><span>Transport & setup</span><span className="font-mono">{formatCurrency(confirmation.deliveryFee, 'LKR')}</span></div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span><span className="font-mono text-[#0052FF]">{formatCurrency(confirmation.total, 'LKR')}</span>
                </div>
                {confirmation.advanceAmount > 0 && (
                  <div className="flex justify-between text-slate-600"><span>Advance to reserve the date</span><span className="font-mono font-bold">{formatCurrency(confirmation.advanceAmount, 'LKR')}</span></div>
                )}
              </div>
            </div>
            {confirmation.notes && (
              <div className="mx-5 sm:mx-6 mb-5 text-xs text-slate-600 bg-amber-50/70 border border-amber-100 rounded-xl p-3 whitespace-pre-line">
                {confirmation.notes}
              </div>
            )}
          </div>
        </section>

        {/* Confirmation panel */}
        <aside className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 lg:sticky lg:top-24 space-y-4">
            {confirmation.status === 'confirmed' ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-bold text-slate-900">Your order is confirmed</h2>
                  {confirmation.orderId && <p className="text-sm text-slate-600">Order reference <strong className="font-mono">{confirmation.orderId}</strong></p>}
                  {result && (
                    <p className="text-xs text-slate-500">
                      {result.emailSent
                        ? 'We have emailed your confirmation. Our team will also message you on WhatsApp.'
                        : 'Our team will message you on WhatsApp shortly with your confirmation.'}
                    </p>
                  )}
                </div>
                {isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => onNavigate('/account/orders')} className="rounded-xl bg-[#0052FF] text-white text-sm font-semibold py-3 hover:bg-blue-700">
                      Track progress
                    </button>
                    <button type="button" onClick={() => onNavigate('/account/invoices')} className="rounded-xl border border-slate-300 text-slate-800 text-sm font-semibold py-3 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5">
                      <FileText className="w-4 h-4" /> Invoice
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => onNavigate('/login?redirect=/account/orders')} className="w-full rounded-xl bg-[#0052FF] text-white text-sm font-semibold py-3 hover:bg-blue-700">
                    Sign in to see your order
                  </button>
                )}
              </div>
            ) : !isPending ? (
              <div className="text-center space-y-3 py-6">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {confirmation.status === 'expired' ? 'This link has expired' : 'This link is no longer active'}
                </h2>
                <p className="text-sm text-slate-600">Please contact us and we will send you a new confirmation link.</p>
              </div>
            ) : authLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
            ) : isAuthenticated && user ? (
              <form onSubmit={handleSignedIn} noValidate className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">Confirm your order</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Signed in as <strong>{user.fullName}</strong> ({user.email}).
                  </p>
                </div>
                <AuthAlert tone="error" message={errorMessage} />
                {signedInMissing.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">Please add your {signedInMissing.join(' and ')} to your account before confirming.</p>
                    <button
                      type="button"
                      onClick={() => onNavigate(`/account/complete?redirect=${encodeURIComponent(`/confirm-order/${token}`)}`)}
                      className="w-full rounded-xl bg-[#0052FF] text-white text-sm font-semibold py-3 hover:bg-blue-700"
                    >
                      Complete my details
                    </button>
                  </div>
                ) : (
                  <>
                    <ExtraFields form={form} update={update} />
                    <TermsCheckbox checked={form.agreeToTerms} onChange={(checked) => update('agreeToTerms', checked)} error={fieldErrors.agreeToTerms} />
                    <AuthSubmit busy={isSubmitting} busyLabel="Confirming…">
                      <ShieldCheck className="h-4 w-4" /> Confirm my order
                    </AuthSubmit>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={handleNewCustomer} noValidate className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">Your details</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    We will create your Mahdev account so you can follow your order and download your invoice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(loginPath)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LogIn className="w-4 h-4" /> I already have an account
                </button>
                <AuthAlert tone="error" message={errorMessage} />
                <AuthField
                  label="Full name"
                  autoComplete="name"
                  icon={<User className="h-4 w-4" />}
                  placeholder="As shown on your NIC"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  error={fieldErrors.fullName}
                />
                <AuthField
                  label="NIC number"
                  icon={<CreditCard className="h-4 w-4" />}
                  placeholder="951234567V or 199512345678"
                  autoComplete="off"
                  maxLength={14}
                  value={form.nic}
                  onChange={(e) => update('nic', e.target.value.toUpperCase())}
                  error={fieldErrors.nic || takenError(nicCheck, 'NIC')}
                  hint={checkHint(nicCheck, 'NIC')}
                />
                <AuthField
                  label="Contact number (WhatsApp)"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="077 123 4567"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  error={fieldErrors.phone}
                />
                <AuthField
                  label="Email address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  error={fieldErrors.email || takenError(emailCheck, 'email')}
                  hint={checkHint(emailCheck, 'Email')}
                />
                {(emailCheck === 'taken' || nicCheck === 'taken') && (
                  <button
                    type="button"
                    onClick={() => onNavigate(loginPath)}
                    className="w-full rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold py-2.5 hover:bg-amber-100"
                  >
                    Sign in to confirm with your existing account
                  </button>
                )}
                <PasswordField
                  label="Create a password"
                  autoComplete="new-password"
                  placeholder={`${MIN_PASSWORD_LENGTH}+ characters, letters and numbers`}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  error={fieldErrors.password}
                  showStrength
                />
                <PasswordField
                  label="Confirm password"
                  autoComplete="new-password"
                  placeholder="Type it again"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  error={fieldErrors.confirmPassword}
                />
                <ExtraFields form={form} update={update} />
                <TermsCheckbox checked={form.agreeToTerms} onChange={(checked) => update('agreeToTerms', checked)} error={fieldErrors.agreeToTerms} />
                <AuthSubmit busy={isSubmitting} busyLabel="Creating account & confirming…" disabled={emailCheck === 'taken' || nicCheck === 'taken'}>
                  <ShieldCheck className="h-4 w-4" /> Create account & confirm order
                </AuthSubmit>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

/** Event address and notes, shared by the new-customer and signed-in forms. */
const ExtraFields: React.FC<{
  form: { address: string; notes: string };
  update: (key: 'address' | 'notes', value: string) => void;
}> = ({ form, update }) => (
  <>
    <AuthField
      label="Event / delivery address"
      icon={<MapPin className="h-4 w-4" />}
      placeholder="Venue or address for setup"
      value={form.address}
      onChange={(e) => update('address', e.target.value)}
      maxLength={300}
    />
    <div className="space-y-1.5">
      <label htmlFor="confirm-notes" className="block text-xs font-semibold text-slate-700">Notes for our team (optional)</label>
      <textarea
        id="confirm-notes"
        rows={3}
        maxLength={1000}
        value={form.notes}
        onChange={(e) => update('notes', e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/15"
        placeholder="Anything we should know"
      />
    </div>
  </>
);

const TermsCheckbox: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; error?: string }> = ({ checked, onChange, error }) => (
  <div>
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <span>
        I confirm the design and details above and agree to the{' '}
        <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Terms</a> and{' '}
        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Privacy Policy</a>.
      </span>
    </label>
    {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
  </div>
);
