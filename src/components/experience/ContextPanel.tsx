// ArchOS Dynamic Context Inspector Panel (Right Rail)
// Single unified context inspector that morphs based on active selection

import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Building2,
  Activity,
  Layers,
  ArrowRight,
  ExternalLink,
  Cpu,
  Zap,
  Globe2,
  CheckCircle2,
  Compass,
  Play,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { ContextSelection, SimulationBranch, AutonomousAgentProcess, PrimaryMode } from '../../types/archosExperience';
import { LandmarkPOI } from '../world/UAE3DWorldModel';
import { UAEIntelligenceEvent } from '../../types/continuousIntelligence';

interface ContextPanelProps {
  selection: ContextSelection;
  onClearSelection: () => void;
  onSelectMode: (mode: PrimaryMode) => void;
  onTriggerSimulationWithEntity?: (entityName: string) => void;
  onSelectEvent?: (event: UAEIntelligenceEvent) => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  selection,
  onClearSelection,
  onSelectMode,
  onTriggerSimulationWithEntity,
  onSelectEvent
}) => {
  const { type, landmark, event, branch, agent } = selection;

  return (
    <aside
      id="archos-context-panel"
      aria-label="Active Operational Context"
      className="fixed top-14 right-0 bottom-24 z-30 w-80 p-3 pointer-events-auto bg-[#000000]/85 backdrop-blur-2xl border-l border-white/10 flex flex-col justify-between overflow-y-auto select-none font-mono text-white custom-scrollbar"
    >
      <div className="space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold">
              Context Engine
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 uppercase">
              {type}
            </span>
            {type !== 'NATIONAL' && (
              <button
                type="button"
                onClick={onClearSelection}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Reset to National Overview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 1. LANDMARK / SPATIAL ENTITY CONTEXT */}
        {type === 'LANDMARK' && landmark && (
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
                {landmark.emirate} · {landmark.district}
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 tracking-tight">
                {landmark.name}
              </h3>
              <p className="text-xs text-neutral-400 font-sans mt-1 leading-relaxed">
                {landmark.description}
              </p>
            </div>

            {/* Reality Telemetry Grid */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5">
                <span className="text-neutral-400">Structural Height</span>
                <span className="font-bold text-white">{landmark.stats.heightM}m</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5">
                <span className="text-neutral-400">Total Gross Area</span>
                <span className="font-bold text-white">{landmark.stats.gfaSqm}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5">
                <span className="text-neutral-400">Energy Standard</span>
                <span className="font-bold text-emerald-400">{landmark.stats.energyRating}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5">
                <span className="text-neutral-400">Transport Flow</span>
                <span className="font-bold text-cyan-300">{landmark.stats.trafficDelay}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Subsurface AQI</span>
                <span className="font-bold text-emerald-300">{landmark.stats.aqi} AQI (Pristine)</span>
              </div>
            </div>

            {/* Epistemic Confidence & Sources */}
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <div>
                  <div className="text-[10px] uppercase font-bold">Confidence Score</div>
                  <div className="text-xs font-bold text-white">96.2% Ground Truth</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-neutral-400">Evidence</div>
                <div className="text-xs font-bold text-cyan-300">27 Sources</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onTriggerSimulationWithEntity) {
                    onTriggerSimulationWithEntity(landmark.name);
                  }
                  onSelectMode('SIMULATE');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>SIMULATE IMPACT ON THIS ENTITY</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('INFO')}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 text-xs flex items-center justify-center gap-1.5 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>INSPECT INTELLIGENCE FEED</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. INTELLIGENCE EVENT CONTEXT */}
        {type === 'EVENT' && event && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    event.verificationState === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : event.verificationState === 'CONFLICTING'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {event.verificationState}
                </span>
                <span className="text-[10px] text-neutral-400">{event.timeFormatted}</span>
              </div>

              <h3 className="text-sm font-bold text-white mt-1.5 tracking-tight">
                {event.headline}
              </h3>
              <p className="text-xs text-neutral-300 font-sans mt-1 leading-relaxed">
                {event.summary}
              </p>
            </div>

            {/* Corroborating Sources */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                Corroborating Evidence ({event.sources.length} Independent Sources)
              </div>
              <div className="space-y-1">
                {event.sources.map((src, srcIdx) => (
                  <div
                    key={`${src.name}-${srcIdx}`}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-neutral-200">{src.name}</div>
                      <div className="text-[9px] text-neutral-500">{src.sourceType}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-cyan-300 font-bold">
                        {Math.round(src.reliabilityScore * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Merkle Root */}
            {event.verificationProof?.merkleProofSha256 && (
              <div className="p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[9px] text-neutral-400 break-all">
                <span className="text-neutral-500">MERKLE PROOF: </span>
                <span className="text-emerald-400">{event.verificationProof.merkleProofSha256}</span>
              </div>
            )}

            {/* Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onTriggerSimulationWithEntity) {
                    onTriggerSimulationWithEntity(event.entityName);
                  }
                  onSelectMode('SIMULATE');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>BRANCH SIMULATION FROM EVENT</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. SIMULATION BRANCH CONTEXT */}
        {type === 'SIMULATION_BRANCH' && branch && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    branch.isAuthoritative
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {branch.isAuthoritative ? '● AUTHORITATIVE REALITY' : '◇ EPHEMERAL BRANCH'}
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">
                  HORIZON: {branch.horizonYear}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-1.5 tracking-tight">
                {branch.name}
              </h3>
              <p className="text-xs text-neutral-300 font-sans mt-1 leading-relaxed">
                {branch.narrativeSummary}
              </p>
            </div>

            {/* Variable & Delta */}
            <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
              <div className="text-[9px] uppercase text-purple-300 font-bold">Simulated Variable</div>
              <div className="text-xs font-bold text-white">{branch.variableName}</div>
              <div className="text-xs text-cyan-300 font-bold">{branch.deltaValue}</div>
            </div>

            {/* Projected Impact Matrix */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                Projected Impact Matrix
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Grid Demand Delta</span>
                  <span className="font-bold text-amber-300">{branch.projectedMetrics.energyDemandDelta}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Traffic Congestion</span>
                  <span className="font-bold text-emerald-300">{branch.projectedMetrics.trafficDelayDelta}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Urban GFA Load</span>
                  <span className="font-bold text-white">{branch.projectedMetrics.gfaLoadDelta}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Carbon Offset Delta</span>
                  <span className="font-bold text-emerald-400">{branch.projectedMetrics.carbonOffsetTons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Capital Capex</span>
                  <span className="font-bold text-cyan-300">{branch.projectedMetrics.budgetVarianceUsd}</span>
                </div>
              </div>
            </div>

            {/* Branch Actions */}
            {!branch.isAuthoritative && (
              <div className="pt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() => alert(`Comparing Scenario ${branch.id} against Authoritative Reality Baseline.`)}
                  className="w-full py-2 px-3 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition-all cursor-pointer shadow-md"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>COMPARE AGAINST BASELINE</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Discarded Ephemeral Branch ${branch.id}. Authoritative Reality preserved.`)}
                  className="w-full py-1.5 px-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-center gap-1.5 hover:bg-red-900/60 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>DISCARD EPHEMERAL BRANCH</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. AUTONOMOUS AGENT PROCESS CONTEXT */}
        {type === 'AGENT' && agent && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {agent.status}
                </span>
                <span className="text-[10px] text-neutral-400">{agent.domain}</span>
              </div>

              <h3 className="text-sm font-bold text-white mt-1.5 tracking-tight">
                {agent.name}
              </h3>
              <p className="text-xs text-cyan-300 font-sans mt-0.5">
                Jurisdiction: {agent.jurisdiction}
              </p>
            </div>

            {/* Active Task & Tool Call */}
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="text-[9px] uppercase text-neutral-400 font-semibold">Active Pipeline Stage</div>
              <div className="text-xs font-bold text-white">{agent.currentStage}</div>
              <div className="text-[10px] text-cyan-400 font-mono break-all pt-1 border-t border-white/5">
                TOOL: {agent.currentToolCall || 'Evaluating invariants'}
              </div>
            </div>

            {/* Reasoning Trace Steps */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                Reasoning Trace (Auditable)
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1 text-[10px] font-mono text-neutral-300">
                {agent.reasoningTrace.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 select-none">›</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Telemetry */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="text-neutral-500">EXEC LATENCY</div>
                <div className="text-xs font-bold text-white">{agent.latencyMs} ms</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="text-neutral-500">POLICY CHECK</div>
                <div className="text-xs font-bold text-emerald-400">{agent.policyComplianceScore}% PASSED</div>
              </div>
            </div>
          </div>
        )}

        {/* 5. NATIONAL OVERVIEW CONTEXT (DEFAULT) */}
        {type === 'NATIONAL' && (
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
                UNITED ARAB EMIRATES
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5 tracking-tight">
                Sovereign National Reality State
              </h3>
              <p className="text-xs text-neutral-400 font-sans mt-1 leading-relaxed">
                Authoritative continuous digital twin synchronized across all 7 Emirates.
              </p>
            </div>

            {/* National Baseline Grid */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="text-neutral-400">Total Population</span>
                <span className="font-bold text-white">10.24M Citizens & Residents</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="text-neutral-400">Clean Energy Baseload</span>
                <span className="font-bold text-emerald-400">5.6 GW Nuclear + 3.2 GW Solar</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="text-neutral-400">Container Port Capacity</span>
                <span className="font-bold text-white">22.4M TEU Annual Throughput</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="text-neutral-400">Sovereign Airspace</span>
                <span className="font-bold text-cyan-300">1,842 Live Flight Tracks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Epistemic Integrity</span>
                <span className="font-bold text-emerald-400">99.98% Merkle Validated</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => onSelectMode('SIMULATE')}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>LAUNCH SCENARIO SIMULATION</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('AGENTS')}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 text-xs flex items-center justify-center gap-1.5 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>ORCHESTRATE AGENT FABRIC</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sync Stamp */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-500">
        <span>LAST SYNC: 12.4s AGO</span>
        <span className="text-emerald-400 font-semibold">● SOVEREIGN READY</span>
      </div>
    </aside>
  );
};
