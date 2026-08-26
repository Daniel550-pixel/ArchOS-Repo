export type RiskLevel = "READ_ONLY" | "LOW_RISK" | "CONSEQUENTIAL" | "HIGH_IMPACT";

export interface WorldModelContext {
  jurisdiction: "UNITED_ARAB_EMIRATES";
  source: "ARCHOS_CANONICAL_WORLD_MODEL";
  reality: "OBSERVED";
  entities: string[];
  telemetry: Record<string, unknown>;
}

export interface MissionPlan {
  taskId: string;
  domain: string;
  specialists: string[];
  riskLevel: RiskLevel;
  worldModel: WorldModelContext;
  proposedAction?: {
    target: string;
    operation: string;
    requiredAuthority: string;
  };
}

const specialists = [
  "perception",
  "world_model",
  "research",
  "reasoning",
  "planning",
  "risk",
  "verification",
  "execution"
] as const;

export function buildMissionPlan(prompt: string): MissionPlan {
  const lower = prompt.toLowerCase();
  const actionIntent = ["change", "set", "adjust", "optimize", "execute", "shutdown", "override"].some((word) => lower.includes(word));
  const energyIntent = ["energy", "power", "chiller", "hvac", "load"].some((word) => lower.includes(word));
  const domain = energyIntent ? "ENERGY_HVAC" : lower.includes("building") || lower.includes("height") ? "SPATIAL_URBAN" : "GENERAL_INTELLIGENCE";

  return {
    taskId: `task-${crypto.randomUUID().slice(0, 12)}`,
    domain,
    specialists: [...specialists],
    riskLevel: actionIntent ? (energyIntent ? "CONSEQUENTIAL" : "LOW_RISK") : "READ_ONLY",
    worldModel: {
      jurisdiction: "UNITED_ARAB_EMIRATES",
      source: "ARCHOS_CANONICAL_WORLD_MODEL",
      reality: "OBSERVED",
      entities: lower.includes("dubai") || lower.includes("uae") ? ["Emirate of Dubai", "UAE jurisdiction"] : [],
      telemetry: {
        model: "canonical-context-v1",
        provenance: "archos-runtime-context",
        temporalState: "CURRENT"
      }
    },
    ...(actionIntent
      ? {
          proposedAction: {
            target: energyIntent ? "UAE energy/HVAC subsystem" : "ARCHOS governed action target",
            operation: "MODEL_PROPOSED_OPERATION",
            requiredAuthority: energyIntent ? "SOVEREIGN_ENGINEER_CLEARANCE" : "OPERATOR"
          }
        }
      : {})
  };
}
