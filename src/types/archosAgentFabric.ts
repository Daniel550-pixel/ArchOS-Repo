// ArchOS Agent Fabric & J.A.R.V.I.S. Cognitive Runtime Types
// Phase 4 Specialist Intelligence & Governed Execution Protocol

export type JarvisReasoningStage =
  | '1_UNDERSTAND'
  | '2_CONTEXTUALIZE'
  | '3_QUERY_WORLD_MODEL'
  | '4_SELECT_AGENTS'
  | '5_REASON'
  | '6_PLAN'
  | '7_SIMULATE'
  | '8_PREDICT'
  | '9_VERIFY'
  | '10_RESPOND_OR_ACT';

export type AgentRole =
  | 'ORCHESTRATOR_JARVIS'
  | 'PERCEPTION_AGENT'
  | 'WORLD_MODEL_AGENT'
  | 'REASONING_AGENT'
  | 'PLANNING_AGENT'
  | 'VERIFICATION_AGENT'
  | 'RISK_AGENT'
  | 'RESEARCH_AGENT'
  | 'EXECUTION_AGENT';

export type RealityLevel =
  | 'OBSERVED'
  | 'INFERRED'
  | 'PREDICTED'
  | 'SIMULATED'
  | 'EMULATED'
  | 'FALLBACK';

export type RiskLevel =
  | 'READ_ONLY'
  | 'LOW_RISK'
  | 'CONSEQUENTIAL'
  | 'HIGH_IMPACT';

export type PolicyVerificationStatus =
  | 'PASSED'
  | 'PASSED_WITH_WARNINGS'
  | 'BLOCKED_BY_SAFETY_INVARIANT'
  | 'REQUIRES_SOVEREIGN_HITL_APPROVAL'
  | 'DEFCON_RESTRICTED'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'REJECTED';

export interface InterAgentMessage {
  messageId: string;
  timestamp: string;
  fromAgent: AgentRole | string;
  toAgent: AgentRole | string | 'BROADCAST_ALL';
  intent: string;
  tokenCompactedPayload: {
    contextEntities?: string[];
    actionProposal?: string;
    metricsDelta?: Record<string, number | string>;
    confidence?: number;
    epistemologicalTag?: RealityLevel;
    [key: string]: any;
  };
  policySignOff: boolean;
  reality?: RealityLevel;
  confidence?: number;
}

export interface ReasoningStepLog {
  stage: JarvisReasoningStage;
  stageName: string;
  summary: string;
  activeAgents: (AgentRole | string)[];
  executionTimeMs: number;
  tokensConsumed?: number;
  verificationStatus: PolicyVerificationStatus;
  artifactsProduced: string[];
  explanation: string;
  reality?: RealityLevel;
  output?: Record<string, any>;
}

export interface PolicyInvariantRule {
  id: string;
  name: string;
  category: 'LIFE_SAFETY' | 'MUNICIPAL_ZONING' | 'CARBON_CAP' | 'FINANCIAL_LIMIT' | 'CYBER_DEFCON';
  ruleDescription: string;
  thresholdExpression: string;
  severity: 'FATAL_BLOCK' | 'WARNING_OVERRIDE_REQUIRED' | 'AUDIT_LOG_ONLY';
  isActive: boolean;
}

export interface ActionGateRequest {
  actionId: string;
  actor: string;
  agent: string;
  taskId: string;
  target: string;
  requestedOperation: string;
  riskLevel: RiskLevel;
  requiredAuthority: string;
  policyDecision: 'ALLOWED' | 'DENIED' | 'REQUIRES_APPROVAL';
  approvalState: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED';
  approvedBy?: string;
  provenance: string;
  timestamp: string;
  payload?: Record<string, any>;
}

export interface JarvisReasoningSession {
  sessionId: string;
  userPrompt: string;
  startTime: string;
  currentStage: JarvisReasoningStage;
  isComplete: boolean;
  reality?: RealityLevel;
  confidence?: number;
  steps: ReasoningStepLog[];
  interAgentExchange: InterAgentMessage[];
  policyVerifications: {
    ruleId: string;
    ruleName: string;
    status: PolicyVerificationStatus;
    evaluationDetail: string;
  }[];
  finalExecutivePlan?: {
    actionHeadline: string;
    targetEntities: string[];
    kpiImpactSummary: { kpi: string; delta: string; direction: 'POSITIVE' | 'NEUTRAL' | 'WARNING' }[];
    safetyClearanceHash: string;
    humanApprovalRequired: boolean;
    approvedByOperator?: string;
    actionId?: string;
    governanceDecision?: string;
  };
  finalAnswer?: string;
  executionTimeMs?: number;
}
