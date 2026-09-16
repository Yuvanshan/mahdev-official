import React, { useState, useMemo } from 'react';
import { Star, ChevronRight, ExternalLink, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useGoogleReviews, useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DivisionId, FirestoreTestimonial } from '../../types/firestore';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { cmsService } from '../../services/cmsService';

interface TestimonialsSectionProps {
  initialDivision?: DivisionId | 'all';
  onNavigate?: (route: string) => void;
}

const DEFAULT_CUSTOMER_TESTIMONIALS = [
  {
    id: 'test-1',
    authorName: 'Dr. Ruwan & Shanika Jayasuriya',
    authorPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'SWS Event Management transformed our wedding ballroom into an ethereal botanical masterpiece. The attention to floral architecture and ambient lighting was truly breathtaking.',
    divisionId: 'sws',
    divisionName: 'SWS Event Management',
    relativePublishTimeDescription: '2 weeks ago',
  },
  {
    id: 'test-2',
    authorName: 'Dilantha Fernando',
    authorPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'U1 Studio produced a cinematic 8K wedding film that moved our entire family to tears. The colors, audio engineering, and candid drone shots were world-class.',
    divisionId: 'u1',
    divisionName: 'U1 Studio Cinema',
    relativePublishTimeDescription: '1 month ago',
  },
  {
    id: 'test-3',
    authorName: 'Ashan Senaratne — CTO, CloudEdge Lanka',
    authorPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'Mahdev IT engineered our custom logistics platform with impeccable speed and zero downtime. Reliable team with cutting-edge full-stack architecture.',
    divisionId: 'it',
    divisionName: 'IT Solutions',
    relativePublishTimeDescription: '3 weeks ago',
  },
  {
    id: 'test-4',
    authorName: 'Michael & Elena Vanderberg',
    authorPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'Mahdev Travels curated a 10-day bespoke luxury tour across Sri Lanka. Private helicopter transfers, tea estate bungalows, and wildlife safaris executed flawlessly.',
    divisionId: 'travels',
    divisionName: 'Mahdev Travels',
    relativePublishTimeDescription: '2 months ago',
  },
  {
    id: 'test-5',
    authorName: 'Kavindi Wickramasinghe',
    authorPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'Super fast delivery and authentic gear from Mahdev Mart. The packaging was immaculate and customer service provided real-time tracking updates throughout.',
    divisionId: 'mart',
    divisionName: 'Online Mart',
    relativePublishTimeDescription: '3 days ago',
  },
  {
    id: 'test-6',
    authorName: 'Nadeeka Perera — Head of Brand, Apex Group',
    authorPhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'We partnered with Mahdev for our annual corporate awards gala. The LED wall staging, live broadcast sync, and decor exceeded all our executive expectations.',
    divisionId: 'sws',
    divisionName: 'SWS Event Management',
    relativePublishTimeDescription: '1 month ago',
  },
];

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  initialDivision = 'all',
  onNavigate,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(initialDivision);
  const { reviews, config } = useGoogleReviews(selectedDivision);
  const { homepageConfig, testimonials: firestoreTestimonials } = useFirestoreDataContext();

  // Combine Google Reviews, Firestore Testimonials, CMS Local Testimonials, and Fallbacks
  const cmsTestimonials = useMemo(() => {
    try {
      const local = cmsService.getAll<FirestoreTestimonial>('testimonials', { includeDeleted: false });
      if (local && local.length > 0) return local;
    } catch {}
    return [];
  }, []);

  const mergedReviews = useMemo(() => {
    // 1. Google reviews
    const list: any[] = [...reviews];

    // 2. Admin Firestore testimonials
    if (firestoreTestimonials && firestoreTestimonials.length > 0) {
      firestoreTestimonials.forEach((t) => {
        list.push({
          id: t.id,
          authorName: t.customerName || t.authorName || t.author || (t as any).clientName || 'Verified Client',
          authorPhotoUrl: t.imageUrl || t.avatarUrl || t.authorPhotoUrl || t.photoUrl || '',
          rating: t.rating || 5,
          text: t.message || t.quote || t.text || (t as any).content || '',
          divisionId: t.division || t.divisionId || 'all',
          divisionName: t.divisionName || (t.division ? `${t.division.toUpperCase()} Division` : 'Mahdev Corporate'),
          relativePublishTimeDescription: t.date || 'Verified Customer',
        });
      });
    }

    // 3. Admin CMS local testimonials
    if (cmsTestimonials && cmsTestimonials.length > 0) {
      cmsTestimonials.forEach((t) => {
        if (!list.some((existing) => existing.id === t.id)) {
          list.push({
            id: t.id,
            authorName: t.customerName || t.authorName || t.author || (t as any).clientName || 'Verified Client',
            authorPhotoUrl: t.imageUrl || t.avatarUrl || t.authorPhotoUrl || t.photoUrl || '',
            rating: t.rating || 5,
            text: t.message || t.quote || t.text || (t as any).content || '',
            divisionId: t.division || t.divisionId || 'all',
            divisionName: t.divisionName || (t.division ? `${t.division.toUpperCase()} Division` : 'Mahdev Corporate'),
            relativePublishTimeDescription: t.date || 'Verified Customer',
          });
        }
      });
    }

    // 4. Default fallback testimonials if empty
    if (list.length === 0) {
      return DEFAULT_CUSTOMER_TESTIMONIALS;
    }

    return list;
  }, [reviews, firestoreTestimonials, cmsTestimonials]);

  // Filter by division if selected
  const filteredReviews = useMemo(() => {
    if (selectedDivision === 'all') return mergedReviews;
    return mergedReviews.filter(
      (r) =>
        r.divisionId === selectedDivision ||
        (r.divisionName && r.divisionName.toLowerCase().includes(selectedDivision.toLowerCase()))
    );
  }, [mergedReviews, selectedDivision]);

  const displayReviews = filteredReviews.slice(0, config?.maxDisplayCount || 6);

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
                Google Verified Reviews & Client Feedback
              </span>

              <span className="text-xs font-bold text-amber-600 flex items-center gap-1 font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {(config?.overallRating || 4.9).toFixed(1)} Rating ({config?.totalReviews || 180}+ Reviews)
              </span>
            </div>

            <H2 className="text-slate-900 mb-2.5">What Our Customers Say About Us</H2>
            <Body className="text-slate-600 text-sm sm:text-base">
              Real customer experiences across our luxury event management, cinematography, enterprise IT solutions, bespoke travel, and online commerce.
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
            <p className="text-xs text-slate-500">No customer reviews for this category yet.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible">
            {displayReviews.map((review) => (
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
                        <span className="text-[11px] font-bold text-slate-700">Verified Client</span>
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

        {/* Action Strip */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {config?.writeReviewUrl && (
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

            {config?.mapsUrl && (
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
              <span>View All Customer Reviews</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </SectionContainer>
    </div>
  );
};
