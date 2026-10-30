import React, { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getDivisionCardItems } from '../../utils/divisionPresentation';
import { DivisionCard } from '../divisions/DivisionCard';

interface DivisionsSectionProps {
  onNavigate: (route: string) => void;
}

export const DivisionsSection: React.FC<DivisionsSectionProps> = ({ onNavigate }) => {
  const { divisions, homepageConfig } = useFirestoreDataContext();
  const items = useMemo(() => getDivisionCardItems(divisions), [divisions]);
  const section = homepageConfig?.divisionsSection;

  if (section?.enabled === false || items.length === 0) return null;

  return (
    <SectionContainer id="divisions" background="white" paddingY="lg">
      <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
        <div className="max-w-2xl">
          {section?.title && (
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {section.title}
            </h2>
          )}
          {section?.subtitle && (
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{section.subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/divisions')}
          className="hidden items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900 sm:inline-flex"
        >
          All businesses <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {items.map((division, index) => (
          <div key={division.id} className={index < 2 ? 'lg:col-span-3' : 'lg:col-span-2'}>
            <DivisionCard division={division} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onNavigate('/divisions')}
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 sm:hidden"
      >
        All businesses <ArrowUpRight className="h-4 w-4" />
      </button>
    </SectionContainer>
  );
};
