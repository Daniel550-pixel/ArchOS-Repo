// ArchOS Simulation Branching Canvas ("What if?")
// Visualizes the branching scenario mental model:
// WORLD MODEL -> CURRENT REALITY -> SIMULATION -> ALTERNATIVE FUTURE
// Clearly distinguishes ● AUTHORITATIVE REALITY from ◇ SIMULATION BRANCH (EPHEMERAL)

import React, { useState } from 'react';
import {
  GitBranch,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  ShieldAlert,
  Zap,
  TrendingUp
} from 'lucide-react';
import { SimulationBranch } from '../../types/archosExperience';
import { simulationAndAgentService } from '../../services/intelligence/simulationAndAgentService';

interface SimulationBranchingCanvasProps {
  branches: SimulationBranch[];
  selectedBranchId: string;
  onSelectBranch: (branch: SimulationBranch) => void;
  onBranchCreated: (branch: SimulationBranch) => void;
}

export const SimulationBranchingCanvas: React.FC<SimulationBranchingCanvasProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  onBranchCreated
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<number>(2035);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [newVariable, setNewVariable] = useState<string>('Desalination & Clean Hydrogen Capacity');
  const [newDelta, setNewDelta] = useState<string>('+35% Output Expansion');

  const authoritativeBranch = branches.find(b => b.isAuthoritative) || branches[0];
  const ephemeralBranches = branches.filter(b => !b.isAuthoritative);

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const created = simulationAndAgentService.createBranch({
      name: newBranchName.trim(),
      variableName: newVariable,
      deltaValue: newDelta,
      horizonYear: selectedHorizon
    });

    onBranchCreated(created);
    onSelectBranch(created);
    setShowCreateModal(false);
    setNewBranchName('');
  };

  return (
    <div
      id="archos-simulation-branching-canvas"
      className="relative w-full h-full p-8 overflow-y-auto font-mono text-white select-none bg-gradient-to-b from-[#06080d] to-[#000000] custom-scrollbar"
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-32">
        {/* Header Horizon & Integrity Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs uppercase font-bold tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>Causal Scenario Branching Engine</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              "What If?" Multi-Horizon Futures
            </h1>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Authoritative World Model state remains immutable. All simulated projections spawn as sandboxed ephemeral branches.
            </p>
          </div>

          {/* Horizon Scrubbing Controls */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/60 border border-white/10">
            <span className="text-[10px] text-neutral-400 px-2 uppercase font-semibold">
              Horizon:
            </span>
            {[2026, 2030, 2031, 2032, 2035].map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedHorizon(year)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedHorizon === year
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Branching Tree Structure */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span className="text-xs uppercase tracking-widest text-neutral-300 font-bold">
                Scenario Topology Graph
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>SPAWN NEW SCENARIO BRANCH</span>
            </button>
          </div>

          {/* Root Authoritative Reality Card */}
          <div className="p-5 rounded-2xl bg-emerald-950/10 border-2 border-emerald-500/40 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    ● AUTHORITATIVE REALITY (GROUND TRUTH)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-500/30">
                    IMMUTABLE ROOT
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">
                  {authoritativeBranch.name}
                </h3>
                <p className="text-xs text-neutral-300 font-sans mt-1 max-w-3xl">
                  {authoritativeBranch.narrativeSummary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectBranch(authoritativeBranch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedBranchId === authoritativeBranch.id
                    ? 'bg-emerald-400 text-black border-emerald-400'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
                }`}
              >
                {selectedBranchId === authoritativeBranch.id ? 'SELECTED' : 'INSPECT BASELINE'}
              </button>
            </div>

            {/* Baseline Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-emerald-500/20 text-xs">
              <div className="p-2 rounded-lg bg-black/40">
                <span className="text-[10px] text-neutral-400 uppercase">National Peak Grid</span>
                <div className="font-bold text-white mt-0.5">{authoritativeBranch.projectedMetrics.energyDemandDelta}</div>
              </div>
              <div className="p-2 rounded-lg bg-black/40">
                <span className="text-[10px] text-neutral-400 uppercase">Urban GFA Registered</span>
                <div className="font-bold text-white mt-0.5">{authoritativeBranch.projectedMetrics.gfaLoadDelta}</div>
              </div>
              <div className="p-2 rounded-lg bg-black/40">
                <span className="text-[10px] text-neutral-400 uppercase">Baseload Clean Carbon</span>
                <div className="font-bold text-emerald-400 mt-0.5">{authoritativeBranch.projectedMetrics.carbonOffsetTons}</div>
              </div>
              <div className="p-2 rounded-lg bg-black/40">
                <span className="text-[10px] text-neutral-400 uppercase">Integrity Status</span>
                <div className="font-bold text-emerald-300 mt-0.5">{authoritativeBranch.confidenceScore}% Validated</div>
              </div>
            </div>
          </div>

          {/* Branch Forking Connector Line */}
          <div className="flex items-center justify-center py-2">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-purple-500" />
              <div className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                CAUSAL FORK (EPHEMERAL SANDBOX)
              </div>
              <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-purple-500" />
            </div>
          </div>

          {/* Ephemeral Simulation Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ephemeralBranches.map((branch) => {
              const isSelected = selectedBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  onClick={() => onSelectBranch(branch)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-400 shadow-2xl ring-2 ring-purple-500/20'
                      : 'bg-white/[0.02] border-white/10 hover:border-purple-500/40 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-purple-400 text-xs">◇</span>
                        <span className="text-xs font-bold text-purple-300">{branch.id}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30 font-bold">
                        {branch.horizonYear} HORIZON
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{branch.name}</h4>
                      <p className="text-xs text-neutral-400 font-sans mt-1 line-clamp-2">
                        {branch.narrativeSummary}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="text-[9px] uppercase text-neutral-400 font-semibold">Simulated Delta</div>
                      <div className="text-xs font-bold text-white">{branch.variableName}</div>
                      <div className="text-xs font-bold text-cyan-300">{branch.deltaValue}</div>
                    </div>

                    <div className="space-y-1 text-[11px] pt-1">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span>Grid Demand:</span>
                        <span className="text-amber-300 font-bold">{branch.projectedMetrics.energyDemandDelta}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-400">
                        <span>Traffic Flow:</span>
                        <span className="text-emerald-300 font-bold">{branch.projectedMetrics.trafficDelayDelta}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-400">
                        <span>Capex Budget:</span>
                        <span className="text-cyan-300 font-bold">{branch.projectedMetrics.budgetVarianceUsd}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-neutral-400">Confidence: {branch.confidenceScore}%</span>
                    <span className={`text-xs font-bold ${isSelected ? 'text-purple-300' : 'text-neutral-400'}`}>
                      {isSelected ? 'ACTIVE IN CONTEXT' : 'CLICK TO INSPECT'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Create New Simulation Branch */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg p-6 rounded-2xl bg-[#0d1017] border border-purple-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Spawn Ephemeral Scenario Branch</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateBranch} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">SCENARIO NAME</label>
                  <input
                    type="text"
                    required
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="e.g. 2035 Al Dhafra AI Sovereign Datacenter Surge"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">TARGET VARIABLE</label>
                  <input
                    type="text"
                    required
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    placeholder="e.g. Autonomous Heavy Rail Freight Logistics"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">DELTA VALUE</label>
                  <input
                    type="text"
                    required
                    value={newDelta}
                    onChange={(e) => setNewDelta(e.target.value)}
                    placeholder="e.g. +45% Throughput from Saqr Port to Jebel Ali"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                  >
                    INITIALIZE BRANCH
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
