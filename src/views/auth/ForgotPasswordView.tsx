import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, KeyRound, Mail, MailCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/layout/SEOHead';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, AuthSubmit } from '../../components/auth/AuthFields';
import { checkActionThrottle } from '../../utils/securityProtection';
import { CANONICAL_SITE_ORIGIN } from '../../config/site';

interface ForgotPasswordViewProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigate }) => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (!checkActionThrottle('password_reset', 5000)) {
      setErrorMessage('Please wait a few seconds before trying again.');
      return;
    }
    setIsLoading(true);
    const result = await requestPasswordReset(email);
    setIsLoading(false);
    // The same message is shown whether or not the email has an account.
    if (result.success) setSentMessage(result.message);
    else setErrorMessage(result.error || 'Could not send the reset link. Please try again.');
  };

  const backToSignIn = (
    <button type="button" onClick={() => onNavigate('/login')} className="inline-flex items-center gap-1.5 font-semibold text-blue-700 underline-offset-4 hover:underline">
      <ArrowLeft className="h-4 w-4" /> Back to sign in
    </button>
  );

  return (
    <>
      <SEOHead
        title="Reset Password"
        description="Reset the password for your Mahdev account."
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/forgot-password`}
      />
      <AuthShell
        icon={sentMessage ? <MailCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
        title={sentMessage ? 'Check your inbox' : 'Forgot your password?'}
        subtitle={sentMessage ? 'Follow the link in the email to choose a new password.' : "Enter your email and we'll send you a reset link."}
        footer={backToSignIn}
      >
        <AnimatePresence mode="wait" initial={false}>
          {sentMessage ? (
            <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
              <motion.div
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
              >
                <MailCheck className="h-8 w-8" aria-hidden="true" />
              </motion.div>
              <p className="text-sm text-slate-600">{sentMessage}</p>
              <button
                type="button"
                onClick={() => setSentMessage(null)}
                className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
              >
                Use a different email
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} noValidate className="space-y-4">
              <AuthAlert tone="error" message={errorMessage} />
              <AuthField
                label="Email address"
                type="email"
                inputMode="email"
                autoComplete="email"
                icon={<Mail className="h-4 w-4" />}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                error={emailError}
                autoFocus
              />
              <AuthSubmit busy={isLoading} busyLabel="Sending link…">
                Send reset link
              </AuthSubmit>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthShell>
    </>
  );
};
