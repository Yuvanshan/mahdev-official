import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Clock,
  Printer,
  Share2,
  ChevronRight,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ScrollReveal, Magnetic } from '../components/motion/MotionWrappers';
import { LEGAL_POLICIES_CONTENT } from '../data/corporateData';
import { COMPANY_INFO } from '../config/company';
import { LegalPolicyType } from '../types';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';

interface LegalPageViewProps {
  policyType: LegalPolicyType;
  onNavigate: (route: string) => void;
}

const POLICY_METADATA: Record<
  LegalPolicyType,
  { name: string; route: string; refCode: string }
> = {
  privacy: {
    name: 'Privacy Policy',
    route: '/privacy-policy',
    refCode: 'MDV-LEG-PRV-2026',
  },
  terms: {
    name: 'Terms & Conditions',
    route: '/terms-and-conditions',
    refCode: 'MDV-LEG-TRM-2026',
  },
  refund: {
    name: 'Refund & Cancellation',
    route: '/refund-policy',
    refCode: 'MDV-LEG-RFD-2026',
  },
  shipping: {
    name: 'Shipping & Delivery',
    route: '/shipping-policy',
    refCode: 'MDV-LEG-SHP-2026',
  },
  cookie: {
    name: 'Cookie Policy',
    route: '/cookie-policy',
    refCode: 'MDV-LEG-CKI-2026',
  },
};

export const LegalPageView: React.FC<LegalPageViewProps> = ({ policyType, onNavigate }) => {
  const { companySettings } = useFirestoreDataContext();
  const [copied, setCopied] = useState(false);
  const currentDoc = LEGAL_POLICIES_CONTENT[policyType];
  const meta = POLICY_METADATA[policyType];
  const legalName = companySettings?.legalName || COMPANY_INFO.legalName;
  const colomboAddress = companySettings?.offices?.colombo?.address || COMPANY_INFO.offices.colombo.address;
  const contactEmail = companySettings?.email || COMPANY_INFO.email;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [policyType]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
            <button
              onClick={() => onNavigate('/')}
              className="hover:text-[#0052FF] transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Corporate Governance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900">{meta.name}</span>
          </div>

          {/* Policy Switcher Quick Rail */}
          <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
            {(Object.keys(POLICY_METADATA) as LegalPolicyType[]).map((type) => {
              const item = POLICY_METADATA[type];
              const isActive = type === policyType;
              return (
                <button
                  key={type}
                  onClick={() => onNavigate(item.route)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0052FF] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="electric" size="sm">
                  Official Legal Document
                </Badge>
                <span className="text-xs font-mono text-slate-500">{meta.refCode}</span>
              </div>
              <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                {currentDoc.title}
              </H1>
              <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                {currentDoc.subtitle}
              </p>
            </div>

            {/* Utility Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print / PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                {copied ? 'Link Copied!' : 'Share Document'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0052FF]" />
              Effective: {currentDoc.effectiveDate}
            </span>
            <span>•</span>
            <span>Last Revised: {currentDoc.lastUpdated}</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fully Compliant
            </span>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Main Document Content with Sidebar Table of Contents */}
      <SectionContainer paddingY="lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Table of Contents Sticky Rail */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <FileText className="w-4 h-4 text-[#0052FF]" />
                <span>Document Sections</span>
              </div>

              <nav className="space-y-1.5">
                {currentDoc.sections.map((sec, idx) => (
                  <a
                    key={idx}
                    href={`#section-${idx}`}
                    className="block text-xs font-medium text-slate-600 hover:text-[#0052FF] hover:bg-blue-50/60 p-2 rounded-xl transition-colors"
                  >
                    {sec.heading}
                  </a>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Questions on Compliance?
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our Corporate Governance and Legal team in Colombo is available to assist with contract questions.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('/contact')}
                  className="w-full text-xs"
                >
                  Contact Legal Department
                </Button>
              </div>
            </div>
          </div>

          {/* Document Body */}
          <div className="lg:col-span-8 space-y-8">
            <div className="p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-8">
              {currentDoc.sections.map((section, idx) => (
                <div key={idx} id={`section-${idx}`} className="scroll-mt-32 space-y-3">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
                    {section.heading}
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {section.content.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Support Banner */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm">
                    {legalName} Corporate Office
                  </h4>
                  <p className="text-xs text-slate-300">
                    Colombo: {colomboAddress} • {contactEmail}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="electric"
                onClick={() => onNavigate('/contact')}
              >
                Inquire With Legal
              </Button>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};
