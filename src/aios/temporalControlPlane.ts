import { createAIOSTraceId, ultronEventBus } from './events';
import { executionTrace, type ExecutionTraceRecord } from './executionTrace';
import { missionReplay, type MissionReplaySession } from './missionReplay';
import { sessionIntelligence } from './sessionIntelligence';

export type TemporalBranchStatus = 'DRAFT' | 'SIMULATING' | 'COMPLETED' | 'ABORTED';
export interface TemporalBranchCommand { id: string; traceId: string; parentTraceId: string; createdAt: number; command: unknown; }
export interface TemporalBranch { id: string; sourceSessionId: string; sourceFrameIndex: number; sourceTraceId: string; createdAt: number; status: TemporalBranchStatus; label: string; commands: readonly TemporalBranchCommand[]; }
export interface TemporalComparison { leftSessionId: string; rightSessionId: string; leftFrames: number; rightFrames: number; sharedTraceIds: readonly string[]; leftOnlyTraceIds: readonly string[]; rightOnlyTraceIds: readonly string[]; commonEventKinds: readonly ExecutionTraceRecord['kind'][]; }
export interface TemporalControlState { selectedSessionId: string | null; selectedFrameIndex: number; branchId: string | null; mode: 'REPLAY' | 'COMPARE' | 'BRANCH' | 'SIMULATION'; }

let state: TemporalControlState = { selectedSessionId: null, selectedFrameIndex: 0, branchId: null, mode: 'REPLAY' };
let branches: TemporalBranch[] = [];
const subscribers = new Set<(state: TemporalControlState) => void>();
function publish(next: Partial<TemporalControlState>): void { state = { ...state, ...next }; [...subscribers].forEach(listener => { try { listener(state); } catch (error) { console.error('[temporal] subscriber failed', error); } }); }
function getReplay(sessionId: string): MissionReplaySession | null { return missionReplay.getSession(sessionId); }

export const temporalControlPlane = {
  subscribe(listener: (state: TemporalControlState) => void): () => void { subscribers.add(listener); listener(state); return () => subscribers.delete(listener); },
  getState(): TemporalControlState { return state; },
  select(sessionId: string, frameIndex = 0): boolean { const replay = getReplay(sessionId); if (!replay) return false; const index = replay.frames.length ? Math.min(Math.max(0, Math.floor(frameIndex)), replay.frames.length - 1) : -1; publish({ selectedSessionId: sessionId, selectedFrameIndex: index, mode: 'REPLAY', branchId: null }); return true; },
  selectFrame(frameIndex: number): boolean { return state.selectedSessionId ? this.select(state.selectedSessionId, frameIndex) : false; },
  causalChain(sessionId = state.selectedSessionId, frameIndex = state.selectedFrameIndex): readonly ExecutionTraceRecord[] { if (!sessionId) return []; const frame = getReplay(sessionId)?.frames[frameIndex]; if (!frame) return []; const records = executionTrace.getRecords(frame.record.traceId); const byTrace = new Map(records.map(record => [record.traceId, record])); const chain: ExecutionTraceRecord[] = []; let current: ExecutionTraceRecord | undefined = frame.record; const seen = new Set<string>(); while (current && !seen.has(current.traceId)) { seen.add(current.traceId); chain.unshift(current); current = current.parentTraceId ? byTrace.get(current.parentTraceId) : undefined; } return chain; },
  compare(leftSessionId: string, rightSessionId: string): TemporalComparison | null { const left = getReplay(leftSessionId); const right = getReplay(rightSessionId); if (!left || !right) return null; const l = new Set(left.traceIds); const r = new Set(right.traceIds); return { leftSessionId, rightSessionId, leftFrames: left.frames.length, rightFrames: right.frames.length, sharedTraceIds: [...l].filter(id => r.has(id)), leftOnlyTraceIds: [...l].filter(id => !r.has(id)), rightOnlyTraceIds: [...r].filter(id => !l.has(id)), commonEventKinds: [...new Set(left.frames.map(frame => frame.record.kind))].filter(kind => right.frames.some(frame => frame.record.kind === kind)) }; },
  branchFrom(sessionId: string, frameIndex: number, label = 'Temporal Simulation Branch'): TemporalBranch | null { const replay = getReplay(sessionId); const frame = replay?.frames[frameIndex]; if (!frame || !replay.integrityValid) return null; const branch: TemporalBranch = { id: createAIOSTraceId(), sourceSessionId: sessionId, sourceFrameIndex: frameIndex, sourceTraceId: frame.record.traceId, createdAt: Date.now(), status: 'DRAFT', label, commands: [] }; branches = [...branches, branch].slice(-50); publish({ selectedSessionId: sessionId, selectedFrameIndex: frameIndex, branchId: branch.id, mode: 'BRANCH' }); return branch; },
  appendBranchCommand(branchId: string, command: unknown): TemporalBranchCommand | null { const branch = branches.find(item => item.id === branchId); if (!branch || branch.status !== 'DRAFT') return null; const parentTraceId = branch.commands.at(-1)?.traceId ?? branch.sourceTraceId; const traceId = createAIOSTraceId(); const item = { id: createAIOSTraceId(), traceId, parentTraceId, createdAt: Date.now(), command }; branches = branches.map(itemBranch => itemBranch.id === branchId ? { ...itemBranch, commands: [...itemBranch.commands, item] } : itemBranch); ultronEventBus.emit('world.update', { entityId: `branch:${branchId}`, kind: 'simulation', traceId, parentTraceId, timestamp: item.createdAt, payload: { command, branch: true } }); return item; },
  beginSimulation(branchId: string): boolean { const branch = branches.find(item => item.id === branchId); if (!branch || branch.status !== 'DRAFT') return false; branches = branches.map(item => item.id === branchId ? { ...item, status: 'SIMULATING' } : item); publish({ branchId, mode: 'SIMULATION' }); return true; },
  completeSimulation(branchId: string, status: 'COMPLETED' | 'ABORTED' = 'COMPLETED'): boolean { if (!branches.some(item => item.id === branchId)) return false; branches = branches.map(item => item.id === branchId ? { ...item, status } : item); publish({ branchId: null, mode: 'REPLAY' }); return true; },
  getBranch(branchId: string): TemporalBranch | null { return branches.find(branch => branch.id === branchId) ?? null; },
  listBranches(): readonly TemporalBranch[] { return branches; },
  clearBranches(): void { branches = []; publish({ branchId: null, mode: 'REPLAY' }); },
  integrity(): { sessions: number; branches: number; traceHealth: ReturnType<typeof executionTrace.health> } { return { sessions: sessionIntelligence.list().length, branches: branches.length, traceHealth: executionTrace.health() }; },
};
