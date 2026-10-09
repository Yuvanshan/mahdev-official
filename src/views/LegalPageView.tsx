import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  FileText,
  Clock,
  Printer,
  Share2,
  ChevronRight,
  CheckCircle2,
  ListFilter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, H3 } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ScrollReveal } from '../components/motion/MotionWrappers';
import { LegalPolicyType } from '../types';
import { LegalDocument, LegalSection } from '../types/websiteContent';
import {
  websiteContentService,
  DEFAULT_TERMS_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
} from '../services/firestore/websiteContent';

interface LegalPageViewProps {
  policyType: LegalPolicyType;
  onNavigate: (route: string) => void;
}

const POLICY_METADATA: Record<
  LegalPolicyType,
  { name: string; route: string; refCode: string; docId?: 'termsAndConditions' | 'privacyPolicy' }
> = {
  terms: {
    name: 'Terms & Conditions',
    route: '/terms-and-conditions',
    refCode: 'MDV-LEG-TRM-2026',
    docId: 'termsAndConditions',
  },
  privacy: {
    name: 'Privacy Policy',
    route: '/privacy-policy',
    refCode: 'MDV-LEG-PRV-2026',
    docId: 'privacyPolicy',
  },
  refund: {
    name: 'Refund Policy',
    route: '/refund-policy',
    refCode: 'MDV-LEG-RFD-2026',
  },
  shipping: {
    name: 'Shipping Policy',
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
  const [legalDoc, setLegalDoc] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = POLICY_METADATA[policyType] || POLICY_METADATA.terms;
  const docId = meta.docId || (policyType === 'privacy' ? 'privacyPolicy' : 'termsAndConditions');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let isMounted = true;
    setIsLoading(true);

    // Live subscription from Firestore
    const unsubscribe = websiteContentService.subscribeLegalDocument(
      docId,
      (liveDoc) => {
        if (isMounted) {
          setLegalDoc(liveDoc);
          setIsLoading(false);
          setHasError(false);
        }
      },
      false // public users receive published document
    );

    // Initial load fetch
    websiteContentService
      .getLegalDocument(docId, false)
      .then((doc) => {
        if (isMounted) {
          setLegalDoc(doc);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn(`[LegalPageView] Error loading ${docId}:`, err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [docId, policyType]);

  // Scroll spy for active section highlight
  useEffect(() => {
    if (!legalDoc?.sections) return;

    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-legal-section]');
      const scrollY = window.scrollY + 140;

      let currentId = '';
      sections.forEach((sec) => {
        const el = sec as HTMLElement;
        if (el.offsetTop <= scrollY) {
          currentId = el.id;
        }
      });

      if (currentId) {
        setActiveSectionId(currentId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [legalDoc]);

  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSectionId(sectionId);
      setMobileTocOpen(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const seoTitle =
    policyType === 'privacy'
      ? 'Privacy Policy | MAHDEV Pvt Ltd'
      : policyType === 'terms'
      ? 'Terms and Conditions | MAHDEV Pvt Ltd'
      : `${meta.name} | MAHDEV Pvt Ltd`;

  const seoDesc =
    policyType === 'privacy'
      ? 'Official Privacy Policy and Personal Data Protection guidelines of MAHDEV Pvt Ltd.'
      : 'Official Terms and Conditions, Commercial Agreement, and Service Governance of MAHDEV Pvt Ltd.';

  const currentSections = legalDoc?.sections || [];

  return (
    <div className="pt-20 sm:pt-24 pb-20 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonicalUrl={`https://mahdev.lk${meta.route}`}
      />

      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
              <button
                onClick={() => onNavigate('/')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Home
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Legal Governance</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-900">{meta.name}</span>
            </div>

            {/* Quick Policy Switcher Rail */}
            <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              {(Object.keys(POLICY_METADATA) as LegalPolicyType[]).map((type) => {
                const item = POLICY_METADATA[type];
                const isActive = type === policyType;
                return (
                  <button
                    key={type}
                    onClick={() => onNavigate(item.route)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Header Main Text & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-500">{meta.refCode}</span>
                  {legalDoc?.version && (
                    <span className="text-xs font-mono text-slate-500">
                      • Version {legalDoc.version}
                    </span>
                  )}
                </div>

                <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                  {legalDoc?.title || meta.name}
                </H1>

                <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium max-w-3xl">
                  {legalDoc?.subtitle ||
                    'Official governance and transparency agreement of MAHDEV Pvt Ltd.'}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 mt-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Last Updated:{' '}
                    <strong className="text-slate-800">
                      {legalDoc?.lastUpdated || 'March 2026'}
                    </strong>
                  </span>
                  {legalDoc?.effectiveDate && (
                    <span>• Effective: {legalDoc.effectiveDate}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Print and Share */}
              <div className="flex items-center gap-2 shrink-0 print:hidden">
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
                  leftIcon={
                    copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )
                  }
                >
                  {copied ? 'Copied Link' : 'Share'}
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Main Document Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Shimmer Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="hidden lg:block lg:col-span-4 h-96 bg-white rounded-2xl border border-slate-200" />
            <div className="lg:col-span-8 space-y-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="h-44 bg-white rounded-2xl border border-slate-200 p-6 space-y-3"
                >
                  <div className="h-6 w-1/3 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : hasError || currentSections.length === 0 ? (
          /* Error / Empty State */
          <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white rounded-2xl p-8 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-slate-900">
              Document Updating
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              This document is currently being updated in our administrative registry. Please check back shortly or reach out to our legal desk at info.mahdev.lk@gmail.com.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reload Page
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Mobile Collapsible Table of Contents */}
            <div className="lg:hidden print:hidden mb-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left text-sm font-bold text-slate-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-blue-600" />
                    <span>Table of Contents ({currentSections.length} Sections)</span>
                  </div>
                  {mobileTocOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {mobileTocOpen && (
                  <div className="p-4 border-t border-slate-100 max-h-72 overflow-y-auto space-y-1">
                    {currentSections.map((sec, idx) => {
                      const secId = `section-${idx + 1}`;
                      const isActive = activeSectionId === secId;
                      return (
                        <button
                          key={sec.id || secId}
                          type="button"
                          onClick={() => handleScrollTo(secId)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-mono text-slate-400 shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="truncate">{sec.heading}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Sticky Table of Contents Sidebar */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-28 print:hidden">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Table of Contents
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {currentSections.length} Sections
                  </span>
                </div>

                <nav className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
                  {currentSections.map((sec, idx) => {
                    const secId = `section-${idx + 1}`;
                    const isActive = activeSectionId === secId;
                    return (
                      <button
                        key={sec.id || secId}
                        type="button"
                        onClick={() => handleScrollTo(secId)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-start gap-2 ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span
                          className={`font-mono text-[11px] shrink-0 mt-0.5 ${
                            isActive ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span className="leading-snug">{sec.heading}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Direct Support Inquiries Footer */}
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Need legal clarification?</p>
                  <a
                    href="mailto:info.mahdev.lk@gmail.com"
                    className="text-blue-600 hover:underline block font-mono"
                  >
                    info.mahdev.lk@gmail.com
                  </a>
                </div>
              </div>
            </aside>

            {/* Document Content Sections */}
            <main className="lg:col-span-8 space-y-8">
              {currentSections.map((sec, idx) => {
                const secId = `section-${idx + 1}`;
                return (
                  <article
                    key={sec.id || secId}
                    id={secId}
                    data-legal-section
                    className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs scroll-mt-28 space-y-4"
                  >
                    {/* Section Number & Heading */}
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                        {idx + 1}
                      </span>
                      <H2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
                        {sec.heading}
                      </H2>
                    </div>

                    {/* Paragraphs and styled bullets */}
                    <div className="space-y-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-[72ch]">
                      {sec.content.map((para, pIdx) => {
                        const isBullet = para.startsWith('•') || para.startsWith('-');
                        if (isBullet) {
                          return (
                            <div key={pIdx} className="flex items-start gap-2.5 pl-2 py-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2" />
                              <span className="text-slate-700">{para.replace(/^[•\-]\s*/, '')}</span>
                            </div>
                          );
                        }

                        return (
                          <p key={pIdx} className="whitespace-pre-line">
                            {para}
                          </p>
                        );
                      })}
                    </div>

                    {/* Optional Subsections */}
                    {sec.subsections && sec.subsections.length > 0 && (
                      <div className="pt-3 space-y-3 border-t border-slate-100 mt-4">
                        {sec.subsections.map((sub, sIdx) => (
                          <div key={sIdx} className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900">{sub.title}</h4>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {sub.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}

              {/* Bottom Document Seal */}
              <div className="p-6 bg-slate-100/80 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>MAHDEV Pvt Ltd — Corporate Compliance Seal</span>
                </div>
                <p>
                  This official document is certified by the Executive Board of MAHDEV Pvt Ltd, Colombo and Trincomalee, Sri Lanka. Document Ref: {meta.refCode} • Stored dynamically on Cloud Firestore.
                </p>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};
