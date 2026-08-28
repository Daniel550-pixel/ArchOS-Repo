// ArchOS System Navigation Rail
// Streamlined primary modes (WORLD, INFO, SIMULATE, AGENTS) + Supporting Cross-Cutting Trust Layer

import React from 'react';
import {
  Globe2,
  Activity,
  Sparkles,
  Cpu,
  ShieldCheck,
  Lock,
  Database,
  Radio,
  ChevronRight
} from 'lucide-react';
import { PrimaryMode, SystemLayerModal } from '../../types/archosExperience';

interface SystemNavRailProps {
  activeMode: PrimaryMode;
  onSelectMode: (mode: PrimaryMode) => void;
  onOpenSystemOverlay: (modal: SystemLayerModal) => void;
  activeAgentsCount?: number;
}

export const SystemNavRail: React.FC<SystemNavRailProps> = ({
  activeMode,
  onSelectMode,
  onOpenSystemOverlay,
  activeAgentsCount = 4
}) => {
  const primaryModes: Array<{
    id: PrimaryMode;
    label: string;
    question: string;
    icon: any;
    badge?: string;
  }> = [
    {
      id: 'WORLD',
      label: 'WORLD',
      question: 'What is happening?',
      icon: Globe2,
      badge: 'REALITY'
    },
    {
      id: 'INFO',
      label: 'UAE INFO',
      question: 'What do we know?',
      icon: Activity,
      badge: 'LIVE'
    },
    {
      id: 'SIMULATE',
      label: 'SIMULATE',
      question: 'What if?',
      icon: Sparkles,
      badge: 'BRANCH'
    },
    {
      id: 'AGENTS',
      label: 'AGENTS',
      question: 'Who is acting?',
      icon: Cpu,
      badge: 'FABRIC'
    }
  ];

  const systemLayers: Array<{
    id: SystemLayerModal;
    label: string;
    icon: any;
    status: string;
  }> = [
    { id: 'VERIFY', label: 'VERIFY', icon: ShieldCheck, status: '99.98%' },
    { id: 'SECURITY', label: 'SECURITY', icon: Lock, status: 'SOVEREIGN' },
    { id: 'MEMORY', label: 'MEMORY', icon: Database, status: '4 TIERS' },
    { id: 'DATA_FLOW', label: 'DATA FLOW', icon: Radio, status: '13.4k/m' }
  ];

  return (
    <nav
      id="archos-system-nav-rail"
      aria-label="Primary System Navigation"
      className="fixed top-14 left-0 bottom-24 z-30 w-64 p-3 flex flex-col justify-between pointer-events-auto bg-[#000000]/80 backdrop-blur-2xl border-r border-white/10 select-none"
    >
      {/* Primary Operational Modes */}
      <div className="space-y-4">
        <div className="px-2 pt-1 flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-semibold">
            Operational Modes
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
            1 SCREEN = 1 GOAL
          </span>
        </div>

        <div className="space-y-1.5">
          {primaryModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;

            return (
              <button
                key={mode.id}
                id={`btn-nav-mode-${mode.id.toLowerCase()}`}
                type="button"
                onClick={() => onSelectMode(mode.id)}
                className={`w-full p-2.5 rounded-xl text-left font-mono transition-all group flex items-start justify-between border ${
                  isActive
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-white/[0.02] text-neutral-300 border-white/5 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isActive
                        ? 'bg-black text-white'
                        : 'bg-white/5 text-neutral-400 group-hover:text-white group-hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tracking-wider">{mode.label}</span>
                      {mode.badge && (
                        <span
                          className={`text-[8px] font-semibold px-1.5 py-0.2 rounded ${
                            isActive
                              ? 'bg-black/15 text-black'
                              : 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {mode.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] tracking-normal mt-0.5 ${
                        isActive ? 'text-neutral-700 font-medium' : 'text-neutral-500'
                      }`}
                    >
                      {mode.question}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 mt-1 transition-transform ${
                    isActive ? 'text-black translate-x-0.5' : 'text-neutral-600 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Cross-Cutting Trust & Infrastructure Layer */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        <div className="px-2 flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-semibold">
            System / Trust Layer
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {systemLayers.map((layer) => {
            const Icon = layer.icon;

            return (
              <button
                key={layer.id}
                id={`btn-system-layer-${layer.id.toLowerCase()}`}
                type="button"
                onClick={() => onOpenSystemOverlay(layer.id)}
                className="p-2 rounded-lg font-mono text-left bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.08] transition-all flex flex-col gap-1 group cursor-pointer"
              >
                <div className="flex items-center justify-between text-neutral-400 group-hover:text-white">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[8px] px-1 py-0.2 rounded bg-white/5 text-neutral-400">
                    {layer.status}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-neutral-300 group-hover:text-white">
                  {layer.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
