import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, ArrowRight, Shield, FileText, Check, ExternalLink, Globe } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { FOOTER_SECTIONS } from '../../config/navigation';
import { getTelLink, getMailtoLink, getMapSearchUrl } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { companySettings, siteSettings } = useFirestoreDataContext();

  const companyName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
  const tagline = companySettings?.tagline || 'Pioneering Creative Artistry & Modern Technology';
  const description = companySettings?.description || 'A unified multi-division powerhouse driving creative entertainment, visual storytelling, cloud engineering, luxury travel, and verified commerce.';
  const email = companySettings?.email || 'info.mahdev.lk@gmail.com';
  const primaryPhone = companySettings?.primaryPhone || '075 092 8078';
  const secondaryPhone = companySettings?.secondaryPhone || '075 092 8078';
  const domain = companySettings?.domain || 'mahdev.lk';

  const colomboAddress = companySettings?.offices?.colombo?.address || '41/22, Pickerings Road, Kotahena, Colombo 13, Sri Lanka';
  const colomboMapQuery = companySettings?.offices?.colombo?.mapQuery || '41/22 Pickerings Road, Kotahena, Colombo 13, Sri Lanka';
  const trincomaleeAddress = companySettings?.offices?.trincomalee?.address || '95/15, Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka';
  const trincomaleeMapQuery = companySettings?.offices?.trincomalee?.mapQuery || '95/15 Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka';

  const currentYear = new Date().getFullYear();
  const legalName = companySettings?.name
    ? (companySettings.name.includes('(Pvt) Ltd') || companySettings.name.includes('Pvt Ltd') ? companySettings.name : `${companySettings.name} (Pvt) Ltd`)
    : 'Mahdev (Pvt) Ltd';
  const regNumber = companySettings?.registrationNumber || 'PV 00260901';

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
        `${companyName} values your privacy. This policy outlines how we collect, safeguard, and use information across our parent enterprise and all child divisions (SWS Event Management, U1 Studio, IT & Solutions, Mahdev Travels, and Mahdev Online Mart). We never sell your personal data.`,
      'Terms & Conditions':
        `By utilizing ${companyName} digital services, consulting divisions, or commercial portals, you agree to our standard terms of service, intellectual property standards, and lawful engagement guidelines.`,
      'Refund Policy':
        'Service cancellations and commercial product returns adhere to division-specific terms. Event management and studio productions follow staged milestone retainer agreements, while e-commerce orders qualify for standard 7-day verified returns.',
      'Shipping Policy':
        'Mahdev Online Mart provides tracked express delivery across Sri Lanka and priority international freight for authorized enterprise hardware procurements.',
      'Cookie Policy':
        'We use minimal, privacy-first functional cookies to optimize site performance, secure your sessions, and maintain division navigation preferences.',
    };

    setActiveLegalModal({
      title: label,
      content: legalContentMap[label] || `Official legal disclosure for ${label} — ${companyName}.`,
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
      <footer className="w-full bg-[#130724] text-purple-200/80 border-t border-purple-900/50 mt-auto">
        {/* Top Highlight Strip */}
        <div className="border-b border-purple-900/40 py-8 sm:py-10 px-3 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
                <Shield className="w-3.5 h-3.5" />
                <span>The {companyName} Enterprise</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {tagline}
              </h3>
              <p className="text-purple-200/70 text-sm mt-2 max-w-xl">
                {description}
              </p>
            </div>

            {/* Newsletter Subscription Foundation */}
            <div className="lg:col-span-5 bg-[#1E0B36]/90 rounded-xl p-4 sm:p-5 border border-purple-900/50">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200 block mb-1">
                Executive Dispatch
              </span>
              <p className="text-xs text-purple-300/70 mb-3">
                Receive quarterly technology briefings, project releases, and company announcements.
              </p>
              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium py-2">
                  <Check className="w-4 h-4" />
                  <span>Thank you for subscribing to {companyName} Executive Dispatch.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 bg-[#130724] border border-purple-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <Button variant="electric" size="sm" type="submit" className="shrink-0">
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
              <BrandLogo
                theme="dark"
                size="md"
                onClick={() => onNavigate('/')}
              />

              <p className="text-xs text-purple-200/70 leading-relaxed">
                Operating high-performance divisions across Sri Lanka and international partner networks.
              </p>

              {/* Direct Contact Anchors */}
              <div className="space-y-3 pt-2 text-xs text-purple-200/80">
                <a
                  href={getMailtoLink(email)}
                  className="flex items-center gap-2 text-purple-200/90 hover:text-purple-300 transition-colors group"
                >
                  <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="break-all">{email}</span>
                </a>
                
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-300/70 text-[11px]">Hotline:</span>
                      <a
                        href={getTelLink(primaryPhone)}
                        className="hover:text-purple-300 transition-colors font-medium font-mono text-white"
                        title={`Call Hotline ${primaryPhone}`}
                      >
                        {primaryPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-300/70 text-[11px]">WhatsApp:</span>
                      <a
                        href="https://wa.me/94750928078?text=Hello%20Mahdev%20Pvt%20Ltd"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-300 transition-colors font-medium font-mono text-emerald-400"
                        title="WhatsApp 075 092 8078"
                      >
                        075 092 8078
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-1 space-y-2 border-t border-purple-900/40">
                  <div className="flex items-start gap-2 text-[11px] text-purple-300/70">
                    <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>Colombo: {colomboAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-purple-300/70">
                    <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>Trincomalee: {trincomaleeAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Link Columns */}
            {FOOTER_SECTIONS.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-200">
                  {section.title}
                </h4>
                <ul className="space-y-2 text-xs">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a
                        href={link.href}
                        onClick={(e) => {
                          if (link.href.startsWith('/')) {
                            e.preventDefault();
                            onNavigate(link.href);
                          } else {
                            handleLegalClick(e, link.label);
                          }
                        }}
                        className="text-purple-300/70 hover:text-white transition-colors flex items-center justify-between group"
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="text-[10px] bg-purple-900/80 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar: Copyright & Verified Registrations */}
          <div className="border-t border-purple-900/40 mt-12 sm:mt-16 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-purple-300/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>
                © {currentYear} {legalName}. All rights reserved.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <span>Democratic Socialist Republic of Sri Lanka</span>
              <span>Reg: {regNumber}</span>
              <span>VAT / SVAT Compliant</span>
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
            <span>{companyName} Legal Registry • Document Ref: MDV-2026-LEG</span>
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
