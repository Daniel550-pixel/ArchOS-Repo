import type { EvolutionEpoch } from "./UltronVisionaryMatrix";
import type { IntelligenceGraphNode } from "./ArchosIntelligenceGraph";

export interface UltronWorldContext {
  jurisdiction: "UNITED_ARAB_EMIRATES";
  scope: "ULTRON_ACTIVE_VIEW";
  temporalState: string;
  selectedEntities: string[];
  provenance: string[];
}

export interface UltronTelemetry {
  stateVersion: number;
  epochYear: string | null;
  graphRole: string | null;
  nodeStatus: string | null;
  neuralFrequencyHz: number | null;
  synapticDensity: number | null;
}

export interface UltronCognitiveState {
  epoch: EvolutionEpoch | null;
  graphNode: IntelligenceGraphNode | null;
  commandSurface: "ULTRON_COMMAND_CENTER";
  activeModule: "GEMINI_COGNITIVE" | "INTELLIGENCE_GRAPH" | "VISIONARY_MATRIX";
  stateVersion: number;
  activeCommand: string | null;
  worldContext: UltronWorldContext;
  telemetry: UltronTelemetry;
}

export const createUltronCognitiveState = (input: Partial<UltronCognitiveState> = {}): UltronCognitiveState => ({
  epoch: null,
  graphNode: null,
  commandSurface: "ULTRON_COMMAND_CENTER",
  activeModule: "GEMINI_COGNITIVE",
  stateVersion: 0,
  activeCommand: null,
  worldContext: {
    jurisdiction: "UNITED_ARAB_EMIRATES",
    scope: "ULTRON_ACTIVE_VIEW",
    temporalState: "CURRENT",
    selectedEntities: [],
    provenance: ["ULTRON_COMMAND_CENTER"]
  },
  telemetry: {
    stateVersion: 0,
    epochYear: null,
    graphRole: null,
    nodeStatus: null,
    neuralFrequencyHz: null,
    synapticDensity: null
  },
  ...input
});
