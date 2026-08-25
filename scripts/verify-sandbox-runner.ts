import { strict as assert } from "node:assert";
import { validateSandboxCommand } from "../server/providers/sandboxRunner";

const policy = {
  permissions: new Set(["shell:approved"] as const),
  workspaceRoot: "/workspace/mission-42",
  allowNetwork: false,
  allowProduction: false,
  requireApprovalFor: new Set(["merge", "deploy", "destructive"])
};

assert.doesNotThrow(() => validateSandboxCommand(policy, {
  command: "npm",
  args: ["test"],
  cwd: "/workspace/mission-42"
}));
assert.throws(() => validateSandboxCommand(policy, {
  command: "npm",
  args: ["--eval", "process.exit(1)"],
  cwd: "/workspace/mission-42"
}));
assert.throws(() => validateSandboxCommand(policy, {
  command: "git",
  args: ["status"],
  cwd: "/workspace/other"
}));
assert.throws(() => validateSandboxCommand(policy, {
  command: "ls",
  args: [],
  cwd: "/workspace/mission-42"
}));

console.log("ARCHOS sandbox command policy verification passed");
