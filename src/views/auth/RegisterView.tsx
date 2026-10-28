import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Mail,
  Phone,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/layout/SEOHead';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, AuthSubmit, PasswordField } from '../../components/auth/AuthFields';
import { evaluateBotRisk, checkActionThrottle } from '../../utils/securityProtection';
import { notificationService } from '../../services/notificationService';
import { MIN_PASSWORD_LENGTH, passwordPolicyError } from '../../services/authService';
import { ageFromDateOfBirth, normaliseNic, normaliseSriLankaPhone, parseNic } from '../../utils/sriLankaIdentity';
import { CANONICAL_SITE_ORIGIN } from '../../config/site';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { postSignInPath } from '../../utils/profileCompletion';
import { checkAccountDetails, takenDetailErrors } from '../../services/accountCheckService';
import type { CustomerUser } from '../../types/customer';

interface RegisterViewProps {
  onNavigate: (path: string) => void;
}

type Step = 1 | 2 | 'done';
type FieldErrors = Partial<Record<'fullName' | 'nic' | 'phone' | 'email' | 'password' | 'confirmPassword' | 'agreeToTerms', string>>;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate }) => {
  const { register, user, isAuthenticated, consumeRedirectError } = useAuth();
  // Email registration shows its own success screen; only other sign-ins move on automatically.
  const emailRegistrationStarted = useRef(false);
  const hasNavigated = useRef(false);
  const goOn = (signedIn: CustomerUser) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    onNavigate(postSignInPath(signedIn));
  };
  const reduceMotion = useReducedMotion();
  const [formRenderTime] = useState<number>(() => Date.now());
  const [honeypotValue, setHoneypotValue] = useState('');

  const [step, setStep] = useState<Step>(1);
  // +1 when moving forward, -1 when going back: drives the slide direction.
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    nic: '',
    phone: '',
    email: '',
    company: '',
    accountType: 'individual' as 'individual' | 'corporate',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Set when the email, phone or NIC already has an account.
  const [accountExists, setAccountExists] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Date of birth and gender read from the NIC as it is typed.
  const nicDetails = useMemo(() => parseNic(formData.nic), [formData.nic]);
  const nicLooksComplete = /^(\d{9}[VvXx]|\d{12})$/.test(normaliseNic(formData.nic));

  const update = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateStepOne = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (formData.fullName.trim().length < 3) errors.fullName = 'Enter your full name.';
    if (!nicDetails) errors.nic = 'Enter a valid NIC, e.g. 951234567V or 199512345678.';
    if (!normaliseSriLankaPhone(formData.phone)) errors.phone = 'Enter a valid Sri Lankan number, e.g. 077 123 4567.';
    return errors;
  };

  const validateStepTwo = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Enter a valid email address.';
    const passwordProblem = passwordPolicyError(formData.password);
    if (passwordProblem) errors.password = passwordProblem;
    if (formData.confirmPassword !== formData.password) errors.confirmPassword = 'Passwords do not match.';
    if (!formData.agreeToTerms) errors.agreeToTerms = 'Please accept the Terms and Privacy Policy.';
    return errors;
  };

  const goToStepTwo = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateStepOne();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    // NIC or contact number that already has an account: sign in instead.
    setIsChecking(true);
    const taken = takenDetailErrors(await checkAccountDetails({ nic: formData.nic, phone: formData.phone }));
    setIsChecking(false);
    if (Object.keys(taken).length) {
      setFieldErrors(taken);
      setAccountExists(true);
      setErrorMessage('You already have a Mahdev account. Please sign in instead.');
      return;
    }
    setAccountExists(false);
    setErrorMessage(null);
    setDirection(1);
    setStep(2);
  };

  // Already signed in, or back from Google's sign-in page: continue to the account.
  useEffect(() => {
    const redirectError = consumeRedirectError();
    if (redirectError) setErrorMessage(redirectError);
    else if (isAuthenticated && user && !emailRegistrationStarted.current) goOn(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors = validateStepTwo();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const botCheck = evaluateBotRisk({ honeypotValue, formRenderTime, email: formData.email });
    if (!botCheck.isLegitimate) {
      setErrorMessage(botCheck.reason || 'Verification check failed. Please try again.');
      return;
    }
    if (!checkActionThrottle('user_register', 2000)) {
      setErrorMessage('Please wait a moment before trying again.');
      return;
    }

    setIsLoading(true);
    // Email that already has an account: sign in instead.
    const taken = takenDetailErrors(await checkAccountDetails({ email: formData.email }));
    if (taken.email) {
      setIsLoading(false);
      setFieldErrors(taken);
      setAccountExists(true);
      setErrorMessage('You already have a Mahdev account. Please sign in instead.');
      return;
    }
    setAccountExists(false);
    emailRegistrationStarted.current = true;
    const result = await register({ ...formData });
    setIsLoading(false);
    if (!result.success) emailRegistrationStarted.current = false;

    if (!result.success) {
      const message = result.error || 'Could not create your account. Please try again.';
      setAccountExists(/already/i.test(message));
      // NIC and contact number problems are fixed on step 1, so take the customer back there.
      if (/NIC|contact number/i.test(message)) {
        setDirection(-1);
        setStep(1);
        setFieldErrors(/NIC/i.test(message) ? { nic: message } : { phone: message });
      } else {
        setErrorMessage(message);
      }
      return;
    }

    const contact = { name: formData.fullName.trim(), email: formData.email.trim(), phone: formData.phone };
    notificationService.notifyRegistration(contact).catch(() => {});
    notificationService.notifyAdminNewCustomer(contact).catch(() => {});
    setDirection(1);
    setStep('done');
  };

  const slide = {
    initial: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 40 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -40 }),
  };

  return (
    <>
      <SEOHead
        title="Create Account"
        description="Create your Mahdev account to book events, studio shoots, IT services and travel, and to track Mahdev Mart orders."
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/register`}
      />
      <AuthShell
        icon={step === 'done' ? <BadgeCheck className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
        title={step === 'done' ? 'Account created' : 'Create your account'}
        subtitle={step === 'done' ? 'One last step: confirm your email address.' : 'It takes less than a minute.'}
        footer={
          step !== 'done' && (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => onNavigate('/login')} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
                Sign in
              </button>
            </>
          )
        }
      >
        {step !== 'done' && (
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs font-semibold">
              <span className={step === 1 ? 'text-blue-700' : 'text-slate-500'}>1. About you</span>
              <span className={step === 2 ? 'text-blue-700' : 'text-slate-400'}>2. Login details</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0052FF] to-indigo-600"
                initial={false}
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}

        <AuthAlert tone="error" message={errorMessage} />
        {accountExists && (
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="mb-4 w-full rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold py-2.5 hover:bg-amber-100"
          >
            Sign in to my account
          </button>
        )}
        {step === 1 && <GoogleSignInButton label="Sign up with Google" onSignedIn={goOn} onError={setErrorMessage} />}

        {/* Honeypot: hidden from people, filled in only by spam bots. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="company_website_hp">Leave this field blank</label>
          <input
            id="company_website_hp"
            type="text"
            name="_hp_company_website"
            value={honeypotValue}
            onChange={(e) => setHoneypotValue(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {step === 1 && (
              <motion.form
                key="step-1"
                custom={direction}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onSubmit={goToStepTwo}
                noValidate
                className="space-y-4"
              >
                <AuthField
                  label="Full name"
                  autoComplete="name"
                  icon={<User className="h-4 w-4" />}
                  placeholder="As shown on your NIC"
                  value={formData.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  error={fieldErrors.fullName}
                  autoFocus
                />
                <AuthField
                  label="NIC number"
                  icon={<CreditCard className="h-4 w-4" />}
                  placeholder="951234567V or 199512345678"
                  autoComplete="off"
                  maxLength={14}
                  value={formData.nic}
                  onChange={(e) => update('nic', e.target.value.toUpperCase())}
                  error={fieldErrors.nic || (nicLooksComplete && !nicDetails ? 'This NIC number is not valid.' : null)}
                  hint="Your date of birth and gender are read from your NIC."
                />

                {/* Details read from the NIC, animated in once it is valid. */}
                <AnimatePresence>
                  {nicDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.97 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.97 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3">
                        {[
                          { icon: CalendarDays, label: 'Date of birth', value: formatDate(nicDetails.dateOfBirth) },
                          { icon: Users, label: 'Gender', value: nicDetails.gender === 'female' ? 'Female' : 'Male' },
                          { icon: CheckCircle2, label: 'Age', value: `${ageFromDateOfBirth(nicDetails.dateOfBirth)} years` },
                        ].map(({ icon: Icon, label, value }, index) => (
                          <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 * index }}
                            className="min-w-0"
                          >
                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                              <Icon className="h-3 w-3" aria-hidden="true" /> {label}
                            </span>
                            <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{value}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AuthField
                  label="Contact number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="077 123 4567"
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  error={fieldErrors.phone}
                  hint="We use this for booking updates and WhatsApp."
                />
                <AuthSubmit busy={isChecking} busyLabel="Checking your details…">
                  Continue <ArrowRight className="h-4 w-4" />
                </AuthSubmit>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step-2"
                custom={direction}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onSubmit={handleSubmit}
                noValidate
                className="space-y-4"
              >
                {/* Account type */}
                <div className="relative grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="radiogroup" aria-label="Account type">
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm"
                    initial={false}
                    animate={{ x: formData.accountType === 'individual' ? 0 : '100%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    style={{ left: '0.25rem' }}
                  />
                  {(['individual', 'corporate'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={formData.accountType === type}
                      onClick={() => update('accountType', type)}
                      className={`relative z-10 rounded-lg py-2 transition-colors ${formData.accountType === type ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {type === 'individual' ? 'Personal' : 'Business'}
                    </button>
                  ))}
                </div>

                <AnimatePresence initial={false}>
                  {formData.accountType === 'corporate' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <AuthField
                        label="Company name (optional)"
                        autoComplete="organization"
                        icon={<Building className="h-4 w-4" />}
                        placeholder="Your company"
                        value={formData.company}
                        onChange={(e) => update('company', e.target.value)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AuthField
                  label="Email address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  error={fieldErrors.email}
                  hint="You will sign in with this email."
                />
                <PasswordField
                  label="Password"
                  autoComplete="new-password"
                  placeholder={`${MIN_PASSWORD_LENGTH}+ characters, letters and numbers`}
                  value={formData.password}
                  onChange={(e) => update('password', e.target.value)}
                  error={fieldErrors.password}
                  showStrength
                />
                <PasswordField
                  label="Confirm password"
                  autoComplete="new-password"
                  placeholder="Type it again"
                  value={formData.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  error={fieldErrors.confirmPassword}
                />

                <div>
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => update('agreeToTerms', e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      I agree to the{' '}
                      <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">
                        Terms
                      </a>{' '}
                      and{' '}
                      <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">
                        Privacy Policy
                      </a>
                      , including how Mahdev stores my NIC details.
                    </span>
                  </label>
                  {fieldErrors.agreeToTerms && <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.agreeToTerms}</p>}
                </div>

                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setDirection(-1);
                      setStep(1);
                    }}
                    className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </motion.button>
                  <div className="flex-1">
                    <AuthSubmit busy={isLoading} busyLabel="Creating account…">
                      Create account <ArrowRight className="h-4 w-4" />
                    </AuthSubmit>
                  </div>
                </div>
              </motion.form>
            )}

            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="space-y-5 text-center"
              >
                {/* Animated tick */}
                <svg viewBox="0 0 52 52" className="mx-auto h-20 w-20" aria-hidden="true">
                  <motion.circle
                    cx="26" cy="26" r="24" fill="none" stroke="#10b981" strokeWidth="3"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }}
                  />
                  <motion.path
                    d="M15 27 l7 7 l15 -15" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }}
                  />
                </svg>
                <div className="space-y-1.5">
                  <p className="text-base font-semibold text-slate-900">Welcome, {formData.fullName.trim().split(' ')[0]}!</p>
                  <p className="text-sm text-slate-600">
                    We sent a confirmation link to <span className="font-semibold text-slate-900">{formData.email.trim()}</span>.
                    Please open it to verify your email address.
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate('/account/profile')}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0052FF] to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30"
                >
                  Go to my profile <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AuthShell>
    </>
  );
};
