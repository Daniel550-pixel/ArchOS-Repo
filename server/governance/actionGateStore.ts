export type ActionGateRisk = "READ_ONLY" | "LOW_RISK" | "CONSEQUENTIAL" | "HIGH_IMPACT";

export interface ActionGateRecord {
  actionId: string;
  actor: string;
  agent: string;
  taskId: string;
  target: string;
  requestedOperation: string;
  riskLevel: ActionGateRisk;
  requiredAuthority: string;
  policyDecision: "ALLOWED" | "DENIED" | "REQUIRES_APPROVAL";
  approvalState: "PENDING" | "APPROVED" | "REJECTED" | "AUTO_APPROVED";
  approvedBy?: string;
  provenance: string;
  timestamp: string;
  payload?: unknown;
  result?: unknown;
}

export interface AuditRecord extends ActionGateRecord {
  auditEvent: string;
  auditId: string;
  recordedAt: string;
}

const DEFAULT_HISTORY_LIMIT = 1000;
const DEFAULT_AUDIT_LIMIT = 5000;

export class ActionGateStore {
  private readonly pending = new Map<string, ActionGateRecord>();
  private readonly history: ActionGateRecord[] = [];
  private readonly audit: AuditRecord[] = [];
  private readonly historyLimit: number;
  private readonly auditLimit: number;

  constructor(options: { historyLimit?: number; auditLimit?: number } = {}) {
    this.historyLimit = Math.max(1, options.historyLimit ?? DEFAULT_HISTORY_LIMIT);
    this.auditLimit = Math.max(1, options.auditLimit ?? DEFAULT_AUDIT_LIMIT);
  }

  getPending(): ActionGateRecord[] {
    return Array.from(this.pending.values());
  }

  getHistory(limit = 50): ActionGateRecord[] {
    return this.history.slice(-Math.max(0, Math.min(limit, this.historyLimit)));
  }

  getAudit(limit = 100): AuditRecord[] {
    return this.audit.slice(-Math.max(0, Math.min(limit, this.auditLimit)));
  }

  submit(action: ActionGateRecord): void {
    this.pending.set(action.actionId, action);
    this.recordAudit(action, "ACTION_HELD_PENDING_APPROVAL");
  }

  approve(actionId: string, approver: string, result: unknown): ActionGateRecord | undefined {
    const action = this.pending.get(actionId);
    if (!action) return undefined;

    this.pending.delete(actionId);
    action.approvalState = "APPROVED";
    action.approvedBy = approver;
    action.policyDecision = "ALLOWED";
    action.result = result;
    this.pushBounded(this.history, action, this.historyLimit);
    this.recordAudit(action, "ACTION_APPROVED_AND_EXECUTED");
    return action;
  }

  private recordAudit(action: ActionGateRecord, auditEvent: string): void {
    const audit: AuditRecord = {
      ...action,
      auditId: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      recordedAt: new Date().toISOString(),
      auditEvent
    };
    this.pushBounded(this.audit, audit, this.auditLimit);
  }

  private pushBounded<T>(target: T[], value: T, limit: number): void {
    target.push(value);
    if (target.length > limit) target.splice(0, target.length - limit);
  }

  stats() {
    return {
      pendingCount: this.pending.size,
      historyCount: this.history.length,
      auditCount: this.audit.length,
      historyLimit: this.historyLimit,
      auditLimit: this.auditLimit
    };
  }
}

export const actionGateStore = new ActionGateStore();
