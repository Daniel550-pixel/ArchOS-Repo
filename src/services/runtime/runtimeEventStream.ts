export type RuntimeEventSeverity = 'info' | 'success' | 'warning' | 'error';

export interface RuntimeEvent {
  id: string;
  type: string;
  timestamp: string;
  correlationId?: string;
  sessionId?: string;
  source?: string;
  severity?: RuntimeEventSeverity;
  payload?: Record<string, unknown>;
}

export type RuntimeEventListener = (event: RuntimeEvent) => void;

const DEFAULT_STREAM_URL = '/api/v1/events/stream';

class RuntimeEventStream {
  private source: EventSource | null = null;
  private listeners = new Set<RuntimeEventListener>();
  private reconnectTimer: number | null = null;
  private stopped = false;

  connect(url = DEFAULT_STREAM_URL): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.source || this.stopped) return;

    try {
      this.source = new EventSource(url, { withCredentials: true });
      this.source.onmessage = (message) => this.handleMessage(message.data);
      this.source.onerror = () => {
        this.source?.close();
        this.source = null;
        if (!this.stopped) this.scheduleReconnect(url);
      };
    } catch {
      this.source = null;
    }
  }

  private handleMessage(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as Partial<RuntimeEvent>;
      if (!parsed.type || !parsed.timestamp) return;
      const event: RuntimeEvent = {
        id: parsed.id || crypto.randomUUID(),
        type: parsed.type,
        timestamp: parsed.timestamp,
        correlationId: parsed.correlationId,
        sessionId: parsed.sessionId,
        source: parsed.source,
        severity: parsed.severity || 'info',
        payload: parsed.payload || {},
      };
      this.listeners.forEach((listener) => listener(event));
      window.dispatchEvent(new CustomEvent<RuntimeEvent>('archos:runtime-event', { detail: event }));
    } catch {
      // Ignore malformed stream frames; the connection remains alive.
    }
  }

  private scheduleReconnect(url: string): void {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(url);
    }, 5000);
  }

  subscribe(listener: RuntimeEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect(): void {
    this.stopped = true;
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.source?.close();
    this.source = null;
  }
}

export const runtimeEventStream = new RuntimeEventStream();
