import React from 'react';
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
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
        };

        const borderMap = {
          success: 'border-emerald-200 bg-emerald-50/95 text-emerald-950',
          error: 'border-red-200 bg-red-50/95 text-red-950',
          warning: 'border-amber-200 bg-amber-50/95 text-amber-950',
          info: 'border-blue-200 bg-blue-50/95 text-blue-950',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 duration-200 ${borderMap[toast.type]}`}
          >
            {iconMap[toast.type]}
            <div className="grow space-y-0.5">
              {toast.title && <h4 className="font-display font-bold text-xs">{toast.title}</h4>}
              <p className="text-xs opacity-90 leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="opacity-60 hover:opacity-100 p-1 rounded-lg transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
