import React from 'react';
import { Handshake } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { cmsService } from '../../services/cmsService';
import { FirestoreTrustedCompany } from '../../types/firestore';

interface TrustedCompaniesSectionProps {
  onExplorePartners?: () => void;
}

// Fallback curated enterprise client companies
const DEFAULT_TRUSTED_CLIENTS: FirestoreTrustedCompany[] = [
  {
    id: 'tc-dialog',
    name: 'Dialog Axiata PLC',
    industry: 'Telecommunications & ICT',
    partnershipType: 'Enterprise Technology Client',
    logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
    website: 'https://www.dialog.lk',
    description: 'Islandwide event production & stage engineering.',
    isPublished: true,
    order: 1,
    status: 'active',
  },
  {
    id: 'tc-slt',
    name: 'SLT-MOBITEL',
    industry: 'National Telecommunications',
    partnershipType: 'Strategic Corporate Client',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    website: 'https://www.slt.lk',
    description: 'Annual corporate gala & technical staging partner.',
    isPublished: true,
    order: 2,
    status: 'active',
  },
  {
    id: 'tc-hilton',
    name: 'Hilton Colombo',
    industry: 'Luxury Hospitality',
    partnershipType: 'Hospitality & Venue Partner',
    logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80',
    website: 'https://www.hilton.com',
    description: 'Exclusive wedding decor & cinema partner.',
    isPublished: true,
    order: 3,
    status: 'active',
  },
  {
    id: 'tc-cinnamon',
    name: 'Cinnamon Grand Colombo',
    industry: 'Luxury Hospitality & Resorts',
    partnershipType: 'Premier Gala & Banquet Client',
    logoUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=200&q=80',
    website: 'https://www.cinnamonhotels.com',
    description: 'Ballroom staging and grand lighting installations.',
    isPublished: true,
    order: 4,
    status: 'active',
  },
  {
    id: 'tc-jetwing',
    name: 'Jetwing Hotels & Travels',
    industry: 'Eco-Luxury Tourism',
    partnershipType: 'Tourism & Event Collaborator',
    logoUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=200&q=80',
    website: 'https://www.jetwinghotels.com',
    description: 'Travel curation and coastal festival productions.',
    isPublished: true,
    order: 5,
    status: 'active',
  },
  {
    id: 'tc-mas',
    name: 'MAS Holdings',
    industry: 'Global Apparel & Technology',
    partnershipType: 'Corporate Excellence Client',
    logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    website: 'https://www.masholdings.com',
    description: 'Corporate summit AV production and executive awards staging.',
    isPublished: true,
    order: 6,
    status: 'active',
  },
];

export const TrustedCompaniesSection: React.FC<TrustedCompaniesSectionProps> = ({ onExplorePartners }) => {
  const { trustedCompanies } = useFirestoreDataContext();

  // Combine Admin CMS companies, Firestore companies, and fallback clients
  const cmsCompanies = React.useMemo(() => {
    try {
      const local = cmsService.getAll<FirestoreTrustedCompany>('companies', { includeDeleted: false });
      if (local && local.length > 0) return local;
    } catch {}
    return [];
  }, []);

  const activeCompanies = React.useMemo(() => {
    const combined = [
      ...trustedCompanies.filter((c) => c.status !== 'inactive' && c.isPublished !== false),
      ...cmsCompanies.filter((c: any) => c.isActive !== false && !c.isDeleted),
    ];

    if (combined.length > 0) {
      // Deduplicate by ID or name
      const map = new Map<string, FirestoreTrustedCompany>();
      combined.forEach((c) => {
        const key = c.name?.toLowerCase().trim() || c.id;
        if (!map.has(key)) map.set(key, c);
      });
      return Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return DEFAULT_TRUSTED_CLIENTS;
  }, [trustedCompanies, cmsCompanies]);

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
          <span>OUR TRUSTED CLIENTS</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-slate-900 mb-2">
          Trusted by Industry Leaders
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Collaborating with national institutions, luxury hotel chains, and enterprise leaders across Sri Lanka.
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
