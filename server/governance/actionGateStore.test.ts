import { strict as assert } from "node:assert";
import { ActionGateStore } from "./actionGateStore";

const store = new ActionGateStore({ historyLimit: 2, auditLimit: 3 });

const makeAction = (id: string) => ({
  actionId: id,
  actor: "test",
  agent: "execution",
  taskId: `task-${id}`,
  target: "test-target",
  requestedOperation: "TEST_OPERATION",
  riskLevel: "CONSEQUENTIAL" as const,
  requiredAuthority: "TEST_AUTHORITY",
  policyDecision: "REQUIRES_APPROVAL" as const,
  approvalState: "PENDING" as const,
  provenance: "test",
  timestamp: new Date().toISOString()
});

store.submit(makeAction("a1"));
store.submit(makeAction("a2"));
store.submit(makeAction("a3"));
assert.equal(store.stats().pendingCount, 3);
assert.equal(store.stats().auditCount, 3);

assert.ok(store.approve("a1", "tester", { status: "SUCCESS" }));
assert.ok(store.approve("a2", "tester", { status: "SUCCESS" }));
assert.equal(store.stats().historyCount, 2);
assert.equal(store.stats().auditCount, 3);
assert.deepEqual(store.getHistory(10).map(a => a.actionId), ["a1", "a2"]);
assert.equal(store.approve("missing", "tester", {}), undefined);

console.log("ActionGateStore bounded-history/audit tests passed");
