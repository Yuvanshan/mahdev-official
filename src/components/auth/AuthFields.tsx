import React, { forwardRef, useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { displayMessage } from '../../utils/displayMessage';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  /** Shown under the field; replaced by the error when there is one. */
  hint?: React.ReactNode;
  error?: string | null;
  /** Clickable content at the right edge (e.g. a show/hide button). */
  trailing?: React.ReactNode;
}

/** Labelled input with an icon, animated error message and a clear focus ring. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, icon, hint, error, trailing, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        <div className="group relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 transition-colors group-focus-within:text-blue-600">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? messageId : undefined}
            className={`w-full rounded-xl border bg-white py-3 text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
              icon ? 'pl-10' : 'pl-3.5'
            } ${trailing ? 'pr-11' : 'pr-3.5'} ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-600/15'
            } ${className}`}
            {...props}
          />
          {trailing && <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span>}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {error ? (
            <motion.p
              key="error"
              id={messageId}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-600"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </motion.p>
          ) : hint ? (
            <motion.div key="hint" id={messageId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-slate-500">
              {hint}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);
AuthField.displayName = 'AuthField';

/** 0–4 strength score from length and character variety. */
export function passwordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length < 8) return { score: 1, label: 'Too short', color: 'bg-rose-500' };
  if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-lime-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

interface PasswordFieldProps extends Omit<AuthFieldProps, 'type' | 'trailing' | 'icon'> {
  /** Shows the animated strength meter under the field. */
  showStrength?: boolean;
}

/** Password input with a show/hide toggle and an optional strength meter. */
export const PasswordField: React.FC<PasswordFieldProps> = ({ showStrength, value, ...props }) => {
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(String(value || ''));
  return (
    <div>
      <AuthField
        {...props}
        value={value}
        type={visible ? 'text' : 'password'}
        icon={<Lock className="h-4 w-4" />}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      {showStrength && String(value || '') && (
        <div className="mt-2 space-y-1" aria-live="polite">
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  className={`h-full ${strength.color}`}
                  initial={false}
                  animate={{ width: strength.score >= step ? '100%' : '0%' }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            ))}
          </div>
          <p className="text-right text-[11px] font-medium text-slate-500">{strength.label}</p>
        </div>
      )}
    </div>
  );
};

/** Animated error or success banner. Renders nothing when there is no message. */
export const AuthAlert: React.FC<{ tone: 'error' | 'success'; message: string | null }> = ({ tone, message }) => (
  <AnimatePresence initial={false}>
    {message && (
      <motion.div
        role={tone === 'error' ? 'alert' : 'status'}
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="overflow-hidden"
      >
        <motion.div
          initial={tone === 'error' ? { x: 0 } : undefined}
          animate={tone === 'error' ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
          transition={{ duration: 0.4 }}
          className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
            tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {tone === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          )}
          <span>{displayMessage(message)}</span>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/** Primary submit button with a spinner while busy. */
export const AuthSubmit: React.FC<{ busy: boolean; children: React.ReactNode; busyLabel: string; disabled?: boolean }> = ({
  busy,
  children,
  busyLabel,
  disabled,
}) => (
  <motion.button
    type="submit"
    disabled={busy || disabled}
    whileHover={busy || disabled ? undefined : { y: -1 }}
    whileTap={busy || disabled ? undefined : { scale: 0.98 }}
    className="relative inline-flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0052FF] to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30"
  >
    {busy ? (
      <>
        <motion.span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        {busyLabel}
      </>
    ) : (
      children
    )}
  </motion.button>
);
