import React, { useState } from 'react';
import { Mail, Linkedin, Award, Users, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  BlurReveal,
} from '../motion/MotionWrappers';
import { LEADERSHIP_TEAM } from '../../data/corporateData';
import { LeadershipMember } from '../../types';

interface LeadershipSectionProps {
  onContactLeadership?: (member: LeadershipMember) => void;
}

export const LeadershipSection: React.FC<LeadershipSectionProps> = ({ onContactLeadership }) => {
  const [selectedMember, setSelectedMember] = useState<LeadershipMember | null>(null);

  return (
    <SectionContainer id="leadership" background="white" paddingY="xl" hasBorderBottom>
      <ScrollReveal direction="up">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Caption className="text-[#0052FF] mb-2 block">Executive Stewardship</Caption>
          <H2 className="text-slate-900 mb-3">Corporate Leadership</H2>
          <Body className="text-slate-600 text-base">
            Guided by experienced sector directors, creative visionaries, and cloud architects committed to institutional governance and client success.
          </Body>
        </div>
      </ScrollReveal>

      {/* Leadership Grid / Mobile Horizontal Swipe Track */}
      <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 lg:gap-8 sm:overflow-visible">
        {LEADERSHIP_TEAM.map((member, idx) => (
          <div
            key={member.id}
            className="min-w-[85vw] sm:min-w-0 snap-center shrink-0 sm:shrink"
          >
            <ScrollReveal direction="up" delay={idx * 0.08}>
              <TiltCard maxTilt={6} glareEffect className="h-full">
                <div
                  onClick={() => setSelectedMember(member)}
                  className="group h-full rounded-2xl bg-white border border-slate-200/90 hover:border-[#0052FF] hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  {/* Photo & Division Header */}
                  <div>
                    <div className="relative h-64 w-full overflow-hidden bg-slate-900">
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover object-top opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {/* Division Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge variant="electric" size="sm" className="backdrop-blur-md bg-blue-600/90 text-white font-medium">
                          {member.badge || member.divisionFocus}
                        </Badge>
                      </div>

                      {/* Name & Title on overlay */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="font-display text-xl font-bold tracking-tight">
                          {member.name}
                        </h3>
                        <p className="text-xs text-blue-300 font-medium mt-0.5">
                          {member.title}
                        </p>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {member.role}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                        {member.bio}
                      </p>

                      {/* Credentials tags */}
                      {member.credentials && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {member.credentials.map((cred) => (
                            <span
                              key={cred}
                              className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                            >
                              {cred}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Strip */}
                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:bg-blue-50/50 transition-colors">
                    <span className="font-medium text-[#0052FF] inline-flex items-center gap-1">
                      View Profile <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px]">Active</span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          </div>
        ))}

        {/* Executive Governance & Culture Card */}
        <div className="min-w-[85vw] sm:min-w-0 snap-center shrink-0 sm:shrink">
          <ScrollReveal direction="up" delay={0.4}>
            <TiltCard maxTilt={6} glareEffect className="h-full">
              <div className="h-full rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white p-7 shadow-lg flex flex-col justify-between border border-slate-800">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <Badge variant="electric" size="sm" className="mb-3">
                    Corporate Governance
                  </Badge>
                  <h3 className="font-display text-xl font-bold text-white mb-2">
                    Unified Board Stewardship
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    Mahdev Pvt Ltd operates with strict fiduciary oversight, transparent board audits, and zero-defect SLA compliance across all client engagements.
                  </p>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Quarterly Institutional Performance Audits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Dedicated Client Account Directors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Strict Confidentiality & Non-Disclosure</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Executive Office</span>
                  <span className="text-white font-semibold">Colombo HQ</span>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>

      {/* Leadership Member Detail Modal */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.name || 'Executive Profile'}
        size="lg"
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <img
                src={selectedMember.photoUrl}
                alt={selectedMember.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover object-top border-2 border-blue-500 shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="text-center sm:text-left space-y-1 flex-1">
                <Badge variant="electric" size="sm">
                  {selectedMember.divisionFocus}
                </Badge>
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  {selectedMember.name}
                </h3>
                <p className="text-sm font-semibold text-[#0052FF]">
                  {selectedMember.title}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedMember.role}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Executive Biography
              </h4>
              <p>{selectedMember.bio}</p>
            </div>

            {selectedMember.credentials && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Core Competencies & Domain Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.credentials.map((cred) => (
                    <span
                      key={cred}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100"
                    >
                      {cred}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Mail className="w-4 h-4 text-[#0052FF]" />
                <span>{selectedMember.email}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedMember.linkedin && (
                  <a
                    href={selectedMember.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-[#0052FF] hover:bg-blue-50 transition-colors"
                    aria-label="LinkedIn Profile"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                <Button
                  size="sm"
                  variant="electric"
                  onClick={() => {
                    setSelectedMember(null);
                    if (onContactLeadership) {
                      onContactLeadership(selectedMember);
                    } else {
                      const el = document.getElementById('contact');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Direct Inquiry
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </SectionContainer>
  );
};
