import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Layers,
  Calculator,
  Compass,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  PieChart,
  Coins
} from 'lucide-react';
import { speechService } from '../../services/voice/speechService';

export interface LandParcel {
  id: string;
  plotNumber: string;
  district: string;
  emirate: string;
  landAreaSqFt: number;
  zoningType: 'COMMERCIAL_MIXED' | 'RESIDENTIAL_HIGH' | 'HOSPITALITY' | 'INDUSTRIAL_TECH';
  maxFar: number; // Floor Area Ratio
  allowableGfaSqFt: number; // Gross Floor Area
  currentMarketRatePerSqFt: number; // AED
  totalPlotValuationAed: number;
  projectedGrossYieldPct: number;
  estimatedConstructionCostAed: number;
  projectedNetIrrPct: number;
}

export const LAND_PARCELS: LandParcel[] = [
  {
    id: 'plot-dt-08',
    plotNumber: 'DOWNTOWN-P-0891',
    district: 'Downtown Dubai',
    emirate: 'Dubai',
    landAreaSqFt: 45000,
    zoningType: 'COMMERCIAL_MIXED',
    maxFar: 14.5,
    allowableGfaSqFt: 652500,
    currentMarketRatePerSqFt: 2850,
    totalPlotValuationAed: 128250000,
    projectedGrossYieldPct: 8.4,
    estimatedConstructionCostAed: 522000000,
    projectedNetIrrPct: 17.8
  },
  {
    id: 'plot-creek-14',
    plotNumber: 'CREEK-HARBOUR-C-142',
    district: 'Dubai Creek Harbour',
    emirate: 'Dubai',
    landAreaSqFt: 60000,
    zoningType: 'RESIDENTIAL_HIGH',
    maxFar: 11.0,
    allowableGfaSqFt: 660000,
    currentMarketRatePerSqFt: 1950,
    totalPlotValuationAed: 117000000,
    projectedGrossYieldPct: 9.1,
    estimatedConstructionCostAed: 462000000,
    projectedNetIrrPct: 19.4
  },
  {
    id: 'plot-saadiyat-02',
    plotNumber: 'SAADIYAT-SD-024',
    district: 'Saadiyat Cultural District',
    emirate: 'Abu Dhabi',
    landAreaSqFt: 85000,
    zoningType: 'HOSPITALITY',
    maxFar: 6.5,
    allowableGfaSqFt: 552500,
    currentMarketRatePerSqFt: 2200,
    totalPlotValuationAed: 187000000,
    projectedGrossYieldPct: 7.9,
    estimatedConstructionCostAed: 497250000,
    projectedNetIrrPct: 16.2
  },
  {
    id: 'plot-jafza-99',
    plotNumber: 'JEBEL-ALI-TECH-991',
    district: 'JAFZA South',
    emirate: 'Dubai',
    landAreaSqFt: 120000,
    zoningType: 'INDUSTRIAL_TECH',
    maxFar: 3.5,
    allowableGfaSqFt: 420000,
    currentMarketRatePerSqFt: 850,
    totalPlotValuationAed: 102000000,
    projectedGrossYieldPct: 11.2,
    estimatedConstructionCostAed: 252000000,
    projectedNetIrrPct: 22.1
  }
];

export const RealEstateValuationView: React.FC = () => {
  const [parcels, setParcels] = useState<LandParcel[]>(LAND_PARCELS);
  const [selectedParcelId, setSelectedParcelId] = useState<string>('plot-dt-08');
  const [customFarMultiplier, setCustomFarMultiplier] = useState<number>(1.0);

  const activeParcel = parcels.find((p) => p.id === selectedParcelId) || parcels[0];
  const adjustedGfa = Math.round(activeParcel.allowableGfaSqFt * customFarMultiplier);
  const adjustedConstructionCost = Math.round(activeParcel.estimatedConstructionCostAed * customFarMultiplier);

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#03060d] select-none font-mono-tech">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#00e5ff]/20 bg-[#070c16]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#10b981]/10 border border-[#10b981]/40 text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Building2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#f5f4f0] uppercase tracking-wider">
                SOVEREIGN LAND PARCEL & PLOT VALUATION
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                DLD & DMT BENCHMARKED
              </span>
            </div>
            <p className="text-[11px] text-[#8e8d88]">
              Plot FAR Optimization · Gross Floor Area (GFA) Yields · 10-Year Pro-Forma IRR Projections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              speechService.speak(
                `Valuation analysis for ${activeParcel.plotNumber} in ${activeParcel.district}. Land valuation is ${Math.round(activeParcel.totalPlotValuationAed / 1000000)} Million AED. Projected Net IRR is ${activeParcel.projectedNetIrrPct} percent.`
              );
            }}
            className="px-3 py-1.5 rounded-xl bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/50 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Volume2 size={14} />
            <span>AUDIBLE VALUATION REPORT</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Parcel List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-[#00e5ff]/30 backdrop-blur-xl shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                AVAILABLE SOVEREIGN PLOTS
              </span>
              <span className="text-[10px] text-[#00e5ff] font-bold">4 REGISTERED PLOTS</span>
            </div>

            <div className="flex flex-col gap-2">
              {parcels.map((pl) => {
                const isSelected = pl.id === selectedParcelId;
                return (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedParcelId(pl.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-[#10b981]/15 border-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[200px]">
                        {pl.plotNumber}
                      </span>
                      <span className="text-xs font-bold text-[#10b981]">
                        AED {(pl.totalPlotValuationAed / 1000000).toFixed(1)}M
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8e8d88]">
                      <span>{pl.district} ({pl.emirate})</span>
                      <span className="text-[#00e5ff] font-bold">Max FAR {pl.maxFar}x</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-[#8e8d88] border-t border-white/5 pt-1">
                      <span>Area: {pl.landAreaSqFt.toLocaleString()} sq ft</span>
                      <span className="text-[#d4ff00] font-bold">IRR: {pl.projectedNetIrrPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Valuation & FAR Modeling HUD (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-[#10b981]/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#10b981]/20 pb-3">
              <div>
                <span className="text-[10px] text-[#10b981] font-bold uppercase tracking-wider">
                  PARCEL ASSET PRO-FORMA
                </span>
                <h2 className="text-base font-bold text-[#f5f4f0]">{activeParcel.plotNumber} · {activeParcel.district}</h2>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-[#10b981]/20 text-[#10b981] font-bold border border-[#10b981]/40">
                {activeParcel.zoningType}
              </span>
            </div>

            {/* FAR Multiplier Slider */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8e8d88]">FAR Variance Multiplier:</span>
                <span className="font-bold text-[#00e5ff]">{customFarMultiplier.toFixed(2)}x Density ({adjustedGfa.toLocaleString()} sq ft GFA)</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.05}
                value={customFarMultiplier}
                onChange={(e) => setCustomFarMultiplier(parseFloat(e.target.value))}
                className="w-full accent-[#10b981] cursor-pointer"
              />
            </div>

            {/* Financial Metric Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Plot Valuation</span>
                <span className="text-base font-bold text-[#10b981]">
                  AED {(activeParcel.totalPlotValuationAed / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Construction CAPEX</span>
                <span className="text-base font-bold text-[#00e5ff]">
                  AED {(adjustedConstructionCost / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Projected Net IRR</span>
                <span className="text-base font-bold text-[#d4ff00]">
                  {activeParcel.projectedNetIrrPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
