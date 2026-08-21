import React from 'react';
import { motion } from 'motion/react';
import { ScenarioBuilder } from './ScenarioBuilder';
import { VerificationPanel } from './VerificationPanel';
import { useArchOSStore } from '../../store/archosStore';
import {
  FlaskConical,
  Shield,
  Layers,
  Cpu,
  Terminal,
  Activity,
  Box,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ProveSandboxView: React.FC = () => {
  const { activeScenario, simulationResult, isSimulating } = useArchOSStore();

  return (
    <div className="relative w-full h-full bg-[#05080e] overflow-y-auto custom-scrollbar p-4 md:p-6 select-none font-mono-tech">
      {/* Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00e5ff08_1px,transparent_1px),linear-gradient(to_bottom,#00e5ff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#ff006e]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#00e5ff]/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-wider text-[#f5f4f0] flex items-center gap-2">
                ARCHOS SIMULATION SANDBOX
                <span className="text-xs px-2 py-0.5 rounded bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 font-normal">
                  PROVE STAGE
                </span>
              </h1>
              <p className="text-xs text-[#8e8d88]">
                Isolated Digital Twin State · Zero-Production Mutation · Multi-Agent Synthetic Constraint Checks
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#09101c]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
            </span>
            <span className="text-xs text-[#8e8d88]">State:</span>
            <span className="text-xs font-bold text-[#00ff88]">SANDBOX CLONED</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff]">
            <Cpu className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">4 AGENTS ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scenario Builder (Col 1-4) */}
        <div className="lg:col-span-4 space-y-4">
          <ScenarioBuilder />

          {/* Sandbox Architecture Principles */}
          <div className="rounded-xl border border-white/10 bg-[#070d18]/80 p-4 space-y-2 text-xs">
            <h4 className="text-[11px] font-bold text-[#00e5ff] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00e5ff]" />
              Authority Separation Principle
            </h4>
            <p className="text-[11px] text-[#8e8d88] leading-relaxed">
              Hypothetical building modifications are executed against an ephemeral snapshot of the UAE World Model. Production telemetry and zoning databases remain completely immutable until formal consensus sign-off.
            </p>
          </div>
        </div>

        {/* Center Column: Digital Twin Sandbox Visualizer (Col 5-8) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-[#00e5ff]/30 bg-[#070d18]/90 backdrop-blur-xl p-4 flex flex-col shadow-[0_0_25px_rgba(0,229,255,0.15)] min-h-[460px]">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#00e5ff]" />
                <span className="text-xs font-bold text-[#00e5ff] tracking-wider">SANDBOX TWIN VIEWPORT</span>
              </div>
              <span className="text-[10px] text-[#8e8d88]">DUBAI CREEK TOWER B-4471</span>
            </div>

            {/* Visualizer Canvas Mock / Wireframe */}
            <div className="relative flex-1 rounded-lg border border-white/10 bg-[#05080e] overflow-hidden flex flex-col items-center justify-center p-6 text-center group">
              <div className="absolute inset-0 bg-[radial-gradient(#00e5ff15_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Tower Wireframe Graphic with Dynamic Height Offset */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Spire */}
                <div
                  className="w-1 bg-[#00e5ff] shadow-[0_0_12px_#00e5ff] transition-all duration-500 rounded-t"
                  style={{
                    height: `${28 + (activeScenario?.parameters?.heightDelta || 0) * 2}px`
                  }}
                />
                {/* Upper Core */}
                <div
                  className={`w-14 border transition-all duration-500 flex items-center justify-center text-[9px] ${
                    activeScenario?.parameters?.facadeMaterial === 'glass'
                      ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff]'
                      : activeScenario?.parameters?.facadeMaterial === 'composite'
                      ? 'bg-[#ff6b35]/20 border-[#ff6b35] text-[#ff6b35]'
                      : 'bg-white/10 border-white/30 text-white/70'
                  }`}
                  style={{
                    height: `${60 + (activeScenario?.parameters?.heightDelta || 0) * 1.5}px`
                  }}
                >
                  <span className="rotate-90">MEP CORE</span>
                </div>
                {/* Lower Podium */}
                <div className="w-24 h-16 border border-[#00e5ff]/40 bg-[#00e5ff]/5 flex items-center justify-center text-[10px] text-[#00e5ff]">
                  PODIUM
                </div>
                {/* Foundation Ground Plane */}
                <div className="w-40 h-1 bg-[#00e5ff]/30 shadow-[0_0_8px_#00e5ff] mt-1" />
              </div>

              {/* Parameter Overlay Badges */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] bg-[#09101c]/90 px-3 py-1.5 rounded border border-white/10">
                <span className="text-[#8e8d88]">
                  Height Delta: <span className="text-[#00e5ff] font-bold">+{activeScenario?.parameters?.heightDelta ?? 0}m</span>
                </span>
                <span className="text-[#8e8d88]">
                  Facade: <span className="text-[#00e5ff] font-bold uppercase">{activeScenario?.parameters?.facadeMaterial ?? 'concrete'}</span>
                </span>
              </div>

              {isSimulating && (
                <div className="absolute inset-0 bg-[#05080e]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                  <div className="relative flex h-8 w-8 mb-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-[#00e5ff]/20 border border-[#00e5ff] items-center justify-center">
                      <Cpu className="w-4 h-4 text-[#00e5ff] animate-spin" />
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#00e5ff] tracking-wider animate-pulse">
                    SYNTHETIC REASONING PIPELINE...
                  </span>
                  <span className="text-[10px] text-[#8e8d88] mt-1">Evaluating CFD, RTA Setbacks & DEWA Specs</span>
                </div>
              )}
            </div>

            {/* Telemetry Snapshot during Simulation */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-[#09101c] p-2 rounded border border-white/5">
                <span className="text-[#8e8d88] block text-[9px]">WIND SHEAR</span>
                <span className="text-[#00e5ff] font-bold">
                  {((activeScenario?.parameters?.heightDelta || 0) * 1.8 + 24.5).toFixed(1)} m/s
                </span>
              </div>
              <div className="bg-[#09101c] p-2 rounded border border-white/5">
                <span className="text-[#8e8d88] block text-[9px]">SOLAR GAIN</span>
                <span className="text-[#00e5ff] font-bold">
                  {activeScenario?.parameters?.facadeMaterial === 'glass' ? '+18%' : '+1.2%'}
                </span>
              </div>
              <div className="bg-[#09101c] p-2 rounded border border-white/5">
                <span className="text-[#8e8d88] block text-[9px]">SEISMIC LOAD</span>
                <span className="text-[#00e5ff] font-bold">Zone 2A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Panel (Col 9-12) */}
        <div className="lg:col-span-4 space-y-4">
          <VerificationPanel />
        </div>
      </div>
    </div>
  );
};
