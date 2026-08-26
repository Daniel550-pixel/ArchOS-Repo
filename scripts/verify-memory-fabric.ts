import assert from 'node:assert/strict';
import { memoryFabric } from './memoryFabric';

memoryFabric.clear();

const first = memoryFabric.write({
  namespace: 'jarvis',
  kind: 'episodic',
  subject: 'mission:alpha',
  value: { decision: 'investigate logistics capacity' },
  provenance: { source: 'architect-agent', sourceType: 'agent', observedAt: Date.now(), traceId: 'trace-alpha', confidence: 0.92 },
  trust: 'SUPPORTED',
});

const second = memoryFabric.write({
  namespace: 'jarvis',
  kind: 'semantic',
  subject: 'mission:alpha',
  value: { constraint: 'requires independent verification' },
  provenance: { source: 'critic-agent', sourceType: 'agent', observedAt: Date.now(), traceId: 'trace-alpha', evidenceIds: ['evidence-1'], confidence: 0.88 },
  trust: 'VERIFIED',
});

assert.equal(first.version, 1);
assert.equal(second.version, 2);
assert.equal(second.previousHash, first.recordHash);
assert.equal(memoryFabric.latest('jarvis', 'mission:alpha')?.id, second.id);
assert.equal(memoryFabric.query({ traceId: 'trace-alpha' }).length, 2);
assert.equal(memoryFabric.verify().valid, true);
assert.equal(memoryFabric.verify().brokenLinks, 0);
assert.equal(memoryFabric.verify().invalidHashes, 0);

console.log('AIOS memory fabric verification: PASS');
console.log(`  records=${memoryFabric.size()}`);
console.log('  hash chain: PASS');
console.log('  provenance query: PASS');
console.log('  versioning: PASS');
