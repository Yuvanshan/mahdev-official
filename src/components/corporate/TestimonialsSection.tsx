import React, { useState, useMemo } from 'react';
import { Star, ChevronRight, MessageSquare, CheckCircle2, Quote } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DivisionId } from '../../types/firestore';

interface TestimonialsSectionProps {
  initialDivision?: DivisionId | 'all';
  onNavigate?: (route: string) => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  initialDivision = 'all',
  onNavigate,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(initialDivision);
  const { homepageConfig, testimonials: firestoreTestimonials, isTestimonialsLoading } = useFirestoreDataContext();

  if (homepageConfig?.testimonials && homepageConfig.testimonials.enabled === false) {
    return null;
  }

  // Strictly show testimonials saved in Firestore by the admin
  const activeTestimonials = useMemo(() => {
    return (firestoreTestimonials || [])
      .filter((t) => !t.isHidden && t.isPublished !== false && (t as any).status !== 'archived')
      .map((t) => ({
        id: t.id,
        authorName: t.customerName || t.authorName || t.author || 'Verified Client',
        company: t.company || t.role || '',
        avatarUrl: t.imageUrl || t.avatarUrl || t.authorPhotoUrl || t.photoUrl || '',
        rating: Math.min(5, Math.max(1, Number(t.rating) || 5)),
        text: t.message || t.quote || t.text || '',
        divisionId: (t.division || t.divisionId || 'all').toLowerCase(),
        divisionName: t.divisionName || (t.division && t.division !== 'all' ? `${t.division.toUpperCase()} Division` : ''),
        date: t.date || t.relativePublishTimeDescription || '',
      }))
      .filter((t) => t.text.trim().length > 0);
  }, [firestoreTestimonials]);

  // Show shimmer while testimonials are fetching from Firestore
  if (isTestimonialsLoading && activeTestimonials.length === 0) {
    return (
      <SectionContainer id="testimonials-loading" background="subtle" paddingY="xl" hasBorderBottom>
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="space-y-3">
            <div className="h-6 w-36 bg-blue-100 rounded-full" />
            <div className="h-8 w-72 bg-slate-200 rounded-xl" />
            <div className="h-4 w-96 bg-slate-200/60 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="w-4 h-4 bg-amber-200 rounded-sm" />
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-full" />
                  <div className="h-3.5 bg-slate-100 rounded w-5/6" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    <div className="h-2.5 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>
    );
  }

  // If there are no saved testimonials in Firestore, completely hide the section from the landing page
  if (activeTestimonials.length === 0) {
    return null;
  }

  // Unique divisions with testimonials to show filter pills
  const availableDivisions = useMemo(() => {
    const divs = new Set<string>();
    activeTestimonials.forEach((t) => {
      if (t.divisionId && t.divisionId !== 'all') {
        divs.add(t.divisionId);
      }
    });
    return Array.from(divs);
  }, [activeTestimonials]);

  // Filter by selected division
  const filteredReviews = useMemo(() => {
    if (selectedDivision === 'all') return activeTestimonials;
    return activeTestimonials.filter(
      (r) =>
        r.divisionId === selectedDivision ||
        (r.divisionName && r.divisionName.toLowerCase().includes(selectedDivision.toLowerCase()))
    );
  }, [activeTestimonials, selectedDivision]);

  const meta = homepageConfig?.testimonials || {
    badge: 'CLIENT TESTIMONIALS',
    title: 'What Our Clients Say',
    subtitle: 'Verified customer feedback and testimonials across our service divisions.',
  };

  const getDivisionLabel = (id: string) => {
    switch (id) {
      case 'sws':
        return 'Events';
      case 'u1':
        return 'Studio';
      case 'it':
        return 'IT';
      case 'travels':
        return 'Travels';
      case 'mart':
        return 'Mart';
      default:
        return id.toUpperCase();
    }
  };

  return (
    <SectionContainer id="testimonials" background="white" paddingY="xl" hasBorderBottom>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-semibold mb-3 shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>{meta.badge || 'CLIENT TESTIMONIALS'}</span>
          </div>

          <H2 className="text-slate-900 mb-2">
            {meta.title || 'What Our Clients Say'}
          </H2>
          <Body className="text-slate-600 text-sm sm:text-base">
            {meta.subtitle || 'Verified customer feedback and testimonials across our service divisions.'}
          </Body>
        </div>

        {/* Division Filter Pills (only show if multiple divisions have reviews) */}
        {availableDivisions.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setSelectedDivision('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedDivision === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {availableDivisions.map((divId) => (
              <button
                key={divId}
                onClick={() => setSelectedDivision(divId as DivisionId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedDivision === divId
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {getDivisionLabel(divId)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Testimonials Grid */}
      {filteredReviews.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <p className="text-xs text-slate-500">No testimonials found for this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="p-6 sm:p-7 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-blue-400 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header: Stars and Division Tag */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {review.divisionName && (
                    <Badge variant="outline" size="sm" className="text-slate-600 bg-white text-[10px]">
                      {review.divisionName}
                    </Badge>
                  )}
                </div>

                {/* Review Quote */}
                <div className="relative mb-6">
                  <Quote className="w-6 h-6 text-slate-200 mb-2 -scale-x-100" />
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    "{review.text}"
                  </p>
                </div>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center gap-3">
                <div className="relative shrink-0">
                  {review.avatarUrl && review.avatarUrl.trim() !== '' ? (
                    <img
                      src={review.avatarUrl}
                      alt={review.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                      
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      {review.authorName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white rounded-full flex items-center justify-center ring-2 ring-white">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {review.authorName}
                  </h4>
                  {review.company && (
                    <p className="text-[11px] text-slate-500 truncate">
                      {review.company}
                    </p>
                  )}
                  {review.date && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {review.date}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {onNavigate && (
        <div className="mt-8 text-center">
          <button
            onClick={() => onNavigate('/testimonials')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-xs hover:border-blue-600 hover:text-blue-600 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span>View All Client Reviews</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </SectionContainer>
  );
};
