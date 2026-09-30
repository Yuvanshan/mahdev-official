import React, { useState, useEffect } from 'react';
import {
  Star,
  ExternalLink,
  MessageSquare,
  Search,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ScrollReveal, TiltCard } from '../components/motion/MotionWrappers';
import { SEOHead } from '../components/layout/SEOHead';
import { useGoogleReviews, useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DivisionId } from '../types/firestore';
import { DIVISIONS } from '../config/divisions';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';

interface TestimonialsViewProps {
  onNavigate: (route: string) => void;
}

export const TestimonialsView: React.FC<TestimonialsViewProps> = ({ onNavigate }) => {
  const { allReviews, config } = useGoogleReviews();
  const { companySettings, isInitialLoading, isFetching } = useFirestoreDataContext();

  const [selectedBranch, setSelectedBranch] = useState<'all' | 'trincomalee' | 'colombo'>('all');
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (allReviews.length === 0 && (isInitialLoading || isFetching)) {
    return (
      <div className="pt-28 pb-24 min-h-[60vh] flex items-center justify-center bg-white">
        <DataLoadingOverlay
          message="Loading reviews..."
          subMessage="Curating verified client feedback..."
        />
      </div>
    );
  }

  // Filter out any hidden reviews for public site
  const visibleReviews = allReviews.filter((r) => !r.isHidden);

  const filteredReviews = visibleReviews.filter((r) => {
    // Branch filter
    if (selectedBranch !== 'all' && r.branch && r.branch !== selectedBranch) {
      return false;
    }

    // Division filter
    if (selectedDivision !== 'all') {
      const matchDiv = r.divisionId === selectedDivision || r.divisionId === 'all';
      if (!matchDiv) return false;
    }

    // Rating filter
    if (minRating > 0 && r.rating < minRating) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAuthor = r.authorName?.toLowerCase().includes(q);
      const matchText = r.text?.toLowerCase().includes(q);
      const matchDiv = r.divisionName?.toLowerCase().includes(q);
      const matchBranch = r.branchName?.toLowerCase().includes(q);
      if (!matchAuthor && !matchText && !matchDiv && !matchBranch) return false;
    }

    return true;
  });

  return (
    <div className="pt-24 pb-12 bg-white">
      <SEOHead
        title="Google Reviews & Verified Client Feedback | Mahdev Pvt Ltd"
        description={`Read genuine verified reviews from Mahdev's Google Maps and Google Business Profile across Trincomalee and Colombo branches.`}
        canonicalUrl="https://mahdev.lk/testimonials"
      />

      {/* Header Banner & Google Scoreboard */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0052FF] text-xs font-bold">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Official Google Business Profile
                </span>
                <span className="text-xs font-semibold text-slate-500">100% Genuine Reviews</span>
              </div>

              <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-3">
                Verified Customer Reviews
              </H1>
              <Body className="text-slate-600 text-base sm:text-lg">
                Direct testimonials and ratings published on Google Maps by wedding couples, business leaders, cinema clients, and tech partners of {companySettings?.name || 'Mahdev Pvt Ltd'}.
              </Body>

              {/* Direct Branch Google Maps Review Links */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <a
                  href={config.trincomaleeMapsUrl || 'https://share.google/MTi1hJxhhXtx6OXrd'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors shadow-2xs"
                >
                  📍 Trincomalee Branch Profile & Reviews <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={config.colomboMapsUrl || 'https://share.google/VjJA6IPKLSMaA9AgR'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors shadow-2xs"
                >
                  📍 Colombo Branch Profile & Reviews <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Google Rating Summary Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-2xl font-bold font-display text-slate-900">
                  {config.overallRating.toFixed(1)} / 5.0
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Based on {config.totalReviews} verified Google reviews
                </p>
              </div>

              <div className="w-full sm:w-auto flex flex-col gap-2">
                <a
                  href={config.writeReviewUrl || 'https://share.google/MTi1hJxhhXtx6OXrd'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Write a Review
                </a>
                <a
                  href={config.mapsUrl || 'https://share.google/MTi1hJxhhXtx6OXrd'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  View on Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Filters & Testimonials Grid */}
      <SectionContainer background="white" paddingY="xl" hasBorderBottom>
        {/* Filter Bar */}
        <div className="flex flex-col gap-4 mb-10 pb-6 border-b border-slate-200">
          {/* Branch & Division Filters row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Branch Filter Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                {(['all', 'trincomalee', 'colombo'] as const).map((bId) => (
                  <button
                    key={bId}
                    onClick={() => setSelectedBranch(bId)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedBranch === bId
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {bId === 'all' ? 'All Branches' : bId === 'trincomalee' ? '📍 Trincomalee' : '📍 Colombo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Division Filter */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
              {(['all', 'sws', 'u1', 'it', 'travels', 'mart'] as (DivisionId | 'all')[]).map((divId) => (
                <button
                  key={divId}
                  onClick={() => setSelectedDivision(divId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedDivision === divId
                      ? 'bg-[#0052FF] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {divId === 'all'
                    ? 'All Divisions'
                    : divId === 'sws'
                    ? 'SWS Events'
                    : divId === 'u1'
                    ? 'Studio U2'
                    : divId === 'it'
                    ? 'IT & Solutions'
                    : divId === 'travels'
                    ? 'Travels'
                    : 'Online Mart'}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Rating row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reviews by name, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 w-full sm:w-auto justify-end">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {[0, 5, 4].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setMinRating(stars)}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    minRating === stars
                      ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {stars === 0 ? 'All Ratings' : `${stars}★ & Above`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        {filteredReviews.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-3xl border border-slate-200 max-w-lg mx-auto p-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-bold text-slate-800">No Reviews Found</p>
            <p className="text-xs text-slate-500 mt-1">No verified reviews match your current search or filter criteria.</p>
            <button
              onClick={() => {
                setSelectedBranch('all');
                setSelectedDivision('all');
                setMinRating(0);
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0052FF] hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review, idx) => (
              <ScrollReveal key={review.id} direction="up" delay={idx * 0.04}>
                <TiltCard maxTilt={3} glareEffect className="h-full">
                  <div className="h-full p-7 rounded-3xl bg-slate-50/80 border border-slate-200/90 hover:border-[#0052FF] hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      {/* Top Google Badge, Branch & Division */}
                      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200/70">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span className="text-xs font-bold text-slate-700">Google Verified</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            review.branch === 'colombo'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {review.branch === 'colombo' ? 'Colombo' : 'Trincomalee'}
                          </span>
                          {review.divisionName && review.divisionName !== 'All Divisions' && (
                            <Badge variant="outline" size="sm" className="bg-white text-[10px]">
                              {review.divisionName.split(' ')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1 text-amber-500 mb-3">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-xs font-bold text-slate-700 ml-1 font-mono">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                        "{review.text}"
                      </p>
                    </div>

                    {/* Customer Attribution */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {review.authorPhotoUrl ? (
                            <img
                              src={review.authorPhotoUrl}
                              alt={review.authorName}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                              
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                              {review.authorName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center ring-2 ring-white">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        </div>

                        <div>
                          <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-[#0052FF] transition-colors">
                            {review.authorName}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {review.relativePublishTimeDescription || review.date || 'Google Review'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        )}
      </SectionContainer>

      {/* CTA */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/booking')}
      />
    </div>
  );
};
