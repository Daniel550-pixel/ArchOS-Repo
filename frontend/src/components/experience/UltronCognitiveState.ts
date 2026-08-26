import type { EvolutionEpoch } from "./UltronVisionaryMatrix";
import type { IntelligenceGraphNode } from "./ArchosIntelligenceGraph";

export interface UltronCognitiveState {
  epoch: EvolutionEpoch | null;
  graphNode: IntelligenceGraphNode | null;
  commandSurface: "ULTRON_COMMAND_CENTER";
  activeModule: "GEMINI_COGNITIVE" | "INTELLIGENCE_GRAPH" | "VISIONARY_MATRIX";
  stateVersion: number;
}
