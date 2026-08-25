import { strict as assert } from "node:assert";
import { createUnconfiguredClaudeExecutor, assertPermission, assertWorkspacePath, missionBranchName } from "../server/providers/index";

const policy = {
  permissions: new Set(["repo:read", "repo:write", "git:branch", "git:commit", "git:pull-request", "test:run"] as const),
  workspaceRoot: "/workspace/mission-42",
  allowNetwork: false,
  allowProduction: false,
  requireApprovalFor: new Set(["merge", "deploy", "destructive"])
};

assert.doesNotThrow(() => assertPermission(policy, "repo:read"));
assert.throws(() => assertPermission(policy, "build:run"), /denied permission/);
assert.doesNotThrow(() => assertWorkspacePath(policy, "/workspace/mission-42/src/app.ts"));
assert.throws(() => assertWorkspacePath(policy, "/workspace/other-secret.txt"), /outside the mission workspace/);
assert.match(missionBranchName("mission-42", "sonnet"), /^archos\/agent\/sonnet\/[a-f0-9]{12}$/);

const executor = createUnconfiguredClaudeExecutor();
const result = await executor.execute({
  missionId: "mission-42",
  agentId: "sonnet",
  prompt: "Implement the requested change.",
  branch: "archos/agent/sonnet/test",
  policy
});
assert.equal(result.status, "BLOCKED");
assert.equal(result.reason, "Claude Code executor is not configured.");

console.log("ARCHOS provider boundary verification passed");
