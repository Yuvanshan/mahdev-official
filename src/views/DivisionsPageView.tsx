import React, { useEffect, useMemo } from 'react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { SEOHead } from '../components/layout/SEOHead';
import { DivisionCard } from '../components/divisions/DivisionCard';
import { getDivisionCardItems } from '../utils/divisionPresentation';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';

interface DivisionsPageViewProps {
  onNavigate: (route: string) => void;
}

export const DivisionsPageView: React.FC<DivisionsPageViewProps> = ({ onNavigate }) => {
  const { divisions, homepageConfig, companySettings } = useFirestoreDataContext();
  const items = useMemo(() => getDivisionCardItems(divisions), [divisions]);
  const section = homepageConfig?.divisionsSection;
  const title = section?.title || '';
  const description = section?.subtitle || '';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <main className="bg-white">
      <SEOHead
        title={title ? `${title} | ${companySettings?.name || ''}` : companySettings?.name || ''}
        description={description}
        canonicalUrl="https://mahdev.lk/divisions"
      />
      {(section?.badge || title || description) && (
        <SectionContainer background="subtle" paddingY="sm">
          {section?.badge && (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              {section.badge}
            </p>
          )}
          {title && (
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
          )}
          {description && <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>}
        </SectionContainer>
      )}
      {items.length > 0 && (
        <SectionContainer background="white" paddingY="sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((division) => (
              <DivisionCard
                key={division.id}
                division={division}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </SectionContainer>
      )}
    </main>
  );
};
