import React, { useState } from 'react';
import { BrainCircuit, Clock3, Globe2, Network, X } from 'lucide-react';
import { UltronCausalGraph } from './UltronCausalGraph';
import { sessionIntelligence } from '../../aios/sessionIntelligence';
import './UltronModeSwitcher.css';

type Mode = 'world' | 'intelligence' | 'agents' | 'replay';
type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onCloseOverlay?: () => void;
};

export const UltronModeSwitcher: React.FC<Props> = ({ mode, onModeChange }) => {
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const activeSession = sessionIntelligence.getActive();

  const select = (next: Mode) => {
    onModeChange(next);
    if (next === 'intelligence') setIntelligenceOpen(true);
    if (next === 'agents') window.dispatchEvent(new CustomEvent('archos:mission-control'));
    if (next === 'replay') window.dispatchEvent(new CustomEvent('archos:mission-replay'));
  };

  return <>
    <nav className="archos-mode-switcher" aria-label="ArchOS intelligence modes">
      <button className={mode === 'world' ? 'is-active' : ''} onClick={() => select('world')}><Globe2/><span>WORLD</span><small>WHAT</small></button>
      <button className={mode === 'intelligence' ? 'is-active' : ''} onClick={() => select('intelligence')}><Network/><span>INTELLIGENCE</span><small>WHY</small></button>
      <button className={mode === 'agents' ? 'is-active' : ''} onClick={() => select('agents')}><BrainCircuit/><span>AGENTS</span><small>HOW</small></button>
      <button className={mode === 'replay' ? 'is-active' : ''} onClick={() => select('replay')}><Clock3/><span>REPLAY</span><small>WHEN</small></button>
    </nav>

    {intelligenceOpen && <section className="archos-intelligence-overlay" role="dialog" aria-label="ArchOS Intelligence Graph">
      <div className="archos-intelligence-backdrop" onClick={() => { setIntelligenceOpen(false); onModeChange('world'); }}/>
      <div className="archos-intelligence-panel">
        <header>
          <div><span className="archos-intelligence-kicker"><Network/> ARCHOS INTELLIGENCE FABRIC</span><h2>Causal intelligence</h2><p>Trace why the system reached a conclusion, then synchronize the graph with mission replay.</p></div>
          <button className="archos-intelligence-close" onClick={() => { setIntelligenceOpen(false); onModeChange('world'); }} aria-label="Close intelligence graph"><X/></button>
        </header>
        <div className="archos-intelligence-body">
          {activeSession ? <UltronCausalGraph sessionId={activeSession.id} /> : <div className="archos-intelligence-empty"><Network/><strong>INTELLIGENCE GRAPH STANDBY</strong><span>Run a mission through JARVIS to populate the causal fabric. The graph will expose agent lineage, evidence flow and replay frames here.</span></div>}
        </div>
        <footer><span>WORLD MODEL ↔ CAUSAL GRAPH ↔ AGENT FABRIC</span><button onClick={() => { setIntelligenceOpen(false); onModeChange('world'); }}>RETURN TO WORLD</button></footer>
      </div>
    </section>}
  </>;
};
