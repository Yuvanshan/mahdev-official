import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, ArrowRight, CheckCircle2, Sparkles, Send, Upload, ShieldCheck, Building2 } from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { ScrollReveal, TiltCard, Magnetic } from '../components/motion/MotionWrappers';
import { SEOHead } from '../components/layout/SEOHead';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { getMailtoLink } from '../config/company';

interface CareersViewProps {
  onNavigate: (route: string) => void;
}

export const CareersView: React.FC<CareersViewProps> = ({ onNavigate }) => {
  const { companySettings } = useFirestoreDataContext();
  const [selectedRole, setSelectedRole] = useState<string>('General Application');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    portfolioUrl: '',
    role: 'General Application',
    message: '',
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openPositions = [
    {
      id: 'job-1',
      title: 'Senior Event Production Lead',
      division: 'SWS Event Management',
      location: 'Colombo / Islandwide',
      type: 'Full-time',
      experience: '3+ Years',
      description: 'Lead large-scale wedding galas, stage lighting architectures, industry summits, and concert staging executions.',
    },
    {
      id: 'job-2',
      title: 'Lead Cinematographer & Editor',
      division: 'Studio U2 Photography',
      location: 'Colombo & Trincomalee',
      type: 'Full-time / Project',
      experience: '2+ Years',
      description: 'Operate RED/Sony cinema cameras, gimbal rigs, and color grade high-end wedding films and commercial advertisements.',
    },
    {
      id: 'job-3',
      title: 'Full-Stack React & Node Developer',
      division: 'IT & Solutions',
      location: 'Colombo / Remote Friendly',
      type: 'Full-time',
      experience: '2+ Years',
      description: 'Architect modern web and mobile applications, integrate cloud infrastructure, and develop secure customer portals.',
    },
    {
      id: 'job-4',
      title: 'Travel & Expeditions Coordinator',
      division: 'Mahdev Travels',
      location: 'Colombo HQ',
      type: 'Full-time',
      experience: '1+ Years',
      description: 'Curate luxury executive retreats, VIP island itineraries, transport logistics, and multilingual client hospitality.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="pt-24 pb-12 bg-white">
      <SEOHead
        title="Careers & Opportunities | Mahdev Pvt Ltd"
        description="Join the team at Mahdev Pvt Ltd. Explore career openings in event management, cinematography, software engineering, and business operations."
        canonicalUrl="https://mahdev.lk/careers"
      />

      {/* Header Banner */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                Careers at Mahdev
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                We're Hiring • Colombo & Trincomalee Offices
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              Build the Future of Experiences & Technology
            </H1>
            <Body className="text-slate-600 text-base sm:text-lg">
              Join a dynamic team passionate about event production, cinematic storytelling, and digital software engineering. Work across five autonomous divisions with unmatched growth opportunities.
            </Body>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Open Positions */}
      <SectionContainer background="white" paddingY="xl" hasBorderBottom>
        <div className="max-w-5xl mx-auto space-y-12">
          <div>
            <Caption className="text-[#0052FF] mb-2 block">Current Opportunities</Caption>
            <H2 className="text-slate-900 mb-3">Open Positions Across Divisions</H2>
            <Body className="text-slate-600">
              Click any position to apply directly or submit a spontaneous general application below.
            </Body>
          </div>

          <div className="space-y-4">
            {openPositions.map((job, idx) => (
              <ScrollReveal key={job.id} direction="up" delay={idx * 0.05}>
                <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#0052FF] hover:bg-white hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="electric" size="sm">
                        {job.division}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {job.type}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-slate-900">
                      {job.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {job.description}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="electric"
                      size="sm"
                      onClick={() => {
                        setSelectedRole(job.title);
                        setFormData((prev) => ({ ...prev, role: job.title }));
                        const formElem = document.getElementById('career-application-form');
                        if (formElem) formElem.scrollIntoView({ behavior: 'smooth' });
                      }}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="cursor-pointer w-full sm:w-auto"
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Application Form */}
          <div id="career-application-form" className="pt-8 border-t border-slate-200">
            <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-2xl font-bold">Application Submitted!</h3>
                  <p className="text-sm text-slate-300">
                    Thank you for your interest in joining {companySettings?.name || 'Mahdev Pvt Ltd'}. Our talent acquisition team will review your application and contact you soon.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubmitted(false)}
                    className="text-white border-white/30"
                  >
                    Submit Another Application
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-b border-slate-800 pb-4 mb-4">
                    <h3 className="font-display text-xl font-bold">
                      Direct Career Application
                    </h3>
                    <p className="text-xs text-slate-400">
                      Applying for: <span className="text-[#3B82F6] font-semibold">{formData.role}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-blue-500"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-blue-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-blue-500"
                        placeholder="075 092 8078"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Portfolio / LinkedIn URL</label>
                      <input
                        type="url"
                        value={formData.portfolioUrl}
                        onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Why do you want to join Mahdev?</label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-blue-500"
                      placeholder="Tell us about your experience and aspirations..."
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="electric"
                      size="lg"
                      fullWidth
                      rightIcon={<Send className="w-4 h-4" />}
                      className="cursor-pointer"
                    >
                      Submit Application
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};
