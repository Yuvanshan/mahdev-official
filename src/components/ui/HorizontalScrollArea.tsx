import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  contentClassName: string;
  controlsClassName?: string;
  ariaLabel: string;
  hideControlsAt?: 'sm' | 'md' | 'never';
}

export const HorizontalScrollArea: React.FC<HorizontalScrollAreaProps> = ({
  children,
  className = '',
  contentClassName,
  controlsClassName = '',
  ariaLabel,
  hideControlsAt = 'never',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateIndicators = () => {
      const maxScroll = content.scrollWidth - content.clientWidth;
      setCanScrollLeft(maxScroll > 1 && content.scrollLeft > 1);
      setCanScrollRight(maxScroll > 1 && content.scrollLeft < maxScroll - 1);
    };

    updateIndicators();
    content.addEventListener('scroll', updateIndicators, { passive: true });
    const resizeObserver = new ResizeObserver(updateIndicators);
    resizeObserver.observe(content);
    Array.from(content.children).forEach((child) => resizeObserver.observe(child));
    window.addEventListener('resize', updateIndicators);

    return () => {
      content.removeEventListener('scroll', updateIndicators);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateIndicators);
    };
  }, [children]);

  const controlsVisibility = hideControlsAt === 'sm'
    ? ' sm:hidden'
    : hideControlsAt === 'md'
      ? ' md:hidden'
      : '';
  const scroll = (direction: -1 | 1) => {
    const content = contentRef.current;
    if (content) content.scrollBy({ left: direction * content.clientWidth * 0.78, behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          aria-label={`Scroll ${ariaLabel} left`}
          onClick={() => scroll(-1)}
          className={`horizontal-scroll-indicator left-0 ${controlsVisibility} ${controlsClassName}`}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
      <div ref={contentRef} aria-label={ariaLabel} className={contentClassName}>
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          aria-label={`Scroll ${ariaLabel} right`}
          onClick={() => scroll(1)}
          className={`horizontal-scroll-indicator right-0 ${controlsVisibility} ${controlsClassName}`}
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
