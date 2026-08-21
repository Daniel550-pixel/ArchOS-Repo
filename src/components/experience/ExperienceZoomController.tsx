import React, { useRef, useCallback, useState } from 'react';

interface ExperienceZoomControllerProps {
  onZoomChange: (zoom: number) => void;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomSensitivity?: number;
  children?: React.ReactNode;
  className?: string;
  showControls?: boolean;
}

export const ExperienceZoomController: React.FC<ExperienceZoomControllerProps> = ({
  onZoomChange,
  initialZoom = 1,
  minZoom = 0.3,
  maxZoom = 5,
  zoomSensitivity = 1.5,
  children,
  className = '',
  showControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [isPinching, setIsPinching] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [touches, setTouches] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

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
    } else if (e.touches.length === 1 && zoom > 1) {
      // Allow panning when zoomed in
      setIsDragging(true);
      setLastMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [touches, getDistance, zoom]);

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
    } else if (e.touches.length === 1 && isDragging && lastMousePosition) {
      // Handle panning
      const deltaX = e.touches[0].clientX - lastMousePosition.x;
      const deltaY = e.touches[0].clientY - lastMousePosition.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setLastMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }

    // Update touches
    const newTouches = new Map();
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      newTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    setTouches(newTouches);
  }, [lastPinchDistance, zoom, zoomSensitivity, minZoom, maxZoom, onZoomChange, getDistance, isDragging, lastMousePosition]);

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
    if (newTouches.size === 0) {
      setIsDragging(false);
      setLastMousePosition(null);
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

  // Mouse drag for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    }
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && lastMousePosition) {
      const deltaX = e.clientX - lastMousePosition.x;
      const deltaY = e.clientY - lastMousePosition.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, lastMousePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setLastMousePosition(null);
  }, []);

  // Reset zoom and pan
  const handleReset = useCallback(() => {
    setZoom(initialZoom);
    setPanOffset({ x: 0, y: 0 });
    onZoomChange(initialZoom);
  }, [initialZoom, onZoomChange]);

  // Zoom in/out buttons
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(maxZoom, zoom + 0.5);
    setZoom(newZoom);
    onZoomChange(newZoom);
  }, [zoom, maxZoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(minZoom, zoom - 0.5);
    setZoom(newZoom);
    onZoomChange(newZoom);
  }, [zoom, minZoom, onZoomChange]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        handleMouseUp();
        setIsHovering(false);
      }}
      style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
    >
      {/* Zoom controls */}
      {showControls && isHovering && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
          <div className="bg-[#0c0c0c]/80 border border-[#00e5ff]/30 rounded-lg px-3 py-2 font-mono text-[10px] text-[#00e5ff]">
            <div className="flex items-center gap-2">
              <span>ZOOM</span>
              <span className="font-bold">{(zoom * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 bg-[#0c0c0c]/80 border border-[#00e5ff]/30 rounded-lg text-[#00e5ff] hover:bg-[#00e5ff]/20 transition-colors flex items-center justify-center"
            >
              <span className="text-lg">+</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 bg-[#0c0c0c]/80 border border-[#00e5ff]/30 rounded-lg text-[#00e5ff] hover:bg-[#00e5ff]/20 transition-colors flex items-center justify-center"
            >
              <span className="text-lg">−</span>
            </button>
            <button
              onClick={handleReset}
              className="w-8 h-8 bg-[#0c0c0c]/80 border border-[#00e5ff]/30 rounded-lg text-[#00e5ff] hover:bg-[#00e5ff]/20 transition-colors flex items-center justify-center text-[10px]"
            >
              ⟲
            </button>
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

      {/* Content with zoom and pan transform */}
      <div
        className="w-full h-full transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
};
