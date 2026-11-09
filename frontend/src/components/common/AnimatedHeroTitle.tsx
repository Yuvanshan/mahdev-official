import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface AnimatedHeroTitleProps {
  text: string;
  className?: string;
  delay?: number;
  /**
   * Hex colour stops applied across the text, character by character.
   * Use this instead of `bg-clip-text text-transparent` on a parent: each character
   * is an animated inline-block, which does not inherit a clipped parent background
   * and would otherwise render fully transparent.
   */
  gradient?: string[];
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const parsed = Number.parseInt(full, 16);
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

// Colour at position t (0..1) along evenly spaced gradient stops.
function colourAt(stops: string[], t: number): string {
  if (stops.length === 1) return stops[0];
  const scaled = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
  const index = Math.min(Math.floor(scaled), stops.length - 2);
  const local = scaled - index;
  const from = hexToRgb(stops[index]);
  const to = hexToRgb(stops[index + 1]);
  const mixed = from.map((channel, i) => Math.round(channel + (to[i] - channel) * local));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

export const AnimatedHeroTitle: React.FC<AnimatedHeroTitleProps> = ({
  text,
  className = '',
  delay = 0,
  gradient,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const words = text.trim().split(/\s+/);
  const characterCount = words.reduce((count, word) => count + Array.from(word).length, 0);
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCharacters(characterCount);
      return;
    }

    setVisibleCharacters(0);
    let timer = 0;
    let currentCharacter = 0;
    const typeNextCharacter = () => {
      if (currentCharacter < characterCount) {
        currentCharacter += 1;
        setVisibleCharacters(currentCharacter);
        timer = window.setTimeout(typeNextCharacter, 34);
        return;
      }

      timer = window.setTimeout(() => {
        setVisibleCharacters(0);
        currentCharacter = 0;
        timer = window.setTimeout(typeNextCharacter, 420);
      }, 1700);
    };

    timer = window.setTimeout(typeNextCharacter, Math.max(delay * 1000, 0));
    return () => window.clearTimeout(timer);
  }, [characterCount, delay, prefersReducedMotion, text]);

  let characterOffset = 0;

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={className}>
        {words.map((word, index) => {
          const wordOffset = characterOffset;
          characterOffset += Array.from(word).length;

          return (
            <React.Fragment key={`${word}-${index}`}>
              {index > 0 ? ' ' : null}
              <span className="inline-block whitespace-nowrap">
                {Array.from(word, (character, characterIndex) => (
                  <motion.span
                    key={`${character}-${characterIndex}`}
                    className="inline-block"
                    style={
                      gradient && gradient.length > 0
                        ? { color: colourAt(gradient, characterCount > 1 ? (wordOffset + characterIndex) / (characterCount - 1) : 0) }
                        : undefined
                    }
                    initial={false}
                    animate={{
                      opacity: prefersReducedMotion || wordOffset + characterIndex < visibleCharacters ? 1 : 0,
                      y: prefersReducedMotion || wordOffset + characterIndex < visibleCharacters ? 0 : 8,
                      filter: prefersReducedMotion || wordOffset + characterIndex < visibleCharacters ? 'blur(0px)' : 'blur(4px)',
                    }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {character}
                  </motion.span>
                ))}
              </span>
            </React.Fragment>
          );
        })}
      </span>
    </>
  );
};
