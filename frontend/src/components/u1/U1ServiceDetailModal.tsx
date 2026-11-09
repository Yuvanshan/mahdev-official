import React from 'react';
import { U1Service } from '../../data/u1Data';
import { ServiceDetailsModal } from '../services/ServiceDetailsModal';
import { getStartingPriceDetails, getStartingPriceInquiryText } from '../common/StartingPriceTag';
import { useOnlineBookingEnabled } from '../../hooks/useOnlineBookingEnabled';

interface U1ServiceDetailModalProps {
  service: U1Service | null;
  isOpen: boolean;
  onClose: () => void;
  /** Used when "Book online" is switched off in the admin. */
  onBookNow: (service: U1Service) => void;
}

/** U1 service details in the shared full-screen layout (images left, details right). */
export const U1ServiceDetailModal: React.FC<U1ServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookNow,
}) => {
  const onlineBookingEnabled = useOnlineBookingEnabled();
  const details = isOpen && service
    ? {
        title: service.name,
        subtitle: service.tagline,
        divisionName: 'U1 Cinema & Studio',
        images: (service.gallery?.length ? service.gallery : [service.imageUrl]).filter(
          (img): img is string => typeof img === 'string' && img.trim() !== ''
        ),
        description: service.detailedDescription || service.description,
        deliverables: service.deliverables,
        sections: service.gearUsed ? [{ label: 'Gear used', items: [service.gearUsed] }] : undefined,
        ...getStartingPriceDetails(service.price),
        turnaround: service.duration,
      }
    : null;

  return (
    <ServiceDetailsModal
      service={details}
      onClose={onClose}
      bookOnline={service ? { kind: 'service', id: service.id, price: service.price, divisionId: 'u1' } : undefined}
      primaryAction={service && !onlineBookingEnabled ? { label: 'Book Session', onClick: () => onBookNow(service) } : undefined}
      whatsappInquiry={service ? { category: service.category, price: getStartingPriceInquiryText(service.price), description: service.description } : undefined}
    />
  );
};
