import { FirestoreDivision } from '../types/firestore';

export interface DivisionCardItem {
  id: string;
  name: string;
  route: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isComingSoon: boolean;
  order: number;
}

const CANONICAL_IDS: Record<string, string> = {
  'sws-event-management': 'sws',
  'sws-events': 'sws',
  'u1-studio': 'u1',
  'u1-cinema': 'u1',
  'it-solutions': 'it',
  'mahdev-it': 'it',
  'mahdev-travels': 'travels',
  'online-mart': 'mart',
  'mahdev-mart': 'mart',
};

function shortDescription(value: string): string {
  const sentence = value.split(/(?<=[.!?])\s/)[0] || value;
  return sentence.length > 112 ? `${sentence.slice(0, 109).trimEnd()}…` : sentence;
}

export function getDivisionCardItems(divisions: FirestoreDivision[]): DivisionCardItem[] {
  const unique = new Map<string, DivisionCardItem>();

  divisions
    .filter((division) => division.status !== 'inactive' && division.isPublished !== false)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .forEach((division) => {
      const rawId = division.divisionKey || division.id || division.slug;
      const id = CANONICAL_IDS[rawId] || CANONICAL_IDS[division.slug || ''] || rawId;
      if (!id || unique.has(id)) return;

      const hero = division.hero;
      const posterUrl =
        division.defaultImageUrl ||
        division.fallbackImageUrl ||
        hero?.defaultImageUrl ||
        hero?.fallbackImageUrl ||
        '';
      const configuredMediaType = division.heroMediaType || hero?.mediaType;
      const configuredVideo =
        division.heroVideoUrl || division.videoUrl || hero?.videoUrl || '';
      const looksLikeVideoBlob =
        !posterUrl && configuredVideo.startsWith('firestore://media_blobs/vid_');
      const mediaType: DivisionCardItem['mediaType'] =
        configuredMediaType === 'video' || looksLikeVideoBlob ? 'video' : 'image';
      const mediaUrl = mediaType === 'video'
        ? configuredVideo
        : posterUrl ||
          division.imageUrl ||
          division.heroImageUrl ||
          hero?.imageUrl ||
          hero?.bgImage ||
          '';

      unique.set(id, {
        id,
        name: division.name,
        route: division.route || `/${division.slug || id}`,
        description: shortDescription(
          division.description || division.shortDescription || hero?.subtitle || ''
        ),
        mediaUrl,
        mediaType,
        isComingSoon: Boolean(
          division.isComingSoon ||
          division.comingSoon ||
          division.status === 'coming_soon'
        ),
        order: division.order ?? Number.MAX_SAFE_INTEGER,
      });
    });

  return Array.from(unique.values()).sort((a, b) => a.order - b.order);
}
