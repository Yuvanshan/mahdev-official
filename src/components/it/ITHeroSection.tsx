import React from 'react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DivisionHero } from '../common/DivisionHero';

interface ITHeroSectionProps {
  onRequestQuote: () => void;
  onStartProject: () => void;
  onContactTeam: () => void;
  onExploreServices: () => void;
}

export const ITHeroSection: React.FC<ITHeroSectionProps> = ({
  onRequestQuote,
  onStartProject,
  onExploreServices,
}) => {
  const { divisions } = useFirestoreDataContext();

  const itDiv = divisions?.find(
    (d) =>
      d.id === 'it' ||
      d.id === 'it-solutions' ||
      d.id === 'div-it' ||
      d.id === 'div-it-solutions' ||
      (d as any).divisionKey === 'it' ||
      d.slug === 'it' ||
      d.slug === 'it-solutions'
  );

  const rawHeroVideo =
    (itDiv as any)?.heroVideoUrl ||
    (itDiv as any)?.videoUrl ||
    (itDiv?.hero as any)?.videoUrl ||
    ((itDiv?.hero as any)?.mediaType === 'video' ? (itDiv?.hero as any)?.mediaUrl : '') ||
    ((itDiv?.hero as any)?.mediaUrl?.startsWith?.('firestore://') ? (itDiv?.hero as any)?.mediaUrl : '') ||
    '';

  const rawHeroImage =
    (itDiv as any)?.defaultImageUrl ||
    (itDiv as any)?.heroImageUrl ||
    (itDiv as any)?.imageUrl ||
    (itDiv?.hero as any)?.defaultImageUrl ||
    (itDiv?.hero as any)?.imageUrl ||
    (itDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2000&q=85';

  const effectiveVideoUrl = (itDiv as any)?.heroMediaType === 'image' && !(itDiv as any)?.heroVideoUrl && !(itDiv as any)?.videoUrl ? '' : rawHeroVideo;

  const headline =
    (itDiv as any)?.heroHeadline ||
    (itDiv as any)?.hero?.title ||
    itDiv?.name ||
    'Enterprise Software, Cloud & AI Engineered for Uncompromising Scale';

  // Clean hero (headline + one button), matching the SWS and U1 pages.
  return (
    <DivisionHero
      videoUrl={effectiveVideoUrl}
      imageUrl={heroImage}
      mediaTitle={itDiv?.name || 'Mahdev IT Solutions'}
      headline={headline}
      buttonLabel="Explore Services"
      onButtonClick={onExploreServices}
    />
  );
};
