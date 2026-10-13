const IMAGE_URL_KEYS = [
  'url',
  'src',
  'downloadURL',
  'downloadUrl',
  'imageUrl',
  'imageUrls',
  'mediaUrl',
  'thumbnailUrl',
  'secure_url',
  'path',
] as const;

function collectImageSources(value: unknown, sources: string[], seen: Set<object>): void {
  if (typeof value === 'string') {
    const source = value.trim();
    if (source && !sources.includes(source)) sources.push(source);
    return;
  }

  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => collectImageSources(item, sources, seen));
    return;
  }

  const media = value as Record<string, unknown>;
  for (const key of IMAGE_URL_KEYS) {
    if (key in media) collectImageSources(media[key], sources, seen);
  }
}

export function getImageSourceCandidates(...values: unknown[]): string[] {
  const sources: string[] = [];
  const seen = new Set<object>();
  values.forEach((value) => collectImageSources(value, sources, seen));
  return sources;
}
