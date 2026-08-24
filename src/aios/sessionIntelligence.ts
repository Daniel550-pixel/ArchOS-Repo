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
  if (!event.traceId) return null;
  const base = { id: createAIOSTraceId(), timestamp: event.timestamp, traceId: event.traceId, parentTraceId: event.parentTraceId, payload: 'payload' in event ? event.payload : undefined };
  switch (eventName) {
    case 'input.command': return { ...base, kind: 'command', status: 'started', source: event.source, command: event.command };
    case 'agent.lifecycle': return { ...base, kind: 'agent', status: event.status === 'started' ? 'started' : event.status === 'failed' ? 'failed' : 'completed', agentId: event.agentId };
    case 'intelligence.lifecycle': return { ...base, kind: 'intelligence', status: event.status === 'started' ? 'started' : event.status === 'failed' ? 'failed' : 'completed', phase: event.phase };
    case 'world.update': return { ...base, kind: 'world', status: 'updated', worldEntityId: event.entityId, worldUpdateKind: event.kind };
    case 'system.state': return { ...base, kind: 'verification', status: event.state === 'ERROR' ? 'failed' : 'updated' };
    default: return null;
  }
}

function applyRecord(session: SessionIntelligence, record: SessionIntelligenceRecord): SessionIntelligence {
  const next = { ...session, lastActivityAt: record.timestamp, commandCount: session.commandCount + (record.kind === 'command' ? 1 : 0), agentCount: session.agentCount + (record.kind === 'agent' && record.status === 'started' ? 1 : 0), intelligenceEventCount: session.intelligenceEventCount + (record.kind === 'intelligence' ? 1 : 0), worldUpdateCount: session.worldUpdateCount + (record.kind === 'world' ? 1 : 0), verificationFailures: session.verificationFailures + (record.kind === 'verification' && record.status === 'failed' ? 1 : 0), records: [...session.records, record].slice(-MAX_RECORDS_PER_SESSION) };
  if (record.kind === 'command' && record.command?.type === 'REQUEST_EXECUTION') next.title = record.command.payload.title || next.title;
  next.status = record.kind === 'verification' && record.status === 'failed' ? 'FAILED' : 'ACTIVE';
  return next;
}

function consume<K extends keyof ULTRONEventMap>(eventName: K, event: ULTRONEventMap[K]): void {
  const record = toRecord(eventName, event);
  if (!record) return;
  const session = getOrCreateActiveSession();
  const next = applyRecord(session, record);
  sessions = sessions.map(item => item.id === next.id ? next : item);
  subscribers.forEach(listener => listener(next));
}

export const sessionIntelligence = {
  initialize(): void {
    if (initialized) return;
    initialized = true;
    disposers = (['input.command', 'agent.lifecycle', 'intelligence.lifecycle', 'world.update', 'system.state'] as const).map(eventName => ultronEventBus.on(eventName, event => consume(eventName, event)));
  },
  shutdown(): void { disposers.forEach(dispose => dispose()); disposers = []; initialized = false; },
  start(title?: string): string { const session = createSession(title); sessions = [...sessions, session].slice(-MAX_SESSIONS); activeSessionId = session.id; subscribers.forEach(listener => listener(session)); return session.id; },
  complete(sessionId = activeSessionId): void { if (!sessionId) return; sessions = sessions.map(session => session.id === sessionId ? { ...session, status: 'COMPLETED' } : session); if (activeSessionId === sessionId) activeSessionId = null; },
  fail(sessionId = activeSessionId): void { if (!sessionId) return; sessions = sessions.map(session => session.id === sessionId ? { ...session, status: 'FAILED' } : session); if (activeSessionId === sessionId) activeSessionId = null; },
  subscribe(listener: (session: SessionIntelligence) => void): () => void { subscribers.add(listener); return () => subscribers.delete(listener); },
  getActive(): SessionIntelligence | null { return activeSessionId ? sessions.find(session => session.id === activeSessionId) ?? null : null; },
  get(sessionId: string): SessionIntelligence | null { return sessions.find(session => session.id === sessionId) ?? null; },
  list(): readonly SessionIntelligenceSummary[] { return sessions.map(session => ({ sessionId: session.id, status: session.status, startedAt: session.startedAt, lastActivityAt: session.lastActivityAt, commandCount: session.commandCount, agentCount: session.agentCount, intelligenceEventCount: session.intelligenceEventCount, worldUpdateCount: session.worldUpdateCount, verificationFailures: session.verificationFailures, latestTraceId: session.records.at(-1)?.traceId ?? null })); },
  clear(): void { sessions = []; activeSessionId = null; },
};
