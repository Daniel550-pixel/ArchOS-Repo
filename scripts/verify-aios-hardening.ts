import assert from 'node:assert/strict';
import { validateExecutionTraceRecords, type ExecutionTraceRecord } from '../src/aios/executionTrace';
import { validateSessionIntelligence, type SessionIntelligence } from '../src/aios/sessionIntelligence';

const record = (overrides: Partial<ExecutionTraceRecord> = {}): ExecutionTraceRecord => ({
  id: 'record-1',
  traceId: 'trace-1',
  kind: 'command',
  status: 'started',
  timestamp: 1,
  ...overrides,
});

const healthy = validateExecutionTraceRecords([
  record(),
  record({ id: 'record-2', traceId: 'trace-2', parentTraceId: 'trace-1', timestamp: 2 }),
]);
assert.equal(healthy.duplicateRecordIds, 0);
assert.equal(healthy.invalidTimestamps, 0);
assert.equal(healthy.unresolvedParentTraceIds, 0);
assert.equal(healthy.monotonic, true);

const malformed = validateExecutionTraceRecords([
  record(),
  record({ id: 'record-1', parentTraceId: 'missing-parent', timestamp: Number.NaN }),
]);
assert.equal(malformed.duplicateRecordIds, 1);
assert.equal(malformed.invalidTimestamps, 1);
assert.equal(malformed.unresolvedParentTraceIds, 1);

const nonMonotonic = validateExecutionTraceRecords([
  record({ timestamp: 2 }),
  record({ id: 'record-2', traceId: 'trace-2', timestamp: 1 }),
]);
assert.equal(nonMonotonic.monotonic, false);

const session: SessionIntelligence = {
  id: 'session-1',
  startedAt: 1,
  lastActivityAt: 2,
  status: 'ACTIVE',
  title: 'Hardening verification',
  commandCount: 1,
  agentCount: 0,
  intelligenceEventCount: 0,
  worldUpdateCount: 0,
  verificationFailures: 0,
  records: [
    {
      id: 'session-record-1',
      timestamp: 1,
      traceId: 'trace-1',
      kind: 'command',
      status: 'started',
    },
  ],
};

const sessionHealth = validateSessionIntelligence([session]);
assert.equal(sessionHealth.duplicateSessionIds, 0);
assert.equal(sessionHealth.duplicateRecordIds, 0);
assert.equal(sessionHealth.invalidRecordTimestamps, 0);
assert.equal(sessionHealth.activeSessionCount, 1);

console.log('AIOS hardening verification passed');
