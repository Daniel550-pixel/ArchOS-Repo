import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

interface TimelineProps {
  progress: number;
  durationSeconds?: number;
  onProgressChange: (value: number) => void;
  onReset: () => void;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  progress,
  durationSeconds = 10,
  onProgressChange,
  onReset,
  className = ''
}) => {
  const timeFormatted = (progress * durationSeconds).toFixed(2);

  return (
    <footer
      aria-label="3D Transformation Timeline"
      className={`relative z-30 px-8 py-5 border-t border-[#f5f4f0]/10 bg-[#08080a]/95 backdrop-blur-md flex flex-col gap-3 ${className}`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between font-mono-tech text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[#8e8d88]">TIMELINE SCRUBBER</span>
          <span className="text-[#545350]">|</span>
          <span className="text-[#d4ff00] font-bold">
            {progress < 0.05 ? '0.00s (ASSEMBLED)' : `${timeFormatted}s / ${durationSeconds.toFixed(2)}s`}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[#8e8d88]">
          <span className="hidden sm:inline">
            FALLBACK: DRAG SLIDER · MOUSE WHEEL · [↑ / ↓] KEYS
          </span>
          <span className="text-[#f5f4f0] font-bold">
            {Math.round(progress * 100)}% EXPLODED
          </span>
        </div>
      </div>

      {/* Range Input with Custom Styling */}
      <div className="relative flex items-center">
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          onChange={(e) => onProgressChange(parseFloat(e.target.value))}
          aria-label="3D Exploded View Timeline Scrubber"
          className="tech-scrubber z-10 w-full"
        />

        {/* Stratum Division Ticks */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-1 pointer-events-none opacity-25">
          {[0, 20, 40, 60, 80, 100].map((tick) => (
            <span key={tick} className="w-0.5 h-2 bg-[#f5f4f0]" />
          ))}
        </div>
      </div>

      {/* Stratum Milestone Buttons */}
      <div className="flex items-center justify-between font-mono-tech text-[10px] text-[#545350] pt-1">
        <button
          onClick={() => onProgressChange(0)}
          className="hover:text-[#d4ff00] cursor-pointer transition-colors"
        >
          0% ASSEMBLED
        </button>
        <button
          onClick={() => onProgressChange(0.25)}
          className="hover:text-[#d4ff00] cursor-pointer transition-colors"
        >
          25% SHELL SEPARATION
        </button>
        <button
          onClick={() => onProgressChange(0.50)}
          className="hover:text-[#d4ff00] cursor-pointer transition-colors"
        >
          50% CORE ISOLATION
        </button>
        <button
          onClick={() => onProgressChange(0.75)}
          className="hover:text-[#d4ff00] cursor-pointer transition-colors"
        >
          75% CHASSIS DECOUPLING
        </button>
        <button
          onClick={() => onProgressChange(1.0)}
          className="hover:text-[#d4ff00] cursor-pointer transition-colors"
        >
          100% MAXIMUM SPREAD
        </button>
      </div>
    </footer>
  );
};
