import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { DIVISIONS } from '../../config/divisions';
import { divisionIdFromName } from '../../utils/onlineBooking';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';
import { useAutoSlideImage } from '../../hooks/useAutoSlideImage';

export interface HomeShowcaseItem {
  id: string;
  title: string;
  category: string;
  description: string;
  images: string[];
  imageAlt: string;
  meta?: string;
  divisionId: string;
  divisionRoute?: string;
}

export function divisionCategoryPath(item: Pick<HomeShowcaseItem, 'divisionId' | 'divisionRoute' | 'category'>): string {
  const divisionId = divisionIdFromName(item.divisionId) || item.divisionId.toLowerCase();
  const path = item.divisionRoute || DIVISIONS[divisionId as keyof typeof DIVISIONS]?.route || `/${divisionId}`;
  const query = new URLSearchParams({ category: item.category });
  return `${path}?${query.toString()}`;
}

interface HomeExpandableShowcaseProps {
  items: HomeShowcaseItem[];
  onNavigate: (route: string) => void;
  viewAllRoute: string;
  viewAllLabel: string;
  emptyMessage: string;
}

export const HomeExpandableShowcase: React.FC<HomeExpandableShowcaseProps> = ({
  items,
  onNavigate,
  viewAllRoute,
  viewAllLabel,
  emptyMessage,
}) => {
  const [activeId, setActiveId] = useState(items[0]?.id || '');
  const activeItem = items.find((item) => item.id === activeId) || items[0];
  const images = Array.from(new Set(activeItem?.images.filter(Boolean) || []));
  const { activeIndex, containerRef } = useAutoSlideImage(images.length);
  const showcaseImages = images.length
    ? Array.from({ length: 4 }, (_, index) => images[(activeIndex + index) % images.length])
    : [];
  const activePath = activeItem ? divisionCategoryPath(activeItem) : viewAllRoute;

  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, route: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(route);
  };

  if (!items.length || !activeItem) {
    return <p className="home-showcase-empty">{emptyMessage}</p>;
  }

  return (
    <div className="home-showcase">
      <nav className="home-showcase-list" aria-label="Featured items">
        {items.map((item, index) => {
          const isActive = item.id === activeItem.id;
          const itemPath = divisionCategoryPath(item);
          return (
            <a
              key={item.id}
              href={itemPath}
              onClick={(event) => navigate(event, itemPath)}
              onPointerEnter={() => setActiveId(item.id)}
              onFocus={() => setActiveId(item.id)}
              aria-expanded={isActive}
              className={`home-showcase-item${isActive ? ' is-active' : ''}`}
            >
              <span className="home-showcase-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="home-showcase-copy">
                <span className="home-showcase-title">{item.title}</span>
                <span className="home-showcase-category">{item.category}</span>
                <span className="home-showcase-description">{item.description}</span>
                {item.meta && <span className="home-showcase-meta">{item.meta}</span>}
              </span>
              <ArrowUpRight className="home-showcase-arrow" aria-hidden="true" />
            </a>
          );
        })}
        <a
          href={viewAllRoute}
          onClick={(event) => navigate(event, viewAllRoute)}
          className="home-showcase-all"
        >
          {viewAllLabel}
          <ArrowUpRight aria-hidden="true" />
        </a>
      </nav>

      <div ref={containerRef} className="home-showcase-feature-wrap">
        <a
          href={activePath}
          onClick={(event) => navigate(event, activePath)}
          className="home-showcase-feature"
          aria-label={`Explore ${activeItem.title}`}
        >
          {showcaseImages.map((image, index) => (
            <span
              key={`showcase-layer-${index + 1}`}
              className={`home-showcase-photo home-showcase-photo--layer home-showcase-photo--layer-${index + 1}`}
              aria-hidden="true"
            >
              <ImageWithShimmer
                src={image}
                alt=""
                className="home-showcase-photo-image"
                imageFit="cover"
                imageClassName="home-showcase-image-content"
                loading="lazy"
              />
            </span>
          ))}
        </a>
      </div>
    </div>
  );
};
