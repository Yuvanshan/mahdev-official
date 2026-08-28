import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Compass, Mail, Phone, Send, Sparkles, MapPin } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  Floating3DObject,
} from '../motion/MotionWrappers';
import { BRAND_CONFIG } from '../../config/brand';
import { COMPANY_INFO, getTelLink, getMailtoLink, getMapSearchUrl } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DIVISION_LIST } from '../../config/divisions';

interface CallToActionSectionProps {
  onExploreServices?: () => void;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({
  onExploreServices,
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const { homepageConfig, companySettings } = useFirestoreDataContext();
  const company = companySettings?.name ? companySettings : COMPANY_INFO;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    division: 'general',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const cta = homepageConfig?.ctaSection || {
    badge: "LET'S BUILD TOGETHER",
    headline: "Let's Create Something Remarkable.",
    subheadline: 'Connect with Mahdev Pvt Ltd corporate headquarters or route your project directly to one of our specialized divisions.',
    primaryButtonText: 'Schedule Consultation',
    primaryButtonLink: '#contact',
    secondaryButtonText: 'Explore Services',
    secondaryButtonLink: '#featured-services',
    contactPhone: company.primaryPhone || COMPANY_INFO.primaryPhone,
    contactEmail: company.email || COMPANY_INFO.email,
    corporateLocation: company.offices?.colombo?.address || COMPANY_INFO.offices.colombo.fullAddress,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <SectionContainer
      id="contact"
      background="white"
      paddingY="xl"
      hasBorderBottom
    >
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 sm:p-12 lg:p-16 text-white border border-slate-800 shadow-2xl">
        {/* Floating 3D ambient objects */}
        <Floating3DObject
          size={70}
          delay={0}
          duration={8}
          className="top-8 right-12 opacity-30"
        />
        <Floating3DObject
          size={50}
          delay={2}
          duration={6}
          className="bottom-10 left-10 opacity-20"
        />

        {/* Ambient background glow nodes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Narrative Column */}
          <div className="lg:col-span-6 space-y-6">
            <ScrollReveal direction="up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>{cta.badge || "Let's Build Together"}</span>
              </div>

              <H2 className="text-white mt-2 mb-4 font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight">
                {cta.headline || "Let's Create Something Remarkable."}
              </H2>

              <Body className="text-slate-300 text-base sm:text-lg leading-relaxed">
                {cta.subheadline ||
                  'Connect with Mahdev Pvt Ltd corporate headquarters or route your project directly to one of our specialized divisions.'}
              </Body>

              {/* Direct Contacts Bar */}
              <div className="pt-4 space-y-3.5">
                <a
                  href={getMailtoLink(company.email || COMPANY_INFO.email)}
                  className="flex items-center gap-3 text-sm text-slate-300 hover:text-blue-400 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-medium break-all">{company.email || COMPANY_INFO.email}</span>
                </a>

                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <a
                      href={getTelLink(company.primaryPhone || COMPANY_INFO.primaryPhone)}
                      className="font-medium text-slate-300 hover:text-blue-400 transition-colors"
                    >
                      {company.primaryPhone || COMPANY_INFO.primaryPhone}
                    </a>
                    <span className="text-slate-500">•</span>
                    <a
                      href={getTelLink(company.secondaryPhone || COMPANY_INFO.secondaryPhone)}
                      className="font-medium text-slate-300 hover:text-blue-400 transition-colors"
                    >
                      {company.secondaryPhone || COMPANY_INFO.secondaryPhone}
                    </a>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <a
                    href={getMapSearchUrl(company.offices?.colombo?.mapQuery || COMPANY_INFO.offices.colombo.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-sm text-slate-300 hover:text-blue-400 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-blue-300 font-semibold uppercase tracking-wider block">
                        Colombo Office
                      </span>
                      <span className="text-xs text-slate-300 leading-relaxed">
                        {company.offices?.colombo?.address || COMPANY_INFO.offices.colombo.address}
                      </span>
                    </div>
                  </a>

                  <a
                    href={getMapSearchUrl(company.offices?.trincomalee?.mapQuery || COMPANY_INFO.offices.trincomalee.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-sm text-slate-300 hover:text-blue-400 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-blue-300 font-semibold uppercase tracking-wider block">
                        Trincomalee Office
                      </span>
                      <span className="text-xs text-slate-300 leading-relaxed">
                        {company.offices?.trincomalee?.address || COMPANY_INFO.offices.trincomalee.address}
                      </span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Magnetic strength={0.25}>
                  <Button
                    variant="outline"
                    onClick={onExploreServices}
                    rightIcon={<Compass className="w-4 h-4" />}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 cursor-pointer"
                  >
                    {cta.secondaryButtonText || 'Explore Services'}
                  </Button>
                </Magnetic>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Direct Corporate Dispatch Form */}
          <div className="lg:col-span-6">
            <ScrollReveal direction="up" delay={0.2}>
              <TiltCard maxTilt={5} glareEffect={false}>
                <div className="p-6 sm:p-8 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200">
                  {submitted ? (
                    <div className="py-10 text-center space-y-4">
                      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h4 className="font-display text-xl font-bold text-slate-900">
                        Inquiry Received
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto">
                        Thank you for reaching out to Mahdev Pvt Ltd. A corporate representative from the selected division will contact you within 24 hours.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            name: '',
                            email: '',
                            phone: '',
                            division: 'general',
                            message: '',
                          });
                        }}
                      >
                        Submit Another Inquiry
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="border-b border-slate-100 pb-3 mb-4">
                        <h4 className="font-display text-lg font-bold text-slate-900">
                          Direct Corporate Inquiry
                        </h4>
                        <p className="text-xs text-slate-500">
                          Guaranteed 24-hour turnaround across all divisions
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          id="cta-name"
                          label="Your Name"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g. Ruwan Silva"
                        />
                        <Input
                          id="cta-email"
                          label="Email Address"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="ruwan@company.lk"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          id="cta-phone"
                          label="Phone Number"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+94 77 123 4567"
                        />
                        <Select
                          id="cta-division"
                          label="Target Division"
                          value={formData.division}
                          onChange={(e) =>
                            setFormData({ ...formData, division: e.target.value })
                          }
                          options={[
                            { value: 'general', label: 'Mahdev HQ (General)' },
                            ...DIVISION_LIST.map((d) => ({
                              value: d.id,
                              label: d.name,
                            })),
                          ]}
                        />
                      </div>

                      <Textarea
                        id="cta-message"
                        label="Project Brief / Details"
                        rows={3}
                        required
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us about your event, production, software requirement, or travel plan..."
                      />

                      <Magnetic strength={0.2} className="w-full">
                        <Button
                          id="cta-submit-btn"
                          type="submit"
                          variant="electric"
                          size="md"
                          disabled={loading}
                          rightIcon={<Send className="w-4 h-4" />}
                          className="w-full justify-center shadow-md shadow-blue-500/20"
                        >
                          {loading ? 'Routing Inquiry...' : 'Submit Inquiry'}
                        </Button>
                      </Magnetic>
                    </form>
                  )}
                </div>
              </TiltCard>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};
