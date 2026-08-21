import React, { useState, useEffect } from 'react';
import {
  Activity,
  Flame,
  Shield,
  Zap,
  TrendingDown,
  TrendingUp,
  Volume2,
  RefreshCw,
  Sliders,
  DollarSign,
  Leaf,
  Layers,
  Award,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { pulseEngine } from '../../services/archos/pulseEngine';
import { speechService } from '../../services/voice/speechService';
import { BuildingPulseRecord, CarbonLedgerRecord, MultiAgentNegotiation } from '../../types/archosExpansion';
import { LiveTelemetry } from '../live/LiveTelemetry';
import { Radio } from 'lucide-react';

interface PulseVitalityViewProps {
  onSpeak?: (text: string) => void;
}

export const PulseVitalityView: React.FC<PulseVitalityViewProps> = ({ onSpeak }) => {
  const [buildings, setBuildings] = useState<BuildingPulseRecord[]>(pulseEngine.getAllBuildings());
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('tower-b4471');
  const [activeSubTab, setActiveSubTab] = useState<'VITALITY' | 'CARBON_LEDGER' | 'MULTI_AGENT' | 'INSURANCE' | 'REAL_MQTT_TELEMETRY'>('VITALITY');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationToast, setOptimizationToast] = useState<string | null>(null);

  // Multi-agent weights
  const [agentWeights, setAgentWeights] = useState({ structural: 0.35, cost: 0.35, carbon: 0.3 });
  const [negotiation, setNegotiation] = useState<MultiAgentNegotiation>(pulseEngine.getActiveNegotiation());

  useEffect(() => {
    const unsub = pulseEngine.subscribe(() => {
      setBuildings([...pulseEngine.getAllBuildings()]);
      setNegotiation({ ...pulseEngine.getActiveNegotiation() });
    });
    return unsub;
  }, []);

  const activeBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];
  const carbonLedger: CarbonLedgerRecord | undefined = pulseEngine.getCarbonLedger(selectedBuildingId);

  const handleSpeakNarrative = () => {
    if (activeBuilding?.jarvisVoiceNarrative) {
      if (onSpeak) {
        onSpeak(activeBuilding.jarvisVoiceNarrative);
      } else {
        speechService.speak(activeBuilding.jarvisVoiceNarrative);
      }
    }
  };

  const handleRecalibrate = (sensorId: string) => {
    const res = pulseEngine.recalibrateSensor(activeBuilding.id, sensorId);
    setOptimizationToast(res.message);
    setTimeout(() => setOptimizationToast(null), 4500);
  };

  const handleFullOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const res = pulseEngine.executeFullBuildingOptimization(activeBuilding.id);
      setIsOptimizing(false);
      setOptimizationToast(`Optimization Complete: Vitality Score elevated to ${res.newScore}/100 (+${res.newScore - res.priorScore} pts).`);
      if (onSpeak) {
        onSpeak(res.narrative);
      } else {
        speechService.speak(res.narrative);
      }
      setTimeout(() => setOptimizationToast(null), 5000);
    }, 1200);
  };

  const handleWeightChange = (key: 'structural' | 'cost' | 'carbon', val: number) => {
    const nextWeights = { ...agentWeights, [key]: val };
    // Normalize sum
    const total = nextWeights.structural + nextWeights.cost + nextWeights.carbon;
    if (total > 0) {
      nextWeights.structural = Number((nextWeights.structural / total).toFixed(2));
      nextWeights.cost = Number((nextWeights.cost / total).toFixed(2));
      nextWeights.carbon = Number((1 - nextWeights.structural - nextWeights.cost).toFixed(2));
    }
    setAgentWeights(nextWeights);
    const updatedNeg = pulseEngine.adjustNegotiationWeights(nextWeights);
    setNegotiation(updatedNeg);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/50 shadow-[0_0_12px_rgba(0,229,255,0.3)]';
      case 'GOLD':
        return 'bg-[#d4ff00]/15 text-[#d4ff00] border-[#d4ff00]/50 shadow-[0_0_12px_rgba(212,255,0,0.25)]';
      case 'SILVER':
        return 'bg-[#94a3b8]/15 text-[#cbd5e1] border-[#94a3b8]/50';
      default:
        return 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/50';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] text-[#f5f4f0] overflow-y-auto font-sans">
      {/* Top Banner & Asset Selector */}
      <div className="px-6 py-4 bg-[#09101c]/90 border-b border-[#00e5ff]/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Activity className="w-5 h-5 text-[#00e5ff] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wide font-mono-tech text-[#f5f4f0]">
                ARCHOS PULSE & CARBON LEDGER
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
                MODULE 1 & 2 · VITALITY RUNTIME
              </span>
            </div>
            <p className="text-xs text-[#8e8d88] font-mono-tech">
              Continuous UAE Asset Health Telemetry · Sensor Drift Ingestion · Living Carbon Accounting
            </p>
          </div>
        </div>

        {/* Building Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono-tech text-[#8e8d88] uppercase">Target Asset:</label>
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="bg-[#0f172a] border border-[#00e5ff]/40 rounded-lg px-3 py-1.5 text-xs font-mono-tech text-[#00e5ff] focus:outline-none focus:border-[#00e5ff] shadow-inner"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#09101c] text-white">
                {b.name} ({b.overallPulseScore}/100)
              </option>
            ))}
          </select>

          {/* JARVIS Voice Briefing Trigger */}
          <button
            onClick={handleSpeakNarrative}
            className="px-3 py-1.5 rounded-lg border border-[#d4ff00]/50 bg-[#d4ff00]/10 text-[#d4ff00] hover:bg-[#d4ff00]/20 transition-all text-xs font-mono-tech flex items-center gap-1.5 shadow-[0_0_10px_rgba(212,255,0,0.2)]"
            title="Listen to J.A.R.V.I.S. Vitality Diagnostics Briefing"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">JARVIS BRIEFING</span>
          </button>

          {/* AI Auto-Calibrate Optimizer */}
          <button
            onClick={handleFullOptimization}
            disabled={isOptimizing}
            className="px-3 py-1.5 rounded-lg border border-[#00e5ff]/50 bg-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/30 transition-all text-xs font-mono-tech flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.3)] disabled:opacity-50"
            title="Execute Full AI Auto-Calibration & Drift Compensation"
          >
            <RefreshCw className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span className="font-bold">{isOptimizing ? 'OPTIMIZING...' : 'AI AUTO-OPTIMIZE'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="px-6 py-2 bg-[#09101c]/50 border-b border-[#00e5ff]/15 flex gap-2">
        <button
          onClick={() => setActiveSubTab('VITALITY')}
          className={`px-4 py-1.5 rounded-md text-xs font-mono-tech transition-all flex items-center gap-2 ${
            activeSubTab === 'VITALITY'
              ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/60 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
              : 'text-[#8e8d88] hover:text-[#f5f4f0] border border-transparent'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>BUILDING VITALITY INDEX ({activeBuilding.overallPulseScore})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CARBON_LEDGER')}
          className={`px-4 py-1.5 rounded-md text-xs font-mono-tech transition-all flex items-center gap-2 ${
            activeSubTab === 'CARBON_LEDGER'
              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'text-[#8e8d88] hover:text-[#f5f4f0] border border-transparent'
          }`}
        >
          <Leaf className="w-3.5 h-3.5" />
          <span>CARBON LEDGER & CREDITS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MULTI_AGENT')}
          className={`px-4 py-1.5 rounded-md text-xs font-mono-tech transition-all flex items-center gap-2 ${
            activeSubTab === 'MULTI_AGENT'
              ? 'bg-[#d4ff00]/20 text-[#d4ff00] border border-[#d4ff00]/60 shadow-[0_0_10px_rgba(212,255,0,0.2)]'
              : 'text-[#8e8d88] hover:text-[#f5f4f0] border border-transparent'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>MULTI-AGENT PARETO STUDIO</span>
        </button>

        <button
          onClick={() => setActiveSubTab('INSURANCE')}
          className={`px-4 py-1.5 rounded-md text-xs font-mono-tech transition-all flex items-center gap-2 ${
            activeSubTab === 'INSURANCE'
              ? 'bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/60 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
              : 'text-[#8e8d88] hover:text-[#f5f4f0] border border-transparent'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>FINANCE & RISK-PRICED UNDERWRITING</span>
        </button>

        <button
          onClick={() => setActiveSubTab('REAL_MQTT_TELEMETRY')}
          className={`px-4 py-1.5 rounded-md text-xs font-mono-tech transition-all flex items-center gap-2 ${
            activeSubTab === 'REAL_MQTT_TELEMETRY'
              ? 'bg-[#00e5ff] text-black font-bold shadow-[0_0_12px_#00e5ff]'
              : 'text-[#00e5ff] border border-[#00e5ff]/40 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>REAL MQTT TELEMETRY (LIVE BUS)</span>
        </button>
      </div>

      {/* Toast notification */}
      {optimizationToast && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/60 text-xs font-mono-tech text-[#00e5ff] flex items-center justify-between shadow-[0_0_15px_rgba(0,229,255,0.3)] animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00e5ff]" />
            <span>{optimizationToast}</span>
          </div>
          <button onClick={() => setOptimizationToast(null)} className="text-[#8e8d88] hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* View Content */}
      <div className="p-6 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 0: REAL MQTT LIVE TELEMETRY BUS */}
        {/* ========================================================================= */}
        {activeSubTab === 'REAL_MQTT_TELEMETRY' && (
          <div className="w-full max-w-6xl mx-auto">
            <LiveTelemetry />
          </div>
        )}
        {/* ========================================================================= */}
        {/* TAB 1: BUILDING VITALITY INDEX */}
        {/* ========================================================================= */}
        {activeSubTab === 'VITALITY' && (
          <div className="space-y-6">
            {/* Vitality Hero Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#09101c] via-[#0d1627] to-[#09101c] border border-[#00e5ff]/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Score Dial & Tier */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 border-r border-[#00e5ff]/15">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-[#1e293b]" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (264 * activeBuilding.overallPulseScore) / 100}
                        strokeLinecap="round"
                        className={activeBuilding.overallPulseScore >= 90 ? 'text-[#00e5ff]' : activeBuilding.overallPulseScore >= 80 ? 'text-[#d4ff00]' : 'text-[#f59e0b]'}
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-4xl font-extrabold font-mono-tech tracking-tighter text-[#f5f4f0]">
                        {activeBuilding.overallPulseScore}
                      </span>
                      <span className="text-[10px] font-mono-tech text-[#8e8d88] uppercase tracking-wider">
                        VITALITY INDEX
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono-tech font-bold border ${getTierBadge(activeBuilding.vitalityTier)}`}>
                      {activeBuilding.vitalityTier} TIER
                    </span>
                    <span className={`text-xs font-mono-tech flex items-center ${activeBuilding.trendDelta >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      {activeBuilding.trendDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                      {activeBuilding.trendDelta >= 0 ? `+${activeBuilding.trendDelta}` : activeBuilding.trendDelta} pts (30d)
                    </span>
                  </div>
                </div>

                {/* Narrative & Asset Profile */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-[#f5f4f0] font-mono-tech">{activeBuilding.name}</h2>
                      <p className="text-xs text-[#00e5ff] font-mono-tech">
                        {activeBuilding.arabicName} · Built {activeBuilding.yearBuilt} · {(activeBuilding.grossFloorAreaSqm ?? 0).toLocaleString()} m² GFA
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#8e8d88] font-mono-tech">Tradeable Asset Valuation</div>
                      <div className="text-base font-bold font-mono-tech text-[#d4ff00]">
                        {(activeBuilding.tradeableAssetValueAed / 1000000).toFixed(0)}M AED
                      </div>
                    </div>
                  </div>

                  {/* JARVIS Live Diagnostics Audio Box */}
                  <div className="p-3.5 rounded-lg bg-[#050811]/80 border border-[#00e5ff]/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono-tech text-[#00e5ff] font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>J.A.R.V.I.S. NARRATIVE INTELLIGENCE</span>
                      </div>
                      <button
                        onClick={handleSpeakNarrative}
                        className="text-[10px] font-mono-tech text-[#d4ff00] hover:underline flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" /> Replay Voice
                      </button>
                    </div>
                    <p className="text-xs text-[#cbd5e1] leading-relaxed italic">
                      "{activeBuilding.jarvisVoiceNarrative}"
                    </p>
                  </div>

                  {/* Key Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-2 rounded bg-[#09101c] border border-[#00e5ff]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Predicted Remaining Life</span>
                      <span className="text-sm font-bold font-mono-tech text-[#00e5ff]">
                        {activeBuilding.predictedRemainingLifeYears} Years
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#09101c] border border-[#00e5ff]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Annual Degradation</span>
                      <span className="text-sm font-bold font-mono-tech text-[#f59e0b]">
                        {activeBuilding.degradationRatePerYear}% / yr
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#09101c] border border-[#00e5ff]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Insurance Premium Discount</span>
                      <span className="text-sm font-bold font-mono-tech text-[#10b981]">
                        -{activeBuilding.dimensions.financialHealth.insurancePremiumScoreDiscountPercent}% Discount
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Vitality Dimensions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Structural Integrity */}
              <div className="p-4 rounded-lg bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tech font-bold text-[#f5f4f0]">STRUCTURAL</span>
                  <span className="text-xs font-mono-tech font-bold text-[#00e5ff]">
                    {activeBuilding.dimensions.structuralIntegrity.score}/100
                  </span>
                </div>
                <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00e5ff] h-full rounded-full"
                    style={{ width: `${activeBuilding.dimensions.structuralIntegrity.score}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono-tech text-[#8e8d88]">
                  Core Drift: <strong className="text-white">{activeBuilding.dimensions.structuralIntegrity.structuralDriftMm}mm</strong>
                </div>
                <div className="text-[10px] text-[#94a3b8] leading-tight line-clamp-2">
                  Resonance: {activeBuilding.dimensions.structuralIntegrity.resonanceFrequencyHz} Hz · Stress: {activeBuilding.dimensions.structuralIntegrity.foundationStressMpa} MPa
                </div>
              </div>

              {/* System Health (MEP) */}
              <div className="p-4 rounded-lg bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tech font-bold text-[#f5f4f0]">SYSTEM HEALTH</span>
                  <span className={`text-xs font-mono-tech font-bold ${activeBuilding.dimensions.systemHealth.score >= 85 ? 'text-[#00e5ff]' : 'text-[#f59e0b]'}`}>
                    {activeBuilding.dimensions.systemHealth.score}/100
                  </span>
                </div>
                <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={activeBuilding.dimensions.systemHealth.score >= 85 ? 'bg-[#00e5ff] h-full rounded-full' : 'bg-[#f59e0b] h-full rounded-full'}
                    style={{ width: `${activeBuilding.dimensions.systemHealth.score}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono-tech text-[#8e8d88]">
                  Chiller ΔT: <strong className="text-white">{activeBuilding.dimensions.systemHealth.chilledWaterDeltaTC}°C</strong>
                </div>
                <div className="text-[10px] text-[#94a3b8] leading-tight line-clamp-2">
                  HVAC Drift: {activeBuilding.dimensions.systemHealth.hvacDriftPercent}% · Lift Wear: {activeBuilding.dimensions.systemHealth.elevatorHoistWearPercent}%
                </div>
              </div>

              {/* Energy Performance */}
              <div className="p-4 rounded-lg bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tech font-bold text-[#f5f4f0]">ENERGY</span>
                  <span className="text-xs font-mono-tech font-bold text-[#10b981]">
                    {activeBuilding.dimensions.energyPerformance.score}/100
                  </span>
                </div>
                <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#10b981] h-full rounded-full"
                    style={{ width: `${activeBuilding.dimensions.energyPerformance.score}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono-tech text-[#8e8d88]">
                  Intensity: <strong className="text-white">{activeBuilding.dimensions.energyPerformance.kwhPerSqmPerYear} kWh/m²</strong>
                </div>
                <div className="text-[10px] text-[#94a3b8] leading-tight line-clamp-2">
                  Peak: {(activeBuilding.dimensions.energyPerformance.peakDemandKw / 1000).toFixed(1)} MW · Solar: {activeBuilding.dimensions.energyPerformance.solarSelfConsumptionPercent}%
                </div>
              </div>

              {/* Carbon Performance */}
              <div className="p-4 rounded-lg bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tech font-bold text-[#f5f4f0]">CARBON</span>
                  <span className="text-xs font-mono-tech font-bold text-[#10b981]">
                    {activeBuilding.dimensions.carbonPerformance.score}/100
                  </span>
                </div>
                <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#10b981] h-full rounded-full"
                    style={{ width: `${activeBuilding.dimensions.carbonPerformance.score}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono-tech text-[#8e8d88]">
                  Operational: <strong className="text-white">{activeBuilding.dimensions.carbonPerformance.operationalTco2ePerYear} t/yr</strong>
                </div>
                <div className="text-[10px] text-[#94a3b8] leading-tight line-clamp-2">
                  Credits Earned: {(activeBuilding.dimensions.carbonPerformance.creditsEarnedTonnes ?? 0).toLocaleString()} tCO₂e
                </div>
              </div>

              {/* Financial Health */}
              <div className="p-4 rounded-lg bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tech font-bold text-[#f5f4f0]">FINANCIAL</span>
                  <span className="text-xs font-mono-tech font-bold text-[#d4ff00]">
                    {activeBuilding.dimensions.financialHealth.score}/100
                  </span>
                </div>
                <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#d4ff00] h-full rounded-full"
                    style={{ width: `${activeBuilding.dimensions.financialHealth.score}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono-tech text-[#8e8d88]">
                  Net Yield: <strong className="text-white">{activeBuilding.dimensions.financialHealth.roiYieldPercent}%</strong>
                </div>
                <div className="text-[10px] text-[#94a3b8] leading-tight line-clamp-2">
                  Monthly OPEX: {(activeBuilding.dimensions.financialHealth.opexMonthlyAed / 1000).toFixed(0)}k AED
                </div>
              </div>
            </div>

            {/* Live Sensor Drift & Recalibration Matrix */}
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#00e5ff]/25 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-mono-tech text-[#f5f4f0] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00e5ff]" />
                    LIVE SENSOR DRIFT & TELEMETRY STREAM
                  </h3>
                  <p className="text-xs text-[#8e8d88] font-mono-tech">
                    Continuous acoustic, strain, and thermal sensors streaming into the UAE World Model
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#00e5ff]/10 text-[#00e5ff] text-xs font-mono-tech border border-[#00e5ff]/30">
                  {activeBuilding.liveSensors.length} SENSORS CONNECTED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeBuilding.liveSensors.map((sensor) => (
                  <div
                    key={sensor.id}
                    className={`p-3 rounded-lg border transition-all ${
                      sensor.status === 'DRIFT_DETECTED' || sensor.status === 'ANOMALOUS'
                        ? 'bg-[#ef4444]/10 border-[#ef4444]/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        : 'bg-[#050811] border-[#00e5ff]/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono-tech text-[#8e8d88] block">{sensor.id}</span>
                        <h4 className="text-xs font-bold font-mono-tech text-[#f5f4f0]">{sensor.location}</h4>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono-tech font-bold ${
                          sensor.status === 'CALIBRATED'
                            ? 'bg-[#10b981]/20 text-[#10b981]'
                            : sensor.status === 'DRIFT_DETECTED'
                            ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                            : 'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}
                      >
                        {sensor.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-sm font-mono-tech font-bold text-[#00e5ff]">{sensor.reading}</span>
                      <span className="text-[10px] font-mono-tech text-[#8e8d88]">
                        Drift: <strong className={sensor.driftPercentage > 5 ? 'text-[#ef4444]' : 'text-[#10b981]'}>{sensor.driftPercentage}%</strong>
                      </span>
                    </div>

                    {/* Action trigger if drift detected */}
                    {sensor.status !== 'CALIBRATED' && (
                      <button
                        onClick={() => handleRecalibrate(sensor.id)}
                        className="mt-2 w-full py-1 rounded bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] text-[10px] font-mono-tech font-bold border border-[#00e5ff]/40 transition-all flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> RECALIBRATE NOW
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CARBON LEDGER & OFFSET REGISTRY */}
        {/* ========================================================================= */}
        {activeSubTab === 'CARBON_LEDGER' && carbonLedger && (
          <div className="space-y-6">
            {/* Carbon Budget & Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Embodied Carbon */}
              <div className="p-4 rounded-xl bg-[#09101c] border border-[#10b981]/30 space-y-1">
                <span className="text-xs font-mono-tech text-[#8e8d88]">Embodied Carbon</span>
                <div className="text-xl font-bold font-mono-tech text-[#10b981]">
                  {(carbonLedger.embodied.totalTonnes ?? 0).toLocaleString()} tCO₂e
                </div>
                <p className="text-[10px] text-[#8e8d88]">Concrete: {(carbonLedger.embodied.concreteAndCementTonnes ?? 0).toLocaleString()}t · Steel: {(carbonLedger.embodied.structuralSteelTonnes ?? 0).toLocaleString()}t</p>
              </div>

              {/* Operational Carbon */}
              <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/30 space-y-1">
                <span className="text-xs font-mono-tech text-[#8e8d88]">Operational Carbon (YTD)</span>
                <div className="text-xl font-bold font-mono-tech text-[#00e5ff]">
                  {(carbonLedger.operational.totalTonnesYtd ?? 0).toLocaleString()} tCO₂e
                </div>
                <p className="text-[10px] text-[#8e8d88]">Real-time: {carbonLedger.operational.realTimeKgPerHour} kg/hr</p>
              </div>

              {/* Lifetime Carbon Budget */}
              <div className="p-4 rounded-xl bg-[#09101c] border border-[#d4ff00]/30 space-y-1">
                <span className="text-xs font-mono-tech text-[#8e8d88]">Lifetime Budget Remaining</span>
                <div className="text-xl font-bold font-mono-tech text-[#d4ff00]">
                  {(carbonLedger.budget.remainingTonnes ?? 0).toLocaleString()} tCO₂e
                </div>
                <p className="text-[10px] text-[#8e8d88]">{carbonLedger.budget.percentSpent}% Spent · Exceedance: {carbonLedger.budget.forecastExceedanceYear || 'Never (Net-Zero)'}</p>
              </div>

              {/* Tradeable Credits Value */}
              <div className="p-4 rounded-xl bg-[#09101c] border border-[#ec4899]/30 space-y-1">
                <span className="text-xs font-mono-tech text-[#8e8d88]">Tradeable Carbon Assets</span>
                <div className="text-xl font-bold font-mono-tech text-[#ec4899]">
                  {(carbonLedger.tradeableCredits.reduce((acc, c) => acc + (c.status === 'ACTIVE_LISTED' ? (c.totalValueAed ?? 0) : 0), 0) ?? 0).toLocaleString()} AED
                </div>
                <p className="text-[10px] text-[#8e8d88]">Listed on Abu Dhabi Carbon Exchange</p>
              </div>
            </div>

            {/* Tradeable Credits Exchange Table */}
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#10b981]/25 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-mono-tech text-[#f5f4f0] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#10b981]" />
                    VERIFIED TRADEABLE CARBON CREDITS (GOLD STANDARD / UAE REGISTRY)
                  </h3>
                  <p className="text-xs text-[#8e8d88] font-mono-tech">
                    Tokenized carbon offsets generated through AI-driven chiller optimization and solar export
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-tech border-collapse">
                  <thead>
                    <tr className="border-b border-[#10b981]/20 text-[#8e8d88]">
                      <th className="pb-2">BATCH #</th>
                      <th className="pb-2">ISSUED (TONNES)</th>
                      <th className="pb-2">UNIT PRICE</th>
                      <th className="pb-2">TOTAL VALUE</th>
                      <th className="pb-2">STANDARD</th>
                      <th className="pb-2">STATUS</th>
                      <th className="pb-2 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#10b981]/10">
                    {carbonLedger.tradeableCredits.map((credit) => (
                      <tr key={credit.id} className="hover:bg-[#10b981]/5 transition-all">
                        <td className="py-3 text-[#00e5ff] font-bold">{credit.creditBatchNumber}</td>
                        <td className="py-3 text-white">{(credit.issuedTonnes ?? 0).toLocaleString()} tCO₂e</td>
                        <td className="py-3 text-[#d4ff00]">{credit.unitPriceAed} AED / t</td>
                        <td className="py-3 text-white font-bold">{(credit.totalValueAed ?? 0).toLocaleString()} AED</td>
                        <td className="py-3 text-[#8e8d88]">{credit.verificationStandard}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              credit.status === 'ACTIVE_LISTED'
                                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                                : credit.status === 'TRADED'
                                ? 'bg-[#00e5ff]/20 text-[#00e5ff]'
                                : 'bg-[#94a3b8]/20 text-[#94a3b8]'
                            }`}
                          >
                            {credit.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {credit.status === 'ACTIVE_LISTED' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const res = pulseEngine.tradeCarbonCredit(activeBuilding.id, credit.id, 'TRADE');
                                  setOptimizationToast(res.message);
                                  setTimeout(() => setOptimizationToast(null), 4000);
                                }}
                                className="px-2.5 py-1 rounded bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] font-bold border border-[#10b981]/40 transition-all text-[10px]"
                              >
                                EXECUTE TRADE
                              </button>
                              <button
                                onClick={() => {
                                  const res = pulseEngine.tradeCarbonCredit(activeBuilding.id, credit.id, 'RETIRE');
                                  setOptimizationToast(res.message);
                                  setTimeout(() => setOptimizationToast(null), 4000);
                                }}
                                className="px-2.5 py-1 rounded bg-[#09101c] hover:bg-[#1e293b] text-[#8e8d88] border border-[#8e8d88]/40 transition-all text-[10px]"
                              >
                                RETIRE
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verifiable Offset Registry */}
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#00e5ff]/25 space-y-4">
              <h3 className="text-sm font-bold font-mono-tech text-[#f5f4f0] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00e5ff]" />
                CRYPTOGRAPHIC SOVEREIGN OFFSET REGISTRY
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {carbonLedger.offsetRegistry.map((offset) => (
                  <div key={offset.id} className="p-3.5 rounded-lg bg-[#050811] border border-[#00e5ff]/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#f5f4f0] font-mono-tech">{offset.projectName}</h4>
                      <span className="text-[10px] font-mono-tech text-[#10b981] font-bold">{offset.tonnesOffset} tCO₂e</span>
                    </div>
                    <div className="text-[10px] text-[#8e8d88] font-mono-tech">
                      Location: {offset.location} · Cost: {offset.costPerTonneAed} AED/t
                    </div>
                    <div className="p-2 rounded bg-[#09101c] text-[9px] font-mono-tech text-[#00e5ff] break-all border border-[#00e5ff]/15">
                      Hash: {offset.verificationHash}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MULTI-AGENT PARETO STUDIO */}
        {/* ========================================================================= */}
        {activeSubTab === 'MULTI_AGENT' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-[#09101c] border border-[#d4ff00]/30 shadow-2xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#f5f4f0] font-mono-tech flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#d4ff00]" />
                  MULTI-AGENT PARETO TRADE-OFF NEGOTIATION
                </h2>
                <p className="text-xs text-[#8e8d88] font-mono-tech">
                  Autonomous consensus engine balancing Structural Resilience vs Capital Cost vs Carbon Lifecycle
                </p>
              </div>

              {/* 3 Domain Agents Stances */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Structural Sentinel */}
                <div className="p-4 rounded-lg bg-[#050811] border border-[#00e5ff]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono-tech text-[#00e5ff]">STRUCTURAL SENTINEL</span>
                    <span className="text-xs font-mono-tech text-[#8e8d88]">Weight: {(agentWeights.structural * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-[#cbd5e1]">{negotiation.agents.structural.priority}</p>
                  <div className="p-2.5 rounded bg-[#09101c] text-[11px] font-mono-tech text-[#94a3b8] italic">
                    "{negotiation.agents.structural.idealProposal}"
                  </div>
                  <div className="pt-2">
                    <label className="text-[10px] font-mono-tech text-[#8e8d88] block mb-1">Priority Weight Slider</label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={agentWeights.structural}
                      onChange={(e) => handleWeightChange('structural', parseFloat(e.target.value))}
                      className="w-full accent-[#00e5ff]"
                    />
                  </div>
                </div>

                {/* FinSight Cost Agent */}
                <div className="p-4 rounded-lg bg-[#050811] border border-[#d4ff00]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono-tech text-[#d4ff00]">FINSIGHT COST AGENT</span>
                    <span className="text-xs font-mono-tech text-[#8e8d88]">Weight: {(agentWeights.cost * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-[#cbd5e1]">{negotiation.agents.cost.priority}</p>
                  <div className="p-2.5 rounded bg-[#09101c] text-[11px] font-mono-tech text-[#94a3b8] italic">
                    "{negotiation.agents.cost.idealProposal}"
                  </div>
                  <div className="pt-2">
                    <label className="text-[10px] font-mono-tech text-[#8e8d88] block mb-1">Priority Weight Slider</label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={agentWeights.cost}
                      onChange={(e) => handleWeightChange('cost', parseFloat(e.target.value))}
                      className="w-full accent-[#d4ff00]"
                    />
                  </div>
                </div>

                {/* Green Carbon Auditor */}
                <div className="p-4 rounded-lg bg-[#050811] border border-[#10b981]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono-tech text-[#10b981]">GREEN CARBON AGENT</span>
                    <span className="text-xs font-mono-tech text-[#8e8d88]">Weight: {(agentWeights.carbon * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-[#cbd5e1]">{negotiation.agents.carbon.priority}</p>
                  <div className="p-2.5 rounded bg-[#09101c] text-[11px] font-mono-tech text-[#94a3b8] italic">
                    "{negotiation.agents.carbon.idealProposal}"
                  </div>
                  <div className="pt-2">
                    <label className="text-[10px] font-mono-tech text-[#8e8d88] block mb-1">Priority Weight Slider</label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={agentWeights.carbon}
                      onChange={(e) => handleWeightChange('carbon', parseFloat(e.target.value))}
                      className="w-full accent-[#10b981]"
                    />
                  </div>
                </div>
              </div>

              {/* Negotiated Pareto Consensus Output */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-[#050811] to-[#0d1627] border border-[#d4ff00]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono-tech text-[#d4ff00] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#d4ff00]" />
                    PARETO OPTIMAL CONSENSUS VECTOR (SCORE: {negotiation.negotiatedConsensus.paretoOptimalityScore})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#d4ff00]/20 text-[#d4ff00] text-[10px] font-mono-tech font-bold">
                    {negotiation.negotiatedConsensus.status}
                  </span>
                </div>

                <p className="text-xs text-[#f5f4f0] leading-relaxed">
                  {negotiation.negotiatedConsensus.compromiseSolution}
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded bg-[#09101c] border border-[#00e5ff]/20">
                    <span className="text-[10px] font-mono-tech text-[#8e8d88] block">Safety Factor</span>
                    <span className="text-sm font-bold font-mono-tech text-[#00e5ff]">
                      {negotiation.negotiatedConsensus.structuralSafetyFactor}x Design Limit
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#09101c] border border-[#d4ff00]/20">
                    <span className="text-[10px] font-mono-tech text-[#8e8d88] block">CAPEX Delta</span>
                    <span className="text-sm font-bold font-mono-tech text-[#d4ff00]">
                      {(negotiation.negotiatedConsensus.capexDeltaAed / 1000000).toFixed(1)}M AED
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#09101c] border border-[#10b981]/20">
                    <span className="text-[10px] font-mono-tech text-[#8e8d88] block">Lifetime CO₂ Cut</span>
                    <span className="text-sm font-bold font-mono-tech text-[#10b981]">
                      {(negotiation.negotiatedConsensus.carbonReductionTonnes ?? 0).toLocaleString()} Tonnes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FINANCE & INSURANCE UNDERWRITING */}
        {/* ========================================================================= */}
        {activeSubTab === 'INSURANCE' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk-Priced Insurance Policy Card */}
              <div className="p-6 rounded-xl bg-[#09101c] border border-[#ec4899]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-mono-tech text-[#f5f4f0] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#ec4899]" />
                    VITALITY-INDEXED PROPERTY INSURANCE
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono-tech font-bold bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/40">
                    {activeBuilding.insuranceImpact.underwriterRating} RATING
                  </span>
                </div>

                <p className="text-xs text-[#8e8d88]">
                  Actuarial property risk modeled continuously from real-time vibration, chiller ΔT, and electrical telemetry.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono-tech py-1 border-b border-[#ec4899]/15">
                    <span className="text-[#8e8d88]">Standard Unmonitored Premium:</span>
                    <span className="text-white font-bold">{(activeBuilding.insuranceImpact.baselineMarketPremiumAed ?? 0).toLocaleString()} AED / yr</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono-tech py-1 border-b border-[#ec4899]/15">
                    <span className="text-[#10b981]">Pulse Vitality Discount:</span>
                    <span className="text-[#10b981] font-bold">-{(activeBuilding.insuranceImpact.annualSavingsAed ?? 0).toLocaleString()} AED ({activeBuilding.dimensions.financialHealth.insurancePremiumScoreDiscountPercent}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono-tech py-2 bg-[#ec4899]/10 px-3 rounded-lg border border-[#ec4899]/30">
                    <span className="text-[#f5f4f0] font-bold">Net Annual Premium:</span>
                    <span className="text-[#ec4899] font-extrabold">{(activeBuilding.insuranceImpact.vitalityAdjustedPremiumAed ?? 0).toLocaleString()} AED / yr</span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-[#8e8d88] font-mono-tech">
                  Underwriter Syndicate Pool: ADNIC, Sukoon Insurance, Munich Re, Dubai Islamic Insurance.
                </div>
              </div>

              {/* Pro-Forma Investment Sensitivity */}
              <div className="p-6 rounded-xl bg-[#09101c] border border-[#00e5ff]/30 space-y-4">
                <h3 className="text-base font-bold font-mono-tech text-[#f5f4f0] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#00e5ff]" />
                  DEVELOPMENT PRO-FORMA & IRR YIELD
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-[#050811] border border-[#00e5ff]/20">
                    <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Projected IRR</span>
                    <span className="text-lg font-bold font-mono-tech text-[#00e5ff]">18.4%</span>
                  </div>
                  <div className="p-3 rounded bg-[#050811] border border-[#00e5ff]/20">
                    <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Equity Multiple</span>
                    <span className="text-lg font-bold font-mono-tech text-[#d4ff00]">2.34x</span>
                  </div>
                  <div className="p-3 rounded bg-[#050811] border border-[#00e5ff]/20">
                    <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Loan to Cost (LTC)</span>
                    <span className="text-lg font-bold font-mono-tech text-[#f5f4f0]">60.0%</span>
                  </div>
                  <div className="p-3 rounded bg-[#050811] border border-[#00e5ff]/20">
                    <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Payback Period</span>
                    <span className="text-lg font-bold font-mono-tech text-[#10b981]">6.8 Years</span>
                  </div>
                </div>

                <p className="text-xs text-[#8e8d88]">
                  Asset valuation is dynamically augmented by +170M AED due to sustained Platinum tier vitality score and zero deferred maintenance liability.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
