import { TelemetryAlert, TelemetryAlertType, AlertSeverity } from '../../types';

export const SAMPLE_TELEMETRY_ALERTS: Array<Omit<TelemetryAlert, 'id' | 'timestamp'>> = [
  {
    type: 'ECONOMIC_SPIKE',
    title: 'Non-Oil Foreign Trade Surge',
    summary: 'H1 2026 cross-border trade transactions surpassed 1.20 Trillion AED across Dubai & Abu Dhabi customs ports.',
    metric: '+14.4% YoY',
    severity: 'SUCCESS',
    location: 'Dubai & Abu Dhabi, UAE',
    confidence: 0.96,
    entity: 'Federal Customs & MoE',
    actionTarget: {
      tab: 'intelligence',
      entityId: 'uae-trade-h1-2026'
    },
    autoDismissMs: 7000
  },
  {
    type: 'RISK_THRESHOLD',
    title: 'Sovereign Risk Index: Optimal Level',
    summary: 'Logistics and supply chain vulnerability models indicate near-zero friction across Jebel Ali and Khalifa Port.',
    metric: 'Risk 0.18 (Low)',
    severity: 'INFO',
    location: 'Jebel Ali / Khalifa Port Corridor',
    confidence: 0.98,
    entity: 'National Logistics Matrix',
    actionTarget: {
      tab: 'world'
    },
    autoDismissMs: 6500
  },
  {
    type: 'INFRASTRUCTURE_MILESTONE',
    title: 'Dubai Metro Blue Line Commissioning',
    summary: 'Tunnel Boring Machine breakthrough achieved at Dubai Creek Harbour station ahead of Q4 schedule.',
    metric: '94% On-Track',
    severity: 'SUCCESS',
    location: 'Dubai Creek Harbour, Dubai',
    confidence: 0.97,
    entity: 'RTA Dubai',
    actionTarget: {
      tab: 'world',
      entityId: 'metro-blue-line-q4'
    },
    autoDismissMs: 7500
  },
  {
    type: 'SPATIAL_ANOMALY',
    title: 'Saadiyat Cultural District Capital Inflow',
    summary: 'Unusual liquidity velocity detected in luxury commercial acquisitions exceeding AED 28.4B in Q2.',
    metric: '+12.0% Volume',
    severity: 'WARNING',
    location: 'Saadiyat Island, Abu Dhabi',
    confidence: 0.91,
    entity: 'Abu Dhabi DMT',
    actionTarget: {
      tab: 'intelligence',
      entityId: 'ad-real-estate-q2'
    },
    autoDismissMs: 8000
  }
];

class TelemetryAlertService {
  private alerts: TelemetryAlert[] = [];
  private listeners: Set<(alerts: TelemetryAlert[]) => void> = new Set();
  private timerIds: Map<string, any> = new Map();
  private isMonitoring = false;
  private monitorInterval: any = null;

  constructor() {
    // Schedule initial greeting / threshold alert after startup
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.triggerSampleAlert(0);
      }, 2500);

      // Start subtle threshold monitoring cycle (every 45s a threshold check can dispatch)
      this.startThresholdMonitoring();
    }
  }

  public getAlerts(): TelemetryAlert[] {
    return [...this.alerts];
  }

  public addAlert(alertData: Omit<TelemetryAlert, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): string {
    const id = alertData.id || `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = alertData.timestamp || 'JUST NOW · GST';
    const autoDismissMs = alertData.autoDismissMs ?? 7000;

    const newAlert: TelemetryAlert = {
      ...alertData,
      id,
      timestamp,
      autoDismissMs
    };

    // Keep at most 4 active toasts to avoid screen clutter
    this.alerts = [newAlert, ...this.alerts.slice(0, 3)];
    this.notify();

    // Setup auto dismiss timer
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        this.dismissAlert(id);
      }, autoDismissMs);
      this.timerIds.set(id, timer);
    }

    return id;
  }

  public dismissAlert(id: string): void {
    if (this.timerIds.has(id)) {
      clearTimeout(this.timerIds.get(id));
      this.timerIds.delete(id);
    }
    this.alerts = this.alerts.filter((a) => a.id !== id);
    this.notify();
  }

  public clearAll(): void {
    this.timerIds.forEach((t) => clearTimeout(t));
    this.timerIds.clear();
    this.alerts = [];
    this.notify();
  }

  public subscribe(listener: (alerts: TelemetryAlert[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAlerts());
    return () => this.listeners.delete(listener);
  }

  public triggerSampleAlert(index?: number): void {
    const sampleIdx = index !== undefined ? index % SAMPLE_TELEMETRY_ALERTS.length : Math.floor(Math.random() * SAMPLE_TELEMETRY_ALERTS.length);
    const sample = SAMPLE_TELEMETRY_ALERTS[sampleIdx];
    this.addAlert(sample);
  }

  public triggerCustomThresholdAlert(params: {
    type: TelemetryAlertType;
    title: string;
    summary: string;
    metric: string;
    severity?: AlertSeverity;
    location?: string;
    confidence?: number;
    entity?: string;
    actionTarget?: { tab: 'orb' | 'world' | 'intelligence' | 'experience'; entityId?: string };
  }): string {
    return this.addAlert({
      type: params.type,
      title: params.title,
      summary: params.summary,
      metric: params.metric,
      severity: params.severity || 'INFO',
      location: params.location || 'UAE Federal System',
      confidence: params.confidence || 0.95,
      entity: params.entity || 'JARVIS Telemetry Engine',
      actionTarget: params.actionTarget,
      autoDismissMs: 7000
    });
  }

  private startThresholdMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Periodic simulation of live UAE telemetry thresholds
    let sampleIndex = 1;
    this.monitorInterval = setInterval(() => {
      // Only fire if there are fewer than 2 active alerts to stay non-intrusive
      if (this.alerts.length < 2) {
        this.triggerSampleAlert(sampleIndex);
        sampleIndex = (sampleIndex + 1) % SAMPLE_TELEMETRY_ALERTS.length;
      }
    }, 60000); // every 60 seconds
  }

  private notify(): void {
    const current = this.getAlerts();
    this.listeners.forEach((l) => l(current));
  }
}

export const telemetryAlertService = new TelemetryAlertService();
