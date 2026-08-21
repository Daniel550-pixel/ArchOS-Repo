import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Cpu,
  Terminal,
  ChevronUp,
  ChevronDown,
  Pause,
  Play,
  Trash2,
  Filter,
  Sparkles,
  Zap,
  Layers,
  Database,
  Radio,
  CheckCircle2,
  Flame
} from 'lucide-react';

export type LogCategory = 'ALL' | 'SUB_PROCESS' | 'WEIGHT_UPDATE' | 'DIAGNOSTIC' | 'WORLD_SYNC';

export interface NeuralLogEntry {
  id: string;
  timestamp: string;
  category: 'SUB_PROCESS' | 'WEIGHT_UPDATE' | 'DIAGNOSTIC' | 'WORLD_SYNC';
  source: string;
  message: string;
  meta?: string;
  level: 'INFO' | 'NEURAL' | 'TENSOR' | 'SYNC' | 'OPTIMAL' | 'WARN';
}

const SAMPLE_LOG_TEMPLATES: Array<Omit<NeuralLogEntry, 'id' | 'timestamp'>> = [
  {
    category: 'WEIGHT_UPDATE',
    source: 'UAE-LLM-Core-128B',
    message: 'Backprop step #492,108 · AdamW lr=1.2e-5 · loss: 0.0381 (Δ-0.0014) · GradNorm: 0.76',
    meta: 'dim: 8192 | heads: 64 | KV-cache: 98.2%',
    level: 'NEURAL'
  },
  {
    category: 'SUB_PROCESS',
    source: 'SpatialPointCloud-v4',
    message: 'Octree spatial index partitioned for 14.8M LIDAR points across Dubai Marina corridor',
    meta: 'voxel_res: 0.05m | latency: 3.2ms',
    level: 'TENSOR'
  },
  {
    category: 'DIAGNOSTIC',
    source: 'DGX-Sovereign-Cluster',
    message: 'H100 NVLink interconnect bandwidth 894 GB/s · GPU-04 temp 48°C · FP8 tensor throughput 1.48 PFLOPS',
    meta: 'VRAM: 62.4GB / 80GB',
    level: 'OPTIMAL'
  },
  {
    category: 'WORLD_SYNC',
    source: 'EtihadRail-Telemetry',
    message: 'Synchronized cross-border freight schedule with Ghuweifat customs clearance gate API',
    meta: 'payload: 1,420 TEU | drift: 0.00ms',
    level: 'SYNC'
  },
  {
    category: 'WEIGHT_UPDATE',
    source: 'GSCIE-RiskPredictor-v2',
    message: 'Attention heads recalibrated for Strait of Hormuz maritime vessel density anomaly',
    meta: 'weights_updated: 4.8M | entropy: 1.14',
    level: 'NEURAL'
  },
  {
    category: 'SUB_PROCESS',
    source: 'MacroEconomics-VectorDB',
    message: 'Semantic cosine embeddings updated for H1 2026 Non-Oil Foreign Trade reports (dim=1536)',
    meta: 'vectors_indexed: 45,000 | recall@10: 99.4%',
    level: 'INFO'
  },
  {
    category: 'DIAGNOSTIC',
    source: 'SecurityPerimeter-Sentry',
    message: 'Barakah clean energy exclusion envelope scanned · 0 false positive triggers · zero packet loss',
    meta: 'p99_ping: 1.1ms | TLS 1.3 Post-Quantum',
    level: 'OPTIMAL'
  },
  {
    category: 'SUB_PROCESS',
    source: 'GestureVision-Engine',
    message: 'EMA smoothing alpha filter dynamically locked · Hand landmarks landmark_confidence=0.988',
    meta: 'framerate: 60 FPS | jitter: <0.02px',
    level: 'TENSOR'
  },
  {
    category: 'WEIGHT_UPDATE',
    source: 'UrbanSim-MoE-Router',
    message: 'Top-2 Expert gating weights updated: [Infrastructure: 0.62, RealEstate: 0.38]',
    meta: 'expert_capacity: nominal | sparsity: 87.5%',
    level: 'NEURAL'
  },
  {
    category: 'WORLD_SYNC',
    source: 'DubaiCustoms-SmartGate',
    message: 'Real-time Jebel Ali automated clearance vector reconciled with Federal Customs matrix',
    meta: 'throughput: 1,840 containers/hr',
    level: 'SYNC'
  }
];

export const NeuralActivityLogPanel: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
}> = ({ isOpen, onToggle }) => {
  const [logs, setLogs] = useState<NeuralLogEntry[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<LogCategory>('ALL');
  const [speedMs, setSpeedMs] = useState<number>(2200);
  const scrollRef = useRef<HTMLDivElement>(null);
  const templateIdxRef = useRef<number>(0);

  // Generate initial bootstrap logs
  useEffect(() => {
    const initialLogs: NeuralLogEntry[] = [];
    const now = Date.now();
    for (let i = 0; i < 8; i++) {
      const template = SAMPLE_LOG_TEMPLATES[i % SAMPLE_LOG_TEMPLATES.length];
      const timeStr = new Date(now - (8 - i) * 2500).toISOString().substring(11, 23);
      initialLogs.push({
        ...template,
        id: `init-${i}-${now}`,
        timestamp: timeStr
      });
    }
    setLogs(initialLogs);
  }, []);

  // Periodic simulated log generator
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const template = SAMPLE_LOG_TEMPLATES[templateIdxRef.current % SAMPLE_LOG_TEMPLATES.length];
      templateIdxRef.current += 1;

      const now = new Date();
      const timeStr = now.toISOString().substring(11, 23);

      const newEntry: NeuralLogEntry = {
        ...template,
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr
      };

      setLogs((prev) => [...prev.slice(-90), newEntry]);
    }, speedMs);

    return () => clearInterval(interval);
  }, [isPaused, speedMs]);

  // Auto-scroll when new logs arrive (if user has drawer open)
  useEffect(() => {
    if (isOpen && scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen, isPaused]);

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'ALL') return true;
    return log.category === activeFilter;
  });

  const latestLog = logs[logs.length - 1];

  const getLevelBadge = (level: NeuralLogEntry['level']) => {
    switch (level) {
      case 'NEURAL':
        return 'text-[#ec4899] bg-[#ec4899]/15 border-[#ec4899]/40';
      case 'TENSOR':
        return 'text-[#00e5ff] bg-[#00e5ff]/15 border-[#00e5ff]/40';
      case 'SYNC':
        return 'text-[#d4ff00] bg-[#d4ff00]/15 border-[#d4ff00]/40';
      case 'OPTIMAL':
        return 'text-[#10b981] bg-[#10b981]/15 border-[#10b981]/40';
      case 'WARN':
        return 'text-[#f59e0b] bg-[#f59e0b]/15 border-[#f59e0b]/40';
      default:
        return 'text-[#8e8d88] bg-white/5 border-white/10';
    }
  };

  return (
    <>
      {/* Inline BottomBar Ticker / Trigger Strip */}
      <div
        onClick={onToggle}
        title="Click to toggle Neural Activity Console"
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#09101c] hover:bg-[#111827] border border-[#00e5ff]/30 hover:border-[#00e5ff] transition-all cursor-pointer font-mono-tech select-none max-w-[280px] sm:max-w-[340px] xl:max-w-[420px] group shadow-inner shrink-0"
      >
        <div className="relative flex items-center justify-center">
          <Cpu className="w-3.5 h-3.5 text-[#00e5ff] group-hover:scale-110 transition-transform" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#d4ff00] animate-ping" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 text-[9px]">
            <span className="font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1">
              NEURAL ACTIVITY
              <span className="text-[8px] text-[#8e8d88] font-normal">({logs.length} ops)</span>
            </span>
            <span className="text-[#8e8d88] text-[8px] font-mono">
              {latestLog?.timestamp.substring(0, 8)}
            </span>
          </div>

          <div className="text-[10px] text-[#f5f4f0] truncate leading-tight flex items-center gap-1">
            <span className="text-[#d4ff00] font-semibold text-[9px]">
              [{latestLog?.source.split('-')[0] || 'SYS'}]:
            </span>
            <span className="text-[#c4c3be] truncate">
              {latestLog?.message || 'Neural runtime initialized...'}
            </span>
          </div>
        </div>

        <div className="text-[#8e8d88] group-hover:text-[#00e5ff] transition-colors">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Expandable Neural Activity Log Modal / HUD Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-12 right-4 sm:right-8 z-50 w-[calc(100vw-2rem)] sm:w-[580px] lg:w-[680px] max-h-[480px] flex flex-col rounded-xl border border-[#00e5ff]/40 bg-[#070c16]/98 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.85),0_0_15px_rgba(0,229,255,0.2)] font-mono-tech select-none overflow-hidden"
          >
            {/* Top Ambient Highlight Glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent" />

            {/* Header Controls Bar */}
            <div className="p-3 border-b border-[#00e5ff]/20 bg-[#05080e]/90 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff]">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#f5f4f0] uppercase tracking-wider">
                      NEURAL INTELLIGENCE RUNTIME STREAM
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/40">
                      LIVE 60Hz
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8e8d88]">
                    Real-time backprop weights, tensor shards & UAE World Model synchronization
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`p-1.5 rounded border transition-all text-xs flex items-center gap-1 ${
                    isPaused
                      ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]'
                      : 'bg-[#111622] border-white/10 text-[#8e8d88] hover:text-[#00e5ff]'
                  }`}
                  title={isPaused ? 'Resume live stream' : 'Pause log stream'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setLogs([])}
                  className="p-1.5 rounded bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-[#ef4444] transition-all"
                  title="Clear Log Terminal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onToggle}
                  className="p-1.5 rounded bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-[#f5f4f0] transition-all"
                  title="Collapse Console"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs Bar */}
            <div className="px-3 py-2 bg-[#09101c]/80 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-[10px]">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'ALL', label: 'ALL LOGS' },
                    { id: 'WEIGHT_UPDATE', label: 'WEIGHT UPDATES' },
                    { id: 'SUB_PROCESS', label: 'SUB-PROCESSES' },
                    { id: 'DIAGNOSTIC', label: 'DIAGNOSTICS' },
                    { id: 'WORLD_SYNC', label: 'WORLD SYNCS' }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-2 py-0.5 rounded transition-all font-semibold whitespace-nowrap ${
                      activeFilter === tab.id
                        ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                        : 'text-[#8e8d88] hover:text-[#f5f4f0] hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Stream Rate Toggle */}
              <div className="flex items-center gap-1 text-[9px] text-[#8e8d88] shrink-0">
                <span>Speed:</span>
                {[
                  { label: 'Fast', ms: 1200 },
                  { label: 'Norm', ms: 2200 },
                  { label: 'Slow', ms: 4000 }
                ].map((s) => (
                  <button
                    key={s.ms}
                    onClick={() => setSpeedMs(s.ms)}
                    className={`px-1.5 py-0.5 rounded border ${
                      speedMs === s.ms
                        ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10'
                        : 'border-white/5 text-[#8e8d88] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal Body Logs Scroll Area */}
            <div
              ref={scrollRef}
              className="flex-1 p-3 overflow-y-auto max-h-[300px] space-y-1.5 text-xs font-mono scrollbar-thin scrollbar-thumb-[#00e5ff]/20 scrollbar-track-transparent bg-[#05080e]/95"
            >
              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-[#8e8d88] text-xs">
                  No active logs in category '{activeFilter}'. Awaiting runtime dispatch...
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-[#09101c]/70 hover:bg-[#0d1627] border border-white/5 hover:border-[#00e5ff]/30 transition-all flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#8e8d88] text-[9px]">{log.timestamp}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${getLevelBadge(
                            log.level
                          )}`}
                        >
                          {log.level}
                        </span>
                        <span className="text-[#00e5ff] font-semibold truncate">
                          [{log.source}]
                        </span>
                      </div>

                      {log.meta && (
                        <span className="text-[#8e8d88] text-[9px] truncate max-w-[200px] hidden sm:inline">
                          {log.meta}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#f5f4f0] leading-relaxed break-words font-mono">
                      {log.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Terminal Footer Telemetry Summary */}
            <div className="p-2.5 bg-[#05080e] border-t border-white/5 flex items-center justify-between text-[10px] text-[#8e8d88]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span>Sovereign TPU Cluster: Operational</span>
                </span>
                <span className="hidden sm:inline">FP8 Engine: Active</span>
                <span className="hidden sm:inline">Loss Convergence: Nominal</span>
              </div>
              <span className="text-[#00e5ff]">JARVIS v4.8 Neural Core</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
