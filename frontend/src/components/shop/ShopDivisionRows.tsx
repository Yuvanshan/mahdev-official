import React, { useMemo } from 'react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ShopSlider } from './ShopSlider';
import { ShopProductTile } from './ShopProductTile';

interface ShopDivisionRowsProps {
  /** Division route id: 'mart', 'sws', 'u1', 'it' or 'travels'. */
  divisionId: string;
  onNavigate: (route: string) => void;
}

const ROW_LIMIT = 14;
const matchesDivision = (record: { divisionId?: string; division?: string }, divisionId: string) =>
  (record.divisionId || record.division || '').toLowerCase() === divisionId;

// Flipkart-style rows (deals and top picks) shown at the top of a division page.
export const ShopDivisionRows: React.FC<ShopDivisionRowsProps> = ({ divisionId, onNavigate }) => {
  const { products, services } = useFirestoreDataContext();

  const productTiles = useMemo(
    () =>
      products
        .filter((product) => matchesDivision(product, divisionId === 'mart' ? 'mart' : divisionId))
        .filter((product) => (product as { status?: string }).status !== 'archived' && (product as { status?: string }).status !== 'draft')
        .map((product) => {
          const price = product.discountPrice ?? product.price;
          const originalPrice = product.compareAtPrice ?? (product.discountPrice !== undefined ? product.price : undefined);
          return {
            id: product.id,
            href: `/mart?product=${encodeURIComponent(product.id)}`,
            name: product.name,
            imageUrl: product.imageUrl || product.images?.[0],
            price,
            originalPrice,
            currency: product.currency,
            onSale: originalPrice !== undefined && originalPrice > price,
          };
        }),
    [products, divisionId]
  );

  const serviceTiles = useMemo(
    () =>
      services
        .filter((service) => matchesDivision(service, divisionId))
        .filter((service) => service.isPublished !== false && service.status !== 'inactive' && service.status !== 'draft')
        .map((service) => ({
          id: service.id,
          href: `/services/${service.slug}`,
          name: service.title || service.name,
          imageUrl: service.imageUrl || service.images?.[0],
          price: service.startingPrice ?? (service.price > 0 ? service.price : undefined),
          currency: service.currency,
          caption: service.badge || 'Book now',
        })),
    [services, divisionId]
  );

  const deals = productTiles.filter((tile) => tile.onSale).slice(0, ROW_LIMIT);
  const picks = productTiles.slice(0, ROW_LIMIT);
  if (deals.length + picks.length + serviceTiles.length === 0) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-2 py-3 sm:px-4">
      {deals.length > 0 && (
        <ShopSlider title="Deals of the Day" tagline="Limited-time offers" onViewAll={() => onNavigate('/catalog')}>
          {deals.map((tile) => <ShopProductTile key={tile.id} item={tile} onSelect={() => onNavigate(tile.href)} />)}
        </ShopSlider>
      )}
      {serviceTiles.length > 0 && (
        <ShopSlider title="Top Picks" tagline="Popular services, ready to book" onViewAll={() => onNavigate('/services')}>
          {serviceTiles.slice(0, ROW_LIMIT).map((tile) => <ShopProductTile key={tile.id} item={tile} onSelect={() => onNavigate(tile.href)} />)}
        </ShopSlider>
      )}
      {picks.length > 0 && (
        <ShopSlider title="Suggested for You" onViewAll={() => onNavigate('/catalog')}>
          {picks.map((tile) => <ShopProductTile key={tile.id} item={tile} onSelect={() => onNavigate(tile.href)} />)}
        </ShopSlider>
      )}
    </div>
  );
};
