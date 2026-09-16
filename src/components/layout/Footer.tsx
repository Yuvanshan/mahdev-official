import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, ArrowRight, Shield, FileText, Check, ExternalLink, Globe } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { FOOTER_SECTIONS } from '../../config/navigation';
import { getTelLink, getMailtoLink, getMapSearchUrl } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getDivisionWhatsAppUrl } from '../../utils/whatsapp';

interface FooterProps {
  onNavigate: (path: string) => void;
  currentPath?: string;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentPath }) => {
  const { companySettings, siteSettings } = useFirestoreDataContext();

  const currentPathname = (currentPath || (typeof window !== 'undefined' ? window.location.pathname : '')).toLowerCase();
  let currentDivId = '';
  if (currentPathname.includes('sws') || currentPathname.includes('event')) currentDivId = 'sws';
  else if (currentPathname.includes('u1') || currentPathname.includes('cinema') || currentPathname.includes('studio')) currentDivId = 'u1';
  else if (currentPathname.includes('it') || currentPathname.includes('software')) currentDivId = 'it';
  else if (currentPathname.includes('travel')) currentDivId = 'travels';
  else if (currentPathname.includes('mart') || currentPathname.includes('shop')) currentDivId = 'mart';

  const footerWhatsAppUrl = getDivisionWhatsAppUrl(currentDivId);

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
      <footer className="w-full bg-[#06102B] text-blue-100/80 border-t border-blue-900/50 mt-auto">
        {/* Slogan Banner */}
        <div className="border-b border-blue-900/40 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Creating Moments. Capturing Memories. Delivering Innovation.
            </h3>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="space-y-4">
              <BrandLogo
                theme="dark"
                size="md"
                onClick={() => onNavigate('/')}
              />

              <p className="text-xs text-blue-200/70 leading-relaxed">
                Operating high-performance divisions across Sri Lanka and international partner networks.
              </p>

              {/* Direct Contact Anchors */}
              <div className="space-y-3 pt-2 text-xs text-blue-200/80">
                <a
                  href={getMailtoLink(email)}
                  className="flex items-center gap-2 text-blue-200/90 hover:text-blue-300 transition-colors group"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="break-all">{email}</span>
                </a>
                
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-300/70 text-[11px]">Hotline:</span>
                      <a
                        href={getTelLink(primaryPhone)}
                        className="hover:text-blue-300 transition-colors font-medium font-mono text-white"
                        title={`Call Hotline ${primaryPhone}`}
                      >
                        {primaryPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-300/70 text-[11px]">WhatsApp:</span>
                      <a
                        href={footerWhatsAppUrl}
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

                <div className="pt-1 space-y-2 border-t border-blue-900/40">
                  <div className="flex items-start gap-2 text-[11px] text-blue-300/70">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Colombo: {colomboAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-blue-300/70">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Trincomalee: {trincomaleeAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Link Columns: Company, Divisions, Legal Provisions */}
            {FOOTER_SECTIONS.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">
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
                        className="text-blue-300/70 hover:text-white transition-colors flex items-center justify-between group"
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="text-[10px] bg-blue-900/80 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-500/30">
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

          {/* Bottom Bar: Clean Copyright */}
          <div className="border-t border-blue-900/40 mt-12 sm:mt-16 pt-6 sm:pt-8 flex items-center justify-center text-xs text-blue-300/60">
            <span>
              © 2026 Mahdev Private Limited. All rights reserved.
            </span>
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
