import assert from 'node:assert/strict';
import { aiosRuntime } from '../src/aios/runtime';
import { executionTrace } from '../src/aios/executionTrace';
import { missionReplay } from '../src/aios/missionReplay';
import { sessionIntelligence } from '../src/aios/sessionIntelligence';
import { ultronEventBus } from '../src/aios/events';

function testCommand() {
  return { type: 'REQUEST_EXECUTION' as const, payload: { title: 'AIOS memory verification', domain: 'system', intent: 'verify trace and replay integrity', riskLevel: 'LOW' as const } };
}

async function main() {
  executionTrace.initialize();
  sessionIntelligence.initialize();
  aiosRuntime.initialize();

  const sessionId = sessionIntelligence.start('AIOS memory verification');
  const throwingObserver = ultronEventBus.on('input.command', () => { throw new Error('synthetic observer failure'); });

  const traceId = aiosRuntime.dispatch(testCommand(), 'system');
  throwingObserver();

  assert.equal(traceId.length > 0, true, 'dispatch must return a trace id');
  assert.equal(executionTrace.getRecords(traceId).length, 1, 'command must be recorded despite observer failure');

  const session = sessionIntelligence.get(sessionId);
  assert(session, 'session must exist');
  assert.equal(session.commandCount, 1, 'session must count the command');
  assert.equal(session.records[0]?.traceId, traceId, 'session record must preserve trace provenance');

  const replay = missionReplay.getSession(sessionId);
  assert(replay, 'mission replay session must exist');
  assert.equal(replay.missingTraceIds.length, 0, 'replay must reconcile against execution trace');
  assert.equal(replay.frames.length, 1, 'replay must expose one command frame');
  assert.equal(missionReplay.reconcile(sessionId)?.valid, true, 'reconciliation must be valid');
  assert.equal(missionReplay.seek(sessionId, 1)?.current?.record.traceId, traceId, 'seek must resolve the trace');

  sessionIntelligence.complete(sessionId);
  assert.equal(sessionIntelligence.get(sessionId)?.status, 'COMPLETED', 'completed session must remain completed');

  aiosRuntime.shutdown();
  sessionIntelligence.shutdown();
  executionTrace.shutdown();
  ultronEventBus.clear();

  console.log('AIOS memory verification: PASS');
  console.log(`  traceId=${traceId}`);
  console.log('  execution trace: PASS');
  console.log('  session intelligence: PASS');
  console.log('  mission replay reconciliation: PASS');
  console.log('  observer isolation: PASS');
}

main().catch(error => {
  console.error('AIOS memory verification: FAIL');
  console.error(error);
  process.exit(1);
});
