import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface AnimatedHeroTitleProps {
  text: string;
  className?: string;
  delay?: number;
}

export const AnimatedHeroTitle: React.FC<AnimatedHeroTitleProps> = ({
  text,
  className = '',
  delay = 0,
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
