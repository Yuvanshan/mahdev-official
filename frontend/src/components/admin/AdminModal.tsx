import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  footer?: React.ReactNode;
  size?: string;
  isDirty?: boolean;
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | string;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  footer,
  size,
  isDirty = false,
  onSave,
  isSaving = false,
  saveLabel,
  children,
  maxWidth = '2xl',
}) => {
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  useEffect(() => {
    if (!isOpen) {
      setShowUnsavedPrompt(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedPrompt(false);
    onClose();
  };

  const resolvedWidth = size || maxWidth;
  const cleanWidth = resolvedWidth.replace('max-w-', '');
  const maxWidthClass =
    cleanWidth === 'sm'
      ? 'max-w-sm'
      : cleanWidth === 'md'
      ? 'max-w-md'
      : cleanWidth === 'lg'
      ? 'max-w-lg'
      : cleanWidth === 'xl'
      ? 'max-w-xl'
      : cleanWidth === '3xl'
      ? 'max-w-3xl'
      : cleanWidth === '4xl'
      ? 'max-w-4xl'
      : cleanWidth === '5xl'
      ? 'max-w-5xl'
      : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`bg-white rounded-2xl border border-slate-200 shadow-2xl w-full ${maxWidthClass} my-8 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 relative`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-slate-900 text-lg">{title}</h3>
              {isDirty && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Unsaved Changes
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto grow custom-scrollbar">{children}</div>

        {/* Modal Footer: either explicit custom footer or standard onSave footer */}
        {(footer || onSave) && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-between gap-3">
            {footer ? (
              footer
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRequestClose}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                  className="cursor-pointer shadow-sm"
                >
                  {isSaving ? 'Saving Changes...' : (saveLabel || 'Save Record')}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Unsaved Changes Confirmation Prompt Modal Overlay */}
        {showUnsavedPrompt && (
          <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-100">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm">Discard Unsaved Changes?</h4>
                  <p className="text-xs text-slate-500">You have modified form fields.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you close this editor now, any unsaved edits will be lost permanently.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setShowUnsavedPrompt(false)}>
                  Keep Editing
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmDiscard}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Discard Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
