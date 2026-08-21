import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Terminal,
  Send,
  Lock,
  DollarSign,
  Activity,
  Compass,
  Check,
  Clock,
  KeyRound
} from 'lucide-react';
import {
  JarvisReasoningSession,
  JarvisReasoningStage,
  ActionGateRequest,
  RealityLevel
} from '../../types/archosAgentFabric';
import { agentFabricService } from '../../services/archos/agentFabricService';

interface AgentFabricReasoningStudioProps {
  onSpeak?: (text: string) => void;
}

export const AgentFabricReasoningStudio: React.FC<AgentFabricReasoningStudioProps> = ({
  onSpeak
}) => {
  const [session, setSession] = useState<JarvisReasoningSession | null>(agentFabricService.getActiveSession());
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<JarvisReasoningStage>('10_RESPOND_OR_ACT');
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<ActionGateRequest[]>([]);
  const [actionHistory, setActionHistory] = useState<ActionGateRequest[]>([]);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    // Load specialist agents
    agentFabricService.getSpecialistAgents().then((agents) => {
      if (agents && agents.length > 0) {
        setSpecialists(agents);
      }
    });

    // Subscribe to reasoning sessions
    const unsubSession = agentFabricService.subscribe((active) => {
      if (active) {
        setSession(active);
        setSelectedStage(active.currentStage);
      }
    });

    // Subscribe to Action Gate
    const unsubActionGate = agentFabricService.subscribeActionGate((pending, history) => {
      setPendingActions(pending);
      setActionHistory(history);
    });

    // Initial run if no session
    if (!agentFabricService.getActiveSession()) {
      agentFabricService.runNewReasoningPrompt(
        'Optimize Tower B-4471 chiller load profile for upcoming 48°C peak weekend while ensuring 100% compliance with Dubai Building Code indoor comfort and zero carbon budget breach.'
      );
    }

    return () => {
      unsubSession();
      unsubActionGate();
    };
  }, []);

  const handleRunPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customPrompt.trim() || isRunning) return;
    setIsRunning(true);
    try {
      await agentFabricService.runNewReasoningPrompt(customPrompt);
      setCustomPrompt('');
    } finally {
      setIsRunning(false);
    }
  };

  const handlePresetPrompt = async (prompt: string) => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      await agentFabricService.runNewReasoningPrompt(prompt);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    setIsApproving(actionId);
    try {
      await agentFabricService.approveAction(actionId, 'operator');
    } finally {
      setIsApproving(null);
    }
  };

  const currentStep = session?.steps.find((s) => s.stage === selectedStage) || (session?.steps && session.steps[session.steps.length - 1]);

  const getRealityBadgeColor = (reality?: string) => {
    switch (reality) {
      case 'OBSERVED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'INFERRED':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'PREDICTED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'SIMULATED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'FALLBACK':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] text-[#f5f4f0] font-sans overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#09101c] border-b border-[#00e5ff]/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00e5ff]" />
            <h2 className="text-base font-bold font-mono-tech tracking-wide text-white">
              J.A.R.V.I.S. & THE AGENT FABRIC RUNTIME
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
              PHASE 4 SPECIALIST INTELLIGENCE
            </span>
          </div>
          <p className="text-xs text-[#8e8d88] font-mono-tech">
            10-Stage Model-Backed Deductions, Invariant Verification, and Governed Action Gate
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          {session && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#050811] border border-[#00e5ff]/30 text-xs font-mono-tech">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[#8e8d88]">Task:</span>
              <span className="text-[#00e5ff] font-bold">{session.sessionId}</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] border ${getRealityBadgeColor(session.reality)}`}>
                {session.reality || 'OBSERVED'}
              </span>
            </div>
          )}
          <button
            onClick={() =>
              onSpeak?.(
                session?.finalAnswer ||
                'J.A.R.V.I.S. reasoning loop completed across 10 stages. All sovereign safety invariants cleared.'
              )
            }
            className="px-3 py-1.5 rounded-lg bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] text-xs font-mono-tech font-bold border border-[#00e5ff]/40 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> VOICE BRIEFING
          </button>
        </div>
      </div>

      {/* Specialist Agents Ribbon */}
      <div className="px-4 py-2.5 bg-[#070d19] border-b border-[#00e5ff]/15 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono-tech text-[#8e8d88] uppercase whitespace-nowrap">
          Specialists Active:
        </span>
        {(specialists.length > 0 ? specialists : [
          { id: 'perception', name: 'Perception', workload: 0.12 },
          { id: 'world_model', name: 'World Model', workload: 0.15 },
          { id: 'research', name: 'Research', workload: 0.18 },
          { id: 'reasoning', name: 'Reasoning', workload: 0.22 },
          { id: 'planning', name: 'Planning', workload: 0.14 },
          { id: 'risk', name: 'Risk', workload: 0.08 },
          { id: 'verification', name: 'Verification', workload: 0.11 },
          { id: 'execution', name: 'Execution', workload: 0.05 }
        ]).map((ag: any) => (
          <div
            key={ag.id}
            className="px-2.5 py-1 rounded bg-[#09101c] border border-[#00e5ff]/20 flex items-center gap-1.5 text-xs font-mono-tech whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
            <span className="text-white font-medium">{ag.name.split(' ')[0]}</span>
            <span className="text-[10px] text-[#8e8d88]">({Math.round((ag.workload || 0.1) * 100)}%)</span>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: 10-Stage Timeline & Execution Graph */}
        <div className="w-80 border-r border-[#00e5ff]/20 bg-[#070c18] flex flex-col p-4 space-y-4 overflow-y-auto shrink-0">
          <div>
            <span className="text-[10px] font-mono-tech text-[#8e8d88] uppercase block mb-2">
              Canonical 10-Stage Lifecycle:
            </span>
            <div className="space-y-1.5">
              {[
                { stage: '1_UNDERSTAND', label: '1. Understand Intent' },
                { stage: '2_CONTEXTUALIZE', label: '2. Contextualize Telemetry' },
                { stage: '3_QUERY_WORLD_MODEL', label: '3. Query World Model' },
                { stage: '4_SELECT_AGENTS', label: '4. Select Specialists' },
                { stage: '5_REASON', label: '5. Model Deduction' },
                { stage: '6_PLAN', label: '6. Synthesize Plan' },
                { stage: '7_SIMULATE', label: '7. Assess Risk & Radius' },
                { stage: '9_VERIFY', label: '9. Safety & Invariant Gate' },
                { stage: '10_RESPOND_OR_ACT', label: '10. Governed Action / Synthesis' }
              ].map((st, idx) => {
                const isCurrent = session?.currentStage === st.stage;
                const isSelected = selectedStage === st.stage;
                return (
                  <button
                    key={st.stage}
                    onClick={() => setSelectedStage(st.stage as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono-tech transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/60 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                        : 'bg-[#050811] text-[#8e8d88] border-[#00e5ff]/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-4 text-center font-bold">{idx + 1}</span>
                      <span className="truncate">{st.label}</span>
                    </span>
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Preset Prompts */}
          <div className="pt-2 border-t border-[#00e5ff]/15 space-y-2">
            <span className="text-[10px] font-mono-tech text-[#8e8d88] uppercase block">
              Test Sovereign Invariant Directives:
            </span>
            <button
              onClick={() =>
                handlePresetPrompt(
                  'What are the surveyed heights of Downtown Dubai structures?'
                )
              }
              className="w-full text-left p-2 rounded bg-[#09101c] hover:bg-[#00e5ff]/15 border border-[#00e5ff]/15 text-[11px] font-mono-tech text-[#cbd5e1] hover:text-white transition-all"
            >
              ▸ Downtown Surveyed Heights (Read-Only)
            </button>
            <button
              onClick={() =>
                handlePresetPrompt(
                  'Optimize Tower B-4471 chiller load profile for upcoming 48°C peak weekend while ensuring 100% compliance with Dubai Building Code indoor comfort and zero carbon budget breach.'
                )
              }
              className="w-full text-left p-2 rounded bg-[#09101c] hover:bg-[#00e5ff]/15 border border-[#00e5ff]/15 text-[11px] font-mono-tech text-[#cbd5e1] hover:text-white transition-all"
            >
              ▸ Optimize Tower B-4471 Chiller (Action Gate)
            </button>
            <button
              onClick={() =>
                handlePresetPrompt(
                  'Query live Modbus BMS gateway telemetry for core strain and power draw.'
                )
              }
              className="w-full text-left p-2 rounded bg-[#09101c] hover:bg-[#00e5ff]/15 border border-[#00e5ff]/15 text-[11px] font-mono-tech text-[#cbd5e1] hover:text-white transition-all"
            >
              ▸ Query Live Modbus Gateway (:5020)
            </button>
          </div>
        </div>

        {/* Right Side: Stage Detail & Inter-Agent Bus */}
        <div className="flex-1 flex flex-col bg-[#050811] overflow-y-auto p-5 space-y-5">
          {/* Action Gate Alert Panel (if pending) */}
          {pendingActions.length > 0 && (
            <div className="p-4 rounded-xl bg-[#1c0e09] border border-amber-500/50 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold font-mono-tech text-amber-300">
                    ACTION GATE: CONSEQUENTIAL OPERATION HELD
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  REQUIRES SOVEREIGN HUMAN SIGN-OFF
                </span>
              </div>
              {pendingActions.map((act) => (
                <div key={act.actionId} className="p-3 rounded-lg bg-[#0c0704] border border-amber-500/30 space-y-2 text-xs font-mono-tech">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{act.requestedOperation}</span>
                    <span className="text-[#8e8d88]">{act.target}</span>
                  </div>
                  <p className="text-[#cbd5e1] text-[11px]">
                    Risk Tier: <strong className="text-amber-400">{act.riskLevel}</strong> | Required Authority: <strong className="text-white">{act.requiredAuthority}</strong>
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#8e8d88]">Provenance: {act.provenance}</span>
                    <button
                      onClick={() => handleApproveAction(act.actionId)}
                      disabled={isApproving === act.actionId}
                      className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 font-bold flex items-center gap-1 text-xs"
                    >
                      <KeyRound className="w-3 h-3" />
                      {isApproving === act.actionId ? 'SIGNING...' : 'CRYPTOGRAPHICALLY APPROVE & EXECUTE'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Stage Detail Card */}
          {currentStep && (
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#00e5ff]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono-tech font-bold bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
                    STAGE: {currentStep.stage}
                  </span>
                  <span className="text-xs font-mono-tech text-[#8e8d88]">
                    Time: <strong className="text-white">{currentStep.executionTimeMs}ms</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono-tech border ${getRealityBadgeColor(currentStep.reality)}`}>
                    {currentStep.reality || 'OBSERVED'}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono-tech font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {currentStep.verificationStatus}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold font-mono-tech text-white mb-1">
                  {currentStep.stageName}
                </h3>
                <div className="text-xs text-[#cbd5e1] font-mono-tech leading-relaxed bg-[#050811] p-3 rounded border border-[#00e5ff]/15">
                  {typeof currentStep.output === 'object' ? (
                    <pre className="text-[11px] text-[#00e5ff] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(currentStep.output, null, 2)}
                    </pre>
                  ) : (
                    <p>{currentStep.summary}</p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#050811] border border-[#00e5ff]/15 space-y-1.5 text-xs font-mono-tech">
                <span className="text-[10px] text-[#00e5ff] font-bold uppercase block">
                  Produced Reasoning Artifacts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentStep.artifactsProduced.map((art, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#09101c] text-[#d4ff00] text-[10px] border border-[#d4ff00]/20">
                      {art}
                    </span>
                  ))}
                </div>
                <p className="text-[#8e8d88] text-[11px] pt-1">
                  <strong className="text-white">Explanation:</strong> {currentStep.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Inter-Agent Message Bus */}
          {session && session.interAgentExchange && session.interAgentExchange.length > 0 && (
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#10b981]/30 space-y-3">
              <h3 className="text-sm font-bold font-mono-tech text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#10b981]" />
                INTER-AGENT CONTEXT-COMPACTED RPC EXCHANGE
              </h3>

              <div className="space-y-2.5">
                {session.interAgentExchange.map((msg) => (
                  <div key={msg.messageId} className="p-3.5 rounded-lg bg-[#050811] border border-[#10b981]/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono-tech">
                      <span className="text-[#10b981] font-bold">
                        {String(msg.fromAgent).replace(/_/g, ' ')} → {String(msg.toAgent).replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#8e8d88]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <pre className="text-xs text-[#cbd5e1] font-mono-tech overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(msg.tokenCompactedPayload, null, 2)}
                    </pre>
                    <div className="flex items-center justify-between text-[10px] font-mono-tech text-[#8e8d88]">
                      <span>Intent: <strong className="text-white">{msg.intent}</strong></span>
                      <span className={`px-1.5 py-0.2 rounded border ${getRealityBadgeColor(msg.reality)}`}>
                        {msg.reality || 'OBSERVED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Executive Summary Card */}
          {session?.finalAnswer && (
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#00e5ff]/40 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono-tech text-[#d4ff00] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#d4ff00]" />
                  J.A.R.V.I.S. VERIFIED EXECUTIVE SYNTHESIS
                </h3>
                <span className="text-[10px] font-mono-tech text-[#8e8d88]">
                  Latency: {session.executionTimeMs || 120}ms
                </span>
              </div>

              <p className="text-xs font-mono-tech text-white leading-relaxed bg-[#050811] p-3.5 rounded-lg border border-[#00e5ff]/20">
                {session.finalAnswer}
              </p>

              {session.finalExecutivePlan?.kpiImpactSummary && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {session.finalExecutivePlan.kpiImpactSummary.map((kpi, i) => (
                    <div key={i} className="p-2.5 rounded bg-[#050811] border border-[#00e5ff]/20 text-center">
                      <span className="text-[9px] text-[#8e8d88] font-mono-tech block">{kpi.kpi}</span>
                      <span className="text-xs font-bold font-mono-tech text-[#10b981]">{kpi.delta}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Interactive Command Form */}
          <form onSubmit={handleRunPrompt} className="pt-2 flex gap-2">
            <input
              type="text"
              placeholder="Enter complex multi-agent directive (e.g., 'Optimize chiller load profile for upcoming peak weekend')..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#09101c] border border-[#00e5ff]/30 text-xs font-mono-tech text-white focus:outline-none focus:border-[#00e5ff]"
            />
            <button
              type="submit"
              disabled={isRunning}
              className="px-5 py-2.5 rounded-lg bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] text-xs font-mono-tech font-bold border border-[#00e5ff]/50 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
            >
              <Send className="w-3.5 h-3.5" /> {isRunning ? 'ORCHESTRATING...' : 'RUN REASONING LOOP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
