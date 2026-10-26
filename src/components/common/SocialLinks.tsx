import React from 'react';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { SOCIAL_PROFILES } from '../../config/company';

type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp';

const TikTokIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.12 2.7 1.61 4.23 1.72v4.02c-1.43-.05-2.86-.35-4.18-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.07-1.08-2.01-1.27-3.39-3.61-3.43-6.01-.05-1.5.34-3 1.14-4.28 1.25-2.05 3.55-3.4 5.95-3.44.27-.01.54-.02.81.03.02 1.48-.04 2.97-.03 4.45-.67-.22-1.37-.2-2.04-.13-.7.07-1.38.36-1.93.79-1.48 1.13-2.16 3.33-1.61 5.1.37 1.24 1.38 2.27 2.62 2.63 1.21.36 2.59.04 3.51-.82.61-.55 1.02-1.34 1.14-2.15.06-1.02.04-2.05.04-3.08.01-5.18-.01-10.36.02-15.54z" />
  </svg>
);

const WhatsAppIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20.52 3.48A11.87 11.87 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.91c0 2.1.55 4.15 1.6 5.96L.07 24l6.29-1.65a11.9 11.9 0 0 0 5.7 1.45h.01c6.57 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.46-8.41ZM12.07 21.78h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.88 9.88 0 0 1-1.51-5.24c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.12 1.03 6.99 2.9a9.84 9.84 0 0 1 2.89 7c0 5.45-4.44 9.87-9.89 9.87Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
  </svg>
);

const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string; Icon: React.ElementType }[] = [
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
  { id: 'instagram', label: 'Instagram', Icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { id: 'youtube', label: 'YouTube', Icon: Youtube },
  { id: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon },
];

interface SocialLinksProps {
  socials?: Record<string, string>;
  variant?: 'dark' | 'light';
}

// Official profile per platform, used when the admin-entered address is unusable.
const OFFICIAL_PROFILE: Partial<Record<SocialPlatform, string>> = Object.fromEntries(
  SOCIAL_PROFILES.map(({ label, url }) => [label.toLowerCase(), url])
);

/**
 * The admin-entered address, or the official profile when it cannot point at a
 * profile: it contains spaces (e.g. "instagram.com/sws_event management") or is a
 * temporary Facebook share link.
 */
function profileHref(id: SocialPlatform, entered?: string): string | null {
  const href = entered?.trim();
  const usable = href && !/\s/.test(href) && !(id === 'facebook' && /facebook\.com\/share\//i.test(href));
  const candidate = usable ? href : OFFICIAL_PROFILE[id];
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ socials, variant = 'light' }) => {
  const links = SOCIAL_PLATFORMS.flatMap(({ id, label, Icon }) => {
    // Platforms the admin left empty stay hidden; only faulty entries fall back.
    if (!socials?.[id]?.trim()) return [];
    const href = profileHref(id, socials[id]);
    return href ? [{ id, label, href, Icon }] : [];
  });

  if (links.length === 0) return null;

  const linkStyle = variant === 'dark'
    ? 'border-blue-800 bg-blue-950/70 text-blue-100 hover:border-blue-400 hover:bg-blue-900'
    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700';

  return (
    <nav aria-label="Social media" className="flex flex-wrap items-center gap-3">
      {links.map(({ id, label, href, Icon }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit Mahdev on ${label} (opens in a new tab)`}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${linkStyle}`}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </a>
      ))}
    </nav>
  );
};
