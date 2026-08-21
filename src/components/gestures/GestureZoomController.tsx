import React, { useRef, useCallback, useState } from 'react';

interface GestureZoomControllerProps {
  onZoomChange: (zoom: number) => void;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomSensitivity?: number;
  children?: React.ReactNode;
  className?: string;
}

export const GestureZoomController: React.FC<GestureZoomControllerProps> = ({
  onZoomChange,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  zoomSensitivity = 1,
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [isPinching, setIsPinching] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [touches, setTouches] = useState<Map<number, { x: number; y: number }>>(new Map());

  // Calculate distance between two points
  const getDistance = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const newTouches = new Map(touches);
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      newTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    setTouches(newTouches);

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );
      setLastPinchDistance(distance);
      setIsPinching(true);
    }
  }, [touches, getDistance]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2 && lastPinchDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );

      const delta = currentDistance - lastPinchDistance;
      const zoomDelta = (delta / 100) * zoomSensitivity;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + zoomDelta));

      setZoom(newZoom);
      onZoomChange(newZoom);
      setLastPinchDistance(currentDistance);
    }

    // Update touches
    const newTouches = new Map();
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      newTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    setTouches(newTouches);
  }, [lastPinchDistance, zoom, zoomSensitivity, minZoom, maxZoom, onZoomChange, getDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const newTouches = new Map(touches);
    for (let i = 0; i < e.changedTouches.length; i++) {
      newTouches.delete(e.changedTouches[i].identifier);
    }
    setTouches(newTouches);

    if (newTouches.size < 2) {
      setIsPinching(false);
      setLastPinchDistance(null);
    }
  }, [touches]);

  // Mouse wheel zoom for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / 100;
    const zoomDelta = delta * zoomSensitivity;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + zoomDelta));
    setZoom(newZoom);
    onZoomChange(newZoom);
  }, [zoom, zoomSensitivity, minZoom, maxZoom, onZoomChange]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ touchAction: 'none' }}
    >
      {/* Zoom indicator */}
      {isHovering && (
        <div className="absolute top-4 right-4 bg-[#0c0c0c]/80 border border-[#00e5ff]/30 rounded-lg px-3 py-2 font-mono text-[10px] text-[#00e5ff] z-50">
          <div className="flex items-center gap-2">
            <span>ZOOM</span>
            <span className="font-bold">{(zoom * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Pinch indicator */}
      {isPinching && (
        <div className="absolute top-4 left-4 bg-[#0c0c0c]/80 border border-[#00e5ff]/30 rounded-lg px-3 py-2 font-mono text-[10px] text-[#00e5ff] z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
            <span>PINCH ZOOM</span>
          </div>
        </div>
      )}

      {/* Content with zoom transform */}
      <div
        className="w-full h-full transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
};
