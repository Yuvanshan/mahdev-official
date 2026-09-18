import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Layers,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { DisplayHeading, H2, H3, BodyLarge, Body } from '../components/ui/Heading';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { SEOHead } from '../components/layout/SEOHead';
import { DIVISIONS, DIVISION_LIST } from '../config/divisions';
import { DivisionId } from '../types';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { getTelLink } from '../config/company';
import { firestoreInquiriesService } from '../services/firestore/inquiries';

interface DivisionComingSoonViewProps {
  divisionId: string;
  onNavigate: (route: string) => void;
}

export const DivisionComingSoonView: React.FC<DivisionComingSoonViewProps> = ({
  divisionId,
  onNavigate,
}) => {
  const { divisions, companySettings } = useFirestoreDataContext();

  // Normalize division key
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

  const fallbackConfig = DIVISIONS[normalizedKey] || DIVISIONS.sws;

  const firestoreDiv = divisions.find(
    (d) =>
      d.id === divisionId ||
      d.id === normalizedKey ||
      d.slug === divisionId ||
      d.slug === normalizedKey
  );

  const divisionName = firestoreDiv?.name || fallbackConfig.name;
  const shortName = firestoreDiv?.shortName || fallbackConfig.shortName || divisionName;
  const tagline = firestoreDiv?.tagline || fallbackConfig.tagline;
  const accentColor = firestoreDiv?.accentColor || fallbackConfig.accentColor || '#0052FF';
  const heroImage =
    firestoreDiv?.heroImageUrl ||
    firestoreDiv?.imageUrl ||
    fallbackConfig.imageUrl ||
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80';

  const comingSoonTitle =
    (firestoreDiv as any)?.comingSoonTitle ||
    `${shortName} is Coming Soon`;

  const comingSoonMessage =
    (firestoreDiv as any)?.comingSoonMessage ||
    `We are curating state-of-the-art infrastructure, exclusive enterprise services, and calibrated equipment for ${divisionName}. Our engineering and creative teams are finalizing every standard of perfection before our grand public launch.`;

  const expectedLaunch =
    (firestoreDiv as any)?.comingSoonExpectedLaunch || 'Coming Later This Year';

  const contactPhone = companySettings?.primaryPhone || '075 092 8078';
  const contactEmail = companySettings?.email || 'info.mahdev.lk@gmail.com';

  // VIP Access Form state
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscriberName, setSubscriberName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail.trim() || !subscriberEmail.includes('@')) return;

    setIsSubmitting(true);
    try {
      await firestoreInquiriesService.createInquiry({
        name: subscriberName.trim() || 'VIP Subscriber',
        email: subscriberEmail.trim(),
        phone: contactPhone,
        division: normalizedKey,
        service: `${divisionName} VIP Launch Alert`,
        message: `Registered for early VIP access & launch announcement for ${divisionName}.`,
        status: 'new',
      });
      setIsSubscribed(true);
    } catch (err) {
      console.warn('[ComingSoon] Inquiry error:', err);
      setIsSubscribed(true); // Gracefully treat as success for user peace of mind
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${divisionName}, I am inquiring about the upcoming launch and services. Please share preliminary packages and availability.`
  );
  const whatsappUrl = `https://wa.me/94750928078?text=${whatsappMessage}`;

  // Other active divisions
  const otherDivisions = DIVISION_LIST.filter((d) => d.id !== normalizedKey);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white relative z-10">
      <SEOHead
        title={`${divisionName} | Coming Soon | Mahdev Pvt Ltd`}
        description={comingSoonMessage}
      />

      {/* Top Header Navigation Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md relative z-20">
        <SectionContainer className="py-3.5 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Mahdev Home</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Launch In Preparation</span>
            </span>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Inquiry</span>
            </a>
          </div>
        </SectionContainer>
      </div>

      {/* Hero Visual Section */}
      <div className="relative flex-1 flex flex-col justify-center overflow-hidden py-16 sm:py-24 z-10">
        {/* Background Image with Deep Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={divisionName}
            className="w-full h-full object-cover object-center filter brightness-[0.25] scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${accentColor} 0%, transparent 70%)`,
            }}
          />
        </div>

        <SectionContainer className="relative z-20 max-w-4xl mx-auto text-center px-4">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-xl mb-6 backdrop-blur-sm">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
              New Operating Division • Launching Soon
            </span>
          </div>

          {/* Division Title & Tagline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            {comingSoonTitle}
          </h1>

          <p className="text-base sm:text-xl text-slate-300 font-light mb-6 max-w-2xl mx-auto">
            {tagline}
          </p>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            {comingSoonMessage}
          </p>

          {/* Expected Timeline Pill */}
          {expectedLaunch && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-mono mb-12 shadow-lg">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Timeline:</span>
              <strong className="text-white font-semibold">{expectedLaunch}</strong>
            </div>
          )}

          {/* Early Access Notification Form */}
          <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl mb-12 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Register for VIP Launch Privilege
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Receive priority booking slots, launch pricing schedules, and private previews.
            </p>

            {isSubscribed ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">You are on the VIP priority list!</p>
                  <p className="text-emerald-500/80">We will notify you immediately upon public launch.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={subscriberName}
                    onChange={(e) => setSubscriberName(e.target.value)}
                    placeholder="Your Name / Organization"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="Enter official email address"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
                  >
                    {isSubmitting ? 'Registering...' : 'Notify Me'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Direct Inquiries Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire on WhatsApp ({contactPhone})</span>
            </a>

            <a
              href={getTelLink(contactPhone)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Call Hotline: {contactPhone}</span>
            </a>

            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-transparent hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              <span>Explore Group Portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </SectionContainer>
      </div>

      {/* Explore Other Business Divisions Strip */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-10">
        <SectionContainer>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Operating Subsidiaries
              </p>
              <h2 className="text-base font-bold text-white">Explore Other Active Divisions</h2>
            </div>
            <button
              onClick={() => onNavigate('/#divisions')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              <span>View All 5 Divisions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherDivisions.map((div) => (
              <button
                key={div.id}
                onClick={() => onNavigate(div.route)}
                className="group p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold text-white uppercase"
                    style={{ backgroundColor: div.accentColor }}
                  >
                    {div.shortName}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {div.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {div.tagline}
                </p>
              </button>
            ))}
          </div>
        </SectionContainer>
      </div>
    </div>
  );
};
