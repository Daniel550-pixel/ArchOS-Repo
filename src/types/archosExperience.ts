// ArchOS UAE Experience Types
// Defines the 5-layer unified operating model: Mode, Context, Simulation, Agent, System

import { UAEIntelligenceEvent, ContinuousIngestionStats, TemporalWindow, IntelligenceDomain } from './continuousIntelligence';
import { LandmarkPOI } from '../components/world/UAE3DWorldModel';

export type PrimaryMode = 'WORLD' | 'INFO' | 'SIMULATE' | 'AGENTS';

export type SystemLayerModal = 'VERIFY' | 'SECURITY' | 'MEMORY' | 'DATA_FLOW' | null;

export type ContextSelectionType = 'LANDMARK' | 'EVENT' | 'SIMULATION_BRANCH' | 'AGENT' | 'NATIONAL';

export interface SimulationBranch {
  id: string;
  name: string;
  isAuthoritative: boolean;
  parentBranchId?: string;
  horizonYear: number;
  variableName: string;
  deltaValue: string;
  confidenceScore: number;
  status: 'ACTIVE' | 'EPHEMERAL' | 'COMMITTED' | 'ARCHIVED';
  projectedMetrics: {
    energyDemandDelta: string;
    trafficDelayDelta: string;
    gfaLoadDelta: string;
    carbonOffsetTons: string;
    budgetVarianceUsd: string;
  };
  narrativeSummary: string;
  createdAt: string;
}

export interface AutonomousAgentProcess {
  id: string;
  name: string;
  domain: IntelligenceDomain | 'GOVERNANCE' | 'SYSTEM';
  status: 'RUNNING' | 'IDLE' | 'CORRELATING' | 'AWAITING_POLICY_CHECK';
  jurisdiction: string;
  activeTask: string;
  currentStage: string;
  currentToolCall?: string;
  latencyMs: number;
  policyComplianceScore: number;
  eventsProcessed: number;
  lastActive: string;
  reasoningTrace: string[];
}

export interface SovereignDataFlowStats {
  eventsPerMinute: number;
  entitiesUpdated: number;
  relationshipsChanged: number;
  anomaliesDetected: number;
  verificationConflicts: number;
  simulationTriggers: number;
  activeIngestionPipelines: number;
  lastBatchHash: string;
}

export interface ContextSelection {
  type: ContextSelectionType;
  landmark?: LandmarkPOI;
  event?: UAEIntelligenceEvent;
  branch?: SimulationBranch;
  agent?: AutonomousAgentProcess;
}
