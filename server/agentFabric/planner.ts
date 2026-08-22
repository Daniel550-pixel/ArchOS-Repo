import crypto from "crypto";
import { AgentRegistry, agentRegistry } from "./registry";
import { Intent, ExecutionPlan, PlanStage, ExecutionDAGWave } from "./types";

export class AgentPlanner {
  constructor(private registry: AgentRegistry = agentRegistry) {}

  public createPlan(intent: Intent, query: string): ExecutionPlan {
    const planId = `plan_${crypto.randomBytes(4).toString("hex")}`;
    const allAvailable = this.registry.listAvailable();
    const allAvailableIds = allAvailable.map(a => a.id);

    const requiredCaps = intent.requiredCapabilities;
    const selectedAgentIds = new Set<string>();

    // 1. Resolve domain specialist agents by required capabilities
    for (const cap of requiredCaps) {
      const matching = this.registry.findByCapability(cap);
      for (const agent of matching) {
        // Exclude system meta-agents from the domain wave
        if (!["world-model", "verification", "synthesis", "simulation"].includes(agent.id)) {
          selectedAgentIds.add(agent.id);
        }
      }
    }

    // Default domain specialists if none matched specifically
    if (selectedAgentIds.size === 0) {
      if (intent.domain === "GEOGRAPHIC_INTELLIGENCE" || intent.domain === "SPATIAL_URBAN") {
        selectedAgentIds.add("economic-intelligence");
        selectedAgentIds.add("infrastructure-intelligence");
        selectedAgentIds.add("population-intelligence");
        selectedAgentIds.add("geospatial-intelligence");
      } else if (intent.domain === "FINANCE_MACRO") {
        selectedAgentIds.add("economic-intelligence");
      } else if (intent.domain === "INFRASTRUCTURE") {
        selectedAgentIds.add("infrastructure-intelligence");
      } else if (intent.domain === "DEMOGRAPHICS") {
        selectedAgentIds.add("population-intelligence");
      } else {
        selectedAgentIds.add("research");
      }
    }

    // Excluded agents tracking
    const domainAgentsList = Array.from(selectedAgentIds);
    const excludedAgentIds = allAvailableIds.filter(id => !selectedAgentIds.has(id) && !["world-model", "verification", "synthesis"].includes(id));

    // Build Execution Stages & DAG Waves
    const stages: PlanStage[] = [];
    const waves: ExecutionDAGWave[] = [];

    // Wave 1: Independent Domain Intelligence Specialists (executed concurrently in parallel)
    const wave1Stages: PlanStage[] = [];
    for (const agentId of domainAgentsList) {
      const agent = this.registry.get(agentId);
      if (agent) {
        const stage: PlanStage = {
          stageId: `STAGE_${agent.id.toUpperCase().replace(/-/g, "_")}`,
          name: agent.name,
          agentId: agent.id,
          domain: agent.domain,
          requiredCapabilities: agent.capabilities
        };
        stages.push(stage);
        wave1Stages.push(stage);
      }
    }
    waves.push({
      waveIndex: 1,
      parallelStages: wave1Stages
    });

    // Wave 2: World Model State Grounding
    const wmAgent = this.registry.get("world-model");
    if (wmAgent) {
      const wmStage: PlanStage = {
        stageId: "STAGE_WORLD_MODEL",
        name: wmAgent.name,
        agentId: wmAgent.id,
        domain: wmAgent.domain,
        requiredCapabilities: wmAgent.capabilities,
        dependencies: wave1Stages.map(s => s.stageId)
      };
      stages.push(wmStage);
      waves.push({
        waveIndex: 2,
        parallelStages: [wmStage]
      });
    }

    // Wave 3: Simulation (if scenario forecasting requested)
    if (intent.requiredCapabilities.some(c => c.toLowerCase().includes("simul") || c.toLowerCase().includes("forecast") || c.toLowerCase().includes("scenario"))) {
      const simAgent = this.registry.get("simulation");
      if (simAgent) {
        const simStage: PlanStage = {
          stageId: "STAGE_SIMULATION",
          name: simAgent.name,
          agentId: simAgent.id,
          domain: simAgent.domain,
          requiredCapabilities: simAgent.capabilities,
          dependencies: ["STAGE_WORLD_MODEL"]
        };
        stages.push(simStage);
        waves.push({
          waveIndex: 3,
          parallelStages: [simStage]
        });
      }
    }

    // Wave 4: Epistemic Verification & Policy Invariant Audit
    const verifAgent = this.registry.get("verification");
    if (verifAgent) {
      const verifStage: PlanStage = {
        stageId: "STAGE_VERIFICATION",
        name: verifAgent.name,
        agentId: verifAgent.id,
        domain: verifAgent.domain,
        requiredCapabilities: verifAgent.capabilities,
        dependencies: stages.map(s => s.stageId)
      };
      stages.push(verifStage);
      waves.push({
        waveIndex: 4,
        parallelStages: [verifStage]
      });
    }

    // Wave 5: Executive Synthesis
    const synthAgent = this.registry.get("synthesis");
    if (synthAgent) {
      const synthStage: PlanStage = {
        stageId: "STAGE_SYNTHESIS",
        name: synthAgent.name,
        agentId: synthAgent.id,
        domain: synthAgent.domain,
        requiredCapabilities: synthAgent.capabilities,
        dependencies: ["STAGE_VERIFICATION"]
      };
      stages.push(synthStage);
      waves.push({
        waveIndex: 5,
        parallelStages: [synthStage]
      });
    }

    return {
      planId,
      intent,
      requiredCapabilities: intent.requiredCapabilities,
      selectedAgents: stages.map(s => s.agentId),
      excludedAgents: excludedAgentIds,
      stages,
      waves,
      createdAt: new Date().toISOString()
    };
  }
}

export const agentPlanner = new AgentPlanner();
