import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  Lock,
  Phone,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { SEOHead } from '../../components/layout/SEOHead';
import { evaluateBotRisk, checkActionThrottle } from '../../utils/securityProtection';
import { notificationService } from '../../services/notificationService';

interface RegisterViewProps {
  onNavigate: (path: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [formRenderTime] = useState<number>(() => Date.now());
  const [honeypotValue, setHoneypotValue] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    accountType: 'individual' as 'individual' | 'corporate',
    password: '',
    confirmPassword: '',
    agreeToTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Bot & Abuse Evaluation
    const botCheck = evaluateBotRisk({
      honeypotValue,
      formRenderTime,
      email: formData.email,
    });

    if (!botCheck.isLegitimate) {
      setErrorMessage(botCheck.reason || 'Verification check failed. Please try again.');
      return;
    }

    // 2. Throttle Check
    if (!checkActionThrottle('user_register', 2000)) {
      setErrorMessage('Please wait a moment before resubmitting.');
      return;
    }

    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('A valid email address is required.');
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMessage('Phone or WhatsApp contact number is required.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!formData.agreeToTerms) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);
    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      accountType: formData.accountType,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      agreeToTerms: formData.agreeToTerms,
    });
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Account created successfully! Redirecting to your customer dashboard...');
      
      // Dispatch customer welcome notification and admin alert
      notificationService.notifyRegistration({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      }).catch(() => {});

      notificationService.notifyAdminNewCustomer({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      }).catch(() => {});

      setTimeout(() => {
        onNavigate('/account');
      }, 1200);
    } else {
      setErrorMessage(result.error || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Customer Registration | Mahdev Pvt Ltd"
        description="Create your Mahdev customer account to book event productions, studio shoots, safari tours, IT solutions, and curated decor and tech collections."
        canonicalUrl="https://mahdev.lk/register"
      />

      <div className="max-w-lg w-full space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
              <UserPlus className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Create Customer Account
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Join the Mahdev ecosystem to track your orders, manage bookings, and access dedicated concierge services.
            </p>
          </div>

          {/* Account Type Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accountType: 'individual' })}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                formData.accountType === 'individual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Individual Client
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accountType: 'corporate' })}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                formData.accountType === 'corporate'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Corporate Partner
            </button>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Honeypot Trap (Hidden from genuine human users, filled only by automated spam bots) */}
            <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
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
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ruwan Wickremasinghe"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Phone / WhatsApp *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="075 092 8078"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {formData.accountType === 'corporate' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Company / Enterprise Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Ceylon Horizon Ventures PLC"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Confirm Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Password strength meter */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Password strength:</span>
                  <span className="font-bold text-slate-700">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full ${strength.color} transition-all rounded-full`} style={{ width: `${(strength.score / 5) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I agree to Mahdev’s{' '}
                  <a href="/terms-and-conditions" target="_blank" className="text-blue-600 underline font-semibold">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" target="_blank" className="text-blue-600 underline font-semibold">
                    Privacy Policy
                  </a>.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="electric"
              fullWidth
              disabled={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="py-3 text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer mt-2"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* Security Footnote */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero-Trust Enterprise Authorization & Profile Isolation</span>
        </div>
      </div>
    </div>
  );
};
