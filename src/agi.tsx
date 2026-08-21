import React, { useEffect, useState } from 'react';
import { GlassPanel } from './ui';
import { Brain, Cpu, Network, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const Meta: React.FC = () => {
  const [load, setLoad] = useState(0.65);
  const [entropy, setEntropy] = useState(0.12);

  useEffect(() => {
    const i = setInterval(() => {
      setLoad((l) => Math.min(1, Math.max(0.3, l + (Math.random() - 0.5) * 0.1)));
      setEntropy((e) => Math.min(0.3, Math.max(0.05, e + (Math.random() - 0.5) * 0.02)));
    }, 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <GlassPanel title="META-COGNITION & RECURSIVE ENCLAVE" icon={<Brain size={16} />} className="h-full font-mono-tech">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>WORKING MEMORY ALLOCATION</span>
            <span className="text-[#00e5ff] font-bold">{(load * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#00e5ff]"
              style={{ width: `${load * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>SYSTEM EPISTEMIC ENTROPY</span>
            <span className="text-[#10b981] font-bold">{entropy.toFixed(3)} H</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#10b981]"
              style={{ width: `${entropy * 300}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <div className="text-xs text-zinc-300 font-bold flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#ffd700]" />
            <span>RECURSIVE REFLECTION LOG</span>
          </div>
          <div className="text-[10px] text-[#00e5ff] space-y-1">
            <div>• Formal verification accuracy: <strong className="text-white">+3.2%</strong></div>
            <div>• Decision threshold adjusted → <strong className="text-white">0.782</strong></div>
            <div>• Alignment constraint verification: <strong className="text-[#10b981]">0.9995 (LOCKED)</strong></div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

export const Swarm: React.FC = () => {
  const [a, setA] = useState([0.72, 0.88, 0.54, 0.63]);

  useEffect(() => {
    const i = setInterval(() => {
      setA((x) =>
        x.map((v) => Math.min(1, Math.max(0.2, v + (Math.random() - 0.5) * 0.2)))
      );
    }, 2000);
    return () => clearInterval(i);
  }, []);

  const agents = [
    { name: 'AGENT-01 (STRUCTURAL STABILITY)', role: 'FEM / Load Stress' },
    { name: 'AGENT-02 (THERMAL HVAC FLOW)', role: 'Modbus / Chiller Loop' },
    { name: 'AGENT-03 (ZONING ENVELOPE AUDIT)', role: 'Dubai Building Code' },
    { name: 'AGENT-04 (FINANCIAL RISK-PRICING)', role: 'Yield & Underwriting' },
  ];

  return (
    <GlassPanel title="AUTONOMOUS AGENT SWARM" icon={<Network size={16} />} className="h-full font-mono-tech">
      <div className="space-y-3">
        {agents.map((ag, i) => {
          const w = a[i] || 0.5;
          return (
            <div key={ag.name} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex justify-between text-xs mb-1">
                <div>
                  <span className="text-zinc-200 font-bold block text-[11px]">{ag.name}</span>
                  <span className="text-[9px] text-zinc-500">{ag.role}</span>
                </div>
                <span className="text-[#00e5ff] font-bold text-xs">{(w * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full ${w > 0.8 ? 'bg-[#ffd700]' : 'bg-[#10b981]'}`}
                  style={{ width: `${w * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};
