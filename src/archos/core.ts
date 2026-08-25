export type MissionStatus = "QUEUED" | "PLANNING" | "RUNNING" | "VERIFYING" | "COMPLETED" | "BLOCKED" | "FAILED" | "CANCELLED" | "ROLLED_BACK";
export type RiskLevel = "READ_ONLY" | "LOW_RISK" | "CONSEQUENTIAL" | "HIGH_IMPACT";
export type AgentStatus = "IDLE" | "PLANNING" | "RUNNING" | "VERIFYING" | "BLOCKED" | "FAILED";

export interface AgentDefinition {
  id: string;
  name: string;
  model: string;
  role: string;
  capabilities: string[];
  permissions: string[];
  knowledgeScope: string[];
}

export interface MissionTask {
  id: string;
  missionId: string;
  title: string;
  description?: string;
  agentId?: string;
  dependencies: string[];
  status: MissionStatus;
  risk: RiskLevel;
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  status: MissionStatus;
  risk: RiskLevel;
  createdAt: string;
  updatedAt: string;
  tasks: MissionTask[];
}

export interface ArchOSEvent<T = Record<string, unknown>> {
  id: string;
  timestamp: string;
  type: string;
  actor: string;
  missionId?: string;
  taskId?: string;
  agentId?: string;
  payload: T;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  requiredApproval?: string;
}

export class EventEngine {
  private readonly events: ArchOSEvent[] = [];

  emit<T extends Record<string, unknown>>(event: Omit<ArchOSEvent<T>, "id" | "timestamp">): ArchOSEvent<T> {
    const record = { ...event, id: crypto.randomUUID(), timestamp: new Date().toISOString() } as ArchOSEvent<T>;
    this.events.push(record);
    return record;
  }

  list(missionId?: string): ArchOSEvent[] {
    return missionId ? this.events.filter((event) => event.missionId === missionId) : [...this.events];
  }

  replay(missionId: string): ArchOSEvent[] {
    return this.list(missionId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}

export class PolicyEngine {
  decide(action: { risk: RiskLevel; permissions: string[]; requiredPermission?: string; approved?: boolean }): PolicyDecision {
    if (action.risk === "READ_ONLY") return { allowed: true, reason: "READ_ONLY_OPERATION" };
    if (action.requiredPermission && !action.permissions.includes(action.requiredPermission)) {
      return { allowed: false, reason: "MISSING_PERMISSION", requiredApproval: action.requiredPermission };
    }
    if ((action.risk === "CONSEQUENTIAL" || action.risk === "HIGH_IMPACT") && !action.approved) {
      return { allowed: false, reason: "HUMAN_APPROVAL_REQUIRED", requiredApproval: "OPERATOR_APPROVAL" };
    }
    return { allowed: true, reason: "POLICY_ALLOW" };
  }
}

export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition>();

  register(agent: AgentDefinition): void {
    if (this.agents.has(agent.id)) throw new Error(`Agent already registered: ${agent.id}`);
    this.agents.set(agent.id, agent);
  }

  get(id: string): AgentDefinition | undefined { return this.agents.get(id); }
  list(): AgentDefinition[] { return [...this.agents.values()]; }
}
