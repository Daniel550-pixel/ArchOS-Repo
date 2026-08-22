import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Command, Mic, Search, ShieldCheck, Volume2, X } from 'lucide-react';
import { aiosRuntime, type AIOSRuntimeState } from '../../aios/runtime';
import { ultronEventBus } from '../../aios/events';
import { MODULES } from '../../modules/registry';
import { speechService } from '../../services/voice/speechService';

const STAR_COUNT = 72;

type WorldStar = {
  id: string;
  name: string;
  type: 'city' | 'infrastructure' | 'signal' | 'region';
  x: number;
  y: number;
  depth: number;
  size: number;
  importance: number;
};

const stars: WorldStar[] = [
  { id: 'dubai', name: 'Dubai', type: 'city', x: 63, y: 43, depth: 0.92, size: 6, importance: 1 },
  { id: 'abu-dhabi', name: 'Abu Dhabi', type: 'city', x: 39, y: 58, depth: 0.86, size: 5, importance: 0.95 },
  { id: 'sharjah', name: 'Sharjah', type: 'city', x: 69, y: 31, depth: 0.72, size: 4, importance: 0.8 },
  { id: 'fujairah', name: 'Fujairah', type: 'city', x: 82, y: 51, depth: 0.65, size: 3.5, importance: 0.65 },
  { id: 'al-ain', name: 'Al Ain', type: 'city', x: 58, y: 70, depth: 0.62, size: 3.5, importance: 0.6 },
  { id: 'port-jebel-ali', name: 'Jebel Ali Port', type: 'infrastructure', x: 55, y: 49, depth: 0.54, size: 3, importance: 0.55 },
  { id: 'metro', name: 'Dubai Metro', type: 'infrastructure', x: 71, y: 45, depth: 0.48, size: 2.8, importance: 0.5 },
  { id: 'khalifa-port', name: 'Khalifa Port', type: 'infrastructure', x: 31, y: 53, depth: 0.45, size: 2.8, importance: 0.5 },
  { id: 'masdar', name: 'Masdar City', type: 'signal', x: 42, y: 51, depth: 0.4, size: 2.5, importance: 0.42 },
  { id: 'uae', name: 'United Arab Emirates', type: 'region', x: 50, y: 48, depth: 0.28, size: 2, importance: 0.35 },
];

const generatedStars: WorldStar[] = Array.from({ length: STAR_COUNT }, (_, index) => {
  const angle = index * 2.399963;
  const radius = 15 + ((index * 17) % 43);
  return {
    id: `field-${index}`,
    name: `World signal ${index + 1}`,
    type: 'signal',
    x: 50 + Math.cos(angle) * radius * 1.42,
    y: 50 + Math.sin(angle) * radius * 0.72,
    depth: 0.08 + ((index * 13) % 90) / 100,
    size: 1 + ((index * 7) % 3) * 0.45,
    importance: 0.1 + ((index * 11) % 80) / 100,
  };
});

const allStars = [...generatedStars, ...stars];
const moduleEntries = Object.entries(MODULES);

export const UltronOneWorld: React.FC = () => {
  const [runtime, setRuntime] = useState<AIOSRuntimeState>(() => aiosRuntime.getState());
  const [selected, setSelected] = useState<WorldStar | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => aiosRuntime.subscribe(setRuntime), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setSelected(null);
        setSelectedModule(null);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visibleStars = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? allStars.filter((star) => star.name.toLowerCase().includes(normalized)) : allStars;
  }, [query]);

  const focusStar = (star: WorldStar) => {
    setSelected(star);
    setSelectedModule(null);
    aiosRuntime.setContext('world', star.id, 'world-model');
    ultronEventBus.emit('world.update', { entityId: star.id, kind: 'entity', timestamp: Date.now(), payload: { source: 'one-world' } });
    speechService.speak(`${star.name} selected.`);
  };

  const focusModule = (moduleId: string) => {
    const definition = MODULES[moduleId];
    if (!definition) return;
    setSelected(null);
    setSelectedModule(moduleId);
    aiosRuntime.setContext('module', moduleId, 'module');
    ultronEventBus.emit('module.lifecycle', { moduleId, status: 'focused', timestamp: Date.now() });
  };

  const openModule = (moduleId: string) => {
    focusModule(moduleId);
    ultronEventBus.emit('module.lifecycle', { moduleId, status: 'opened', timestamp: Date.now() });
  };

  const closeModule = () => {
    if (selectedModule) ultronEventBus.emit('module.lifecycle', { moduleId: selectedModule, status: 'closed', timestamp: Date.now() });
    setSelectedModule(null);
    aiosRuntime.setContext('world', undefined, 'world-model');
  };

  const submitQuery = () => {
    const value = query.trim();
    if (!value) return;
    const normalized = value.toLowerCase();
    const worldMatch = allStars.find((star) => star.name.toLowerCase().includes(normalized));
    const moduleMatch = moduleEntries.find(([id, definition]) => id.includes(normalized) || definition.title.toLowerCase().includes(normalized));
    if (worldMatch) focusStar(worldMatch);
    else if (moduleMatch) openModule(moduleMatch[0]);
    else speechService.speak(`Searching the world model for ${value}.`);
    aiosRuntime.setContext(worldMatch ? 'world' : 'query', value, worldMatch ? 'world-model' : 'intent');
    setQuery('');
  };

  const toggleVoice = () => {
    const next = !listening;
    setListening(next);
    aiosRuntime.setSystemState(next ? 'LISTENING' : 'IDLE');
    if (next) speechService.speak('One World interface listening.');
  };

  const toggleSpeech = () => {
    if (speaking) {
      speechService.stopSpeaking();
      setSpeaking(false);
      return;
    }
    speechService.speak(selected ? `${selected.name}. ${selected.type}. World model entity.` : selectedModule ? MODULES[selectedModule]?.title ?? 'Module online.' : 'ULTRON One World online.');
    setSpeaking(true);
    window.setTimeout(() => setSpeaking(false), 2200);
  };

  const ActiveModule = selectedModule ? MODULES[selectedModule]?.component : null;

  return (
    <div className={`one-world ${selectedModule ? 'has-module' : ''}`} onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setPointer({ x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 }); }} onPointerLeave={() => setPointer({ x: 0, y: 0 })}>
      <div className="one-world-field" aria-hidden="true" />
      <div className="one-world-stars" style={{ transform: `translate3d(${pointer.x * -10}px, ${pointer.y * -7}px, 0)` }}>
        {visibleStars.map((star) => (
          <button key={star.id} className={`world-star world-star-${star.type} ${selected?.id === star.id ? 'is-selected' : ''}`} style={{ left: `${star.x}%`, top: `${star.y}%`, '--star-size': `${star.size}px`, '--star-depth': star.depth } as React.CSSProperties} onClick={() => focusStar(star)} aria-label={`Select ${star.name}`}>
            <span className="world-star-core" />
            {selected?.id === star.id && <span className="world-star-ring" />}
            {star.importance > 0.75 && <span className="world-star-label">{star.name}</span>}
          </button>
        ))}
      </div>

      <div className="one-world-module-stars" style={{ transform: `translate3d(${pointer.x * -5}px, ${pointer.y * -3}px, 0)` }} aria-label="ArchOS module constellation">
        {moduleEntries.map(([id, definition], index) => {
          const angle = (index / moduleEntries.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + Math.cos(angle) * 41;
          const y = 50 + Math.sin(angle) * 32;
          return (
            <button key={id} className={`module-star ${selectedModule === id ? 'is-selected' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => openModule(id)} aria-label={`Open ${definition.title}`}>
              <span className="module-star-core" />
              <span className="module-star-label">{definition.title}</span>
            </button>
          );
        })}
      </div>

      <div className="one-world-orbit orbit-one" aria-hidden="true" /><div className="one-world-orbit orbit-two" aria-hidden="true" /><div className="one-world-orbit orbit-three" aria-hidden="true" />

      <div className="one-world-black-hole" aria-label="ULTRON AIOS intelligence core">
        <div className="black-hole-glow" /><div className="black-hole-accretion" /><div className="black-hole-event-horizon" /><div className="black-hole-center" />
        <div className="black-hole-label"><strong>ULTRON</strong><span>AIOS · WORLD MODEL</span></div>
      </div>

      <header className="one-world-topbar"><div className="one-world-brand"><span className="brand-dot" /><div><strong>ULTRON</strong><small>ARCHOS INTELLIGENCE OS</small></div></div><div className="one-world-status"><span className={runtime.systemState !== 'IDLE' ? 'status-live' : ''} />{runtime.systemState}<i />{runtime.activeEntityId || 'GLOBAL'}</div></header>
      <div className="one-world-title"><span>ONE WORLD</span><h1>Living intelligence.</h1><p>Every ArchOS capability orbits one world model.</p></div>

      {selected && <motion.aside className="world-inspector" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}><div className="inspector-kicker">WORLD ENTITY</div><div className="inspector-title">{selected.name}</div><div className="inspector-meta"><span>{selected.type.toUpperCase()}</span><span>LIVE MODEL</span></div><div className="inspector-grid"><div><small>STATUS</small><strong>ACTIVE</strong></div><div><small>CONFIDENCE</small><strong>—</strong></div><div><small>SIGNALS</small><strong>—</strong></div></div><button className="inspector-close" onClick={() => setSelected(null)}>Dismiss</button></motion.aside>}

      {ActiveModule && <motion.aside className="module-viewport" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}><div className="module-viewport-header"><div><span>MODULE · {MODULES[selectedModule!].stage}</span><strong>{MODULES[selectedModule!].title}</strong></div><button onClick={closeModule} aria-label="Close module"><X /></button></div><div className="module-viewport-body"><ActiveModule /></div></motion.aside>}

      <div className="one-world-command"><Search /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submitQuery()} placeholder="Ask ULTRON anything" aria-label="Ask ULTRON anything" /><kbd><Command />K</kbd></div>
      <div className="one-world-actions"><button className={listening ? 'is-active' : ''} onClick={toggleVoice} title="Voice"><Mic /></button><button className={speaking ? 'is-active' : ''} onClick={toggleSpeech} title="ULTRON voice"><Volume2 /></button><span className="action-divider" /><span className="world-integrity"><ShieldCheck /> GOVERNED</span></div>
      <footer className="one-world-footer"><span>WORLD MODEL</span><i /><span>{allStars.length} WORLD OBJECTS</span><i /><span>{moduleEntries.length} MODULES</span><i /><span>SPATIAL INTELLIGENCE</span></footer>
    </div>
  );
};
