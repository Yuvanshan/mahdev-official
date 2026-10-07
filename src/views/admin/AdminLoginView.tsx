import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { SEOHead } from '../../components/layout/SEOHead';

interface AdminLoginViewProps {
  onSuccess?: () => void;
  onNavigate: (path: string) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess, onNavigate }) => {
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          onNavigate('/admin');
        }
      } else {
        setError(res.error || 'Invalid executive credentials. Access denied.');
      }
    } catch (err: any) {
      setError('Administrative authentication server error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <SEOHead
        title="Administrative Access Gate | Mahdev Pvt Ltd"
        description="Restricted executive administrative access portal for Mahdev Pvt Ltd enterprise management."
        canonicalUrl="https://mahdev.lk/admin"
      />

      {/* Subtle Background Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full mx-auto space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-blue-500 shadow-xl mx-auto">
            <Shield className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 block">
              Restricted Corporate Console
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              MAHDEV ADMIN PORTAL
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Universal Operations & Enterprise Management Hub
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Admin Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Executive Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yuvanshan875@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Admin Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Administrator Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your administrator password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="electric"
                fullWidth
                size="md"
                disabled={isLoading}
                rightIcon={
                  isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )
                }
                className="py-3 text-xs font-bold shadow-lg shadow-blue-900/30"
              >
                {isLoading ? 'Verifying credentials...' : 'Authenticate & Enter Console'}
              </Button>
            </div>
          </form>

          {/* Return to Public Site */}
          <div className="pt-2 text-center">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Return to Public Corporate Website</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Security Stamp */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono">
          <Lock className="w-3 h-3 text-slate-500" />
          <span>SERVER-VERIFIED ADMIN ACCESS • SECURE SESSION COOKIE</span>
        </div>
      </div>
    </div>
  );
};
