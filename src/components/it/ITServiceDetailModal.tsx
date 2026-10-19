import React from 'react';
import { ITService } from '../../data/itData';
import { ServiceDetailsModal } from '../services/ServiceDetailsModal';

interface ITServiceDetailModalProps {
  service: ITService | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: (service: ITService) => void;
  onStartProject: (service: ITService) => void;
  onContactTeam: (service: ITService) => void;
}

/** IT service details in the shared full-screen layout (images left, details right). */
export const ITServiceDetailModal: React.FC<ITServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onRequestQuote,
  onStartProject,
  onContactTeam,
}) => {
  const details = isOpen && service
    ? {
        title: service.name,
        subtitle: service.tagline,
        divisionName: 'Mahdev IT Solutions',
        images: service.images || [],
        description: service.fullDescription || service.shortDescription,
        features: service.features,
        sections: [
          { label: 'Problems we solve', items: service.problemsSolved || [] },
          { label: 'How we deliver', items: (service.process || []).map((step) => `${step.step} · ${step.title} — ${step.desc}`) },
          { label: 'Technologies', items: (service.technologies || []).map((tech) => `${tech.name} (${tech.category})`) },
          ...(service.caseStudy
            ? [{
                label: `Case study: ${service.caseStudy.title}`,
                items: [service.caseStudy.impact, service.caseStudy.techSummary].filter(Boolean),
              }]
            : []),
          ...(service.recommendedFor ? [{ label: 'Recommended for', items: [service.recommendedFor] }] : []),
        ],
        turnaround: service.startingTimeline ? `Timeline: ${service.startingTimeline}` : undefined,
      }
    : null;

  return (
    <ServiceDetailsModal
      service={details}
      onClose={onClose}
      primaryAction={service ? { label: 'Request a Quote', onClick: () => onRequestQuote(service) } : undefined}
      actions={service ? [
        { label: 'Start a Project', onClick: () => onStartProject(service) },
        { label: 'Contact the Team', onClick: () => onContactTeam(service) },
      ] : []}
      whatsappInquiry={service ? {
        category: service.badge || 'IT Engineering',
        price: service.startingTimeline ? `Timeline: ${service.startingTimeline}` : undefined,
        description: service.shortDescription || service.fullDescription,
      } : undefined}
    />
  );
};
