// src/services/agi/rsiAgiOrchestrator.ts
// Unified ArchOS RSI / AGI Orchestration Hub

import { metaCognition, MetaCognitiveEngine, CognitiveState, SelfReflectionReport } from './metaCognition';
import { strategicReasoning, StrategicReasoningCore, StrategicObjective, CausalInferenceResult, CounterfactualSimulationResult } from './strategicReasoning';
import { generalIntelligence, GeneralIntelligenceFabric, ConceptNode, TransferLearningStrategy, AnalogicalSolutionResult } from './generalIntelligence';
import { agentSwarm, AutonomousAgentSwarm, SwarmAgent, SwarmProblemSolution } from './agentSwarm';
import { speechService } from '../voice/speechService';
import { commandBus } from '../../lib/archos/commandBus';

export interface RsiAgiTelemetry {
  ascensionLevel: number;
  cognitiveLoad: number;
  reasoningDepth: number;
  activeAgentsCount: number;
  totalConceptsLearned: number;
  strategicObjectivesActive: number;
  ethicalAlignment: number;
  isAscensionProtocolActive: boolean;
}

export class RsiAgiOrchestrator {
  public metaCognition: MetaCognitiveEngine = metaCognition;
  public strategicReasoning: StrategicReasoningCore = strategicReasoning;
  public generalIntelligence: GeneralIntelligenceFabric = generalIntelligence;
  public agentSwarm: AutonomousAgentSwarm = agentSwarm;

  private isSelfImprovementLoopActive = false;
  private loopTimer: NodeJS.Timeout | null = null;
  private telemetryListeners: Set<(t: RsiAgiTelemetry) => void> = new Set();

  constructor() {
    this.startSelfImprovementCycle();
  }

  public getTelemetry(): RsiAgiTelemetry {
    const cog = this.metaCognition.getState();
    const agents = this.agentSwarm.getAgents();
    const concepts = this.generalIntelligence.getConcepts();
    const objs = this.strategicReasoning.getObjectives();

    return {
      ascensionLevel: cog.ascension_level,
      cognitiveLoad: cog.working_memory_load,
      reasoningDepth: cog.reasoning_depth,
      activeAgentsCount: agents.length,
      totalConceptsLearned: concepts.length,
      strategicObjectivesActive: objs.length,
      ethicalAlignment: cog.ethical_alignment_score,
      isAscensionProtocolActive: true
    };
  }

  public subscribeTelemetry(cb: (t: RsiAgiTelemetry) => void): () => void {
    this.telemetryListeners.add(cb);
    cb(this.getTelemetry());
    return () => this.telemetryListeners.delete(cb);
  }

  private notifyTelemetry() {
    const t = this.getTelemetry();
    this.telemetryListeners.forEach((cb) => cb(t));
  }

  public startSelfImprovementCycle() {
    if (this.isSelfImprovementLoopActive) return;
    this.isSelfImprovementLoopActive = true;

    // Periodic cognitive micro-reflection
    this.loopTimer = setInterval(async () => {
      await this.metaCognition.selfReflect();
      this.notifyTelemetry();
    }, 45000);
  }

  public stopSelfImprovementCycle() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    this.isSelfImprovementLoopActive = false;
  }

  public async triggerManualAscension(): Promise<SelfReflectionReport> {
    speechService.speak('Initiating ArchOS Cognitive Ascension protocol. Calibrating multi-horizon meta-cognition, concept graph embedding, and autonomous swarm synchronization.');
    const report = await this.metaCognition.selfReflect();
    this.notifyTelemetry();

    commandBus.handleSystemEvent({
      type: 'AGI_ASCENSION_TRIGGERED',
      payload: {
        ascensionLevel: report.cognitive_state.ascension_level,
        recommendations: report.improvement_recommendations
      }
    });

    return report;
  }
}

export const rsiAgiOrchestrator = new RsiAgiOrchestrator();
