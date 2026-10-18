import React from 'react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DivisionHero } from '../common/DivisionHero';

interface MartHeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  onSelectCategory: (categoryId: string) => void;
  onExploreAll: () => void;
}

export const MartHeroSection: React.FC<MartHeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onExploreAll,
}) => {
  const { divisions } = useFirestoreDataContext();

  const martDiv = divisions?.find(
    (d) =>
      d.id === 'mart' ||
      d.id === 'online-mart' ||
      d.id === 'mahdev-mart' ||
      d.id === 'div-mart' ||
      d.id === 'div-online-mart' ||
      (d as any).divisionKey === 'mart' ||
      d.slug === 'mart' ||
      d.slug === 'online-mart' ||
      d.slug === 'mahdev-mart'
  );

  const rawHeroVideo =
    (martDiv as any)?.heroVideoUrl ||
    (martDiv as any)?.videoUrl ||
    (martDiv?.hero as any)?.videoUrl ||
    ((martDiv?.hero as any)?.mediaType === 'video' ? (martDiv?.hero as any)?.mediaUrl : '') ||
    ((martDiv?.hero as any)?.mediaUrl?.startsWith?.('firestore://') ? (martDiv?.hero as any)?.mediaUrl : '') ||
    '';

  const rawHeroImage =
    (martDiv as any)?.defaultImageUrl ||
    (martDiv as any)?.heroImageUrl ||
    (martDiv as any)?.imageUrl ||
    (martDiv?.hero as any)?.defaultImageUrl ||
    (martDiv?.hero as any)?.imageUrl ||
    (martDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=2000&q=80';

  const effectiveVideoUrl = (martDiv as any)?.heroMediaType === 'image' && !(martDiv as any)?.heroVideoUrl && !(martDiv as any)?.videoUrl ? '' : rawHeroVideo;

  const headline =
    (martDiv as any)?.heroHeadline ||
    (martDiv as any)?.hero?.title ||
    martDiv?.name ||
    'Curated Event & Home Decor, Ambient Lighting & Smart Tech';

  // Clean hero (headline + one button), matching the SWS and U1 pages.
  return (
    <DivisionHero
      videoUrl={effectiveVideoUrl}
      imageUrl={heroImage}
      mediaTitle={martDiv?.name || 'Curated Event Decor & Smart Tech'}
      headline={headline}
      buttonLabel="Shop the Collection"
      onButtonClick={onExploreAll}
    />
  );
};
