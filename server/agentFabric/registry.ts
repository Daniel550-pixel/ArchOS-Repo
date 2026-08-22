import { ArchOSAgent, Intent } from "./types";
import { ResearchAgent } from "./agents/researchAgent";
import { EconomicIntelligenceAgent } from "./agents/economicAgent";
import { InfrastructureIntelligenceAgent } from "./agents/infrastructureAgent";
import { PopulationIntelligenceAgent } from "./agents/populationAgent";
import { GeospatialIntelligenceAgent } from "./agents/geospatialAgent";
import { WorldModelAgent } from "./agents/worldModelAgent";
import { SimulationAgent } from "./agents/simulationAgent";
import { VerificationAgent } from "./agents/verificationAgent";
import { SynthesisAgent } from "./agents/synthesisAgent";

export class AgentRegistry {
  private agents: Map<string, ArchOSAgent> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const defaultAgents: ArchOSAgent[] = [
      new ResearchAgent(),
      new EconomicIntelligenceAgent(),
      new InfrastructureIntelligenceAgent(),
      new PopulationIntelligenceAgent(),
      new GeospatialIntelligenceAgent(),
      new WorldModelAgent(),
      new SimulationAgent(),
      new VerificationAgent(),
      new SynthesisAgent()
    ];

    for (const agent of defaultAgents) {
      this.register(agent);
    }
  }

  public register(agent: ArchOSAgent): void {
    if (!agent || !agent.id) {
      throw new Error("Invalid agent instance: missing 'id'.");
    }
    this.agents.set(agent.id, agent);
  }

  public unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  public get(agentId: string): ArchOSAgent | undefined {
    if (this.agents.has(agentId)) {
      return this.agents.get(agentId);
    }
    // Alias normalization
    const normalized = agentId.toLowerCase().replace(/_/g, "-");
    if (this.agents.has(normalized)) {
      return this.agents.get(normalized);
    }
    if (agentId === "agent_economy" || agentId === "economy") {
      return this.agents.get("economic-intelligence");
    }
    if (agentId === "agent_infrastructure" || agentId === "infrastructure") {
      return this.agents.get("infrastructure-intelligence");
    }
    if (agentId === "agent_demographics" || agentId === "demographics" || agentId === "population") {
      return this.agents.get("population-intelligence");
    }
    if (agentId === "agent_development" || agentId === "development" || agentId === "geospatial") {
      return this.agents.get("geospatial-intelligence");
    }
    if (agentId === "agent_sustainability" || agentId === "sustainability") {
      return this.agents.get("geospatial-intelligence");
    }
    if (agentId === "world_model") {
      return this.agents.get("world-model");
    }
    return undefined;
  }

  public findByCapability(capability: string): ArchOSAgent[] {
    const target = capability.toLowerCase().trim();
    const matches: ArchOSAgent[] = [];

    for (const agent of this.agents.values()) {
      const hasCap = agent.capabilities.some(c =>
        c.toLowerCase() === target ||
        c.toLowerCase().includes(target) ||
        target.includes(c.toLowerCase())
      );
      if (hasCap) {
        matches.push(agent);
      }
    }
    return matches;
  }

  public findMatching(intent: Intent, context: any = {}): ArchOSAgent[] {
    const matched: ArchOSAgent[] = [];
    for (const agent of this.agents.values()) {
      if (agent.canHandle(intent, context)) {
        matched.push(agent);
      }
    }
    return matched;
  }

  public listAvailable(): ArchOSAgent[] {
    return Array.from(this.agents.values());
  }
}

export const agentRegistry = new AgentRegistry();
