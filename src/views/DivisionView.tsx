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
import { DivisionComingSoonView } from './DivisionComingSoonView';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { firestoreInquiriesService } from '../services/firestore/inquiries';
import { firestoreContactsService } from '../services/firestore/contacts';
import { notificationService } from '../services/notificationService';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';
import { HeroVideoBackground } from '../components/common/HeroVideoBackground';
import { DivisionBelowHeroShimmer } from '../components/common/DivisionBelowHeroShimmer';

interface DivisionViewProps {
  divisionId: string;
  onNavigate: (route: string) => void;
}

export const DivisionView: React.FC<DivisionViewProps> = ({ divisionId, onNavigate }) => {
  const { divisions, services, companySettings, isInitialLoading, loadDivisionData, isDivisionLoaded } = useFirestoreDataContext();

  // Normalize IDs across short keys ('sws', 'u1', 'it', 'travels', 'mart') and slug variants
  const normalizedKey: DivisionId =
    divisionId === 'u1-studio' || divisionId === 'u1-cinema'
      ? 'u1'
      : divisionId === 'it-solutions' || divisionId === 'mahdev-it'
      ? 'it'
      : divisionId === 'online-mart' || divisionId === 'mahdev-mart'
      ? 'mart'
      : divisionId === 'sws-event-management' || divisionId === 'sws-events'
      ? 'sws'
      : divisionId === 'mahdev-travels'
      ? 'travels'
      : (divisionId as DivisionId);

  const canonicalDocId = normalizedKey;

  // Retrieve cached data synchronously to eliminate initial render glitch
  const cachedDivision = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('mahdev_cached_divisions');
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
    contactPhone: companySettings?.primaryPhone || '075 092 8078',
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

  React.useEffect(() => {
    loadDivisionData(normalizedKey);
  }, [normalizedKey, loadDivisionData]);

  // Check if live division data is actively loading from Firestore
  const isDivisionDataLoading = isInitialLoading || (!firestoreDiv && divisions.length === 0) || !isDivisionLoaded(divisionId);

  // Immediate guard: If division is marked as Coming Soon, display DivisionComingSoonView
  const isDefaultComingSoon = normalizedKey === 'it' || normalizedKey === 'travels' || normalizedKey === 'mart';
  const isComingSoon = (firestoreDiv as any)?.isComingSoon !== undefined
    ? !!(firestoreDiv as any)?.isComingSoon
    : (firestoreDiv as any)?.comingSoon !== undefined
    ? !!(firestoreDiv as any)?.comingSoon
    : (firestoreDiv as any)?.status !== undefined
    ? (firestoreDiv as any)?.status === 'coming_soon'
    : isDefaultComingSoon;

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

  // Extract live division image and logo from Firestore
  const divisionImage =
    (firestoreDiv as any)?.defaultImageUrl ||
    (firestoreDiv as any)?.fallbackImageUrl ||
    (firestoreDiv as any)?.heroImageUrl ||
    (firestoreDiv as any)?.imageUrl ||
    (firestoreDiv?.hero as any)?.defaultImageUrl ||
    (firestoreDiv?.hero as any)?.fallbackImageUrl ||
    (firestoreDiv?.hero as any)?.imageUrl ||
    (firestoreDiv?.hero as any)?.bgImage ||
    (baseDivision as any)?.imageUrl;

  const divisionLogo =
    (firestoreDiv as any)?.logoUrl ||
    (firestoreDiv as any)?.logo ||
    (baseDivision as any)?.logoUrl ||
    (baseDivision as any)?.logo;

  // Merge Firestore live overrides with base structure
  const division = {
    ...baseDivision,
    contactPhone:
      (firestoreDiv as any)?.contactPhone ||
      (firestoreDiv as any)?.contactNumber ||
      companySettings?.primaryPhone ||
      baseDivision.contactPhone ||
      corporatePhone,
    contactEmail:
      (firestoreDiv as any)?.contactEmail ||
      companySettings?.email ||
      baseDivision.contactEmail ||
      COMPANY_INFO.email,
    aboutHeading:
      (firestoreDiv as any)?.aboutHeading ||
      (firestoreDiv as any)?.about?.heading ||
      baseDivision.aboutHeading ||
      'The Art of Extraordinary Craftsmanship',
    aboutText:
      (firestoreDiv as any)?.aboutText ||
      (firestoreDiv as any)?.about?.text ||
      (firestoreDiv as any)?.description ||
      baseDivision.aboutText ||
      baseDivision.description,
    mission:
      (firestoreDiv as any)?.mission ||
      (firestoreDiv as any)?.about?.mission ||
      baseDivision.mission ||
      'To craft exceptional results that honor tradition while pioneering modern aesthetic luxury.',
    vision:
      (firestoreDiv as any)?.vision ||
      (firestoreDiv as any)?.about?.vision ||
      baseDivision.vision ||
      'To be the preeminent institution recognized for bespoke craftsmanship across South Asia.',
    heroHeadline:
      (firestoreDiv as any)?.heroHeadline ||
      (firestoreDiv as any)?.hero?.title ||
      (firestoreDiv as any)?.name ||
      baseDivision.heroHeadline,
    heroSubheadline:
      (firestoreDiv as any)?.heroSubheadline ||
      (firestoreDiv as any)?.hero?.subtitle ||
      (firestoreDiv as any)?.description ||
      baseDivision.heroSubheadline,
    stats:
      (firestoreDiv as any)?.stats && (firestoreDiv as any).stats.length > 0
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
    imageUrl: divisionImage,
    logoUrl: divisionLogo,
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
  const [videoFailed, setVideoFailed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceInterest: division.coreServices[0]?.title || 'General Consultation',
    requirements: '',
  });

  if (isComingSoon) {
    return <DivisionComingSoonView divisionId={divisionId} onNavigate={onNavigate} />;
  }

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

  return (
    <div className="w-full flex flex-col bg-[#FAF9F6]">
      <SEOHead
        title={division.name}
        description={`${division.tagline} — ${division.description}`}
        canonicalUrl={division.domainUrl || `https://mahdev.lk${division.route}`}
      />

      {/* 1. DIVISION HERO SECTION: FULL SCREEN WIDTH VIDEO/PICTURE COVER */}
      <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-slate-950 text-white">
        {/* Full-bleed Video or Image Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {(() => {
            // Admin uploads are written to both the top-level division fields
            // and the nested hero payload. Prefer those Firestore values, then
            // use the corporate landing movie only if this division has none.
            const divVideo =
              (firestoreDiv as any)?.heroVideoUrl ||
              (firestoreDiv as any)?.videoUrl ||
              (firestoreDiv?.hero as any)?.videoUrl ||
              ((firestoreDiv?.hero as any)?.mediaType === 'video' ? (firestoreDiv?.hero as any)?.mediaUrl : '') ||
              (baseDivision as any)?.heroVideoUrl ||
              '/assets/hero_main.mp4';
            const divImg =
              (firestoreDiv as any)?.defaultImageUrl ||
              (firestoreDiv as any)?.fallbackImageUrl ||
              (firestoreDiv as any)?.heroImageUrl ||
              (firestoreDiv?.hero as any)?.defaultImageUrl ||
              (firestoreDiv?.hero as any)?.fallbackImageUrl ||
              (firestoreDiv?.hero as any)?.imageUrl ||
              (firestoreDiv?.hero as any)?.bgImage ||
              (firestoreDiv as any)?.imageUrl ||
              division.imageUrl?.trim() ||
              (baseDivision as any)?.imageUrl ||
              'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';

            const hasFirestoreVideo = Boolean(
              (firestoreDiv as any)?.heroVideoUrl ||
              (firestoreDiv as any)?.videoUrl ||
              (firestoreDiv?.hero as any)?.videoUrl ||
              ((firestoreDiv?.hero as any)?.mediaType === 'video' && (firestoreDiv?.hero as any)?.mediaUrl)
            );
            const effectiveVideo = hasFirestoreVideo ? divVideo : '/assets/hero_main.mp4';

            return (
              <HeroVideoBackground
                videoUrl={effectiveVideo}
                imageUrl={divImg}
                posterImageUrl={divImg}
                title={`${division.name} Showcase`}
              />
            );
          })()}
        </div>

        {/* Hero Content Over Video on Left Side */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 z-20 w-full">
          <div className="max-w-3xl space-y-6">
            
            {/* Breadcrumb Back Link */}
            <div>
              <button
                onClick={() => onNavigate('/')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all backdrop-blur-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-blue-400" />
                <span>Back to Home</span>
              </button>
            </div>

            {/* Division Badge & Optional Brand Logo */}
            <div className="flex items-center gap-3">
              {divisionLogo && (
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
                  <img
                    src={divisionLogo}
                    alt={division.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0052FF]/20 border border-[#0052FF]/40 text-xs font-bold text-blue-300 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#0052FF] animate-pulse" />
                <span className="tracking-wide">{division.badge}</span>
                <span className="text-white/40">•</span>
                <span className="text-slate-300 uppercase tracking-wider text-[10px]">Mahdev Group</span>
              </div>
            </div>

            {/* Bold Headline Over Video */}
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
              {division.heroHeadline || division.name}
            </h1>

            {/* Primary Action Buttons in Electric Blue & Off-White */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Button
                variant="electric"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('division-inquiry');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-lg shadow-blue-600/30 font-bold px-7 py-3.5 bg-[#0052FF] hover:bg-blue-600 cursor-pointer"
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
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md cursor-pointer font-semibold"
              >
                Explore Capabilities
              </Button>

              <a
                href={getTelLink(division.contactPhone || corporatePhone)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-md shadow-xs"
              >
                <Phone className="w-4 h-4 text-blue-400" />
                <span>{division.contactPhone || corporatePhone}</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 2. BELOW HERO SECTION: SHOW SHIMMER UNTIL DATA LOADS FROM FIRESTORE */}
      {isDivisionDataLoading ? (
        <DivisionBelowHeroShimmer divisionName={division.name} />
      ) : (
        <>
          {/* 2. EXECUTIVE NARRATIVE & ABOUT SECTION */}
          <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Caption className="text-[#0052FF] font-semibold">Division Overview</Caption>
            <H2 className="text-slate-900 font-bold">
              {division.aboutHeading || 'The Art of Extraordinary Craftsmanship'}
            </H2>
          </div>

          {/* Mission & Vision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Target className="w-5 h-5" />
                <h4 className="font-display text-base font-bold text-slate-900">Our Mission</h4>
              </div>
              <p className="text-sm font-medium text-slate-700">
                {division.mission || 'Committed to superior execution and certified precision.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600">
                <Compass className="w-5 h-5" />
                <h4 className="font-display text-base font-bold text-slate-900">Our Vision</h4>
              </div>
              <p className="text-sm font-medium text-slate-700">
                {division.vision || 'To pioneer innovation and benchmark execution across Sri Lanka.'}
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* 3. CORE SERVICES & CAPABILITIES */}
      <SectionContainer id="services-grid" background="subtle" paddingY="xl" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-2xl mb-8">
            <Caption className="text-[#0052FF] mb-1.5 block font-semibold">Specialized Offerings</Caption>
            <H2 className="text-slate-900 font-bold">Core Capabilities & Solutions</H2>
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
                <CardTitle className="text-lg font-bold text-slate-900">{service.title}</CardTitle>
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
                <span>Mahdev Quality SLA Guarantee</span>
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
        </>
      )}
    </div>
  );
};
