// ArchOS Autonomous Agent Fabric Canvas ("Who is acting?")
// Answers: "What autonomous processes are operating?"
// Visualizes agent workers, continuous execution pipelines, and auditable reasoning traces.

import React from 'react';
import {
  Cpu,
  Sparkles,
  Activity,
  ShieldCheck,
  Zap,
  ArrowRight,
  Terminal,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Lock,
  Layers,
  Search
} from 'lucide-react';
import { AutonomousAgentProcess } from '../../types/archosExperience';

interface AgentFabricCanvasProps {
  agents: AutonomousAgentProcess[];
  selectedAgentId: string | null;
  onSelectAgent: (agent: AutonomousAgentProcess) => void;
  onTriggerAgentTask: (agentId: string, taskPrompt: string) => void;
}

export const AgentFabricCanvas: React.FC<AgentFabricCanvasProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onTriggerAgentTask
}) => {
  const pipelineStages = [
    'INTENT',
    'CONTEXT',
    'PLAN',
    'AGENTS',
    'TOOLS',
    'EXECUTION',
    'OBSERVE',
    'VERIFY',
    'COMMIT'
  ];

  return (
    <div
      id="archos-agent-fabric-canvas"
      className="relative w-full h-full p-8 overflow-y-auto font-mono text-white select-none bg-gradient-to-b from-[#06080d] to-[#000000] custom-scrollbar"
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-32">
        {/* Header Banner */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs uppercase font-bold tracking-widest">
            <Cpu className="w-4 h-4" />
            <span>Autonomous Agent Orchestration Fabric</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            "Who Is Operating in the UAE Digital Twin?"
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-0.5 max-w-3xl">
            Autonomous specialist workers operating under sovereign policy constraints. All tool invocations and state reconciliations are cryptographically verifiable.
          </p>

          {/* Continuous Pipeline Visualization */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">
              Orchestration Invariant Pipeline:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {pipelineStages.map((stage, idx) => (
                <React.Fragment key={stage}>
                  <div className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-neutral-300 font-bold whitespace-nowrap text-[10px]">
                    {stage}
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Live Active Autonomous Workers Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-neutral-300 font-bold">
                {agents.length} Active Specialist Workers
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">
              POLICY INVARIANT COMPLIANCE: 100%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const isSelected = selectedAgentId === agent.id;

              return (
                <div
                  key={agent.id}
                  onClick={() => onSelectAgent(agent)}
                  className={`p-5 rounded-2xl transition-all cursor-pointer border flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-2xl ring-2 ring-cyan-500/20'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {agent.status}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase">
                          {agent.domain}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {agent.lastActive}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{agent.name}</h3>
                      <p className="text-xs text-neutral-400 font-sans mt-0.5">
                        Jurisdiction: <span className="text-neutral-200">{agent.jurisdiction}</span>
                      </p>
                    </div>

                    {/* Active Task */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="text-[9px] uppercase text-neutral-400 font-semibold">Active Operational Objective</div>
                      <div className="text-xs font-bold text-white leading-relaxed">{agent.activeTask}</div>
                      <div className="text-[10px] text-cyan-300 font-mono break-all pt-1 border-t border-white/5">
                        TOOL: {agent.currentToolCall || 'Evaluating invariants'}
                      </div>
                    </div>

                    {/* Reasoning Trace Steps */}
                    <div className="space-y-1">
                      <div className="text-[9px] text-neutral-400 uppercase font-semibold">
                        Audit Reasoning Trace
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1 text-[10px] text-neutral-300">
                        {agent.reasoningTrace.slice(0, 2).map((trace, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-cyan-400 select-none">›</span>
                            <span className="truncate">{trace}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Telemetry & Action Footer */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                      <span>LATENCY: <strong className="text-white">{agent.latencyMs}ms</strong></span>
                      <span>PROCESSED: <strong className="text-cyan-300">{agent.eventsProcessed}</strong></span>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-400 text-black'
                          : 'bg-white/5 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'ACTIVE IN CONTEXT' : 'INSPECT AGENT'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
