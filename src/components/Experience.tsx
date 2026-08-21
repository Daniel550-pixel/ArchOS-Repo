import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExperienceCard, HandGestureState, ExperienceCommand, CommandSource } from '../types';
import { ProceduralExplodedCanvas } from './ProceduralExplodedCanvas';
import { Controls } from './Controls';
import { Timeline } from './Timeline';
import { videoSyncService } from '../services/video/timelineSync';
import { Sparkles, X, Layers } from 'lucide-react';

interface ExperienceProps {
  experience: ExperienceCard;
  gestureState: HandGestureState;
  onClose: () => void;
  onManualProgressChange: (progress: number) => void;
  onDispatchCommand?: (command: ExperienceCommand, source?: CommandSource) => void;
}

export const Experience: React.FC<ExperienceProps> = ({
  experience,
  gestureState,
  onClose,
  onManualProgressChange,
  onDispatchCommand
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showLayerDrawer, setShowLayerDrawer] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [activeLayerHover, setActiveLayerHover] = useState<number | null>(null);

  const progress = gestureState.smoothedProgress; // 0.0 to 1.0

  // Direct Time-Mapping to Video Timeline via videoSyncService:
  // video.currentTime = progress * video.duration
  // Video must NEVER autoplay linearly while gesture or scrubber is active.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;
    videoSyncService.syncProgressToVideo(video, progress, experience.durationSeconds || 10);
  }, [progress, videoLoaded, experience.durationSeconds]);

  // Video loaded metadata handler
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause(); // Ensure never autoplays linearly
    videoSyncService.syncProgressToVideo(video, progress, experience.durationSeconds || 10);
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = () => {
    // If local MP4 is not present or failed to load, fallback gracefully to procedural exploded canvas
    setVideoError(true);
    setVideoLoaded(false);
  };

  // Keyboard navigation for scrubbing & Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        onManualProgressChange(Math.min(1, progress + 0.04));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        onManualProgressChange(Math.max(0, progress - 0.04));
      } else if (e.key === 'Home' || e.key === '0' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onManualProgressChange(0); // Reset to assembled
      } else if (e.key === 'End' || e.key === '1') {
        e.preventDefault();
        onManualProgressChange(1); // Full exploded
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [progress, onClose, onManualProgressChange]);

  // Mouse Wheel Scrubbing Support
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY * 0.001;
    onManualProgressChange(Math.max(0, Math.min(1, progress + delta)));
  }, [progress, onManualProgressChange]);

  // Reset to assembled (0%)
  const handleResetToAssembled = () => {
    onManualProgressChange(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onWheel={handleWheel}
      className="fixed inset-0 z-50 bg-[#08080a] text-[#f5f4f0] flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Top Experience Navigation & Action Controls Bar */}
      <Controls
        experience={experience}
        progress={progress}
        showLayerDrawer={showLayerDrawer}
        onToggleLayerDrawer={() => setShowLayerDrawer(!showLayerDrawer)}
        onOpenPromptModal={() => setShowPromptModal(true)}
        onReset={handleResetToAssembled}
        onClose={onClose}
      />

      {/* Main Viewport: Video Stream & Fallback 3D Canvas */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#060608]">
        {/* Layer 1: HTML5 Video Element (Scrubbed strictly via video.currentTime = progress * duration) */}
        {!videoError ? (
          <video
            ref={videoRef}
            src={experience.videoSrc}
            playsInline
            muted
            preload="auto"
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleVideoError}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : null}

        {/* Layer 2: High-Precision 3D Procedural Exploded Canvas (Guarantees photorealistic 3D scrubbing even if local video isn't loaded) */}
        {(!videoLoaded || videoError) && (
          <div className="absolute inset-0 w-full h-full">
            <ProceduralExplodedCanvas
              experience={experience}
              progress={progress}
              showLabels={true}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Real-time Cinematic HUD Overlay */}
        <div className="absolute top-6 left-8 pointer-events-none flex flex-col gap-2 z-20">
          <div className="font-mono-tech text-[10px] text-[#8e8d88] flex items-center gap-2 bg-[#08080a]/60 backdrop-blur-sm px-2.5 py-1 border border-[#f5f4f0]/08 rounded-xs w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] animate-pulse" />
            <span>TIMELINE SYNC: {(progress * (experience.durationSeconds || 10)).toFixed(2)}s / {(experience.durationSeconds || 10).toFixed(2)}s</span>
          </div>

          <div className="font-mono-tech text-2xl font-extrabold text-[#f5f4f0]">
            {Math.round(progress * 100)}%
            <span className="text-xs font-normal text-[#8e8d88] ml-2">
              {progress < 0.05
                ? '[ASSEMBLED]'
                : progress > 0.95
                ? '[MAX EXPLODED]'
                : '[SEPARATING LAYERS]'}
            </span>
          </div>
        </div>

        {/* Center Control Badge: ASSEMBLED ← PINCH → EXPLODED */}
        <div className="absolute top-6 right-8 pointer-events-none z-20 hidden md:flex items-center gap-3 bg-[#08080a]/80 backdrop-blur-md px-4 py-2 border border-[#f5f4f0]/15 rounded-xs font-mono-tech text-xs">
          <span className={progress < 0.2 ? 'text-[#d4ff00] font-bold' : 'text-[#8e8d88]'}>
            ASSEMBLED
          </span>
          <span className="text-[#545350]">←</span>
          <span className="text-[#f5f4f0] font-semibold flex items-center gap-1.5 px-2 py-0.5 bg-[#111115] border border-[#f5f4f0]/10">
            <Sparkles className="w-3 h-3 text-[#d4ff00]" />
            PINCH
          </span>
          <span className="text-[#545350]">→</span>
          <span className={progress > 0.8 ? 'text-[#d4ff00] font-bold' : 'text-[#8e8d88]'}>
            EXPLODED
          </span>
        </div>

        {/* Right Slide-over Layer Breakdown Drawer */}
        {showLayerDrawer && (
          <aside
            aria-label="Layer Decomposition"
            className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#0d0d12]/95 border-l border-[#f5f4f0]/15 backdrop-blur-xl p-6 flex flex-col justify-between z-30 shadow-2xl animate-in slide-in-from-right duration-300"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#f5f4f0]/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#d4ff00]" />
                  <h2 className="font-mono-tech text-sm font-bold uppercase text-[#f5f4f0]">
                    Layer Decomposition
                  </h2>
                </div>
                <button
                  onClick={() => setShowLayerDrawer(false)}
                  className="text-[#8e8d88] hover:text-[#f5f4f0] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
                {experience.layers.map((layer, lIdx) => {
                  const isLayerActive = Math.abs(progress - (1 - layer.relativeDepth)) < 0.25;
                  return (
                    <div
                      key={layer.id}
                      onMouseEnter={() => setActiveLayerHover(lIdx)}
                      onMouseLeave={() => setActiveLayerHover(null)}
                      onClick={() => onManualProgressChange(1 - layer.relativeDepth)}
                      className={`p-3 border rounded-xs transition-all cursor-pointer ${
                        isLayerActive || activeLayerHover === lIdx
                          ? 'bg-[#1a1a24] border-[#d4ff00]/60 shadow-[0_0_15px_rgba(212,255,0,0.15)]'
                          : 'bg-[#111115]/60 border-[#f5f4f0]/08 hover:border-[#f5f4f0]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono-tech text-[10px] font-bold text-[#d4ff00]">
                          LAYER {layer.index}
                        </span>
                        <span className="font-mono-tech text-[9px] text-[#8e8d88]">
                          DEPTH {Math.round(layer.relativeDepth * 100)}%
                        </span>
                      </div>
                      <h4 className="font-display font-semibold text-sm text-[#f5f4f0]">
                        {layer.name}
                      </h4>
                      <p className="text-xs text-[#8e8d88] mt-1 leading-snug">
                        {layer.description}
                      </p>
                      <div className="mt-2 pt-2 border-t border-[#f5f4f0]/06 font-mono-tech text-[10px] text-[#545350]">
                        MAT: {layer.material}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#f5f4f0]/10 font-mono-tech text-[11px] text-[#8e8d88]">
              Click any layer to scrub directly to its separation tier.
            </div>
          </aside>
        )}

        {/* Prompt Inspection Modal */}
        {showPromptModal && (
          <div className="fixed inset-0 z-40 bg-[#08080a]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111115] border border-[#f5f4f0]/20 p-6 max-w-2xl w-full rounded-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#f5f4f0]/10 pb-3 mb-4">
                <span className="font-mono-tech text-xs font-bold text-[#d4ff00] uppercase">
                  3D Exploded Video Generation Prompt // {experience.title}
                </span>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="text-[#8e8d88] hover:text-[#f5f4f0]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#08080a] p-4 font-mono-tech text-xs text-[#f5f4f0] leading-relaxed border border-[#f5f4f0]/08 rounded-xs mb-4">
                {experience.prompt}
              </div>

              <div className="flex items-center justify-between font-mono-tech text-[11px] text-[#8e8d88]">
                <span>SETTINGS: 60FPS · 4K · STATIC CAMERA LOCKED · DIRECT TIME-MAP</span>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="px-3 py-1 bg-[#f5f4f0] text-[#08080a] font-bold uppercase rounded-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Master Scrubber & Fallback Timeline Controls */}
      <Timeline
        progress={progress}
        durationSeconds={experience.durationSeconds || 10}
        onProgressChange={onManualProgressChange}
        onReset={handleResetToAssembled}
      />
    </div>
  );
};
