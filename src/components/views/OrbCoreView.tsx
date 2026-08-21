import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'motion/react';
import {
  ChevronRight,
  ChevronLeft,
  Layers,
  Sparkles,
  Orbit,
  Globe2,
  Cpu,
  Activity,
  Radio,
  Zap,
  Volume2,
  Maximize2,
  Minimize2,
  Shield,
  Compass,
  Monitor,
  Terminal,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  Heart,
  SlidersHorizontal,
  Sun,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Server,
  Hand
} from 'lucide-react';
import { ThreeOrbCore, SATELLITE_ORBS, SatelliteNode } from '../spatial/orb/ThreeOrbCore';
import { SystemState, HandGestureState } from '../../types';
import { INTELLIGENCE_FEED, IntelligenceFeedItem } from '../../intelligence/briefingData';
import { GestureSensitivityControl } from '../spatial/GestureSensitivityControl';
import { speechService } from '../../services/voice/speechService';

export type OrbDeckMode = 'COMMAND_BRIDGE' | 'UAE_STAGE_PROJECTOR' | 'ISOMETRIC_MULTI_NODE';
export type LeftBladeTab = 'TELEMETRY' | 'EMIRATES' | 'SUBSYSTEMS';
export type RightBladeTab = 'BRIEFING' | 'INSPECTOR' | 'OPTICS';
export type KinematicPattern = 'HARMONIC' | 'SWARM' | 'REASONING_SURGE' | 'DEFENSE_SHIELD';

interface OrbCoreViewProps {
  systemState: SystemState;
  onSelectCity: (cityId: string) => void;
  onSelectIntelligenceItem: (item: IntelligenceFeedItem) => void;
  onOrbClick: () => void;
  gestureState?: HandGestureState;
  onToggleCamera?: () => void;
}

export const OrbCoreView: React.FC<OrbCoreViewProps> = ({
  systemState,
  onSelectCity,
  onSelectIntelligenceItem,
  onOrbClick,
  gestureState,
  onToggleCamera
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [deckMode, setDeckMode] = useState<OrbDeckMode>('COMMAND_BRIDGE');
  const [briefingPage, setBriefingPage] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Layout & Visibility Organization (Neat & Overseeable)
  const [showLeftBlade, setShowLeftBlade] = useState<boolean>(true);
  const [showRightBlade, setShowRightBlade] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [leftTab, setLeftTab] = useState<LeftBladeTab>('TELEMETRY');
  const [rightTab, setRightTab] = useState<RightBladeTab>('BRIEFING');
  const [showGesturePanel, setShowGesturePanel] = useState<boolean>(false);

  // 3D Visual & Optics Unified Settings
  const [autonomousMode, setAutonomousMode] = useState<boolean>(true);
  const [kinematicPattern, setKinematicPattern] = useState<KinematicPattern>('HARMONIC');
  const [cameraDistance, setCameraDistance] = useState<number>(10.5);
  const [bloomIntensity, setBloomIntensity] = useState<number>(1.6);
  const [bloomThreshold, setBloomThreshold] = useState<number>(0.15);
  const [bloomSmoothing, setBloomSmoothing] = useState<number>(0.9);
  const [mipmapBlur, setMipmapBlur] = useState<boolean>(true);
  const [enableVignette, setEnableVignette] = useState<boolean>(true);
  const [activeFXPreset, setActiveFXPreset] = useState<'SOVEREIGN_GLOW' | 'QUANTUM_NEON' | 'SUBTLE' | 'HYPER_BLOOM'>('SOVEREIGN_GLOW');

  // Currently focused / inspected node
  const [focusedNode, setFocusedNode] = useState<SatelliteNode | null>(SATELLITE_ORBS[0]);

  // Normalized pointer coordinates (-1 to 1) with smooth spring physics
  const pointerX = useSpring(0, { stiffness: 120, damping: 20 });
  const pointerY = useSpring(0, { stiffness: 120, damping: 20 });
  const [tiltCoords, setTiltCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate live respiratory BPM based on overall system state
  const currentBpm =
    systemState === 'THINKING' ? 28.4 :
    systemState === 'SIMULATING' ? 33.6 :
    systemState === 'SPEAKING' ? 24.2 :
    systemState === 'LISTENING' ? 18.0 :
    systemState === 'WARNING' || systemState === 'ERROR' ? 38.0 : 13.8;

  const breathCycleSeconds = 60 / currentBpm;

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      pointerX.set(normX);
      pointerY.set(normY);
      setTiltCoords({ x: normX, y: normY });
    },
    [pointerX, pointerY]
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
    setTiltCoords({ x: 0, y: 0 });
  }, [pointerX, pointerY]);

  const handleNodeSelect = (nodeId: string) => {
    const matchedNode = SATELLITE_ORBS.find((s) => s.id === nodeId);
    if (matchedNode) {
      setFocusedNode(matchedNode);
      setRightTab('INSPECTOR');
    }

    if (nodeId.startsWith('subsystem-')) {
      const matched =
        INTELLIGENCE_FEED.find(
          (f) =>
            f.id.includes(nodeId.replace('subsystem-', '')) ||
            f.tag === 'SIMULATION' ||
            f.tag === 'FORECAST'
        ) || INTELLIGENCE_FEED[0];
      onSelectIntelligenceItem(matched);
    } else {
      onSelectCity(nodeId);
    }
  };

  const handleTriggerSectorScan = () => {
    setIsScanning(true);
    setScanMessage('Executing high-frequency quantum radar sweep across all 7 Emirates sectors...');
    speechService.speak('Initiating full sovereign telemetry pulse. 7 Emirates nodes synchronized with zero latency.');

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('Telemetry sync complete: Barakah 5.6GW peak, Barari grid at 99.8% stability.');
      setTimeout(() => setScanMessage(null), 5000);
    }, 2400);
  };

  const applyFXPreset = (preset: 'SOVEREIGN_GLOW' | 'QUANTUM_NEON' | 'SUBTLE' | 'HYPER_BLOOM') => {
    setActiveFXPreset(preset);
    switch (preset) {
      case 'SOVEREIGN_GLOW':
        setBloomIntensity(1.6);
        setBloomThreshold(0.15);
        setBloomSmoothing(0.9);
        setMipmapBlur(true);
        break;
      case 'QUANTUM_NEON':
        setBloomIntensity(2.4);
        setBloomThreshold(0.08);
        setBloomSmoothing(0.95);
        setMipmapBlur(true);
        break;
      case 'SUBTLE':
        setBloomIntensity(0.85);
        setBloomThreshold(0.35);
        setBloomSmoothing(0.7);
        setMipmapBlur(true);
        break;
      case 'HYPER_BLOOM':
        setBloomIntensity(3.2);
        setBloomThreshold(0.02);
        setBloomSmoothing(0.98);
        setMipmapBlur(true);
        break;
    }
  };

  const toggleZenMode = () => {
    if (!isZenMode) {
      setIsZenMode(true);
      setShowLeftBlade(false);
      setShowRightBlade(false);
    } else {
      setIsZenMode(false);
      setShowLeftBlade(true);
      setShowRightBlade(true);
    }
  };

  const displayedFeed = INTELLIGENCE_FEED.slice(briefingPage * 3, briefingPage * 3 + 3);

  // Dynamic colors for organic breathing aura
  const auraColor =
    systemState === 'THINKING' ? 'rgba(168, 85, 247, ' :
    systemState === 'SIMULATING' ? 'rgba(236, 72, 153, ' :
    systemState === 'SPEAKING' ? 'rgba(212, 255, 0, ' :
    systemState === 'WARNING' || systemState === 'ERROR' ? 'rgba(239, 68, 68, ' :
    'rgba(0, 229, 255, ';

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-full flex-1 flex flex-col items-center justify-between overflow-hidden bg-[#02050c] select-none font-mono-tech cursor-default"
    >
      {/* Background Holographic Starfield & Server Datacenter Horizon */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Layer 1: Organic Low-Frequency Expanding Radial Breathing Aura */}
        <motion.div
          animate={{
            scale: [1, 1.18, 1],
            opacity: [0.35, 0.75, 0.35]
          }}
          transition={{
            duration: breathCycleSeconds,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            background: `radial-gradient(circle, ${auraColor} 0.22) 0%, ${auraColor} 0.08) 45%, transparent 70%)`
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[980px] h-[980px] rounded-full blur-3xl pointer-events-none"
        />

        {/* Layer 2: Secondary Harmonic Expansion Ring */}
        <motion.div
          animate={{
            scale: [1.05, 1.25, 1.05],
            opacity: [0.15, 0.45, 0.15]
          }}
          transition={{
            duration: breathCycleSeconds * 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            background: `radial-gradient(circle, ${auraColor} 0.15) 0%, transparent 60%)`
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1300px] h-[1300px] rounded-full blur-3xl pointer-events-none"
        />

        {/* Laser Grid Floor Horizon */}
        <div
          className="absolute bottom-0 w-full h-[45%] opacity-25"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, transparent 0%, #00e5ff 100%),
              linear-gradient(90deg, rgba(0, 229, 255, 0.15) 1px, transparent 1px),
              linear-gradient(rgba(0, 229, 255, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 48px 48px, 48px 48px',
            transform: 'perspective(600px) rotateX(65deg)',
            transformOrigin: 'bottom center'
          }}
        />

        {/* Top Holographic Laser Projector Cones */}
        {deckMode === 'UAE_STAGE_PROJECTOR' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none opacity-40">
            <div className="w-full h-full bg-gradient-to-b from-[#00e5ff]/40 via-[#00e5ff]/10 to-transparent clip-path-cone blur-sm animate-pulse" />
          </div>
        )}
      </div>

      {/* TOP UNIFIED COMMAND RIBBON */}
      <div className="z-30 w-full px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 bg-[#040813]/90 border-b border-[#00e5ff]/20 backdrop-blur-md">
        {/* Identity & Live Telemetry Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)]">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#f5f4f0] uppercase tracking-wider">
              ORB CORE · JARVIS AIOS
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />
              {currentBpm.toFixed(1)} BPM
            </span>
          </div>
        </div>

        {/* Perspective Mode Switcher & Kinematics Control */}
        <div className="flex items-center gap-2">
          {/* Deck Perspective Modes */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#08101e] border border-white/10">
            <button
              onClick={() => setDeckMode('COMMAND_BRIDGE')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                deckMode === 'COMMAND_BRIDGE'
                  ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                  : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
              }`}
              title="Command Bridge View"
            >
              <Monitor size={12} />
              <span className="hidden sm:inline">360° BRIDGE</span>
            </button>
            <button
              onClick={() => setDeckMode('UAE_STAGE_PROJECTOR')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                deckMode === 'UAE_STAGE_PROJECTOR'
                  ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                  : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
              }`}
              title="UAE Stage Projector View"
            >
              <Globe2 size={12} />
              <span className="hidden sm:inline">UAE PROJECTOR</span>
            </button>
            <button
              onClick={() => setDeckMode('ISOMETRIC_MULTI_NODE')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                deckMode === 'ISOMETRIC_MULTI_NODE'
                  ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                  : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
              }`}
              title="Isometric Matrix View"
            >
              <Layers size={12} />
              <span className="hidden sm:inline">ISOMETRIC</span>
            </button>
          </div>

          {/* AI Self-Moving Kinematics Control */}
          <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-xl bg-[#08101e] border border-white/10">
            <button
              onClick={() => setAutonomousMode(!autonomousMode)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                autonomousMode
                  ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40'
                  : 'text-[#8e8d88] hover:text-white'
              }`}
              title="Toggle Autonomous Kinematics"
            >
              {autonomousMode ? <Play className="w-3 h-3 text-[#00e5ff]" /> : <Pause className="w-3 h-3" />}
              <span>{autonomousMode ? 'AUTO-ORBIT' : 'MANUAL'}</span>
            </button>

            {autonomousMode && (
              <div className="flex items-center gap-0.5 pl-1 border-l border-white/10">
                {(['HARMONIC', 'SWARM', 'REASONING_SURGE', 'DEFENSE_SHIELD'] as const).map((pat) => (
                  <button
                    key={pat}
                    onClick={() => setKinematicPattern(pat)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                      kinematicPattern === pat
                        ? 'bg-[#00e5ff] text-black font-bold shadow-[0_0_8px_#00e5ff]'
                        : 'text-[#8e8d88] hover:text-white'
                    }`}
                  >
                    {pat === 'REASONING_SURGE' ? 'REASON' : pat === 'DEFENSE_SHIELD' ? 'SHIELD' : pat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Tools & Dock Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Sector Scan Button */}
          <button
            onClick={handleTriggerSectorScan}
            disabled={isScanning}
            className="px-2.5 py-1 rounded-xl bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 text-[#00e5ff] border border-[#00e5ff]/40 text-[10px] font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.2)] transition-all cursor-pointer disabled:opacity-50"
            title="Pulse Quantum Sector Scan"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">SCAN</span>
          </button>

          {/* Left Dock Toggle */}
          <button
            onClick={() => setShowLeftBlade(!showLeftBlade)}
            className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
              showLeftBlade
                ? 'bg-[#00e5ff]/20 border-[#00e5ff]/50 text-[#00e5ff]'
                : 'bg-[#08101e] border-white/10 text-[#8e8d88] hover:text-white'
            }`}
            title="Toggle Left Telemetry Blade"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">TELEMETRY</span>
          </button>

          {/* Right Dock Toggle */}
          <button
            onClick={() => setShowRightBlade(!showRightBlade)}
            className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
              showRightBlade
                ? 'bg-[#00e5ff]/20 border-[#00e5ff]/50 text-[#00e5ff]'
                : 'bg-[#08101e] border-white/10 text-[#8e8d88] hover:text-white'
            }`}
            title="Toggle Right Intelligence Blade"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">BRIEFING</span>
          </button>

          {/* Zen Focus Mode Button */}
          <button
            onClick={toggleZenMode}
            className={`p-1.5 rounded-lg border transition-all ${
              isZenMode
                ? 'bg-[#d4ff00]/20 border-[#d4ff00] text-[#d4ff00] shadow-[0_0_10px_rgba(212,255,0,0.3)]'
                : 'bg-[#08101e] border-white/10 text-[#8e8d88] hover:text-white'
            }`}
            title={isZenMode ? 'Exit Zen Mode' : 'Zen Focus View (Uncluttered 3D)'}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT WITH 3D CANVAS & COLLAPSIBLE TIDY HUD PANELS */}
      <div className="relative flex-1 w-full flex items-center justify-between px-4 sm:px-6 overflow-hidden">
        {/* LEFT DOCK: NEURAL TELEMETRY, 7 EMIRATES & SUBSYSTEMS */}
        <AnimatePresence>
          {showLeftBlade && (
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="z-20 w-80 max-w-[340px] flex flex-col gap-2 pointer-events-auto shrink-0 my-auto"
            >
              <div className="p-3.5 rounded-2xl border border-[#00e5ff]/35 bg-[#050b18]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col gap-2.5 relative overflow-hidden">
                {/* Glowing geometric bracket accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent opacity-80" />

                {/* Sub-Tabs Header */}
                <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-2">
                  <div className="flex items-center gap-1 bg-[#08101e] p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setLeftTab('TELEMETRY')}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        leftTab === 'TELEMETRY'
                          ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                          : 'text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      NEURAL
                    </button>
                    <button
                      onClick={() => setLeftTab('EMIRATES')}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        leftTab === 'EMIRATES'
                          ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                          : 'text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      7 EMIRATES
                    </button>
                    <button
                      onClick={() => setLeftTab('SUBSYSTEMS')}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        leftTab === 'SUBSYSTEMS'
                          ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                          : 'text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      MODULES
                    </button>
                  </div>

                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold border border-[#10b981]/40">
                    98.6% NOMINAL
                  </span>
                </div>

                {/* TAB 1: NEURAL TELEMETRY */}
                {leftTab === 'TELEMETRY' && (
                  <div className="flex flex-col gap-2.5">
                    {/* Respiration Cardiac Rhythm */}
                    <div className="p-2 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-[#00e5ff] font-bold uppercase">
                          <Heart className="w-3.5 h-3.5 text-[#00e5ff] animate-pulse" />
                          <span>RESPIRATORY RHYTHM</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#d4ff00]">
                          {currentBpm.toFixed(1)} BPM
                        </span>
                      </div>

                      {/* Sinusoidal Breath Waveform */}
                      <div className="relative h-8 w-full bg-black/50 rounded-lg overflow-hidden flex items-center px-1 border border-white/5">
                        <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                          <path
                            d="M 0,20 Q 25,6 50,20 T 100,20 T 150,20 T 200,20"
                            fill="none"
                            stroke="#00e5ff"
                            strokeWidth="2"
                            className="opacity-80"
                          />
                          <path
                            d="M 0,20 Q 25,32 50,20 T 100,20 T 150,20 T 200,20"
                            fill="none"
                            stroke="#d4ff00"
                            strokeWidth="1"
                            strokeOpacity="0.5"
                          />
                        </svg>

                        <motion.div
                          animate={{
                            scale: [0.8, 1.5, 0.8],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{
                            duration: breathCycleSeconds,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                          className="absolute right-2.5 w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-[#8e8d88]">
                        <span>State: <strong className="text-white uppercase">{systemState}</strong></span>
                        <span className="text-[#10b981]">Homeostasis Optimal</span>
                      </div>
                    </div>

                    {/* Latency & Metrics */}
                    <div className="flex flex-col gap-1 text-[10px] text-[#8e8d88]">
                      <div className="flex items-center justify-between">
                        <span>Antigravity Latency:</span>
                        <span className="text-[#00e5ff] font-bold">1.4ms (Zero Jitter)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sovereign Matrix:</span>
                        <span className="text-[#d4ff00] font-bold">14.2 TB LWM Weights</span>
                      </div>

                      {/* Harmonic Bars */}
                      <div className="flex items-end gap-1 h-6 bg-black/40 p-1 rounded-lg border border-white/5 mt-0.5">
                        {[45, 75, 90, 35, 60, 85, 50, 70, 95, 40].map((val, idx) => (
                          <motion.div
                            key={idx}
                            animate={{ height: [`${val * 0.4}%`, `${val}%`, `${val * 0.5}%`] }}
                            transition={{
                              duration: 0.6 + (idx % 3) * 0.2,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                            className="flex-1 bg-gradient-to-t from-[#004488] to-[#00e5ff] rounded-t-sm"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Active Cognitive Pipeline */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
                      <span className="text-[9px] text-[#8e8d88] uppercase font-bold tracking-wider">
                        COGNITIVE PIPELINE
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[9px]">
                        <div className="p-1 rounded bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                          <span>ANALYSIS</span>
                        </div>
                        <div className="p-1 rounded bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00]" />
                          <span>COMPREHENSION</span>
                        </div>
                        <div className="p-1 rounded bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                          <span>GENERATION</span>
                        </div>
                        <div className="p-1 rounded bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                          <span>VERIFICATION</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: 7 EMIRATES ORBITING NODES */}
                {leftTab === 'EMIRATES' && (
                  <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5">
                    {SATELLITE_ORBS.map((node) => {
                      const isSelected = focusedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => handleNodeSelect(node.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#00e5ff]/20 border-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                              : 'bg-[#09101c]/80 border-white/10 hover:border-[#00e5ff]/40 hover:bg-[#0f1b30]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]"
                              style={{ backgroundColor: node.color }}
                            />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-white uppercase">
                                {node.name}
                              </span>
                              <span className="text-[9px] text-[#8e8d88]">
                                {node.metricLabel}: <strong className="text-[#00e5ff]">{node.metricValue}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span
                              className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                              style={{
                                backgroundColor: `${node.color}20`,
                                color: node.color
                              }}
                            >
                              {node.category}
                            </span>
                            <Crosshair className="w-3 h-3 text-[#8e8d88] hover:text-[#00e5ff]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB 3: SOVEREIGN SUBSYSTEMS */}
                {leftTab === 'SUBSYSTEMS' && (
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        name: 'ZERO-TRUST AEGIS',
                        status: 'ARMED',
                        desc: 'Hardware-anchored policy & mTLS enclave',
                        color: '#10b981'
                      },
                      {
                        name: 'VISION CORTEX V3',
                        status: 'ONLINE',
                        desc: 'MediaPipe 21-point spatial gesture engine',
                        color: '#00e5ff'
                      },
                      {
                        name: 'DIGITAL TWIN ENGINE',
                        status: 'STREAMING',
                        desc: '7-Emirates temporal event mesh (MQTT/WSS)',
                        color: '#d4ff00'
                      },
                      {
                        name: 'SOVEREIGN LWM',
                        status: 'READY',
                        desc: 'Localized reasoning & multi-agent orchestrator',
                        color: '#38bdf8'
                      }
                    ].map((mod) => (
                      <div
                        key={mod.name}
                        className="p-2 rounded-xl bg-[#09101c]/80 border border-white/10 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white">{mod.name}</span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[8px] font-bold"
                            style={{ backgroundColor: `${mod.color}20`, color: mod.color }}
                          >
                            {mod.status}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#8e8d88] leading-tight">{mod.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D WEBGL AUTONOMOUS CENTRAL CORE CANVAS */}
        <div className="absolute inset-0 z-10 pointer-events-auto flex items-center justify-center">
          <ThreeOrbCore
            systemState={systemState}
            onSelectNode={handleNodeSelect}
            onHoverNode={(node) => {
              if (node) setFocusedNode(node);
            }}
            onOrbClick={onOrbClick}
            tiltX={tiltCoords.x}
            tiltY={tiltCoords.y}
            interactive={true}
            showInternalHUD={false}
            cameraDistance={cameraDistance}
            onCameraDistanceChange={setCameraDistance}
            autonomousMode={autonomousMode}
            onToggleAutonomousMode={setAutonomousMode}
            aiKinematicPattern={kinematicPattern}
            onChangeKinematicPattern={setKinematicPattern}
            bloomIntensity={bloomIntensity}
            bloomThreshold={bloomThreshold}
            bloomSmoothing={bloomSmoothing}
            mipmapBlur={mipmapBlur}
            enableVignette={enableVignette}
          />
        </div>

        {/* RIGHT DOCK: EXECUTIVE BRIEFING, NODE INSPECTOR & OPTICS STUDIO */}
        <AnimatePresence>
          {showRightBlade && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
              className="z-20 w-84 max-w-[350px] flex flex-col gap-2 pointer-events-auto shrink-0 my-auto"
            >
              <div className="p-3.5 rounded-2xl border border-[#00e5ff]/35 bg-[#050b18]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col gap-2.5 relative overflow-hidden">
                {/* Glowing geometric bracket accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent opacity-80" />

                {/* Sub-Tabs Header */}
                <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-2">
                  <div className="flex items-center gap-1 bg-[#08101e] p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setRightTab('BRIEFING')}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        rightTab === 'BRIEFING'
                          ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                          : 'text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      BRIEFING
                    </button>
                    <button
                      onClick={() => setRightTab('INSPECTOR')}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        rightTab === 'INSPECTOR'
                          ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                          : 'text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      INSPECTOR
                    </button>
                    <button
                      onClick={() => setRightTab('OPTICS')}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        rightTab === 'OPTICS'
                          ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                          : 'text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      OPTICS & FX
                    </button>
                  </div>

                  {rightTab === 'BRIEFING' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setBriefingPage((p) => Math.max(0, p - 1))}
                        disabled={briefingPage === 0}
                        className="p-0.5 text-[#8e8d88] hover:text-[#00e5ff] disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-[#00e5ff] font-bold">
                        {briefingPage + 1}/2
                      </span>
                      <button
                        onClick={() => setBriefingPage((p) => Math.min(1, p + 1))}
                        disabled={briefingPage === 1}
                        className="p-0.5 text-[#8e8d88] hover:text-[#00e5ff] disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* TAB 1: EXECUTIVE BRIEFING */}
                {rightTab === 'BRIEFING' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      {displayedFeed.map((item) => {
                        const isFact = item.tag === 'FACT';
                        const isAnalysis = item.tag === 'ANALYSIS';

                        return (
                          <div
                            key={item.id}
                            onClick={() => onSelectIntelligenceItem(item)}
                            className="group p-2 rounded-xl border border-[#00e5ff]/15 bg-[#09101c]/80 hover:bg-[#0f1b30] hover:border-[#00e5ff]/60 transition-all cursor-pointer flex flex-col gap-1"
                          >
                            <div className="flex items-start gap-1.5">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[8px] font-mono-tech font-bold uppercase tracking-wider shrink-0 ${
                                  isFact
                                    ? 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/40'
                                    : isAnalysis
                                    ? 'bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/40'
                                    : 'bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40'
                                }`}
                              >
                                {item.tag}
                              </span>
                              <p className="text-[10.5px] font-medium text-[#f5f4f0] leading-snug group-hover:text-[#00e5ff] transition-colors line-clamp-2">
                                {item.title}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-[#8e8d88]">
                              <span>Src: {item.source}</span>
                              <span className="text-[#00e5ff] font-bold">Rel: {(item.relevance * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        const text = `Executive Briefing. ${displayedFeed[0].title}. Sourced from ${displayedFeed[0].source}.`;
                        speechService.speak(text);
                      }}
                      className="w-full py-1.5 rounded-xl bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border border-[#00e5ff]/40 text-[#00e5ff] text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.15)] transition-all cursor-pointer"
                    >
                      <Volume2 size={13} />
                      <span>VOICE EXECUTIVE BRIEFING</span>
                    </button>
                  </div>
                )}

                {/* TAB 2: NODE INSPECTOR */}
                {rightTab === 'INSPECTOR' && (
                  <div className="flex flex-col gap-2.5">
                    {focusedNode ? (
                      <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[#09101c]/80 border border-[#00e5ff]/30">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                              style={{ backgroundColor: focusedNode.color }}
                            />
                            <span className="font-bold text-xs text-white uppercase tracking-wider">
                              {focusedNode.name}
                            </span>
                          </div>
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                            style={{
                              backgroundColor: `${focusedNode.color}20`,
                              color: focusedNode.color
                            }}
                          >
                            {focusedNode.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#c4c3be] leading-relaxed">
                          {focusedNode.description}
                        </p>

                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-[#8e8d88]">
                          <div className="p-1.5 rounded bg-black/40 border border-white/5 flex flex-col">
                            <span>Orbit Radius:</span>
                            <strong className="text-white">{focusedNode.radius} AU</strong>
                          </div>
                          <div className="p-1.5 rounded bg-black/40 border border-white/5 flex flex-col">
                            <span>Angular Speed:</span>
                            <strong className="text-white">{focusedNode.speed} rad/s</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                          <span className="text-[#8e8d88]">{focusedNode.metricLabel}:</span>
                          <span className="font-bold text-[#00e5ff]">{focusedNode.metricValue}</span>
                        </div>

                        <button
                          onClick={() => handleNodeSelect(focusedNode.id)}
                          className="w-full py-1.5 mt-1 rounded-lg bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-black font-bold text-[10px] tracking-wider uppercase transition-all shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                        >
                          Deep-Dive Telemetry View
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-[#8e8d88]">
                        Hover or click any node to inspect telemetry.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: OPTICS & FX STUDIO */}
                {rightTab === 'OPTICS' && (
                  <div className="flex flex-col gap-2 text-xs text-[#c4c3be]">
                    {/* Presets */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-[#8e8d88] font-bold uppercase">OPTICAL PRESET</span>
                      <div className="grid grid-cols-2 gap-1">
                        {(
                          [
                            { id: 'SOVEREIGN_GLOW', label: 'SOVEREIGN' },
                            { id: 'QUANTUM_NEON', label: 'QUANTUM NEON' },
                            { id: 'SUBTLE', label: 'SUBTLE' },
                            { id: 'HYPER_BLOOM', label: 'HYPER BLOOM' }
                          ] as const
                        ).map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => applyFXPreset(preset.id)}
                            className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${
                              activeFXPreset === preset.id
                                ? 'bg-[#d4ff00]/20 border-[#d4ff00] text-[#d4ff00]'
                                : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bloom Intensity */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#8e8d88]">Bloom Intensity:</span>
                        <span className="text-[#00e5ff] font-bold">{bloomIntensity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4.0"
                        step="0.1"
                        value={bloomIntensity}
                        onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                        className="w-full accent-[#00e5ff]"
                      />
                    </div>

                    {/* Luminance Cutoff */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#8e8d88]">Luminance Threshold:</span>
                        <span className="text-[#d4ff00] font-bold">{bloomThreshold.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.8"
                        step="0.05"
                        value={bloomThreshold}
                        onChange={(e) => setBloomThreshold(parseFloat(e.target.value))}
                        className="w-full accent-[#d4ff00]"
                      />
                    </div>

                    {/* 3D Depth Zoom */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/5 text-[10px]">
                      <span className="text-[#8e8d88]">3D Camera Distance:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCameraDistance((d) => Math.max(6, d - 1.5))}
                          className="w-5 h-5 rounded bg-[#111622] hover:bg-[#00e5ff] hover:text-black border border-white/10 text-white font-bold transition-all flex items-center justify-center"
                        >
                          +
                        </button>
                        <span className="text-[#00e5ff] font-bold">{cameraDistance.toFixed(1)}m</span>
                        <button
                          onClick={() => setCameraDistance((d) => Math.min(18, d + 1.5))}
                          className="w-5 h-5 rounded bg-[#111622] hover:bg-[#00e5ff] hover:text-black border border-white/10 text-white font-bold transition-all flex items-center justify-center"
                        >
                          -
                        </button>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mipmapBlur}
                          onChange={(e) => setMipmapBlur(e.target.checked)}
                          className="accent-[#00e5ff]"
                        />
                        <span>Mipmap Blur</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableVignette}
                          onChange={(e) => setEnableVignette(e.target.checked)}
                          className="accent-[#00e5ff]"
                        />
                        <span>Vignette</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM COMMAND CONSOLE STRIP */}
      <div className="z-30 w-full px-4 sm:px-6 py-2 bg-[#040813]/95 border-t border-[#00e5ff]/25 backdrop-blur-xl flex flex-col gap-1.5">
        {scanMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-[#10b981] font-bold text-center flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span>{scanMessage}</span>
          </motion.div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Status & Respiration Homeostasis */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-bold uppercase">
              RESPIRATORY HOMEOSTASIS:
            </span>
            <span className="text-[10px] text-[#00e5ff] font-bold">
              {systemState} · {currentBpm.toFixed(1)} BPM
            </span>
          </div>

          {/* 7 Emirates Quick Pills */}
          <div className="hidden md:flex items-center gap-1">
            {SATELLITE_ORBS.map((orb) => (
              <button
                key={orb.id}
                onClick={() => handleNodeSelect(orb.id)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                  focusedNode?.id === orb.id
                    ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff]'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-[#00e5ff]/40'
                }`}
              >
                {orb.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Interactive Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGesturePanel(!showGesturePanel)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                showGesturePanel
                  ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff]'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
              }`}
              title="Toggle Gesture Sensitivity Controller"
            >
              <Hand className="w-3 h-3" />
              <span>GESTURES</span>
            </button>

            <button
              onClick={() => {
                speechService.speak('Synchronizing telemetry with Abu Dhabi, Dubai, Sharjah, and all northern Emirates.');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00e5ff]/20 text-white text-[10px] font-bold border border-white/10 hover:border-[#00e5ff]/40 transition-all cursor-pointer"
            >
              SYNC 7 EMIRATES
            </button>

            <button
              onClick={onOrbClick}
              className="px-3 py-1 rounded-lg bg-[#00e5ff] hover:bg-[#00c8e0] text-black text-[10px] font-bold shadow-[0_0_12px_#00e5ff] transition-all cursor-pointer"
            >
              ENGAGE JARVIS CORE
            </button>
          </div>
        </div>
      </div>

      {/* Hand Gesture Sensitivity Controller Modal (Collapsible to prevent viewport clutter) */}
      {showGesturePanel && (
        <div className="absolute left-8 bottom-14 z-40">
          <GestureSensitivityControl
            gestureState={gestureState}
            onToggleCamera={onToggleCamera}
          />
        </div>
      )}
    </div>
  );
};
