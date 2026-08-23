import React, { useMemo, useState } from 'react';
import { Activity, Bot, Brain, Database, GitBranch, Layers3, Play, Radio, ShieldCheck, Sparkles, Workflow, X, Zap } from 'lucide-react';
import { ARCHOS_MODULES, type ArchOSModule } from '../../aios/moduleRegistry';
import './UltronCommandDeck.css';

const ICONS: Record<string, React.ElementType> = {
  'agent-fabric': Bot, 'world-model': Radio, 'scenario-lab': GitBranch, 'evidence-vault': ShieldCheck,
  'sovereign-memory': Brain, 'autonomy-queue': Workflow, 'system-pulse': Activity, 'extension-mesh': Layers3,
  'causal-explorer': GitBranch, 'decision-theater': Sparkles, 'reality-lens': Radio, 'mission-replay': Database,
};

const METRICS: Record<string, string> = {
  'agent-fabric':'12 agents', 'world-model':'LIVE', 'scenario-lab':'5 scenarios', 'evidence-vault':'CHAINED',
  'sovereign-memory':'INDEXED', 'autonomy-queue':'7 queued', 'system-pulse':'99.98%', 'extension-mesh':'24 slots',
  'causal-explorer':'GRAPH READY', 'decision-theater':'3 decisions', 'reality-lens':'MULTIMODAL', 'mission-replay':'AUDIT READY',
};

export const UltronCommandDeck: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ArchOSModule | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const liveCount = useMemo(() => ARCHOS_MODULES.filter(m => m.status === 'LIVE').length, []);

  const run = (module: ArchOSModule) => {
    setRunning(module.id);
    window.setTimeout(() => setRunning(null), 900);
  };

  return <>
    <button className="command-deck-trigger" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Open ULTRON command deck">
      <span className="deck-trigger-orbit"/><Sparkles size={16}/><span>COMMAND DECK</span><kbd>⌘J</kbd>
    </button>
    {open && <div className="command-deck-shell" role="dialog" aria-label="ULTRON command deck">
      <div className="command-deck-header"><div><span className="deck-eyebrow">ULTRON / AIOS</span><h2>Command Deck</h2><p>{liveCount} intelligence systems active · governed execution enabled</p></div><button onClick={() => setOpen(false)} aria-label="Close command deck"><X size={18}/></button></div>
      <div className="command-deck-strip"><span><i/> FABRIC ONLINE</span><span>EVENT STREAM <b>LIVE</b></span><span>MEMORY <b>GUARDED</b></span><span>INTEGRITY <b>VERIFIED</b></span></div>
      <div className="command-deck-grid">{ARCHOS_MODULES.map(module => { const Icon = ICONS[module.id] ?? Layers3; return <button key={module.id} className={`deck-module ${active?.id === module.id ? 'is-active' : ''}`} onClick={() => setActive(module)}>
        <div className="deck-module-top"><span className="deck-icon"><Icon size={17}/></span><span className={`deck-state deck-state-${module.status.toLowerCase()}`}><i/>{module.status}</span></div>
        <span className="deck-module-eyebrow">{module.domain}</span><strong>{module.name}</strong><span className="deck-module-metric">{METRICS[module.id] ?? module.risk}</span><span className="deck-module-line"/>
      </button>; })}</div>
      {active && <div className="deck-inspector"><div><span className="deck-inspector-eyebrow">MODULE INTERFACE · {active.risk}</span><h3>{active.name}</h3><p>{active.capability}</p></div><div className="deck-inspector-actions"><button onClick={() => run(active)} disabled={running === active.id}><Play size={14}/>{running === active.id ? 'INITIALIZING' : active.requiresApproval ? 'REQUEST ACCESS' : 'OPEN MODULE'}</button><button className="deck-secondary"><Database size={14}/>INSPECT STATE</button></div></div>}
      <div className="deck-footer"><span><Zap size={13}/> AUTONOMY BOUNDARY</span><span>NO UNGOVERNED ACTIONS</span><span>EVENT FABRIC / v1</span></div>
    </div>}
  </>;
};
