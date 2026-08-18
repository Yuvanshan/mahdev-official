import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
} from '../motion/MotionWrappers';
import { TESTIMONIALS_DATA } from '../../data/corporateData';
import { DivisionId, Testimonial } from '../../types';

interface TestimonialsSectionProps {
  initialDivision?: DivisionId | 'all';
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  initialDivision = 'all',
}) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(initialDivision);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredTestimonials = TESTIMONIALS_DATA.filter(
    (t) => selectedDivision === 'all' || t.divisionId === selectedDivision
  );

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredTestimonials.length) % filteredTestimonials.length);
  };

  return (
    <SectionContainer id="testimonials" background="white" paddingY="xl" hasBorderBottom>
      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <Caption className="text-[#0052FF] mb-2 block">Client Endorsements</Caption>
            <H2 className="text-slate-900 mb-3">What Our Partners Say</H2>
            <Body className="text-slate-600 text-base">
              Direct feedback from business directors, marketing heads, and international delegations across Sri Lanka.
            </Body>
          </div>

          {/* Division Filter Pills */}
          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
            {(['all', 'sws', 'u1', 'it', 'travels', 'mart'] as (DivisionId | 'all')[]).map((divId) => (
              <button
                key={divId}
                onClick={() => {
                  setSelectedDivision(divId);
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedDivision === divId
                    ? 'bg-[#0052FF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {divId === 'all'
                  ? 'All'
                  : divId === 'sws'
                  ? 'Events'
                  : divId === 'u1'
                  ? 'Studio'
                  : divId === 'it'
                  ? 'IT'
                  : divId === 'travels'
                  ? 'Travels'
                  : 'Mart'}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Testimonials Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTestimonials.map((t, idx) => (
          <ScrollReveal key={t.id} direction="up" delay={idx * 0.07}>
            <TiltCard maxTilt={5} glareEffect className="h-full">
              <div className="h-full p-7 rounded-3xl bg-slate-50/80 border border-slate-200/90 hover:border-[#0052FF] hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div>
                  {/* Top Quote Icon & Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {t.divisionName && (
                      <Badge variant="outline" size="sm" className="text-slate-600 bg-white">
                        {t.divisionName.split('&')[0].trim()}
                      </Badge>
                    )}
                  </div>

                  {/* Quote Body */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-6">
                    "{t.quote}"
                  </p>
                </div>

                {/* Author Information */}
                <div className="pt-4 border-t border-slate-200 flex items-center gap-3.5">
                  <div className="relative">
                    {t.photoUrl ? (
                      <img
                        src={t.photoUrl}
                        alt={t.author}
                        className="w-11 h-11 rounded-full object-cover border-2 border-blue-500 shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {t.avatarInitials}
                      </div>
                    )}
                    {t.verified && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center ring-2 ring-white">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-[#0052FF] transition-colors">
                      {t.author}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t.role}, <span className="font-medium text-slate-700">{t.company}</span>
                    </p>
                  </div>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </SectionContainer>
  );
};
