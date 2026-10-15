import React from 'react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { FirestoreTrustedCompany } from '../../types/firestore';

interface TrustedCompaniesSectionProps {
  onExplorePartners?: () => void;
}

export const TrustedCompaniesSection: React.FC<TrustedCompaniesSectionProps> = ({ onExplorePartners }) => {
  const { trustedCompanies, homepageConfig } = useFirestoreDataContext();

  // Strictly display trusted enterprise companies saved in Firestore by the admin
  const activeCompanies = React.useMemo(() => {
    return (trustedCompanies || [])
      .filter((c) => c.status !== 'inactive' && c.isPublished !== false && !(c as any).isDeleted)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [trustedCompanies]);

  if (homepageConfig?.companies && homepageConfig.companies.enabled === false) {
    return null;
  }

  // If no companies exist in Firestore, do not show the section
  if (activeCompanies.length === 0) {
    return null;
  }

  const meta = homepageConfig?.companies || {
    badge: 'OUR TRUSTED CLIENTS',
    title: 'Trusted by Industry Leaders',
    subtitle: 'Collaborating with national institutions, luxury hotel chains, and enterprise leaders across Sri Lanka.',
  };

  return (
    <SectionContainer
      id="companies"
      background="subtle"
      paddingY="lg"
      hasBorderBottom
    >
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-slate-900 mb-2">
          {meta.title || 'Trusted by Industry Leaders'}
        </h2>
      </div>

      <div
        className="flex snap-x snap-mandatory items-center gap-4 overflow-x-auto pb-3"
        aria-label="Trusted companies"
      >
        {activeCompanies.slice(0, 12).map((company) => (
          <div
            key={company.id}
            className="w-40 shrink-0 snap-start sm:w-48"
          >
            <div
              onClick={onExplorePartners}
              className={`group flex h-24 w-full items-center justify-center rounded-xl border border-slate-200/90 bg-white p-4 transition-all duration-200 hover:border-blue-400 hover:shadow-md ${
                onExplorePartners ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {company.logoUrl && company.logoUrl.trim() !== '' ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="max-h-14 max-w-full object-contain transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-base font-bold text-blue-600">
                    {company.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{company.name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {onExplorePartners && (
        <div className="mt-6 text-center">
          <button
            onClick={onExplorePartners}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            <span>View All Partner Case Studies</span>
            <span>→</span>
          </button>
        </div>
      )}
    </SectionContainer>
  );
};
