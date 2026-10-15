import React from 'react';
import { Facebook, Instagram, Linkedin, Pin, Youtube } from 'lucide-react';

type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'pinterest' | 'tiktok';

const TikTokIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.6 7.2a6.8 6.8 0 0 1-4.1-1.4v8.1a6.1 6.1 0 1 1-5.3-6.1v3.4a2.7 2.7 0 1 0 1.9 2.6V2.5h3.4c.2 2.1 1.8 3.8 4.1 4.1v.6Z" />
  </svg>
);

const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string; Icon: React.ElementType }[] = [
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
  { id: 'instagram', label: 'Instagram', Icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { id: 'youtube', label: 'YouTube', Icon: Youtube },
  { id: 'pinterest', label: 'Pinterest', Icon: Pin },
  { id: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
];

interface SocialLinksProps {
  socials?: Record<string, string>;
  variant?: 'dark' | 'light';
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ socials, variant = 'light' }) => {
  const links = SOCIAL_PLATFORMS.flatMap(({ id, label, Icon }) => {
    const href = socials?.[id]?.trim();
    if (!href) return [];

    try {
      const url = new URL(href);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return [];
      return [{ id, label, href: url.href, Icon }];
    } catch {
      return [];
    }
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
