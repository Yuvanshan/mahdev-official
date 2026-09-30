import React from 'react';
import {
  Wrench,
  Phone,
  Mail,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
} from 'lucide-react';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { getMailtoLink, getTelLink } from '../config/company';

interface MaintenanceViewProps {
  onAdminLogin?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onAdminLogin }) => {
  const { siteSettings, companySettings } = useFirestoreDataContext();

  const maintenance = siteSettings?.maintenance;
  const companyName = companySettings.name || 'Mahdev Pvt Ltd';
  
  const title =
    maintenance?.title || `${companyName} Systems Upgrade in Progress`;
  const message =
    maintenance?.message ||
    'Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance.';
  const imageUrl = maintenance?.imageUrl;
  const estimatedReturn = maintenance?.estimatedReturn || 'Within 2 hours';
  const hotline =
    maintenance?.contactPhone || companySettings.primaryPhone || '075 092 8078';
  const email =
    maintenance?.contactEmail || companySettings.email || 'info@mahdev.lk';

  return (
    <div
      id="maintenance-mode-view"
      className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-500 selection:text-slate-950"
    >
      {/* Background ambient lighting */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none -top-40 -right-40" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none -bottom-40 -left-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Optional Custom Cover / Banner Image */}
        {imageUrl ? (
          <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden mb-6 border border-slate-800">
            <img
              src={imageUrl}
              alt="Scheduled Maintenance Banner"
              className="w-full h-full object-cover"
              
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wide">
              <Wrench className="w-3.5 h-3.5 animate-pulse" />
              <span>SYSTEM MAINTENANCE</span>
            </div>
          </div>
        ) : (
          /* Maintenance Icon Badge */
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Wrench className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
        )}

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Scheduled System Upgrades</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight mb-4 leading-tight">
          {title}
        </h1>

        <p className="text-slate-300/90 text-sm sm:text-base leading-relaxed mb-6 max-w-xl mx-auto">
          {message}
        </p>

        {/* Estimated Return Time Block */}
        {estimatedReturn && (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs font-medium mb-8">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Estimated Return:</span>
            <span className="font-bold text-amber-300">{estimatedReturn}</span>
          </div>
        )}

        {/* Emergency Contact & Inquiries Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-left mb-8">
          <a
            href={getTelLink(hotline)}
            className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-slate-800/60 transition-all group border border-transparent hover:border-slate-700/60"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Emergency Hotline
              </span>
              <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate block">
                {hotline}
              </span>
            </div>
          </a>

          <a
            href={getMailtoLink(email, 'Urgent Inquiry During System Maintenance')}
            className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-slate-800/60 transition-all group border border-transparent hover:border-slate-700/60"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Direct Inquiries
              </span>
              <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate block">
                {email}
              </span>
            </div>
          </a>
        </div>

        {/* Action Gateways */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {onAdminLogin ? (
            <button
              onClick={onAdminLogin}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <span>Authorized Administrator Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <a
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors w-full sm:w-auto"
            >
              <span>Authorized Administrator Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Building2 className="w-3.5 h-3.5" />
        <span>
          &copy; {new Date().getFullYear()} {companyName}. Central Cloud Architecture.
        </span>
      </div>
    </div>
  );
};
