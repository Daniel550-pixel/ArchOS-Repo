export type VerificationStatus = 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';

export interface ConstraintCheck {
  id: string;
  agent: string; // e.g., 'Compliance Agent', 'Structural Agent'
  rule: string;
  status: VerificationStatus;
  confidence: number;
  evidence: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SimulationScenario {
  id: string;
  name: string;
  parameters: Record<string, any>; // e.g., { heightDelta: 10, facadeMaterial: 'glass' }
  createdAt: string;
}

export interface SimulationResult {
  scenarioId: string;
  overallStatus: VerificationStatus;
  checks: ConstraintCheck[];
  estimatedCostDelta: number;
  energyImpact: number;
  executionTimeMs: number;
}
