import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AudioLines, Brain, ChevronDown, Command, Eye, Globe2, Layers3, LayoutGrid, Mic, MonitorCog, MoreHorizontal, Orbit, Radio, Search, ShieldCheck, X } from 'lucide-react';
import type { ActiveTab } from './HeaderBar';

const primary: Array<{ id: ActiveTab; label: string; icon: React.ElementType; hint: string }> = [
  { id: 'orb', label: 'Core', icon: Orbit, hint: 'System center' },
  { id: 'world', label: 'World', icon: Globe2, hint: 'UAE world model' },
  { id: 'intelligence', label: 'Intel', icon: Brain, hint: 'Intelligence feed' },
  { id: 'experience', label: 'Experience', icon: Layers3, hint: 'Spatial workspace' },
];

const secondary: Array<{ id: ActiveTab; label: string }> = [
  { id: 'rsi_agi', label: 'RSI / AGI Matrix' }, { id: 'design', label: 'Design Studio' },
  { id: 'prove', label: 'Prove Sandbox' }, { id: 'build', label: 'Build 4D' },
  { id: 'pulse', label: 'Pulse & Carbon' }, { id: 'skyway', label: 'Skyway Dispatch' },
  { id: 'weather', label: 'Weather Radar' }, { id: 'valuation', label: 'Real Estate Valuation' },
  { id: 'connectivity', label: 'Connectivity Matrix' }, { id: 'marketplace', label: 'Marketplace Hub' },
  { id: 'finops', label: 'FinOps & Router' }, { id: 'live', label: 'Live Operations' },
];

const clickButton = (predicate: (button: HTMLButtonElement) => boolean) => {
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(predicate)?.click();
};

const findNavButton = (label: string) => clickButton((button) => button.textContent?.trim().toLowerCase().includes(label.toLowerCase()) ?? false);

export const UltronCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('orb');
  const [moreOpen, setMoreOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [camera, setCamera] = useState(false);
  const [copilot, setCopilot] = useState(true);
  const [systemState, setSystemState] = useState('IDLE');
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(now).toUpperCase();
      setTime(`${formatted} GST`);
    };
    update();
    const timer = window.setInterval(update, 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const appRoot = document.querySelector<HTMLElement>('#root > div:first-child');
    if (!appRoot) return;
    const header = appRoot.querySelector<HTMLElement>(':scope > header');
    const subHeader = header?.nextElementSibling as HTMLElement | null;
    const main = appRoot.querySelector<HTMLElement>(':scope > main');
    const bottom = main?.nextElementSibling as HTMLElement | null;
    [header, subHeader, bottom].forEach((element) => { if (element) element.dataset.ultronLegacyChrome = 'hidden'; });
    return () => [header, subHeader, bottom].forEach((element) => { if (element) delete element.dataset.ultronLegacyChrome; });
  }, []);

  const activeSecondary = useMemo(() => secondary.find((item) => item.id === activeTab), [activeTab]);

  const select = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMoreOpen(false);
    findNavButton(tab === 'orb' ? 'Orb Core' : secondary.find((x) => x.id === tab)?.label || primary.find((x) => x.id === tab)?.label || tab);
  };

  const openCommand = () => {
    clickButton((button) => (button.getAttribute('title') || '').toLowerCase().includes('command palette'));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  };

  const toggleVoice = () => {
    setListening((v) => !v);
    clickButton((button) => { const title = (button.getAttribute('title') || '').toLowerCase(); return title.includes('listen') || title.includes('voice'); });
  };

  const toggleVision = () => {
    setCamera((v) => !v);
    clickButton((button) => (button.getAttribute('title') || '').toLowerCase().includes('camera'));
  };

  const toggleCopilot = () => {
    setCopilot((v) => !v);
    clickButton((button) => button.textContent?.toUpperCase().includes('COPILOT DOCK') ?? false);
  };

  return <>
    <header className="ultron-chrome-top" aria-label="ULTRON command center">
      <button className="ultron-brand" onClick={() => select('orb')} aria-label="Open ULTRON core">
        <span className="ultron-brand-mark"><span /></span>
        <span className="ultron-brand-copy"><strong>ULTRON</strong><small>ARCHOS INTELLIGENCE OS</small></span>
      </button>
      <nav className="ultron-primary-nav" aria-label="Primary workspaces">
        {primary.map(({ id, label, icon: Icon, hint }) => <button key={id} className={`ultron-nav-item ${activeTab === id ? 'is-active' : ''}`} onClick={() => select(id)} title={hint}><Icon /><span>{label}</span></button>)}
        <button className={`ultron-nav-item ${activeSecondary ? 'is-active' : ''}`} onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}><MoreHorizontal /><span>{activeSecondary?.label ?? 'More'}</span><ChevronDown className="ultron-nav-chevron" /></button>
      </nav>
      <div className="ultron-top-status"><span className="ultron-status-dot" /><span className="ultron-status-label">{systemState}</span><span className="ultron-time">{time}</span></div>
    </header>

    <AnimatePresence>{moreOpen && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="ultron-more-menu">
      <div className="ultron-more-head"><div><span className="ultron-eyebrow">WORKSPACES</span><strong>Intelligence surfaces</strong></div><button onClick={() => setMoreOpen(false)} aria-label="Close workspace menu"><X /></button></div>
      <div className="ultron-more-grid">{secondary.map(({ id, label }) => <button key={id} className={activeTab === id ? 'is-active' : ''} onClick={() => select(id)}><span>{label}</span><span>↗</span></button>)}</div>
    </motion.div>}</AnimatePresence>

    <aside className="ultron-command-rail" aria-label="ULTRON controls">
      <button className="ultron-rail-command" onClick={openCommand} title="Command palette"><Command /><span>⌘K</span></button>
      <div className="ultron-rail-divider" />
      <button className={`ultron-rail-button ${listening ? 'is-live' : ''}`} onClick={toggleVoice} title="Voice input"><Mic /></button>
      <button className={`ultron-rail-button ${camera ? 'is-live' : ''}`} onClick={toggleVision} title="Vision input"><Eye /></button>
      <button className={`ultron-rail-button ${copilot ? 'is-active' : ''}`} onClick={toggleCopilot} title="JARVIS copilot"><AudioLines /></button>
      <button className="ultron-rail-button" onClick={() => select('live')} title="Live operations"><Radio /></button>
    </aside>

    <div className="ultron-command-dock">
      <button className="ultron-dock-search" onClick={openCommand}><Search /><span>Ask ULTRON anything</span><kbd>⌘ K</kbd></button>
      <div className="ultron-dock-context"><span><Activity /> LIVE</span><span><ShieldCheck /> GOVERNED</span><span><MonitorCog /> AIOS</span></div>
      <button className="ultron-dock-grid" onClick={() => setMoreOpen((v) => !v)} title="Open workspaces"><LayoutGrid /></button>
    </div>
  </>;
};
