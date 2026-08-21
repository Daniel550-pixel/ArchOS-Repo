export type SystemState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'NAVIGATING'
  | 'VISUALIZING'
  | 'ANALYZING'
  | 'SIMULATING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'WARNING'
  | 'ERROR'
  | 'OFFLINE';

export type IntelligenceTag = 'FACT' | 'ANALYSIS' | 'PREDICTION' | 'SIMULATION' | 'ASSUMPTION';

export interface IntelligenceItem {
  id: string;
  title: string;
  summary: string;
  fullAnalysis?: string;
  category:
    | 'government'
    | 'economy'
    | 'infrastructure'
    | 'transportation'
    | 'real estate'
    | 'logistics'
    | 'energy'
    | 'environment'
    | 'technology'
    | 'finance'
    | 'geopolitics';
  location: string;
  coordinates?: [number, number]; // [lat, lng]
  timestamp: string;
  confidence: number; // 0.0 to 1.0
  source: string;
  provenance: string;
  tag: IntelligenceTag;
  impactScore: number; // 1 to 10
  entities: string[];
  relatedCityId?: string;
  relatedDomainId?: string;
  actionableRecommendation?: string;
}

export interface DailyBriefing {
  id: string;
  date: string;
  greeting: string;
  summaryHeadline: string;
  uaeItems: IntelligenceItem[];
  regionalItems: IntelligenceItem[];
  globalItems: IntelligenceItem[];
  uaeImpactHighlights: string[];
  visualPriorities: {
    cityId: string;
    domainId?: string;
    assetId?: string;
    reason: string;
  }[];
  isAudioDelivered: boolean;
}

export interface SpatialLayer {
  id: string;
  index: string;
  name: string;
  description: string;
  material: string;
  relativeDepth: number; // 0.0 to 1.0
  offsetAxis?: 'x' | 'y' | 'z';
  colorHex?: string;
  specs?: Record<string, string>;
}

export interface SpatialAsset {
  id: string;
  name: string;
  arabicName?: string;
  type: 'building' | 'port' | 'energy' | 'transit' | 'district' | 'experience' | 'model';
  cityId: string;
  districtName?: string;
  description: string;
  specs: { label: string; value: string }[];
  layers: SpatialLayer[];
  videoSrc?: string;
  isPreRendered?: boolean;
  simulationScenarios?: {
    id: string;
    title: string;
    description: string;
    baselineState: string;
    projectedState: string;
    deltaMetrics: { metric: string; before: string; after: string; delta: string }[];
  }[];
  metadata?: Record<string, any>;
}

export interface CityDomain {
  id: string;
  name: string;
  iconName: string;
  summary: string;
  kpis: { label: string; value: string; trend?: string }[];
  assets: SpatialAsset[];
  activeProjectsCount: number;
  readinessScore: number;
}

export interface CityNode {
  id: string;
  name: string;
  arabicName: string;
  tagline: string;
  description: string;
  coordinates: [number, number]; // Lat, Lng
  branchAngle: number; // Radial angle in 3D scene (radians)
  colorHex: string;
  metrics: {
    population: string;
    gdpContribution: string;
    infrastructureScore: string;
    cleanEnergyShare: string;
  };
  domains: CityDomain[];
  assets: SpatialAsset[];
}

export interface ContextStackItem {
  level: 'UAE' | 'EMIRATE' | 'DOMAIN' | 'ASSET' | 'LAYER' | 'SIMULATION' | 'EXPERIENCE';
  id: string;
  title: string;
  subtitle?: string;
  data?: any;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export type GestureType =
  | 'OPEN_PALM'
  | 'PINCH'
  | 'PINCH_IN'
  | 'PINCH_OUT'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'POINT'
  | 'FIST'
  | 'IDLE';

export interface HandGestureState {
  isCameraActive: boolean;
  handDetected: boolean;
  isOpenPalm: boolean;
  palmHoldProgress: number; // 0.0 to 1.0 (reaches 1.0 after 450ms hold)
  isPinching: boolean;
  rawPinchDistance: number;
  normalizedDistance: number;
  smoothedProgress: number; // 0.0 (Assembled/Baseline) to 1.0 (Exploded/Decomposed)
  landmarks: LandmarkPoint[] | null;
  handedness: 'left' | 'right' | 'unknown';
  currentGesture: GestureType;
  fps: number;
  error: string | null;
  debugSkeleton: boolean;
}

export type CommandSource = 'voice' | 'gesture' | 'mouse' | 'keyboard' | 'touch' | 'system' | 'api';

export type UnifiedCommand =
  | { type: 'NAVIGATE_TO_UAE' }
  | { type: 'NAVIGATE'; payload: { view: string } }
  | { type: 'TOGGLE_TELEMETRY'; payload?: { on: boolean } }
  | { type: 'SELECT_CITY'; payload: { cityId: string } }
  | { type: 'SELECT_DOMAIN'; payload: { domainId: string } }
  | { type: 'SELECT_ASSET'; payload: { assetId: string } }
  | { type: 'SELECT_EXPERIENCE'; payload: { id?: string; experienceId?: string } }
  | { type: 'OPEN_EXPERIENCE'; payload?: { id: string } }
  | { type: 'CLOSE_EXPERIENCE' }
  | { type: 'NEXT_EXPERIENCE' }
  | { type: 'PREV_EXPERIENCE' }
  | { type: 'POP_CONTEXT' }
  | { type: 'RESET_EXPERIENCE' }
  | { type: 'RESET_CONTEXT' }
  | { type: 'SET_PROGRESS'; payload: { value: number } } // 0.0 to 1.0 universal spatial continuous signal
  | { type: 'SCRUB_TIMELINE'; payload: { targetSec: number } }
  | { type: 'RESET_TIMELINE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_VOLUME'; payload: { volume: number } }
  | { type: 'ENABLE_GESTURES' }
  | { type: 'DISABLE_GESTURES' }
  | { type: 'TOGGLE_GESTURES' }
  | { type: 'ANALYZE_CURRENT_CONTEXT' }
  | { type: 'SIMULATE_CURRENT_CONTEXT'; payload?: { scenarioId?: string } }
  | { type: 'PLAN_CURRENT_CONTEXT' }
  | { type: 'REQUEST_EXECUTION'; payload: { title: string; domain: string; intent: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } }
  | { type: 'APPROVE_EXECUTION'; payload: { executionId: string } }
  | { type: 'CANCEL_EXECUTION'; payload: { executionId: string } }
  | { type: 'REQUEST_DAILY_BRIEFING' }
  | { type: 'SPEAK_MESSAGE'; payload: { message: string; stateOverride?: SystemState } }
  | { type: 'STOP_SPEAKING' }
  | { type: 'START_LISTENING' }
  | { type: 'STOP_LISTENING' }
  | { type: 'ENABLE_VISION' }
  | { type: 'DISABLE_VISION' }
  | { type: 'TOGGLE_DEBUG_SKELETON' }
  | { type: 'SET_SYSTEM_STATE'; payload: { state: SystemState } }
  // ULTRON Gesture Dictionary Commands
  | { type: 'HOVER'; target: string; source?: CommandSource; payload?: { target: string; point?: [number, number, number]; distance?: number } }
  | { type: 'HOVER_END'; source?: CommandSource; payload?: { previousTarget?: string } }
  | { type: 'SELECT'; target: string; source?: CommandSource; payload?: { target: string } }
  | { type: 'SECONDARY_SELECT'; target: string; source?: CommandSource; payload?: { target: string } }
  | { type: 'GRAB'; target: string; source?: CommandSource; payload?: { target: string } }
  | { type: 'RELEASE'; target: string; source?: CommandSource; payload?: { target: string } }
  | { type: 'PAN'; delta?: { x: number; y: number }; source?: CommandSource; payload?: { delta: { x: number; y: number } } }
  | { type: 'SUMMON_MENU'; source?: CommandSource }
  | { type: 'DISMISS'; target?: string; source?: CommandSource; payload?: { target?: string } }
  | { type: 'SCROLL'; delta?: number; source?: CommandSource; payload?: { delta: number } };

export type ExperienceCommand = UnifiedCommand;

export interface CommandLogEntry {
  id: string;
  timestamp: number;
  source: CommandSource;
  command: UnifiedCommand;
  rawText?: string;
}

export interface GovernedExecutionItem {
  id: string;
  timestamp: number;
  title: string;
  domain: string;
  intent: string;
  policyStatus: 'PASSED' | 'FLAGGED' | 'VIOLATION';
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'VERIFIED' | 'REJECTED';
  verificationHash?: string;
  logs: string[];
}

export interface VoiceSynthesizerState {
  isSpeaking: boolean;
  currentUtterance: string | null;
  audioLevel: number; // 0.0 to 1.0 (for reactive orb pulse)
  voiceSupported: boolean;
}

export interface ExperienceCard {
  id: string;
  index: string;
  title: string;
  subtitle?: string;
  tagline: string;
  category: string;
  classification: string;
  description?: string;
  summary?: string;
  videoSrc: string;
  posterFrame?: string;
  prompt: string;
  durationSeconds?: number;
  accentColor?: string;
  specs: { label: string; value: string }[];
  layers: SpatialLayer[];
  metadata?: Record<string, any>;
}

export type PersonalityArchetype =
  | 'EXECUTIVE_CONSUL'
  | 'STRATEGIC_ARCHITECT'
  | 'TACTICAL_SENTINEL'
  | 'ROYAL_CONCIERGE';

export interface PersonalityTraits {
  formality: number; // 0.0 to 1.0 (casual -> diplomatic & stately)
  warmth: number; // 0.0 to 1.0 (detached -> empathetic & personal)
  brevity: number; // 0.0 to 1.0 (elaborate -> laconic/concise)
  subtleWit: number; // 0.0 to 1.0 (purely factual -> refined British poise)
}

export interface PersonalityConfig {
  archetype: PersonalityArchetype;
  traits: PersonalityTraits;
  preferredTone: 'RESONANT_WARM' | 'CRISP_AUTHORITATIVE' | 'ANALYTICAL_CALM';
}

export type TelemetryAlertType =
  | 'ECONOMIC_SPIKE'
  | 'RISK_THRESHOLD'
  | 'INFRASTRUCTURE_MILESTONE'
  | 'SPATIAL_ANOMALY';

export type AlertSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface TelemetryAlert {
  id: string;
  type: TelemetryAlertType;
  title: string;
  summary: string;
  metric: string;
  severity: AlertSeverity;
  location: string;
  timestamp: string;
  confidence: number;
  entity: string;
  actionTarget?: {
    tab: 'orb' | 'world' | 'intelligence' | 'experience';
    entityId?: string;
  };
  autoDismissMs?: number;
}

export * from './archosExpansion';


