import type { ClaudeCodeExecutor, ExecutorPolicy, ClaudeExecutionResult } from "../../server/providers/claudeExecutor";
import { MissionEngine } from "./mission";
import type { Mission, MissionTask, AgentRegistry, EventEngine, PolicyEngine } from "./core";

export interface AgentExecutionCoordinatorOptions {
  missionEngine: MissionEngine;
  agents: AgentRegistry;
  events: EventEngine;
  policy: PolicyEngine;
  executor: ClaudeCodeExecutor;
}

export interface TaskExecutionResult {
  mission: Mission;
  task: MissionTask;
  execution: ClaudeExecutionResult;
}

export class AgentExecutionCoordinator {
  constructor(private readonly options: AgentExecutionCoordinatorOptions) {}

  async executeTask(mission: Mission, taskId: string, actor = "orchestrator"): Promise<TaskExecutionResult> {
    const task = mission.tasks.find((candidate) => candidate.id === taskId);
    if (!task) throw new Error(`Unknown task: ${taskId}`);
    if (!task.agentId) throw new Error(`Task ${taskId} has no assigned agent.`);

    const agent = this.options.agents.get(task.agentId);
    if (!agent) throw new Error(`Unknown agent: ${task.agentId}`);

    const decision = this.options.policy.decide({
      risk: task.risk,
      permissions: agent.permissions,
      requiredPermission: "repo:write",
      approved: task.risk === "READ_ONLY" || task.risk === "LOW_RISK",
    });

    if (!decision.allowed) {
      const blocked = this.options.missionEngine.setTaskStatus(mission, taskId, "BLOCKED", actor);
      const execution: ClaudeExecutionResult = {
        status: "BLOCKED",
        branch: "",
        events: [],
        reason: decision.reason,
      };
      return { mission: blocked, task: blocked.tasks.find((candidate) => candidate.id === taskId)!, execution };
    }

    const branch = `archos/agent/${agent.id}/${mission.id.replace(/[^A-Za-z0-9-]/g, "").slice(0, 48)}`;
    const policy: ExecutorPolicy = {
      permissions: new Set(agent.permissions) as ExecutorPolicy["permissions"],
      workspaceRoot: `/workspace/${mission.id}`,
      allowNetwork: false,
      allowProduction: false,
      requireApprovalFor: new Set(["merge", "deploy", "destructive"]),
    };

    this.options.events.emit({
      type: "AGENT_EXECUTION_STARTED",
      actor,
      missionId: mission.id,
      taskId,
      agentId: agent.id,
      payload: { model: agent.model, role: agent.role, branch },
    });

    const running = this.options.missionEngine.setTaskStatus(mission, taskId, "RUNNING", actor);
    const execution = await this.options.executor.execute({
      missionId: mission.id,
      agentId: agent.id,
      prompt: `${mission.objective}\n\nTask: ${task.title}\n${task.description ?? ""}`,
      branch,
      policy,
    }, (event) => {
      this.options.events.emit({
        type: `AGENT_EXECUTION_${event.type.toUpperCase()}`,
        actor: agent.id,
        missionId: mission.id,
        taskId,
        agentId: agent.id,
        payload: event.data,
      });
    });

    const finalStatus = execution.status === "COMPLETED" ? "COMPLETED" : execution.status === "BLOCKED" ? "BLOCKED" : "FAILED";
    const finalMission = this.options.missionEngine.setTaskStatus(running, taskId, finalStatus, actor);
    this.options.events.emit({
      type: "AGENT_EXECUTION_FINISHED",
      actor,
      missionId: mission.id,
      taskId,
      agentId: agent.id,
      payload: { status: execution.status, branch: execution.branch, commitSha: execution.commitSha, pullRequestUrl: execution.pullRequestUrl },
    });

    return { mission: finalMission, task: finalMission.tasks.find((candidate) => candidate.id === taskId)!, execution };
  }
}
