import { AgentRegistry, EventEngine, LocalStorageMissionStore, PolicyEngine } from "./core";
import { MissionEngine } from "./mission";
import { MemoryKnowledgeProvider, UnconfiguredAIProvider } from "./providers";
import { AgentExecutionCoordinator } from "./execution";
import { createUnconfiguredClaudeExecutor } from "../../server/providers/claudeExecutor";

export const eventEngine = new EventEngine();
export const policyEngine = new PolicyEngine();
export const agentRegistry = new AgentRegistry();
export const knowledgeProvider = new MemoryKnowledgeProvider();
export const aiProvider = new UnconfiguredAIProvider();

[
  ["architect", "Architect", "claude-opus", "architecture"],
  ["developer", "Developer", "claude-sonnet", "implementation"],
  ["reviewer", "Reviewer", "fable", "review"],
  ["security", "Security", "security-provider", "security"],
  ["research", "Research", "research-provider", "research"],
  ["tester", "Testing", "sonnet-test", "verification"],
].forEach(([id, name, model, role]) => agentRegistry.register({
  id, name, model, role,
  capabilities: [role, "mission_execution", "event_reporting"],
  permissions: role === "security" ? ["repo:read", "security:scan"] : ["repo:read", "repo:write"],
  knowledgeScope: ["ARCHOS/00_CORE/", "ARCHOS/01_DECISIONS/", "ARCHOS/03_DEVELOPMENT/"],
}));

export const missionStore = new LocalStorageMissionStore();
export const missionEngine = new MissionEngine(eventEngine, agentRegistry, policyEngine, missionStore);
export const claudeExecutor = createUnconfiguredClaudeExecutor();
export const executionCoordinator = new AgentExecutionCoordinator({
  missionEngine,
  agents: agentRegistry,
  events: eventEngine,
  policy: policyEngine,
  executor: claudeExecutor,
});

export function createArchOSMission(input: Parameters<MissionEngine["create"]>[0]) {
  return missionEngine.create(input);
}

export function replayMission(missionId: string) {
  return eventEngine.replay(missionId);
}

export function listArchOSMissions() {
  return missionEngine.list();
}
