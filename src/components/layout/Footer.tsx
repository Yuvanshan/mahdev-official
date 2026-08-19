import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, Shield, FileText, Check, ExternalLink } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { FOOTER_SECTIONS } from '../../config/navigation';
import { BRAND_CONFIG } from '../../config/brand';
import { COMPANY_INFO, getTelLink, getMailtoLink, getMapSearchUrl } from '../../config/company';
import { useCompanySettings } from '../../hooks/useFirestoreData';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { data: dynamicSettings } = useCompanySettings();
  const company = dynamicSettings && dynamicSettings.name ? {
    ...COMPANY_INFO,
    ...dynamicSettings,
    offices: {
      colombo: {
        ...COMPANY_INFO.offices.colombo,
        ...(dynamicSettings.offices?.colombo || {}),
      },
      trincomalee: {
        ...COMPANY_INFO.offices.trincomalee,
        ...(dynamicSettings.offices?.trincomalee || {}),
      },
    },
  } : COMPANY_INFO;

  const [activeLegalModal, setActiveLegalModal] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleLegalClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    const legalContentMap: Record<string, string> = {
      'Privacy Policy':
        'Mahdev Pvt Ltd values your privacy. This policy outlines how we collect, safeguard, and use information across our parent enterprise and all child divisions (SWS Event Management, U1 Studio, IT & Solutions, Mahdev Travels, and Mahdev Online Mart). We never sell your personal data.',
      'Terms & Conditions':
        'By utilizing Mahdev Pvt Ltd digital services, consulting divisions, or commercial portals, you agree to our standard corporate terms of service, intellectual property standards, and lawful engagement guidelines.',
      'Refund Policy':
        'Service cancellations and commercial product returns adhere to division-specific terms. Event management and studio productions follow staged milestone retainer agreements, while e-commerce orders qualify for standard 7-day verified returns.',
      'Shipping Policy':
        'Mahdev Online Mart provides tracked express delivery across Sri Lanka and priority international freight for authorized enterprise hardware procurements.',
      'Cookie Policy':
        'We use minimal, privacy-first functional cookies to optimize site performance, secure your sessions, and maintain division navigation preferences.',
    };

    setActiveLegalModal({
      title: label,
      content: legalContentMap[label] || `Official legal disclosure for ${label} — Mahdev Pvt Ltd.`,
    });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
    }
  };

  return (
    <>
      <footer className="w-full bg-slate-950 text-slate-300 border-t border-slate-900 mt-auto">
        {/* Top Corporate Highlight Strip */}
        <div className="border-b border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
                <Shield className="w-3.5 h-3.5" />
                <span>The Mahdev Corporate Ecosystem</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {BRAND_CONFIG.tagline}
              </h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                A unified multi-division powerhouse driving creative entertainment, visual storytelling, cloud engineering, luxury travel, and verified commerce.
              </p>
            </div>

            {/* Newsletter Subscription Foundation */}
            <div className="lg:col-span-5 bg-slate-900/90 rounded-xl p-5 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Executive Dispatch
              </span>
              <p className="text-xs text-slate-400 mb-3">
                Receive quarterly technology briefings, project releases, and corporate announcements.
              </p>
              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium py-2">
                  <Check className="w-4 h-4" />
                  <span>Thank you for subscribing to Mahdev Executive Dispatch.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter corporate email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                  />
                  <Button variant="electric" size="sm" type="submit">
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
              <div
                onClick={() => onNavigate('/')}
                className="cursor-pointer inline-block"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-display font-extrabold text-white text-sm shadow-md">
                    M
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-white text-lg tracking-tight">
                      MAHDEV
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 tracking-wider">
                      PVT LTD
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Operating high-performance divisions across Sri Lanka and international partner networks.
              </p>

              {/* Direct Contact Anchors */}
              <div className="space-y-3 pt-2 text-xs text-slate-300">
                <a
                  href={getMailtoLink(company.email)}
                  className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors group"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="break-all">{company.email}</span>
                </a>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <a
                        href={getTelLink(company.primaryPhone)}
                        className="hover:text-blue-400 transition-colors font-medium"
                      >
                        {company.primaryPhone}
                      </a>
                      <span className="text-slate-600">/</span>
                      <a
                        href={getTelLink(company.secondaryPhone)}
                        className="hover:text-blue-400 transition-colors font-medium"
                      >
                        {company.secondaryPhone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-1 space-y-2 border-t border-slate-800/80">
                  <a
                    href={getMapSearchUrl(company.offices.colombo.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:text-blue-400 transition-colors group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200 block text-[11px]">Colombo Office:</span>
                      <span className="text-[11px] text-slate-400">{company.offices.colombo.address}</span>
                    </div>
                  </a>

                  <a
                    href={getMapSearchUrl(company.offices.trincomalee.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:text-blue-400 transition-colors group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200 block text-[11px]">Trincomalee Office:</span>
                      <span className="text-[11px] text-slate-400">{company.offices.trincomalee.address}</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Navigation Link Columns */}
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className="font-display text-sm font-semibold text-white tracking-tight">
                  {section.title}
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  {section.links.map((link) => {
                    return (
                      <li key={link.label}>
                        <button
                          onClick={() => {
                            if (link.href.startsWith('/')) {
                              onNavigate(link.href);
                            } else {
                              onNavigate('/' + link.href);
                            }
                          }}
                          className="hover:text-blue-400 transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>{link.label}</span>
                          {link.badge && (
                            <Badge size="sm" variant="electric" className="text-[9px] py-0 px-1.5">
                              {link.badge}
                            </Badge>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Copyright and Socials */}
          <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} {BRAND_CONFIG.legalName}. All rights reserved. {BRAND_CONFIG.domain}
            </p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-300 transition-colors">Colombo Office</span>
              <span>•</span>
              <span className="hover:text-slate-300 transition-colors">Trincomalee Office</span>
              <span>•</span>
              <span className="hover:text-slate-300 transition-colors">Islandwide Operations</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modal Dialog */}
      <Modal
        isOpen={!!activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
        title={activeLegalModal?.title}
      >
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>{activeLegalModal?.content}</p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Mahdev Corporate Legal Registry • Document Ref: MDV-2026-LEG</span>
          </div>
          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="primary" onClick={() => setActiveLegalModal(null)}>
              Close Document
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
