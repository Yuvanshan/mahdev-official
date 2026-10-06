/**
 * Asset Metrics & Rental Inventory Calculation Utility
 * Provides dynamic calculation of rental assets based on products added for rent,
 * with support for admin-level manual overrides stored in Firestore.
 */

export interface RentalAssetOptions {
  customCount?: string | number | null;
  suffix?: string;
  fallback?: string;
}

/**
 * Calculates the display string for rental assets/units.
 * If an admin has provided a custom override in settings or division data, that value is used.
 * Otherwise, counts the active rental inventory items from the database.
 */
export function getRentalAssetCount(
  products: any[] = [],
  customCount?: string | number | null,
  fallback = '100+'
): string {
  // 1. Explicit Admin Override has highest priority
  if (customCount !== undefined && customCount !== null && String(customCount).trim().length > 0) {
    const trimmed = String(customCount).trim();
    return trimmed.endsWith('+') ? trimmed : `${trimmed}+`;
  }

  // 2. Compute dynamically from products registered for rent in Firestore / CMS
  if (Array.isArray(products) && products.length > 0) {
    const rentalProducts = products.filter((p) => {
      if (!p || p.isDeleted || p.isActive === false) return false;
      const div = p.divisionId || p.division || '';
      const cat = (p.categoryId || p.category || p.categoryName || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => String(t).toLowerCase()) : [];
      const name = (p.name || p.title || '').toLowerCase();

      return (
        p.isRental === true ||
        div === 'sws' ||
        div === 'sws-event-management' ||
        cat.includes('rent') ||
        cat.includes('decor') ||
        tags.includes('rental') ||
        tags.includes('rent') ||
        name.includes('rental')
      );
    });

    if (rentalProducts.length > 0) {
      // Sum either explicit stockQuantity or 1 per product
      const totalUnits = rentalProducts.reduce((sum, item) => {
        const qty = Number(item.stockQuantity);
        return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
      }, 0);

      const displayCount = Math.max(totalUnits, rentalProducts.length);
      return `${displayCount.toLocaleString()}+`;
    }

    // Fallback if products exist but none specifically tagged for rent
    return `${products.length.toLocaleString()}+`;
  }

  return fallback;
}

/**
 * Convenience helper to format standard asset badge text
 */
export function formatRentalAssetsPhrase(
  count: string,
  phraseType: 'units' | 'inventory' | 'verified' | 'browse' | 'header' = 'units'
): string {
  switch (phraseType) {
    case 'units':
      return `${count} Units in Active Stock`;
    case 'inventory':
      return `${count} Rental Inventory Units`;
    case 'verified':
      return `${count} Verified Assets`;
    case 'browse':
      return `Browse ${count} Rentals`;
    case 'header':
      return `Rentals & Equipment (${count})`;
    default:
      return `${count} Rentals`;
  }
}
