import React, { useEffect, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';

const MOBILE_IMAGE_ZOOM_SCALE = '1.4';
const MOBILE_IMAGE_MIN_SCALE = 1;
const MOBILE_IMAGE_MAX_SCALE = 4;

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
  const touchPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchGestureRef = useRef<{ distance: number; scale: number } | null>(null);

  useEffect(() => {
    setIsZoomed(false);
    frameRef.current?.style.setProperty('--image-mobile-scale', MOBILE_IMAGE_ZOOM_SCALE);
    frameRef.current?.style.setProperty('--image-zoom-x', '50%');
    frameRef.current?.style.setProperty('--image-zoom-y', '50%');
    frameRef.current?.style.setProperty('--image-pan-x', '0px');
    frameRef.current?.style.setProperty('--image-pan-y', '0px');
    frameRef.current?.style.setProperty('--image-mobile-scale', String(MOBILE_IMAGE_MIN_SCALE));
    const image = frameRef.current?.querySelector<HTMLImageElement>('img');
    if (image && lensRef.current) {
      const applySource = () => {
        lensRef.current?.style.setProperty('background-image', `url("${image.currentSrc || image.src}")`);
      };
      if (image.complete) applySource();
      else image.addEventListener('load', applySource, { once: true });
    }
  }, [imageKey]);

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

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      updateFocusPoint(event.currentTarget, event.clientX, event.clientY);
      return;
    }
    if (!touchPointersRef.current.has(event.pointerId)) return;
    touchPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pointers = Array.from(touchPointersRef.current.values());
    if (pointers.length < 2) return;

    const [first, second] = pointers;
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    if (!pinchGestureRef.current) {
      pinchGestureRef.current = { distance, scale: Number(MOBILE_IMAGE_ZOOM_SCALE) };
      setIsZoomed(true);
    }

    const ratio = distance / pinchGestureRef.current.distance;
    const scale = Math.max(MOBILE_IMAGE_MIN_SCALE, Math.min(MOBILE_IMAGE_MAX_SCALE, pinchGestureRef.current.scale * ratio));
    event.currentTarget.style.setProperty('--image-mobile-scale', scale.toFixed(3));

    const bounds = event.currentTarget.getBoundingClientRect();
    const centerX = (first.x + second.x) / 2;
    const centerY = (first.y + second.y) / 2;
    const x = Math.max(0, Math.min(100, ((centerX - bounds.left) / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, ((centerY - bounds.top) / bounds.height) * 100));
    event.currentTarget.style.setProperty('--image-zoom-x', `${x}%`);
    event.currentTarget.style.setProperty('--image-zoom-y', `${y}%`);
  };

  const onTouchPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    touchPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.style.setProperty('--image-pan-x', '0px');
    event.currentTarget.style.setProperty('--image-pan-y', '0px');
    event.currentTarget.setPointerCapture(event.pointerId);

    if (touchPointersRef.current.size === 2) {
      const pointers = Array.from(touchPointersRef.current.values());
      const distance = Math.hypot(pointers[1].x - pointers[0].x, pointers[1].y - pointers[0].y);
      pinchGestureRef.current = { distance, scale: Number(MOBILE_IMAGE_ZOOM_SCALE) };
      event.currentTarget.style.setProperty('--image-mobile-scale', MOBILE_IMAGE_ZOOM_SCALE);
      setIsZoomed(true);
    }
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    touchPointersRef.current.delete(event.pointerId);
    pinchGestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (touchPointersRef.current.size < 2) {
      setIsZoomed(false);
      frameRef.current?.style.setProperty('--image-zoom-x', '50%');
      frameRef.current?.style.setProperty('--image-zoom-y', '50%');
      frameRef.current?.style.setProperty('--image-pan-x', '0px');
      frameRef.current?.style.setProperty('--image-pan-y', '0px');
      frameRef.current?.style.setProperty('--image-mobile-scale', String(MOBILE_IMAGE_MIN_SCALE));
      touchPointersRef.current.clear();
    }
  };

  return (
    <div
      ref={frameRef}
      className={`image-zoom-frame ${isZoomed ? 'image-zoom-active' : ''} ${className}`}
      onPointerMove={onPointerMove}
      onPointerDown={onTouchPointerDown}
      onPointerUp={(event) => onPointerEnd(event)}
      onPointerCancel={(event) => onPointerEnd(event, true)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setIsZoomed(true);
      }}
      onPointerLeave={() => {
        if (touchPointersRef.current.size > 0) return;
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
          const frame = frameRef.current;
          const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
          if (isCoarsePointer) {
            event.preventDefault();
            return;
          }
          if (frame) {
            if (event.detail === 0) {
              frame.style.setProperty('--image-zoom-x', '50%');
              frame.style.setProperty('--image-zoom-y', '50%');
            }
          }
          setIsZoomed((current) => !current);
          if (frame) frame.style.setProperty('--image-mobile-scale', MOBILE_IMAGE_ZOOM_SCALE);
        }}
      />
      <span className="image-zoom-focus" aria-hidden="true">
        <Crosshair className="h-5 w-5" />
      </span>
      <span ref={lensRef} className="image-zoom-lens" aria-hidden="true" />
      <span className="image-zoom-hint" aria-hidden="true">
        {isZoomed ? 'Release to reset' : 'Hover or pinch to zoom'}
      </span>
    </div>
  );
};
