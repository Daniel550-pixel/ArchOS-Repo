import React from 'react';
import {
  Sparkles,
  Globe,
  Brain,
  Zap,
  Box,
  FlaskConical,
  HardHat,
  Layers,
  Activity,
  Plane,
  CloudSun,
  Building2,
  Compass,
  ShoppingBag,
  Coins,
  Search,
  Command,
  Maximize2,
  Radio
} from 'lucide-react';
import { ActiveTab } from './HeaderBar';

export type WorkspaceCategory = 'GOVERNANCE' | 'GEOSPATIAL' | 'LIFECYCLE' | 'OPERATIONS' | 'COMMERCE';

interface WorkspaceOrganizerBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenCommandPalette: () => void;
}

export const WorkspaceOrganizerBar: React.FC<WorkspaceOrganizerBarProps> = ({
  activeTab,
  onTabChange,
  onOpenCommandPalette
}) => {
  const workspaces = [
    {
      category: 'GOVERNANCE' as WorkspaceCategory,
      title: 'GOVERNANCE & AGI',
      items: [
        { id: 'orb' as ActiveTab, label: 'Orb Core', icon: Sparkles },
        { id: 'intelligence' as ActiveTab, label: 'Intelligence', icon: Brain },
        { id: 'rsi_agi' as ActiveTab, label: 'RSI / AGI Matrix', icon: Zap }
      ]
    },
    {
      category: 'GEOSPATIAL' as WorkspaceCategory,
      title: 'GEOSPATIAL 3D',
      items: [
        { id: 'world' as ActiveTab, label: '3D World Model', icon: Globe }
      ]
    },
    {
      category: 'LIFECYCLE' as WorkspaceCategory,
      title: 'ARCHOS LIFECYCLE (5 STAGES)',
      items: [
        { id: 'design' as ActiveTab, label: '1. Design', icon: Box },
        { id: 'prove' as ActiveTab, label: '2. Prove', icon: FlaskConical },
        { id: 'build' as ActiveTab, label: '3. Build', icon: HardHat },
        { id: 'experience' as ActiveTab, label: '4. Operate', icon: Layers }
      ]
    },
    {
      category: 'OPERATIONS' as WorkspaceCategory,
      title: 'OPERATIONS & CLIMATE',
      items: [
        { id: 'pulse' as ActiveTab, label: 'Pulse & Carbon', icon: Activity },
        { id: 'live' as ActiveTab, label: 'Live Telemetry', icon: Radio },
        { id: 'skyway' as ActiveTab, label: 'Drone Skyways', icon: Plane },
        { id: 'weather' as ActiveTab, label: 'Weather Radar', icon: CloudSun }
      ]
    },
    {
      category: 'COMMERCE' as WorkspaceCategory,
      title: 'SOVEREIGN FINOPS',
      items: [
        { id: 'valuation' as ActiveTab, label: 'Land Valuation', icon: Building2 },
        { id: 'connectivity' as ActiveTab, label: '7 Emirates Mesh', icon: Compass },
        { id: 'marketplace' as ActiveTab, label: 'Marketplace Hub', icon: ShoppingBag },
        { id: 'finops' as ActiveTab, label: 'FinOps & Router', icon: Coins }
      ]
    }
  ];

  return (
    <div className="z-35 h-9 bg-[#040812]/95 border-b border-[#00e5ff]/15 px-4 flex items-center justify-between text-xs backdrop-blur-xl font-mono-tech select-none overflow-x-auto custom-scrollbar">
      {/* Grouped Workspace Navigation Dock */}
      <div className="flex items-center gap-4 shrink-0">
        {workspaces.map((group, gIdx) => (
          <div key={group.category} className="flex items-center gap-1">
            {gIdx > 0 && <span className="w-px h-3.5 bg-white/10 mx-1" />}
            <span className="text-[9px] text-[#8e8d88] uppercase font-bold tracking-widest mr-1 hidden md:inline">
              {group.title}:
            </span>
            <div className="flex items-center gap-1">
              {group.items.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                      isActive
                        ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                        : 'text-[#8e8d88] hover:text-[#f5f4f0] hover:bg-white/5'
                    }`}
                  >
                    <Icon size={11} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Right Quick Action: Command Palette Launcher */}
      <div className="flex items-center gap-2 pl-4 shrink-0">
        <button
          onClick={onOpenCommandPalette}
          className="px-2.5 py-1 rounded-lg bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border border-[#00e5ff]/40 text-[#00e5ff] text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,229,255,0.2)] cursor-pointer"
        >
          <Command size={11} />
          <span>CMD+K PALETTE</span>
        </button>
      </div>
    </div>
  );
};
