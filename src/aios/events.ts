import type { CommandSource, HandGestureState, SystemState, UnifiedCommand } from '../types';

export type ULTRONEventMap = {
  'input.command': {
    command: UnifiedCommand;
    source: CommandSource;
    timestamp: number;
  };
  'input.gesture': {
    gesture: HandGestureState['currentGesture'];
    state: HandGestureState;
    timestamp: number;
  };
  'system.state': {
    state: SystemState;
    previousState?: SystemState;
    timestamp: number;
  };
  'system.context': {
    view?: string;
    entityId?: string;
    mode?: string;
    timestamp: number;
  };
  'world.update': {
    entityId?: string;
    kind: 'entity' | 'spatial' | 'temporal' | 'simulation';
    timestamp: number;
    payload?: unknown;
  };
  'agent.lifecycle': {
    agentId: string;
    status: 'created' | 'started' | 'completed' | 'failed';
    timestamp: number;
    payload?: unknown;
  };
  'intelligence.lifecycle': {
    phase: 'intent' | 'reasoning' | 'planning' | 'verification';
    status: 'started' | 'completed' | 'failed';
    timestamp: number;
    payload?: unknown;
  };
  'module.lifecycle': {
    moduleId: string;
    status: 'focused' | 'opened' | 'closed';
    timestamp: number;
    payload?: unknown;
  };
};

export type ULTRONEventName = keyof ULTRONEventMap;
export type ULTRONEventHandler<K extends ULTRONEventName> = (event: ULTRONEventMap[K]) => void;

class ULTRONEventBus {
  private listeners = new Map<ULTRONEventName, Set<(event: any) => void>>();

  on<K extends ULTRONEventName>(name: K, handler: ULTRONEventHandler<K>): () => void {
    const listeners = this.listeners.get(name) ?? new Set<(event: any) => void>();
    listeners.add(handler as (event: any) => void);
    this.listeners.set(name, listeners);
    return () => this.off(name, handler);
  }

  off<K extends ULTRONEventName>(name: K, handler: ULTRONEventHandler<K>): void {
    this.listeners.get(name)?.delete(handler as (event: any) => void);
  }

  emit<K extends ULTRONEventName>(name: K, event: ULTRONEventMap[K]): void {
    this.listeners.get(name)?.forEach((handler) => handler(event));
  }

  clear(name?: ULTRONEventName): void {
    if (name) {
      this.listeners.delete(name);
      return;
    }
    this.listeners.clear();
  }
}

export const ultronEventBus = new ULTRONEventBus();
