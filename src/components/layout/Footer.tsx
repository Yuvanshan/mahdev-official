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
import { SocialLinks } from '../common/SocialLinks';

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
        `${companyName} respects your privacy. This policy explains what personal information we collect, why we collect it, how we use and protect it, and when we share it across SWS Event Management, U1 Studio, MAHDEV IT & Solutions, MAHDEV Travels and MAHDEV Online Mart. We do not sell customers' personal information as a business practice.`,
      'Terms & Conditions':
        `By accessing the ${companyName} website, requesting a quotation, placing an order or confirming a booking, you agree to the terms applicable to the relevant transaction.`,
      'Refund Policy':
        'Cancellations, refunds, returns and replacements are assessed under division-specific rules, the agreed booking terms and applicable law. We aim to process approved refunds within 14 business days.',
      'Shipping Policy':
        'MAHDEV Online Mart delivery and collection options, charges and estimated timeframes are communicated before an order is confirmed.',
      'Cookie Policy':
        'Our website may use essential cookies and similar technologies for functionality, security, preferences and sessions. Where required by law, non-essential cookies are subject to consent.',
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
      <footer className="public-site-footer mt-auto w-full border-t">
        {/* Slogan Banner */}
        <div className="border-b py-6 px-3 text-center sm:px-6 sm:py-8 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-display text-xl font-medium tracking-tight sm:text-2xl lg:text-3xl">
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
                theme="light"
                size="md"
                onClick={() => onNavigate('/')}
              />
              <SocialLinks socials={companySettings?.socials} variant="light" />

              {/* Direct Contact Anchors */}
              <div className="public-footer-contact space-y-3 pt-2 text-xs">
                <a
                  href={getMailtoLink(email)}
                  className="flex items-center gap-2 transition-colors group"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#0052FF]" />
                  <span className="break-all">{email}</span>
                </a>
                
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#0052FF]" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">Hotline:</span>
                      <a
                        href={getTelLink(primaryPhone)}
                        className="font-mono font-medium text-slate-900 transition-colors hover:text-[#0052FF]"
                        title={`Call Hotline ${primaryPhone}`}
                      >
                        {primaryPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">WhatsApp:</span>
                      <a
                        href={footerWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-medium text-emerald-700 transition-colors hover:text-emerald-800"
                        title="WhatsApp 075 092 8078"
                      >
                        075 092 8078
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-200 pt-2">
                  <div className="flex items-start gap-2 text-[11px] text-slate-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0052FF]" />
                    <span>Colombo: {colomboAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0052FF]" />
                    <span>Trincomalee: {trincomaleeAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Link Columns: Company, Divisions, Legal Provisions */}
            {FOOTER_SECTIONS.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
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
                        className="flex items-center justify-between text-slate-600 transition-colors group hover:text-[#0052FF]"
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
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
          <div className="mt-12 flex items-center justify-center border-t pt-6 text-center text-xs text-slate-500 sm:mt-16 sm:pt-8">
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
