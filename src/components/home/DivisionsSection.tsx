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
        <div>
          {section?.title && (
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {section.title}
            </h2>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((division) => (
          <DivisionCard key={division.id} division={division} onNavigate={onNavigate} />
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
