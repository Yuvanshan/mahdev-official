import React from 'react';
import { SWSService } from '../../data/swsData';
import { ServiceDetailsModal } from '../services/ServiceDetailsModal';
import { getStartingPriceDetails, getStartingPriceInquiryText } from '../common/StartingPriceTag';
import { useOnlineBookingEnabled } from '../../hooks/useOnlineBookingEnabled';

interface SWSServiceDetailModalProps {
  service: SWSService | null;
  isOpen: boolean;
  onClose: () => void;
  /** Used when "Book online" is switched off in the admin. */
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
  const onlineBookingEnabled = useOnlineBookingEnabled();
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
        ...getStartingPriceDetails(service.price),
        turnaround: service.leadTime,
      }
    : null;

  return (
    <ServiceDetailsModal
      service={details}
      onClose={onClose}
      bookOnline={service ? { kind: 'service', id: service.id, price: service.price, divisionId: 'sws' } : undefined}
      primaryAction={service && !onlineBookingEnabled ? { label: 'Book Now', onClick: () => onBookNow(service) } : undefined}
      actions={service ? [{ label: 'Request Quote', onClick: () => onRequestQuote(service) }] : []}
      whatsappInquiry={service ? { category: service.category, price: getStartingPriceInquiryText(service.price), description: service.description } : undefined}
    />
  );
};
