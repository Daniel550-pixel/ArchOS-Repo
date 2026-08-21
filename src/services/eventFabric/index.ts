// ArchOS Event Fabric Client
// Real-time Event Nervous System: Connects UI, J.A.R.V.I.S., 3D Scene, and Action Gate

import { ArchOSEvent, ArchOSEventType } from '../../types/archosEvents';

type EventHandler<T extends ArchOSEvent = ArchOSEvent> = (event: T) => void;

class EventFabricClient {
  private handlers: Map<ArchOSEventType | '*', Set<EventHandler<any>>> = new Map();
  private eventHistory: ArchOSEvent[] = [];
  private maxHistory = 200;
  private eventSource: EventSource | null = null;
  private isConnected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSSE();
    }
  }

  private initSSE(correlationId?: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = correlationId ? `/api/events?correlationId=${encodeURIComponent(correlationId)}` : '/api/events';
    try {
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type) {
            this.emit(parsed as ArchOSEvent, false);
          }
        } catch {
          // ignore malformed heartbeat
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
      };
    } catch (e) {
      console.warn('[EventFabric] SSE connection deferred:', e);
    }
  }

  public subscribe<T extends ArchOSEvent = ArchOSEvent>(
    eventType: ArchOSEventType | '*',
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      const set = this.handlers.get(eventType);
      if (set) {
        set.delete(handler);
      }
    };
  }

  public emit(event: ArchOSEvent, broadcastToServer: boolean = false): void {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Specific handlers
    const specificHandlers = this.handlers.get(event.type);
    if (specificHandlers) {
      specificHandlers.forEach(fn => {
        try {
          fn(event);
        } catch (err) {
          console.error(`[EventFabric] Handler error for ${event.type}:`, err);
        }
      });
    }

    // Wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(fn => {
        try {
          fn(event);
        } catch (err) {
          console.error(`[EventFabric] Wildcard handler error:`, err);
        }
      });
    }
  }

  public getHistory(correlationId?: string): ArchOSEvent[] {
    if (!correlationId) return [...this.eventHistory];
    return this.eventHistory.filter(e => e.correlationId === correlationId);
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }

  public reconnect(correlationId?: string): void {
    this.initSSE(correlationId);
  }
}

export const eventFabric = new EventFabricClient();

