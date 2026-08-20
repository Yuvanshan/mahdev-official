import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Mail,
  ChevronLeft,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { DisplayHeading, H2, H3, BodyLarge, Body, Caption } from '../components/ui/Heading';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { IconRenderer } from '../components/ui/IconRenderer';
import { SEOHead } from '../components/layout/SEOHead';
import { SlideIn, ScrollReveal } from '../components/motion/MotionWrappers';
import { DIVISIONS, DIVISION_LIST } from '../config/divisions';
import { DivisionId } from '../types';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';

interface DivisionViewProps {
  divisionId: DivisionId;
  onNavigate: (route: string) => void;
}

export const DivisionView: React.FC<DivisionViewProps> = ({ divisionId, onNavigate }) => {
  const { divisions, services, companySettings } = useFirestoreDataContext();
  const baseDivision = DIVISIONS[divisionId] || DIVISIONS.sws;
  const firestoreDiv = divisions.find((d) => d.id === divisionId);

  // Merge Firestore overrides with base structure
  const division = {
    ...baseDivision,
    ...(firestoreDiv
      ? {
          name: firestoreDiv.name || baseDivision.name,
          shortName: firestoreDiv.shortName || baseDivision.shortName,
          tagline: firestoreDiv.hero?.subtitle || baseDivision.tagline,
          description: firestoreDiv.description || baseDivision.description,
          badge: firestoreDiv.hero?.badge || baseDivision.badge,
          route: `/${firestoreDiv.slug || firestoreDiv.id}`,
          accentColor: (firestoreDiv as any).accentColor || baseDivision.accentColor,
          heroHeadline: (firestoreDiv as any).heroHeadline || baseDivision.heroHeadline,
          heroSubheadline: firestoreDiv.description || baseDivision.heroSubheadline,
        }
      : {}),
  };

  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceInterest: division.coreServices[0]?.title || '',
    requirements: '',
  });

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setInquirySubmitted(true);
    }
  };

  // Other sister divisions for cross-navigation
  const sisterDivisions = DIVISION_LIST.filter((d) => d.id !== division.id);

  return (
    <div className="w-full flex flex-col">
      <SEOHead
        title={division.name}
        description={`${division.tagline} — ${division.description}`}
        canonicalUrl={division.domainUrl || `https://mahdev.lk${division.route}`}
      />

      {/* 1. DIVISION HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white py-16 sm:py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Back Link */}
          <div className="mb-6">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0052FF] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Mahdev Corporate Home</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 space-y-6">
              <SlideIn direction="up" delay={0.1}>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="electric" size="md">
                    {division.badge}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    A Division of Mahdev Pvt Ltd
                  </span>
                </div>
              </SlideIn>

              <SlideIn direction="up" delay={0.2}>
                <DisplayHeading className="text-slate-950">
                  {division.name}
                </DisplayHeading>
              </SlideIn>

              <SlideIn direction="up" delay={0.3}>
                <p className="text-lg sm:text-xl font-semibold text-[#0052FF]">
                  {division.tagline}
                </p>
                <BodyLarge className="text-slate-600 mt-2 max-w-2xl">
                  {division.heroSubheadline}
                </BodyLarge>
              </SlideIn>

              <SlideIn direction="up" delay={0.4}>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    variant="electric"
                    size="lg"
                    onClick={() => {
                      const el = document.getElementById('division-inquiry');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Request Consultation
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const el = document.getElementById('services-grid');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Explore Capabilities
                  </Button>
                </div>
              </SlideIn>
            </div>

            {/* Division Key Stats Card */}
            <div className="lg:col-span-4">
              <SlideIn direction="up" delay={0.3}>
                <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-lg shadow-blue-500/5 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center">
                      <IconRenderer name={division.iconName} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Division Metrics
                      </div>
                      <div className="font-display text-base font-bold text-slate-900">
                        {division.shortName}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {division.stats.map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">
                          {stat.label}
                        </span>
                        <span className="font-display text-lg font-bold text-[#0052FF]">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Direct: {division.contactEmail}</span>
                    </div>
                  </div>
                </div>
              </SlideIn>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE SERVICES & CAPABILITIES */}
      <SectionContainer id="services-grid" background="subtle" paddingY="xl" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-2xl mb-12">
            <Caption className="text-[#0052FF] mb-2 block">Specialized Offerings</Caption>
            <H2 className="text-slate-900 mb-3">Core Capabilities & Solutions</H2>
            <Body className="text-slate-600">
              {division.description}
            </Body>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {division.coreServices.map((service, index) => (
            <Card
              key={index}
              variant="default"
              hoverEffect
              className="flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center mb-4">
                  <IconRenderer name={service.iconName || 'Sparkles'} className="w-6 h-6" />
                </div>
                <CardTitle className="mb-2">{service.title}</CardTitle>
                <CardDescription className="text-slate-600">
                  {service.description}
                </CardDescription>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0052FF]">
                <span>Enterprise Service Tier</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, serviceInterest: service.title }));
                    const el = document.getElementById('division-inquiry');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Book This Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </SectionContainer>

      {/* 3. DIVISION DIRECT INQUIRY FORM */}
      <SectionContainer id="division-inquiry" background="white" paddingY="xl" hasBorderBottom>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <Caption className="text-[#0052FF]">Direct Engagement</Caption>
            <H2 className="text-slate-900">
              Consult with the {division.shortName} Team
            </H2>
            <Body className="text-slate-600">
              Submit your project scope, schedule dates, or procurement inquiry directly to our lead production and technical team.
            </Body>

            <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-[#0052FF]">Mahdev Corporate SLA Guarantee</div>
              <p className="text-slate-600 leading-relaxed">
                All client requests receive a dedicated account lead with an initial assessment within 24 business hours.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-slate-900 mb-1">
              {division.name} — Project Inquiry
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Complete the form below to receive a formal quotation and scope proposal.
            </p>

            {inquirySubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-display text-lg font-bold">Request Dispatched</h4>
                <p className="text-xs text-emerald-700">
                  Thank you, {formData.name}. The {division.name} team has received your brief for "{formData.serviceInterest}".
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInquirySubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      serviceInterest: division.coreServices[0]?.title || '',
                      requirements: '',
                    });
                  }}
                >
                  Submit Another Brief
                </Button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required
                    placeholder="Your name or company"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    placeholder="name@organization.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    placeholder="+94 ..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <div className="w-full space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 select-none">
                      Selected Capability
                    </label>
                    <select
                      value={formData.serviceInterest}
                      onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    >
                      {division.coreServices.map((s, idx) => (
                        <option key={idx} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                      <option value="Custom Scope / General">Custom Scope / Retainer</option>
                    </select>
                  </div>
                </div>

                <Textarea
                  label="Project Scope & Dates"
                  required
                  placeholder="Detail your goals, estimated timeline, venue, target deliverables, or specifications..."
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="electric"
                    fullWidth
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Submit Scope to {division.shortName}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </SectionContainer>

      {/* 4. SISTER DIVISIONS SWITCHER */}
      <SectionContainer background="subtle" paddingY="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <Caption className="text-slate-400">Discover More</Caption>
            <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
              Explore Sister Divisions in the Mahdev Ecosystem
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/')}
            className="mt-4 md:mt-0"
          >
            All Divisions Overview
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sisterDivisions.map((sister) => (
            <div
              key={sister.id}
              onClick={() => onNavigate(sister.route)}
              className="p-5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-[#0052FF] group-hover:bg-[#0052FF] group-hover:text-white transition-colors">
                    <IconRenderer name={sister.iconName} className="w-4 h-4" />
                  </div>
                  <Badge size="sm" variant="default">
                    {sister.badge}
                  </Badge>
                </div>
                <h4 className="font-display text-base font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors mb-1">
                  {sister.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {sister.tagline}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-[#0052FF]">
                <span>View Division</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </div>
  );
};
