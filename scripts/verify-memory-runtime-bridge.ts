import assert from 'node:assert/strict';
import { memoryFabric } from './memoryFabric';
import { memoryRuntimeBridge } from './memoryRuntimeBridge';
import { ultronEventBus } from './events';

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

assert.equal(memoryFabric.size(), 2);
assert.equal(memoryFabric.query({ traceId: 'trace-memory-1' }).length, 1);
assert.equal(memoryFabric.latest('aios.runtime', 'world:dubai-logistics')?.kind, 'world');
assert.equal(memoryFabric.verify().valid, true);

memoryRuntimeBridge.shutdown();
ultronEventBus.clear();
console.log('AIOS memory runtime bridge verification: PASS');
