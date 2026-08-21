export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'HIGHLY_RESTRICTED';

export type PrincipalRole = 'GOVERNMENT_ANALYST' | 'SOVEREIGN_ARCHITECT' | 'DEVELOPER' | 'AUDITOR' | 'VIEWER';

export type IdentityType = 'HUMAN' | 'AGENT' | 'SERVICE';

export interface SecurityIdentity {
  id: string; // e.g. principal.architect, agent.jarvis, service.camera_capture
  type: IdentityType;
  role: PrincipalRole;
  clearanceLevel: number; // 1 (Viewer) to 9 (Strategic Sovereign Command)
  tenant: string;
  allowedDomains: string[]; // e.g. ['uae.dubai', 'uae.abudhabi', 'archos.bim', 'experience.public']
  attributes: Record<string, any>;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ToolSecurityRequest {
  toolName: string;
  callerIdentity: string;
  targetResource: string;
  resourceClassification: DataClassification;
  domainScope: string;
  actionType: 'READ' | 'WRITE' | 'EXECUTE' | 'ADMIN' | 'DESTRUCTIVE';
  parameters?: Record<string, any>;
  reason?: string;
  requiresQuantumEncapsulation?: boolean;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  policyRule: string;
  riskLevel: RiskLevel;
  requiresHumanApproval: boolean;
  reason: string;
  evaluatedAt: number;
  quantumEnforced?: boolean;
  quantumCipher?: string;
}

export interface ImmutableAuditRecord {
  id: string;
  sequence: number;
  timestamp: string;
  epochMs: number;
  who: string; // identity id
  role: string;
  what: string; // action name
  where: string; // scope/domain
  why: string;
  resource: string;
  classification: DataClassification;
  policyResult: 'ALLOWED' | 'DENIED' | 'GATED_APPROVED' | 'GATED_REJECTED';
  riskLevel: RiskLevel;
  approvalState: 'AUTONOMOUS' | 'PENDING' | 'APPROVED' | 'REJECTED';
  hash: string;
  prevHash: string;
  signature: string;
  quantumCipher?: string;
  latticeSignature?: string;
  qubitEntropyScore?: number;
  quantumKeyId?: string;
}

export interface PendingApprovalGate {
  id: string;
  createdAt: number;
  request: ToolSecurityRequest;
  riskLevel: RiskLevel;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  decidedAt?: number;
}
