import React, { useEffect } from 'react';
import { ShieldCheck, Lock, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
  currentPath?: string;
  requiredRole?: 'admin' | 'staff' | 'superAdmin' | 'manager' | 'customer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onNavigate,
  currentPath = '/account',
  requiredRole,
}) => {
  const { user, status, isLoading, isUnauthenticated } = useAuth();

  // If unauthenticated, redirect to login
  useEffect(() => {
    if (isUnauthenticated) {
      const timer = setTimeout(() => {
        onNavigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isUnauthenticated, currentPath, onNavigate]);

  // Loading State
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-slate-900">Verifying Session</h3>
            <p className="text-xs text-slate-500">Checking authenticated credentials with Firebase...</p>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated State
  if (isUnauthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Authentication Required
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You must be signed in to access your protected Mahdev client orders, bookings, and corporate account preferences.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => onNavigate(`/login?redirect=${encodeURIComponent(currentPath)}`)}
              className="bg-[#0052FF] hover:bg-[#0040CC]"
            >
              Sign In to Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => onNavigate('/')}
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Role Requirement Check
  if (requiredRole && requiredRole !== 'customer') {
    const isAuthorized =
      user.role === requiredRole ||
      user.role === 'superAdmin' ||
      (requiredRole === 'staff' && ['admin', 'manager', 'staff'].includes(user.role)) ||
      (requiredRole === 'admin' && ['admin', 'superAdmin'].includes(user.role));

    if (!isAuthorized) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
          <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-xl max-w-md w-full text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Privileged Access Restricted
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                This management section requires <span className="font-semibold text-slate-700 uppercase">{requiredRole}</span> privileges. Your current role is <span className="font-semibold text-slate-700 uppercase">{user.role}</span>.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => onNavigate('/account')}
            >
              Go to Customer Portal
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
