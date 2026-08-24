import type { CommandSource, UnifiedCommand } from '../types';
import { createAIOSTraceId, ultronEventBus, type AIOSTraceContext, type ULTRONEventMap } from './events';

export type ExecutionTraceKind = 'command' | 'agent' | 'intelligence' | 'world' | 'verification';
export type ExecutionTraceStatus = 'started' | 'completed' | 'failed' | 'updated';

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

export interface ExecutionTraceHealth {
  totalRecords: number;
  uniqueTraceIds: number;
  orphanedParentTraceIds: number;
  invalidTimestamps: number;
  duplicateRecordIds: number;
  monotonic: boolean;
}

const MAX_RECORDS = 500;
let records: ExecutionTraceRecord[] = [];
const subscribers = new Set<(record: ExecutionTraceRecord) => void>();
const disposers: Array<() => void> = [];
let initialized = false;

function append(record: ExecutionTraceRecord): void {
  if (!record.id || !record.traceId || !Number.isFinite(record.timestamp)) return;
  records = [...records, record].slice(-MAX_RECORDS);
  [...subscribers].forEach(listener => {
    try { listener(record); } catch (error) { console.error('[executionTrace] subscriber failed', error); }
  });
}

function recordFromEvent<K extends keyof ULTRONEventMap>(eventName: K, event: ULTRONEventMap[K]): ExecutionTraceRecord | null {
  if (!event.traceId || !Number.isFinite(event.timestamp)) return null;
  const base = { id: createAIOSTraceId(), traceId: event.traceId, parentTraceId: event.parentTraceId, timestamp: event.timestamp, payload: 'payload' in event ? event.payload : undefined };
  switch (eventName) {
    case 'input.command': return { ...base, kind: 'command', status: 'started', source: event.source, command: event.command };
    case 'agent.lifecycle': return { ...base, kind: 'agent', status: event.status === 'started' ? 'started' : event.status === 'failed' ? 'failed' : 'completed', agentId: event.agentId };
    case 'intelligence.lifecycle': return { ...base, kind: 'intelligence', status: event.status === 'started' ? 'started' : event.status === 'failed' ? 'failed' : 'completed', phase: event.phase };
    case 'world.update': return { ...base, kind: 'world', status: 'updated', worldEntityId: event.entityId, worldUpdateKind: event.kind };
    case 'system.state': return { ...base, kind: 'verification', status: event.state === 'ERROR' ? 'failed' : 'updated' };
    default: return null;
  }
}

export const executionTrace = {
  initialize(): void {
    if (initialized) return;
    initialized = true;
    (['input.command', 'agent.lifecycle', 'intelligence.lifecycle', 'world.update', 'system.state'] as const).forEach(eventName => {
      disposers.push(ultronEventBus.on(eventName, event => {
        const record = recordFromEvent(eventName, event);
        if (record) append(record);
      }));
    });
  },
  shutdown(): void { disposers.splice(0).forEach(dispose => dispose()); initialized = false; },
  subscribe(listener: (record: ExecutionTraceRecord) => void): () => void { subscribers.add(listener); return () => subscribers.delete(listener); },
  getRecords(traceId?: string): readonly ExecutionTraceRecord[] { return traceId ? records.filter(record => record.traceId === traceId) : records; },
  getSnapshot(traceId: string): ExecutionTraceSnapshot | null {
    const traceRecords = records.filter(record => record.traceId === traceId);
    if (!traceRecords.length) return null;
    const first = traceRecords[0]; const last = traceRecords[traceRecords.length - 1];
    return { traceId, startedAt: first.timestamp, lastEventAt: last.timestamp, status: last.status, records: traceRecords };
  },
  health(): ExecutionTraceHealth {
    const ids = new Set<string>(); const traceIds = new Set<string>(); const known = new Set(records.map(record => record.traceId));
    let duplicateRecordIds = 0; let invalidTimestamps = 0; let orphanedParentTraceIds = 0; let monotonic = true;
    records.forEach((record, index) => {
      if (ids.has(record.id)) duplicateRecordIds++;
      ids.add(record.id); traceIds.add(record.traceId);
      if (!Number.isFinite(record.timestamp)) invalidTimestamps++;
      if (index > 0 && record.timestamp < records[index - 1].timestamp) monotonic = false;
      if (record.parentTraceId && !known.has(record.parentTraceId)) orphanedParentTraceIds++;
    });
    return { totalRecords: records.length, uniqueTraceIds: traceIds.size, orphanedParentTraceIds, invalidTimestamps, duplicateRecordIds, monotonic };
  },
  clear(): void { records = []; },
  size(): number { return records.length; },
};
