import React, { useMemo, useState } from "react";

export type IntelligenceGraphRole =
  | "orchestrator"
  | "architect"
  | "researcher"
  | "analyst"
  | "specialist"
  | "critic"
  | "simulator"
  | "synthesizer"
  | "world"
  | "evidence";

export type IntelligenceGraphMode = "agent" | "causal" | "evidence";

export interface IntelligenceGraphNode {
  id: string;
  label: string;
  role: IntelligenceGraphRole;
  status?: "active" | "ready" | "idle" | "verified" | "warning";
  detail?: string;
  confidence?: number;
  provenance?: string;
}

export interface IntelligenceGraphEdge {
  from: string;
  to: string;
  label?: string;
  active?: boolean;
  confidence?: number;
}

export interface ArchosIntelligenceGraphProps {
  nodes?: IntelligenceGraphNode[];
  edges?: IntelligenceGraphEdge[];
  title?: string;
}

type GraphPosition = { x: number; y: number };

const DEFAULT_NODES: IntelligenceGraphNode[] = [
  { id: "jarvis", label: "J.A.R.V.I.S.", role: "orchestrator", status: "active", detail: "Canonical orchestration and task routing", confidence: 99, provenance: "Runtime control plane" },
  { id: "architect", label: "Architect", role: "architect", status: "ready", detail: "Decomposes the objective into bounded reasoning work", confidence: 96, provenance: "Agent plan" },
  { id: "research", label: "Research", role: "researcher", status: "ready", detail: "Collects and normalizes evidence with provenance", confidence: 91, provenance: "Evidence sources" },
  { id: "analyst", label: "Analyst", role: "analyst", status: "active", detail: "Reasons over World Model and evidence context", confidence: 88, provenance: "World state + evidence" },
  { id: "specialist", label: "Specialist", role: "specialist", status: "ready", detail: "Applies bounded domain-specific reasoning", confidence: 90, provenance: "Domain analysis" },
  { id: "critic", label: "Critic", role: "critic", status: "idle", detail: "Adversarially tests assumptions and alternatives", confidence: 93, provenance: "Independent challenge" },
  { id: "simulator", label: "Simulator", role: "simulator", status: "idle", detail: "Explores counterfactual and temporal scenarios", confidence: 84, provenance: "Scenario engine" },
  { id: "synth", label: "Synthesizer", role: "synthesizer", status: "verified", detail: "Produces the verified intelligence result", confidence: 94, provenance: "Cross-agent synthesis" },
  { id: "world", label: "World Model", role: "world", status: "verified", detail: "Structured entities, relationships, temporal state and scenarios", confidence: 97, provenance: "Authoritative state boundary" },
  { id: "evidence", label: "Evidence Ledger", role: "evidence", status: "verified", detail: "Traceable observations, sources, hashes and verification state", confidence: 98, provenance: "Evidence persistence" },
];

const DEFAULT_EDGES: IntelligenceGraphEdge[] = [
  { from: "jarvis", to: "architect", active: true, confidence: 99 },
  { from: "architect", to: "research", active: true, confidence: 95 },
  { from: "architect", to: "analyst", active: true, confidence: 94 },
  { from: "architect", to: "specialist", active: false, confidence: 91 },
  { from: "research", to: "evidence", active: true, confidence: 97 },
  { from: "evidence", to: "analyst", active: true, confidence: 93 },
  { from: "world", to: "analyst", active: true, confidence: 97 },
  { from: "specialist", to: "analyst", active: false, confidence: 90 },
  { from: "analyst", to: "critic", active: true, confidence: 88 },
  { from: "critic", to: "simulator", active: false, confidence: 84 },
  { from: "critic", to: "synth", active: true, confidence: 92 },
  { from: "simulator", to: "synth", active: false, confidence: 83 },
];

const POSITIONS: Record<string, GraphPosition> = {
  jarvis: { x: 50, y: 8 },
  architect: { x: 50, y: 24 },
  research: { x: 18, y: 46 },
  analyst: { x: 50, y: 55 },
  specialist: { x: 82, y: 46 },
  critic: { x: 38, y: 75 },
  simulator: { x: 63, y: 75 },
  synth: { x: 50, y: 94 },
  world: { x: 18, y: 70 },
  evidence: { x: 82, y: 70 },
};

const MODE_POSITIONS: Record<IntelligenceGraphMode, Record<string, GraphPosition>> = {
  agent: POSITIONS,
  causal: {
    jarvis: { x: 12, y: 50 },
    architect: { x: 27, y: 50 },
    research: { x: 42, y: 25 },
    evidence: { x: 42, y: 75 },
    world: { x: 57, y: 50 },
    analyst: { x: 72, y: 35 },
    critic: { x: 72, y: 65 },
    specialist: { x: 87, y: 25 },
    simulator: { x: 87, y: 75 },
    synth: { x: 87, y: 50 },
  },
  evidence: {
    jarvis: { x: 12, y: 50 },
    architect: { x: 28, y: 25 },
    research: { x: 28, y: 75 },
    evidence: { x: 48, y: 50 },
    world: { x: 68, y: 25 },
    analyst: { x: 68, y: 75 },
    specialist: { x: 88, y: 50 },
    critic: { x: 88, y: 25 },
    simulator: { x: 88, y: 75 },
    synth: { x: 68, y: 50 },
  },
};

const ROLE_LABELS: Record<IntelligenceGraphRole, string> = {
  orchestrator: "ORCHESTRATOR",
  architect: "ARCHITECT",
  researcher: "RESEARCH",
  analyst: "ANALYST",
  specialist: "SPECIALIST",
  critic: "CRITIC",
  simulator: "SIMULATOR",
  synthesizer: "SYNTHESIZER",
  world: "WORLD MODEL",
  evidence: "EVIDENCE",
};

const MODE_LABELS: Record<IntelligenceGraphMode, string> = {
  agent: "AGENT FLOW",
  causal: "CAUSAL FABRIC",
  evidence: "EVIDENCE PATH",
};

const STATUS_CLASS: Record<NonNullable<IntelligenceGraphNode["status"]>, string> = {
  active: "bg-emerald-300",
  verified: "bg-sky-300",
  warning: "bg-amber-300",
  ready: "bg-white/45",
  idle: "bg-white/20",
};

export const ArchosIntelligenceGraph: React.FC<ArchosIntelligenceGraphProps> = ({
  nodes = DEFAULT_NODES,
  edges = DEFAULT_EDGES,
  title = "INTELLIGENCE FABRIC",
}) => {
  const [selectedId, setSelectedId] = useState("jarvis");
  const [mode, setMode] = useState<IntelligenceGraphMode>("agent");
  const [showInactive, setShowInactive] = useState(true);

  const selected = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? nodes[0],
    [nodes, selectedId],
  );
  const visibleEdges = useMemo(
    () => edges.filter((edge) => showInactive || edge.active),
    [edges, showInactive],
  );
  const selectedConnections = useMemo(
    () => edges.filter((edge) => edge.from === selected?.id || edge.to === selected?.id),
    [edges, selected?.id],
  );

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/45 p-5 shadow-2xl backdrop-blur-2xl" aria-label="ArchOS Intelligence Fabric">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_45%)]" />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.38em] text-white/35">ARCHOS / J.A.R.V.I.S.</p>
          <h2 className="mt-1 text-lg font-medium tracking-tight text-white/90">{title}</h2>
        </div>
        <div className="flex items-center gap-3 text-[9px] tracking-[0.2em] text-white/40">
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> LIVE</span>
          <span>{nodes.length} NODES</span>
          <span>{edges.length} LINKS</span>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/8 bg-white/[0.02] p-1" role="tablist" aria-label="Intelligence graph mode">
          {(Object.keys(MODE_LABELS) as IntelligenceGraphMode[]).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              role="tab"
              aria-selected={mode === nextMode}
              onClick={() => setMode(nextMode)}
              className={`rounded-lg px-3 py-2 text-[8px] tracking-[0.18em] transition ${mode === nextMode ? "bg-white/10 text-white/85" : "text-white/35 hover:bg-white/[0.04] hover:text-white/60"}`}
            >
              {MODE_LABELS[nextMode]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowInactive((value) => !value)}
          className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[8px] uppercase tracking-[0.18em] text-white/40 hover:bg-white/[0.05] hover:text-white/65"
          aria-pressed={showInactive}
        >
          {showInactive ? "ALL LINKS" : "ACTIVE ONLY"}
        </button>
      </div>

      <div className="relative mt-4 grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="relative aspect-[1.45] min-h-[430px] overflow-hidden rounded-2xl border border-white/5 bg-black/35">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.045),transparent_55%)]" />

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {visibleEdges.map((edge) => {
              const positions = MODE_POSITIONS[mode];
              const from = positions[edge.from];
              const to = positions[edge.to];
              if (!from || !to) return null;
              const highlighted = selectedId === edge.from || selectedId === edge.to;
              const opacity = highlighted ? 0.68 : edge.active ? 0.42 : 0.12;
              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="currentColor" strokeOpacity={opacity} strokeWidth={highlighted ? 0.5 : edge.active ? 0.32 : 0.2} vectorEffect="non-scaling-stroke" />
                  {edge.active && (
                    <circle r={highlighted ? 0.85 : 0.6} fill="currentColor" opacity={highlighted ? 0.95 : 0.72}>
                      <animate attributeName="cx" values={`${from.x};${to.x};${from.x}`} dur={highlighted ? "2.2s" : "3.2s"} repeatCount="indefinite" />
                      <animate attributeName="cy" values={`${from.y};${to.y};${from.y}`} dur={highlighted ? "2.2s" : "3.2s"} repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {nodes.map((node) => {
            const position = MODE_POSITIONS[mode][node.id] ?? { x: 50, y: 50 };
            const selectedNode = node.id === selectedId;
            const status = node.status ?? "idle";
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 ${selectedNode ? "border-white/30 bg-white/10 shadow-[0_0_35px_rgba(255,255,255,0.08)]" : "border-white/10 bg-black/75 hover:border-white/20 hover:bg-white/[0.07]"}`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                aria-label={`Select ${node.label}`}
              >
                <span className="block text-[8px] tracking-[0.22em] text-white/35">{ROLE_LABELS[node.role]}</span>
                <span className="mt-1 block whitespace-nowrap text-xs font-medium text-white/85">{node.label}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.16em] text-white/35">
                  <i className={`h-1.5 w-1.5 rounded-full ${STATUS_CLASS[status]}`} />
                  {status}
                </span>
              </button>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          {selected && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] tracking-[0.28em] text-white/30">SELECTED NODE</p>
                  <h3 className="mt-2 text-xl font-medium text-white/90">{selected.label}</h3>
                  <p className="mt-1 text-[9px] tracking-[0.2em] text-white/35">{ROLE_LABELS[selected.role]}</p>
                </div>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[8px] uppercase tracking-[0.15em] text-white/40">{selected.status ?? "idle"}</span>
              </div>

              <p className="mt-5 text-xs leading-5 text-white/55">{selected.detail}</p>

              <div className="mt-5 rounded-xl border border-white/8 bg-black/25 p-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[8px] tracking-[0.22em] text-white/25">CONFIDENCE</p>
                    <p className="mt-1 text-2xl font-light text-white/85">{selected.confidence ?? 0}%</p>
                  </div>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                    <div className="h-full rounded-full bg-white/55" style={{ width: `${Math.max(0, Math.min(100, selected.confidence ?? 0))}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-white/8 pt-4">
                <div className="flex justify-between gap-4 text-[9px] uppercase tracking-[0.18em]"><span className="text-white/30">Upstream</span><span className="text-white/65">{edges.filter((edge) => edge.to === selected.id).length}</span></div>
                <div className="flex justify-between gap-4 text-[9px] uppercase tracking-[0.18em]"><span className="text-white/30">Downstream</span><span className="text-white/65">{edges.filter((edge) => edge.from === selected.id).length}</span></div>
                <div className="flex justify-between gap-4 text-[9px] uppercase tracking-[0.18em]"><span className="text-white/30">Active links</span><span className="text-white/65">{selectedConnections.filter((edge) => edge.active).length}</span></div>
              </div>

              <div className="mt-5 rounded-xl border border-white/8 bg-black/25 p-3">
                <p className="text-[8px] tracking-[0.22em] text-white/25">PROVENANCE</p>
                <p className="mt-2 text-[10px] leading-4 text-white/50">{selected.provenance ?? "Unspecified"}</p>
              </div>

              <div className="mt-4 rounded-xl border border-white/8 bg-black/25 p-3">
                <p className="text-[8px] tracking-[0.22em] text-white/25">FABRIC PRINCIPLE</p>
                <p className="mt-2 text-[10px] leading-4 text-white/50">Reasoning is observable; evidence is traceable; execution remains governed.</p>
              </div>
            </>
          )}
        </aside>
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/8 pt-3 text-[8px] uppercase tracking-[0.18em] text-white/25">
        {Array.from(new Set(nodes.map((node) => node.role))).map((role) => <span key={role}>{ROLE_LABELS[role]}</span>)}
      </div>
    </section>
  );

export default ArchosIntelligenceGraph;
