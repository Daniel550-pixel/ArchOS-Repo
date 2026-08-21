import React from 'react';
import { X, RotateCcw, Layers, Info, Sparkles } from 'lucide-react';
import { ExperienceCard } from '../types';

interface ControlsProps {
  experience: ExperienceCard;
  progress: number;
  showLayerDrawer: boolean;
  onToggleLayerDrawer: () => void;
  onOpenPromptModal: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  experience,
  progress,
  showLayerDrawer,
  onToggleLayerDrawer,
  onOpenPromptModal,
  onReset,
  onClose
}) => {
  return (
    <header className="relative z-30 px-8 py-5 flex items-center justify-between border-b border-[#f5f4f0]/10 bg-[#08080a]/80 backdrop-blur-md">
      {/* Title & Close */}
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#111115] hover:bg-[#1a1a22] border border-[#f5f4f0]/15 text-[#f5f4f0] font-mono-tech text-xs font-bold uppercase transition-colors rounded-xs cursor-pointer group"
          title="Return to Gallery [ESC]"
        >
          <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
          <span>CLOSE [ESC]</span>
        </button>

        <div className="flex items-baseline gap-3 border-l border-[#f5f4f0]/10 pl-4">
          <span className="font-mono-tech text-xs text-[#d4ff00] font-bold">
            {experience.index}
          </span>
          <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-[#f5f4f0]">
            {experience.title}
          </h1>
          <span className="hidden md:inline-block font-mono-tech text-[10px] text-[#8e8d88] uppercase tracking-wider">
            // {experience.category}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLayerDrawer}
          className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono-tech text-xs font-semibold uppercase rounded-xs transition-colors cursor-pointer ${
            showLayerDrawer
              ? 'bg-[#d4ff00] text-[#08080a] border-[#d4ff00]'
              : 'bg-[#111115] text-[#8e8d88] hover:text-[#f5f4f0] border-[#f5f4f0]/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Layers ({experience.layers.length})</span>
        </button>

        <button
          onClick={onOpenPromptModal}
          className="p-1.5 bg-[#111115] hover:bg-[#1a1a22] border border-[#f5f4f0]/10 text-[#8e8d88] hover:text-[#f5f4f0] rounded-xs transition-colors cursor-pointer"
          title="Inspect 3D Video Generation Prompt"
        >
          <Info className="w-4 h-4" />
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111115] hover:bg-[#1a1a22] border border-[#f5f4f0]/10 text-[#8e8d88] hover:text-[#d4ff00] font-mono-tech text-xs uppercase rounded-xs transition-colors cursor-pointer"
          title="Reset to 0% Assembled [R / 0]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset [0%]</span>
        </button>
      </div>
    </header>
  );
};
