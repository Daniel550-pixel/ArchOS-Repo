import { createAgentDispatchPlan, listAgentCapabilities } from '../src/aios/agentFabric';

const capabilities = listAgentCapabilities();
if (capabilities.length < 7) throw new Error('Expected core agent roles to be registered');

const plan = createAgentDispatchPlan({
  id: 'verification-task',
  objective: 'Validate the memory-aware agent fabric',
  role: 'ANALYST',
  traceId: 'trace-verification',
  memory: { limit: 10, minConfidence: 0.5 },
});

if (plan.provider !== 'anthropic') throw new Error(`Unexpected default provider: ${plan.provider}`);
if (!plan.verificationRequired) throw new Error('Verification must be required for analyst tasks');
if (plan.memory.items.some(item => item.trust === 'REJECTED')) {
  throw new Error('Rejected memories must not enter agent context');
}

let incompatibleProviderRejected = false;
try {
  createAgentDispatchPlan({
    id: 'invalid-provider-task',
    objective: 'This must fail safely',
    role: 'SIMULATOR',
    requiredProvider: 'anthropic',
  });
} catch {
  incompatibleProviderRejected = true;
}

if (!incompatibleProviderRejected) throw new Error('Unsupported provider/role combinations must be rejected');

console.log('Agent fabric verification passed.');
