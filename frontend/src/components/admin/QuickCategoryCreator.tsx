import React, { useState } from 'react';
import { Plus, X, Sparkles, FolderTree, Check, Tag } from 'lucide-react';
import { CmsCategory } from '../../types/cms';
import { cmsService } from '../../services/cmsService';
import { DivisionId } from '../../types';
import { Button } from '../ui/Button';

interface QuickCategoryCreatorProps {
  currentDivisionId?: DivisionId | string;
  onCategoryCreated: (category: CmsCategory) => void;
  className?: string;
  buttonLabel?: string;
}

const COMMON_ICONS = [
  { label: 'Sparkles', value: 'Sparkles' },
  { label: 'Folder / Tree', value: 'FolderTree' },
  { label: 'Tag', value: 'Tag' },
  { label: 'Layers', value: 'Layers' },
  { label: 'Camera', value: 'Camera' },
  { label: 'Shopping Bag', value: 'ShoppingBag' },
  { label: 'Zap / Electric', value: 'Zap' },
  { label: 'Palette', value: 'Palette' },
  { label: 'Package', value: 'Package' },
];

export const QuickCategoryCreator: React.FC<QuickCategoryCreatorProps> = ({
  currentDivisionId = 'sws',
  onCategoryCreated,
  className = '',
  buttonLabel = 'Add New Category',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [divisionId, setDivisionId] = useState<DivisionId>(
    (currentDivisionId as DivisionId) || 'sws'
  );
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('FolderTree');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => {
    setName('');
    setDescription('');
    setError('');
    setDivisionId((currentDivisionId as DivisionId) || 'sws');
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Generate clean slug
      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if category exists already
      const existing = cmsService
        .getAll<CmsCategory>('categories')
        .find(
          (c) =>
            c.name.toLowerCase() === trimmedName.toLowerCase() ||
            c.slug.toLowerCase() === slug
        );

      if (existing) {
        // If it already exists, simply select and apply it!
        onCategoryCreated(existing);
        setIsOpen(false);
        return;
      }

      // Create new category in CMS and sync to Firestore
      const newCategory = await cmsService.create<CmsCategory>('categories', {
        name: trimmedName,
        slug: slug || `cat-${Date.now().toString(36)}`,
        divisionId,
        description: description.trim() || `Curated collection for ${trimmedName}`,
        iconName,
        itemCount: 0,
        displayOrder: 1,
        isActive: true,
      });

      onCategoryCreated(newCategory);
      setIsOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 px-2 py-1 rounded-lg transition-colors border border-blue-200/60 cursor-pointer"
          title="Manually create a new category"
        >
          <Plus className="w-3 h-3" />
          <span>{buttonLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 transition-all shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
          <FolderTree className="w-3.5 h-3.5 text-blue-600" />
          <span>Create & Apply New Category</span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
            Category Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Stage & Lighting, Floral Arch..."
            autoFocus
            className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
            Target Division
          </label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value as DivisionId)}
            className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="sws">SWS Event Management</option>
            <option value="u1">U1 Studio</option>
            <option value="it">Mahdev IT & Solutions</option>
            <option value="travels">Mahdev Travels</option>
            <option value="mart">Mahdev Online Mart</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
            Short Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Bespoke staging, lighting & backdrops"
            className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
            Display Icon
          </label>
          <select
            value={iconName}
            onChange={(e) => setIconName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            {COMMON_ICONS.map((ic) => (
              <option key={ic.value} value={ic.value}>
                {ic.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-[10px] text-red-600 font-semibold">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleClose}
          className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
        >
          Cancel
        </button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => handleSubmit()}
          disabled={isSubmitting || !name.trim()}
          className="py-1 px-3 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
        >
          <Check className="w-3 h-3" />
          <span>Create & Apply</span>
        </Button>
      </div>
    </div>
  );
};
