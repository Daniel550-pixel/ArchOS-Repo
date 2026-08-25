import { strict as assert } from "node:assert";
import { createArchOSMission, eventEngine, missionEngine, replayMission } from "../src/archos/index";

const mission = createArchOSMission({
  title: "Mission control smoke test",
  objective: "Verify the ArchOS mission lifecycle and replay contract.",
  tasks: [
    { title: "Inspect repository", dependencies: [], risk: "READ_ONLY" },
    { title: "Verify changes", dependencies: [], risk: "READ_ONLY" },
  ],
});

assert.equal(mission.status, "QUEUED");
const planned = missionEngine.plan(mission);
assert.equal(planned.status, "PLANNING");
const assigned = missionEngine.assign(planned, planned.tasks[0].id, "architect");
assert.equal(assigned.tasks[0].agentId, "architect");
const running = missionEngine.start(assigned);
assert.equal(running.status, "RUNNING");
const events = replayMission(mission.id);
assert.ok(events.some((event) => event.type === "MISSION_CREATED"));
assert.ok(events.some((event) => event.type === "AGENT_ASSIGNED"));
assert.ok(events.some((event) => event.type === "MISSION_STARTED"));
assert.equal(events.length, eventEngine.list(mission.id).length);

console.log(`ARCHOS mission control verification passed: ${events.length} events`);
