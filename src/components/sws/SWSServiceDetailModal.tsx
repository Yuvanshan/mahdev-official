import React from 'react';
import { SWSService } from '../../data/swsData';
import { ServiceDetailsModal } from '../services/ServiceDetailsModal';

interface SWSServiceDetailModalProps {
  service: SWSService | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (service: SWSService) => void;
  onRequestQuote: (service: SWSService) => void;
}

/** SWS service details in the shared full-screen layout (images left, details right). */
export const SWSServiceDetailModal: React.FC<SWSServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookNow,
  onRequestQuote,
}) => {
  const details = isOpen && service
    ? {
        title: service.name,
        subtitle: service.tagline,
        divisionName: 'SWS Event Management',
        images: (service.gallery?.length ? service.gallery : [service.imageUrl]).filter(
          (img): img is string => typeof img === 'string' && img.trim() !== ''
        ),
        description: service.detailedDescription || service.description,
        features: service.features,
        sections: service.specs?.length
          ? [{ label: 'Specifications', items: service.specs.map((spec) => `${spec.label}: ${spec.value}`) }]
          : undefined,
        priceLabel: service.startingPrice,
        turnaround: service.leadTime,
      }
    : null;

  return (
    <ServiceDetailsModal
      service={details}
      onClose={onClose}
      primaryAction={service ? { label: 'Book Now', onClick: () => onBookNow(service) } : undefined}
      actions={service ? [{ label: 'Request Quote', onClick: () => onRequestQuote(service) }] : []}
      whatsappInquiry={service ? { category: service.category, price: service.startingPrice, description: service.description } : undefined}
    />
  );
};
