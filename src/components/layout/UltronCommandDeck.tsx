import React, { useMemo, useState } from 'react';
import { Activity, Bot, Brain, Database, GitBranch, Layers3, Play, Radio, ShieldCheck, Sparkles, Workflow, X, Zap } from 'lucide-react';
import './UltronCommandDeck.css';

type Module = {
  id: string;
  label: string;
  eyebrow: string;
  icon: React.ElementType;
  metric: string;
  state: 'LIVE' | 'READY' | 'GUARDED';
  description: string;
};

const MODULES: Module[] = [
  { id: 'orchestrator', label: 'Agent Fabric', eyebrow: 'ORCHESTRATION', icon: Bot, metric: '12 agents', state: 'LIVE', description: 'Route intent across specialist agents with governed execution and verification.' },
  { id: 'world', label: 'World Model', eyebrow: 'SPATIAL / TEMPORAL', icon: Radio, metric: 'LIVE', state: 'LIVE', description: 'Navigate entities, signals, dependencies and continuously changing world state.' },
  { id: 'simulation', label: 'Scenario Lab', eyebrow: 'PREDICTION ENGINE', icon: GitBranch, metric: '5 scenarios', state: 'READY', description: 'Branch the current world state into what-if futures without mutating reality.' },
  { id: 'evidence', label: 'Evidence Vault', eyebrow: 'TRUST / PROVENANCE', icon: ShieldCheck, metric: 'CHAINED', state: 'GUARDED', description: 'Inspect evidence provenance, corroboration, confidence and integrity state.' },
  { id: 'memory', label: 'Sovereign Memory', eyebrow: 'LONG-TERM CONTEXT', icon: Brain, metric: 'INDEXED', state: 'GUARDED', description: 'Surface durable context while preserving explicit governance boundaries.' },
  { id: 'automation', label: 'Autonomy Queue', eyebrow: 'WORKFLOWS', icon: Workflow, metric: '7 queued', state: 'READY', description: 'Compose repeatable agent workflows with approval gates and rollback points.' },
  { id: 'observability', label: 'System Pulse', eyebrow: 'RUNTIME', icon: Activity, metric: '99.98%', state: 'LIVE', description: 'Expose runtime health, latency, event throughput and degraded subsystems.' },
  { id: 'extensions', label: 'Extension Mesh', eyebrow: 'ADD-ONS', icon: Layers3, metric: '24 slots', state: 'READY', description: 'Discover isolated modules and connectors without coupling them to the core.' },
];

export const UltronCommandDeck: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Module | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const liveCount = useMemo(() => MODULES.filter(m => m.state === 'LIVE').length, []);

  const run = (module: Module) => {
    setRunning(module.id);
    window.setTimeout(() => setRunning(null), 900);
  };

  return (
    <>
      <button className="command-deck-trigger" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Open ULTRON command deck">
        <span className="deck-trigger-orbit" /><Sparkles size={16}/><span>COMMAND DECK</span><kbd>⌘J</kbd>
      </button>
      {open && (
        <div className="command-deck-shell" role="dialog" aria-label="ULTRON command deck">
          <div className="command-deck-header">
            <div><span className="deck-eyebrow">ULTRON / AIOS</span><h2>Command Deck</h2><p>{liveCount} intelligence systems active · governed execution enabled</p></div>
            <button onClick={() => setOpen(false)} aria-label="Close command deck"><X size={18}/></button>
          </div>
          <div className="command-deck-strip"><span><i/> FABRIC ONLINE</span><span>EVENT STREAM <b>LIVE</b></span><span>MEMORY <b>GUARDED</b></span><span>INTEGRITY <b>VERIFIED</b></span></div>
          <div className="command-deck-grid">
            {MODULES.map(module => { const Icon = module.icon; return (
              <button key={module.id} className={`deck-module ${active?.id === module.id ? 'is-active' : ''}`} onClick={() => setActive(module)}>
                <div className="deck-module-top"><span className="deck-icon"><Icon size={17}/></span><span className={`deck-state deck-state-${module.state.toLowerCase()}`}><i/>{module.state}</span></div>
                <span className="deck-module-eyebrow">{module.eyebrow}</span><strong>{module.label}</strong><span className="deck-module-metric">{module.metric}</span>
                <span className="deck-module-line" />
              </button>
            ); })}
          </div>
          {active && (
            <div className="deck-inspector">
              <div><span className="deck-inspector-eyebrow">MODULE INTERFACE</span><h3>{active.label}</h3><p>{active.description}</p></div>
              <div className="deck-inspector-actions"><button onClick={() => run(active)} disabled={running === active.id}><Play size={14}/>{running === active.id ? 'INITIALIZING' : 'OPEN MODULE'}</button><button className="deck-secondary"><Database size={14}/>INSPECT STATE</button></div>
            </div>
          )}
          <div className="deck-footer"><span><Zap size={13}/> AUTONOMY BOUNDARY</span><span>NO UNGOVERNED ACTIONS</span><span>EVENT FABRIC / v1</span></div>
        </div>
      )}
    </>
  );
};
