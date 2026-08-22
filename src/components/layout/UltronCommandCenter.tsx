import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AudioLines,
  Brain,
  ChevronDown,
  Command,
  Eye,
  Globe2,
  Layers3,
  LayoutGrid,
  Mic,
  MonitorCog,
  MoreHorizontal,
  Orbit,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { ActiveTab } from './HeaderBar';
import type { SystemState } from '../../types';

type Props = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  systemState: SystemState;
  isListening: boolean;
  isCameraActive: boolean;
  onToggleListening: () => void;
  onToggleCamera: () => void;
  onOpenCommandPalette: () => void;
  onToggleCopilot: () => void;
  copilotOpen: boolean;
  currentTimeStr: string;
};

const primary: Array<{ id: ActiveTab; label: string; icon: React.ElementType; hint: string }> = [
  { id: 'orb', label: 'Core', icon: Orbit, hint: 'System center' },
  { id: 'world', label: 'World', icon: Globe2, hint: 'UAE world model' },
  { id: 'intelligence', label: 'Intel', icon: Brain, hint: 'Intelligence feed' },
  { id: 'experience', label: 'Experience', icon: Layers3, hint: 'Spatial workspace' },
];

const secondary: Array<{ id: ActiveTab; label: string }> = [
  { id: 'rsi_agi', label: 'RSI / AGI Matrix' },
  { id: 'design', label: 'Design Studio' },
  { id: 'prove', label: 'Prove Sandbox' },
  { id: 'build', label: 'Build 4D' },
  { id: 'pulse', label: 'Pulse & Carbon' },
  { id: 'skyway', label: 'Skyway Dispatch' },
  { id: 'weather', label: 'Weather Radar' },
  { id: 'valuation', label: 'Real Estate Valuation' },
  { id: 'connectivity', label: 'Connectivity Matrix' },
  { id: 'marketplace', label: 'Marketplace Hub' },
  { id: 'finops', label: 'FinOps & Router' },
  { id: 'live', label: 'Live Operations' },
];

export const UltronCommandCenter: React.FC<Props> = ({
  activeTab,
  onTabChange,
  systemState,
  isListening,
  isCameraActive,
  onToggleListening,
  onToggleCamera,
  onOpenCommandPalette,
  onToggleCopilot,
  copilotOpen,
  currentTimeStr,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeSecondary = useMemo(() => secondary.find((item) => item.id === activeTab), [activeTab]);

  const select = (tab: ActiveTab) => {
    onTabChange(tab);
    setMoreOpen(false);
  };

  return (
    <>
      <header className="ultron-chrome-top" aria-label="ULTRON command center">
        <button className="ultron-brand" onClick={() => select('orb')} aria-label="Open ULTRON core">
          <span className="ultron-brand-mark"><span /></span>
          <span className="ultron-brand-copy">
            <strong>ULTRON</strong>
            <small>ARCHOS INTELLIGENCE OS</small>
          </span>
        </button>

        <div className="ultron-primary-nav">
          {primary.map(({ id, label, icon: Icon, hint }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                className={`ultron-nav-item ${active ? 'is-active' : ''}`}
                onClick={() => select(id)}
                title={hint}
              >
                <Icon />
                <span>{label}</span>
              </button>
            );
          })}
          <button
            className={`ultron-nav-item ${activeSecondary ? 'is-active' : ''}`}
            onClick={() => setMoreOpen((value) => !value)}
            aria-expanded={moreOpen}
          >
            <MoreHorizontal />
            <span>{activeSecondary?.label ?? 'More'}</span>
            <ChevronDown className="ultron-nav-chevron" />
          </button>
        </div>

        <div className="ultron-top-status">
          <span className="ultron-status-dot" />
          <span className="ultron-status-label">{systemState}</span>
          <span className="ultron-time">{currentTimeStr}</span>
        </div>
      </header>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="ultron-more-menu"
          >
            <div className="ultron-more-head">
              <div>
                <span className="ultron-eyebrow">WORKSPACES</span>
                <strong>Intelligence surfaces</strong>
              </div>
              <button onClick={() => setMoreOpen(false)} aria-label="Close workspace menu"><X /></button>
            </div>
            <div className="ultron-more-grid">
              {secondary.map(({ id, label }) => (
                <button key={id} className={activeTab === id ? 'is-active' : ''} onClick={() => select(id)}>
                  <span>{label}</span>
                  <ChevronDown />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="ultron-command-rail" aria-label="ULTRON controls">
        <button className="ultron-rail-command" onClick={onOpenCommandPalette} title="Command palette">
          <Command />
          <span>⌘K</span>
        </button>
        <div className="ultron-rail-divider" />
        <button className={`ultron-rail-button ${isListening ? 'is-live' : ''}`} onClick={onToggleListening} title="Voice input">
          <Mic />
        </button>
        <button className={`ultron-rail-button ${isCameraActive ? 'is-live' : ''}`} onClick={onToggleCamera} title="Vision input">
          <Eye />
        </button>
        <button className={`ultron-rail-button ${copilotOpen ? 'is-active' : ''}`} onClick={onToggleCopilot} title="JARVIS copilot">
          <AudioLines />
        </button>
        <button className="ultron-rail-button" onClick={() => select('live')} title="Live operations">
          <Radio />
        </button>
      </aside>

      <div className="ultron-command-dock">
        <button className="ultron-dock-search" onClick={onOpenCommandPalette}>
          <Search />
          <span>Ask ULTRON anything</span>
          <kbd>⌘ K</kbd>
        </button>
        <div className="ultron-dock-context">
          <span><Activity /> LIVE</span>
          <span><ShieldCheck /> GOVERNED</span>
          <span><MonitorCog /> AIOS</span>
        </div>
        <button className="ultron-dock-grid" onClick={() => setMoreOpen((value) => !value)} title="Open workspaces">
          <LayoutGrid />
        </button>
      </div>
    </>
  );
};
