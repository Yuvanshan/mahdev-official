import React from 'react';
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

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={className}>
        {words.map((word, index) => (
          <React.Fragment key={`${word}-${index}`}>
            {index > 0 ? ' ' : null}
            <motion.span
              className="inline-block"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.32,
                delay: delay + index * 0.045,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
            </motion.span>
          </React.Fragment>
        ))}
      </span>
    </>
  );
};
