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
  duplicateRecordIds: number;
  invalidTimestamps: number;
  retentionLimited: boolean;
}

export interface MissionReplayReconciliation {
  valid: boolean;
  degraded: boolean;
  sessionRecordCount: number;
  traceRecordCount: number;
  missingTraceIds: readonly string[];
  duplicateRecordIds: number;
  invalidTimestamps: number;
  retentionLimited: boolean;
}

export interface MissionReplayCursor {
  sessionId: string;
  frameIndex: number;
  progress: number;
  current: MissionReplayFrame | null;
}

function buildReplay(session: SessionIntelligence): MissionReplaySession {
  const traceIds = [...new Set(session.records.map(record => record.traceId))];
  const traceRecords = traceIds.flatMap(traceId => executionTrace.getRecords(traceId));
  const unique = new Map<string, ExecutionTraceRecord>();
  let duplicateRecordIds = 0;
  traceRecords.forEach(record => {
    if (unique.has(record.id)) duplicateRecordIds++;
    unique.set(record.id, record);
  });

  const records = [...unique.values()].sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
  const available = new Set(records.map(record => record.traceId));
  const missingTraceIds = traceIds.filter(traceId => !available.has(traceId));
  const invalidTimestamps = records.reduce((count, record) => count + (Number.isFinite(record.timestamp) ? 0 : 1), 0);
  const retentionLimited = executionTrace.health().retentionBounded && missingTraceIds.length > 0;
  const startedAt = records.find(record => Number.isFinite(record.timestamp))?.timestamp ?? session.startedAt;

  return {
    session,
    frames: records.map((record, index) => ({ index, timestamp: record.timestamp, relativeMs: Math.max(0, record.timestamp - startedAt), record })),
    traceIds,
    missingTraceIds,
    duplicateRecordIds,
    invalidTimestamps,
    retentionLimited,
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

  reconcile(sessionId: string): MissionReplayReconciliation | null {
    const replay = this.getSession(sessionId);
    if (!replay) return null;
    const degraded = replay.missingTraceIds.length > 0 || replay.duplicateRecordIds > 0 || replay.invalidTimestamps > 0;
    return {
      valid: !degraded,
      degraded,
      sessionRecordCount: replay.session.records.length,
      traceRecordCount: replay.frames.length,
      missingTraceIds: replay.missingTraceIds,
      duplicateRecordIds: replay.duplicateRecordIds,
      invalidTimestamps: replay.invalidTimestamps,
      retentionLimited: replay.retentionLimited,
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
    const normalized = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
    const frameIndex = Math.min(replay.frames.length - 1, Math.round(normalized * (replay.frames.length - 1)));
    return { sessionId, frameIndex, progress: normalized, current: replay.frames[frameIndex] };
  },

  at(sessionId: string, frameIndex: number): MissionReplayCursor | null {
    const replay = this.getSession(sessionId);
    if (!replay || !replay.frames.length) return replay ? { sessionId, frameIndex: -1, progress: 0, current: null } : null;
    const normalizedIndex = Number.isFinite(frameIndex) ? Math.floor(frameIndex) : 0;
    const index = Math.min(replay.frames.length - 1, Math.max(0, normalizedIndex));
    return { sessionId, frameIndex: index, progress: index / Math.max(1, replay.frames.length - 1), current: replay.frames[index] };
  },

  subscribe(listener: (record: ExecutionTraceRecord) => void): () => void {
    return executionTrace.subscribe(listener);
  },
};
