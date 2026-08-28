// ArchOS Top Header & System Telemetry Bar
// Minimalist, high-contrast operational status banner adhering to the 5-layer system

import React from 'react';
import { ContinuousIngestionStats } from '../../types/continuousIntelligence';
import { PrimaryMode, SystemLayerModal } from '../../types/archosExperience';
import {
  Activity,
  Globe2,
  Sparkles,
  Zap,
  Cpu,
  Radio,
  ShieldCheck
} from 'lucide-react';

interface ArchOSTopHeaderProps {
  stats: ContinuousIngestionStats;
  activeMode: PrimaryMode;
  onSelectMode: (mode: PrimaryMode) => void;
  onOpenSystemOverlay: (modal: SystemLayerModal) => void;
  activeAgentsCount: number;
}

export const ArchOSTopHeader: React.FC<ArchOSTopHeaderProps> = ({
  stats,
  activeMode,
  onSelectMode,
  onOpenSystemOverlay,
  activeAgentsCount
}) => {
  return (
    <header
      id="archos-top-header"
      className="fixed top-0 left-0 right-0 z-40 h-14 px-6 flex items-center justify-between pointer-events-auto bg-[#000000]/90 backdrop-blur-xl border-b border-white/10 select-none"
    >
      {/* Left: Brand / System Wordmark */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white text-black font-bold font-mono text-sm tracking-tighter shadow-md">
            AO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold tracking-widest text-white uppercase">
                ARCHOS
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-neutral-300">
                UAE WORLD MODEL
              </span>
            </div>
          </div>
        </div>

        {/* Live Operational Telemetry Strip */}
        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/10 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">{stats.status}</span>
          </div>

          <span className="text-neutral-600">/</span>

          <div className="text-neutral-400">
            LAST SYNC: <span className="text-white">12.4s AGO</span>
          </div>

          <span className="text-neutral-600">/</span>

          <button
            type="button"
            onClick={() => onOpenSystemOverlay('DATA_FLOW')}
            className="text-neutral-400 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
          >
            INGESTION: <span className="text-cyan-300 font-semibold">13,421/min</span>
          </button>

          <span className="text-neutral-600">/</span>

          <div className="text-neutral-400">
            AGENTS: <span className="text-white">{activeAgentsCount} ACTIVE</span>
          </div>

          <span className="text-neutral-600">/</span>

          <button
            type="button"
            onClick={() => onOpenSystemOverlay('VERIFY')}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>INTEGRITY: 99.98%</span>
          </button>
        </div>
      </div>

      {/* Right: Operational Mode Indicators */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-neutral-400 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>REALITY CANVAS: <strong className="text-white uppercase">{activeMode}</strong></span>
        </div>

        <button
          type="button"
          onClick={() => onOpenSystemOverlay('SECURITY')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>SOVEREIGN ENCLAVE</span>
        </button>
      </div>
    </header>
  );
};

