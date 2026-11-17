import React, { useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface ShopSubheaderProps {
  onNavigate: (route: string) => void;
}

// Search bar plus a category strip of the divisions, shown under the main navigation (Flipkart header).
export const ShopSubheader: React.FC<ShopSubheaderProps> = ({ onNavigate }) => {
  const { divisions } = useFirestoreDataContext();
  const [keyword, setKeyword] = useState('');
  const { wishlistItems } = useWishlist();

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = keyword.trim();
    onNavigate(query ? `/catalog?search=${encodeURIComponent(query)}` : '/catalog');
  };

  const categories = divisions
    .filter((division) => division.isPublished !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 sm:px-6">
        <div className="flex items-center gap-2">
        <form onSubmit={submitSearch} role="search" className="flex min-w-0 flex-1 overflow-hidden rounded-sm border border-slate-300 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search for services, packages, products and more"
            aria-label="Search the Mahdev catalogue"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500"
          />
          <button type="submit" aria-label="Search" className="bg-blue-600 px-5 text-white hover:bg-blue-700">
            <Search className="h-4 w-4" />
          </button>
        </form>
        <button
          type="button"
          onClick={() => onNavigate('/wishlist')}
          aria-label={`Wishlist, ${wishlistItems.length} ${wishlistItems.length === 1 ? 'item' : 'items'}`}
          className="relative shrink-0 rounded-sm border border-slate-300 bg-white p-2.5 text-slate-700 hover:border-blue-600 hover:text-blue-700"
        >
          <Heart className="h-4 w-4" />
          {wishlistItems.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-blue-950">
              {wishlistItems.length}
            </span>
          )}
        </button>
        </div>
        {categories.length > 0 && (
          <nav aria-label="Divisions" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-6">
            {categories.map((division) => (
              <button
                key={division.id}
                type="button"
                onClick={() => onNavigate(division.route || `/${division.slug || division.id}`)}
                className="group flex w-20 shrink-0 flex-col items-center gap-1 rounded-sm p-1 sm:w-24"
              >
                <span className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition-transform duration-200 group-hover:scale-110 group-hover:border-amber-400">
                  {(division.logoUrl || division.logo || division.imageUrl) && (
                    <img src={division.logoUrl || division.logo || division.imageUrl} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="line-clamp-1 text-xs font-medium text-slate-800 group-hover:text-blue-700">
                  {division.shortName || division.name}
                </span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};
