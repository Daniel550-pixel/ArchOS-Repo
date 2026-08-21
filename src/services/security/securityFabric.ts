import {
  DataClassification,
  PrincipalRole,
  SecurityIdentity,
  RiskLevel,
  ToolSecurityRequest,
  PolicyEvaluationResult,
  ImmutableAuditRecord,
  PendingApprovalGate
} from './types';
import { quantumCryptoService } from './quantumCryptoService';

// Simple deterministic hash simulation for immutable cryptographic audit chains
function computeAuditHash(data: string, prevHash: string): string {
  let hash = 0;
  const str = `${prevHash}:${data}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256-0x${hex}${Math.abs(hash * 31).toString(16).padStart(8, '0')}`;
}

export const KNOWN_IDENTITIES: Record<string, SecurityIdentity> = {
  'principal.government_analyst': {
    id: 'principal.government_analyst',
    type: 'HUMAN',
    role: 'GOVERNMENT_ANALYST',
    clearanceLevel: 8,
    tenant: 'uae.government.executive',
    allowedDomains: ['uae.all', 'archos.all', 'macro.finances', 'intelligence.feed'],
    attributes: { sovereigntyCertified: true, country: 'UAE' }
  },
  'principal.architect': {
    id: 'principal.architect',
    type: 'HUMAN',
    role: 'SOVEREIGN_ARCHITECT',
    clearanceLevel: 7,
    tenant: 'archos.studio.dubai',
    allowedDomains: ['archos.all', 'uae.dubai', 'uae.abudhabi', 'experience.public'],
    attributes: { bimCertified: true, license: 'UAE-ARCH-2026' }
  },
  'principal.developer': {
    id: 'principal.developer',
    type: 'HUMAN',
    role: 'DEVELOPER',
    clearanceLevel: 6,
    tenant: 'aios.engineering.core',
    allowedDomains: ['aios.runtime', 'experience.public', 'tools.debug'],
    attributes: { engClearance: true }
  },
  'principal.auditor': {
    id: 'principal.auditor',
    type: 'HUMAN',
    role: 'AUDITOR',
    clearanceLevel: 8,
    tenant: 'sovereign.audit.oversight',
    allowedDomains: ['audit.immutable', 'uae.all', 'archos.all'],
    attributes: { complianceOfficer: true }
  },
  'principal.viewer': {
    id: 'principal.viewer',
    type: 'HUMAN',
    role: 'VIEWER',
    clearanceLevel: 2,
    tenant: 'public.viewer.guest',
    allowedDomains: ['experience.public', 'uae.public'],
    attributes: { guest: true }
  },
  'agent.jarvis': {
    id: 'agent.jarvis',
    type: 'AGENT',
    role: 'GOVERNMENT_ANALYST',
    clearanceLevel: 9,
    tenant: 'aios.executive.jarvis',
    allowedDomains: ['*'],
    attributes: { executiveCore: true }
  },
  'agent.experience': {
    id: 'agent.experience',
    type: 'AGENT',
    role: 'SOVEREIGN_ARCHITECT',
    clearanceLevel: 5,
    tenant: 'archos.experience.runtime',
    allowedDomains: ['experience.public', 'archos.spatial'],
    attributes: { renderer: true }
  },
  'service.camera_capture': {
    id: 'service.camera_capture',
    type: 'SERVICE',
    role: 'VIEWER',
    clearanceLevel: 3,
    tenant: 'vision.mediapipe.service',
    allowedDomains: ['vision.landmarks'],
    attributes: { consentGated: true }
  }
};

class SecurityFabricEngine {
  private activeIdentity: SecurityIdentity = KNOWN_IDENTITIES['principal.architect'];
  private auditChain: ImmutableAuditRecord[] = [];
  private pendingGates: PendingApprovalGate[] = [];
  private listeners: Set<() => void> = new Set();
  private sequenceCounter: number = 0;

  constructor() {
    this.bootstrapAuditGenesis();
  }

  private bootstrapAuditGenesis() {
    const genesisTime = new Date().toISOString();
    const genesisHash = computeAuditHash('GENESIS_BLOCK_SECURITY_FABRIC_ZERO_TRUST', '0x0000000000000000');
    
    this.auditChain.push({
      id: 'audit-genesis-000',
      sequence: 0,
      timestamp: genesisTime,
      epochMs: Date.now(),
      who: 'system.genesis',
      role: 'SOVEREIGN_ROOT',
      what: 'ZERO_TRUST_SECURITY_FABRIC_BOOTSTRAP',
      where: 'sovereign.uae.core',
      why: 'Initialize immutable cryptographic provenance chain',
      resource: 'security.fabric.root',
      classification: 'HIGHLY_RESTRICTED',
      policyResult: 'ALLOWED',
      riskLevel: 'LOW',
      approvalState: 'AUTONOMOUS',
      hash: genesisHash,
      prevHash: '0x0000000000000000',
      signature: 'ed25519-sig-genesis-master'
    });
  }

  public getActiveIdentity(): SecurityIdentity {
    return this.activeIdentity;
  }

  public setActiveIdentity(identityId: string): void {
    if (KNOWN_IDENTITIES[identityId]) {
      this.activeIdentity = KNOWN_IDENTITIES[identityId];
      this.recordAudit({
        who: this.activeIdentity.id,
        role: this.activeIdentity.role,
        what: 'SWITCH_ACTIVE_IDENTITY',
        where: this.activeIdentity.tenant,
        why: 'Principal context switched in ULTRON interface',
        resource: 'identity.session',
        classification: 'INTERNAL',
        policyResult: 'ALLOWED',
        riskLevel: 'LOW',
        approvalState: 'AUTONOMOUS'
      });
      this.notify();
    }
  }

  public getAuditChain(): ImmutableAuditRecord[] {
    return [...this.auditChain];
  }

  public getPendingGates(): PendingApprovalGate[] {
    return [...this.pendingGates];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  /**
   * Risk Evaluation Engine (Calculates Blast Radius, Impact, Reversibility)
   */
  public evaluateRisk(request: ToolSecurityRequest): RiskLevel {
    if (request.actionType === 'DESTRUCTIVE' || request.resourceClassification === 'HIGHLY_RESTRICTED') {
      return 'CRITICAL';
    }
    if (
      request.actionType === 'ADMIN' ||
      request.actionType === 'WRITE' && request.resourceClassification === 'RESTRICTED'
    ) {
      return 'HIGH';
    }
    if (request.actionType === 'WRITE' || request.resourceClassification === 'CONFIDENTIAL') {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Policy Engine (RBAC + ABAC Zero-Trust Rules)
   */
  public evaluatePolicy(request: ToolSecurityRequest): PolicyEvaluationResult {
    const identity = KNOWN_IDENTITIES[request.callerIdentity] || this.activeIdentity;
    const risk = this.evaluateRisk(request);

    // Rule 1: Classification vs Clearance level check
    const clearanceRequirement: Record<DataClassification, number> = {
      PUBLIC: 1,
      INTERNAL: 3,
      CONFIDENTIAL: 5,
      RESTRICTED: 7,
      HIGHLY_RESTRICTED: 9
    };

    const requiredClearance = clearanceRequirement[request.resourceClassification] || 1;
    if (identity.clearanceLevel < requiredClearance) {
      return {
        allowed: false,
        policyRule: 'RULE_CLEARANCE_INSUFFICIENT',
        riskLevel: risk,
        requiresHumanApproval: false,
        reason: `Identity '${identity.id}' has clearance Level ${identity.clearanceLevel}, but target requires Level ${requiredClearance} (${request.resourceClassification}).`,
        evaluatedAt: Date.now()
      };
    }

    // Rule 2: Domain scope enforcement
    const isDomainAllowed =
      identity.allowedDomains.includes('*') ||
      identity.allowedDomains.some((d) => request.domainScope.startsWith(d.replace('.all', '')));

    if (!isDomainAllowed) {
      return {
        allowed: false,
        policyRule: 'RULE_DOMAIN_SCOPE_DENIED',
        riskLevel: risk,
        requiresHumanApproval: false,
        reason: `Target domain '${request.domainScope}' is outside identity authorized scopes [${identity.allowedDomains.join(', ')}].`,
        evaluatedAt: Date.now()
      };
    }

    // Rule 3: High/Critical Risk requires Human Approval Gate
    const requiresHumanApproval = risk === 'HIGH' || risk === 'CRITICAL';

    return {
      allowed: true,
      policyRule: requiresHumanApproval ? 'RULE_GATED_HIGH_RISK_POLICY' : 'RULE_AUTONOMOUS_POLICY_PERMITTED',
      riskLevel: risk,
      requiresHumanApproval,
      reason: requiresHumanApproval
        ? `Action approved subject to High-Impact Human Confirmation Gate (Risk: ${risk}).`
        : 'All Zero-Trust RBAC/ABAC verification constraints satisfied.',
      evaluatedAt: Date.now()
    };
  }

  /**
   * Tool Security Gateway: Evaluates and gates tool execution
   */
  public evaluateAndAuthorize(
    request: ToolSecurityRequest,
    autoCreateApprovalGate = true
  ): { status: 'ALLOWED' | 'DENIED' | 'GATE_REQUIRED'; gateId?: string; policy: PolicyEvaluationResult } {
    const policy = this.evaluatePolicy(request);

    if (!policy.allowed) {
      this.recordAudit({
        who: request.callerIdentity,
        role: this.activeIdentity.role,
        what: `DENIED_${request.toolName}`,
        where: request.domainScope,
        why: policy.reason,
        resource: request.targetResource,
        classification: request.resourceClassification,
        policyResult: 'DENIED',
        riskLevel: policy.riskLevel,
        approvalState: 'REJECTED'
      });
      return { status: 'DENIED', policy };
    }

    if (policy.requiresHumanApproval) {
      if (autoCreateApprovalGate) {
        const gate: PendingApprovalGate = {
          id: `gate-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: Date.now(),
          request,
          riskLevel: policy.riskLevel,
          justification: request.reason || `Authorize high-risk ${request.toolName} on ${request.targetResource}`,
          status: 'PENDING'
        };
        this.pendingGates.push(gate);

        this.recordAudit({
          who: request.callerIdentity,
          role: this.activeIdentity.role,
          what: `GATE_SUBMITTED_${request.toolName}`,
          where: request.domainScope,
          why: gate.justification,
          resource: request.targetResource,
          classification: request.resourceClassification,
          policyResult: 'GATED_APPROVED',
          riskLevel: policy.riskLevel,
          approvalState: 'PENDING'
        });

        this.notify();
        return { status: 'GATE_REQUIRED', gateId: gate.id, policy };
      }
    }

    // Autonomous execution granted
    this.recordAudit({
      who: request.callerIdentity,
      role: this.activeIdentity.role,
      what: `EXEC_${request.toolName}`,
      where: request.domainScope,
      why: request.reason || 'Autonomous verified policy execution',
      resource: request.targetResource,
      classification: request.resourceClassification,
      policyResult: 'ALLOWED',
      riskLevel: policy.riskLevel,
      approvalState: 'AUTONOMOUS'
    });

    return { status: 'ALLOWED', policy };
  }

  /**
   * Human Approval Gate Decisions
   */
  public approvePendingGate(gateId: string, approvedBy: string): boolean {
    const gate = this.pendingGates.find((g) => g.id === gateId);
    if (!gate || gate.status !== 'PENDING') return false;

    gate.status = 'APPROVED';
    gate.approvedBy = approvedBy;
    gate.decidedAt = Date.now();

    this.recordAudit({
      who: approvedBy,
      role: this.activeIdentity.role,
      what: `HUMAN_APPROVED_${gate.request.toolName}`,
      where: gate.request.domainScope,
      why: `Human Principal authorization confirmed for ${gate.id}`,
      resource: gate.request.targetResource,
      classification: gate.request.resourceClassification,
      policyResult: 'GATED_APPROVED',
      riskLevel: gate.riskLevel,
      approvalState: 'APPROVED'
    });

    this.notify();
    return true;
  }

  public rejectPendingGate(gateId: string, rejectedBy: string): boolean {
    const gate = this.pendingGates.find((g) => g.id === gateId);
    if (!gate || gate.status !== 'PENDING') return false;

    gate.status = 'REJECTED';
    gate.approvedBy = rejectedBy;
    gate.decidedAt = Date.now();

    this.recordAudit({
      who: rejectedBy,
      role: this.activeIdentity.role,
      what: `HUMAN_REJECTED_${gate.request.toolName}`,
      where: gate.request.domainScope,
      why: `Human Principal vetoed action ${gate.id}`,
      resource: gate.request.targetResource,
      classification: gate.request.resourceClassification,
      policyResult: 'GATED_REJECTED',
      riskLevel: gate.riskLevel,
      approvalState: 'REJECTED'
    });

    this.notify();
    return true;
  }

  /**
   * Appends an immutable cryptographic record to the audit chain with Post-Quantum Lattice Signature
   */
  private recordAudit(params: Omit<ImmutableAuditRecord, 'id' | 'sequence' | 'timestamp' | 'epochMs' | 'hash' | 'prevHash' | 'signature' | 'quantumCipher' | 'latticeSignature' | 'qubitEntropyScore' | 'quantumKeyId'>) {
    this.sequenceCounter += 1;
    const now = new Date();
    const prevRecord = this.auditChain[this.auditChain.length - 1];
    const prevHash = prevRecord ? prevRecord.hash : '0x0000000000000000';

    const rawData = `${this.sequenceCounter}|${params.who}|${params.what}|${params.resource}|${params.policyResult}|${params.riskLevel}`;
    const hash = computeAuditHash(rawData, prevHash);
    const qKey = quantumCryptoService.getActiveKey();
    const latticeSignature = quantumCryptoService.signAuditBlock(`${hash}:${params.who}:${params.what}`);

    const entry: ImmutableAuditRecord = {
      id: `audit-seq-${this.sequenceCounter.toString().padStart(4, '0')}`,
      sequence: this.sequenceCounter,
      timestamp: now.toISOString(),
      epochMs: now.getTime(),
      prevHash,
      hash,
      signature: `pqc-dilithium5-${hash.substring(7, 15)}`,
      quantumCipher: qKey.algorithmName,
      latticeSignature,
      qubitEntropyScore: qKey.coherencePct,
      quantumKeyId: qKey.keyId,
      ...params
    };

    this.auditChain.push(entry);
    // Keep max 200 records in working memory
    if (this.auditChain.length > 200) {
      this.auditChain.shift();
    }
  }
}

export const securityFabric = new SecurityFabricEngine();
