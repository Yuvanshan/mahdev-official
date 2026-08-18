import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'motion/react';
import { useDeviceMotion } from './MotionWrappers';

export const CustomCursor: React.FC = () => {
  const { reducedMotion, isTouch } = useDeviceMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  const cursorX = useSpring(0, { stiffness: 500, damping: 28 });
  const cursorY = useSpring(0, { stiffness: 500, damping: 28 });

  const ringX = useSpring(0, { stiffness: 220, damping: 20 });
  const ringY = useSpring(0, { stiffness: 220, damping: 20 });

  useEffect(() => {
    if (reducedMotion || isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);

      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('cursor-pointer')
      ) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [reducedMotion, isTouch, isVisible, cursorX, cursorY, ringX, ringY]);

  if (reducedMotion || isTouch || !isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Outer Magnetic Ring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isPointer ? 1.5 : 1,
          borderColor: isPointer ? '#0052FF' : 'rgba(0, 82, 255, 0.4)',
          backgroundColor: isPointer ? 'rgba(0, 82, 255, 0.08)' : 'transparent',
        }}
        transition={{ duration: 0.15 }}
        className="w-8 h-8 rounded-full border border-blue-500/40 will-change-transform"
      />

      {/* Inner Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isPointer ? 0.5 : 1,
        }}
        transition={{ duration: 0.1 }}
        className="w-1.5 h-1.5 rounded-full bg-[#0052FF] shadow-xs will-change-transform"
      />
    </div>
  );
};
