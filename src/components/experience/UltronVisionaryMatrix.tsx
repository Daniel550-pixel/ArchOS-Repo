import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Dna,
  GitBranch,
  Layers,
  Network,
  Play,
  Pause,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

export type EvolutionEpochId = 'SEED_ZERO' | 'EPOCH_ONE' | 'EPOCH_TWO' | 'EPOCH_THREE';

export interface EvolutionEpoch {
  id: EvolutionEpochId;
  epochNumber: string;
  name: string;
  year: string;
  subtitle: string;
  seedSignature: string;
  synapticDensity: number;
  frequencyHz: number;
  description: string;
  invariants: string[];
  tensorMetrics: {
    nodes: number;
    synapses: number;
    entropy: number;
    provenance: string;
  };
}

export const EVOLUTION_EPOCHS: EvolutionEpoch[] = [
  {
    id: 'SEED_ZERO',
    epochNumber: '00',
    name: 'FGSE Latent Seed',
    year: '2027',
    subtitle: 'High-Frequency Order-Flow Particle Matrix',
    seedSignature: '0x8F3B_FGSE_GENESIS_ROOT',
    synapticDensity: 0.24,
    frequencyHz: 480,
    description:
      'Origin algorithmic genome. High-dimensional particle fields and spring-tension lattices mapped to market liquidity velocity and structural risk gradients.',
    invariants: ['PARTICLE_EQUILIBRIUM', 'BOUNDED_LATENCY', 'ZERO_DIRECT_EXECUTION'],
    tensorMetrics: {
      nodes: 128,
      synapses: 512,
      entropy: 0.82,
      provenance: 'integrations/source-repositories/FGSE',
    },
  },
  {
    id: 'EPOCH_ONE',
    epochNumber: '01',
    name: 'Spatial Cadastre Ingestion',
    year: '2028',
    subtitle: 'UAE Geodetic World Model Binding',
    seedSignature: '0x4E1A_UAE_WORLD_CADASTRE',
    synapticDensity: 0.58,
    frequencyHz: 720,
    description:
      'Binding of 3D spatial cadastre, subterranean utility grids, port telemetry, and meteorological vectors. The neural field reorganized into a continuous metabolic digital twin.',
    invariants: ['SOVEREIGN_DATA_RESIDENCY', 'GEODETIC_PRECISION', 'DUBAI_2040_ALIGNMENT'],
    tensorMetrics: {
      nodes: 512,
      synapses: 3480,
      entropy: 0.44,
      provenance: 'core/world_model/dubai_pulse_cadastre',
    },
  },
  {
    id: 'EPOCH_TWO',
    epochNumber: '02',
    name: 'Causal Lineage Fabric',
    year: '2029',
    subtitle: 'Cryptographic Dependency DAG & ActionGate',
    seedSignature: '0x99C2_CAUSAL_TRACE_FABRIC',
    synapticDensity: 0.84,
    frequencyHz: 960,
    description:
      'Integration of directional causal DAGs and cryptographic execution traces. Every perceptual node links directly to multi-agent reasoning chains and immutable policy boundaries.',
    invariants: ['ACTION_GATE_ISOLATION', 'CRYPTOGRAPHIC_AUDITABILITY', 'MULTI_AGENT_CONSENSUS'],
    tensorMetrics: {
      nodes: 1420,
      synapses: 12800,
      entropy: 0.18,
      provenance: 'aios/causal_graph/provenance_engine',
    },
  },
  {
    id: 'EPOCH_THREE',
    epochNumber: '03',
    name: 'Sovereign Epistemic Matrix',
    year: '2030+',
    subtitle: 'Four-Lens Adaptive Intelligence Operating Canvas',
    seedSignature: '0x00FF_ULTRON_SOVEREIGN_CORE',
    synapticDensity: 0.99,
    frequencyHz: 1200,
    description:
      'Unified perception environment synthesizing WHAT (World), WHY (Intelligence), HOW (Agents), and WHEN (Replay) in an ultra-low latency real-time neural resonance field.',
    invariants: ['LIFE_SAFETY_INVARIANT', 'POST_QUANTUM_RESISTANCE', 'ZERO_SIDE_EFFECT_EXPERIENCE'],
    tensorMetrics: {
      nodes: 4096,
      synapses: 65536,
      entropy: 0.05,
      provenance: 'archos/ultron/epistemic_matrix',
    },
  },
];

interface UltronVisionaryMatrixProps {
  initialEpoch?: EvolutionEpochId;
  onEpochChange?: (epoch: EvolutionEpoch) => void;
  className?: string;
  compact?: boolean;
}

export const UltronVisionaryMatrix: React.FC<UltronVisionaryMatrixProps> = ({
  initialEpoch = 'EPOCH_THREE',
  onEpochChange,
  className = '',
  compact = false,
}) => {
  const [selectedEpochId, setSelectedEpochId] = useState<EvolutionEpochId>(initialEpoch);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeStreamDensity, setActiveStreamDensity] = useState<number>(1);
  const [streamTelemetry, setStreamTelemetry] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentEpoch = useMemo(
    () => EVOLUTION_EPOCHS.find((e) => e.id === selectedEpochId) || EVOLUTION_EPOCHS[3],
    [selectedEpochId]
  );

  const handleSelectEpoch = (epochId: EvolutionEpochId) => {
    setSelectedEpochId(epochId);
    const found = EVOLUTION_EPOCHS.find((e) => e.id === epochId);
    if (found && onEpochChange) {
      onEpochChange(found);
    }
  };

  // High-frequency telemetry generation
  useEffect(() => {
    const symbols = ['∇Ψ', '∂t', '∲λ', '⊕μ', '⊗σ', '⟁κ', '⊸δ', '⨀φ', '⧖τ'];
    const interval = setInterval(() => {
      if (!isPlaying) return;
      const now = performance.now().toFixed(2);
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const hash = Math.random().toString(16).substring(2, 8).toUpperCase();
      const tensorVal = (Math.random() * 0.999).toFixed(4);
      const line = `[${now}ms] ${currentEpoch.id}::SYNAPSE_${hash} ${symbol} tensor_flux=${tensorVal} density=${(
        currentEpoch.synapticDensity * 100
      ).toFixed(1)}%`;

      setStreamTelemetry((prev) => [line, ...prev.slice(0, 18)]);
    }, 120);

    return () => clearInterval(interval);
  }, [currentEpoch, isPlaying]);

  // High-frequency Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isDisposed = false;

    // Node & Synaptic Particle Architecture
    const nodeCount = Math.floor(currentEpoch.tensorMetrics.nodes * 0.08 * activeStreamDensity);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseRadius: number;
      pulseOffset: number;
      layer: number;
      dnaCode: string;
    }> = [];

    const handleResize = () => {
      if (isDisposed || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(rect.width, 320);
      const h = Math.max(rect.height, 240);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles.length = 0;
      for (let i = 0; i < nodeCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * (0.6 + currentEpoch.synapticDensity * 1.4),
          vy: (Math.random() - 0.5) * (0.6 + currentEpoch.synapticDensity * 1.4),
          baseRadius: 1.2 + Math.random() * 2.2,
          pulseOffset: Math.random() * Math.PI * 2,
          layer: Math.floor(Math.random() * 4),
          dnaCode: Math.random().toString(16).substring(2, 6),
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Color palettes by epoch
    const getEpochColors = (epoch: EvolutionEpochId) => {
      switch (epoch) {
        case 'SEED_ZERO':
          return {
            primary: '0, 242, 255', // Neon Cyan
            secondary: '0, 153, 255',
            accent: '255, 204, 0',
            stream: 'rgba(0, 242, 255, 0.4)',
          };
        case 'EPOCH_ONE':
          return {
            primary: '0, 230, 118', // Emerald Geodetic
            secondary: '0, 242, 255',
            accent: '100, 255, 218',
            stream: 'rgba(0, 230, 118, 0.4)',
          };
        case 'EPOCH_TWO':
          return {
            primary: '168, 85, 247', // Purple Causal
            secondary: '59, 130, 246',
            accent: '244, 63, 94',
            stream: 'rgba(168, 85, 247, 0.4)',
          };
        case 'EPOCH_THREE':
        default:
          return {
            primary: '255, 255, 255', // Pure Sovereign White & Cyan Gold
            secondary: '14, 165, 233',
            accent: '245, 158, 11',
            stream: 'rgba(255, 255, 255, 0.45)',
          };
      }
    };

    let clock = 0;

    const render = () => {
      if (isDisposed || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      clock += 0.02;

      // Dark background with subtle spatial grid
      ctx.fillStyle = 'rgba(5, 8, 14, 0.28)';
      ctx.fillRect(0, 0, width, height);

      const colors = getEpochColors(currentEpoch.id);

      // Render high-frequency animated data streams (Matrix Waterfall Rays)
      const rayCount = Math.floor(width / 32);
      ctx.font = '9px monospace';
      ctx.fillStyle = colors.stream;
      for (let r = 0; r < rayCount; r++) {
        const x = r * 32 + 16;
        const yOffset = ((clock * 80 + r * 53) % (height + 120)) - 60;
        const glyph = (r * 13 + Math.floor(clock * 10)) % 2 === 0 ? '1' : '0';
        ctx.fillText(glyph, x, yOffset);
      }

      // Draw Synaptic Connections
      ctx.lineWidth = 0.6;
      const maxDistance = 75 + currentEpoch.synapticDensity * 45;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (0.15 + currentEpoch.synapticDensity * 0.45);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${colors.primary}, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      // Draw Neural Seed Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isPlaying) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        const pulse = Math.sin(clock * 3 + p.pulseOffset) * 0.5 + 0.5;
        const radius = p.baseRadius + pulse * 1.2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors.primary}, ${0.6 + pulse * 0.4})`;
        ctx.shadowColor = `rgba(${colors.primary}, 0.8)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw node identity code for prominent nodes
        if (i % 6 === 0) {
          ctx.font = '8px monospace';
          ctx.fillStyle = `rgba(${colors.secondary}, 0.5)`;
          ctx.fillText(`ψ:${p.dnaCode}`, p.x + 4, p.y - 4);
        }
      }

      // Draw Center Core Resonance Seed
      const cx = width / 2;
      const cy = height / 2;
      const corePulse = Math.sin(clock * 4) * 6 + 28;

      ctx.beginPath();
      ctx.arc(cx, cy, corePulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${colors.primary}, 0.3)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, corePulse * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${colors.accent}, 0.5)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentEpoch, isPlaying, activeStreamDensity]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-neutral-950/90 text-white shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Interactive Background Neural Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-label="ULTRON Neural Evolution Matrix Visualization"
      />

      {/* Foreground Operational HUD */}
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              <p className="text-[11px] font-mono tracking-[0.25em] text-cyan-300">
                ULTRON // VISIONARY MATRIX
              </p>
            </div>
            <h2 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
              Neural Architecture Evolution
              <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-mono font-normal text-white/70">
                {currentEpoch.year}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-white/80 hover:bg-white/10 hover:text-white transition"
              title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'PAUSE' : 'RESUME'}</span>
            </button>
            <button
              onClick={() => {
                const nextIndex = (EVOLUTION_EPOCHS.findIndex((e) => e.id === selectedEpochId) + 1) % EVOLUTION_EPOCHS.length;
                handleSelectEpoch(EVOLUTION_EPOCHS[nextIndex].id);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>CYCLE EPOCH</span>
            </button>
          </div>
        </div>

        {/* Epoch Selector Stepper */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {EVOLUTION_EPOCHS.map((epoch) => {
            const isSelected = epoch.id === selectedEpochId;
            return (
              <button
                key={epoch.id}
                onClick={() => handleSelectEpoch(epoch.id)}
                className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                    : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20 hover:text-white/90 hover:bg-white/5'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400">
                    EPOCH {epoch.epochNumber}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">{epoch.year}</span>
                </div>
                <strong className="mt-2 text-sm font-medium text-white">{epoch.name}</strong>
                <p className="mt-1 text-[11px] leading-snug text-white/50 line-clamp-2">
                  {epoch.subtitle}
                </p>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-1.5 text-[9px] font-mono text-cyan-300">
                    <Sparkles className="h-3 w-3" />
                    <span>SYNAPTIC DENSITY {(epoch.synapticDensity * 100).toFixed(0)}%</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detailed Metrics & Genesis Blueprint Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Epoch Genesis Overview */}
          <div className="lg:col-span-2 rounded-xl border border-white/10 bg-black/50 p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Dna className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                    Neural Emergence Blueprint
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-white/50">
                  SEED: {currentEpoch.seedSignature}
                </span>
              </div>
              <p className="mt-4 text-xs md:text-sm text-white/80 leading-relaxed">
                {currentEpoch.description}
              </p>

              {/* Invariants & Guardrails */}
              <div className="mt-5">
                <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
                  Active Sovereign Invariants
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentEpoch.invariants.map((inv) => (
                    <span
                      key={inv}
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-mono text-emerald-300"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {inv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Micro Tensors Stat Bar */}
            <div className="mt-6 grid grid-cols-4 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-[9px] font-mono text-white/40">NODES</p>
                <p className="text-base font-mono font-bold text-white">
                  {currentEpoch.tensorMetrics.nodes}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-white/40">SYNAPSES</p>
                <p className="text-base font-mono font-bold text-cyan-300">
                  {currentEpoch.tensorMetrics.synapses}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-white/40">FREQUENCY</p>
                <p className="text-base font-mono font-bold text-amber-300">
                  {currentEpoch.frequencyHz} Hz
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-white/40">ENTROPY</p>
                <p className="text-base font-mono font-bold text-emerald-300">
                  {currentEpoch.tensorMetrics.entropy}
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Live High-Frequency Neural Telemetry Stream */}
          <div className="rounded-xl border border-white/10 bg-black/60 p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                    Neural Flux Stream
                  </h3>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300">
                  <Activity className="h-3 w-3 animate-spin" /> LIVE
                </span>
              </div>

              {/* Scrolling Terminal Output */}
              <div className="mt-3 h-48 overflow-y-auto space-y-1.5 font-mono text-[10px] text-white/70 scrollbar-thin scrollbar-thumb-white/10">
                {streamTelemetry.length === 0 ? (
                  <p className="text-white/30 italic">Initializing high-frequency stream...</p>
                ) : (
                  streamTelemetry.map((line, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-cyan-500/50 pl-2 py-0.5 text-cyan-200/90 font-mono tracking-tight"
                    >
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Density Selector */}
            <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/40">MATRIX DENSITY</span>
              <div className="flex gap-1.5">
                {[0.5, 1, 1.5].map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveStreamDensity(d)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      activeStreamDensity === d
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    {d}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Provenance Note */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-[10px] font-mono text-white/40">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>PROVENANCE: {currentEpoch.tensorMetrics.provenance}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>BOUNDARY: READ_ONLY_PRESENTATION</span>
            <span className="text-emerald-400">ACTION_GATE: ENFORCED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltronVisionaryMatrix;
