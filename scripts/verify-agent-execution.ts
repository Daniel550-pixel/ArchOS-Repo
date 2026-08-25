import { strict as assert } from "node:assert";
import { agentRegistry, createArchOSMission, eventEngine, executionCoordinator, missionEngine } from "../src/archos/index";

const mission = createArchOSMission({
  title: "Executor boundary verification",
  objective: "Verify the governed Claude execution lifecycle without requiring a configured Claude runtime.",
  risk: "LOW_RISK",
  tasks: [{
    title: "Execute boundary test",
    description: "Attempt a safe development task.",
    dependencies: [],
    risk: "LOW_RISK",
  }],
});

const planned = missionEngine.plan(mission, "verification");
const assigned = missionEngine.assign(planned, planned.tasks[0].id, "developer", "verification");
const started = missionEngine.start(assigned, "verification");
assert.equal(started.status, "RUNNING");
assert.equal(agentRegistry.get("developer")?.model, "claude-sonnet");

const result = await executionCoordinator.executeTask(started, started.tasks[0].id, "verification");
assert.equal(result.execution.status, "BLOCKED");
assert.equal(result.execution.reason, "Claude Code executor is not configured.");
assert.equal(result.task.status, "BLOCKED");

const events = eventEngine.list(mission.id);
assert.ok(events.some((event) => event.type === "AGENT_EXECUTION_STARTED"));
assert.ok(events.some((event) => event.type === "AGENT_EXECUTION_FAILED"));
assert.ok(events.some((event) => event.type === "AGENT_EXECUTION_FINISHED"));

console.log("ARCHOS governed agent execution verification passed");
