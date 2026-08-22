import type { CommandSource, SystemState, UnifiedCommand } from '../types';
import { ultronEventBus } from './events';

export interface AIOSRuntimeState {
  systemState: SystemState;
  activeView: string | null;
  activeEntityId: string | null;
  lastCommand: UnifiedCommand | null;
  lastCommandSource: CommandSource | null;
  lastTransitionAt: number;
}

const initialState: AIOSRuntimeState = {
  systemState: 'IDLE',
  activeView: null,
  activeEntityId: null,
  lastCommand: null,
  lastCommandSource: null,
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

    disposers = [
      ultronEventBus.on('input.command', ({ command, source }) => {
        publish({ lastCommand: command, lastCommandSource: source });
      }),
      ultronEventBus.on('system.state', ({ state: nextState }) => {
        publish({ systemState: nextState });
      }),
      ultronEventBus.on('system.context', ({ view, entityId }) => {
        publish({
          ...(view === undefined ? {} : { activeView: view }),
          ...(entityId === undefined ? {} : { activeEntityId: entityId }),
        });
      }),
    ];
  },

  shutdown(): void {
    disposers.forEach((dispose) => dispose());
    disposers = [];
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

  dispatch(command: UnifiedCommand, source: CommandSource = 'system'): void {
    ultronEventBus.emit('input.command', {
      command,
      source,
      timestamp: Date.now(),
    });
  },

  setSystemState(nextState: SystemState): void {
    const previousState = state.systemState;
    ultronEventBus.emit('system.state', {
      state: nextState,
      previousState,
      timestamp: Date.now(),
    });
  },

  setContext(view?: string, entityId?: string, mode?: string): void {
    ultronEventBus.emit('system.context', {
      view,
      entityId,
      mode,
      timestamp: Date.now(),
    });
  },
};
