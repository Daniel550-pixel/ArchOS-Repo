export type RealityState = 'OBSERVED' | 'INFERRED' | 'PREDICTED' | 'SIMULATED';
export type Scale =
  | 'UAE'
  | 'EMIRATE'
  | 'CITY'
  | 'DISTRICT'
  | 'DEVELOPMENT'
  | 'SITE'
  | 'PARCEL'
  | 'BUILDING'
  | 'FLOOR'
  | 'SPACE'
  | 'SYSTEM'
  | 'COMPONENT';

export interface WorldEntity {
  id: string;
  scale: Scale;
  type: string;
  geometry?: any;
  attributes: Record<string, unknown>;
  state: { current: Record<string, unknown>; predicted?: Record<string, unknown> };
  provenance: string;
  confidence: number;
  reality: RealityState;
  tenant_id: string;
}

export interface Observation {
  id: string;
  entity_id: string;
  source: string;
  reality: RealityState;
  raw: unknown;
  pipeline_state: 'RAW' | 'PROCESSING' | 'VERIFIED' | 'INGESTED' | 'REJECTED';
  confidence: number;
  ts: string;
}

export interface ConstraintCheck {
  agent: string;
  rule: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  confidence: number;
  evidence: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SimulationResult {
  scenario_id: string;
  overall: 'PASS' | 'WARNING' | 'FAIL';
  checks: ConstraintCheck[];
  cost_delta: number;
  energy_impact: number;
  ms: number;
}

export interface TelemetrySample {
  ts: number;
  [channel: string]: number;
}

export const LIFECYCLE = [
  'IMAGINE',
  'DISCOVER',
  'DESIGN',
  'PROVE',
  'BUILD',
  'LIVE',
  'OBSERVE'
] as const;

export type LifecycleStage = typeof LIFECYCLE[number];
