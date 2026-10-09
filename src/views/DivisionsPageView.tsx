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
  const title = section?.title || 'Our Divisions';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <main className="bg-white">
      <SEOHead
        title={title ? `${title} | ${companySettings?.name || ''}` : companySettings?.name || ''}
        description={`Explore the business divisions of ${companySettings?.name || 'Mahdev Group'}.`}
        canonicalUrl="https://mahdev.lk/divisions"
      />
      {title && (
        <SectionContainer background="subtle" paddingY="sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
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
