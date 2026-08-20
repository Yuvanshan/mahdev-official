import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  Floating3DObject,
} from '../motion/MotionWrappers';
import { CORPORATE_CONTACT_DETAILS } from '../../data/corporateData';
import { COMPANY_INFO, getTelLink, getMailtoLink, getMapSearchUrl } from '../../config/company';
import { useCompanySettings } from '../../hooks/useFirestoreData';
import { DIVISION_LIST } from '../../config/divisions';
import { evaluateBotRisk, checkActionThrottle } from '../../utils/securityProtection';
import { notificationService } from '../../services/notificationService';
import { analyticsService } from '../../services/analyticsService';

interface ContactCorporateSectionProps {
  defaultDivision?: string;
  defaultSubject?: string;
}

export const ContactCorporateSection: React.FC<ContactCorporateSectionProps> = ({
  defaultDivision = 'general',
  defaultSubject = '',
}) => {
  const { data: firestoreCompany } = useCompanySettings();
  const company = firestoreCompany?.name ? firestoreCompany : COMPANY_INFO;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    division: defaultDivision,
    serviceType: defaultSubject,
    message: '',
  });

  const [honeypotValue, setHoneypotValue] = useState('');
  const [formRenderTime] = useState<number>(() => Date.now());
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryRef, setInquiryRef] = useState('');

  // Validate form fields
  const validateForm = () => {
    const errs: { [key: string]: string } = {};

    // 1. Bot & Abuse Evaluation
    const botCheck = evaluateBotRisk({
      honeypotValue,
      formRenderTime,
      email: formData.email,
      messageOrNotes: formData.message,
    });

    if (!botCheck.isLegitimate) {
      errs.bot = botCheck.reason || 'Verification check failed. Please try again.';
    }

    if (!checkActionThrottle('corporate_contact_submit', 2000)) {
      errs.throttle = 'Please wait a moment before resubmitting your inquiry.';
    }

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (formData.phone.trim() && !/^[+0-9\s-()]{7,20}$/.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid phone number';
    }

    if (!formData.message.trim()) {
      errs.message = 'Please provide details about your project or inquiry';
    } else if (formData.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    // Simulate real network submission with inquiry reference generator
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      const ref = `MDV-${Math.floor(100000 + Math.random() * 900000)}`;
      setInquiryRef(ref);

      // Dispatch notifications safely
      if (formData.division !== 'general' || formData.serviceType) {
        analyticsService.trackQuoteRequested(
          formData.division,
          formData.serviceType || 'General Enterprise Consultation'
        );

        notificationService.notifyQuoteRequestReceived({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service: formData.serviceType || 'General Enterprise Consultation',
          division: formData.division,
        }).catch(() => {});

        notificationService.notifyAdminQuoteRequest({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          division: formData.division,
          details: formData.message,
        }).catch(() => {});
      } else {
        analyticsService.trackContactSubmitted('general', 'Corporate Contact Inquiry');

        notificationService.notifyAdminContactInquiry({
          name: formData.name,
          email: formData.email,
          subject: 'Corporate Contact Inquiry',
          message: formData.message,
        }).catch(() => {});
      }
    }, 700);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      division: 'general',
      serviceType: '',
      message: '',
    });
    setErrors({});
  };

  return (
    <SectionContainer id="contact" background="white" paddingY="xl" hasBorderBottom>
      <ScrollReveal direction="up">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Caption className="text-[#0052FF] mb-2 block">Direct Corporate Dispatch</Caption>
          <H2 className="text-slate-900 mb-3">Connect With Mahdev</H2>
          <Body className="text-slate-600 text-base">
            Reach out to our Colombo executive headquarters or direct your brief to a specific division. Guaranteed 24-hour turnaround across all inquiries.
          </Body>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Form with validation */}
        <div className="lg:col-span-7">
          <ScrollReveal direction="up">
            <TiltCard maxTilt={3} glareEffect={false}>
              <div className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200 shadow-xl">
                {submitted ? (
                  <div className="py-12 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div>
                      <Badge variant="electric" size="sm" className="mb-2">
                        Ref: {inquiryRef}
                      </Badge>
                      <h3 className="font-display text-2xl font-bold text-slate-900">
                        Inquiry Successfully Logged
                      </h3>
                      <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                        Thank you for reaching out, <span className="font-semibold text-slate-800">{formData.name}</span>. A dedicated project director from the selected division will review your brief and contact you within 24 hours.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-xs text-slate-600 space-y-1 text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Division:</span>
                        <span className="font-bold text-slate-900 capitalize">
                          {formData.division}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contact Email:</span>
                        <span className="font-bold text-slate-900">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Response SLA:</span>
                        <span className="font-bold text-emerald-600">Guaranteed within 24h</span>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" onClick={handleReset}>
                      Submit Another Corporate Inquiry
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Bot / Throttle Alert */}
                    {(errors.bot || errors.throttle) && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{errors.bot || errors.throttle}</span>
                      </div>
                    )}

                    {/* Hidden Honeypot Trap */}
                    <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                      <label htmlFor="company_website_contact_hp">Leave this field blank</label>
                      <input
                        id="company_website_contact_hp"
                        type="text"
                        name="_hp_corp_website"
                        value={honeypotValue}
                        onChange={(e) => setHoneypotValue(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <div className="border-b border-slate-100 pb-4 mb-2">
                      <h3 className="font-display text-xl font-bold text-slate-900">
                        Corporate Project Brief
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Fill out your requirements below to connect directly with our engineering or production leads.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        id="contact-name"
                        label="Full Name *"
                        placeholder="e.g. Kasun Fernando"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        error={errors.name}
                      />
                      <Input
                        id="contact-email"
                        label="Corporate Email *"
                        type="email"
                        placeholder="kasun@enterprise.lk"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        error={errors.email}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        id="contact-phone"
                        label="Phone / Mobile"
                        type="tel"
                        placeholder="+94 77 123 4567"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (errors.phone) setErrors({ ...errors, phone: '' });
                        }}
                        error={errors.phone}
                      />
                      <Select
                        id="contact-division"
                        label="Target Division *"
                        value={formData.division}
                        onChange={(e) =>
                          setFormData({ ...formData, division: e.target.value })
                        }
                        options={[
                          { value: 'general', label: 'Mahdev Corporate HQ (General)' },
                          ...DIVISION_LIST.map((d) => ({
                            value: d.id,
                            label: `${d.name} (${d.badge})`,
                          })),
                        ]}
                      />
                    </div>

                    <Input
                      id="contact-subject"
                      label="Service Type / Project Title"
                      placeholder="e.g. 2026 Annual Gala Staging / React Cloud Portal / 8K Brand Docuseries"
                      value={formData.serviceType}
                      onChange={(e) =>
                        setFormData({ ...formData, serviceType: e.target.value })
                      }
                    />

                    <Textarea
                      id="contact-message"
                      label="Project Description / Timeline / Budget Scope *"
                      rows={4}
                      placeholder="Please share details such as projected dates, guest volume, software requirements, or destination plans..."
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: '' });
                      }}
                      error={errors.message}
                    />

                    <div className="pt-2">
                      <Magnetic strength={0.2} className="w-full">
                        <Button
                          id="contact-submit-btn"
                          type="submit"
                          variant="electric"
                          size="md"
                          disabled={loading}
                          rightIcon={<Send className="w-4 h-4" />}
                          className="w-full justify-center shadow-lg shadow-blue-500/20 text-sm font-bold"
                        >
                          {loading ? 'Transmitting Corporate Inquiry...' : 'Submit Corporate Inquiry'}
                        </Button>
                      </Magnetic>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>✓ Encrypted Transmission (TLS 1.3)</span>
                      <span>✓ Strictly Confidential (NDA Protected)</span>
                    </div>
                  </form>
                )}
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>

        {/* Right Column: Channels, WhatsApp & HQ Locator Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Direct Communication Channels */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Instant Communication Channels
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-3.5">
                {/* WhatsApp Direct */}
                <a
                  href={company.socials?.whatsapp || `https://wa.me/94750928078`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/80 transition-all text-white group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">WhatsApp Corporate</span>
                      <span className="text-xs text-emerald-300">
                        {company.primaryPhone || COMPANY_INFO.primaryPhone}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </a>

                {/* Telephone Hotlines */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Corporate Phone Hotlines</span>
                      <span className="text-[11px] text-slate-400">Direct Line & Executive Desk</span>
                    </div>
                  </div>
                  <div className="pl-13 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <a
                      href={getTelLink(company.primaryPhone || COMPANY_INFO.primaryPhone)}
                      className="font-medium text-white hover:text-blue-400 transition-colors"
                    >
                      {company.primaryPhone || COMPANY_INFO.primaryPhone}
                    </a>
                    <span className="text-slate-600">•</span>
                    <a
                      href={getTelLink(company.secondaryPhone || COMPANY_INFO.secondaryPhone)}
                      className="font-medium text-white hover:text-blue-400 transition-colors"
                    >
                      {company.secondaryPhone || COMPANY_INFO.secondaryPhone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <a
                  href={getMailtoLink(company.email || COMPANY_INFO.email)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block">Official Corporate Email</span>
                    <span className="text-xs text-slate-300 break-all font-mono">
                      {company.email || COMPANY_INFO.email}
                    </span>
                  </div>
                </a>
              </div>

              {/* Working Hours */}
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold">Business Operating Hours</span>
                </div>
                <p className="pl-5.5">{company.workingHours?.weekdays || COMPANY_INFO.workingHours.weekdays}</p>
                <p className="pl-5.5">{company.workingHours?.weekends || COMPANY_INFO.workingHours.weekends}</p>
                <p className="pl-5.5 text-blue-400 text-[11px] font-medium">{company.workingHours?.support || COMPANY_INFO.workingHours.support}</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Official Offices: Colombo & Trincomalee */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="space-y-4">
              {/* Colombo Office Card */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0052FF] flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-slate-900 text-sm">
                        {company.offices?.colombo?.name || 'Colombo Office'}
                      </h4>
                      <Badge variant="electric" size="sm" className="text-[9px] py-0 px-1.5">
                        Corporate Headquarters
                      </Badge>
                    </div>
                  </div>
                  <a
                    href={getMapSearchUrl(company.offices?.colombo?.mapQuery || COMPANY_INFO.offices.colombo.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-medium text-slate-900 leading-relaxed">
                    {company.offices?.colombo?.address || COMPANY_INFO.offices.colombo.address}
                  </p>
                </div>
              </div>

              {/* Trincomalee Office Card */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-slate-900 text-sm">
                        {company.offices?.trincomalee?.name || 'Trincomalee Office'}
                      </h4>
                      <Badge variant="default" size="sm" className="text-[9px] py-0 px-1.5">
                        Regional Operations & Studio
                      </Badge>
                    </div>
                  </div>
                  <a
                    href={getMapSearchUrl(company.offices?.trincomalee?.mapQuery || COMPANY_INFO.offices.trincomalee.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-medium text-slate-900 leading-relaxed">
                    {company.offices?.trincomalee?.address || COMPANY_INFO.offices.trincomalee.address}
                  </p>
                </div>
              </div>

              {/* Social Media Links Matrix */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Official Channels & Social Registry
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CORPORATE_CONTACT_DETAILS.socials.map((soc) => (
                    <a
                      key={soc.name}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:text-[#0052FF] transition-all text-xs font-semibold text-slate-700 flex items-center justify-between group"
                    >
                      <span>{soc.name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#0052FF]" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </SectionContainer>
  );
};
