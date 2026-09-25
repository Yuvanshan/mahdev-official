import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface AdminToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const AdminToast: React.FC<AdminToastProps> = ({ toasts, onDismiss }) => {
  // Auto-dismiss safeguard: ensure each toast disappears cleanly
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        onDismiss(t.id);
      }, 4200)
    );
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0 || typeof document === 'undefined') return null;

  const content = (
    <div
      className="fixed top-5 right-5 z-[999999] flex flex-col gap-3 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none select-none transition-all duration-300"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const iconMap = {
          success: (
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ),
          error: (
            <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          ),
          warning: (
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ),
          info: (
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
          ),
        };

        const styleMap = {
          success: 'bg-white border-emerald-500/40 text-slate-900 shadow-emerald-950/15',
          error: 'bg-white border-red-500/40 text-slate-900 shadow-red-950/15',
          warning: 'bg-white border-amber-500/40 text-slate-900 shadow-amber-950/15',
          info: 'bg-white border-blue-500/40 text-slate-900 shadow-blue-950/15',
        };

        const accentBarMap = {
          success: 'bg-emerald-500',
          error: 'bg-red-500',
          warning: 'bg-amber-500',
          info: 'bg-blue-500',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden p-4 rounded-2xl border-2 shadow-2xl flex items-start gap-3.5 transition-all duration-200 animate-in slide-in-from-top-4 fade-in backdrop-blur-md ${styleMap[toast.type]}`}
            style={{
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.22), 0 0 1px 1px rgba(0,0,0,0.05)',
            }}
          >
            {/* Left vertical color accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentBarMap[toast.type]}`} />

            {iconMap[toast.type]}

            <div className="grow space-y-1 min-w-0 pr-1">
              {toast.title && (
                <h4 className="font-display font-bold text-sm tracking-tight text-slate-900 leading-snug">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-slate-600 font-medium leading-relaxed break-words">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );

  return createPortal(content, document.body);
};
