// ArchOS Canonical Event Fabric Types
// Correlated Runtime Events across ULTRON, AIOS, World Model, and Action Plane

export type ArchOSEventType =
  | 'command.received'
  | 'intent.detected'
  | 'context.assembled'
  | 'plan.created'
  | 'agent.started'
  | 'agent.progress'
  | 'agent.completed'
  | 'world_model.queried'
  | 'world.query.started'
  | 'world.query.completed'
  | 'world_model.updated'
  | 'simulation.started'
  | 'simulation.progress'
  | 'simulation.completed'
  | 'policy.evaluated'
  | 'action.requested'
  | 'approval.required'
  | 'action.approval_required'
  | 'action.executed'
  | 'action.verified'
  | 'response.streaming'
  | 'response.completed'
  | 'response.ready'
  | 'error.occurred'
  | 'runtime.error';

export interface BaseArchOSEvent {
  id: string;
  type: ArchOSEventType;
  timestamp: string;
  correlationId: string;
  sessionId?: string;
  actor?: string;
  tenantId?: string;
  source?: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export interface CommandReceivedEvent extends BaseArchOSEvent {
  type: 'command.received';
  payload: {
    commandId: string;
    rawText: string;
    source: 'voice' | 'gesture' | 'mouse' | 'keyboard' | 'touch' | 'system' | 'api';
  };
}

export interface IntentDetectedEvent extends BaseArchOSEvent {
  type: 'intent.detected';
  payload: {
    intent: string;
    domain: string;
    confidence: number;
    entities: Array<{ urn: string; name: string; type: string }>;
  };
}

export interface ContextAssembledEvent extends BaseArchOSEvent {
  type: 'context.assembled';
  payload: {
    workingMemoryKeys: string[];
    worldModelUrns: string[];
    userRole: string;
  };
}

export interface PlanCreatedEvent extends BaseArchOSEvent {
  type: 'plan.created';
  payload: {
    planId: string;
    taskDomain: string;
    stages: Array<{ name: string; agent: string; dependencies?: string[] }>;
  };
}

export interface AgentStartedEvent extends BaseArchOSEvent {
  type: 'agent.started';
  payload: {
    agentId: string;
    agentName: string;
    role: string;
    task: string;
  };
}

export interface AgentProgressEvent extends BaseArchOSEvent {
  type: 'agent.progress';
  payload: {
    agentId: string;
    progressPct: number;
    statusNote: string;
  };
}

export interface AgentCompletedEvent extends BaseArchOSEvent {
  type: 'agent.completed';
  payload: {
    agentId: string;
    status: 'SUCCESS' | 'WARNING' | 'FAILED';
    reality: 'OBSERVED' | 'INFERRED' | 'SIMULATED' | 'FALLBACK';
    confidence: number;
    evidenceCount: number;
    durationMs: number;
  };
}

export interface WorldModelQueriedEvent extends BaseArchOSEvent {
  type: 'world_model.queried' | 'world.query.started';
  payload: {
    region: string;
    entitiesQueried: string[];
    layers: string[];
    dimensions?: string[];
  };
}

export interface WorldQueryCompletedEvent extends BaseArchOSEvent {
  type: 'world.query.completed';
  payload: {
    region: string;
    entityCount: number;
    confidence: number;
    provenanceSources: string[];
    durationMs: number;
  };
}

export interface WorldModelUpdatedEvent extends BaseArchOSEvent {
  type: 'world_model.updated';
  payload: {
    entityUrn: string;
    property: string;
    previousValue: any;
    newValue: any;
    provenance: string;
    reality: 'OBSERVED' | 'SIMULATED';
  };
}

export interface SimulationStartedEvent extends BaseArchOSEvent {
  type: 'simulation.started';
  payload: {
    scenarioId: string;
    scenarioTitle: string;
    baselineSnapshotId: string;
    variables: Record<string, any>;
  };
}

export interface SimulationCompletedEvent extends BaseArchOSEvent {
  type: 'simulation.completed';
  payload: {
    scenarioId: string;
    impactSummary: Array<{ metric: string; before: string; after: string; delta: string }>;
    durationMs: number;
  };
}

export interface PolicyEvaluatedEvent extends BaseArchOSEvent {
  type: 'policy.evaluated';
  payload: {
    ruleId: string;
    ruleName: string;
    decision: 'ALLOWED' | 'REQUIRES_APPROVAL' | 'DENIED';
    riskLevel: 'READ_ONLY' | 'LOW_RISK' | 'CONSEQUENTIAL' | 'HIGH_IMPACT';
    reasons: string[];
  };
}

export interface ActionRequestedEvent extends BaseArchOSEvent {
  type: 'action.requested';
  payload: {
    actionId: string;
    target: string;
    requestedOperation: string;
    riskLevel: 'READ_ONLY' | 'LOW_RISK' | 'CONSEQUENTIAL' | 'HIGH_IMPACT';
    requiredAuthority: string;
    requiresApproval: boolean;
  };
}

export interface ApprovalRequiredEvent extends BaseArchOSEvent {
  type: 'approval.required' | 'action.approval_required';
  payload: {
    actionId: string;
    headline: string;
    target: string;
    riskLevel: string;
    policyRule: string;
    deadline?: string;
  };
}

export interface ActionExecutedEvent extends BaseArchOSEvent {
  type: 'action.executed';
  payload: {
    actionId: string;
    target: string;
    executionState: 'EXECUTED' | 'FAILED' | 'REJECTED';
    executedBy: string;
    signedProof: string;
  };
}

export interface ActionVerifiedEvent extends BaseArchOSEvent {
  type: 'action.verified';
  payload: {
    actionId: string;
    verified: boolean;
    readBackDelta: number;
    auditHash: string;
  };
}

export interface ResponseStreamingEvent extends BaseArchOSEvent {
  type: 'response.streaming';
  payload: {
    chunk: string;
    accumulatedLength: number;
  };
}

export interface ResponseReadyEvent extends BaseArchOSEvent {
  type: 'response.ready' | 'response.completed';
  payload: {
    answer: string;
    reality: 'OBSERVED' | 'INFERRED' | 'SIMULATED' | 'FALLBACK';
    confidence: number;
    durationMs: number;
    stagesCount: number;
  };
}

export interface ErrorEvent extends BaseArchOSEvent {
  type: 'error.occurred' | 'runtime.error';
  payload: {
    code: string;
    message: string;
    remediationAction?: string;
  };
}

export type ArchOSEvent =
  | CommandReceivedEvent
  | IntentDetectedEvent
  | ContextAssembledEvent
  | PlanCreatedEvent
  | AgentStartedEvent
  | AgentProgressEvent
  | AgentCompletedEvent
  | WorldModelQueriedEvent
  | WorldQueryCompletedEvent
  | WorldModelUpdatedEvent
  | SimulationStartedEvent
  | SimulationCompletedEvent
  | PolicyEvaluatedEvent
  | ActionRequestedEvent
  | ApprovalRequiredEvent
  | ActionExecutedEvent
  | ActionVerifiedEvent
  | ResponseStreamingEvent
  | ResponseReadyEvent
  | ErrorEvent;
