import { AgentRegistry, EventEngine, Mission, MissionTask, MissionStatus, PolicyEngine, RiskLevel } from "./core";

export class MissionEngine {
  constructor(
    private readonly events: EventEngine,
    private readonly agents: AgentRegistry,
    private readonly policy: PolicyEngine,
  ) {}

  create(input: { title: string; objective: string; risk?: RiskLevel; tasks: Array<Omit<MissionTask, "id" | "missionId" | "status">> }): Mission {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const risk = input.risk ?? "READ_ONLY";
    const tasks = input.tasks.map((task) => ({ ...task, id: crypto.randomUUID(), missionId: id, status: "QUEUED" as MissionStatus }));
    const mission: Mission = { id, title: input.title, objective: input.objective, status: "QUEUED", risk, createdAt: now, updatedAt: now, tasks };
    this.events.emit({ type: "MISSION_CREATED", actor: "system", missionId: id, payload: { title: mission.title, taskCount: tasks.length } });
    return mission;
  }

  plan(mission: Mission, actor = "operator"): Mission {
    const next = { ...mission, status: "PLANNING" as MissionStatus, updatedAt: new Date().toISOString() };
    this.events.emit({ type: "MISSION_PLANNING", actor, missionId: mission.id, payload: { taskCount: mission.tasks.length } });
    return next;
  }

  assign(mission: Mission, taskId: string, agentId: string, actor = "orchestrator"): Mission {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    const tasks = mission.tasks.map((task) => task.id === taskId ? { ...task, agentId, status: "QUEUED" as MissionStatus } : task);
    this.events.emit({ type: "AGENT_ASSIGNED", actor, missionId: mission.id, taskId, agentId, payload: { role: agent.role, model: agent.model } });
    return { ...mission, tasks, updatedAt: new Date().toISOString() };
  }

  start(mission: Mission, actor = "orchestrator"): Mission {
    const decision = this.policy.decide({ risk: mission.risk, permissions: ["mission:execute"], requiredPermission: "mission:execute", approved: mission.risk === "READ_ONLY" || mission.risk === "LOW_RISK" });
    if (!decision.allowed) {
      this.events.emit({ type: "MISSION_BLOCKED", actor, missionId: mission.id, payload: decision });
      return { ...mission, status: "BLOCKED", updatedAt: new Date().toISOString() };
    }
    this.events.emit({ type: "MISSION_STARTED", actor, missionId: mission.id, payload: {} });
    return { ...mission, status: "RUNNING", updatedAt: new Date().toISOString() };
  }

  verify(mission: Mission, actor = "verification"): Mission {
    this.events.emit({ type: "VERIFICATION_STARTED", actor, missionId: mission.id, payload: {} });
    const unresolved = mission.tasks.some((task) => !["COMPLETED"].includes(task.status));
    const status: MissionStatus = unresolved ? "VERIFYING" : "COMPLETED";
    this.events.emit({ type: unresolved ? "VERIFICATION_PENDING" : "MISSION_COMPLETED", actor, missionId: mission.id, payload: { unresolved } });
    return { ...mission, status, updatedAt: new Date().toISOString() };
  }
}
