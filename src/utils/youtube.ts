/**
 * YouTube URL Helper & Sanitizer
 * Guarantees well-formed YouTube embed URLs and prevents Google 400/401 "malformed request" errors.
 */

export function extractYouTubeId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Direct 11-character video ID match
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch, shorts, embed, youtu.be, and live formats
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  return null;
}

export interface YouTubeEmbedOptions {
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
  rel?: boolean;
}

export function getYouTubeEmbedUrl(url?: string | null, options: YouTubeEmbedOptions = {}): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const {
    autoplay = true,
    mute = true,
    loop = true,
    controls = false,
    rel = false,
  } = options;

  const params = new URLSearchParams();
  if (autoplay) params.set('autoplay', '1');
  if (mute) params.set('mute', '1');
  if (loop) {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }
  if (!controls) params.set('controls', '0');
  if (!rel) params.set('rel', '0');
  params.set('playsinline', '1');
  params.set('modestbranding', '1');

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
