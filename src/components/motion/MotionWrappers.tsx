import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  HTMLMotionProps,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from 'motion/react';

// Hook to detect prefers-reduced-motion and touch device
export const useDeviceMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          window.innerWidth < 768
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkTouch);
    };
  }, []);

  return { reducedMotion, isTouch };
};

interface BaseMotionProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<BaseMotionProps> = ({
  children,
  delay = 0,
  duration = 0.4,
  className = '',
  ...props
}) => {
  const { reducedMotion } = useDeviceMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface SlideInProps extends BaseMotionProps {
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  distance = 20,
  delay = 0,
  duration = 0.45,
  className = '',
  ...props
}) => {
  const { reducedMotion } = useDeviceMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitialOffset = () => {
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialOffset() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn: React.FC<BaseMotionProps> = ({
  children,
  delay = 0,
  duration = 0.35,
  className = '',
  ...props
}) => {
  const { reducedMotion } = useDeviceMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ScrollReveal: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  distance = 20,
  delay = 0,
  duration = 0.45,
  className = '',
  ...props
}) => {
  const { reducedMotion } = useDeviceMotion();

  if (reducedMotion) {
    return <div className={`w-full max-w-full min-w-0 ${className}`}>{children}</div>;
  }

  const getInitialOffset = () => {
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialOffset() }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-full min-w-0 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// 1. Cinematic Blur-to-Sharp Reveal
export const BlurReveal: React.FC<BaseMotionProps & { blurAmount?: string }> = ({
  children,
  blurAmount = '12px',
  delay = 0,
  duration = 0.6,
  className = '',
  ...props
}) => {
  const { reducedMotion } = useDeviceMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, filter: `blur(${blurAmount})`, y: 16 }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// 2. Cinematic Staggered Text Reveal
export const TextReveal: React.FC<{
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}> = ({ text, className = '', wordClassName = '', delay = 0, as = 'p' }) => {
  const { reducedMotion } = useDeviceMotion();
  const words = text.split(' ');

  if (reducedMotion) {
    const Component = as;
    return <Component className={`max-w-full break-words ${className}`}>{text}</Component>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      },
    },
  };

  const wordVariants: any = {
    hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const Component = motion[as] as any;

  return (
    <Component
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
      className={`inline-flex flex-wrap max-w-full break-words gap-x-[0.3em] ${className}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          className={`inline-block break-words ${wordClassName}`}
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
};

// 3. Cinematic Image Reveal with Scale & Smooth Curtain
export const ImageReveal: React.FC<{
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  delay?: number;
}> = ({ src, alt, className = '', aspectRatio = 'aspect-video', delay = 0 }) => {
  const { reducedMotion } = useDeviceMotion();
  const validSrc = src && typeof src === 'string' && src.trim() !== '' ? src.trim() : null;

  if (!validSrc) {
    return (
      <div className={`overflow-hidden rounded-2xl bg-slate-900 ${aspectRatio} ${className} flex items-center justify-center text-slate-500 text-xs`}>
        {alt || 'Mahdev'}
      </div>
    );
  }

  if (reducedMotion) {
    return (
      <div className={`overflow-hidden rounded-2xl ${aspectRatio} ${className}`}>
        <img src={validSrc} alt={alt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-2xl ${aspectRatio} ${className} group`}
    >
      <motion.img
        src={validSrc}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-60 pointer-events-none" />
    </motion.div>
  );
};

// 4. Parallax Scroll Wrapper
export const ParallaxContainer: React.FC<{
  children: React.ReactNode;
  offset?: number;
  className?: string;
}> = ({ children, offset = 30, className = '' }) => {
  const { reducedMotion, isTouch } = useDeviceMotion();

  if (reducedMotion || isTouch) {
    return <div className={`overflow-hidden w-full max-w-full ${className}`}>{children}</div>;
  }

  return (
    <ActiveParallaxContainer offset={offset} className={className}>
      {children}
    </ActiveParallaxContainer>
  );
};

const ActiveParallaxContainer: React.FC<{
  children: React.ReactNode;
  offset?: number;
  className?: string;
}> = ({ children, offset = 30, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  const smoothY = useSpring(y, { stiffness: 80, damping: 20 });

  return (
    <div ref={ref} className={`overflow-hidden w-full max-w-full ${className}`}>
      <motion.div style={{ y: smoothY }}>{children}</motion.div>
    </div>
  );
};

// 5. Professional Enterprise Card Container (Precision subtle elevation, no 3D distortion)
export const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareEffect?: boolean;
  onClick?: () => void;
  id?: string;
}> = ({
  children,
  className = '',
  onClick,
  id,
}) => {
  const { reducedMotion } = useDeviceMotion();

  if (reducedMotion) {
    return (
      <div id={id} onClick={onClick} className={`w-full max-w-full min-w-0 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-full min-w-0 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// 6. Responsive Interaction Wrapper (Stable, ergonomic button touch/hover response)
export const Magnetic: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`inline-block ${className}`}>
      {children}
    </div>
  );
};

// 7. Subtle Architectural Decorative Accent
export const Floating3DObject: React.FC<{
  size?: number;
  color?: string;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({
  size = 60,
  delay = 0,
  duration = 6,
  className = '',
}) => {
  const { reducedMotion } = useDeviceMotion();

  if (reducedMotion) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{
        y: [-6, 6, -6],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
        delay,
      }}
      style={{ width: size, height: size }}
      className={`pointer-events-none absolute rounded-2xl bg-slate-100/60 border border-slate-200/50 ${className}`}
    />
  );
};
