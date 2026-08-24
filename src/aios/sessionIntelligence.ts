import type { CommandSource, UnifiedCommand } from '../types';
import { createAIOSTraceId, ultronEventBus, type ULTRONEventMap } from './events';
import type { ExecutionTraceRecord } from './executionTrace';

export interface SessionIntelligenceRecord {
  id: string;
  timestamp: number;
  traceId: string;
  parentTraceId?: string;
  kind: ExecutionTraceRecord['kind'];
  status: ExecutionTraceRecord['status'];
  source?: CommandSource;
  command?: UnifiedCommand;
  agentId?: string;
  phase?: ULTRONEventMap['intelligence.lifecycle']['phase'];
  worldEntityId?: string;
  worldUpdateKind?: ULTRONEventMap['world.update']['kind'];
  payload?: unknown;
}

export interface SessionIntelligence {
  id: string;
  startedAt: number;
  lastActivityAt: number;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'IDLE';
  title: string;
  commandCount: number;
  agentCount: number;
  intelligenceEventCount: number;
  worldUpdateCount: number;
  verificationFailures: number;
  records: readonly SessionIntelligenceRecord[];
}

export interface SessionIntelligenceSummary {
  sessionId: string;
  status: SessionIntelligence['status'];
  startedAt: number;
  lastActivityAt: number;
  commandCount: number;
  agentCount: number;
  intelligenceEventCount: number;
  worldUpdateCount: number;
  verificationFailures: number;
  latestTraceId: string | null;
}

export interface SessionIntelligenceHealth {
  totalSessions: number;
  activeSessionCount: number;
  duplicateSessionIds: number;
  invalidRecordTimestamps: number;
  duplicateRecordIds: number;
  retentionBounded: boolean;
}

const MAX_SESSIONS = 25;
const MAX_RECORDS_PER_SESSION = 300;
const SESSION_IDLE_MS = 30 * 60 * 1000;

let sessions: SessionIntelligence[] = [];
let activeSessionId: string | null = null;
let disposers: Array<() => void> = [];
let initialized = false;
const subscribers = new Set<(session: SessionIntelligence) => void>();

function createSession(title = 'Untitled AIOS Session'): SessionIntelligence {
  const now = Date.now();
  return { id: createAIOSTraceId(), startedAt: now, lastActivityAt: now, status: 'ACTIVE', title, commandCount: 0, agentCount: 0, intelligenceEventCount: 0, worldUpdateCount: 0, verificationFailures: 0, records: [] };
}

function getOrCreateActiveSession(): SessionIntelligence {
  const existing = activeSessionId ? sessions.find(session => session.id === activeSessionId) : undefined;
  if (existing && Date.now() - existing.lastActivityAt <= SESSION_IDLE_MS && existing.status === 'ACTIVE') return existing;
  if (existing) existing.status = 'COMPLETED';
  const session = createSession();
  sessions = [...sessions, session].slice(-MAX_SESSIONS);
  activeSessionId = session.id;
  return session;
}

function toRecord<K extends keyof ULTRONEventMap>(eventName: K, event: ULTRONEventMap[K]): SessionIntelligenceRecord | null {
  if (!event.traceId || !Number.isFinite(event.timestamp)) return null;
  const base = { id: createAIOSTraceId(), timestamp: event.timestamp, traceId: event.traceId, parentTraceId: event.parentTraceId, payload: 'payload' in event ? event.payload : undefined };
  switch (eventName) {
    case 'input.command': {
      const commandEvent = event as ULTRONEventMap['input.command'];
      return { ...base, kind: 'command', status: 'started', source: commandEvent.source, command: commandEvent.command };
    }
    case 'agent.lifecycle': {
      const lifecycle = event as ULTRONEventMap['agent.lifecycle'];
      return { ...base, kind: 'agent', status: lifecycle.status === 'started' ? 'started' : lifecycle.status === 'failed' ? 'failed' : 'completed', agentId: lifecycle.agentId };
    }
    case 'intelligence.lifecycle': {
      const lifecycle = event as ULTRONEventMap['intelligence.lifecycle'];
      return { ...base, kind: 'intelligence', status: lifecycle.status === 'started' ? 'started' : lifecycle.status === 'failed' ? 'failed' : 'completed', phase: lifecycle.phase };
    }
    case 'world.update': {
      const world = event as ULTRONEventMap['world.update'];
      return { ...base, kind: 'world', status: 'updated', worldEntityId: world.entityId, worldUpdateKind: world.kind };
    }
    case 'system.state': {
      const system = event as ULTRONEventMap['system.state'];
      return { ...base, kind: 'verification', status: system.state === 'ERROR' ? 'failed' : 'updated' };
    }
    default: return null;
  }
}

function applyRecord(session: SessionIntelligence, record: SessionIntelligenceRecord): SessionIntelligence {
  const nextStatus = record.kind === 'verification' && record.status === 'failed' ? 'FAILED' : session.status === 'FAILED' ? 'FAILED' : 'ACTIVE';
  return {
    ...session,
    lastActivityAt: Math.max(session.lastActivityAt, record.timestamp),
    commandCount: session.commandCount + (record.kind === 'command' ? 1 : 0),
    agentCount: session.agentCount + (record.kind === 'agent' && record.status === 'started' ? 1 : 0),
    intelligenceEventCount: session.intelligenceEventCount + (record.kind === 'intelligence' ? 1 : 0),
    worldUpdateCount: session.worldUpdateCount + (record.kind === 'world' ? 1 : 0),
    verificationFailures: session.verificationFailures + (record.kind === 'verification' && record.status === 'failed' ? 1 : 0),
    records: [...session.records, record].slice(-MAX_RECORDS_PER_SESSION),
    status: nextStatus,
    ...(record.kind === 'command' && record.command?.type === 'REQUEST_EXECUTION' && record.command.payload.title ? { title: record.command.payload.title } : {}),
  };
}

function consume<K extends keyof ULTRONEventMap>(eventName: K, event: ULTRONEventMap[K]): void {
  const record = toRecord(eventName, event);
  if (!record) return;
  const session = getOrCreateActiveSession();
  const next = applyRecord(session, record);
  sessions = sessions.map(item => item.id === next.id ? next : item);
  [...subscribers].forEach(listener => {
    try { listener(next); } catch (error) { console.error('[sessionIntelligence] subscriber failed', error); }
  });
}

export function validateSessionIntelligence(input: readonly SessionIntelligence[]): SessionIntelligenceHealth {
  const sessionIds = new Set<string>();
  let duplicateSessionIds = 0;
  let invalidRecordTimestamps = 0;
  let duplicateRecordIds = 0;
  input.forEach(session => {
    if (sessionIds.has(session.id)) duplicateSessionIds++;
    sessionIds.add(session.id);
    const recordIds = new Set<string>();
    session.records.forEach(record => {
      if (recordIds.has(record.id)) duplicateRecordIds++;
      recordIds.add(record.id);
      if (!Number.isFinite(record.timestamp)) invalidRecordTimestamps++;
    });
  });
  return { totalSessions: input.length, activeSessionCount: input.filter(session => session.status === 'ACTIVE').length, duplicateSessionIds, invalidRecordTimestamps, duplicateRecordIds, retentionBounded: input.length >= MAX_SESSIONS || input.some(session => session.records.length >= MAX_RECORDS_PER_SESSION) };
}

export const sessionIntelligence = {
  initialize(): void {
    if (initialized) return;
    initialized = true;
    disposers = (['input.command', 'agent.lifecycle', 'intelligence.lifecycle', 'world.update', 'system.state'] as const).map(eventName => ultronEventBus.on(eventName, event => consume(eventName, event)));
  },
  shutdown(): void { disposers.forEach(dispose => dispose()); disposers = []; initialized = false; },
  start(title?: string): string { const session = createSession(title); sessions = [...sessions, session].slice(-MAX_SESSIONS); activeSessionId = session.id; [...subscribers].forEach(listener => { try { listener(session); } catch (error) { console.error('[sessionIntelligence] subscriber failed', error); } }); return session.id; },
  complete(sessionId = activeSessionId): void { if (!sessionId) return; sessions = sessions.map(session => session.id === sessionId ? { ...session, status: 'COMPLETED' } : session); if (activeSessionId === sessionId) activeSessionId = null; },
  fail(sessionId = activeSessionId): void { if (!sessionId) return; sessions = sessions.map(session => session.id === sessionId ? { ...session, status: 'FAILED' } : session); if (activeSessionId === sessionId) activeSessionId = null; },
  subscribe(listener: (session: SessionIntelligence) => void): () => void { subscribers.add(listener); return () => subscribers.delete(listener); },
  getActive(): SessionIntelligence | null { return activeSessionId ? sessions.find(session => session.id === activeSessionId) ?? null : null; },
  get(sessionId: string): SessionIntelligence | null { return sessions.find(session => session.id === sessionId) ?? null; },
  list(): readonly SessionIntelligenceSummary[] { return sessions.map(session => ({ sessionId: session.id, status: session.status, startedAt: session.startedAt, lastActivityAt: session.lastActivityAt, commandCount: session.commandCount, agentCount: session.agentCount, intelligenceEventCount: session.intelligenceEventCount, worldUpdateCount: session.worldUpdateCount, verificationFailures: session.verificationFailures, latestTraceId: session.records.at(-1)?.traceId ?? null })); },
  health(): SessionIntelligenceHealth { return validateSessionIntelligence(sessions); },
  clear(): void { sessions = []; activeSessionId = null; },
};
