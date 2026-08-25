import React from 'react';
import { Activity, BrainCircuit, Eye, GitBranch, Globe2, Radio, Sparkles, Timer } from 'lucide-react';
import './UltronAdaptiveHud.css';

type Mode = 'world' | 'intelligence' | 'agents' | 'replay';

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
};

const modes: Array<{ id: Mode; label: string; question: string; icon: React.ReactNode }> = [
  { id: 'world', label: 'WORLD', question: 'WHAT', icon: <Globe2 /> },
  { id: 'intelligence', label: 'INTELLIGENCE', question: 'WHY', icon: <GitBranch /> },
  { id: 'agents', label: 'AGENTS', question: 'HOW', icon: <BrainCircuit /> },
  { id: 'replay', label: 'REPLAY', question: 'WHEN', icon: <Timer /> },
];

export const UltronAdaptiveHud: React.FC<Props> = ({ mode, onModeChange }) => {
  const active = modes.find((item) => item.id === mode) ?? modes[0];

  const select = (next: Mode) => {
    onModeChange(next);
    if (next === 'agents') window.dispatchEvent(new CustomEvent('archos:mission-control'));
    if (next === 'replay') window.dispatchEvent(new CustomEvent('archos:mission-replay'));
  };

  return (
    <div className="archos-adaptive-hud" aria-label="ArchOS adaptive intelligence interface">
      <div className="archos-adaptive-topline">
        <div className="archos-brand-lockup">
          <span className="archos-brand-mark"><Eye /></span>
          <span><strong>ARCHOS</strong><small>ADAPTIVE INTELLIGENCE</small></span>
        </div>
        <div className="archos-world-state"><span className="archos-live-dot" /> WORLD MODEL <b>LIVE</b></div>
      </div>

      <div className="archos-cognitive-dock">
        <div className="archos-dock-context">
          <span className="archos-dock-kicker"><Sparkles /> CONTEXTUAL REALITY</span>
          <strong>{active.label}</strong>
          <small>{active.question} · INTERFACE ADAPTS TO INTENT</small>
        </div>
        <div className="archos-dock-modes" role="tablist" aria-label="ArchOS cognitive layers">
          {modes.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={mode === item.id}
              className={mode === item.id ? 'is-active' : ''}
              onClick={() => select(item.id)}
              title={`${item.label} · ${item.question}`}
            >
              {item.icon}
              <span>{item.label}</span>
              <small>{item.question}</small>
            </button>
          ))}
        </div>
        <div className="archos-dock-status">
          <span><Radio /> JARVIS</span>
          <span><Activity /> FABRIC ONLINE</span>
        </div>
      </div>
    </div>
  );
};
