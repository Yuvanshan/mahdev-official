import React, { useMemo } from 'react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ShopBanner, ShopBannerSlider } from './ShopBannerSlider';
import { ShopSlider } from './ShopSlider';
import { ShopProductTile, ShopTileData } from './ShopProductTile';
import { useAvailableCmsBanners } from '../../hooks/useAvailableCmsBanners';
import { useSuggestedGallery } from './useSuggestedGallery';

interface ShopHomeProps {
  onNavigate: (route: string) => void;
}

const SLIDER_LIMIT = 8;

// Flipkart-style storefront top of the home page: banner, then rows of deals, services and divisions.
export const ShopHome: React.FC<ShopHomeProps> = ({ onNavigate }) => {
  const { divisions, products, services, gallery, isDivisionsLoading, isHomepageConfigLoading, isServicesLoading } = useFirestoreDataContext();
  const cmsBanners = useAvailableCmsBanners();

  // Banners uploaded in the admin portal (placement "Home hero") come first; divisions are the fallback.
  const banners = useMemo<ShopBanner[]>(() => {
    const uploaded: ShopBanner[] = cmsBanners
      .filter((banner) => banner.placement === 'home_hero' && banner.imageUrl)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .map((banner) => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl as string,
        mobileImageUrl: banner.mobileImageUrl || undefined,
        route: banner.targetUrl || '/services',
        buttonText: banner.buttonText || undefined,
      }));
    if (uploaded.length > 0) return uploaded;
    return divisions
        .filter((division) => division.isPublished !== false && (division.heroImageUrl || division.imageUrl || division.defaultImageUrl))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((division) => ({
          id: String(division.id),
          title: division.name,
          subtitle: division.shortDescription || division.description,
          imageUrl: (division.heroImageUrl || division.imageUrl || division.defaultImageUrl) as string,
          route: division.route || `/${division.slug || division.id}`,
        }));
  }, [cmsBanners, divisions]);

  const suggestedTiles = useSuggestedGallery(gallery, SLIDER_LIMIT);

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
  const openProduct = (id: string) => onNavigate(`/mart?product=${encodeURIComponent(id)}`);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-2 py-3 sm:px-4">
      {banners.length ? (
        <ShopBannerSlider banners={banners} onNavigate={onNavigate} />
      ) : isDivisionsLoading || isHomepageConfigLoading || divisions.length === 0 ? (
        <div
          aria-hidden="true"
          className="aspect-[4/3] w-full animate-pulse rounded-sm bg-slate-200 sm:aspect-[16/5] sm:max-h-[26rem]"
        />
      ) : null}
      {/* Reserve the row's height until services load so the hero below is not pushed down (CLS). */}
      {serviceTiles.length === 0 && isServicesLoading && (
        <div aria-hidden="true" className="h-[22rem] w-full animate-pulse rounded-sm border border-slate-200 bg-slate-100" />
      )}
      {serviceTiles.length > 0 && (
        <ShopSlider title="Top Services" tagline="Events, studio, IT and travel, ready to book" onViewAll={() => onNavigate('/services')}>
          {serviceTiles.slice(0, SLIDER_LIMIT).map((tile) => (
            <ShopProductTile key={tile.id} item={tile} onSelect={() => onNavigate(tile.href || '/services')} />
          ))}
        </ShopSlider>
      )}
      {suggestedTiles.length > 0 && (
        <ShopSlider title="Suggested for You" tagline="From the Mahdev gallery: your searches and views first, plus new items" onViewAll={() => onNavigate('/gallery')}>
          {suggestedTiles.map((tile) => <ShopProductTile key={tile.id} item={tile} onSelect={() => onNavigate(tile.href || '/gallery')} />)}
        </ShopSlider>
      )}
      {deals.length > 0 && (
        <ShopSlider title="Discounts for You" tagline="Limited-time offers from Mahdev Mart" onViewAll={() => onNavigate('/catalog')}>
          {deals.map((tile) => <ShopProductTile key={tile.id} item={tile} onSelect={() => openProduct(tile.id)} />)}
        </ShopSlider>
      )}
    </div>
  );
};
