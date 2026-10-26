import React from 'react';
import { buildSeoDescription, getImageAlt, seoFileName } from '../../config/imageAlt';

interface AdminSeoFieldsProps {
  /** Item title (gallery asset title, service title or product name). */
  title: string;
  /** Division id ("sws", "u1"...). */
  division: string;
  divisionName?: string;
  category?: string;
  description?: string;
  imageAlt: string;
  seoDescription: string;
  onChange: (fields: { imageAlt: string; seoDescription: string }) => void;
}

/**
 * Image alt text and SEO description for the gallery, service and product editors.
 * Both are auto-filled from the title, division, category and description, and
 * follow those fields as the admin types; once the admin edits one by hand it is
 * kept as written until "Use auto text" is pressed. Every alt names Trincomalee
 * and Colombo (see src/config/imageAlt.ts).
 */
export const AdminSeoFields: React.FC<AdminSeoFieldsProps> = ({
  title,
  division,
  divisionName,
  category,
  description,
  imageAlt,
  seoDescription,
  onChange,
}) => {
  const autoAlt = title.trim() ? getImageAlt(title, division, category) : '';
  const autoDescription = buildSeoDescription({ title, division, divisionName, category, description });

  // A saved value that differs from the auto text was written by hand, so keep it.
  const [altIsManual, setAltIsManual] = React.useState(() => Boolean(imageAlt) && imageAlt !== autoAlt);
  const [descriptionIsManual, setDescriptionIsManual] = React.useState(
    () => Boolean(seoDescription) && seoDescription !== autoDescription,
  );

  // Keep the auto fields in step with the title, division, category and description.
  React.useEffect(() => {
    const nextAlt = altIsManual ? imageAlt : autoAlt;
    const nextDescription = descriptionIsManual ? seoDescription : autoDescription;
    if (nextAlt !== imageAlt || nextDescription !== seoDescription) {
      onChange({ imageAlt: nextAlt, seoDescription: nextDescription });
    }
  }, [autoAlt, autoDescription, altIsManual, descriptionIsManual, imageAlt, seoDescription, onChange]);

  const autoBadge = (isManual: boolean, reset: () => void) =>
    isManual ? (
      <button type="button" onClick={reset} className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer">
        Use auto text
      </button>
    ) : (
      <span className="text-[10px] font-semibold text-emerald-600">Auto</span>
    );

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-slate-800">Image SEO (Trincomalee &amp; Colombo)</p>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-semibold text-slate-700">Image alt text</label>
          {autoBadge(altIsManual, () => setAltIsManual(false))}
        </div>
        <input
          type="text"
          value={imageAlt}
          onChange={(e) => {
            setAltIsManual(true);
            onChange({ imageAlt: e.target.value, seoDescription });
          }}
          placeholder="Filled in automatically from the title"
          className="w-full px-3 py-2 border rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-semibold text-slate-700">SEO description</label>
          {autoBadge(descriptionIsManual, () => setDescriptionIsManual(false))}
        </div>
        <textarea
          value={seoDescription}
          rows={2}
          onChange={(e) => {
            setDescriptionIsManual(true);
            onChange({ imageAlt, seoDescription: e.target.value });
          }}
          placeholder="Filled in automatically from the title and description"
          className="w-full px-3 py-2 border rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <p className="mt-0.5 text-[10px] text-slate-500">{seoDescription.length}/160 characters · shown under the page title in Google</p>
      </div>
      <p className="text-[10px] text-slate-500">
        Uploaded images are renamed from the alt text, e.g. <code>{seoFileName(imageAlt || 'item title', 'photo.jpg')}</code>
      </p>
    </div>
  );
};
