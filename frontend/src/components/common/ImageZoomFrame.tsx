import React, { useEffect, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';

const MOBILE_IMAGE_ZOOM_SCALE = '1.4';
const TOUCH_MOVE_THRESHOLD = 8;

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
  const touchGestureRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);

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
    if (!isZoomed) return;
    const gesture = touchGestureRef.current;
    if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > TOUCH_MOVE_THRESHOLD) {
      gesture.moved = true;
    }
    updateFocusPoint(event.currentTarget, event.clientX, event.clientY);
  };

  const onTouchPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    touchGestureRef.current = { x: event.clientX, y: event.clientY, moved: false };
    updateFocusPoint(event.currentTarget, event.clientX, event.clientY);
    setIsZoomed(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const gesture = touchGestureRef.current;
    touchGestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsZoomed(false);
    frameRef.current?.style.setProperty('--image-zoom-x', '50%');
    frameRef.current?.style.setProperty('--image-zoom-y', '50%');
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
        {isZoomed ? 'Tap to reset' : 'Hover or tap to zoom'}
      </span>
    </div>
  );
};
