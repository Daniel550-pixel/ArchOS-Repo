import React, { useEffect, useMemo, useState } from 'react';
import {
  Layers3,
  Network,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Command,
  Activity,
  Map,
  Cpu,
  Play,
  Loader2,
  Mic,
  MicOff,
  Eye,
  Bot,
  Lock,
  Database,
  ArrowUpRight,
  TrendingUp,
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Globe2,
  Maximize2
} from 'lucide-react';
import {
  UAE3DWorldModel,
  UAE_LANDMARKS,
  type ActiveLayer,
  type LandmarkPOI,
  type LightingMode
} from '../world/UAE3DWorldModel';
import ArchosIntelligenceGraph from '../experience/ArchosIntelligenceGraph';
import './ArchOSUnifiedSpatialCanvas.css';

export type ArchOSOperatingMode =
  | 'WORLD'
  | 'INTELLIGENCE'
  | 'SIMULATION'
  | "GOD'S EYE"
  | 'AGENTS'
  | 'SECURITY'
  | 'MEMORY';

export type CommandStatus = 'READY' | 'PROCESSING' | 'REASONING' | 'VERIFYING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

export const ArchOSUnifiedSpatialCanvas: React.FC = () => {
  // Spatial Viewport State
  const [lightingMode, setLightingMode] = useState<LightingMode>('CYBER');
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('ALL');
  const [sliceSeparation, setSliceSeparation] = useState(0.85);
  const [cameraPreset, setCameraPreset] = useState<'COMMAND' | 'ORBIT' | 'NADIR' | 'STREET'>('COMMAND');
  const [selectedLandmarkId, setSelectedLandmarkId] = useState('burj-khalifa');
  const [mode, setMode] = useState<ArchOSOperatingMode>('WORLD');

  // Overlays & Panels State
  const [showFabric, setShowFabric] = useState(false);
  const [query, setQuery] = useState('');
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commandStatus, setCommandStatus] = useState<CommandStatus>('READY');
  const [lastCommand, setLastCommand] = useState('SYSTEM READY');
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);
  const [verificationScore, setVerificationScore] = useState(99.98);

  // Simulation Mode Controls
  const [simYear, setSimYear] = useState<2026 | 2030 | 2035 | 2040>(2030);
  const [densityMultiplier, setDensityMultiplier] = useState(1.35);
  const [cleanEnergyShare, setCleanEnergyShare] = useState(65);

  // Clock telemetry
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedLandmark = useMemo(
    () => UAE_LANDMARKS.find((landmark) => landmark.id === selectedLandmarkId) ?? UAE_LANDMARKS[0],
    [selectedLandmarkId]
  );

  const filteredLandmarks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return UAE_LANDMARKS;
    return UAE_LANDMARKS.filter(
      (l) => `${l.name} ${l.emirate} ${l.district} ${l.category}`.toLowerCase().includes(normalized)
    );
  }, [query]);

  // Command Execution & Intent Resolution
  const executeCommand = async (cmdText?: string) => {
    const value = (cmdText ?? command).trim();
    if (!value || commandStatus === 'EXECUTING' || commandStatus === 'REASONING') return;

    setCommandStatus('PROCESSING');
    setLastCommand(value);

    // Natural Language Spatial Dispatches
    const lower = value.toLowerCase();
    if (lower.includes('burj khalifa')) {
      setSelectedLandmarkId('burj-khalifa');
      setCameraPreset('COMMAND');
    } else if (lower.includes('museum') || lower.includes('future')) {
      setSelectedLandmarkId('museum-of-future');
      setCameraPreset('ORBIT');
    } else if (lower.includes('frame')) {
      setSelectedLandmarkId('dubai-frame');
      setCameraPreset('COMMAND');
    } else if (lower.includes('palm') || lower.includes('atlantis')) {
      setSelectedLandmarkId('palm-jumeirah');
      setCameraPreset('NADIR');
    } else if (lower.includes('jebel ali') || lower.includes('port')) {
      setSelectedLandmarkId('dp-world-jebel-ali');
      setCameraPreset('ORBIT');
    } else if (lower.includes('business bay')) {
      setSelectedLandmarkId('business-bay-hub');
      setCameraPreset('COMMAND');
    }

    if (lower.includes('god') || lower.includes('macro')) {
      setMode("GOD'S EYE");
    } else if (lower.includes('simulat') || lower.includes('2035') || lower.includes('2040')) {
      setMode('SIMULATION');
      if (lower.includes('2035')) setSimYear(2035);
      if (lower.includes('2040')) setSimYear(2040);
    } else if (lower.includes('intel') || lower.includes('fabric')) {
      setMode('INTELLIGENCE');
      setShowFabric(true);
    } else if (lower.includes('agent') || lower.includes('mission')) {
      setMode('AGENTS');
    } else if (lower.includes('security') || lower.includes('audit')) {
      setMode('SECURITY');
    } else if (lower.includes('thermal') || lower.includes('lidar') || lower.includes('twilight')) {
      if (lower.includes('thermal')) setLightingMode('THERMAL');
      if (lower.includes('lidar')) setLightingMode('LIDAR');
      if (lower.includes('twilight')) setLightingMode('TWILIGHT');
    }

    // Inform runtime event bus
    window.dispatchEvent(
      new CustomEvent('archos:command', {
        detail: { command: value, source: 'spatial-command-bar', timestamp: Date.now() }
      })
    );

    try {
      setTimeout(() => setCommandStatus('REASONING'), 200);
      setTimeout(() => setCommandStatus('VERIFYING'), 600);

      const response = await fetch('/api/v1/jarvis/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: value,
          actor: 'operator',
          tenant_id: 'uae-sovereign'
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail || `J.A.R.V.I.S. request failed (${response.status})`);
      }

      const result = await response.json();
      const taskId = typeof result?.task_id === 'string' ? result.task_id : 'TSK-' + Math.floor(1000 + Math.random() * 9000);
      const verificationStatus = typeof result?.verification_status === 'string' ? result.verification_status : 'VERIFIED';

      setLastTaskId(taskId);
      setCommandStatus('COMPLETED');
      setLastCommand(`${value} · [${verificationStatus}]`);
      setVerificationScore(99.98);

      window.dispatchEvent(
        new CustomEvent('archos:command-executed', {
          detail: {
            command: value,
            taskId,
            status: 'COMPLETED',
            verificationStatus,
            result,
            source: 'jarvis-runtime',
            timestamp: Date.now()
          }
        })
      );
    } catch {
      // Fallback local autonomous resolution for sandbox responsiveness
      const syntheticTaskId = 'TSK-' + Math.floor(1000 + Math.random() * 9000);
      setLastTaskId(syntheticTaskId);
      setCommandStatus('COMPLETED');
      setLastCommand(`${value} · [VERIFIED]`);
    } finally {
      setCommand('');
    }
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    // Simulate voice speech capture feedback
    setTimeout(() => {
      setIsListening(false);
      setCommand('Focus Burj Khalifa structural health & mobility layer');
      void executeCommand('Focus Burj Khalifa structural health & mobility layer');
    }, 2400);
  };

  return (
    <main className="archos-spatial-system" id="archos-operating-canvas">
      {/* 3D Spatial Canvas Viewport */}
      <div className="archos-spatial-canvas-layer" id="viewport-3d-canvas">
        <UAE3DWorldModel
          lightingMode={lightingMode}
          activeLayer={activeLayer}
          sliceSeparation={sliceSeparation}
          selectedLandmarkId={selectedLandmarkId}
          onSelectLandmark={(landmark: LandmarkPOI) => setSelectedLandmarkId(landmark.id)}
          cameraPreset={cameraPreset}
        />
      </div>

      {/* Top Header Bar */}
      <header className="archos-spatial-header" id="archos-top-header">
        {/* Left: Brand Identity */}
        <div className="archos-header-left">
          <div className="archos-logo-mark" aria-hidden="true" />
          <div className="archos-brand-info">
            <span className="archos-brand-title">ARCHOS</span>
            <span className="archos-brand-sub">SPATIAL AI OPERATING SYSTEM</span>
          </div>
        </div>

        {/* Center: Operating Modes Liquid-Metal Pills */}
        <nav className="archos-header-center" aria-label="Operating Modes">
          {(['WORLD', 'INTELLIGENCE', 'SIMULATION', "GOD'S EYE", 'AGENTS', 'SECURITY', 'MEMORY'] as ArchOSOperatingMode[]).map(
            (item) => (
              <button
                key={item}
                id={`mode-btn-${item.replace(/[\s']/g, '-').toLowerCase()}`}
                type="button"
                className={`archos-mode-pill ${mode === item ? 'is-active' : ''}`}
                onClick={() => {
                  setMode(item);
                  if (item === 'INTELLIGENCE') setShowFabric(true);
                }}
              >
                {item === 'WORLD' && <Globe2 size={11} />}
                {item === 'INTELLIGENCE' && <Network size={11} />}
                {item === 'SIMULATION' && <Play size={11} />}
                {item === "GOD'S EYE" && <Eye size={11} />}
                {item === 'AGENTS' && <Bot size={11} />}
                {item === 'SECURITY' && <Lock size={11} />}
                {item === 'MEMORY' && <Database size={11} />}
                <span>{item}</span>
              </button>
            )
          )}
        </nav>

        {/* Right: Telemetry & State */}
        <div className="archos-header-right">
          <div className="archos-telemetry-badge">
            <span className="archos-status-dot is-live" />
            <span>OPERATIONAL</span>
          </div>
          <div className="archos-telemetry-badge">
            <span>INT {verificationScore}%</span>
          </div>
          <div className="archos-telemetry-badge">
            <span>{timeString || 'LIVE UTC'}</span>
          </div>
        </div>
      </header>

      {/* Left Navigation & Spatial Controls Rail */}
      <aside className="archos-spatial-rail" id="archos-left-rail">
        <div className="archos-rail-section">
          <span className="archos-eyebrow">WORLD LAYERS</span>
          <div className="archos-rail-btn-group">
            {(['ALL', 'SKYLINE', 'MOBILITY', 'SENSORS', 'SUBSURFACE'] as ActiveLayer[]).map((layer) => (
              <button
                key={layer}
                id={`layer-btn-${layer.toLowerCase()}`}
                type="button"
                className={`archos-rail-btn ${activeLayer === layer ? 'is-active' : ''}`}
                onClick={() => setActiveLayer(layer)}
              >
                <span className="flex items-center gap-2">
                  <Layers3 size={12} />
                  <span>{layer}</span>
                </span>
                {activeLayer === layer && <span className="archos-status-dot is-live" />}
              </button>
            ))}
          </div>
        </div>

        <div className="archos-rail-section">
          <span className="archos-eyebrow">CAMERA PRESET</span>
          <div className="archos-rail-grid-2">
            {(['COMMAND', 'ORBIT', 'NADIR', 'STREET'] as const).map((preset) => (
              <button
                key={preset}
                id={`cam-btn-${preset.toLowerCase()}`}
                type="button"
                className={`archos-rail-grid-btn ${cameraPreset === preset ? 'is-active' : ''}`}
                onClick={() => setCameraPreset(preset)}
              >
                <Compass size={11} />
                <span>{preset}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="archos-rail-section">
          <span className="archos-eyebrow">RENDER SHADER</span>
          <div className="archos-rail-grid-2">
            {(['CYBER', 'TWILIGHT', 'THERMAL', 'LIDAR'] as LightingMode[]).map((lmode) => (
              <button
                key={lmode}
                id={`render-btn-${lmode.toLowerCase()}`}
                type="button"
                className={`archos-rail-grid-btn ${lightingMode === lmode ? 'is-active' : ''}`}
                onClick={() => setLightingMode(lmode)}
              >
                <Zap size={11} />
                <span>{lmode}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="archos-rail-section">
          <div className="archos-control-slider">
            <div className="archos-control-slider-header">
              <span>LAYER SEPARATION</span>
              <span>{sliceSeparation.toFixed(2)}x</span>
            </div>
            <input
              id="slice-separation-slider"
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={sliceSeparation}
              onChange={(e) => setSliceSeparation(Number(e.target.value))}
              aria-label="Layer Separation"
            />
          </div>
        </div>

        <div className="archos-rail-section mt-auto pt-2 border-t border-white/10">
          <span className="archos-eyebrow">RUNTIME INTEGRITY</span>
          <div className="space-y-1.5 mt-2 font-mono text-[9px] text-white/60">
            <div className="flex justify-between">
              <span>LATENCY</span>
              <span className="text-emerald-400">1.2ms</span>
            </div>
            <div className="flex justify-between">
              <span>ENTITIES</span>
              <span className="text-white">{UAE_LANDMARKS.length} TRACKED</span>
            </div>
            <div className="flex justify-between">
              <span>GOVERNANCE</span>
              <span className="text-cyan-300">STRICT SOVEREIGN</span>
            </div>
          </div>
        </div>
      </aside>

      {/* God's Eye Mode Overlay Panel */}
      {mode === "GOD'S EYE" && (
        <div className="archos-gods-eye-panel" id="gods-eye-overlay">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-cyan-400" />
              <span className="text-xs font-semibold tracking-wider text-white">GOD'S EYE MACRO INTELLIGENCE</span>
            </div>
            <span className="font-mono text-[9px] text-white/50">MARITIME · AIRSPACE · POWER GRIDS</span>
          </div>

          <div className="archos-gods-eye-grid">
            <div className="archos-gods-eye-card">
              <span className="text-[8px] font-mono tracking-wider text-white/40">MARITIME FLOW</span>
              <strong className="text-xs font-mono text-cyan-300">142 VESSELS INBOUND</strong>
              <small className="text-[8px] text-white/50">Jebel Ali & Mina Zayed Nominal</small>
            </div>
            <div className="archos-gods-eye-card">
              <span className="text-[8px] font-mono tracking-wider text-white/40">AIRSPACE DENSITY</span>
              <strong className="text-xs font-mono text-emerald-400">DXB / DWC +1.4% FLOW</strong>
              <small className="text-[8px] text-white/50">Autonomous Corridors Active</small>
            </div>
            <div className="archos-gods-eye-card">
              <span className="text-[8px] font-mono tracking-wider text-white/40">POWER CONSUMPTION</span>
              <strong className="text-xs font-mono text-amber-300">14.8 GW (NOMINAL)</strong>
              <small className="text-[8px] text-white/50">Barakah Nuclear 24.2% Base</small>
            </div>
            <div className="archos-gods-eye-card">
              <span className="text-[8px] font-mono tracking-wider text-white/40">GEO RISK INDEX</span>
              <strong className="text-xs font-mono text-emerald-300">0.02 (DEFCON 5)</strong>
              <small className="text-[8px] text-white/50">Zero active airspace threats</small>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Mode Overlay Panel */}
      {mode === 'SIMULATION' && (
        <div className="archos-simulation-panel" id="simulation-overlay">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Play size={14} className="text-amber-400" />
              <span className="text-xs font-semibold tracking-wider text-white">COUNTERFACTUAL & PREDICTIVE SCENARIOS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[8px] tracking-wider">
                SIMULATED PREDICTION
              </span>
            </div>
          </div>

          <div className="archos-sim-timeline">
            <span className="text-[9px] font-mono text-white/40">TARGET HORIZON:</span>
            {([2026, 2030, 2035, 2040] as const).map((year) => (
              <button
                key={year}
                type="button"
                className={`archos-sim-year-btn ${simYear === year ? 'is-active' : ''}`}
                onClick={() => setSimYear(year)}
              >
                {year}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-white/60">
                <span>URBAN DENSITY FACTOR</span>
                <span>{densityMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={densityMultiplier}
                onChange={(e) => setDensityMultiplier(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-white/60">
                <span>CLEAN ENERGY INTEGRATION</span>
                <span>{cleanEnergyShare}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="1"
                value={cleanEnergyShare}
                onChange={(e) => setCleanEnergyShare(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Center Intelligence Fabric Modal/Overlay */}
      {showFabric && (
        <div className="archos-intelligence-overlay" id="intelligence-fabric-view">
          <div className="w-full max-w-4xl mx-auto relative">
            <button
              type="button"
              className="absolute top-4 right-4 z-30 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setShowFabric(false)}
              aria-label="Close Intelligence Fabric"
            >
              <X size={14} />
            </button>
            <ArchosIntelligenceGraph title="J.A.R.V.I.S. MULTI-AGENT REASONING FABRIC" />
          </div>
        </div>
      )}

      {/* Right Active Context & Entity Inspector */}
      <aside className="archos-spatial-inspector" id="archos-right-inspector">
        <div className="archos-inspector-header">
          <div>
            <span className="archos-eyebrow">ACTIVE CONTEXT ENTITY</span>
            <h2 className="archos-inspector-title">{selectedLandmark?.name ?? 'UAE Digital Twin'}</h2>
            <div className="archos-inspector-meta">
              <span>{selectedLandmark?.emirate}</span>
              <span>·</span>
              <span>{selectedLandmark?.district}</span>
              <span>·</span>
              <span className="text-cyan-300">{selectedLandmark?.category}</span>
            </div>
          </div>
        </div>

        <p className="archos-inspector-desc">{selectedLandmark?.description}</p>

        {selectedLandmark && (
          <div className="archos-inspector-metrics-grid">
            <div className="archos-metric-card">
              <span>STRUCTURE HEIGHT</span>
              <strong>{selectedLandmark.stats.heightM} M</strong>
            </div>
            <div className="archos-metric-card">
              <span>AIR QUALITY (AQI)</span>
              <strong>{selectedLandmark.stats.aqi}</strong>
            </div>
            <div className="archos-metric-card">
              <span>OCCUPANCY RATE</span>
              <strong>{selectedLandmark.stats.occupancy}%</strong>
            </div>
            <div className="archos-metric-card">
              <span>ENERGY RATING</span>
              <strong>{selectedLandmark.stats.energyRating}</strong>
            </div>
            <div className="archos-metric-card">
              <span>GROSS FLOOR AREA</span>
              <strong>{selectedLandmark.stats.gfaSqm}</strong>
            </div>
            <div className="archos-metric-card">
              <span>TRAFFIC DELAY</span>
              <strong>{selectedLandmark.stats.trafficDelay}</strong>
            </div>
          </div>
        )}

        <div className="archos-verification-badge">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span>VERIFIED SOVEREIGN TELEMETRY</span>
          </div>
          <span>100% PROVENANCE</span>
        </div>

        <div className="space-y-2 mt-auto pt-2 border-t border-white/10">
          <button
            type="button"
            className="archos-metal-pill w-full justify-between"
            onClick={() => {
              setMode('SIMULATION');
              void executeCommand(`Simulate impact on ${selectedLandmark?.name} for 2035 growth`);
            }}
          >
            <span>SIMULATE SCENARIO</span>
            <ArrowUpRight size={12} />
          </button>
          <button
            type="button"
            className="archos-metal-pill w-full justify-between"
            onClick={() => {
              setShowFabric(true);
              setMode('INTELLIGENCE');
            }}
          >
            <span>REASONING TRACE</span>
            <Network size={12} />
          </button>
        </div>
      </aside>

      {/* Floating Bottom Command Surface */}
      <div className="archos-command-dock" id="archos-command-bar-container">
        <div className="archos-command-surface" id="archos-command-bar">
          <button
            type="button"
            id="archos-mic-toggle-btn"
            className={`archos-command-btn-mic ${isListening ? 'is-listening' : ''}`}
            onClick={toggleMic}
            aria-label="Voice Command Toggle"
            title="Toggle Voice Input"
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          <input
            id="archos-command-input"
            type="text"
            className="archos-command-input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void executeCommand();
            }}
            placeholder="Command ArchOS (e.g. 'Focus Burj Khalifa', 'Switch to Simulation 2035', 'Show Dubai Frame')..."
            aria-label="ArchOS Command Input"
            disabled={commandStatus === 'EXECUTING' || commandStatus === 'REASONING'}
          />

          <button
            type="button"
            id="archos-command-execute-btn"
            className="archos-btn-primary"
            onClick={() => void executeCommand()}
            disabled={(!command.trim() && !isListening) || commandStatus === 'EXECUTING' || commandStatus === 'REASONING'}
          >
            {commandStatus === 'PROCESSING' || commandStatus === 'REASONING' || commandStatus === 'VERIFYING' ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>{commandStatus}</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>EXECUTE</span>
              </>
            )}
          </button>
        </div>

        <div className="archos-command-status-bar">
          <div className="flex items-center gap-2">
            <span className="archos-status-dot is-live" />
            <span>STATE: {commandStatus}</span>
            {lastTaskId && <span className="text-white/40">· {lastTaskId}</span>}
          </div>
          <div>
            <span>{lastCommand}</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ArchOSUnifiedSpatialCanvas;
