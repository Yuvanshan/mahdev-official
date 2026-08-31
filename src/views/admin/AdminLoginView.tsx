import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building,
  Terminal,
  Cpu,
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

  const [email, setEmail] = useState('info.mahdev.lk@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [pin, setPin] = useState('202688');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password, pin);
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

  const handleQuickPreset = (presetEmail: string, presetPin: string) => {
    setEmail(presetEmail);
    setPassword('MahdevSecret#2026');
    setPin(presetPin);
    setError(null);
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
              Universal Operations & Ecosystem Management Hub
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
                  placeholder="info.mahdev.lk@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Admin Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Security Passkey
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* 2FA PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Hardware / Authenticator PIN (2FA)
                </label>
                <span className="text-[10px] text-blue-400 font-mono">HMAC-SHA256</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="202688"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest"
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
                {isLoading ? 'Verifying Cryptographic Credentials...' : 'Authenticate & Enter Console'}
              </Button>
            </div>
          </form>

          {/* Quick Demo Switchers */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
              Quick Administrative Presets:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPreset('info.mahdev.lk@gmail.com', '202688')}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-left transition-all cursor-pointer group"
              >
                <span className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300 block">
                  Super Admin
                </span>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  info.mahdev.lk@gmail.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('operations@mahdev.lk', '884910')}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-left transition-all cursor-pointer group"
              >
                <span className="text-[11px] font-bold text-purple-400 group-hover:text-purple-300 block">
                  Operations Admin
                </span>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  operations@mahdev.lk
                </span>
              </button>
            </div>
          </div>

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
          <span>SESSION TOKENS SIGNED WITH HMAC-SHA256 • AUDIT TRAIL LOGGED</span>
        </div>
      </div>
    </div>
  );
};
