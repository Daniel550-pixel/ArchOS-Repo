import { BuildingPulseRecord, CarbonLedgerRecord, MultiAgentNegotiation } from '../../types/archosExpansion';
import { UAE_PULSE_BUILDINGS } from '../../data/archosPulseData';
import { UAE_CARBON_LEDGERS } from '../../data/archosCarbonLedgerData';
import { ACTIVE_MULTI_AGENT_NEGOTIATION } from '../../data/archosMarketplaceData';

export class PulseEngineService {
  private buildings: Map<string, BuildingPulseRecord> = new Map();
  private carbonLedgers: Map<string, CarbonLedgerRecord> = new Map();
  private activeNegotiation: MultiAgentNegotiation = { ...ACTIVE_MULTI_AGENT_NEGOTIATION };
  private listeners: Set<() => void> = new Set();

  constructor() {
    UAE_PULSE_BUILDINGS.forEach((b) => this.buildings.set(b.id, JSON.parse(JSON.stringify(b))));
    Object.entries(UAE_CARBON_LEDGERS).forEach(([k, v]) => this.carbonLedgers.set(k, JSON.parse(JSON.stringify(v))));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  public getAllBuildings(): BuildingPulseRecord[] {
    return Array.from(this.buildings.values());
  }

  public getBuilding(id: string): BuildingPulseRecord | undefined {
    return this.buildings.get(id);
  }

  public getCarbonLedger(id: string): CarbonLedgerRecord | undefined {
    return this.carbonLedgers.get(id);
  }

  public getActiveNegotiation(): MultiAgentNegotiation {
    return this.activeNegotiation;
  }

  /**
   * Recalibrate sensor & recover vitality score
   */
  public recalibrateSensor(buildingId: string, sensorId: string): { success: boolean; recoveredPoints: number; message: string } {
    const building = this.buildings.get(buildingId);
    if (!building) return { success: false, recoveredPoints: 0, message: 'Building not found' };

    const sensor = building.liveSensors.find((s) => s.id === sensorId);
    if (!sensor) return { success: false, recoveredPoints: 0, message: 'Sensor not found' };

    // Reset sensor drift
    const priorDrift = sensor.driftPercentage;
    sensor.driftPercentage = 0.05;
    sensor.status = 'CALIBRATED';
    if (sensor.sensorType === 'CHILLER_DELTA_T') {
      sensor.reading = '6.4 °C ΔT (Optimal)';
      building.dimensions.systemHealth.hvacDriftPercent = 1.2;
      building.dimensions.systemHealth.chilledWaterDeltaTC = 6.4;
      building.dimensions.systemHealth.status = 'OPTIMAL';
      building.dimensions.systemHealth.score = Math.min(98, building.dimensions.systemHealth.score + 18);
    } else if (sensor.sensorType === 'AIRFLOW_CFM') {
      sensor.reading = '3,200 CFM (Nominal)';
      building.dimensions.systemHealth.score = Math.min(98, building.dimensions.systemHealth.score + 6);
    } else if (sensor.sensorType === 'ELEVATOR_VIBRATION') {
      sensor.reading = '0.18 mm/s RMS (Smooth)';
      sensor.status = 'CALIBRATED';
      building.dimensions.systemHealth.elevatorHoistWearPercent = 6.0;
      building.dimensions.systemHealth.score = Math.min(98, building.dimensions.systemHealth.score + 10);
    }

    // Recalculate overall pulse score
    this.recalculateBuildingScore(building);
    this.notify();

    return {
      success: true,
      recoveredPoints: 3,
      message: `Sensor [${sensor.id}] recalibrated. HVAC thermal loop restored to optimal baseline.`
    };
  }

  /**
   * Execute full AI-driven building optimization
   */
  public executeFullBuildingOptimization(buildingId: string): { priorScore: number; newScore: number; narrative: string } {
    const building = this.buildings.get(buildingId);
    if (!building) return { priorScore: 0, newScore: 0, narrative: '' };

    const priorScore = building.overallPulseScore;

    // Fix all sensors
    building.liveSensors.forEach((s) => {
      s.driftPercentage = 0.02;
      s.status = 'CALIBRATED';
      if (s.sensorType === 'CHILLER_DELTA_T') s.reading = '6.8 °C ΔT';
      if (s.sensorType === 'AIRFLOW_CFM') s.reading = '3,240 CFM (Calibrated)';
      if (s.sensorType === 'ELEVATOR_VIBRATION') s.reading = '0.12 mm/s';
    });

    // Elevate all dimensions
    building.dimensions.structuralIntegrity.score = 98;
    building.dimensions.structuralIntegrity.status = 'OPTIMAL';
    building.dimensions.systemHealth.score = 96;
    building.dimensions.systemHealth.status = 'OPTIMAL';
    building.dimensions.systemHealth.hvacDriftPercent = 0.8;
    building.dimensions.energyPerformance.score = 94;
    building.dimensions.energyPerformance.status = 'OPTIMAL';
    building.dimensions.carbonPerformance.score = 96;
    building.dimensions.carbonPerformance.status = 'OPTIMAL';
    building.dimensions.financialHealth.score = 95;
    building.dimensions.financialHealth.status = 'OPTIMAL';

    this.recalculateBuildingScore(building);

    building.jarvisVoiceNarrative = `Building optimization protocol executed successfully. All HVAC chillers, VAV dampers, and structural outrigger strain sensors have been synchronized with the UAE World Model baseline. Vitality score restored to ${building.overallPulseScore} Platinum tier, delivering 231,250 AED in annualized insurance premium discounts.`;

    this.notify();

    return {
      priorScore,
      newScore: building.overallPulseScore,
      narrative: building.jarvisVoiceNarrative
    };
  }

  /**
   * Trade or Retire Carbon Credits
   */
  public tradeCarbonCredit(buildingId: string, creditId: string, action: 'TRADE' | 'RETIRE'): { success: boolean; message: string } {
    const ledger = this.carbonLedgers.get(buildingId);
    if (!ledger) return { success: false, message: 'Ledger not found' };

    const credit = ledger.tradeableCredits.find((c) => c.id === creditId);
    if (!credit) return { success: false, message: 'Credit batch not found' };

    if (action === 'TRADE') {
      credit.status = 'TRADED';
      const revenue = credit.totalValueAed;
      this.notify();
      return { success: true, message: `Successfully cleared ${credit.issuedTonnes} tCO₂e on Abu Dhabi Carbon Exchange for ${revenue.toLocaleString()} AED.` };
    } else {
      credit.status = 'RETIRED';
      this.notify();
      return { success: true, message: `Retired ${credit.issuedTonnes} tCO₂e permanently towards UAE Sovereign Net-Zero 2050 target.` };
    }
  }

  /**
   * Adjust Multi-Agent Trade-Off Priorities
   */
  public adjustNegotiationWeights(weights: { structural: number; cost: number; carbon: number }): MultiAgentNegotiation {
    this.activeNegotiation.agents.structural.weight = weights.structural;
    this.activeNegotiation.agents.cost.weight = weights.cost;
    this.activeNegotiation.agents.carbon.weight = weights.carbon;

    // Recompute Pareto frontier
    const structuralCoeff = weights.structural * 2.5;
    const costSavingsAed = (weights.cost * 12.0 - weights.structural * 4.0 - weights.carbon * 3.0) * 1000000;
    const carbonCutTonnes = Math.round(weights.carbon * 2400 + weights.structural * 200);

    this.activeNegotiation.negotiatedConsensus = {
      compromiseSolution: `Dynamic Multi-Agent Consensus: Structural resilience factor tuned to ${structuralCoeff.toFixed(2)}x, balancing budget delta (${(costSavingsAed / 1000000).toFixed(1)}M AED) and carbon footprint (-${carbonCutTonnes.toLocaleString()} tCO₂e).`,
      structuralSafetyFactor: Number(structuralCoeff.toFixed(2)),
      capexDeltaAed: Math.round(costSavingsAed),
      carbonReductionTonnes: carbonCutTonnes,
      paretoOptimalityScore: 0.96,
      status: 'CONSENSUS_REACHED'
    };

    this.notify();
    return this.activeNegotiation;
  }

  private recalculateBuildingScore(building: BuildingPulseRecord): void {
    const d = building.dimensions;
    const weightedScore =
      d.structuralIntegrity.score * d.structuralIntegrity.weight +
      d.systemHealth.score * d.systemHealth.weight +
      d.energyPerformance.score * d.energyPerformance.weight +
      d.carbonPerformance.score * d.carbonPerformance.weight +
      d.financialHealth.score * d.financialHealth.weight;

    building.overallPulseScore = Math.round(weightedScore);
    building.trendDelta = building.overallPulseScore - building.previousMonthScore;

    if (building.overallPulseScore >= 90) {
      building.vitalityTier = 'PLATINUM';
      building.insuranceImpact.underwriterRating = 'AAA';
      building.insuranceImpact.annualSavingsAed = Math.round(building.insuranceImpact.baselineMarketPremiumAed * 0.22);
    } else if (building.overallPulseScore >= 80) {
      building.vitalityTier = 'GOLD';
      building.insuranceImpact.underwriterRating = 'AA+';
      building.insuranceImpact.annualSavingsAed = Math.round(building.insuranceImpact.baselineMarketPremiumAed * 0.125);
    } else if (building.overallPulseScore >= 70) {
      building.vitalityTier = 'SILVER';
      building.insuranceImpact.underwriterRating = 'A';
      building.insuranceImpact.annualSavingsAed = Math.round(building.insuranceImpact.baselineMarketPremiumAed * 0.05);
    } else {
      building.vitalityTier = 'AT_RISK';
      building.insuranceImpact.underwriterRating = 'BBB';
      building.insuranceImpact.annualSavingsAed = 0;
    }

    building.insuranceImpact.vitalityAdjustedPremiumAed =
      building.insuranceImpact.baselineMarketPremiumAed - building.insuranceImpact.annualSavingsAed;
  }
}

export const pulseEngine = new PulseEngineService();
