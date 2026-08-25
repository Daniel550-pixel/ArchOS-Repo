import { executionTrace, type ExecutionTraceRecord } from './executionTrace';
import { missionReplay } from './missionReplay';
import { createAIOSTraceId } from './events';

export interface WorldEntitySnapshot { entityId: string; kind: 'entity' | 'spatial' | 'temporal' | 'simulation'; value: unknown; traceId: string; timestamp: number; }
export interface WorldStateSnapshot { id: string; sessionId: string; frameIndex: number; traceId: string | null; timestamp: number; entities: Readonly<Record<string, WorldEntitySnapshot>>; entityCount: number; provenanceValid: boolean; hypothetical: boolean; sourceSnapshotId?: string; }
export interface WorldStateDiff { added: readonly string[]; removed: readonly string[]; changed: readonly string[]; unchanged: readonly string[]; }

function clone<T>(value: T): T { if (typeof structuredClone === 'function') return structuredClone(value); return JSON.parse(JSON.stringify(value)) as T; }
function fingerprint(value: unknown): string { const text = JSON.stringify(value); let hash = 2166136261; for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619); return (hash >>> 0).toString(16); }
function isWorldRecord(record: ExecutionTraceRecord): boolean { return record.kind === 'world' && Boolean(record.worldEntityId || record.payload); }
function entityId(record: ExecutionTraceRecord): string { return record.worldEntityId ?? `trace:${record.traceId}`; }
function entityKind(record: ExecutionTraceRecord): WorldEntitySnapshot['kind'] { const payload = record.payload as { kind?: WorldEntitySnapshot['kind'] } | undefined; return payload?.kind ?? 'entity'; }
function entityValue(record: ExecutionTraceRecord): unknown { const payload = record.payload as { value?: unknown; state?: unknown } | undefined; return payload && ('value' in payload || 'state' in payload) ? ('value' in payload ? payload.value : payload.state) : record.payload; }

export const worldStateTemporal = {
  reconstruct(sessionId: string, frameIndex: number): WorldStateSnapshot | null {
    const replay = missionReplay.getSession(sessionId); if (!replay) return null;
    const index = replay.frames.length ? Math.min(Math.max(0, Number.isFinite(frameIndex) ? Math.floor(frameIndex) : 0), replay.frames.length - 1) : -1;
    const records = index >= 0 ? replay.frames.slice(0, index + 1).map(frame => frame.record) : [];
    const entities: Record<string, WorldEntitySnapshot> = {};
    for (const record of records) { if (!isWorldRecord(record)) continue; const id = entityId(record); entities[id] = { entityId: id, kind: entityKind(record), value: clone(entityValue(record)), traceId: record.traceId, timestamp: record.timestamp }; }
    const current = index >= 0 ? replay.frames[index].record : null;
    const provenanceValid = !replay.missingTraceIds.length && executionTrace.health().invalidTimestamps === 0;
    return { id: `snap:${sessionId}:${index}:${current?.traceId ?? 'root'}`, sessionId, frameIndex: index, traceId: current?.traceId ?? null, timestamp: current?.timestamp ?? replay.session.startedAt, entities: clone(entities), entityCount: Object.keys(entities).length, provenanceValid, hypothetical: false };
  },

  diff(left: WorldStateSnapshot, right: WorldStateSnapshot): WorldStateDiff { const l = left.entities, r = right.entities; const all = new Set([...Object.keys(l), ...Object.keys(r)]); const added: string[] = [], removed: string[] = [], changed: string[] = [], unchanged: string[] = []; for (const id of all) { if (!l[id]) added.push(id); else if (!r[id]) removed.push(id); else if (fingerprint(l[id].value) !== fingerprint(r[id].value) || l[id].kind !== r[id].kind) changed.push(id); else unchanged.push(id); } return { added, removed, changed, unchanged }; },
  fromTrace(sessionId: string, traceId: string): WorldStateSnapshot | null { const replay = missionReplay.getSession(sessionId); if (!replay) return null; const frame = replay.frames.find(item => item.record.traceId === traceId); return frame ? this.reconstruct(sessionId, frame.index) : null; },
  fork(source: WorldStateSnapshot): WorldStateSnapshot { if (!source.provenanceValid) throw new Error('Cannot fork a world state with invalid provenance.'); return { ...clone(source), id: createAIOSTraceId(), hypothetical: true, sourceSnapshotId: source.id, entities: clone(source.entities) }; },
  applyHypothetical(snapshot: WorldStateSnapshot, entityId: string, value: unknown, kind: WorldEntitySnapshot['kind'] = 'simulation', traceId = createAIOSTraceId()): WorldStateSnapshot { if (!snapshot.hypothetical) throw new Error('Canonical world snapshots are immutable; fork before mutation.'); const entities: Record<string, WorldEntitySnapshot> = { ...snapshot.entities }; entities[entityId] = { entityId, kind, value: clone(value), traceId, timestamp: Date.now() }; return { ...snapshot, id: createAIOSTraceId(), entities, entityCount: Object.keys(entities).length, traceId }; },
  integrity(snapshot: WorldStateSnapshot): { valid: boolean; provenanceValid: boolean; entityCount: number; fingerprint: string } { return { valid: snapshot.provenanceValid && snapshot.entityCount === Object.keys(snapshot.entities).length, provenanceValid: snapshot.provenanceValid, entityCount: Object.keys(snapshot.entities).length, fingerprint: fingerprint(snapshot.entities) }; },
};
