import { useEffect, useRef, useState } from 'react';

export function useAutoSlideImage(imageCount: number, intervalMs = 4000) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [imageCount]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || imageCount < 2) return;

    if (typeof IntersectionObserver === 'undefined') {
      isVisibleRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      isVisibleRef.current = false;
    };
  }, [imageCount]);

  useEffect(() => {
    if (
      imageCount < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      if (isVisibleRef.current && document.visibilityState === 'visible') {
        setActiveIndex((index) => (index + 1) % imageCount);
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [imageCount, intervalMs]);

  return { activeIndex: imageCount ? activeIndex % imageCount : 0, setActiveIndex, containerRef };
}
