import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Star, Trash2 } from 'lucide-react';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import {
  deleteProductReview,
  listAllProductReviews,
  ProductReviewRecord,
} from '../../services/productReviewService';

// Moderation list of customer product reviews: search, filter by rating, delete.
export const AdminReviewsView: React.FC = () => {
  const { products } = useFirestoreDataContext();
  const [reviews, setReviews] = useState<ProductReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [pendingDelete, setPendingDelete] = useState<ProductReviewRecord | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = (type: ToastMessage['type'], message: string) =>
    setToasts((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, type, message }]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setReviews(await listAllProductReviews());
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Reviews could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const productNames = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);

  const visible = reviews.filter((review) => {
    if (ratingFilter !== 'all' && review.rating !== ratingFilter) return false;
    const haystack = `${review.author} ${review.comment} ${review.title || ''} ${productNames.get(review.productId) || ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteProductReview(target.id);
      setReviews((prev) => prev.filter((review) => review.id !== target.id));
      toast('success', 'Review deleted.');
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'The review could not be deleted.');
    }
  };

  return (
    <div className="space-y-4">
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Product Reviews</h1>
          <p className="text-xs text-slate-500">{reviews.length} reviews from customers. Deleting a review updates the product rating.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-600">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-60 flex-1 items-center gap-2 rounded-sm border border-slate-300 bg-white px-3">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, author or comment" aria-label="Search reviews" className="w-full bg-transparent py-2 text-sm outline-none" />
        </label>
        <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))} aria-label="Filter by rating" className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2">Comment</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((review) => (
              <tr key={review.id}>
                <td className="px-3 py-2 font-medium text-slate-900">{productNames.get(review.productId) || review.productId}</td>
                <td className="px-3 py-2">{review.author}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-0.5 rounded-sm bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {review.rating} <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  </span>
                </td>
                <td className="max-w-md px-3 py-2 text-slate-700">
                  {review.title && <span className="block font-medium">{review.title}</span>}
                  <span className="line-clamp-3">{review.comment}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString('en-GB')}</td>
                <td className="px-3 py-2 text-right">
                  <button type="button" onClick={() => setPendingDelete(review)} aria-label={`Delete review by ${review.author}`} className="p-1.5 text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && visible.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">No reviews found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete review"
        message="This review will be removed from the product page and the product rating will be recalculated."
        itemIdentifier={pendingDelete?.author}
        confirmLabel="Delete review"
        allowSoftDelete={false}
        onConfirm={() => { void confirmDelete(); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
