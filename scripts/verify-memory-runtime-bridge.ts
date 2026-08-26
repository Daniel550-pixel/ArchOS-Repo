import assert from 'node:assert/strict';
import { memoryFabric } from '../src/aios/memoryFabric';
import { memoryRuntimeBridge } from '../src/aios/memoryRuntimeBridge';
import { ultronEventBus } from '../src/aios/events';

async function main() {
  memoryFabric.clear();
  memoryRuntimeBridge.initialize();

  ultronEventBus.emit('agent.lifecycle', {
    agentId: 'verification-agent',
    status: 'started',
    traceId: 'trace-memory-1',
    timestamp: Date.now(),
  });

  ultronEventBus.emit('world.update', {
    entityId: 'dubai-logistics',
    kind: 'spatial',
    traceId: 'trace-memory-2',
    timestamp: Date.now(),
    payload: { state: 'observed' },
  });

  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(memoryFabric.size(), 2);
  assert.equal(memoryFabric.query({ traceId: 'trace-memory-1' }).length, 1);
  assert.equal(memoryFabric.latest('aios.runtime', 'world:dubai-logistics')?.kind, 'world');
  assert.equal((await memoryFabric.verify()).valid, true);

  memoryRuntimeBridge.shutdown();
  ultronEventBus.clear();
  console.log('AIOS memory runtime bridge verification: PASS');
}

main().catch(error => {
  console.error('AIOS memory runtime bridge verification: FAIL');
  console.error(error);
  process.exit(1);
});
