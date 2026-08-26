import { ultronEventBus, type ULTRONEventMap } from './events';
import { memoryFabric } from './memoryFabric';

let initialized = false;
let disposers: Array<() => void> = [];

function persist(eventName: keyof ULTRONEventMap, event: ULTRONEventMap[keyof ULTRONEventMap]): void {
  if (!event.traceId || !Number.isFinite(event.timestamp)) return;
  const subject = eventName === 'world.update'
    ? `world:${(event as ULTRONEventMap['world.update']).entityId}`
    : eventName === 'agent.lifecycle'
      ? `agent:${(event as ULTRONEventMap['agent.lifecycle']).agentId}`
      : `trace:${event.traceId}`;
  const kind = eventName === 'world.update' ? 'world' : eventName === 'input.command' ? 'episodic' : eventName === 'system.state' ? 'evidence' : 'procedural';
  memoryFabric.write({
    namespace: 'aios.runtime',
    kind,
    subject,
    value: event,
    provenance: {
      source: `event:${eventName}`,
      sourceType: 'system',
      observedAt: event.timestamp,
      traceId: event.traceId,
      confidence: 1,
    },
    trust: eventName === 'system.state' && (event as ULTRONEventMap['system.state']).state === 'ERROR' ? 'REJECTED' : 'SUPPORTED',
  });
}

export const memoryRuntimeBridge = {
  initialize(): void {
    if (initialized) return;
    initialized = true;
    const eventNames = ['input.command', 'agent.lifecycle', 'intelligence.lifecycle', 'world.update', 'system.state'] as const;
    disposers = eventNames.map((eventName) => ultronEventBus.on(eventName, (event) => persist(eventName, event)));
  },
  shutdown(): void {
    disposers.splice(0).forEach((dispose) => dispose());
    initialized = false;
  },
};
