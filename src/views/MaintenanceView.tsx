import React from 'react';
import { Wrench, Phone, Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { getMailtoLink, getTelLink } from '../config/company';

interface MaintenanceViewProps {
  onAdminLogin?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onAdminLogin }) => {
  const { siteSettings, companySettings } = useFirestoreDataContext();

  const companyName = companySettings.name || 'Mahdev Pvt Ltd';
  const hotline = companySettings.primaryPhone || '+94 77 000 0000';
  const email = companySettings.email || 'info@mahdev.lk';

  return (
    <div
      id="maintenance-mode-view"
      className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none -top-40 -right-40" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none -bottom-40 -left-40" />

      <div className="relative z-10 max-w-xl w-full text-center bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-md">
        {/* Maintenance Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Scheduled System Maintenance</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight mb-3">
          {companyName} Systems Upgrade in Progress
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
          Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance.
        </p>

        {/* Emergency Contact Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-left mb-8">
          <a
            href={getTelLink(hotline)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Emergency Hotline
              </span>
              <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                {hotline}
              </span>
            </div>
          </a>

          <a
            href={getMailtoLink(email, 'Urgent Inquiry During System Maintenance')}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Corporate Inquiries
              </span>
              <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate block max-w-[170px]">
                {email}
              </span>
            </div>
          </a>
        </div>

        {/* Admin Portal Gateway Link */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {onAdminLogin ? (
            <button
              onClick={onAdminLogin}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <span>Authorized Administrator Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <a
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <span>Authorized Administrator Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} {companyName}. All Systems Governed by Central Firestore Cloud.
      </div>
    </div>
  );
};
