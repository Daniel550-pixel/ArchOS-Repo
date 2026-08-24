import type { CommandSource, HandGestureState, SystemState, UnifiedCommand } from '../types';

export interface AIOSTraceContext {
  traceId?: string;
  parentTraceId?: string;
}

export type ULTRONEventMap = {
  'input.command': AIOSTraceContext & { command: UnifiedCommand; source: CommandSource; timestamp: number };
  'input.gesture': AIOSTraceContext & { gesture: HandGestureState['currentGesture']; state: HandGestureState; timestamp: number };
  'system.state': AIOSTraceContext & { state: SystemState; previousState?: SystemState; timestamp: number };
  'system.context': AIOSTraceContext & { view?: string; entityId?: string; mode?: string; timestamp: number };
  'world.update': AIOSTraceContext & { entityId?: string; kind: 'entity' | 'spatial' | 'temporal' | 'simulation'; timestamp: number; payload?: unknown };
  'agent.lifecycle': AIOSTraceContext & { agentId: string; status: 'created' | 'started' | 'completed' | 'failed'; timestamp: number; payload?: unknown };
  'intelligence.lifecycle': AIOSTraceContext & { phase: 'intent' | 'reasoning' | 'planning' | 'verification'; status: 'started' | 'completed' | 'failed'; timestamp: number; payload?: unknown };
};

export type ULTRONEventName = keyof ULTRONEventMap;
export type ULTRONEventHandler<K extends ULTRONEventName> = (event: ULTRONEventMap[K]) => void;

type EventHandler = (event: unknown) => void;

class ULTRONEventBus {
  private listeners = new Map<ULTRONEventName, Set<EventHandler>>();

  on<K extends ULTRONEventName>(name: K, handler: ULTRONEventHandler<K>): () => void {
    const listeners = this.listeners.get(name) ?? new Set<EventHandler>();
    listeners.add(handler as EventHandler);
    this.listeners.set(name, listeners);
    return () => this.off(name, handler);
  }

  off<K extends ULTRONEventName>(name: K, handler: ULTRONEventHandler<K>): void {
    const listeners = this.listeners.get(name);
    listeners?.delete(handler as EventHandler);
    if (listeners?.size === 0) this.listeners.delete(name);
  }

  emit<K extends ULTRONEventName>(name: K, event: ULTRONEventMap[K]): void {
    const listeners = this.listeners.get(name);
    if (!listeners) return;

    // One observer must never be able to prevent the remaining runtime observers from seeing an event.
    for (const handler of [...listeners]) {
      try {
        handler(event);
      } catch (error) {
        console.error(`[AIOS event bus] observer failed for ${name}`, error);
      }
    }
  }

  clear(name?: ULTRONEventName): void {
    if (name) this.listeners.delete(name);
    else this.listeners.clear();
  }
}

export const ultronEventBus = new ULTRONEventBus();

export function createAIOSTraceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
