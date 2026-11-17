import React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrency } from '../utils/currency';

interface WishlistViewProps {
  onNavigate: (route: string) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({ onNavigate }) => {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-6">
      <SEOHead title="My Wishlist | Mahdev" description="Items you saved on Mahdev." noIndex />
      <h1 className="mb-4 text-xl font-semibold text-slate-900">My Wishlist ({wishlistItems.length})</h1>
      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-sm border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Heart className="h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="text-sm text-slate-600">Your wishlist is empty. Tap the heart on any item to save it here.</p>
          <button type="button" onClick={() => onNavigate('/catalog')} className="rounded-sm bg-blue-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-blue-700">
            Browse the catalogue
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-sm border border-slate-200 bg-white shadow-sm">
          {wishlistItems.map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <button type="button" onClick={() => onNavigate(item.href)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                <span className="h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-slate-50">
                  {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-contain" />}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-blue-700">{item.name}</span>
                  {item.price !== undefined && (
                    <span className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      {formatCurrency(item.price, item.currency || 'LKR')}
                      {item.originalPrice !== undefined && item.originalPrice > item.price && (
                        <span className="text-xs font-normal text-slate-500 line-through">{formatCurrency(item.originalPrice, item.currency || 'LKR')}</span>
                      )}
                    </span>
                  )}
                </span>
              </button>
              <button type="button" onClick={() => removeFromWishlist(item.id)} aria-label={`Remove ${item.name} from wishlist`} className="p-2 text-slate-400 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
