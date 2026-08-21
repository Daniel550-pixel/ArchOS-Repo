// ArchOS Canonical Runtime Contracts (Workflow A1)
// Unified System Contracts for J.A.R.V.I.S., Agent Fabric, World Model, Policy Engine, and Action Gate

import { ArchOSEvent, ArchOSEventType } from './archosEvents';

export type RealityDegree = 'OBSERVED' | 'INFERRED' | 'SIMULATED' | 'FALLBACK';

export type RiskLevel = 'READ_ONLY' | 'LOW_RISK' | 'CONSEQUENTIAL' | 'HIGH_IMPACT';

export type PolicyDecisionType = 'ALLOWED' | 'REQUIRES_APPROVAL' | 'DENIED';

// 1. Command Contract
export interface ArchOSCommand {
  commandId: string;
  correlationId: string;
  sessionId: string;
  actor: string;
  tenantId: string;
  rawText: string;
  source: 'voice' | 'gesture' | 'mouse' | 'keyboard' | 'touch' | 'system' | 'api';
  timestamp: string;
  metadata?: Record<string, any>;
}

// 2. Intent Contract
export interface ArchOSIntent {
  rawQuery: string;
  canonicalIntent: string;
  domain: 'GEOGRAPHIC_INTELLIGENCE' | 'ENERGY_HVAC' | 'SPATIAL_URBAN' | 'FINANCE_MACRO' | 'SUPPLY_CHAIN' | 'GENERAL_INTELLIGENCE';
  confidence: number;
  entities: Array<{
    urn: string;
    name: string;
    type: 'EMIRATE' | 'DISTRICT' | 'BUILDING' | 'INFRASTRUCTURE' | 'DEVICE' | 'ASSET';
  }>;
  parameters: Record<string, any>;
}

// 3. Context Assembly Contract
export interface ArchOSContext {
  commandId: string;
  correlationId: string;
  sessionId: string;
  userRole: string;
  clearanceLevel: number;
  workingMemory: Record<string, any>;
  activeWorldRegion: string;
  activeEntities: string[];
  timestamp: string;
}

// 4. Plan Contract
export interface ArchOSTaskPlan {
  planId: string;
  correlationId: string;
  targetDomain: string;
  stages: Array<{
    stageId: string;
    name: string;
    agentId: string;
    requiredCapabilities: string[];
    dependencies: string[];
    status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  }>;
  createdAt: string;
}

// 5. Agent Contract
export interface ArchOSAgentContract {
  id: string;
  name: string;
  domain: string;
  capabilities: string[];
  canHandle(intent: ArchOSIntent): boolean;
  execute(context: ArchOSContext, planStage: any): Promise<ArchOSAgentResult>;
}

export interface ArchOSAgentResult {
  agentId: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  reality: RealityDegree;
  confidence: number;
  output: Record<string, any>;
  deductions: string[];
  evidence: string[];
  provenance: string;
  durationMs: number;
}

// 6. World Model Query Contract
export interface WorldModelQueryRequest {
  entity: string;
  dimensions: Array<'economy' | 'infrastructure' | 'population' | 'development' | 'energy' | 'mobility' | 'telemetry'>;
  temporal?: {
    from?: string;
    to?: string;
  };
  limit?: number;
}

export interface WorldModelEntityState {
  urn: string;
  name: string;
  type: string;
  jurisdiction: string;
  location: {
    lat: number;
    lng: number;
    elevation_m?: number;
    bounds?: number[][];
  };
  attributes: Record<string, any>;
  telemetry?: Record<string, any>;
  confidence: number;
  provenance: {
    source: string;
    observedAt: string;
    modelVersion: string;
    reality: RealityDegree;
    hash?: string;
  };
}

export interface WorldModelQueryResponse {
  entity: string;
  data: Record<string, any>;
  entities: WorldModelEntityState[];
  confidence: number;
  sources: string[];
  observedAt: string;
  modelVersion: string;
  reality: RealityDegree;
}

// 7. Policy Decision Contract
export interface PolicyEvaluationRequest {
  actionId: string;
  actor: string;
  tenantId: string;
  target: string;
  operation: string;
  parameters: Record<string, any>;
  riskLevel: RiskLevel;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecisionType;
  ruleId: string;
  ruleName: string;
  riskLevel: RiskLevel;
  reasons: string[];
  requiredClearance: number;
  approvalRequired: boolean;
}

// 8. Action Request & Result Contract
export interface ActionRequest {
  actionId: string;
  correlationId: string;
  target: string;
  operation: string;
  parameters: Record<string, any>;
  riskLevel: RiskLevel;
  requiredAuthority: string;
  requiresApproval: boolean;
}

export interface ActionResult {
  actionId: string;
  correlationId: string;
  executionState: 'EXECUTED' | 'FAILED' | 'REJECTED' | 'APPROVAL_PENDING';
  executedBy: string;
  target: string;
  appliedState?: Record<string, any>;
  readBackVerified: boolean;
  signedProof: string;
  timestamp: string;
}

// 9. Response & Synthesis Contract
export interface ArchOSRuntimeResponse {
  commandId: string;
  correlationId: string;
  sessionId: string;
  answer: string;
  reality: RealityDegree;
  confidence: number;
  stages: ArchOSAgentResult[];
  worldModelFindings?: WorldModelQueryResponse;
  policyResult?: PolicyEvaluationResult;
  actionResult?: ActionResult;
  durationMs: number;
  timestamp: string;
}

// 10. Runtime Error Contract
export interface ArchOSRuntimeError {
  code: string;
  message: string;
  layer: 'EXPERIENCE' | 'RUNTIME' | 'AGENT_FABRIC' | 'WORLD_MODEL' | 'POLICY' | 'ACTION_GATE';
  correlationId: string;
  remediation?: string;
  fatal: boolean;
}
