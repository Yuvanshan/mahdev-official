import { auth } from '../lib/firebase';
import { apiFetch } from '../lib/apiClient';

export interface ProductReviewRecord {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export interface ReviewInput {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

const PATH = '/product-reviews';

export async function listProductReviews(productId: string): Promise<ProductReviewRecord[]> {
  const result = await apiFetch<{ reviews: ProductReviewRecord[] }>(PATH, { params: { productId } });
  return result.reviews;
}

export async function submitProductReview(input: ReviewInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to review a product.');
  await apiFetch(PATH, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify(input),
  });
}

// Admin moderation: uses the admin session cookie.
export async function listAllProductReviews(): Promise<ProductReviewRecord[]> {
  const result = await apiFetch<{ reviews: ProductReviewRecord[] }>(PATH, { credentials: 'include' });
  return result.reviews;
}

export async function deleteProductReview(id: string): Promise<void> {
  await apiFetch(PATH, { method: 'DELETE', params: { id }, credentials: 'include' });
}
