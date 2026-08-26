import { assembleMemoryContext, type AssembledMemoryContext, type MemoryContextRequest } from './memoryContext';

export type AgentRole =
  | 'ARCHITECT'
  | 'RESEARCHER'
  | 'ANALYST'
  | 'SPECIALIST'
  | 'CRITIC'
  | 'SIMULATOR'
  | 'SYNTHESIZER';

export type AgentProvider = 'anthropic' | 'openai' | 'google' | 'local' | 'custom';

export interface AgentCapability {
  role: AgentRole;
  providers: readonly AgentProvider[];
  priority: number;
  requiresVerification: boolean;
}

export interface AgentTask {
  id: string;
  objective: string;
  role: AgentRole;
  traceId?: string;
  memory?: MemoryContextRequest;
  requiredProvider?: AgentProvider;
}

export interface AgentDispatchPlan {
  task: AgentTask;
  provider: AgentProvider;
  memory: AssembledMemoryContext;
  verificationRequired: boolean;
}

const capabilities: readonly AgentCapability[] = [
  { role: 'ARCHITECT', providers: ['anthropic', 'openai', 'google', 'custom'], priority: 100, requiresVerification: true },
  { role: 'RESEARCHER', providers: ['anthropic', 'openai', 'google', 'custom'], priority: 90, requiresVerification: true },
  { role: 'ANALYST', providers: ['anthropic', 'openai', 'google', 'local', 'custom'], priority: 90, requiresVerification: true },
  { role: 'SPECIALIST', providers: ['anthropic', 'openai', 'google', 'local', 'custom'], priority: 80, requiresVerification: true },
  { role: 'CRITIC', providers: ['anthropic', 'openai', 'google', 'local', 'custom'], priority: 100, requiresVerification: true },
  { role: 'SIMULATOR', providers: ['local', 'custom'], priority: 80, requiresVerification: true },
  { role: 'SYNTHESIZER', providers: ['anthropic', 'openai', 'google', 'custom'], priority: 100, requiresVerification: true },
];

function capabilityFor(role: AgentRole): AgentCapability {
  const capability = capabilities.find(item => item.role === role);
  if (!capability) throw new Error(`Unsupported agent role: ${role}`);
  return capability;
}

function selectProvider(task: AgentTask): AgentProvider {
  const capability = capabilityFor(task.role);
  if (task.requiredProvider) {
    if (!capability.providers.includes(task.requiredProvider)) {
      throw new Error(`Provider ${task.requiredProvider} cannot satisfy role ${task.role}`);
    }
    return task.requiredProvider;
  }
  return capability.providers[0];
}

/**
 * Plans agent execution without coupling ArchOS to a specific model vendor.
 * Memory is assembled before dispatch and rejected records are excluded by default.
 */
export function createAgentDispatchPlan(task: AgentTask): AgentDispatchPlan {
  const capability = capabilityFor(task.role);
  const provider = selectProvider(task);
  const memory = assembleMemoryContext({
    ...task.memory,
    traceId: task.memory?.traceId ?? task.traceId,
  });

  return {
    task,
    provider,
    memory,
    verificationRequired: capability.requiresVerification,
  };
}

export function listAgentCapabilities(): readonly AgentCapability[] {
  return capabilities;
}
