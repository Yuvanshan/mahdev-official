import React, { useMemo } from 'react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ShopBanner, ShopBannerSlider } from './ShopBannerSlider';
import { ShopSlider } from './ShopSlider';
import { ShopProductTile, ShopTileData } from './ShopProductTile';

interface ShopHomeProps {
  onNavigate: (route: string) => void;
}

const SLIDER_LIMIT = 14;

// Flipkart-style storefront top of the home page: banner, then rows of deals, services and divisions.
export const ShopHome: React.FC<ShopHomeProps> = ({ onNavigate }) => {
  const { divisions, products, services } = useFirestoreDataContext();

  const banners = useMemo<ShopBanner[]>(
    () =>
      divisions
        .filter((division) => division.isPublished !== false && (division.heroImageUrl || division.imageUrl || division.defaultImageUrl))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((division) => ({
          id: String(division.id),
          title: division.name,
          subtitle: division.shortDescription || division.description,
          imageUrl: (division.heroImageUrl || division.imageUrl || division.defaultImageUrl) as string,
          route: division.route || `/${division.slug || division.id}`,
        })),
    [divisions]
  );

  const productTiles = useMemo(() => {
    const visible = products.filter((product) => (product as { status?: string }).status !== 'archived' && (product as { status?: string }).status !== 'draft');
    const tiles: Array<ShopTileData & { onSale: boolean }> = visible.map((product) => {
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
    });
    return tiles;
  }, [products]);

  const serviceTiles = useMemo<ShopTileData[]>(
    () =>
      services
        .filter((service) => service.isPublished !== false && service.status !== 'inactive' && service.status !== 'draft')
        .map((service) => ({
          id: service.id,
          name: service.title || service.name,
          imageUrl: service.imageUrl || service.images?.[0],
          price: service.startingPrice ?? (service.price > 0 ? service.price : undefined),
          currency: service.currency,
          caption: service.badge || service.divisionName || 'Book now',
          href: `/services/${service.slug}`,
        })),
    [services]
  );

  const deals = productTiles.filter((tile) => tile.onSale).slice(0, SLIDER_LIMIT);
  const newArrivals = productTiles.slice(0, SLIDER_LIMIT);
  const openProduct = (id: string) => onNavigate(`/mart?product=${encodeURIComponent(id)}`);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-2 py-3 sm:px-4">
      <ShopBannerSlider banners={banners} onNavigate={onNavigate} />
      {deals.length > 0 && (
        <ShopSlider title="Discounts for You" tagline="Limited-time offers from Mahdev Mart" onViewAll={() => onNavigate('/catalog')}>
          {deals.map((tile) => <ShopProductTile key={tile.id} item={tile} onSelect={() => openProduct(tile.id)} />)}
        </ShopSlider>
      )}
      {serviceTiles.length > 0 && (
        <ShopSlider title="Top Services" tagline="Events, studio, IT and travel, ready to book" onViewAll={() => onNavigate('/services')}>
          {serviceTiles.slice(0, SLIDER_LIMIT).map((tile) => (
            <ShopProductTile key={tile.id} item={tile} onSelect={() => onNavigate(tile.href || '/services')} />
          ))}
        </ShopSlider>
      )}
      {newArrivals.length > 0 && (
        <ShopSlider title="Suggested for You" tagline="Fresh in Mahdev Mart" onViewAll={() => onNavigate('/mart')}>
          {newArrivals.map((tile) => <ShopProductTile key={tile.id} item={tile} onSelect={() => openProduct(tile.id)} />)}
        </ShopSlider>
      )}
    </div>
  );
};
