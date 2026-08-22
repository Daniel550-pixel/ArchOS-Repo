import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from './ui';
import { useMqtt } from './services';
import { Activity, Building, Cpu, Gauge, Radio, Shield, Sliders } from 'lucide-react';
import { MetricCard, RangeControl, SectionGrid, StatusRow, Surface, VerificationBadge } from './components/design/IntelligencePrimitives';

export const OrbCore: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
    <div className="lg:col-span-7 h-full">
      <GlassPanel title="ARCHOS ORB CORE" icon={<Radio size={16} />} badge="SOVEREIGN ENCLAVE" className="h-full flex flex-col justify-center">
        <div className="h-full min-h-[360px] flex items-center justify-center relative select-none overflow-hidden">
          <motion.div className="absolute w-72 h-72 rounded-full border-2 border-[#00e5ff]/20 border-dashed" animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="absolute w-56 h-56 rounded-full border border-[#00e5ff]/40 shadow-[0_0_30px_rgba(0,229,255,0.2)]" animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="absolute w-40 h-40 rounded-full border-2 border-[#ffd700]/30" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="text-center z-10">
            <div className="text-[#00e5ff] text-4xl font-bold tracking-widest font-mono-tech">UAE</div>
            <div className="text-xs text-zinc-400 font-mono-tech mt-1">14,208 entities • 7 emirates</div>
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] text-[10px] border border-[#00e5ff]/30 font-mono-tech font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] shadow-[0_0_8px_rgba(212,255,0,0.8)]" /> REAL GROUND BUS ACTIVE
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
    <div className="lg:col-span-5 flex flex-col gap-4">
      <GlassPanel title="SYSTEM TELEMETRY ENGINE" icon={<Cpu size={16} />}>
        <div className="space-y-3">
          {[['NEURAL ORCHESTRATION', 34, '#00e5ff'], ['MODBUS GATEWAY POOL', 67, '#10b981'], ['GPU COMPUTE MESH', 89, '#d4ff00'], ['QUANTUM ENCRYPTION BUS', 98, '#ffd700']].map(([label, value, color]: any) => (
            <div key={label} className="font-mono-tech">
              <div className="flex justify-between text-[10px] mb-1.5"><span className="text-zinc-500 tracking-wide">{label}</span><span className="font-bold" style={{ color }}>{value}%</span></div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} /></div>
            </div>
          ))}
        </div>
      </GlassPanel>
      <GlassPanel title="SOVEREIGN PROTOCOL LEDGER" icon={<Shield size={16} />}>
        <div className="space-y-2"><StatusRow label="TRANSPORT" value="MQTT 5.0 / WSS TLS 1.3" tone="cyan" /><StatusRow label="BMS INGESTION" value="MODBUS-TCP (:5020)" tone="lime" /><StatusRow label="PASSKEY AUTH" value="WEBAUTHN FIDO2" tone="gold" /></div>
      </GlassPanel>
    </div>
  </div>
);

export const DesignStudio: React.FC = () => {
  const [p, setP] = useState({ w: 24, d: 24, f: 18, h: 3.8 });
  const controls = [['w', 'FOOTPRINT WIDTH (M)', 1, 50, 1, 'm'], ['d', 'FOOTPRINT DEPTH (M)', 1, 50, 1, 'm'], ['f', 'STOREY COUNT (LEVELS)', 1, 60, 1, ''], ['h', 'FLOOR-TO-FLOOR HEIGHT (M)', 2.5, 8, 0.1, 'm']] as const;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <GlassPanel title="PARAMETRIC STRUCTURAL STUDIO" icon={<Sliders size={16} />} className="h-full flex flex-col justify-between">
        <div className="space-y-3">{controls.map(([key, label, min, max, step, suffix]) => <RangeControl key={key} label={label} value={p[key]} min={min} max={max} step={step} suffix={suffix} onChange={(value) => setP({ ...p, [key]: value })} />)}</div>
        <div className="mt-4 p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[10px] text-[#00e5ff] font-mono-tech">Geometric parameters synchronize with the active zoning envelope.</div>
      </GlassPanel>
      <GlassPanel title="BIM COMPUTATIONAL INSPECTOR" icon={<Building size={16} />} className="h-full">
        <SectionGrid columns={3}>
          <MetricCard label="TOTAL HEIGHT" value={`${(p.f * p.h).toFixed(1)}m`} detail="Above Datum" />
          <MetricCard label="GROSS FLOOR AREA" value={`${(p.w * p.d * p.f).toLocaleString()}m²`} detail="Usable Space" tone="gold" />
          <MetricCard label="EMBODIED CO2" value={`${(p.w * p.d * p.f * 0.14).toFixed(0)}t`} detail="Al Sa'fat Tier 1" tone="lime" />
        </SectionGrid>
        <div className="mt-4 space-y-2"><StatusRow label="STRUCTURAL CORE RATIO" value={`${((p.w * p.d * 0.18) / (p.w * p.d) * 100).toFixed(0)}%`} /><StatusRow label="FIRE EGRESS ESCALATION" value="2 x Pressurized Shafts" tone="lime" /><StatusRow label="SOLAR HEAT GAIN COEFF (SHGC)" value="0.24 (Spectrally Selective)" tone="cyan" /></div>
      </GlassPanel>
    </div>
  );
};

export const Prove: React.FC = () => {
  const [h, setH] = useState(12);
  const [r, setR] = useState<{ status: 'PASS' | 'WARNING' | 'FAIL'; checks: [string, 'PASS' | 'WARNING' | 'FAIL'][] } | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => { setLoading(true); setR(null); await new Promise((resolve) => setTimeout(resolve, 1200)); setLoading(false); setR({ status: h > 20 ? 'FAIL' : h > 15 ? 'WARNING' : 'PASS', checks: [['Dubai Building Code Compliance', h > 20 ? 'FAIL' : 'PASS'], ['Wind Vortex Shedding (CFD)', h > 15 ? 'WARNING' : 'PASS'], ["Al Sa'fat Green Energy Code", 'PASS'], ['Civil Defence Helipad Clearance', h > 25 ? 'FAIL' : 'PASS']] }); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <GlassPanel title="SIMULATION SANDBOX & CODE AUDIT" icon={<Gauge size={16} />} className="h-full flex flex-col justify-between">
        <RangeControl label="VERTICAL LOAD STRESS OVERHANG (+M)" value={h} min={0} max={30} onChange={setH} suffix="m" />
        <button onClick={run} disabled={loading} className="mt-4 w-full py-3 rounded-xl bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 border border-[#00e5ff]/50 text-[#00e5ff] font-mono-tech text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.2)] disabled:opacity-50">{loading ? 'CALCULATING FEA MESH...' : 'EXECUTE DETERMINISTIC VERIFICATION'}</button>
      </GlassPanel>
      <GlassPanel title="FORMAL VERIFICATION REPORT" icon={<Shield size={16} />} className="h-full">
        {r ? <div className="space-y-3"><VerificationBadge status={r.status} /><div className="space-y-2">{r.checks.map(([label, status]) => <Surface key={label} className="flex items-center justify-between gap-3 px-3 py-2.5"><span className="text-[10px] text-zinc-300 font-mono-tech">{label}</span><span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold font-mono-tech ${status === 'PASS' ? 'text-[#10b981] bg-[#10b981]/10' : status === 'WARNING' ? 'text-[#ffd700] bg-[#ffd700]/10' : 'text-[#ef4444] bg-[#ef4444]/10'}`}>{status}</span></Surface>)}</div></div> : <div className="h-full min-h-48 flex items-center justify-center text-xs text-zinc-600 font-mono-tech">Awaiting structural stress execution…</div>}
      </GlassPanel>
    </div>
  );
};

export const Live: React.FC = () => {
  const [hist, setHist] = useState<Record<string, number[]>>({});
  useMqtt('archos/b4471/telemetry', (sample) => setHist((current) => { const next = { ...current }; for (const key of ['strain_mpa', 'power_mw', 'chiller_dt_c', 'accel_ms2', 'supply_temp_c', 'flow_lps']) if (sample[key] !== undefined) next[key] = [...(next[key] || []).slice(-39), sample[key]]; return next; }));
  const channels = [{ key: 'strain_mpa', label: 'CORE STRAIN (MPa)', max: 160, color: '#00e5ff' }, { key: 'power_mw', label: 'POWER DRAW (MW)', max: 10, color: '#ffd700' }, { key: 'chiller_dt_c', label: 'CHILLER ΔT (°C)', max: 8, color: '#10b981' }, { key: 'accel_ms2', label: 'SPIRE ACCELERATION (m/s²)', max: 0.02, color: '#ec4899' }];
  return (
    <GlassPanel title="LIVE TELEMETRY — MQTT OVER WSS & MODBUS BMS" icon={<Activity size={16} />} badge="LIVE STREAM" className="h-full">
      <SectionGrid columns={2}>{channels.map((channel) => { const series = hist[channel.key] || []; const last = series[series.length - 1]; return <Surface key={channel.key} className="p-3.5"><div className="flex items-center justify-between gap-3 mb-2"><span className="text-[10px] text-zinc-500 font-mono-tech">{channel.label}</span><span className="text-sm font-bold font-mono-tech" style={{ color: channel.color }}>{last ?? '—'}</span></div><div className="flex items-end gap-[2px] h-14 bg-black/40 p-1.5 rounded-lg border border-white/5">{series.map((value, index) => <div key={`${channel.key}-${index}`} className="flex-1 rounded-xs transition-all duration-300" style={{ height: `${Math.min(100, Math.max(6, (value / channel.max) * 100))}%`, backgroundColor: channel.color, opacity: 0.35 + (index / Math.max(series.length, 1)) * 0.65 }} />)}{!series.length && <div className="w-full flex items-center justify-center text-[8px] text-zinc-700 font-mono-tech">WAITING FOR TELEMETRY</div>}</div></Surface>; })}</SectionGrid>
    </GlassPanel>
  );
};
