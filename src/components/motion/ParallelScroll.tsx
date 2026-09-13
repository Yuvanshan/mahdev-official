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
export const ParallelLayer: React.FC<ParallelLayerProps> = (props) => {
  const { reducedMotion, isTouch } = useDeviceMotion();
  if (reducedMotion || isTouch) {
    return <div className={props.className}>{props.children}</div>;
  }
  if (props.progress) {
    return <ParallelLayerWithProgress {...props} progress={props.progress} />;
  }
  return <ParallelLayerWithLocalScroll {...props} />;
};

const ParallelLayerWithProgress: React.FC<ParallelLayerProps & { progress: MotionValue<number> }> = ({
  children,
  speed = 0.1,
  className = '',
  progress,
  fade = false,
  scale = false,
}) => {
  const distance = speed * 120;
  const rawY = useTransform(progress, [0, 1], [-distance, distance]);
  const smoothY = useSpring(rawY, { stiffness: 90, damping: 22, mass: 0.1 });
  const rawOpacity = useTransform(progress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5]);
  const rawScale = useTransform(progress, [0, 0.5, 1], [0.98, 1, 0.98]);

  const motionStyle: any = { y: smoothY };
  if (fade) motionStyle.opacity = rawOpacity;
  if (scale) motionStyle.scale = rawScale;

  return (
    <motion.div style={motionStyle} className={className}>
      {children}
    </motion.div>
  );
};

const ParallelLayerWithLocalScroll: React.FC<ParallelLayerProps> = ({
  children,
  speed = 0.1,
  className = '',
  fade = false,
  scale = false,
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: localScroll } = useScroll({
    target: localRef,
    offset: ['start end', 'end start'],
  });

  const distance = speed * 120;
  const rawY = useTransform(localScroll, [0, 1], [-distance, distance]);
  const smoothY = useSpring(rawY, { stiffness: 90, damping: 22, mass: 0.1 });
  const rawOpacity = useTransform(localScroll, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5]);
  const rawScale = useTransform(localScroll, [0, 0.5, 1], [0.98, 1, 0.98]);

  const motionStyle: any = { y: smoothY };
  if (fade) motionStyle.opacity = rawOpacity;
  if (scale) motionStyle.scale = rawScale;

  return (
    <motion.div ref={localRef} style={motionStyle} className={className}>
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
 * Architectural Parallel Watermark: Kept empty by default to prevent synthetic "AI website" numbered watermarks
 */
export const ParallelWatermark: React.FC<ParallelWatermarkProps> = () => {
  return null;
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
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#00D2FF] origin-left z-[100] pointer-events-none shadow-sm shadow-[#0052FF]/50"
    />
  );
};
