import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface WishlistItem {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  href: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
}

// Kept on this device, like the cart.
const WISHLIST_STORAGE_KEY = 'mahdev_wishlist_v1';

function loadWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is WishlistItem =>
          Boolean(item) && typeof item === 'object' &&
          typeof (item as WishlistItem).id === 'string' &&
          typeof (item as WishlistItem).name === 'string' &&
          typeof (item as WishlistItem).href === 'string')
      : [];
  } catch {
    return [];
  }
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(loadWishlist);

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch {
      // Storage may be full or blocked (private mode); the wishlist still works for this visit.
    }
  }, [wishlistItems]);

  const isInWishlist = useCallback((id: string) => wishlistItems.some((item) => item.id === id), [wishlistItems]);
  const removeFromWishlist = useCallback((id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  }, []);
  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlistItems((prev) => prev.some((current) => current.id === item.id)
      ? prev.filter((current) => current.id !== item.id)
      : [...prev, item]);
  }, []);

  const value = useMemo(
    () => ({ wishlistItems, isInWishlist, toggleWishlist, removeFromWishlist }),
    [wishlistItems, isInWishlist, toggleWishlist, removeFromWishlist]
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
