import React, { useState } from 'react';
import { ExternalLink, Handshake, Building2, CheckCircle2, Globe, Shield, Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
} from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { FirestoreTrustedCompany } from '../../types/firestore';
import { DataLoadingOverlay } from '../common/DataLoadingOverlay';

interface TrustedCompaniesMatrixProps {
  onExplorePartners?: () => void;
}

export const TrustedCompaniesMatrix: React.FC<TrustedCompaniesMatrixProps> = ({ onExplorePartners }) => {
  const { trustedCompanies, homepageConfig, isInitialLoading, isFetching } = useFirestoreDataContext();
  const [selectedCompany, setSelectedCompany] = useState<FirestoreTrustedCompany | null>(null);

  if (homepageConfig.companies && !homepageConfig.companies.enabled) {
    return null;
  }

  const activeCompanies = trustedCompanies.filter((c) => (c as any).status !== 'archived');

  if (activeCompanies.length === 0) {
    if (isInitialLoading || isFetching) {
      return (
        <SectionContainer id="companies" background="white" paddingY="lg">
          <DataLoadingOverlay
            message="Loading enterprise partners..."
            subMessage="Connecting to verified partner database in Firestore"
          />
        </SectionContainer>
      );
    }
    return null;
  }

  const meta = homepageConfig.companies || {
    badge: 'INSTITUTIONAL COLLABORATIONS',
    title: 'Trusted Enterprise Partners',
    subtitle: 'Powering hallmark productions, software architectures, luxury travel expeditions, and equipment deployments for industry leaders across Sri Lanka.',
  };

  return (
    <SectionContainer id="companies" background="white" paddingY="xl" hasBorderBottom>
      <ScrollReveal direction="up">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0052FF] text-xs font-semibold mb-2 shadow-2xs">
            <Handshake className="w-3.5 h-3.5" />
            <span>{meta.badge || 'Institutional Collaborations'}</span>
          </div>
          <H2 className="text-slate-900 mb-3">{meta.title || 'Trusted Enterprise Partners'}</H2>
          <Body className="text-slate-600 text-base">
            {meta.subtitle ||
              'Powering hallmark productions, software architectures, luxury travel expeditions, and equipment deployments for industry leaders across Sri Lanka.'}
          </Body>
        </div>
      </ScrollReveal>

      {/* Enterprise Matrix Cards - Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible">
        {activeCompanies.map((company, idx) => {
          // Generate initials for company logo mark
          const initials = company.name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('');

          return (
            <div
              key={company.id}
              className="min-w-[80vw] sm:min-w-0 snap-center shrink-0 sm:shrink"
            >
              <ScrollReveal direction="up" delay={idx * 0.06}>
                <TiltCard maxTilt={5} glareEffect className="h-full">
                  <div
                    onClick={() => setSelectedCompany(company)}
                    className="group h-full p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-[#0052FF] hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Header: Monogram Logo & Industry Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center font-display font-bold text-slate-800 text-sm group-hover:bg-[#0052FF] group-hover:text-white group-hover:border-[#0052FF] transition-all duration-300">
                          {company.logoUrl && company.logoUrl.trim() !== '' ? (
                            <img src={company.logoUrl} alt={company.name} className="w-8 h-8 object-contain" />
                          ) : (
                            initials
                          )}
                        </div>
                        <Badge variant="outline" size="sm" className="text-slate-600 bg-white">
                          {(company.industry || '').split('&')[0].trim()}
                        </Badge>
                      </div>

                      <h3 className="font-display text-lg font-bold text-slate-900 mb-1 group-hover:text-[#0052FF] transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 mb-3">
                        {company.partnershipType || 'Enterprise Partner'}
                      </p>

                      {company.description && (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {company.description}
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                      <span className="text-[11px] font-medium text-[#0052FF] group-hover:underline flex items-center gap-1">
                        Partnership Scope <ExternalLink className="w-3 h-3" />
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                        Verified Client
                      </span>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            </div>
          );
        })}
      </div>

      {/* Optional CTA to dedicated clients page */}
      {onExplorePartners && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onExplorePartners}
            className="text-xs font-semibold hover:border-[#0052FF] hover:text-[#0052FF]"
          >
            Explore Client Case Studies & Testimonials →
          </Button>
        </div>
      )}

      {/* Partnership Detail Modal for CMS Readiness */}
      <Modal
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        title={selectedCompany?.name || 'Company Profile'}
        size="md"
      >
        {selectedCompany && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-display font-bold text-xl flex items-center justify-center shadow-md shrink-0">
                {selectedCompany.name
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')}
              </div>
              <div className="space-y-1">
                <Badge variant="electric" size="sm">
                  {selectedCompany.industry}
                </Badge>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {selectedCompany.name}
                </h3>
                <p className="text-xs font-semibold text-blue-600">
                  {selectedCompany.partnershipType || 'Enterprise Partner'}
                </p>
              </div>
            </div>

            {selectedCompany.description && (
              <div className="space-y-2 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Partnership Details & Scope
                </h4>
                <p>{selectedCompany.description}</p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">Master Service Level Agreement: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Multi-division enterprise retainer contract</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedCompany.website ? (
                <a
                  href={selectedCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Visit Partner Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Institutional Partner</span>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedCompany(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </SectionContainer>
  );
};
