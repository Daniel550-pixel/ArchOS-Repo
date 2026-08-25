import { AgentRegistry, EventEngine, MemoryMissionStore, Mission, MissionStatus, MissionStore, MissionTask, PolicyEngine, RiskLevel } from "./core";

export class MissionEngine {
  constructor(
    private readonly events: EventEngine,
    private readonly agents: AgentRegistry,
    private readonly policy: PolicyEngine,
    private readonly store: MissionStore = new MemoryMissionStore(),
  ) {}

  create(input: { title: string; objective: string; risk?: RiskLevel; tasks: Array<Omit<MissionTask, "id" | "missionId" | "status">> }): Mission {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const risk = input.risk ?? "READ_ONLY";
    const tasks = input.tasks.map((task) => ({ ...task, id: crypto.randomUUID(), missionId: id, status: "QUEUED" as MissionStatus }));
    const mission: Mission = { id, title: input.title, objective: input.objective, status: "QUEUED", risk, createdAt: now, updatedAt: now, tasks };
    this.store.save(mission);
    this.events.emit({ type: "MISSION_CREATED", actor: "system", missionId: id, payload: { title: mission.title, taskCount: tasks.length } });
    return mission;
  }

  get(id: string): Mission | undefined { return this.store.get(id); }
  list(): Mission[] { return this.store.list().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
  remove(id: string): void { this.store.delete(id); }

  plan(mission: Mission, actor = "operator"): Mission {
    const next = { ...mission, status: "PLANNING" as MissionStatus, updatedAt: new Date().toISOString() };
    this.store.save(next);
    this.events.emit({ type: "MISSION_PLANNING", actor, missionId: mission.id, payload: { taskCount: mission.tasks.length } });
    return next;
  }

  assign(mission: Mission, taskId: string, agentId: string, actor = "orchestrator"): Mission {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    if (!mission.tasks.some((task) => task.id === taskId)) throw new Error(`Unknown task: ${taskId}`);
    const tasks = mission.tasks.map((task) => task.id === taskId ? { ...task, agentId, status: "QUEUED" as MissionStatus } : task);
    const next = { ...mission, tasks, updatedAt: new Date().toISOString() };
    this.store.save(next);
    this.events.emit({ type: "AGENT_ASSIGNED", actor, missionId: mission.id, taskId, agentId, payload: { role: agent.role, model: agent.model } });
    return next;
  }

  start(mission: Mission, actor = "orchestrator"): Mission {
    const decision = this.policy.decide({ risk: mission.risk, permissions: ["mission:execute"], requiredPermission: "mission:execute", approved: mission.risk === "READ_ONLY" || mission.risk === "LOW_RISK" });
    if (!decision.allowed) {
      const blocked = { ...mission, status: "BLOCKED" as MissionStatus, updatedAt: new Date().toISOString() };
      this.store.save(blocked);
      this.events.emit({ type: "MISSION_BLOCKED", actor, missionId: mission.id, payload: { allowed: decision.allowed, reason: decision.reason, requiredApproval: decision.requiredApproval } });
      return blocked;
    }

    const next = { ...mission, status: "RUNNING" as MissionStatus, updatedAt: new Date().toISOString() };
    this.store.save(next);
    this.events.emit({ type: "MISSION_STARTED", actor, missionId: mission.id, payload: {} });
    return next;
  }

  verify(mission: Mission, actor = "verification"): Mission {
    this.events.emit({ type: "VERIFICATION_STARTED", actor, missionId: mission.id, payload: {} });
    const unresolved = mission.tasks.some((task) => task.status !== "COMPLETED");
    const status: MissionStatus = unresolved ? "VERIFYING" : "COMPLETED";
    const next = { ...mission, status, updatedAt: new Date().toISOString() };
    this.store.save(next);
    this.events.emit({ type: unresolved ? "VERIFICATION_PENDING" : "MISSION_COMPLETED", actor, missionId: mission.id, payload: { unresolved } });
    return next;
  }
}
