import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
  ChevronLeft,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Compass,
  MessageCircle,
} from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { DisplayHeading, H2, H3, BodyLarge, Body, Caption } from '../components/ui/Heading';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { IconRenderer } from '../components/ui/IconRenderer';
import { SEOHead } from '../components/layout/SEOHead';
import { SlideIn, ScrollReveal } from '../components/motion/MotionWrappers';
import { DIVISIONS, DIVISION_LIST } from '../config/divisions';
import { DivisionId } from '../types';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { firestoreInquiriesService } from '../services/firestore/inquiries';
import { firestoreContactsService } from '../services/firestore/contacts';
import { notificationService } from '../services/notificationService';

interface DivisionViewProps {
  divisionId: string;
  onNavigate: (route: string) => void;
}

export const DivisionView: React.FC<DivisionViewProps> = ({ divisionId, onNavigate }) => {
  const { divisions, services, companySettings } = useFirestoreDataContext();

  // Normalize IDs across short keys ('sws', 'u1', 'it', 'travels', 'mart') and slug variants ('u1-studio', 'it-solutions', 'online-mart')
  const normalizedKey: DivisionId =
    divisionId === 'u1-studio'
      ? 'u1'
      : divisionId === 'it-solutions'
      ? 'it'
      : divisionId === 'online-mart'
      ? 'mart'
      : (divisionId as DivisionId);

  const canonicalDocId =
    normalizedKey === 'u1'
      ? 'u1-studio'
      : normalizedKey === 'it'
      ? 'it-solutions'
      : normalizedKey === 'mart'
      ? 'online-mart'
      : normalizedKey;

  // Retrieve cached data synchronously to eliminate initial render glitch
  const cachedDivision = useMemo(() => {
    try {
      const raw = localStorage.getItem('mahdev_cached_divisions');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list.find(
            (d: any) =>
              d.id === divisionId ||
              d.id === canonicalDocId ||
              d.id === normalizedKey ||
              d.slug === divisionId ||
              d.slug === canonicalDocId ||
              d.slug === normalizedKey
          );
        }
      }
    } catch (_) {}
    return null;
  }, [divisionId, canonicalDocId, normalizedKey]);

  const baseDivision = DIVISIONS[normalizedKey] || DIVISIONS[divisionId as DivisionId] || {
    id: normalizedKey,
    name: 'Mahdev Division',
    shortName: 'Division',
    tagline: 'Delivering Innovation & Excellence',
    description: 'Specialized services and enterprise solutions by Mahdev Pvt Ltd.',
    badge: 'Specialized Division',
    route: `/${divisionId}`,
    domainUrl: `https://mahdev.lk/${divisionId}`,
    accentColor: '#0052FF',
    gradient: 'from-blue-600 to-indigo-700',
    heroHeadline: 'Delivering Innovation & Specialized Services',
    heroSubheadline: 'Tailored solutions and high-standard enterprise operations across Sri Lanka.',
    iconName: 'Sparkles',
    contactEmail: companySettings?.email || COMPANY_INFO.email,
    contactPhone: '075 092 8078',
    aboutHeading: 'The Art of Extraordinary Craftsmanship',
    aboutText: 'Committed to superior execution, certified precision, and industry-defining standards across Sri Lanka.',
    mission: 'To deliver uncompromising quality, creative excellence, and measurable impact for every client.',
    vision: 'To pioneer innovation and set the gold standard across our industry in Sri Lanka.',
    coreServices: [],
    stats: [
      { label: 'Active Projects', value: '100+' },
      { label: 'Client Satisfaction', value: '99.4%' },
      { label: 'Service Coverage', value: 'Island-wide' },
    ],
  };

  const firestoreDiv =
    divisions.find(
      (d) =>
        d.id === divisionId ||
        d.id === canonicalDocId ||
        d.id === normalizedKey ||
        d.slug === divisionId ||
        d.slug === canonicalDocId ||
        d.slug === normalizedKey
    ) || cachedDivision;

  // Live Firestore services matching this division
  const liveDivisionServices = useMemo(() => {
    return services.filter(
      (s) =>
        s.division === divisionId ||
        (s as any).divisionId === divisionId ||
        s.division === normalizedKey ||
        (s as any).divisionId === normalizedKey ||
        (firestoreDiv && (s.division === firestoreDiv.slug || (s as any).divisionId === firestoreDiv.id))
    );
  }, [services, divisionId, normalizedKey, firestoreDiv]);

  // Standard corporate phone mandated across all divisions
  const corporatePhone = '075 092 8078';

  // Merge Firestore live overrides with base structure
  const division = {
    ...baseDivision,
    contactPhone:
      (firestoreDiv as any)?.contactPhone ||
      (firestoreDiv as any)?.contactNumber ||
      baseDivision.contactPhone ||
      corporatePhone,
    contactEmail:
      (firestoreDiv as any)?.contactEmail ||
      baseDivision.contactEmail ||
      companySettings?.email ||
      COMPANY_INFO.email,
    aboutHeading:
      (firestoreDiv as any)?.aboutHeading ||
      baseDivision.aboutHeading ||
      'The Art of Extraordinary Craftsmanship',
    aboutText:
      (firestoreDiv as any)?.aboutText ||
      (firestoreDiv as any)?.description ||
      baseDivision.aboutText ||
      baseDivision.description,
    mission:
      (firestoreDiv as any)?.mission ||
      baseDivision.mission ||
      'To craft exceptional results that honor tradition while pioneering modern aesthetic luxury.',
    vision:
      (firestoreDiv as any)?.vision ||
      baseDivision.vision ||
      'To be the preeminent institution recognized for bespoke craftsmanship across South Asia.',
    heroHeadline:
      (firestoreDiv as any)?.heroHeadline ||
      (firestoreDiv as any)?.hero?.title ||
      baseDivision.heroHeadline,
    heroSubheadline:
      (firestoreDiv as any)?.heroSubheadline ||
      (firestoreDiv as any)?.hero?.subtitle ||
      (firestoreDiv as any)?.description ||
      baseDivision.heroSubheadline,
    stats:
      (firestoreDiv as any)?.stats?.length
        ? (firestoreDiv as any).stats
        : baseDivision.stats,
    ...(firestoreDiv
      ? {
          name: firestoreDiv.name || baseDivision.name,
          shortName: firestoreDiv.shortName || baseDivision.shortName,
          tagline: firestoreDiv.hero?.subtitle || firestoreDiv.tagline || baseDivision.tagline,
          description: firestoreDiv.description || baseDivision.description,
          badge: firestoreDiv.hero?.badge || firestoreDiv.badge || baseDivision.badge,
          route: `/${firestoreDiv.slug || firestoreDiv.id || normalizedKey}`,
          accentColor: (firestoreDiv as any).accentColor || baseDivision.accentColor,
          gradient: (firestoreDiv as any).gradient || baseDivision.gradient,
        }
      : {}),
    coreServices:
      liveDivisionServices.length > 0
        ? liveDivisionServices.map((s) => ({
            title: s.name,
            description: s.description || 'Specialized enterprise service by Mahdev.',
            iconName: (s as any).iconName || 'Sparkles',
          }))
        : baseDivision.coreServices || [],
  };

  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceInterest: division.coreServices[0]?.title || 'General Consultation',
    requirements: '',
  });

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    try {
      // 1. Create Inquiry in Firestore (for /admin/enquiries)
      await firestoreInquiriesService.createInquiry({
        name: formData.name,
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone || corporatePhone,
        service: formData.serviceInterest,
        serviceName: formData.serviceInterest,
        divisionId: normalizedKey,
        division: division.name,
        subject: `${division.shortName} Consultation: ${formData.serviceInterest}`,
        message: formData.requirements || `Scope inquiry for ${formData.serviceInterest}`,
        status: 'New',
        source: 'division_page',
      });

      // 2. Register contact submission
      await firestoreContactsService.submitContact({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        division: normalizedKey,
        subject: `${division.shortName}: ${formData.serviceInterest}`,
        message: formData.requirements || `Division scope request`,
      });

      // 3. Trigger immediate Admin Notification
      await notificationService.notifyAdminContactInquiry({
        name: formData.name,
        email: formData.email,
        subject: `${division.shortName} Consultation: ${formData.serviceInterest}`,
        message: formData.requirements || `Customer requested ${formData.serviceInterest}`,
      });

      setInquirySubmitted(true);
    } catch (err) {
      console.warn('[DivisionView] Submission notice:', err);
      setInquirySubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Other sister divisions for cross-navigation
  const sisterDivisions = DIVISION_LIST.filter(
    (d) => d.id !== normalizedKey && d.id !== divisionId
  );

  return (
    <div className="w-full flex flex-col bg-white">
      <SEOHead
        title={division.name}
        description={`${division.tagline} — ${division.description}`}
        canonicalUrl={division.domainUrl || `https://mahdev.lk${division.route}`}
      />

      {/* 1. DIVISION HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-50/60 py-16 sm:py-20 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Back Link */}
          <div className="mb-6">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0052FF] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Corporate Home</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: Headline & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <SlideIn direction="up" delay={0.1}>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="electric" size="md">
                    {division.badge}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    A Division of Mahdev Group
                  </span>
                </div>
              </SlideIn>

              <SlideIn direction="up" delay={0.2}>
                <DisplayHeading className="text-slate-950 font-bold tracking-tight">
                  {division.heroHeadline || division.name}
                </DisplayHeading>
              </SlideIn>

              <SlideIn direction="up" delay={0.3}>
                <p className="text-base sm:text-lg font-semibold text-[#0052FF]">
                  {division.tagline}
                </p>
                <BodyLarge className="text-slate-600 mt-2 max-w-2xl leading-relaxed">
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
                  <a
                    href={getTelLink(division.contactPhone || corporatePhone)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-semibold hover:border-blue-500 hover:text-[#0052FF] transition-all shadow-2xs"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>{division.contactPhone || corporatePhone}</span>
                  </a>
                </div>
              </SlideIn>
            </div>

            {/* Right: Division Executive & Hotline Card */}
            <div className="lg:col-span-5">
              <SlideIn direction="up" delay={0.3}>
                <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-lg shadow-blue-500/5 space-y-6">
                  {/* Division Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center shadow-2xs">
                        <IconRenderer name={division.iconName} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Corporate Division
                        </div>
                        <div className="font-display text-base font-bold text-slate-900">
                          {division.name}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                  </div>

                  {/* Hotline & Contact Callout */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Direct Division Hotline
                    </div>
                    <div className="flex items-center justify-between">
                      <a
                        href={getTelLink(division.contactPhone || corporatePhone)}
                        className="font-display text-lg font-bold text-slate-900 hover:text-[#0052FF] transition-colors flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4 text-[#0052FF]" />
                        <span>{division.contactPhone || corporatePhone}</span>
                      </a>
                      <a
                        href={`https://wa.me/94750928078?text=Hello%20${encodeURIComponent(division.shortName)},%20I%20would%20like%20to%20inquire%20about%20your%20services.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{division.contactEmail}</span>
                    </div>
                  </div>

                  {/* Division Live Stats */}
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Performance Metrics
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {division.stats.slice(0, 4).map((stat, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                          <div className="font-display text-lg font-bold text-[#0052FF]">
                            {stat.value}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SlideIn>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EXECUTIVE NARRATIVE & ABOUT SECTION */}
      <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <Caption className="text-[#0052FF] font-semibold">Division Overview</Caption>
            <H2 className="text-slate-900 font-bold">
              {division.aboutHeading || 'The Art of Extraordinary Craftsmanship'}
            </H2>
            <BodyLarge className="text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {division.aboutText || division.description}
            </BodyLarge>
          </div>

          {/* Mission & Vision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Target className="w-5 h-5" />
                <h4 className="font-display text-base font-bold text-slate-900">Our Mission</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {division.mission || 'To craft exceptional results that honor tradition while pioneering modern aesthetic luxury.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Compass className="w-5 h-5" />
                <h4 className="font-display text-base font-bold text-slate-900">Our Vision</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {division.vision || 'To be the preeminent institution recognized for bespoke craftsmanship and benchmark execution across South Asia.'}
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* 3. CORE SERVICES & CAPABILITIES */}
      <SectionContainer id="services-grid" background="subtle" paddingY="xl" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-2xl mb-10">
            <Caption className="text-[#0052FF] mb-1.5 block font-semibold">Specialized Offerings</Caption>
            <H2 className="text-slate-900 mb-3 font-bold">Core Capabilities & Solutions</H2>
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
              className="flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-6 hover:border-blue-500 transition-all shadow-xs"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center mb-4">
                  <IconRenderer name={service.iconName || 'Sparkles'} className="w-5 h-5" />
                </div>
                <CardTitle className="mb-2 text-lg font-bold text-slate-900">{service.title}</CardTitle>
                <CardDescription className="text-slate-600 text-sm leading-relaxed">
                  {service.description}
                </CardDescription>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0052FF]">
                <span className="text-slate-400 font-medium">Enterprise Tier</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, serviceInterest: service.title }));
                    const el = document.getElementById('division-inquiry');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1 hover:underline cursor-pointer font-bold"
                >
                  <span>Select Scope</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </SectionContainer>

      {/* 4. DIVISION DIRECT INQUIRY FORM */}
      <SectionContainer id="division-inquiry" background="white" paddingY="xl" hasBorderBottom>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <Caption className="text-[#0052FF] font-semibold">Direct Engagement</Caption>
            <H2 className="text-slate-900 font-bold">
              Consult with the {division.shortName} Team
            </H2>
            <Body className="text-slate-600 leading-relaxed">
              Submit your project scope, schedule dates, or procurement inquiry directly to our lead production and technical team.
            </Body>

            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-3">
              <div className="font-bold text-[#0052FF] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0052FF]" />
                <span>Mahdev Corporate SLA Guarantee</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                All inquiries are dispatched immediately to the administrative desk and reviewed within 24 business hours.
              </p>
              <div className="pt-2 border-t border-blue-100/70 flex items-center justify-between">
                <span className="text-slate-500">Official Hotline:</span>
                <a
                  href={getTelLink(division.contactPhone || corporatePhone)}
                  className="font-bold text-slate-900 hover:text-[#0052FF]"
                >
                  {division.contactPhone || corporatePhone}
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-slate-900 mb-1">
              {division.name} — Project Inquiry
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Complete the brief below to receive a formal consultation proposal.
            </p>

            {inquirySubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-display text-lg font-bold">Request Dispatched to Admin</h4>
                <p className="text-xs text-emerald-700">
                  Thank you, {formData.name}. The {division.name} leadership has received your brief for "{formData.serviceInterest}".
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
                      serviceInterest: division.coreServices[0]?.title || 'General Consultation',
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
                    placeholder="075 092 8078"
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
                  label="Project Scope & Timeline"
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
                    disabled={isSubmitting}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isSubmitting ? 'Dispatching to Admin...' : `Submit Scope to ${division.shortName}`}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </SectionContainer>

      {/* 5. SISTER DIVISIONS SWITCHER */}
      <SectionContainer background="subtle" paddingY="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <Caption className="text-slate-400">Discover More</Caption>
            <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
              Explore Sister Divisions in the Mahdev Group
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
