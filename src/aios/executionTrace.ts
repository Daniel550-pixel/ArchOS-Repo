import type { CommandSource, UnifiedCommand } from '../types';
import { createAIOSTraceId, ultronEventBus, type AIOSTraceContext, type ULTRONEventMap } from './events';

export type ExecutionTraceKind =
  | 'command'
  | 'agent'
  | 'intelligence'
  | 'world'
  | 'verification';

export type ExecutionTraceStatus =
  | 'started'
  | 'completed'
  | 'failed'
  | 'updated';

export interface ExecutionTraceRecord extends AIOSTraceContext {
  id: string;
  traceId: string;
  parentTraceId?: string;
  kind: ExecutionTraceKind;
  status: ExecutionTraceStatus;
  timestamp: number;
  source?: CommandSource;
  command?: UnifiedCommand;
  agentId?: string;
  phase?: ULTRONEventMap['intelligence.lifecycle']['phase'];
  worldEntityId?: string;
  worldUpdateKind?: ULTRONEventMap['world.update']['kind'];
  payload?: unknown;
}

export interface ExecutionTraceSnapshot {
  traceId: string;
  startedAt: number;
  lastEventAt: number;
  status: ExecutionTraceStatus;
  records: readonly ExecutionTraceRecord[];
}

const MAX_RECORDS = 500;

let records: ExecutionTraceRecord[] = [];
const subscribers = new Set<(record: ExecutionTraceRecord) => void>();
const disposers: Array<() => void> = [];
let initialized = false;

function append(record: ExecutionTraceRecord): void {
  records = [...records, record].slice(-MAX_RECORDS);
  subscribers.forEach(listener => listener(record));
}

function recordFromEvent<K extends keyof ULTRONEventMap>(
  eventName: K,
  event: ULTRONEventMap[K],
): ExecutionTraceRecord | null {
  if (!event.traceId) return null;

  const base = {
    id: createAIOSTraceId(),
    traceId: event.traceId,
    parentTraceId: event.parentTraceId,
    timestamp: event.timestamp,
    payload: 'payload' in event ? event.payload : undefined,
  };

  switch (eventName) {
    case 'input.command':
      return { ...base, kind: 'command', status: 'started', source: event.source, command: event.command };
    case 'agent.lifecycle':
      return { ...base, kind: 'agent', status: event.status === 'started' ? 'started' : event.status === 'failed' ? 'failed' : 'completed', agentId: event.agentId };
    case 'intelligence.lifecycle':
      return { ...base, kind: 'intelligence', status: event.status === 'started' ? 'started' : event.status === 'failed' ? 'failed' : 'completed', phase: event.phase };
    case 'world.update':
      return { ...base, kind: 'world', status: 'updated', worldEntityId: event.entityId, worldUpdateKind: event.kind };
    case 'system.state':
      return { ...base, kind: 'verification', status: event.state === 'ERROR' ? 'failed' : 'updated' };
    default:
      return null;
  }
}

export const executionTrace = {
  initialize(): void {
    if (initialized) return;
    initialized = true;

    const events: Array<keyof ULTRONEventMap> = [
      'input.command',
      'agent.lifecycle',
      'intelligence.lifecycle',
      'world.update',
      'system.state',
    ];

    events.forEach(eventName => {
      const dispose = ultronEventBus.on(eventName, event => {
        const record = recordFromEvent(eventName, event);
        if (record) append(record);
      });
      disposers.push(dispose);
    });
  },

  shutdown(): void {
    disposers.splice(0).forEach(dispose => dispose());
    initialized = false;
  },

  subscribe(listener: (record: ExecutionTraceRecord) => void): () => void {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  },

  getRecords(traceId?: string): readonly ExecutionTraceRecord[] {
    return traceId ? records.filter(record => record.traceId === traceId) : records;
  },

  getSnapshot(traceId: string): ExecutionTraceSnapshot | null {
    const traceRecords = records.filter(record => record.traceId === traceId);
    if (!traceRecords.length) return null;

    const first = traceRecords[0];
    const last = traceRecords[traceRecords.length - 1];
    return {
      traceId,
      startedAt: first.timestamp,
      lastEventAt: last.timestamp,
      status: last.status,
      records: traceRecords,
    };
  },

  clear(): void {
    records = [];
  },

  size(): number {
    return records.length;
  },
};
