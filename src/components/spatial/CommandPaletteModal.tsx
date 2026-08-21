import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  Globe,
  Brain,
  Box,
  FlaskConical,
  HardHat,
  Layers,
  Activity,
  ShoppingBag,
  Coins,
  Compass,
  Zap,
  Plane,
  CloudSun,
  Building2,
  Sliders,
  X,
  ArrowRight,
  Shield,
  Radio,
  Volume2
} from 'lucide-react';
import { ActiveTab } from '../layout/HeaderBar';
import { speechService } from '../../services/voice/speechService';
import { UAE_LANDMARKS } from '../world/UAE3DWorldModel';
import { UAE_INFRASTRUCTURE_PROJECTS } from './InfrastructureHUDOverlay';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'WORKSPACE' | 'LIFECYCLE' | 'GEOSPATIAL' | 'INFRASTRUCTURE' | 'ACTION';
  icon: any;
  targetTab: ActiveTab;
  entityId?: string;
  badge?: string;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Keyboard Listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allCommands: CommandItem[] = useMemo(() => {
    const base: CommandItem[] = [
      {
        id: 'orb-core',
        title: 'Orb Core & Emirates Pulse',
        subtitle: 'Sovereign autonomous central intelligence sphere',
        category: 'WORKSPACE',
        icon: Sparkles,
        targetTab: 'orb',
        badge: 'ORB'
      },
      {
        id: 'world-model-3d',
        title: '3D Geospatial World Model & GIS',
        subtitle: 'Interactive 3D vector map, topographic DEM, building extrusions',
        category: 'GEOSPATIAL',
        icon: Globe,
        targetTab: 'world',
        badge: 'MAPBOX'
      },
      {
        id: 'intelligence-engine',
        title: 'Epistemic Intelligence Engine',
        subtitle: 'FACT, ANALYSIS, FORECAST & SIMULATION verified feeds',
        category: 'WORKSPACE',
        icon: Brain,
        targetTab: 'intelligence',
        badge: 'DUAL AI'
      },
      {
        id: 'rsi-agi-matrix',
        title: 'Real-time Strategic Intelligence (RSI / AGI Matrix)',
        subtitle: 'Meta-Cognitive Self-Reflection, Multi-Horizon Planning, Concept Graph & Swarm Nexus',
        category: 'WORKSPACE',
        icon: Zap,
        targetTab: 'rsi_agi',
        badge: 'AGI / RSI'
      },
      {
        id: 'design-studio',
        title: 'Parametric Design Studio',
        subtitle: 'Stage 1: Procedural generative BIM massing and load analysis',
        category: 'LIFECYCLE',
        icon: Box,
        targetTab: 'design',
        badge: 'DESIGN'
      },
      {
        id: 'prove-sandbox',
        title: 'Simulation Sandbox & Evidence Chain',
        subtitle: 'Stage 2: Cloned digital twin synthetic multi-agent constraint checks',
        category: 'LIFECYCLE',
        icon: FlaskConical,
        targetTab: 'prove',
        badge: 'PROVE'
      },
      {
        id: 'build-monitoring',
        title: '4D Construction Sequencing & Logistics',
        subtitle: 'Stage 3: Drone LiDAR as-built scans, BIM LOD 400, smart escrows',
        category: 'LIFECYCLE',
        icon: HardHat,
        targetTab: 'build',
        badge: 'BUILD'
      },
      {
        id: 'experience-tower',
        title: 'Tower B-4471 3D Exploded Viewport',
        subtitle: 'Stage 4: Structural core, MEP risers, curtain wall disassembly',
        category: 'LIFECYCLE',
        icon: Layers,
        targetTab: 'experience',
        badge: 'OPERATE'
      },
      {
        id: 'pulse-vitality',
        title: 'ArchOS Pulse & Living Carbon Ledger',
        subtitle: 'Building vitality score (0-100), sensor recalibration, carbon offsets',
        category: 'WORKSPACE',
        icon: Activity,
        targetTab: 'pulse',
        badge: 'ESG'
      },
      {
        id: 'skyway-drone',
        title: 'Autonomous Drone Skyway Dispatcher',
        subtitle: 'Smart airspace corridors, vertiport flight allocations & conflict resolution',
        category: 'WORKSPACE',
        icon: Plane,
        targetTab: 'skyway',
        badge: 'DRONES'
      },
      {
        id: 'weather-radar',
        title: 'Atmospheric & Sandstorm Radar',
        subtitle: 'Thermal gradients, dust tracking, cloud-seeding readiness',
        category: 'WORKSPACE',
        icon: CloudSun,
        targetTab: 'weather',
        badge: 'RADAR'
      },
      {
        id: 'real-estate-valuation',
        title: 'Sovereign Land Parcel & Plot Valuation',
        subtitle: 'FAR optimizer, yield projections, DLD transaction benchmarks',
        category: 'WORKSPACE',
        icon: Building2,
        targetTab: 'valuation',
        badge: 'PROPTECH'
      },
      {
        id: 'emirates-connectivity',
        title: '7 Emirates Sovereign Inter-Mesh',
        subtitle: 'Cross-Emirate GDP, population, logistics & energy telemetry',
        category: 'WORKSPACE',
        icon: Compass,
        targetTab: 'connectivity',
        badge: 'PAN-UAE'
      },
      {
        id: 'marketplace-hub',
        title: 'ArchOS Ecosystem & Marketplace',
        subtitle: '6 business monetization models, Academy blueprints, material procurement',
        category: 'WORKSPACE',
        icon: ShoppingBag,
        targetTab: 'marketplace',
        badge: 'ECOSYSTEM'
      },
      {
        id: 'finops-router',
        title: 'FinOps & Model Router Studio',
        subtitle: 'Multi-tenant compute allocations, token burn, quantum zero-trust keys',
        category: 'WORKSPACE',
        icon: Coins,
        targetTab: 'finops',
        badge: 'FINOPS'
      }
    ];

    // Add UAE Landmarks as quick jump targets
    UAE_LANDMARKS.forEach((l) => {
      base.push({
        id: `landmark-${l.id}`,
        title: l.name,
        subtitle: `${l.district} · Height: ${l.height}`,
        category: 'GEOSPATIAL',
        icon: Globe,
        targetTab: 'world',
        entityId: l.id,
        badge: 'LANDMARK'
      });
    });

    // Add Infrastructure projects
    UAE_INFRASTRUCTURE_PROJECTS.forEach((p) => {
      base.push({
        id: `infra-${p.id}`,
        title: p.name,
        subtitle: `${p.emirate} · ${p.budgetAed} · ${p.completionPct}% As-Built`,
        category: 'INFRASTRUCTURE',
        icon: Zap,
        targetTab: 'world',
        entityId: p.id,
        badge: p.category
      });
    });

    return base;
  }, []);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const lower = query.toLowerCase();
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.subtitle.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower) ||
        (c.badge && c.badge.toLowerCase().includes(lower))
    );
  }, [allCommands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: CommandItem) => {
    onNavigate(item.targetTab, item.entityId);
    speechService.speak(`Accessing ${item.title}.`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md font-mono-tech select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-2xl bg-[#060c18]/95 border border-[#00e5ff]/50 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.25)] overflow-hidden flex flex-col backdrop-blur-2xl"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-[#00e5ff]/20 bg-[#091220]">
              <Search className="w-5 h-5 text-[#00e5ff] mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search anything across UAE AIOS: workspaces, 3D landmarks, lifecycle stages, infrastructure..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm text-[#f5f4f0] placeholder-[#545350] focus:outline-none"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 text-[#8e8d88] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Filter Categories */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-[#040810] border-b border-white/5 text-[10px] text-[#8e8d88] overflow-x-auto">
              <span>Shortcuts:</span>
              <button onClick={() => setQuery('')} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[#00e5ff]">All</button>
              <button onClick={() => setQuery('LIFECYCLE')} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400">Lifecycle (5 Stages)</button>
              <button onClick={() => setQuery('GEOSPATIAL')} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-sky-400">3D GIS & Landmarks</button>
              <button onClick={() => setQuery('INFRASTRUCTURE')} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-amber-400">Infrastructure HUD</button>
            </div>

            {/* Command List */}
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-[#8e8d88] text-xs">
                  No modules or commands matching &quot;{query}&quot;
                </div>
              ) : (
                filteredCommands.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#00e5ff]/20 border border-[#00e5ff]/60 shadow-[0_0_15px_rgba(0,229,255,0.2)] text-white'
                          : 'hover:bg-white/5 text-[#8e8d88] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                              : 'bg-white/5 text-[#00e5ff]'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#f5f4f0]'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-[#8e8d88] truncate">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.badge && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              isSelected
                                ? 'bg-black/40 text-[#00e5ff] border border-[#00e5ff]/50'
                                : 'bg-white/5 text-[#8e8d88]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ArrowRight
                          size={14}
                          className={`transition-transform ${isSelected ? 'translate-x-1 text-[#00e5ff]' : 'opacity-0'}`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Navigation Hints */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#040810] border-t border-white/5 text-[10px] text-[#8e8d88]">
              <div className="flex items-center gap-3">
                <span>Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">↓</kbd> to navigate</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">Enter</kbd> to select</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">Esc</kbd> to close</span>
              </div>
              <span className="text-[#00e5ff] font-bold">JARVIS COMMAND MATRIX</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
