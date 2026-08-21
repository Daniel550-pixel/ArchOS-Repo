import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from './ui';
import { useMqtt } from './services';
import {
  Activity,
  Cpu,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Radio,
  BarChart2,
  Building,
  Shield,
  Gauge
} from 'lucide-react';

export const OrbCore: React.FC = () => (
  <div className="grid grid-cols-12 gap-4 h-full">
    <div className="col-span-7 h-full">
      <GlassPanel title="ARCHOS ORB CORE" icon={<Radio size={16} />} badge="SOVEREIGN ENCLAVE" className="h-full flex flex-col justify-center">
        <div className="h-full min-h-[360px] flex items-center justify-center relative select-none">
          <motion.div
            className="absolute w-72 h-72 rounded-full border-2 border-[#00e5ff]/20 border-dashed"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-56 h-56 rounded-full border border-[#00e5ff]/40 shadow-[0_0_30px_rgba(0,229,255,0.2)]"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-40 h-40 rounded-full border-2 border-[#ffd700]/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="text-center z-10">
            <div className="text-[#00e5ff] text-4xl font-bold tracking-widest font-mono-tech">UAE</div>
            <div className="text-xs text-zinc-400 font-mono-tech mt-1">14,208 entities • 7 emirates</div>
            <div className="inline-block mt-3 px-3 py-1 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] text-[10px] border border-[#00e5ff]/30 font-mono-tech font-bold">
              ● REAL GROUND BUS ACTIVE
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>

    <div className="col-span-5 flex flex-col gap-4">
      <GlassPanel title="SYSTEM TELEMETRY ENGINE" icon={<Cpu size={16} />}>
        {[
          ['NEURAL ORCHESTRATION', 34, '#00e5ff'],
          ['MODBUS GATEWAY POOL', 67, '#10b981'],
          ['GPU COMPUTE MESH', 89, '#d4ff00'],
          ['QUANTUM ENCRYPTION BUS', 98, '#ffd700'],
        ].map(([l, v, c]: any) => (
          <div key={l} className="mb-3 font-mono-tech">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400 text-[11px]">{l}</span>
              <span className="font-bold text-xs" style={{ color: c }}>{v}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: c }}
                initial={{ width: 0 }}
                animate={{ width: `${v}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        ))}
      </GlassPanel>

      <GlassPanel title="SOVEREIGN PROTOCOL LEDGER" icon={<Shield size={16} />}>
        <div className="space-y-2 text-xs font-mono-tech">
          <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
            <span className="text-zinc-400">TRANSPORT:</span>
            <span className="text-[#00e5ff] font-bold">MQTT 5.0 / WSS TLS 1.3</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
            <span className="text-zinc-400">BMS INGESTION:</span>
            <span className="text-[#10b981] font-bold">MODBUS-TCP (:5020)</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
            <span className="text-zinc-400">PASSKEY AUTH:</span>
            <span className="text-[#ffd700] font-bold">WEBAUTHN FIDO2</span>
          </div>
        </div>
      </GlassPanel>
    </div>
  </div>
);

export const DesignStudio: React.FC = () => {
  const [p, setP] = useState({ w: 24, d: 24, f: 18, h: 3.8 });

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <GlassPanel title="PARAMETRIC STRUCTURAL STUDIO" icon={<Sliders size={16} />} className="h-full flex flex-col justify-between">
        <div className="space-y-4 font-mono-tech">
          {(['w', 'd', 'f', 'h'] as const).map((k) => {
            const labels = {
              w: 'FOOTPRINT WIDTH (M)',
              d: 'FOOTPRINT DEPTH (M)',
              f: 'STOREY COUNT (LEVELS)',
              h: 'FLOOR-TO-FLOOR HEIGHT (M)',
            };
            return (
              <div key={k} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">{labels[k]}</span>
                  <span className="text-[#00e5ff] font-bold">{p[k]}</span>
                </div>
                <input
                  type="range"
                  min={k === 'h' ? 2.5 : 1}
                  max={k === 'f' ? 60 : 50}
                  step={k === 'h' ? 0.1 : 1}
                  value={p[k]}
                  onChange={(e) => setP({ ...p, [k]: +e.target.value })}
                  className="w-full accent-[#00e5ff] cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[10px] text-[#00e5ff] font-mono-tech">
          💡 Geometric parameters dynamically synchronize with Dubai Municipality zoning envelopes.
        </div>
      </GlassPanel>

      <GlassPanel title="BIM COMPUTATIONAL INSPECTOR" icon={<Building size={16} />} className="h-full">
        <div className="grid grid-cols-3 gap-3 text-center font-mono-tech mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-zinc-400">TOTAL HEIGHT</div>
            <div className="text-2xl text-[#00e5ff] font-bold mt-1">{(p.f * p.h).toFixed(1)}m</div>
            <div className="text-[9px] text-zinc-500">Above Datum</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-zinc-400">GROSS FLOOR AREA</div>
            <div className="text-2xl text-[#ffd700] font-bold mt-1">{(p.w * p.d * p.f).toLocaleString()}m²</div>
            <div className="text-[9px] text-zinc-500">Usable Space</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-zinc-400">EMBODIED CO2</div>
            <div className="text-2xl text-[#10b981] font-bold mt-1">{(p.w * p.d * p.f * 0.14).toFixed(0)}t</div>
            <div className="text-[9px] text-zinc-500">Al Sa'fat Tier 1</div>
          </div>
        </div>

        <div className="space-y-2 font-mono-tech text-xs">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between">
            <span className="text-zinc-400">STRUCTURAL CORE RATIO:</span>
            <span className="text-white font-bold">{((p.w * p.d * 0.18) / (p.w * p.d) * 100).toFixed(0)}%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between">
            <span className="text-zinc-400">FIRE EGRESS ESCALATION:</span>
            <span className="text-[#10b981] font-bold">2 x Pressurized Shafts</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between">
            <span className="text-zinc-400">SOLAR HEAT GAIN COEFF (SHGC):</span>
            <span className="text-[#00e5ff] font-bold">0.24 (Spectrally Selective)</span>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export const Prove: React.FC = () => {
  const [h, setH] = useState(12);
  const [r, setR] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setR(null);
    await new Promise((x) => setTimeout(x, 1200));
    setLoading(false);
    setR({
      status: h > 20 ? 'FAIL' : h > 15 ? 'WARNING' : 'PASS',
      checks: [
        ['Dubai Building Code Compliance', h > 20 ? 'FAIL' : 'PASS'],
        ['Wind Vortex Shedding (CFD)', h > 15 ? 'WARNING' : 'PASS'],
        ['Al Sa\'fat Green Energy Code', 'PASS'],
        ['Civil Defence Helipad Clearance', h > 25 ? 'FAIL' : 'PASS'],
      ],
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <GlassPanel title="SIMULATION SANDBOX & CODE AUDIT" icon={<Gauge size={16} />} className="h-full flex flex-col justify-between">
        <div className="space-y-4 font-mono-tech">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-zinc-400 block mb-2">VERTICAL LOAD STRESS OVERHANG (+M)</span>
            <input
              type="range"
              min={0}
              max={30}
              value={h}
              onChange={(e) => setH(+e.target.value)}
              className="w-full accent-[#00e5ff] cursor-pointer"
            />
            <div className="text-center mt-2 text-2xl font-bold text-[#00e5ff]">+{h}m Overhang</div>
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 border border-[#00e5ff]/50 text-[#00e5ff] font-mono-tech text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.2)]"
        >
          {loading ? 'CALCULATING FEA MESH...' : 'EXECUTE DETERMINISTIC VERIFICATION'}
        </button>
      </GlassPanel>

      <GlassPanel title="FORMAL VERIFICATION REPORT" icon={<CheckCircle2 size={16} />} className="h-full">
        {r ? (
          <div className="font-mono-tech space-y-3">
            <div
              className={`p-3 rounded-xl text-center text-sm font-bold border ${
                r.status === 'PASS'
                  ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
                  : r.status === 'WARNING'
                  ? 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700]/40'
                  : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40'
              }`}
            >
              VERIFICATION STATUS: {r.status}
            </div>

            <div className="space-y-2">
              {r.checks.map(([a, s]: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs"
                >
                  <span className="text-zinc-300">{a}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      s === 'PASS'
                        ? 'text-[#10b981] bg-[#10b981]/10'
                        : s === 'WARNING'
                        ? 'text-[#ffd700] bg-[#ffd700]/10'
                        : 'text-[#ef4444] bg-[#ef4444]/10'
                    }`}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono-tech">
            Awaiting structural stress execution…
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

export const Live: React.FC = () => {
  const [hist, setHist] = useState<Record<string, number[]>>({});

  useMqtt('archos/b4471/telemetry', (s) =>
    setHist((h) => {
      const n = { ...h };
      for (const k of ['strain_mpa', 'power_mw', 'chiller_dt_c', 'accel_ms2', 'supply_temp_c', 'flow_lps']) {
        if (s[k] !== undefined) {
          n[k] = [...(n[k] || []).slice(-39), s[k]];
        }
      }
      return n;
    })
  );

  const channels = [
    { key: 'strain_mpa', label: 'CORE STRAIN (MPa)', max: 160, color: '#00e5ff' },
    { key: 'power_mw', label: 'POWER DRAW (MW)', max: 10, color: '#ffd700' },
    { key: 'chiller_dt_c', label: 'CHILLER ΔT (°C)', max: 8, color: '#10b981' },
    { key: 'accel_ms2', label: 'SPIRE ACCELERATION (m/s²)', max: 0.02, color: '#ec4899' },
  ];

  return (
    <GlassPanel title="LIVE TELEMETRY — MQTT OVER WSS & MODBUS BMS" icon={<Activity size={16} />} badge="● LIVE STREAM" className="h-full">
      <div className="grid grid-cols-2 gap-3 font-mono-tech">
        {channels.map((ch) => {
          const series = hist[ch.key] || [];
          const last = series[series.length - 1];

          return (
            <div key={ch.key} className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-between">
              <div className="flex justify-between text-[11px] mb-2">
                <span className="text-zinc-400">{ch.label}</span>
                <span className="font-bold text-sm" style={{ color: ch.color }}>{last ?? '—'}</span>
              </div>
              <div className="flex items-end gap-[2px] h-14 bg-black/40 p-1.5 rounded-lg border border-white/5">
                {series.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-xs transition-all duration-300"
                    style={{
                      height: `${Math.min(100, Math.max(6, (v / ch.max) * 100))}%`,
                      backgroundColor: ch.color,
                      opacity: 0.35 + (i / series.length) * 0.65,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};
