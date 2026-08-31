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

  if (reducedMotion) {
    return (
      <div className={`overflow-hidden rounded-2xl ${aspectRatio} ${className}`}>
        <img src={src} alt={alt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
        src={src}
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
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion, isTouch } = useDeviceMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  const smoothY = useSpring(y, { stiffness: 80, damping: 20 });

  if (reducedMotion || isTouch) {
    return <div className={`overflow-hidden w-full max-w-full ${className}`}>{children}</div>;
  }

  return (
    <div ref={ref} className={`overflow-hidden w-full max-w-full ${className}`}>
      <motion.div style={{ y: smoothY }}>{children}</motion.div>
    </div>
  );
};

// 5. 3D Perspective Tilt Card with Specular Glare
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
  maxTilt = 8,
  glareEffect = true,
  onClick,
  id,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const { reducedMotion, isTouch } = useDeviceMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 140, damping: 18 });
  const mouseYSpring = useSpring(y, { stiffness: 140, damping: 18 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const [isHovered, setIsHovered] = useState(false);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseEnter = () => {
    if (!ref.current || isTouch || reducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    rectRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width || 1,
      height: rect.height || 1,
    };
    setIsHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || isTouch || reducedMotion) return;
    let rect = rectRef.current;
    if (!rect) {
      const domRect = ref.current.getBoundingClientRect();
      rect = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width || 1,
        height: domRect.height || 1,
      };
      rectRef.current = rect;
    }

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;

    x.set(xPct);
    y.set(yPct);

    if (glareEffect) {
      setGlarePosition({
        x: (mouseX / rect.width) * 100,
        y: (mouseY / rect.height) * 100,
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rectRef.current = null;
    x.set(0);
    y.set(0);
  };

  if (reducedMotion || isTouch) {
    return (
      <div id={id} onClick={onClick} className={`w-full max-w-full min-w-0 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative transform-gpu will-change-transform w-full max-w-full min-w-0 ${className}`}
    >
      <div style={{ transform: 'translateZ(10px)' }} className="w-full h-full min-w-0">
        {children}
      </div>

      {glareEffect && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-30 transform-gpu"
          style={{
            background: `radial-gradient(circle 240px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.18), transparent 70%)`,
          }}
        />
      )}
    </motion.div>
  );
};

// 6. Magnetic Element Wrapper (Buttons & Icons)
export const Magnetic: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
}> = ({ children, strength = 0.25, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const { reducedMotion, isTouch } = useDeviceMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 180, damping: 18, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseEnter = () => {
    if (!ref.current || isTouch || reducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    rectRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width || 1,
      height: rect.height || 1,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || isTouch || reducedMotion) return;
    let rect = rectRef.current;
    if (!rect) {
      const domRect = ref.current.getBoundingClientRect();
      rect = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width || 1,
        height: domRect.height || 1,
      };
      rectRef.current = rect;
    }

    const middleX = e.clientX - (rect.left + rect.width / 2);
    const middleY = e.clientY - (rect.top + rect.height / 2);
    x.set(middleX * strength);
    y.set(middleY * strength);
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    x.set(0);
    y.set(0);
  };

  if (reducedMotion || isTouch) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`inline-block will-change-transform transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
};

// 7. Lightweight 3D Floating Mesh / Geometrics
export const Floating3DObject: React.FC<{
  size?: number;
  color?: string;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({
  size = 60,
  color = '#0052FF',
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
      initial={{ y: 0, rotate: 0 }}
      animate={{
        y: [-10, 10, -10],
        rotate: [0, 8, -8, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
        delay,
      }}
      style={{ width: size, height: size }}
      className={`pointer-events-none absolute rounded-3xl backdrop-blur-md bg-gradient-to-br from-blue-500/15 to-indigo-500/5 border border-blue-400/20 shadow-lg shadow-blue-500/5 ${className}`}
    />
  );
};
