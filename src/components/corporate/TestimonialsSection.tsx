import React, { useState } from 'react';
import { Star, ChevronRight, ExternalLink, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useGoogleReviews, useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DivisionId } from '../../types/firestore';
import { ParallelWatermark } from '../motion/ParallelScroll';

interface TestimonialsSectionProps {
  initialDivision?: DivisionId | 'all';
  onNavigate?: (route: string) => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  initialDivision = 'all',
  onNavigate,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(initialDivision);
  const { reviews, config, allReviews } = useGoogleReviews(selectedDivision);
  const { homepageConfig } = useFirestoreDataContext();

  // If testimonials section is disabled in homepage config or master google review switch is turned off
  if (homepageConfig?.testimonials && !homepageConfig.testimonials.enabled) {
    return null;
  }

  if (config && !config.enabled) {
    return null;
  }

  // Limit display count based on admin configuration (e.g., 6)
  const displayReviews = reviews.slice(0, config.maxDisplayCount || 6);

  if (displayReviews.length === 0 && allReviews.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden">
      <ParallelWatermark text="06 // REVIEWS" />
      <SectionContainer id="testimonials" background="white" paddingY="xl" hasBorderBottom>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-mono font-semibold">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Google Verified Reviews
              </span>

              <span className="text-xs font-bold text-amber-600 flex items-center gap-1 font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {config.overallRating.toFixed(1)} Rating ({config.totalReviews}+ Reviews)
              </span>
            </div>

            <H2 className="text-slate-900 mb-2.5">What Our Clients Say</H2>
            <Body className="text-slate-600 text-sm sm:text-base">
              Real customer feedback from our Google Maps & Google Business Profile across weddings, executive events, cinema, and digital projects.
            </Body>
          </div>

          {/* Division Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
            {(['all', 'sws', 'u1', 'it', 'travels', 'mart'] as (DivisionId | 'all')[]).map((divId) => (
              <button
                key={divId}
                onClick={() => setSelectedDivision(divId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedDivision === divId
                    ? 'bg-blue-600 text-white shadow-xs'
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

        {/* Testimonials Grid / Mobile Horizontal Track */}
        {displayReviews.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs text-slate-500">No featured reviews for this division currently.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible">
            {displayReviews.map((review, idx) => (
              <div
                key={review.id}
                className="w-[calc(100vw-2.5rem)] max-w-[340px] sm:max-w-none sm:w-auto snap-center shrink-0 sm:shrink"
              >
                <div className="h-full p-6 sm:p-7 rounded-3xl bg-slate-50/80 border border-slate-200/90 hover:border-blue-400 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    {/* Top Google Badge & Star Rating */}
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/70">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span className="text-[11px] font-bold text-slate-700">Google Review</span>
                      </div>

                      {review.divisionName && review.divisionName !== 'All Divisions' && (
                        <Badge variant="outline" size="sm" className="text-slate-600 bg-white text-[10px]">
                          {review.divisionName.split(' ')[0]}
                        </Badge>
                      )}
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 text-amber-500 mb-3">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    {/* Review Comment */}
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-6">
                      "{review.text}"
                    </p>
                  </div>

                  {/* Reviewer Information */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {review.authorPhotoUrl && review.authorPhotoUrl.trim() !== '' ? (
                          <img
                            src={review.authorPhotoUrl}
                            alt={review.authorName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                            referrerPolicy="no-referrer"
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

                      <div>
                        <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {review.authorName}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {review.relativePublishTimeDescription || review.date || 'Verified Customer'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Strip: View All & Write a Review on Google */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {config.writeReviewUrl && (
              <a
                href={config.writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Write a Review on Google</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {config.mapsUrl && (
              <a
                href={config.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/testimonials')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-xs hover:border-blue-600 hover:text-blue-600 hover:shadow-xs transition-all cursor-pointer group"
            >
              <span>View All Google Reviews</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </SectionContainer>
    </div>
  );
};
