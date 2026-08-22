import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Search, ShieldCheck, Volume2, Mic, X } from 'lucide-react';
import { aiosRuntime, type AIOSRuntimeState } from '../../aios/runtime';
import { ultronEventBus } from '../../aios/events';
import { MODULES } from '../../modules/registry';
import { speechService } from '../../services/voice/speechService';

type Entity = { id: string; name: string; type: string; emirate?: string | null; sector?: string | null; confidence?: number | null; latitude?: number | null; longitude?: number | null; source?: string };
type Activity = { kind: 'command' | 'world' | 'agent' | 'intelligence' | 'module' | 'system'; label: string; detail: string; timestamp: number };
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const moduleEntries = Object.entries(MODULES);

const hashPosition = (value: string, index: number) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  const angle = Math.abs(hash) % 628 / 100;
  const radius = 18 + (Math.abs(hash >>> 4) % 2500) / 100;
  return { x: 50 + Math.cos(angle + index * 0.17) * Math.min(radius, 42), y: 50 + Math.sin(angle + index * 0.17) * Math.min(radius * 0.72, 30) };
};

const entityPosition = (entity: Entity, index: number) => {
  if (typeof entity.latitude === 'number' && typeof entity.longitude === 'number') {
    const x = 22 + ((entity.longitude - 51.5) / (56.5 - 51.5)) * 56;
    const y = 78 - ((entity.latitude - 22.5) / (26.5 - 22.5)) * 56;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(12, Math.min(88, y)) };
  }
  return hashPosition(entity.id || entity.name, index);
};

export const UltronOneWorld: React.FC = () => {
  const [runtime, setRuntime] = useState<AIOSRuntimeState>(() => aiosRuntime.getState());
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selected, setSelected] = useState<Entity | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activity, setActivity] = useState<Activity>({ kind: 'system', label: 'WORLD ONLINE', detail: 'Waiting for authoritative World Model data', timestamp: Date.now() });
  const [activityPulse, setActivityPulse] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => aiosRuntime.subscribe(setRuntime), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/world-model/entities?limit=250`);
        if (!response.ok) throw new Error(`World Model HTTP ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;
        setEntities((payload.items ?? []).map((item: any) => ({ id: String(item.entity_id), name: item.name, type: item.entity_type ?? 'entity', emirate: item.emirate, sector: item.sector, confidence: item.confidence, source: payload.source })));
        setActivity({ kind: 'world', label: 'WORLD MODEL', detail: `${payload.items?.length ?? 0} authoritative entities · ${payload.source ?? 'unknown source'}`, timestamp: Date.now() });
      } catch (error) {
        if (!cancelled) setActivity({ kind: 'system', label: 'WORLD MODEL', detail: error instanceof Error ? error.message : 'Unavailable', timestamp: Date.now() });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const push = (next: Activity) => { setActivity(next); setActivityPulse((value) => value + 1); };
    const disposers = [
      ultronEventBus.on('input.command', ({ command }) => push({ kind: 'command', label: 'COMMAND', detail: command.type, timestamp: Date.now() })),
      ultronEventBus.on('world.update', ({ entityId, kind }) => push({ kind: 'world', label: 'WORLD UPDATE', detail: entityId ? `${entityId} · ${kind}` : kind, timestamp: Date.now() })),
      ultronEventBus.on('agent.lifecycle', ({ agentId, status }) => push({ kind: 'agent', label: 'AGENT', detail: `${agentId} · ${status}`, timestamp: Date.now() })),
      ultronEventBus.on('intelligence.lifecycle', ({ phase, status }) => push({ kind: 'intelligence', label: 'INTELLIGENCE', detail: `${phase} · ${status}`, timestamp: Date.now() })),
      ultronEventBus.on('module.lifecycle', ({ moduleId, status }) => push({ kind: 'module', label: 'MODULE', detail: `${moduleId} · ${status}`, timestamp: Date.now() })),
      ultronEventBus.on('system.state', ({ state }) => push({ kind: 'system', label: 'SYSTEM', detail: state, timestamp: Date.now() })),
    ];
    return () => disposers.forEach((dispose) => dispose());
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); inputRef.current?.focus(); }
      if (event.key === 'Escape') { setSelected(null); setSelectedModule(null); inputRef.current?.blur(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visibleEntities = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? entities.filter((entity) => `${entity.name} ${entity.id} ${entity.emirate ?? ''} ${entity.sector ?? ''}`.toLowerCase().includes(normalized)) : entities;
  }, [entities, query]);

  const focusEntity = (entity: Entity) => {
    setSelected(entity);
    setSelectedModule(null);
    aiosRuntime.setContext('world', entity.id, 'world-model');
    ultronEventBus.emit('world.update', { entityId: entity.id, kind: 'entity', timestamp: Date.now(), payload: { source: 'world-model-ui' } });
  };

  const openModule = (moduleId: string) => {
    const definition = MODULES[moduleId];
    if (!definition) return;
    setSelected(null);
    setSelectedModule(moduleId);
    aiosRuntime.setContext('module', moduleId, 'module');
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
    const entity = entities.find((item) => `${item.name} ${item.id} ${item.emirate ?? ''}`.toLowerCase().includes(normalized));
    const module = moduleEntries.find(([id, definition]) => id.toLowerCase().includes(normalized) || definition.title.toLowerCase().includes(normalized));
    if (entity) focusEntity(entity);
    else if (module) openModule(module[0]);
    else { aiosRuntime.setContext('query', value, 'intent'); speechService.speak(`Searching the World Model for ${value}.`); }
    setQuery('');
  };

  const toggleVoice = () => {
    const next = !listening;
    setListening(next);
    aiosRuntime.setSystemState(next ? 'LISTENING' : 'IDLE');
    if (next) speechService.speak('One World interface listening.');
  };

  const toggleSpeech = () => {
    if (speaking) { speechService.stopSpeaking(); setSpeaking(false); return; }
    const message = selected ? `${selected.name}. ${selected.type}. Confidence ${selected.confidence ?? 'not available'}.` : selectedModule ? MODULES[selectedModule]?.title ?? 'Module online.' : 'ULTRON One World online.';
    speechService.speak(message); setSpeaking(true); window.setTimeout(() => setSpeaking(false), 2400);
  };

  const ActiveModule = selectedModule ? MODULES[selectedModule]?.component : null;
  const coreState = runtime.systemState.toLowerCase();

  return (
    <div className={`one-world one-world-state-${coreState} one-world-activity-${activity.kind} ${selectedModule ? 'has-module' : ''}`} onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setPointer({ x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 }); }} onPointerLeave={() => setPointer({ x: 0, y: 0 })}>
      <div className="one-world-field" aria-hidden="true" />
      <div className="one-world-depth-field" aria-hidden="true" />

      <div className="one-world-stars" style={{ transform: `translate3d(${pointer.x * -10}px, ${pointer.y * -7}px, 0)` }}>
        {visibleEntities.map((entity, index) => {
          const position = entityPosition(entity, index);
          const selectedEntity = selected?.id === entity.id;
          return <button key={entity.id} className={`world-star world-star-${entity.type.toLowerCase()} ${selectedEntity ? 'is-selected' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%`, '--star-size': `${selectedEntity ? 5 : 2.5 + Math.min(3, (entity.confidence ?? 0.5) * 3)}px`, '--star-depth': `${Math.max(0.2, entity.confidence ?? 0.5)}` } as React.CSSProperties} onClick={() => focusEntity(entity)} aria-label={`Select ${entity.name}`}>
            <span className="world-star-core" />
            {selectedEntity && <span className="world-star-ring" />}
            {(selectedEntity || (entity.confidence ?? 0) >= 0.85) && <span className="world-star-label">{entity.name}</span>}
          </button>;
        })}
      </div>

      <div className="one-world-module-stars" style={{ transform: `translate3d(${pointer.x * -5}px, ${pointer.y * -3}px, 0)` }} aria-label="ArchOS module constellation">
        {moduleEntries.map(([id, definition], index) => { const angle = (index / moduleEntries.length) * Math.PI * 2 - Math.PI / 2; const x = 50 + Math.cos(angle) * 41; const y = 50 + Math.sin(angle) * 32; return <button key={id} className={`module-star ${selectedModule === id ? 'is-selected' : ''}`} style={{ left: `${x}%`, top: `${y}%` } as React.CSSProperties} onClick={() => openModule(id)} aria-label={`Open ${definition.title}`}><span className="module-star-core" /><span className="module-star-label">{definition.title}</span></button>; })}
      </div>

      <div className="one-world-orbit orbit-one" aria-hidden="true" /><div className="one-world-orbit orbit-two" aria-hidden="true" /><div className="one-world-orbit orbit-three" aria-hidden="true" />
      <div className="one-world-gravity-stream gravity-stream-one" aria-hidden="true" /><div className="one-world-gravity-stream gravity-stream-two" aria-hidden="true" /><div className="one-world-gravity-stream gravity-stream-three" aria-hidden="true" />
      <motion.div key={activityPulse} className="one-world-activity-pulse" initial={{ scale: 0.55, opacity: 0.7 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 1.25, ease: 'easeOut' }} aria-hidden="true" />

      <div className="one-world-black-hole" aria-label="ULTRON AIOS intelligence core"><div className="black-hole-glow" /><div className="black-hole-corona" /><div className="black-hole-accretion" /><div className="black-hole-event-horizon" /><div className="black-hole-center" /><div className="black-hole-label"><strong>ULTRON</strong><span>AIOS · WORLD MODEL</span></div></div>

      <header className="one-world-topbar"><div className="one-world-brand"><span className="brand-dot" /><div><strong>ULTRON</strong><small>ARCHOS INTELLIGENCE OS</small></div></div><div className="one-world-status"><span className={runtime.systemState !== 'IDLE' ? 'status-live' : ''} />{runtime.systemState}<i />{runtime.activeEntityId || 'GLOBAL'}</div></header>
      <div className="one-world-title"><span>ONE WORLD</span><h1>Living intelligence.</h1><p>Authoritative World Model · PostgreSQL</p></div>
      <motion.div className="one-world-activity" key={`${activity.kind}-${activity.timestamp}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}><span className="activity-kicker">{activity.label}</span><span className="activity-detail">{activity.detail}</span></motion.div>

      {selected && <motion.aside className="world-inspector" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}><div className="inspector-kicker">WORLD ENTITY</div><div className="inspector-title">{selected.name}</div><div className="inspector-meta"><span>{selected.type.toUpperCase()}</span><span>{selected.emirate ?? 'UAE'}</span></div><div className="inspector-grid"><div><small>STATUS</small><strong>ACTIVE</strong></div><div><small>CONFIDENCE</small><strong>{selected.confidence == null ? '—' : `${Math.round(selected.confidence * 100)}%`}</strong></div><div><small>SECTOR</small><strong>{selected.sector ?? '—'}</strong></div></div><button className="inspector-close" onClick={() => setSelected(null)}>Dismiss</button></motion.aside>}

      {ActiveModule && <motion.aside className="module-viewport" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}><div className="module-viewport-header"><div><span>MODULE · {MODULES[selectedModule!].stage}</span><strong>{MODULES[selectedModule!].title}</strong></div><button onClick={closeModule} aria-label="Close module"><X /></button></div><div className="module-viewport-body"><ActiveModule /></div></motion.aside>}

      <div className="one-world-command"><Search /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submitQuery()} placeholder="Ask ULTRON anything…" /><kbd>⌘K</kbd></div>
      <div className="one-world-actions"><button className={listening ? 'is-active' : ''} onClick={toggleVoice} aria-label="Toggle voice"><Mic /></button><button className={speaking ? 'is-active' : ''} onClick={toggleSpeech} aria-label="Speak current context"><Volume2 /></button><span className="action-divider" /><span className="world-integrity"><ShieldCheck /> GOVERNED</span></div>
      <footer className="one-world-footer"><span>WORLD MODEL</span><i /><span>{entities.length ? `${entities.length} ENTITIES` : 'NO DATA'}</span><i /><span>{runtime.systemState}</span></footer>
    </div>
  );
};
