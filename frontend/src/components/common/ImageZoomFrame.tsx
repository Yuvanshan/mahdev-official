import React, { useEffect, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';

const MOBILE_IMAGE_ZOOM_SCALE = '1.4';

interface ImageZoomFrameProps {
  children: React.ReactNode;
  className?: string;
  imageKey: string;
  label: string;
}

export const ImageZoomFrame: React.FC<ImageZoomFrameProps> = ({
  children,
  className = '',
  imageKey,
  label,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const touchGestureRef = useRef<{ y: number; active: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setIsZoomed(false);
    frameRef.current?.style.setProperty('--image-mobile-scale', MOBILE_IMAGE_ZOOM_SCALE);
    frameRef.current?.style.setProperty('--image-zoom-x', '50%');
    frameRef.current?.style.setProperty('--image-zoom-y', '50%');
    const image = frameRef.current?.querySelector<HTMLImageElement>('img');
    if (image && lensRef.current) {
      const applySource = () => {
        lensRef.current?.style.setProperty('background-image', `url("${image.currentSrc || image.src}")`);
      };
      if (image.complete) applySource();
      else image.addEventListener('load', applySource, { once: true });
    }
  }, [imageKey]);

  useEffect(() => () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
  }, []);

  const updateFocusPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && !isZoomed) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
    event.currentTarget.style.setProperty('--image-zoom-x', `${x}%`);
    event.currentTarget.style.setProperty('--image-zoom-y', `${y}%`);
    if (lensRef.current) {
      lensRef.current.style.setProperty('left', `${event.clientX - bounds.left}px`);
      lensRef.current.style.setProperty('top', `${event.clientY - bounds.top}px`);
      lensRef.current.style.setProperty('background-position', `${x}% ${y}%`);
    }
  };

  const onTouchPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    suppressClickRef.current = false;
    touchGestureRef.current = { y: event.clientY, active: false };
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      if (!touchGestureRef.current) return;
      touchGestureRef.current.active = true;
      suppressClickRef.current = true;
      setIsZoomed((current) => {
        const next = !current;
        if (!next) frameRef.current?.style.setProperty('--image-mobile-scale', MOBILE_IMAGE_ZOOM_SCALE);
        return next;
      });
    }, 260);
  };

  const onTouchPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const gesture = touchGestureRef.current;
    if (!gesture?.active) return;
  };

  const onTouchPointerEnd = () => {
    const wasGestureActive = touchGestureRef.current?.active === true;
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    touchGestureRef.current = null;
    if (wasGestureActive) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 350);
    }
  };

  return (
    <div
      ref={frameRef}
      className={`image-zoom-frame ${isZoomed ? 'image-zoom-active' : ''} ${className}`}
      onPointerMove={updateFocusPoint}
      onPointerDown={onTouchPointerDown}
      onPointerMoveCapture={onTouchPointerMove}
      onPointerUp={onTouchPointerEnd}
      onPointerCancel={onTouchPointerEnd}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setIsZoomed(true);
      }}
      onPointerLeave={() => {
        if (touchGestureRef.current) return;
        setIsZoomed(false);
        window.requestAnimationFrame(() => {
          frameRef.current?.style.setProperty('--image-zoom-x', '50%');
          frameRef.current?.style.setProperty('--image-zoom-y', '50%');
        });
      }}
    >
      {children}
      <button
        type="button"
        className="image-zoom-trigger"
        aria-label={isZoomed ? `Reset zoom: ${label}` : `Zoom image: ${label}`}
        aria-pressed={isZoomed}
        onClick={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault();
            suppressClickRef.current = false;
            return;
          }
          if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
            event.preventDefault();
            return;
          }
          setIsZoomed((current) => !current);
          frameRef.current?.style.setProperty('--image-mobile-scale', MOBILE_IMAGE_ZOOM_SCALE);
        }}
      />
      <span className="image-zoom-focus" aria-hidden="true">
        <Crosshair className="h-5 w-5" />
      </span>
      <span ref={lensRef} className="image-zoom-lens" aria-hidden="true" />
      <span className="image-zoom-hint" aria-hidden="true">
        {isZoomed ? 'Tap to reset' : 'Hover or tap to zoom'}
      </span>
    </div>
  );
};
