import React, { useRef, useEffect } from 'react';
import { HandGestureState } from '../types';
import { Camera, CameraOff, Eye, EyeOff } from 'lucide-react';

interface CameraPreviewProps {
  gestureState: HandGestureState;
  videoElementRef: React.RefObject<HTMLVideoElement | null>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleDebugSkeleton: () => void;
  isExperienceOpen: boolean;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  gestureState,
  videoElementRef,
  onStartCamera,
  onStopCamera,
  onToggleDebugSkeleton,
  isExperienceOpen
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Hand Skeleton & Tracking Points on Mini HUD Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gestureState.isCameraActive || !gestureState.landmarks) {
      return;
    }

    const landmarks = gestureState.landmarks;
    const w = canvas.width;
    const h = canvas.height;

    // Draw Hand Connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [0, 13], [13, 14], [14, 15], [15, 16],// Ring
      [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [5, 9], [9, 13], [13, 17]             // Palm base
    ];

    ctx.save();
    // Mirror horizontal coordinate to match selfie feed
    ctx.scale(-1, 1);
    ctx.translate(-w, 0);

    ctx.strokeStyle = gestureState.isOpenPalm ? '#d4ff00' : 'rgba(245, 244, 240, 0.4)';
    ctx.lineWidth = 1.5;

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    });

    // Draw Landmarks
    landmarks.forEach((pt, index) => {
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, index === 4 || index === 8 ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = index === 4 || index === 8 ? '#d4ff00' : '#ffffff';
      ctx.fill();
    });

    // Draw Pinch Line between Thumb Tip (4) and Index Tip (8)
    const thumb = landmarks[4];
    const index = landmarks[8];
    if (thumb && index) {
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(thumb.x * w, thumb.y * h);
      ctx.lineTo(index.x * w, index.y * h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [gestureState]);

  if (!gestureState.isCameraActive) {
    return (
      <div className="bg-[#111115]/95 border border-[#f5f4f0]/10 p-3.5 rounded-xs backdrop-blur-md shadow-2xl max-w-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse" />
            <span className="font-mono-tech text-[11px] font-semibold tracking-wider text-[#f5f4f0] uppercase">
              Gesture Engine
            </span>
          </div>
          <span className="font-mono-tech text-[9px] text-[#8e8d88] border border-[#f5f4f0]/10 px-1.5 py-0.5 rounded">
            @mediapipe
          </span>
        </div>

        <p className="text-[12px] text-[#8e8d88] leading-snug">
          Open palm to enter. Pinch thumb & index to scrub timeline.
        </p>

        <button
          onClick={onStartCamera}
          className="w-full bg-[#f5f4f0] hover:bg-[#d4ff00] text-[#08080a] font-mono-tech text-[11px] font-bold uppercase py-2 px-3 flex items-center justify-center gap-2 transition-colors cursor-pointer group rounded-xs"
        >
          <Camera className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Enable Gesture Control</span>
        </button>

        {gestureState.error && (
          <div className="text-[11px] text-[#f87171] bg-red-950/40 p-2 border border-red-800/40 rounded">
            {gestureState.error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#111115]/95 border border-[#f5f4f0]/15 p-3 rounded-xs backdrop-blur-md shadow-2xl flex flex-col gap-2.5 w-64">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#f5f4f0]/10 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${gestureState.handDetected ? 'bg-[#d4ff00]' : 'bg-[#f5f4f0]/30'}`} />
          <span className="font-mono-tech text-[10px] font-bold tracking-wider uppercase text-[#f5f4f0]">
            {gestureState.handDetected
              ? gestureState.isOpenPalm
                ? 'PALM DETECTED'
                : 'TRACKING HAND'
              : 'SEARCHING HAND'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleDebugSkeleton}
            title="Toggle Skeleton Overlay"
            className="text-[#8e8d88] hover:text-[#f5f4f0] p-1 transition-colors cursor-pointer"
          >
            {gestureState.debugSkeleton ? <Eye className="w-3.5 h-3.5 text-[#d4ff00]" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <span className="font-mono-tech text-[9px] text-[#8e8d88]">{gestureState.fps} FPS</span>
          <button
            onClick={onStopCamera}
            title="Disable Camera Stream"
            className="text-[#8e8d88] hover:text-[#f5f4f0] p-1 transition-colors cursor-pointer"
          >
            <CameraOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Preview & Skeleton Canvas Overlay */}
      <div className="relative w-full h-36 bg-[#08080a] border border-[#f5f4f0]/10 overflow-hidden rounded-xs">
        <video
          ref={videoElementRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60 grayscale contrast-125"
        />
        <canvas
          ref={canvasRef}
          width={256}
          height={144}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Open Palm 450ms Progress Indicator HUD */}
        {gestureState.isOpenPalm && !isExperienceOpen && (
          <div className="absolute inset-0 bg-[#08080a]/60 flex flex-col items-center justify-center gap-1.5 backdrop-blur-xs">
            <div className="relative w-12 h-12">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#f5f4f0]/20"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#d4ff00] transition-all"
                  strokeDasharray={`${gestureState.palmHoldProgress * 100}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-mono-tech text-[10px] font-bold text-[#d4ff00]">
                {Math.round(gestureState.palmHoldProgress * 100)}%
              </div>
            </div>
            <span className="font-mono-tech text-[9px] uppercase tracking-widest text-[#f5f4f0]">
              HOLD PALM (450ms)
            </span>
          </div>
        )}

        {gestureState.handDetected && (
          <div className="absolute bottom-1.5 left-1.5 bg-[#08080a]/80 font-mono-tech text-[9px] px-1.5 py-0.5 text-[#d4ff00] border border-[#f5f4f0]/10">
            {gestureState.handedness.toUpperCase()} HAND
          </div>
        )}
      </div>

      {/* Telemetry */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-mono-tech text-[10px]">
          <span className="text-[#8e8d88]">PINCH SPREAD</span>
          <span className="text-[#d4ff00] font-bold">
            {Math.round(gestureState.smoothedProgress * 100)}%
          </span>
        </div>

        <div className="w-full h-1.5 bg-[#f5f4f0]/10 rounded-xs overflow-hidden flex">
          <div
            className="h-full bg-[#d4ff00] transition-all duration-75"
            style={{ width: `${gestureState.smoothedProgress * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between font-mono-tech text-[8px] text-[#8e8d88]">
          <span>ASSEMBLED (0%)</span>
          <span>EXPLODED (100%)</span>
        </div>
      </div>
    </div>
  );
};
