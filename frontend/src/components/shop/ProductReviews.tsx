import React, { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  listProductReviews,
  ProductReviewRecord,
  submitProductReview,
} from '../../services/productReviewService';

interface ProductReviewsProps {
  productId: string;
}

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`h-3.5 w-3.5 ${n <= value ? 'fill-current' : 'text-slate-300'}`} aria-hidden="true" />
    ))}
  </span>
);

// Customer reviews of one product: the list, the average, and a form for signed-in customers.
export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ProductReviewRecord[]>([]);
  const [loadError, setLoadError] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setReviews(await listProductReviews(productId));
      setLoadError('');
    } catch (error) {
      console.warn('[Reviews] Could not load reviews:', error);
      setLoadError('Reviews could not be loaded right now.');
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (rating < 1 || comment.trim().length < 3) {
      setMessage({ ok: false, text: 'Choose a star rating and write a short comment.' });
      return;
    }
    setIsSaving(true);
    try {
      await submitProductReview({ productId, rating, title, comment });
      setMessage({ ok: true, text: 'Thank you. Your review has been saved.' });
      setRating(0);
      setTitle('');
      setComment('');
      await load();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Your review could not be saved.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section aria-label="Customer reviews" className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-slate-900">Customer reviews</h3>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="inline-flex items-center gap-0.5 rounded-sm bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              {average.toFixed(1)} <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            </span>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        )}
      </div>

      {loadError && <p className="text-xs text-rose-700">{loadError}</p>}
      {!loadError && reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet. Be the first to review this product.</p>}
      <ul className="space-y-3">
        {reviews.map((review) => (
          <li key={review.id} className="space-y-1 rounded-sm border border-slate-200 bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">{review.author}</span>
              <time className="text-xs text-slate-400" dateTime={review.createdAt}>
                {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </time>
            </div>
            <Stars value={review.rating} />
            {review.title && <p className="font-medium text-slate-900">{review.title}</p>}
            <p className="whitespace-pre-line text-slate-700">{review.comment}</p>
          </li>
        ))}
      </ul>

      {isAuthenticated ? (
        <form onSubmit={submit} className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Write a review</p>
          <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                onClick={() => setRating(n)}
                className="text-amber-500"
              >
                <Star className={`h-6 w-6 ${n <= rating ? 'fill-current' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            placeholder="Title (optional)"
            aria-label="Review title"
            className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="What did you like or dislike?"
            aria-label="Review comment"
            className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
          {message && <p role="status" className={`text-xs ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{message.text}</p>}
          <button type="submit" disabled={isSaving} className="rounded-sm bg-blue-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-60">
            {isSaving ? 'Saving…' : 'Submit review'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-600">
          <a href="/login" className="font-semibold text-blue-700 underline">Sign in</a> to write a review.
        </p>
      )}
    </section>
  );
};
