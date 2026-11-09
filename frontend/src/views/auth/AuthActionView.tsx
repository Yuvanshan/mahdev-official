import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, KeyRound, Loader2, MailCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/layout/SEOHead';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthAlert, AuthSubmit, PasswordField } from '../../components/auth/AuthFields';
import { authService, passwordPolicyError, type EmailActionMode } from '../../services/authService';

interface AuthActionViewProps {
  onNavigate: (path: string) => void;
}

const MODES: EmailActionMode[] = ['verifyEmail', 'resetPassword', 'recoverEmail', 'verifyAndChangeEmail'];

/**
 * Reads the link's mode and one-time code once, then removes them from the address
 * bar, so the code is not left in browser history, shared links or analytics.
 */
function takeActionParams(): { mode: EmailActionMode | null; oobCode: string } {
  if (typeof window === 'undefined') return { mode: null, oobCode: '' };
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') as EmailActionMode | null;
  const oobCode = params.get('oobCode') || '';
  if (params.has('oobCode')) window.history.replaceState(window.history.state, '', window.location.pathname);
  return { mode: mode && MODES.includes(mode) ? mode : null, oobCode };
}

type Phase = 'checking' | 'resetForm' | 'done' | 'failed';

/**
 * /auth/action: where the account emails (verify email, reset password, undo an email
 * change) lead, so their links show the website's own address. Firebase's email
 * templates must point their action URL here (see DOMAIN_CONFIGURATION.md).
 */
export const AuthActionView: React.FC<AuthActionViewProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [{ mode, oobCode }] = useState(takeActionParams);
  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      setError('This link is incomplete. Please open it straight from the email, or request a new one.');
      setPhase('failed');
      return;
    }
    let active = true;
    authService.handleEmailAction(mode, oobCode).then((result) => {
      if (!active) return;
      if (!result.success) {
        setError(result.error || 'This link could not be used.');
        setPhase('failed');
        return;
      }
      setEmail(result.email || '');
      setPhase(mode === 'resetPassword' ? 'resetForm' : 'done');
    });
    return () => {
      active = false;
    };
  }, [mode, oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    const problem = passwordPolicyError(password);
    if (problem) errors.password = problem;
    if (confirm !== password) errors.confirm = 'Passwords do not match.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSaving(true);
    const result = await authService.confirmPasswordReset(oobCode, password);
    setIsSaving(false);
    if (result.success) setPhase('done');
    else setError(result.error || 'Could not set your new password.');
  };

  const isReset = mode === 'resetPassword';
  const copy = {
    checking: { title: 'One moment…', subtitle: 'Checking your link.' },
    resetForm: { title: 'Choose a new password', subtitle: email ? `For ${email}` : 'Enter your new password below.' },
    failed: { title: 'Link not valid', subtitle: 'It may have expired or already been used.' },
    done: isReset
      ? { title: 'Password updated', subtitle: 'You can now sign in with your new password.' }
      : mode === 'verifyEmail'
        ? { title: 'Email verified', subtitle: email ? `${email} is now confirmed.` : 'Your email address is now confirmed.' }
        : { title: 'Email address restored', subtitle: 'If you did not ask for the change, please reset your password now.' },
  }[phase];

  const icon =
    phase === 'failed' ? <ShieldAlert className="h-6 w-6" /> :
    phase === 'done' ? (isReset ? <ShieldCheck className="h-6 w-6" /> : <MailCheck className="h-6 w-6" />) :
    <KeyRound className="h-6 w-6" />;

  // Where to go next: the account when signed in, otherwise sign-in (or a new link on failure).
  const nextPath = isAuthenticated ? '/account/profile' : phase === 'failed' && isReset ? '/forgot-password' : '/login';
  const nextLabel = isAuthenticated ? 'Go to my account' : phase === 'failed' && isReset ? 'Request a new link' : 'Sign in';

  return (
    <>
      {/* One-time links must never be indexed. */}
      <SEOHead title={copy.title} description="Confirm your Mahdev account email or reset your password." noIndex />
      <AuthShell icon={icon} title={copy.title} subtitle={copy.subtitle}>
        {phase === 'checking' && (
          <div className="flex justify-center py-6" role="status" aria-label="Checking your link">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {phase === 'resetForm' && (
          <form onSubmit={handleReset} noValidate className="space-y-4">
            <AuthAlert tone="error" message={error} />
            <PasswordField
              label="New password"
              autoComplete="new-password"
              placeholder="8+ characters, letters and numbers"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              error={fieldErrors.password}
              showStrength
              autoFocus
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setFieldErrors((current) => ({ ...current, confirm: undefined }));
              }}
              error={fieldErrors.confirm}
            />
            <AuthSubmit busy={isSaving} busyLabel="Saving…">
              Save new password
            </AuthSubmit>
          </form>
        )}

        {(phase === 'done' || phase === 'failed') && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
            {phase === 'failed' && <AuthAlert tone="error" message={error} />}
            <button
              type="button"
              onClick={() => onNavigate(nextPath)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052FF] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              {nextLabel} <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AuthShell>
    </>
  );
};
