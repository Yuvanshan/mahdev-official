import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'motion/react';
import { useDeviceMotion } from './MotionWrappers';

interface ParallelSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  offset?: [string, string];
}

/**
 * ParallelSection creates a scroll-bound coordinate space for child parallel layers.
 */
export const ParallelSection: React.FC<ParallelSectionProps> = ({
  id,
  className = '',
  children,
  offset = ['start end', 'end start'],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: offset as any,
  });

  return (
    <div ref={containerRef} id={id} className={`relative ${className}`}>
      {typeof children === 'function' ? children(scrollYProgress) : children}
    </div>
  );
};

interface ParallelLayerProps {
  children: React.ReactNode;
  speed?: number; // negative = moves slower (feels deep/far), positive = moves faster (feels near/foreground)
  className?: string;
  progress?: MotionValue<number>;
  fade?: boolean;
  scale?: boolean;
}

/**
 * ParallelLayer animates vertically at a differential speed relative to scroll progress.
 */
export const ParallelLayer: React.FC<ParallelLayerProps> = ({
  children,
  speed = 0.1,
  className = '',
  progress,
  fade = false,
  scale = false,
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const { reducedMotion, isTouch } = useDeviceMotion();

  // If progress is not passed from a parent ParallelSection, create local scroll tracking
  const { scrollYProgress: localScroll } = useScroll({
    target: localRef,
    offset: ['start end', 'end start'],
  });

  const activeProgress = progress || localScroll;

  // Calculate distance in pixels based on speed multiplier
  const distance = speed * 120;
  const rawY = useTransform(activeProgress, [0, 1], [-distance, distance]);
  const smoothY = useSpring(rawY, { stiffness: 90, damping: 22, mass: 0.1 });

  const rawOpacity = useTransform(activeProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5]);
  const rawScale = useTransform(activeProgress, [0, 0.5, 1], [0.98, 1, 0.98]);

  if (reducedMotion || isTouch) {
    return <div className={className}>{children}</div>;
  }

  const motionStyle: any = {
    y: smoothY,
  };

  if (fade) {
    motionStyle.opacity = rawOpacity;
  }

  if (scale) {
    motionStyle.scale = rawScale;
  }

  return (
    <motion.div ref={!progress ? localRef : undefined} style={motionStyle} className={className}>
      {children}
    </motion.div>
  );
};

interface ParallelWatermarkProps {
  text: string;
  speed?: number;
  className?: string;
}

/**
 * Ultra-subtle architectural watermark index (e.g. "01 // GROUP OVERVIEW")
 * that drifts gracefully in the background plane during scroll.
 */
export const ParallelWatermark: React.FC<ParallelWatermarkProps> = ({
  text,
  speed = -0.15,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useDeviceMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [-40 * (speed / 0.1), 40 * (speed / 0.1)]);
  const smoothY = useSpring(rawY, { stiffness: 80, damping: 20 });

  if (reducedMotion) {
    return (
      <div className={`pointer-events-none select-none font-mono text-slate-200/50 dark:text-slate-800/40 text-[5rem] sm:text-[7rem] lg:text-[9rem] font-black tracking-tighter leading-none absolute -top-10 right-4 z-0 ${className}`}>
        {text}
      </div>
    );
  }

  return (
    <div ref={ref} className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0">
      <motion.div
        style={{ y: smoothY }}
        className={`font-mono text-slate-900/[0.03] text-[5rem] sm:text-[7.5rem] lg:text-[10rem] font-black tracking-tighter leading-none absolute -top-8 right-2 sm:right-8 whitespace-nowrap ${className}`}
      >
        {text}
      </motion.div>
    </div>
  );
};

/**
 * Top Document Scroll Progress Bar - crisp, minimal 2px indicator.
 */
export const DocumentScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 origin-left z-[100] pointer-events-none"
    />
  );
};
