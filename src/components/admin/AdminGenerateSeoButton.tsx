import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { AdminConfirmDialog } from './AdminConfirmDialog';
import { cmsService } from '../../services/cmsService';
import { generateImageSeo } from '../../config/imageAlt';

interface AdminGenerateSeoButtonProps {
  entity: 'gallery' | 'services' | 'products';
  /** Records listed in the view (CmsGalleryItem, CmsService or CmsProduct). */
  items: ReadonlyArray<{ id: string; imageAlt?: string; seoDescription?: string }>;
  notify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  /** Reloads the list after saving. */
  onComplete: () => void;
}

/**
 * Fills in image alt text and SEO description for every listed item that does
 * not have them yet (items saved before these fields existed). Values already
 * set, including hand-written ones, are left unchanged.
 */
export const AdminGenerateSeoButton: React.FC<AdminGenerateSeoButtonProps> = ({ entity, items, notify, onComplete }) => {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [progress, setProgress] = React.useState<string | null>(null);

  const missing = items.filter((item) => !item.imageAlt?.trim() || !item.seoDescription?.trim());

  const handleGenerate = async () => {
    setIsConfirmOpen(false);
    let saved = 0;
    let failed = 0;
    // One at a time: each save syncs to the database, and this keeps the progress readable.
    for (const [index, item] of missing.entries()) {
      setProgress(`${index + 1}/${missing.length}`);
      const generated = generateImageSeo(item);
      const patch = {
        ...(item.imageAlt?.trim() ? {} : { imageAlt: generated.imageAlt }),
        ...(item.seoDescription?.trim() ? {} : { seoDescription: generated.seoDescription }),
      };
      if (!patch.imageAlt && !patch.seoDescription) continue; // No title to build from.
      try {
        await cmsService.update(entity, item.id, patch);
        saved += 1;
      } catch (err) {
        console.error(`[AdminGenerateSeo] Could not update ${entity}/${item.id}:`, err);
        failed += 1;
      }
    }
    setProgress(null);
    onComplete();
    if (failed) {
      notify('warning', 'Image SEO Partly Generated', `${saved} item(s) updated, ${failed} failed. Try again for the rest.`);
    } else {
      notify('success', 'Image SEO Generated', `Alt text and SEO descriptions added to ${saved} item(s).`);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (missing.length ? setIsConfirmOpen(true) : notify('info', 'Image SEO Complete', 'Every item already has alt text and an SEO description.'))}
        disabled={progress !== null}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        {progress ? `Generating SEO ${progress}...` : `Generate Image SEO${missing.length ? ` (${missing.length})` : ''}`}
      </Button>
      <AdminConfirmDialog
        isOpen={isConfirmOpen}
        title="Generate image SEO"
        message={`Add keyword alt text and an SEO description (naming Trincomalee and Colombo) to ${missing.length} item(s) that do not have them yet. Existing alt text and descriptions are not changed.`}
        confirmLabel="Generate"
        onConfirm={handleGenerate}
        onCancel={() => setIsConfirmOpen(false)}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  );
};
