import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, Network, Radio, Search, ShieldCheck, Sparkles, Target, X, Command, Activity, Map, Cpu, Play, Loader2 } from 'lucide-react';
import { UAE3DWorldModel, UAE_LANDMARKS, type ActiveLayer, type LandmarkPOI, type LightingMode } from '../world/UAE3DWorldModel';
import ArchosIntelligenceGraph from '../experience/ArchosIntelligenceGraph';
import './ArchOSUnifiedSpatialCanvas.css';

type SpatialMode = 'WORLD' | 'INTELLIGENCE' | 'SIMULATION';
type CommandStatus = 'READY' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

/**
 * Canonical ArchOS spatial surface.
 * Models/providers remain behind the experience layer and are intentionally
 * absent from the visual identity.
 *
 * The command surface is a real runtime boundary: commands are submitted to
 * the authoritative J.A.R.V.I.S. endpoint and the returned lifecycle state is
 * published back into the experience layer for spatial UI consumers.
 */
export const ArchOSUnifiedSpatialCanvas: React.FC = () => {
  const [lightingMode, setLightingMode] = useState<LightingMode>('CYBER');
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('ALL');
  const [sliceSeparation, setSliceSeparation] = useState(0.85);
  const [cameraPreset, setCameraPreset] = useState<'COMMAND' | 'ORBIT' | 'NADIR' | 'STREET'>('COMMAND');
  const [selectedLandmarkId, setSelectedLandmarkId] = useState('burj-khalifa');
  const [showFabric, setShowFabric] = useState(true);
  const [query, setQuery] = useState('');
  const [command, setCommand] = useState('');
  const [mode, setMode] = useState<SpatialMode>('WORLD');
  const [commandCount, setCommandCount] = useState(0);
  const [lastCommand, setLastCommand] = useState('SYSTEM READY');
  const [commandStatus, setCommandStatus] = useState<CommandStatus>('READY');
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);

  const selectedLandmark = useMemo(() => UAE_LANDMARKS.find((landmark) => landmark.id === selectedLandmarkId), [selectedLandmarkId]);
  const filteredLandmarks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return UAE_LANDMARKS;
    return UAE_LANDMARKS.filter((landmark) => `${landmark.name} ${landmark.emirate} ${landmark.district}`.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    const onCommandExecuted = (event: Event) => {
      const detail = (event as CustomEvent<{ command?: string; taskId?: string; status?: CommandStatus }>).detail;
      if (detail?.command) setLastCommand(detail.command);
      if (detail?.taskId) setLastTaskId(detail.taskId);
      if (detail?.status) setCommandStatus(detail.status);
    };
    window.addEventListener('archos:command-executed', onCommandExecuted);
    return () => window.removeEventListener('archos:command-executed', onCommandExecuted);
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('.archos-spatial-search input')?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const executeCommand = async () => {
    const value = command.trim();
    if (!value || commandStatus === 'EXECUTING') return;

    setCommandStatus('EXECUTING');
    setLastCommand(value);
    setCommandCount((count) => count + 1);

    window.dispatchEvent(new CustomEvent('archos:command', {
      detail: { command: value, source: 'spatial-command-bar', timestamp: Date.now() },
    }));

    try {
      const response = await fetch('/api/v1/jarvis/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: value,
          actor: 'operator',
          tenant_id: 'uae-sovereign',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail || `J.A.R.V.I.S. request failed (${response.status})`);
      }

      const result = await response.json();
      const taskId = typeof result?.task_id === 'string' ? result.task_id : undefined;
      const verificationStatus = typeof result?.verification_status === 'string' ? result.verification_status : undefined;

      if (taskId) setLastTaskId(taskId);
      setCommandStatus('COMPLETED');
      setLastCommand(verificationStatus ? `${value} · ${verificationStatus}` : value);

      window.dispatchEvent(new CustomEvent('archos:command-executed', {
        detail: {
          command: value,
          taskId,
          status: 'COMPLETED',
          verificationStatus,
          result,
          source: 'jarvis-runtime',
          timestamp: Date.now(),
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown runtime error';
      setCommandStatus('FAILED');
      setLastCommand(`${value} · FAILED`);

      window.dispatchEvent(new CustomEvent('archos:command-executed', {
        detail: {
          command: value,
          status: 'FAILED',
          error: message,
          source: 'jarvis-runtime',
          timestamp: Date.now(),
        },
      }));
    } finally {
      setCommand('');
    }
  };

  const commandStateLabel = commandStatus === 'EXECUTING'
    ? 'J.A.R.V.I.S. PROCESSING'
    : lastTaskId
      ? `${commandStatus} · ${lastTaskId}`
      : lastCommand;

  return (
    <section className="archos-unified-spatial" aria-label="ArchOS unified spatial intelligence canvas">
      <div className="archos-unified-spatial__canvas">
        <UAE3DWorldModel lightingMode={lightingMode} activeLayer={activeLayer} sliceSeparation={sliceSeparation} selectedLandmarkId={selectedLandmarkId} onSelectLandmark={(landmark: LandmarkPOI) => setSelectedLandmarkId(landmark.id)} cameraPreset={cameraPreset} />
      </div>

      <header className="archos-spatial-header archos-surface">
        <div className="archos-spatial-brand"><span className="archos-spatial-mark" aria-hidden="true" /><div><strong>ARCHOS</strong><span>SPATIAL INTELLIGENCE OPERATING ENVIRONMENT</span></div></div>
        <nav className="archos-spatial-modes" aria-label="Spatial modes">
          {([['WORLD', Map], ['INTELLIGENCE', Network], ['SIMULATION', Play]] as const).map(([item, Icon]) => (
            <button key={item} type="button" className={mode === item ? 'is-active' : ''} onClick={() => { setMode(item); if (item === 'INTELLIGENCE') setShowFabric(true); }}><Icon size={11} /> {item}</button>
          ))}
        </nav>
        <div className="archos-spatial-state"><span className="archos-live-dot" /> WORLD MODEL · LIVE</div>
      </header>

      <aside className="archos-spatial-rail archos-surface">
        <div className="archos-eyebrow">WORLD / LAYERS</div>
        <div className="archos-spatial-layer-list">{(['ALL', 'SKYLINE', 'MOBILITY', 'SENSORS', 'SUBSURFACE'] as ActiveLayer[]).map((layer) => <button key={layer} className={activeLayer === layer ? 'is-active' : ''} onClick={() => setActiveLayer(layer)} type="button"><Layers3 size={13} /> {layer}</button>)}</div>
        <div className="archos-eyebrow archos-spatial-section-label">CAMERA</div>
        <div className="archos-camera-grid">{(['COMMAND', 'ORBIT', 'NADIR', 'STREET'] as const).map((preset) => <button key={preset} className={cameraPreset === preset ? 'is-active' : ''} onClick={() => setCameraPreset(preset)} type="button">{preset}</button>)}</div>
        <div className="archos-eyebrow archos-spatial-section-label">RENDER</div>
        <select value={lightingMode} onChange={(event) => setLightingMode(event.target.value as LightingMode)} aria-label="Rendering mode"><option value="CYBER">CYBER</option><option value="TWILIGHT">TWILIGHT</option><option value="THERMAL">THERMAL</option><option value="LIDAR">LIDAR</option></select>
        <label className="archos-spatial-slider"><span><span>SPATIAL SEPARATION</span><b>{sliceSeparation.toFixed(2)}</b></span><input type="range" min="0" max="1.5" step="0.05" value={sliceSeparation} onChange={(event) => setSliceSeparation(Number(event.target.value))} /></label>
        <div className="archos-spatial-runtime"><div><Activity size={11} /><span>RUNTIME</span><b>LIVE</b></div><div><Cpu size={11} /><span>LOAD</span><b>37%</b></div><div><ShieldCheck size={11} /><span>INTEGRITY</span><b>99.98%</b></div></div>
      </aside>

      <div className="archos-spatial-search archos-surface"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Locate entity, district or emirate" aria-label="Locate entity, district or emirate" /><kbd>⌘K</kbd>{query && <div className="archos-spatial-search-results">{filteredLandmarks.slice(0, 5).map((landmark) => <button key={landmark.id} type="button" onClick={() => { setSelectedLandmarkId(landmark.id); setQuery(''); }}><span>{landmark.name}</span><small>{landmark.emirate} · {landmark.district}</small></button>)}{!filteredLandmarks.length && <span className="archos-spatial-no-result">NO WORLD-MODEL MATCH</span>}</div>}</div>

      <aside className="archos-spatial-inspector archos-surface">
        <div className="archos-eyebrow">ACTIVE ENTITY</div><div className="archos-spatial-entity-title">{selectedLandmark?.name ?? 'World Model'}</div>
        <div className="archos-spatial-entity-meta"><span><Target size={11} /> {selectedLandmark?.category ?? 'REGION'}</span><span><Radio size={11} /> LIVE</span></div>
        {selectedLandmark && <><p>{selectedLandmark.description}</p><div className="archos-spatial-metrics"><div><span>HEIGHT</span><b>{selectedLandmark.stats.heightM} M</b></div><div><span>AQI</span><b>{selectedLandmark.stats.aqi}</b></div><div><span>OCCUPANCY</span><b>{selectedLandmark.stats.occupancy}%</b></div><div><span>ENERGY</span><b>{selectedLandmark.stats.energyRating}</b></div></div></>}
        <div className="archos-spatial-integrity"><ShieldCheck size={12} /> GOVERNED / VERIFIED CONTEXT</div>
      </aside>

      {showFabric && <div className="archos-spatial-fabric archos-surface"><button className="archos-spatial-fabric-close" type="button" onClick={() => setShowFabric(false)} aria-label="Close intelligence fabric"><X size={13} /></button><ArchosIntelligenceGraph title="LIVE INTELLIGENCE FABRIC" /></div>}
      <div className="archos-spatial-fabric-toggle"><button className={showFabric ? 'is-active' : ''} type="button" onClick={() => setShowFabric((value) => !value)}><Network size={13} /> INTELLIGENCE FABRIC</button></div>

      <div className={`archos-spatial-command archos-command-surface is-${commandStatus.toLowerCase()}`}><span className="archos-spatial-command-icon">{commandStatus === 'EXECUTING' ? <Loader2 size={13} className="archos-spin" /> : <Command size={13} />}</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void executeCommand(); }} placeholder="Command ArchOS..." aria-label="Command ArchOS" disabled={commandStatus === 'EXECUTING'} /><span className="archos-spatial-command-state">{commandStateLabel}</span><button type="button" onClick={() => void executeCommand()} disabled={commandStatus === 'EXECUTING' || !command.trim()}>{commandStatus === 'EXECUTING' ? 'PROCESSING' : 'EXECUTE'}</button></div>

      <div className="archos-spatial-footer"><span>ARCHOS SPATIAL RUNTIME</span><i /><span>WORLD MODEL</span><i /><span>AGENT FABRIC</span><i /><span>VERIFICATION</span><i /><span>SIMULATION READY</span></div>
      <div className="archos-spatial-core-label"><Sparkles size={12} /><span>INTELLIGENCE FIELD · {mode}</span></div>
    </section>
  );
};

export default ArchOSUnifiedSpatialCanvas;
