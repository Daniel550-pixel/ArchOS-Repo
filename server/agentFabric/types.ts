// ArchOS Agent Fabric Types (A4 Architecture)

export type RealityDegree =
  | "OBSERVED"
  | "INFERRED"
  | "PREDICTED"
  | "SIMULATED"
  | "EMULATED"
  | "FALLBACK";

export interface Intent {
  canonicalIntent: string;
  domain: string;
  confidence: number;
  entities: Array<{ urn: string; name: string; type: string }>;
  isActionIntent: boolean;
  requiredCapabilities: string[];
}

export interface AgentContext {
  executionId: string;
  commandId: string;
  correlationId: string;
  sessionId: string;
  userId: string;
  tenantId: string;
  intent: Intent;
  relevantMemory: string[];
  authorizedTools: string[];
  worldModelAccess: {
    snapshotVersion: string;
    region: string;
    data: any;
  };
  policyConstraints: {
    decision: string;
    riskLevel: string;
    permissions: string[];
  };
  cancellationSignal: {
    isCancelled: () => boolean;
    reason?: string;
  };
  query: string;
  config?: Record<string, any>;
}

export interface AgentExecutionMetadata {
  durationMs: number;
  model?: string;
  reality: RealityDegree;
  timestamp: string;
  retries?: number;
}

export interface AgentResult {
  agentId: string;
  agentName: string;
  domain: string;
  status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED" | "CANCELLED" | "RETRYING";
  findings: string[];
  evidence: string[];
  confidence: number;
  worldModelReferences: string[];
  warnings: string[];
  executionMetadata: AgentExecutionMetadata;
  output?: Record<string, any>;
  error?: string;
}

export interface ArchOSAgent {
  id: string;
  name: string;
  version: string;
  domain: string;
  capabilities: string[];
  permissions: string[];
  description: string;

  canHandle(intent: Intent, context: any): boolean;
  execute(context: AgentContext): Promise<AgentResult>;
}

export interface PlanStage {
  stageId: string;
  name: string;
  agentId: string;
  domain: string;
  requiredCapabilities: string[];
  dependencies?: string[];
}

export interface ExecutionDAGWave {
  waveIndex: number;
  parallelStages: PlanStage[];
}

export interface ExecutionPlan {
  planId: string;
  intent: Intent;
  requiredCapabilities: string[];
  selectedAgents: string[];
  excludedAgents: string[];
  stages: PlanStage[];
  waves: ExecutionDAGWave[];
  createdAt: string;
}
