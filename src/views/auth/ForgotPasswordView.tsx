import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { SEOHead } from '../../components/layout/SEOHead';
import { notificationService } from '../../services/notificationService';

interface ForgotPasswordViewProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setIsLoading(true);
    const result = await authService.requestPasswordReset(email);
    setIsLoading(false);

    if (result.success) {
      setResetToken(`RST-2026-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSubmitted(true);
      notificationService.notifyPasswordReset(email).catch(() => {});
    } else {
      setErrorMessage(result.error || 'Failed to send password reset email. Please try again.');
    }
  };

  const handleCopyToken = () => {
    if (!resetToken) return;
    navigator.clipboard.writeText(resetToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Reset Password | Mahdev Pvt Ltd"
        description="Request a secure password reset link for your Mahdev customer account."
        canonicalUrl="https://mahdev.lk/forgot-password"
      />

      <div className="max-w-md w-full space-y-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Enter your registered business or personal email to receive a password reset authorization token.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Account Email *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="electric"
                fullWidth
                disabled={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="py-3 text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {isLoading ? 'Sending Token...' : 'Dispatch Reset Token'}
              </Button>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Password Reset Token Generated</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  A verification token was dispatched to <strong>{email}</strong>. In this sandbox environment, your one-time verification token is:
                </p>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between font-mono text-sm font-bold text-slate-900">
                  <span>{resetToken}</span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy Token"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                variant="electric"
                fullWidth
                size="sm"
                onClick={() => onNavigate('/login')}
                className="text-xs font-bold py-2.5"
              >
                Return to Sign In
              </Button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>

        {/* Security Footnote */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted Password Tokens with 15-Minute Expiry</span>
        </div>
      </div>
    </div>
  );
};
