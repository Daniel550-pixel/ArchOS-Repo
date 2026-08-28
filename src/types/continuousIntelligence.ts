// ArchOS UAE Continuous Intelligence Event Schema & Ingestion Types
// Operational data structures for the 24/7 continuous intelligence stream

export type IngestionSource =
  | 'RTA'
  | 'DEWA'
  | 'ENEC'
  | 'DP_WORLD'
  | 'ADNOC'
  | 'MASDAR'
  | 'AD_PORTS'
  | 'ETIHAD_RAIL'
  | 'UAE_GOV_PORTAL'
  | 'DCAA'
  | 'WAM_NEWS'
  | 'MINISTRY_INFRA'
  | 'MUNICIPALITY_GIS'
  | 'SATELLITE_RADAR'
  | 'DUBAI_CIVIL_AVIATION'
  | 'SHARJAH_MUNICIPALITY';

export type IntelligenceDomain =
  | 'INFRASTRUCTURE'
  | 'ENERGY'
  | 'LOGISTICS'
  | 'MOBILITY'
  | 'FINANCE'
  | 'REAL_ESTATE'
  | 'ENVIRONMENT'
  | 'TECHNOLOGY'
  | 'GOVERNANCE';

export type EventVerificationState =
  | 'INGESTED'
  | 'PROCESSING'
  | 'CORRELATED'
  | 'UNVERIFIED'
  | 'CONFLICTING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'UPDATED'
  | 'ESCALATED'
  | 'RESOLVED';

export type TemporalWindow =
  | 'LIVE'
  | 'MINUS_1_HOUR'
  | 'MINUS_6_HOURS'
  | 'MINUS_24_HOURS'
  | 'MINUS_7_DAYS'
  | 'SINCE_LAST_SESSION';

export interface EventSourceReference {
  name: string;
  sourceType: IngestionSource;
  reliabilityScore: number; // 0.0 to 1.0
  timestamp: string;
  url?: string;
  excerpt?: string;
}

export interface EventConflictMetadata {
  detected: boolean;
  discrepancySummary: string;
  sourceA: { source: string; claim: string };
  sourceB: { source: string; claim: string };
  sourceC?: { source: string; claim: string };
  currentProbability: number;
  resolutionStatus: 'PENDING' | 'ESCALATED' | 'RESOLVED';
}

export interface EventVerificationProof {
  invariantsPassed: number;
  totalInvariants: number;
  independentSourcesCount: number;
  merkleProofSha256: string;
  corroborationNote: string;
  verifiedAt: string;
}

export interface AgentAnalysisNote {
  agentId: string;
  agentName: string;
  role: string;
  synthesis: string;
  confidenceContribution: number;
}

export interface UAEIntelligenceEvent {
  id: string;
  timestamp: string;
  timeFormatted: string; // "14:32:08"
  relativeTime: string; // "Just now", "4m ago"
  epochMs: number;
  emirate: 'Dubai' | 'Abu Dhabi' | 'Sharjah' | 'Ajman' | 'Ras Al Khaimah' | 'Fujairah' | 'Umm Al Quwain';
  district: string;
  coordinates: [number, number, number]; // 3D world coords [x, y, z]
  geoLatLng: [number, number]; // [lat, lng]
  domain: IntelligenceDomain;
  entityId: string;
  entityName: string;
  arabicEntityName?: string;
  headline: string;
  summary: string;
  changeType:
    | 'EXPANSION'
    | 'GRID_SURGE'
    | 'POLICY_UPDATE'
    | 'INFRASTRUCTURE_DELTA'
    | 'ANOMALY_RESOLVED'
    | 'CAPACITY_SHIFT'
    | 'TRADE_REROUTE'
    | 'ENVIRONMENTAL_SHIFT';
  confidence: number; // e.g. 94.8
  sourceCount: number;
  sources: EventSourceReference[];
  verificationState: EventVerificationState;
  verificationProof?: EventVerificationProof;
  conflicts?: EventConflictMetadata;
  worldModelUpdated: boolean;
  worldModelDelta?: string;
  relatedEventIds: string[];
  agentAnalysis?: AgentAnalysisNote;
  isHighImpact?: boolean;
}

export interface ContinuousIngestionStats {
  status: 'OPERATIONAL' | 'UPDATING' | 'DEGRADED';
  lastUpdateFormatted: string;
  eventsIngestedTotal: number;
  activeSourcesCount: number;
  activeAgentsCount: number;
  verifiedRatePercent: number;
  conflictsActiveCount: number;
  worldModelSyncStatus: 'SYNCHRONIZED' | 'UPDATING' | 'DEGRADED';
}

export interface SinceLastSessionReport {
  lastSessionTimestamp: string;
  significantDevelopmentsCount: number;
  verifiedCount: number;
  highImpactCount: number;
  unresolvedConflictsCount: number;
  escalatedCount: number;
  topSummary: string;
}
