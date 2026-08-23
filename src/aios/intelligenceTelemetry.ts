import { ultronEventBus, type ULTRONEventMap } from './events';

export type IntelligencePhase = ULTRONEventMap['intelligence.lifecycle']['phase'];
export type PhaseStatus = ULTRONEventMap['intelligence.lifecycle']['status'];

export interface IntelligenceTelemetryState {
  phase: IntelligencePhase | null;
  status: PhaseStatus | null;
  startedAt: number | null;
  completedAt: number | null;
  elapsedMs: number | null;
  agentCount: number;
  eventCount: number;
  verificationState: 'UNKNOWN' | 'PENDING' | 'VERIFIED' | 'FAILED';
  lastError: string | null;
}

const initialState: IntelligenceTelemetryState = {
  phase: null,
  status: null,
  startedAt: null,
  completedAt: null,
  elapsedMs: null,
  agentCount: 0,
  eventCount: 0,
  verificationState: 'UNKNOWN',
  lastError: null,
};

let state: IntelligenceTelemetryState = { ...initialState };
const subscribers = new Set<(state: IntelligenceTelemetryState) => void>();
let disposers: Array<() => void> = [];
let initialized = false;

function publish(next: Partial<IntelligenceTelemetryState>): void {
  state = { ...state, ...next };
  subscribers.forEach(listener => listener(state));
}

export const intelligenceTelemetry = {
  initialize(): void {
    if (initialized) return;
    initialized = true;
    disposers = [
      ultronEventBus.on('intelligence.lifecycle', event => {
        const start = event.status === 'started' ? event.timestamp : state.startedAt;
        const complete = event.status !== 'started' ? event.timestamp : null;
        publish({
          phase: event.phase,
          status: event.status,
          startedAt: start,
          completedAt: complete,
          elapsedMs: start && complete ? Math.max(0, complete - start) : state.elapsedMs,
          eventCount: state.eventCount + 1,
          verificationState: event.phase === 'verification'
            ? event.status === 'completed' ? 'VERIFIED' : event.status === 'failed' ? 'FAILED' : 'PENDING'
            : state.verificationState,
          lastError: event.status === 'failed' ? String(event.payload ?? 'Intelligence phase failed') : null,
        });
      }),
      ultronEventBus.on('agent.lifecycle', event => {
        const delta = event.status === 'created' ? 1 : event.status === 'failed' || event.status === 'completed' ? -1 : 0;
        publish({ agentCount: Math.max(0, state.agentCount + delta), eventCount: state.eventCount + 1 });
      }),
      ultronEventBus.on('world.update', () => publish({ eventCount: state.eventCount + 1 })),
    ];
  },
  shutdown(): void {
    disposers.forEach(dispose => dispose());
    disposers = [];
    initialized = false;
  },
  subscribe(listener: (state: IntelligenceTelemetryState) => void): () => void {
    subscribers.add(listener); listener(state); return () => subscribers.delete(listener);
  },
  getState(): IntelligenceTelemetryState { return state; },
};
