import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, X } from 'lucide-react';

const DESKTOP_ZOOM_SCALE = 2.2;
const LIGHTBOX_ZOOM_SCALE = 2.2;
const MAX_PINCH_SCALE = 4;

interface ImageZoomFrameProps {
  children: React.ReactNode;
  className?: string;
  imageKey: string;
  label: string;
}

interface PointerPosition {
  x: number;
  y: number;
}

export const ImageZoomFrame: React.FC<ImageZoomFrameProps> = ({
  children,
  className = '',
  imageKey,
  label,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');
  const frameRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const lightboxImageRef = useRef<HTMLImageElement>(null);
  const pointersRef = useRef<Map<number, PointerPosition>>(new Map());
  const pinchStartRef = useRef<{
    distance: number;
    scale: number;
    centerX: number;
    centerY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const singlePointerRef = useRef<{ x: number; y: number } | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const suppressClickUntilRef = useRef(0);

  useEffect(() => {
    setIsZoomed(false);
    frameRef.current?.style.setProperty('--image-zoom-x', '50%');
    frameRef.current?.style.setProperty('--image-zoom-y', '50%');
    const image = frameRef.current?.querySelector<HTMLImageElement>('img:not([aria-hidden="true"])');
    if (image && lensRef.current) {
      const applySource = () => {
        lensRef.current?.style.setProperty('background-image', `url("${image.currentSrc || image.src}")`);
      };
      if (image.complete) applySource();
      else image.addEventListener('load', applySource, { once: true });
    }
  }, [imageKey]);

  useEffect(() => {
    if (!lightboxSrc) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxSrc('');
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      pointersRef.current.clear();
      pinchStartRef.current = null;
      singlePointerRef.current = null;
    };
  }, [lightboxSrc]);

  const updateFocusPoint = (element: HTMLDivElement, clientX: number, clientY: number) => {
    const bounds = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - bounds.top) / bounds.height) * 100));
    element.style.setProperty('--image-zoom-x', `${x}%`);
    element.style.setProperty('--image-zoom-y', `${y}%`);
    if (lensRef.current) {
      lensRef.current.style.setProperty('left', `${clientX - bounds.left}px`);
      lensRef.current.style.setProperty('top', `${clientY - bounds.top}px`);
      lensRef.current.style.setProperty('background-position', `${x}% ${y}%`);
    }
  };

  const getPanLimit = (scale: number) => {
    const image = lightboxImageRef.current;
    const ratio = image?.naturalWidth && image.naturalHeight
      ? image.naturalWidth / image.naturalHeight
      : window.innerWidth / window.innerHeight;
    const width = Math.min(window.innerWidth, window.innerHeight * ratio);
    const height = width / ratio;
    return {
      x: (width * (scale - 1)) / 2,
      y: (height * (scale - 1)) / 2,
    };
  };

  const applyLightboxTransform = (scale: number, x: number, y: number) => {
    const boundedScale = Math.max(1, Math.min(MAX_PINCH_SCALE, scale));
    const limit = getPanLimit(boundedScale);
    const boundedX = Math.max(-limit.x, Math.min(limit.x, x));
    const boundedY = Math.max(-limit.y, Math.min(limit.y, y));
    scaleRef.current = boundedScale;
    panRef.current = { x: boundedX, y: boundedY };
    if (lightboxImageRef.current) {
      lightboxImageRef.current.style.setProperty('--lightbox-pan-x', `${boundedX}px`);
      lightboxImageRef.current.style.setProperty('--lightbox-pan-y', `${boundedY}px`);
      lightboxImageRef.current.style.setProperty('--lightbox-scale', String(boundedScale));
    }
  };

  const openLightbox = () => {
    const image = frameRef.current?.querySelector<HTMLImageElement>('img:not([aria-hidden="true"])');
    const src = image?.currentSrc || image?.src;
    if (!src) return;
    scaleRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setLightboxSrc(src);
  };

  const onLightboxPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointersRef.current.size >= 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchStartRef.current = {
        distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
        scale: scaleRef.current,
        centerX: (first.x + second.x) / 2,
        centerY: (first.y + second.y) / 2,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
      singlePointerRef.current = null;
      suppressClickUntilRef.current = Date.now() + 250;
      return;
    }
    singlePointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const onLightboxPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = Array.from(pointersRef.current.values());
    if (pointers.length >= 2 && pinchStartRef.current) {
      const [first, second] = pointers;
      const centerX = (first.x + second.x) / 2;
      const centerY = (first.y + second.y) / 2;
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const scale = pinchStartRef.current.scale * (distance / pinchStartRef.current.distance);
      applyLightboxTransform(
        scale,
        pinchStartRef.current.panX + centerX - pinchStartRef.current.centerX,
        pinchStartRef.current.panY + centerY - pinchStartRef.current.centerY
      );
      suppressClickUntilRef.current = Date.now() + 250;
      return;
    }

    const previous = singlePointerRef.current;
    if (previous) {
      const deltaX = event.clientX - previous.x;
      const deltaY = event.clientY - previous.y;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
        suppressClickUntilRef.current = Date.now() + 250;
      }
      if (scaleRef.current > 1) {
        applyLightboxTransform(scaleRef.current, panRef.current.x + deltaX, panRef.current.y + deltaY);
      }
    }
    singlePointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const onLightboxPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    pinchStartRef.current = null;
    singlePointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const toggleLightboxZoom = (event: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() < suppressClickUntilRef.current) return;
    const nextScale = scaleRef.current > 1 ? 1 : LIGHTBOX_ZOOM_SCALE;
    if (nextScale === 1) {
      applyLightboxTransform(1, 0, 0);
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const targetX = event.clientX - bounds.left;
    const targetY = event.clientY - bounds.top;
    applyLightboxTransform(
      nextScale,
      (bounds.width / 2 - targetX) * (nextScale - 1),
      (bounds.height / 2 - targetY) * (nextScale - 1)
    );
  };

  return (
    <>
      <div
        ref={frameRef}
        className={`image-zoom-frame ${isZoomed ? 'image-zoom-active' : ''} ${className}`}
        onPointerMove={(event) => {
          if (event.pointerType === 'mouse') updateFocusPoint(event.currentTarget, event.clientX, event.clientY);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setIsZoomed(true);
        }}
        onPointerLeave={() => {
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
          aria-label={`Open enlarged image: ${label}`}
          onClick={(event) => {
            if (window.matchMedia('(hover: none), (pointer: coarse)').matches && event.detail > 0) {
              event.preventDefault();
              openLightbox();
              return;
            }
            if (event.detail === 0) {
              setIsZoomed((current) => !current);
              frameRef.current?.style.setProperty('--image-zoom-x', '50%');
              frameRef.current?.style.setProperty('--image-zoom-y', '50%');
            }
          }}
        />
        <span className="image-zoom-focus" aria-hidden="true">
          <Crosshair className="h-5 w-5" />
        </span>
        <span ref={lensRef} className="image-zoom-lens" aria-hidden="true" />
        <span className="image-zoom-hint" aria-hidden="true">
          {isZoomed ? 'Move to inspect' : 'Tap to enlarge'}
        </span>
      </div>
      {lightboxSrc && createPortal(
        <div
          className="fixed inset-0 z-[260] flex items-center justify-center overflow-hidden bg-slate-950/95"
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged image: ${label}`}
          onClick={() => setLightboxSrc('')}
        >
          <button
            type="button"
            className="fixed right-4 top-4 z-[262] grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
            aria-label="Close enlarged image"
            onClick={() => setLightboxSrc('')}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="image-lightbox-stage flex h-full w-full touch-none items-center justify-center overflow-hidden"
            onClick={(event) => {
              event.stopPropagation();
              toggleLightboxZoom(event);
            }}
            onPointerDown={onLightboxPointerDown}
            onPointerMove={onLightboxPointerMove}
            onPointerUp={onLightboxPointerEnd}
            onPointerCancel={onLightboxPointerEnd}
          >
            <img
              ref={lightboxImageRef}
              src={lightboxSrc}
              alt={label}
              draggable={false}
              loading="eager"
              decoding="async"
              className="max-h-[100dvh] max-w-full select-none object-contain will-change-transform"
              style={{ transform: 'translate3d(var(--lightbox-pan-x, 0px), var(--lightbox-pan-y, 0px), 0) scale(var(--lightbox-scale, 1))' }}
            />
          </div>
          <p className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[262] -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white/90">
            Tap to zoom · Drag to move · Pinch to zoom
          </p>
        </div>,
        document.body
      )}
    </>
  );
};
