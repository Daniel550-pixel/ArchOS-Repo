import { executionTrace, type ExecutionTraceRecord } from './executionTrace';
import { sessionIntelligence, type SessionIntelligence } from './sessionIntelligence';

export interface MissionReplayFrame {
  index: number;
  timestamp: number;
  relativeMs: number;
  record: ExecutionTraceRecord;
}

export interface MissionReplaySession {
  session: SessionIntelligence;
  frames: readonly MissionReplayFrame[];
  traceIds: readonly string[];
  missingTraceIds: readonly string[];
}

export interface MissionReplayCursor {
  sessionId: string;
  frameIndex: number;
  progress: number;
  current: MissionReplayFrame | null;
}

function buildReplay(session: SessionIntelligence): MissionReplaySession {
  const traceRecords = session.records.flatMap(record => executionTrace.getRecords(record.traceId));
  const unique = new Map<string, ExecutionTraceRecord>();
  traceRecords.forEach(record => unique.set(record.id, record));
  const records = [...unique.values()].sort((a, b) => a.timestamp - b.timestamp);
  const traceIds = [...new Set(session.records.map(record => record.traceId))];
  const available = new Set(records.map(record => record.traceId));
  const missingTraceIds = traceIds.filter(traceId => !available.has(traceId));
  const startedAt = records[0]?.timestamp ?? session.startedAt;
  return {
    session,
    frames: records.map((record, index) => ({ index, timestamp: record.timestamp, relativeMs: Math.max(0, record.timestamp - startedAt), record })),
    traceIds,
    missingTraceIds,
  };
}

export const missionReplay = {
  getSession(sessionId: string): MissionReplaySession | null {
    const session = sessionIntelligence.get(sessionId);
    return session ? buildReplay(session) : null;
  },

  getActive(): MissionReplaySession | null {
    const session = sessionIntelligence.getActive();
    return session ? buildReplay(session) : null;
  },

  reconcile(sessionId: string): { valid: boolean; sessionRecordCount: number; traceRecordCount: number; missingTraceIds: readonly string[] } | null {
    const replay = this.getSession(sessionId);
    if (!replay) return null;
    return {
      valid: replay.missingTraceIds.length === 0,
      sessionRecordCount: replay.session.records.length,
      traceRecordCount: replay.frames.length,
      missingTraceIds: replay.missingTraceIds,
    };
  },

  createCursor(sessionId: string): MissionReplayCursor | null {
    const replay = this.getSession(sessionId);
    if (!replay) return null;
    return { sessionId, frameIndex: replay.frames.length ? 0 : -1, progress: 0, current: replay.frames[0] ?? null };
  },

  seek(sessionId: string, progress: number): MissionReplayCursor | null {
    const replay = this.getSession(sessionId);
    if (!replay) return null;
    if (!replay.frames.length) return { sessionId, frameIndex: -1, progress: 0, current: null };
    const normalized = Math.min(1, Math.max(0, progress));
    const frameIndex = Math.min(replay.frames.length - 1, Math.round(normalized * (replay.frames.length - 1)));
    return { sessionId, frameIndex, progress: normalized, current: replay.frames[frameIndex] };
  },

  at(sessionId: string, frameIndex: number): MissionReplayCursor | null {
    const replay = this.getSession(sessionId);
    if (!replay || !replay.frames.length) return replay ? { sessionId, frameIndex: -1, progress: 0, current: null } : null;
    const index = Math.min(replay.frames.length - 1, Math.max(0, Math.floor(frameIndex)));
    return { sessionId, frameIndex: index, progress: index / Math.max(1, replay.frames.length - 1), current: replay.frames[index] };
  },

  subscribe(listener: (record: ExecutionTraceRecord) => void): () => void {
    return executionTrace.subscribe(listener);
  },
};
