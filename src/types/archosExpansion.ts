import { SystemState } from './index';

// ============================================================================
// MODULE 1 · ArchOS Pulse — Building Vitality Index
// ============================================================================

export interface VitalityDimensionDetail {
  score: number; // 0 to 100
  weight: number; // e.g. 0.20
  status: 'OPTIMAL' | 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
  keyMetricLabel: string;
  keyMetricValue: string;
  delta30Days: number; // +/- change in 30 days
  diagnostics: string[];
}

export interface VitalitySensorReading {
  id: string;
  sensorType: 'STRAIN_GAUGE' | 'ACCELEROMETER' | 'CHILLER_DELTA_T' | 'AIRFLOW_CFM' | 'ELEVATOR_VIBRATION' | 'POWER_FACTOR';
  location: string;
  reading: string;
  driftPercentage: number; // % drift from baseline calibration
  status: 'CALIBRATED' | 'DRIFT_DETECTED' | 'ANOMALOUS';
  confidence: number;
}

export interface BuildingPulseRecord {
  id: string;
  name: string;
  arabicName: string;
  assetId: string;
  emirate: string;
  district: string;
  grossFloorAreaSqm: number;
  yearBuilt: number;
  overallPulseScore: number; // 0 to 100
  previousMonthScore: number;
  trendDelta: number; // e.g. -3 or +2
  vitalityTier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'AT_RISK';
  predictedRemainingLifeYears: number;
  degradationRatePerYear: number; // %
  tradeableAssetValueAed: number;
  dimensions: {
    structuralIntegrity: VitalityDimensionDetail & {
      sensorDriftAvg: number;
      structuralDriftMm: number;
      foundationStressMpa: number;
      resonanceFrequencyHz: number;
    };
    systemHealth: VitalityDimensionDetail & {
      hvacDriftPercent: number;
      mepEfficiencyRating: number;
      elevatorHoistWearPercent: number;
      chilledWaterDeltaTC: number;
    };
    energyPerformance: VitalityDimensionDetail & {
      vsDesignBaselinePercent: number;
      kwhPerSqmPerYear: number;
      peakDemandKw: number;
      solarSelfConsumptionPercent: number;
    };
    carbonPerformance: VitalityDimensionDetail & {
      vsCarbonBudgetPercent: number;
      operationalTco2ePerYear: number;
      embodiedCarbonSpentTonnes: number;
      creditsEarnedTonnes: number;
    };
    financialHealth: VitalityDimensionDetail & {
      opexMonthlyAed: number;
      maintenanceBacklogAed: number;
      roiYieldPercent: number;
      insurancePremiumScoreDiscountPercent: number;
    };
  };
  liveSensors: VitalitySensorReading[];
  jarvisVoiceNarrative: string;
  insuranceImpact: {
    baselineMarketPremiumAed: number;
    vitalityAdjustedPremiumAed: number;
    annualSavingsAed: number;
    underwriterRating: string;
  };
}

// ============================================================================
// MODULE 2 · ArchOS Carbon Ledger
// ============================================================================

export interface EmbodiedCarbonBreakdown {
  totalTonnes: number;
  concreteAndCementTonnes: number;
  structuralSteelTonnes: number;
  facadeAndGlazingTonnes: number;
  finishesAndMepTonnes: number;
  transportationTonnes: number;
  materialsCostAed: number;
}

export interface OperationalCarbonBreakdown {
  totalTonnesYtd: number;
  realTimeKgPerHour: number;
  gridElectricityTonnes: number;
  districtCoolingTonnes: number;
  waterDesalinationTonnes: number;
  wasteDisposalTonnes: number;
  cleanEnergyOffsetTonnes: number;
}

export interface CarbonBudgetTracker {
  totalLifetimeAllocatedTonnes: number;
  spentTonnes: number;
  remainingTonnes: number;
  percentSpent: number;
  annualBudgetTonnes: number;
  annualSpentTonnes: number;
  forecastExceedanceYear: number | null;
  complianceStatus: 'ON_TRACK' | 'EXCEEDING_BUDGET' | 'NET_NEGATIVE';
}

export interface TradeableCarbonCredit {
  id: string;
  creditBatchNumber: string;
  issuedTonnes: number;
  tradeableTonnes: number;
  unitPriceAed: number;
  totalValueAed: number;
  verificationStandard: 'GOLD_STANDARD' | 'VERRA_VCS' | 'UAE_NATIONAL_REGISTRY';
  issuanceDate: string;
  status: 'ACTIVE_LISTED' | 'TRADED' | 'RETIRED';
}

export interface OffsetRegistryItem {
  id: string;
  projectName: string;
  projectType: 'MANGROVE_BLUE_CARBON' | 'SOLAR_PARK_AL_DHAFRA' | 'DIRECT_AIR_CAPTURE' | 'HYDROGEN_STORAGE';
  location: string;
  tonnesOffset: number;
  costPerTonneAed: number;
  verificationHash: string;
  timestamp: string;
}

export interface CarbonLedgerRecord {
  buildingId: string;
  buildingName: string;
  emirate: string;
  embodied: EmbodiedCarbonBreakdown;
  operational: OperationalCarbonBreakdown;
  budget: CarbonBudgetTracker;
  tradeableCredits: TradeableCarbonCredit[];
  offsetRegistry: OffsetRegistryItem[];
  realTimeDesignDeltaCost: {
    decisionDescription: string;
    carbonSavingsTonnes: number;
    capexDeltaAed: number;
    paybackMonths: number;
  };
}

// ============================================================================
// MODULE 3 · ArchOS Marketplace
// ============================================================================

export type MarketplaceCategory =
  | 'INTELLIGENCE_PRODUCTS'
  | 'DESIGN_TEMPLATES'
  | 'SIMULATION_PACKAGES'
  | 'AGENT_MARKETPLACE'
  | 'DATA_PRODUCTS'
  | 'PROCUREMENT_NETWORK';

export interface MarketplaceProduct {
  id: string;
  title: string;
  category: MarketplaceCategory;
  provider: {
    name: string;
    organization: string;
    verified: boolean;
    rating: number;
    downloadsCount: number;
    badge: string;
  };
  priceAed: number;
  pricingModel: 'ONE_TIME' | 'PER_SQM' | 'MONTHLY_SAAS' | 'OUTCOME_REV_SHARE';
  summary: string;
  description: string;
  provenanceHash: string;
  capabilities: string[];
  samplePayloadPreview?: string;
  ratingScore: number;
  reviewsCount: number;
  tags: string[];
}

// ============================================================================
// MODULE 4 · ArchOS Academy & Certification
// ============================================================================

export interface AcademyModule {
  id: string;
  title: string;
  level: 'FOUNDATION' | 'PRACTITIONER' | 'SOVEREIGN_ARCHITECT' | 'DOMAIN_AGENT_DEV';
  description: string;
  durationHours: number;
  curriculum: string[];
  enrolledPractitioners: number;
  examPassingScore: number;
  certificationCredential: string;
  institutionalMemoryCapture: string;
}

// ============================================================================
// MODULE 5 · ArchOS Finance & Underwriting
// ============================================================================

export interface FinanceUnderwritingModel {
  assetId: string;
  assetName: string;
  grossDevelopmentValueAed: number;
  totalConstructionCostAed: number;
  projectedIrrPercent: number;
  equityMultiple: number;
  loanToCostPercent: number;
  paybackPeriodYears: number;
  sensitivityMatrix: Array<{
    occupancyRate: number;
    rentalYieldPercent: number;
    resultingIrrPercent: number;
    vitalityAdjustedValuationAed: number;
  }>;
  insuranceUnderwriting: {
    standardMarketPremiumAed: number;
    vitalityScoreDiscountAed: number;
    netAnnualPremiumAed: number;
    vitalityDiscountPercent: number;
    underwriterPool: string[];
    riskRating: 'AAA' | 'AA+' | 'A' | 'BBB';
    claimsLikelihoodReductionPercent: number;
  };
}

// ============================================================================
// MODULE 6 · ArchOS Legacy — Retrofit Intelligence
// ============================================================================

export interface RetrofitOpportunity {
  id: string;
  title: string;
  category: 'ENVELOPE_SMART_GLAZING' | 'CHILLER_PLANT_MODERNIZATION' | 'SOLAR_BIPV_FACADE' | 'AI_DYNAMIC_AIRFLOW' | 'REGENERATIVE_LIFT_DRIVES';
  capexAed: number;
  annualOpexSavedAed: number;
  co2ReductionTonnesPerYear: number;
  vitalityPointsGain: number;
  paybackPeriodMonths: number;
  tenancyDisruptionLevel: 'ZERO_DISRUPTION' | 'MINIMAL_NIGHT_WORK' | 'MODERATE';
}

export interface RetrofitSimulationCase {
  assetId: string;
  assetName: string;
  scanResolutionMm: number;
  pointCloudCountMillions: number;
  originalYearBuilt: number;
  beforeRetrofit: {
    pulseScore: number;
    annualEnergyMwh: number;
    annualCarbonTonnes: number;
    annualOpexAed: number;
    assetValuationAed: number;
  };
  afterRetrofit: {
    pulseScore: number;
    annualEnergyMwh: number;
    annualCarbonTonnes: number;
    annualOpexAed: number;
    assetValuationAed: number;
  };
  netAssetAppreciationAed: number;
  totalRetrofitCapexAed: number;
  retrofitOpportunities: RetrofitOpportunity[];
}

// ============================================================================
// MODULE 7 · ArchOS Procurement Network
// ============================================================================

export interface ProcurementMaterialItem {
  id: string;
  name: string;
  supplier: string;
  location: string;
  embodiedCarbonKgPerUnit: number;
  unit: string;
  unitPriceAed: number;
  leadTimeDays: number;
  inventoryStatus: 'IN_STOCK_LOCAL' | 'TRANSIT_JEBEL_ALI' | 'CUSTOM_FABRICATION';
  environmentalProductDeclarationUrl: string;
  circularRecycledContentPercent: number;
}

// ============================================================================
// MODULE 8 · ArchOS Simulation Marketplace
// ============================================================================

export interface SimulationPackageItem {
  id: string;
  name: string;
  type: 'EXTREME_CLIMATE_HEATWAVE' | 'FLASH_FLOOD_HYDROLOGY' | 'PORT_CONTAINER_CONGESTION' | 'GRID_BLACK_START' | 'URBAN_AIR_MOBILITY_CORRIDOR';
  resolution: 'PHYSICS_FEM_CFD' | 'AGENT_BASED_MICRO' | 'MACRO_REGIONAL';
  computeTimeSec: number;
  priceAed: number;
  accuracyConfidence: number;
  description: string;
}

// ============================================================================
// Multi-Agent Trade-off Negotiation Types
// ============================================================================

export interface MultiAgentNegotiation {
  id: string;
  title: string;
  targetAsset: string;
  agents: {
    structural: {
      name: string;
      role: 'STRUCTURAL_RESILIENCE';
      priority: string;
      idealProposal: string;
      weight: number;
    };
    cost: {
      name: string;
      role: 'FINANCIAL_OPTIMIZATION';
      priority: string;
      idealProposal: string;
      weight: number;
    };
    carbon: {
      name: string;
      role: 'CARBON_NET_ZERO';
      priority: string;
      idealProposal: string;
      weight: number;
    };
  };
  negotiatedConsensus: {
    compromiseSolution: string;
    structuralSafetyFactor: number; // e.g. 2.15x
    capexDeltaAed: number; // e.g. -4.8M AED
    carbonReductionTonnes: number; // e.g. -1,240 Tonnes
    paretoOptimalityScore: number; // 0.0 to 1.0 (e.g. 0.94)
    status: 'ACTIVE_CONVERGING' | 'CONSENSUS_REACHED' | 'AWAITING_VERIFICATION';
  };
}

// ============================================================================
// 6 Business Models Matrix Specification
// ============================================================================

export interface BusinessModelSpec {
  id: 'IAAS' | 'OUTCOME_BASED' | 'MARKETPLACE_REV' | 'INSURANCE_PARTNERSHIPS' | 'SOVEREIGN_LICENSING' | 'CERTIFICATION_REVENUE';
  title: string;
  tagline: string;
  pricingMechanic: string;
  projectedAnnualRevenueAed: string;
  keyMetrics: { label: string; value: string }[];
  description: string;
  strategicAdvantage: string;
  tierStructure: Array<{
    tierName: string;
    targetSegment: string;
    rate: string;
    sla: string;
  }>;
}
