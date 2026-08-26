import assert from 'node:assert/strict';
import { assembleMemoryContext } from '../src/aios/memoryContext';
import { memoryFabric } from '../src/aios/memoryFabric';

async function main() {
  memoryFabric.clear();
  await memoryFabric.write({
    namespace: 'jarvis',
    kind: 'evidence',
    subject: 'mission:context',
    value: { source: 'verified-observation' },
    provenance: { source: 'world-model', sourceType: 'world-model', observedAt: Date.now(), traceId: 'trace-context', confidence: 0.98 },
    trust: 'VERIFIED',
  });
  await memoryFabric.write({
    namespace: 'jarvis',
    kind: 'episodic',
    subject: 'mission:context',
    value: { note: 'supported observation' },
    provenance: { source: 'agent', sourceType: 'agent', observedAt: Date.now(), traceId: 'trace-context', confidence: 0.81 },
    trust: 'SUPPORTED',
  });
  await memoryFabric.write({
    namespace: 'jarvis',
    kind: 'evidence',
    subject: 'mission:context',
    value: { source: 'rejected-observation' },
    provenance: { source: 'critic', sourceType: 'agent', observedAt: Date.now(), traceId: 'trace-context', confidence: 0.99 },
    trust: 'REJECTED',
  });

  const context = assembleMemoryContext({ namespace: 'jarvis', subject: 'mission:context', minConfidence: 0.8 });
  assert.equal(context.recordCount, 2);
  assert.equal(context.verifiedCount, 1);
  assert.equal(context.supportedCount, 1);
  assert.equal(context.rejectedCount, 0);
  assert.equal(context.items.some(item => item.trust === 'REJECTED'), false);

  console.log('AIOS memory context verification: PASS');
}

main().catch(error => {
  console.error('AIOS memory context verification: FAIL');
  console.error(error);
  process.exit(1);
});
