import React, { useMemo, useState } from "react";
import { BrainCircuit, ChevronDown, ChevronUp, Command, Network, Sparkles } from "lucide-react";
import UltronVisionaryMatrix, { type EvolutionEpoch } from "./UltronVisionaryMatrix";
import ArchosIntelligenceGraph, { type IntelligenceGraphNode } from "./ArchosIntelligenceGraph";
import type { UltronCognitiveState } from "./UltronCognitiveState";
import GeminiCommandCenter from "./gemini/GeminiCommandCenter";

interface Props { compact?: boolean; }
export const UltronCommandCenter: React.FC<Props> = ({ compact = false }) => {
  const [geminiOpen, setGeminiOpen] = useState(true);
  const [activeEpoch, setActiveEpoch] = useState<EvolutionEpoch | null>(null);
  const [graphNode, setGraphNode] = useState<IntelligenceGraphNode | null>(null);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [stateVersion, setStateVersion] = useState(0);
  const touch = () => setStateVersion((value) => value + 1);
  const handleEpochChange = (epoch: EvolutionEpoch) => { setActiveEpoch(epoch); touch(); };
  const handleGraphNode = (node: IntelligenceGraphNode | null) => { setGraphNode(node); touch(); };
  const cognitiveState = useMemo<UltronCognitiveState>(() => ({
    epoch: activeEpoch,
    graphNode,
    commandSurface: "ULTRON_COMMAND_CENTER",
    activeModule: "GEMINI_COGNITIVE",
    stateVersion,
    activeCommand,
    worldContext: {
      jurisdiction: "UNITED_ARAB_EMIRATES",
      scope: "ULTRON_ACTIVE_VIEW",
      temporalState: activeEpoch?.year ?? "CURRENT",
      selectedEntities: [activeEpoch?.name, graphNode?.label].filter((value): value is string => Boolean(value)),
      provenance: [activeEpoch?.tensorMetrics.provenance, graphNode?.detail].filter((value): value is string => Boolean(value)),
    },
    telemetry: {
      stateVersion,
      epochYear: activeEpoch?.year ?? null,
      graphRole: graphNode?.role ?? null,
      nodeStatus: graphNode?.status ?? null,
      neuralFrequencyHz: activeEpoch?.frequencyHz ?? null,
      synapticDensity: activeEpoch?.synapticDensity ?? null,
    },
  }), [activeEpoch, graphNode, activeCommand, stateVersion]);
  const issueCommand = (command: string) => { setActiveCommand(command); touch(); };

  return <section className="relative space-y-4">
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5"><Command size={15} /></div><div><p className="text-[9px] tracking-[.28em] text-white/35">ULTRON / PRIMARY EXPERIENCE</p><h2 className="mt-1 text-sm font-semibold tracking-wide">INTELLIGENCE COMMAND CENTER</h2></div></div><div className="flex items-center gap-2 font-mono text-[9px] tracking-[.16em] text-white/35"><Network size={12} /> JARVIS FABRIC <span className="text-emerald-200">CONNECTED</span></div></div>
      <UltronVisionaryMatrix compact={compact} onEpochChange={handleEpochChange} />
      <div className="border-t border-white/10 bg-black/30"><button type="button" onClick={() => setGeminiOpen((open) => !open)} aria-expanded={geminiOpen} className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-white/[.025]"><span className="flex items-center gap-2 text-[10px] tracking-[.2em] text-white/45"><Sparkles size={13} /> GEMINI COGNITIVE MODULE</span>{geminiOpen ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}</button>{geminiOpen && <div className="px-3 pb-3 md:px-4 md:pb-4"><GeminiCommandCenter cognitiveState={cognitiveState} onCommand={issueCommand} /></div>}</div>
    </div>
    <div className="rounded-3xl border border-white/10 bg-black/40 p-3 shadow-xl backdrop-blur-xl"><div className="mb-2 flex items-center gap-2 px-2 text-[9px] tracking-[.2em] text-white/30"><BrainCircuit size={12} /> CAUSAL / AGENT INTELLIGENCE GRAPH</div><ArchosIntelligenceGraph onNodeSelect={handleGraphNode} /></div>
  </section>;
};
export default UltronCommandCenter;
