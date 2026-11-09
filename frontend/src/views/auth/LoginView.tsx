import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/layout/SEOHead';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, AuthSubmit, PasswordField } from '../../components/auth/AuthFields';
import { CANONICAL_SITE_ORIGIN } from '../../config/site';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { postSignInPath } from '../../utils/profileCompletion';
import type { CustomerUser } from '../../types/customer';

interface LoginViewProps {
  onNavigate: (path: string) => void;
  redirectPath?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, redirectPath = '/account' }) => {
  const { login, user, isAuthenticated, consumeRedirectError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Signed-in customers (including those returning from Google's sign-in page) go on to
  // their account, or to the completion step when details are missing.
  const hasNavigated = useRef(false);
  const goOn = (signedIn: CustomerUser) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    onNavigate(postSignInPath(signedIn, redirectPath));
  };
  useEffect(() => {
    const redirectError = consumeRedirectError();
    if (redirectError) setErrorMessage(redirectError);
    else if (isAuthenticated && user) goOn(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: typeof fieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsLoading(true);
    const result = await login({ email, password });
    setIsLoading(false);

    // On success the effect above moves on (postSignInPath only allows same-site redirects).
    if (!result.success) {
      setErrorMessage(result.error || 'Sign-in failed. Please try again.');
    }
  };

  return (
    <>
      <SEOHead
        title="Sign In"
        description="Sign in to your Mahdev account to manage bookings, orders, invoices and your profile."
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/login`}
      />
      <AuthShell
        icon={<LogIn className="h-6 w-6" />}
        title="Welcome back"
        subtitle="Sign in to manage your bookings, orders and profile."
        footer={
          <>
            New to Mahdev?{' '}
            <button
              type="button"
              onClick={() => onNavigate(redirectPath !== '/account' ? `/register?redirect=${encodeURIComponent(redirectPath)}` : '/register')}
              className="font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              Create an account
            </button>
          </>
        }
      >
        <AuthAlert tone="error" message={errorMessage} />
        <GoogleSignInButton label="Continue with Google" onSignedIn={goOn} onError={setErrorMessage} />
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField
            label="Email address"
            type="email"
            autoComplete="email"
            inputMode="email"
            icon={<Mail className="h-4 w-4" />}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoFocus
          />
          <div className="space-y-1">
            <PasswordField
              label="Password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
            />
            <div className="text-right">
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-xs font-semibold text-blue-700 underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>
          <AuthSubmit busy={isLoading} busyLabel="Signing in…">
            Sign in
            <motion.span aria-hidden="true" animate={{ x: [0, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </AuthSubmit>
        </form>
      </AuthShell>
    </>
  );
};
