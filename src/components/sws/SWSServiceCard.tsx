import React from 'react';
import { SWSService } from '../../data/swsData';
import { ServiceTile } from '../services/ServiceTile';

interface SWSServiceCardProps {
  service: SWSService;
  onViewDetails: (service: SWSService) => void;
  onBookNow: (service: SWSService) => void;
  onRequestQuote: (service: SWSService) => void;
}

export const SWSServiceCard: React.FC<SWSServiceCardProps> = ({
  service,
  onViewDetails,
  onBookNow,
  onRequestQuote,
}) => {
  const images = (service.gallery?.length ? service.gallery : [service.imageUrl])
    .filter(Boolean)
    .slice(0, 5);
  // Card shows only image, title and View; booking/quotes are in the details modal.
  void onBookNow;
  void onRequestQuote;
  return (
    <ServiceTile
      title={service.name}
      images={images.length ? images : [service.imageUrl].filter(Boolean) as string[]}
      onView={() => onViewDetails(service)}
      href={service.pagePath}
      price={service.price}
    />
  );
};
