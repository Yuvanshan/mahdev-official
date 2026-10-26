import React, { useEffect, useState } from 'react';
import { hasRealName } from '../../utils/profileCompletion';

interface AvatarProps {
  name: string;
  email: string;
  src?: string;
  /** Size, shape and ring classes, e.g. "h-8 w-8 rounded-lg". */
  className?: string;
  /** Classes for the initials text. */
  textClassName?: string;
}

/** Up to two initials from the name (or the email when no real name is set). */
export function initialsFor(name: string, email: string): string {
  return (hasRealName({ fullName: name, email }) ? name : email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Profile photo that never shows a shimmer: the initials appear at once and the photo
 * fades in over them when it has loaded (the browser caches it, so repeat visits are
 * instant). If the photo cannot load, the initials stay.
 */
export const Avatar: React.FC<AvatarProps> = ({ name, email, src, className = 'h-8 w-8 rounded-lg', textClassName = 'text-xs' }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[#0052FF] to-indigo-600 font-bold text-white ${className}`}>
      <span className={textClassName} aria-hidden={Boolean(src && loaded && !failed)}>
        {initialsFor(name, email)}
      </span>
      {src && !failed && (
        <img
          src={src}
          alt=""
          // Google profile photos are refused when a referrer is sent.
          referrerPolicy="no-referrer"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  );
};
