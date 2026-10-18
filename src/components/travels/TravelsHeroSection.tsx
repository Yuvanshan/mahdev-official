import React from 'react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DivisionHero } from '../common/DivisionHero';

interface TravelsHeroSectionProps {
  onPlanTrip: () => void;
  onExplorePackages: () => void;
  onExploreDestinations: () => void;
}

export const TravelsHeroSection: React.FC<TravelsHeroSectionProps> = ({
  onPlanTrip,
  onExplorePackages,
}) => {
  const { divisions } = useFirestoreDataContext();

  const travelsDiv = divisions?.find(
    (d) =>
      d.id === 'travels' ||
      d.id === 'mahdev-travels' ||
      d.id === 'div-travels' ||
      d.id === 'div-mahdev-travels' ||
      (d as any).divisionKey === 'travels' ||
      d.slug === 'travels' ||
      d.slug === 'mahdev-travels'
  );

  const rawHeroVideo =
    (travelsDiv as any)?.heroVideoUrl ||
    (travelsDiv as any)?.videoUrl ||
    (travelsDiv?.hero as any)?.videoUrl ||
    ((travelsDiv?.hero as any)?.mediaType === 'video' ? (travelsDiv?.hero as any)?.mediaUrl : '') ||
    ((travelsDiv?.hero as any)?.mediaUrl?.startsWith?.('firestore://') ? (travelsDiv?.hero as any)?.mediaUrl : '') ||
    '';

  const rawHeroImage =
    (travelsDiv as any)?.defaultImageUrl ||
    (travelsDiv as any)?.heroImageUrl ||
    (travelsDiv as any)?.imageUrl ||
    (travelsDiv?.hero as any)?.defaultImageUrl ||
    (travelsDiv?.hero as any)?.imageUrl ||
    (travelsDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=2000&q=85';

  const effectiveVideoUrl = (travelsDiv as any)?.heroMediaType === 'image' && !(travelsDiv as any)?.heroVideoUrl && !(travelsDiv as any)?.videoUrl ? '' : rawHeroVideo;

  const headline =
    (travelsDiv as any)?.heroHeadline ||
    (travelsDiv as any)?.hero?.title ||
    travelsDiv?.name ||
    'Bespoke Expeditions Across Sri Lanka';

  // Clean hero (headline + one button), matching the SWS and U1 pages.
  return (
    <DivisionHero
      videoUrl={effectiveVideoUrl}
      imageUrl={heroImage}
      mediaTitle={travelsDiv?.name || 'Sigiriya Rock Fortress Sri Lanka'}
      headline={headline}
      buttonLabel="Explore Packages"
      onButtonClick={onExplorePackages}
    />
  );
};
