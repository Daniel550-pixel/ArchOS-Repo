import type { CommandSource, SystemState, UnifiedCommand } from '../types';
import { createAIOSTraceId, ultronEventBus } from './events';
import { memoryRuntimeBridge } from './memoryRuntimeBridge';

export interface AIOSRuntimeState {
  systemState: SystemState;
  activeView: string | null;
  activeEntityId: string | null;
  lastCommand: UnifiedCommand | null;
  lastCommandSource: CommandSource | null;
  lastTraceId: string | null;
  lastTransitionAt: number;
}

const initialState: AIOSRuntimeState = {
  systemState: 'IDLE',
  activeView: null,
  activeEntityId: null,
  lastCommand: null,
  lastCommandSource: null,
  lastTraceId: null,
  lastTransitionAt: Date.now(),
};

let state: AIOSRuntimeState = { ...initialState };
const subscribers = new Set<(state: AIOSRuntimeState) => void>();
let initialized = false;
let disposers: Array<() => void> = [];

function publish(next: Partial<AIOSRuntimeState>): void {
  state = { ...state, ...next, lastTransitionAt: Date.now() };
  subscribers.forEach((subscriber) => subscriber(state));
}

export const aiosRuntime = {
  initialize(): void {
    if (initialized) return;
    initialized = true;
    memoryRuntimeBridge.initialize();

    disposers = [
      ultronEventBus.on('input.command', ({ command, source, traceId }) => {
        publish({
          lastCommand: command,
          lastCommandSource: source,
          lastTraceId: traceId ?? null,
        });
      }),
      ultronEventBus.on('system.state', ({ state: nextState, traceId }) => {
        publish({ systemState: nextState, lastTraceId: traceId ?? state.lastTraceId });
      }),
      ultronEventBus.on('system.context', ({ view, entityId, traceId }) => {
        publish({
          ...(view === undefined ? {} : { activeView: view }),
          ...(entityId === undefined ? {} : { activeEntityId: entityId }),
          ...(traceId === undefined ? {} : { lastTraceId: traceId }),
        });
      }),
    ];
  },

  shutdown(): void {
    disposers.forEach((dispose) => dispose());
    disposers = [];
    memoryRuntimeBridge.shutdown();
    initialized = false;
  },

  subscribe(listener: (state: AIOSRuntimeState) => void): () => void {
    subscribers.add(listener);
    listener(state);
    return () => subscribers.delete(listener);
  },

  getState(): AIOSRuntimeState {
    return state;
  },

  dispatch(command: UnifiedCommand, source: CommandSource = 'system', parentTraceId?: string): string {
    const traceId = createAIOSTraceId();
    ultronEventBus.emit('input.command', {
      command,
      source,
      traceId,
      parentTraceId,
      timestamp: Date.now(),
    });
    return traceId;
  },

  setSystemState(nextState: SystemState, parentTraceId?: string): string {
    const previousState = state.systemState;
    const traceId = createAIOSTraceId();
    ultronEventBus.emit('system.state', {
      state: nextState,
      previousState,
      traceId,
      parentTraceId,
      timestamp: Date.now(),
    });
    return traceId;
  },

  setContext(view?: string, entityId?: string, mode?: string, parentTraceId?: string): string {
    const traceId = createAIOSTraceId();
    ultronEventBus.emit('system.context', {
      view,
      entityId,
      mode,
      traceId,
      parentTraceId,
      timestamp: Date.now(),
    });
    return traceId;
  },
};
