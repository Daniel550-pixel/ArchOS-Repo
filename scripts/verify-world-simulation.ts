import assert from 'node:assert/strict';
import { aiosRuntime } from '../src/aios/runtime';
import { executionTrace } from '../src/aios/executionTrace';
import { missionReplay } from '../src/aios/missionReplay';
import { sessionIntelligence } from '../src/aios/sessionIntelligence';
import { ultronEventBus } from '../src/aios/events';
import { temporalControlPlane } from '../src/aios/temporalControlPlane';
import { worldSimulation } from '../src/aios/worldSimulation';

async function main() {
  executionTrace.clear(); sessionIntelligence.clear(); ultronEventBus.clear(); temporalControlPlane.clearBranches(); worldSimulation.clear();
  executionTrace.initialize(); sessionIntelligence.initialize(); aiosRuntime.initialize();
  const sessionId = sessionIntelligence.start('world simulation verification');
  const traceId = aiosRuntime.dispatch({ type: 'REQUEST_EXECUTION', payload: { title: 'seed world', domain: 'world', intent: 'seed simulation state', riskLevel: 'LOW' } }, 'system');
  ultronEventBus.emit('world.update', { entityId: 'city:alpha', kind: 'simulation', traceId, timestamp: Date.now(), payload: { kind: 'spatial', value: { population: 100 } } });
  const replay = missionReplay.getSession(sessionId); assert(replay?.frames.length);
  const branch = temporalControlPlane.branchFrom(sessionId, replay.frames.length - 1); assert(branch);
  const simulation = worldSimulation.create(branch.id, 3, [{ id: 'growth', value: 0.05 }]); assert(simulation);
  const projection = worldSimulation.step(simulation.id, [{ entityId: 'city:alpha', value: { population: 105 }, kind: 'spatial' }]); assert(projection);
  assert.equal(projection.step, 1); assert.equal(projection.state.hypothetical, true);
  const second = worldSimulation.run(simulation.id, [[], [{ entityId: 'city:alpha', value: { population: 110 }, kind: 'spatial' }]]); assert(second);
  assert.equal(second.status, 'COMPLETED'); assert.equal(second.projections.length, 3);
  const canonical = temporalControlPlane.worldState(sessionId, replay.frames.length - 1); assert(canonical);
  assert.deepEqual(canonical.entities['city:alpha']?.value, { population: 100 });
  assert.notDeepEqual(second.projections.at(-1)?.state.entities['city:alpha']?.value, canonical.entities['city:alpha']?.value);
  assert.equal(branch.snapshot.hypothetical, true);
  aiosRuntime.shutdown(); sessionIntelligence.shutdown(); executionTrace.shutdown(); ultronEventBus.clear(); worldSimulation.clear(); temporalControlPlane.clearBranches();
  console.log('World simulation verification: PASS');
  console.log(`  sourceTrace=${traceId}`); console.log('  branch isolation: PASS'); console.log('  projected states: PASS'); console.log('  canonical immutability: PASS');
}
main().catch(error => { console.error('World simulation verification: FAIL'); console.error(error); process.exit(1); });
