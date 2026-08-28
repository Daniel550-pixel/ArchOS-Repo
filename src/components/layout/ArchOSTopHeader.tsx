// ArchOS Top Header & System Telemetry Bar
// Minimalist, high-contrast operational status banner adhering to the Vesper design system

import React from 'react';
import { ContinuousIngestionStats } from '../../types/continuousIntelligence';
import {
  Activity,
  Globe2,
  Layers,
  Sparkles,
  Zap,
  Compass,
  Cpu,
  ShieldAlert
} from 'lucide-react';

interface ArchOSTopHeaderProps {
  stats: ContinuousIngestionStats;
  operatingMode: 'WORLD' | 'INTELLIGENCE' | 'SIMULATION' | 'GOD_EYE';
  onChangeOperatingMode: (mode: 'WORLD' | 'INTELLIGENCE' | 'SIMULATION' | 'GOD_EYE') => void;
  activeAgentsCount: number;
}

export const ArchOSTopHeader: React.FC<ArchOSTopHeaderProps> = ({
  stats,
  operatingMode,
  onChangeOperatingMode,
  activeAgentsCount
}) => {
  const modes: Array<{ id: 'WORLD' | 'INTELLIGENCE' | 'SIMULATION' | 'GOD_EYE'; label: string; icon: any }> = [
    { id: 'WORLD', label: 'WORLD', icon: Globe2 },
    { id: 'INTELLIGENCE', label: 'INTELLIGENCE', icon: Activity },
    { id: 'SIMULATION', label: 'SIMULATION', icon: Sparkles },
    { id: 'GOD_EYE', label: "GOD'S EYE", icon: Compass }
  ];

  return (
    <header
      id="archos-top-header"
      className="fixed top-0 left-0 right-0 z-40 h-14 px-6 flex items-center justify-between pointer-events-auto bg-[#000000]/80 backdrop-blur-xl border-b border-white/10"
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

        {/* Live Operational Badge */}
        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/10 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">{stats.status}</span>
          </div>

          <span className="text-neutral-600">/</span>

          <div className="text-neutral-400">
            LAST UPDATE: <span className="text-white">{stats.lastUpdateFormatted}</span>
          </div>

          <span className="text-neutral-600">/</span>

          <div className="text-neutral-400">
            INGESTED: <span className="text-cyan-300 font-semibold">{stats.eventsIngestedTotal.toLocaleString()}</span>
          </div>

          <span className="text-neutral-600">/</span>

          <div className="text-neutral-400">
            SOURCES: <span className="text-white">{stats.activeSourcesCount}</span>
          </div>

          <span className="text-neutral-600">/</span>

          <div className="text-neutral-400">
            AGENTS: <span className="text-white">{activeAgentsCount} ACTIVE</span>
          </div>

          <span className="text-neutral-600">/</span>

          <div className="flex items-center gap-1 text-cyan-400">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>WM: {stats.worldModelSyncStatus}</span>
          </div>
        </div>
      </div>

      {/* Right: Operating Perspective Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center p-1 bg-white/[0.04] border border-white/10 rounded-xl">
          {modes.map(mode => {
            const Icon = mode.icon;
            const isActive = operatingMode === mode.id;

            return (
              <button
                key={mode.id}
                id={`btn-mode-${mode.id.toLowerCase()}`}
                onClick={() => onChangeOperatingMode(mode.id)}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
