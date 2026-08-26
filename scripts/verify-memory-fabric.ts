import assert from 'node:assert/strict';
import { memoryFabric } from '../src/aios/memoryFabric';

async function main() {
  memoryFabric.clear();

  const first = await memoryFabric.write({
    namespace: 'jarvis',
    kind: 'episodic',
    subject: 'mission:alpha',
    value: { decision: 'investigate logistics capacity' },
    provenance: { source: 'architect-agent', sourceType: 'agent', observedAt: Date.now(), traceId: 'trace-alpha', confidence: 0.92 },
    trust: 'SUPPORTED',
  });

  const second = await memoryFabric.write({
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
  const integrity = await memoryFabric.verify();
  assert.equal(integrity.valid, true);
  assert.equal(integrity.brokenLinks, 0);
  assert.equal(integrity.invalidHashes, 0);

  console.log('AIOS memory fabric verification: PASS');
  console.log(`  records=${memoryFabric.size()}`);
  console.log('  hash chain: PASS');
  console.log('  provenance query: PASS');
  console.log('  versioning: PASS');
}

main().catch(error => {
  console.error('AIOS memory fabric verification: FAIL');
  console.error(error);
  process.exit(1);
});
