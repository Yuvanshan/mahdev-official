import { useEffect, useState } from 'react';
import type { GoogleReview } from '../types/googleReviews';

interface LiveGoogleReviews {
  reviews: GoogleReview[];
  rating?: number;
  total: number;
}

// If Google (through our server) is slower than this, the admin's saved reviews are shown instead.
const LIVE_TIMEOUT_MS = 3500;

interface LiveApiReview {
  googleReviewId: string;
  branch: 'trincomalee' | 'colombo';
  authorName: string;
  authorPhotoUrl?: string;
  authorUrl?: string;
  rating: number;
  text: string;
  relativePublishTimeDescription?: string;
  publishTime?: string;
}

// One request per page load, shared by every component that asks.
let pending: Promise<LiveGoogleReviews | null> | null = null;

function loadLiveReviews(): Promise<LiveGoogleReviews | null> {
  pending ??= fetch('/api/google-reviews', { signal: AbortSignal.timeout(LIVE_TIMEOUT_MS) })
    .then((response) => (response.ok ? response.json() : null))
    .then((data): LiveGoogleReviews | null => {
      if (!data?.success || !Array.isArray(data.reviews) || data.reviews.length === 0) return null;
      const now = new Date().toISOString();
      return {
        rating: data.rating,
        total: Number(data.total) || data.reviews.length,
        reviews: (data.reviews as LiveApiReview[]).map((review) => ({
          id: `live-${review.googleReviewId}`,
          googleReviewId: review.googleReviewId,
          authorName: review.authorName,
          authorPhotoUrl: review.authorPhotoUrl,
          authorUrl: review.authorUrl,
          rating: review.rating,
          text: review.text,
          relativePublishTimeDescription: review.relativePublishTimeDescription,
          publishTime: review.publishTime,
          source: 'google' as const,
          sourceBadge: 'Google Verified Review' as const,
          branch: review.branch,
          branchName: review.branch === 'colombo' ? 'Colombo Branch' : 'Trincomalee Branch',
          isFeatured: true,
          isHidden: false,
          divisionId: 'all' as const,
          createdAt: review.publishTime || now,
          updatedAt: now,
        })),
      };
    })
    .catch(() => null); // Slow, offline or not configured: the caller falls back to the admin's reviews.
  return pending;
}

/** Live Google reviews, or null while loading and whenever Google did not answer in time. */
export function useLiveGoogleReviews(): LiveGoogleReviews | null {
  const [live, setLive] = useState<LiveGoogleReviews | null>(null);
  useEffect(() => {
    let active = true;
    void loadLiveReviews().then((result) => active && setLive(result));
    return () => {
      active = false;
    };
  }, []);
  return live;
}
