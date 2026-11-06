import React, { useEffect, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';

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

  useEffect(() => {
    setIsZoomed(false);
    frameRef.current?.style.setProperty('--image-zoom-x', '50%');
    frameRef.current?.style.setProperty('--image-zoom-y', '50%');
  }, [imageKey]);

  const updateFocusPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && !isZoomed) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      '--image-zoom-x',
      `${Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))}%`
    );
    event.currentTarget.style.setProperty(
      '--image-zoom-y',
      `${Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100))}%`
    );
  };

  return (
    <div
      ref={frameRef}
      className={`image-zoom-frame ${isZoomed ? 'image-zoom-active' : ''} ${className}`}
      onPointerMove={updateFocusPoint}
      onPointerLeave={() => {
        if (!isZoomed) {
          frameRef.current?.style.setProperty('--image-zoom-x', '50%');
          frameRef.current?.style.setProperty('--image-zoom-y', '50%');
        }
      }}
    >
      {children}
      <button
        type="button"
        className="image-zoom-trigger"
        aria-label={isZoomed ? `Reset zoom: ${label}` : `Zoom image: ${label}`}
        aria-pressed={isZoomed}
        onClick={() => setIsZoomed((current) => !current)}
      />
      <span className="image-zoom-focus" aria-hidden="true">
        <Crosshair className="h-5 w-5" />
      </span>
      <span className="image-zoom-hint" aria-hidden="true">
        {isZoomed ? 'Tap to reset' : 'Hover or tap to zoom'}
      </span>
    </div>
  );
};
