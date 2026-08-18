import React, { useState } from 'react';
import { AlertTriangle, Trash2, Archive, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemIdentifier?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  allowSoftDelete?: boolean;
  isCurrentlyDeleted?: boolean;
  onConfirm: (permanent: boolean) => void;
  onCancel: () => void;
  requireKeywordConfirm?: boolean;
  confirmKeyword?: string;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  itemIdentifier,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = true,
  allowSoftDelete = true,
  isCurrentlyDeleted = false,
  onConfirm,
  onCancel,
  requireKeywordConfirm = false,
  confirmKeyword = 'DELETE',
}) => {
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>(isCurrentlyDeleted ? 'hard' : 'soft');
  const [inputKeyword, setInputKeyword] = useState('');

  if (!isOpen) return null;

  const isConfirmed = !requireKeywordConfirm || inputKeyword.trim().toUpperCase() === confirmKeyword.toUpperCase();

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm(deleteMode === 'hard' || isCurrentlyDeleted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDestructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500">Irreversible Action Guard</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>

          {itemIdentifier && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 break-all">
              <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-0.5">Target Record</span>
              {itemIdentifier}
            </div>
          )}

          {/* Delete mode option: Soft Delete vs Hard Delete */}
          {allowSoftDelete && !isCurrentlyDeleted && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-700 block">Deletion Strategy:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteMode('soft')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    deleteMode === 'soft'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Archive className="w-3.5 h-3.5 text-blue-600" />
                    Soft Delete
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Archive record safely. Can be restored anytime.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteMode('hard')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    deleteMode === 'hard'
                      ? 'border-red-600 bg-red-50/70 text-red-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanent Delete
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Completely erase from system storage.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Keyword Confirmation for Hard/Permanent Deletion */}
          {(deleteMode === 'hard' || isCurrentlyDeleted || requireKeywordConfirm) && (
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-red-700">
                To confirm permanent erasure, type <span className="font-mono font-bold uppercase">{confirmKeyword}</span> below:
              </label>
              <input
                type="text"
                value={inputKeyword}
                onChange={(e) => setInputKeyword(e.target.value)}
                placeholder={`Type "${confirmKeyword}"`}
                className="w-full px-3 py-2 text-xs border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'primary' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={
              deleteMode === 'hard' || isCurrentlyDeleted
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }
          >
            {deleteMode === 'hard' || isCurrentlyDeleted ? (
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Archive className="w-3.5 h-3.5 mr-1.5" />
            )}
            {deleteMode === 'hard' || isCurrentlyDeleted ? 'Permanently Delete' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
