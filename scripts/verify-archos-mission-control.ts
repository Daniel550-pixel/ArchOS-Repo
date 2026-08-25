import { strict as assert } from "node:assert";
import { createArchOSMission, eventEngine, listArchOSMissions, missionEngine, replayMission } from "../src/archos/index";

const mission = createArchOSMission({
  title: "Mission control smoke test",
  objective: "Verify the ArchOS mission lifecycle, persistence contract, and replay.",
  tasks: [
    { title: "Inspect repository", dependencies: [], risk: "READ_ONLY" },
    { title: "Verify changes", dependencies: [], risk: "READ_ONLY" },
  ],
});

assert.equal(mission.status, "QUEUED");
assert.ok(missionEngine.get(mission.id), "mission must be retrievable from the active store");
assert.ok(listArchOSMissions().some((item) => item.id === mission.id), "mission must appear in mission listing");

const planned = missionEngine.plan(mission);
assert.equal(planned.status, "PLANNING");
assert.equal(missionEngine.get(mission.id)?.status, "PLANNING");

const assigned = missionEngine.assign(planned, planned.tasks[0].id, "architect");
assert.equal(assigned.tasks[0].agentId, "architect");
assert.equal(missionEngine.get(mission.id)?.tasks[0].agentId, "architect");

const running = missionEngine.start(assigned);
assert.equal(running.status, "RUNNING");
assert.equal(missionEngine.get(mission.id)?.status, "RUNNING");

const events = replayMission(mission.id);
assert.ok(events.some((event) => event.type === "MISSION_CREATED"));
assert.ok(events.some((event) => event.type === "AGENT_ASSIGNED"));
assert.ok(events.some((event) => event.type === "MISSION_STARTED"));
assert.equal(events.length, eventEngine.list(mission.id).length);

console.log(`ARCHOS mission control verification passed: ${events.length} events; persistent mission ${mission.id}`);
