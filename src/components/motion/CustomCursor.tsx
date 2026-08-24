import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'motion/react';
import { useDeviceMotion } from './MotionWrappers';

export const CustomCursor: React.FC = () => {
  const { reducedMotion, isTouch } = useDeviceMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  const cursorX = useSpring(0, { stiffness: 600, damping: 30 });
  const cursorY = useSpring(0, { stiffness: 600, damping: 30 });

  const ringX = useSpring(0, { stiffness: 280, damping: 24 });
  const ringY = useSpring(0, { stiffness: 280, damping: 24 });

  const rafRef = useRef<number | null>(null);
  const pointerCheckCooldown = useRef<number>(0);

  useEffect(() => {
    if (reducedMotion || isTouch) return;

    let hasShown = false;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY, target } = e;

      if (!hasShown) {
        hasShown = true;
        setIsVisible(true);
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        cursorX.set(clientX);
        cursorY.set(clientY);
        ringX.set(clientX);
        ringY.set(clientY);

        // Throttle pointer target inspection to every ~60ms
        const now = performance.now();
        if (now - pointerCheckCooldown.current > 60 && target instanceof HTMLElement) {
          pointerCheckCooldown.current = now;
          const isInteractive =
            target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.getAttribute('role') === 'button' ||
            target.classList.contains('cursor-pointer') ||
            Boolean(target.closest('button, a, [role="button"], .cursor-pointer'));
          setIsPointer(isInteractive);
        }
      });
    };

    const handleMouseLeave = () => {
      hasShown = false;
      setIsVisible(false);
    };
    const handleMouseEnter = () => {
      hasShown = true;
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [reducedMotion, isTouch, cursorX, cursorY, ringX, ringY]);

  if (reducedMotion || isTouch || !isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden transform-gpu">
      {/* Outer Magnetic Ring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isPointer ? 1.4 : 1,
          borderColor: isPointer ? '#0052FF' : 'rgba(0, 82, 255, 0.35)',
          backgroundColor: isPointer ? 'rgba(0, 82, 255, 0.08)' : 'transparent',
        }}
        transition={{ duration: 0.12 }}
        className="w-8 h-8 rounded-full border border-blue-500/40 will-change-transform pointer-events-none transform-gpu"
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
        transition={{ duration: 0.08 }}
        className="w-1.5 h-1.5 rounded-full bg-[#0052FF] shadow-xs will-change-transform pointer-events-none transform-gpu"
      />
    </div>
  );
};
