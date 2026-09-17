import React from 'react';
import { Handshake } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { FirestoreTrustedCompany } from '../../types/firestore';

interface TrustedCompaniesSectionProps {
  onExplorePartners?: () => void;
}

export const TrustedCompaniesSection: React.FC<TrustedCompaniesSectionProps> = ({ onExplorePartners }) => {
  const { trustedCompanies, homepageConfig } = useFirestoreDataContext();

  if (homepageConfig?.companies && homepageConfig.companies.enabled === false) {
    return null;
  }

  // Strictly display trusted enterprise companies saved in Firestore by the admin
  const activeCompanies = React.useMemo(() => {
    return (trustedCompanies || [])
      .filter((c) => c.status !== 'inactive' && c.isPublished !== false && !(c as any).isDeleted)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [trustedCompanies]);

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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono font-semibold text-slate-700 mb-2.5 shadow-2xs">
          <Handshake className="w-3.5 h-3.5 text-blue-600" />
          <span>{meta.badge || 'OUR TRUSTED CLIENTS'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-slate-900 mb-2">
          {meta.title || 'Trusted by Industry Leaders'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          {meta.subtitle || 'Collaborating with national institutions, luxury hotel chains, and enterprise leaders across Sri Lanka.'}
        </p>
      </div>

      {/* Partner Logos Matrix - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 items-stretch justify-center">
        {activeCompanies.slice(0, 12).map((company) => (
          <div
            key={company.id}
            className="flex flex-col items-center justify-center"
          >
            <div
              onClick={onExplorePartners}
              className={`w-full h-full p-4 rounded-xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center group ${
                onExplorePartners ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {company.logoUrl && company.logoUrl.trim() !== '' ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-9 max-w-[120px] object-contain mb-1.5 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base mb-1">
                  {company.name.charAt(0)}
                </div>
              )}
              <span className="font-display font-bold text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                {company.name}
              </span>
              {company.industry && (
                <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {company.industry}
                </span>
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
