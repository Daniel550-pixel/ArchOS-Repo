import React, { useState } from 'react';
import {
  ShoppingBag,
  GraduationCap,
  Sparkles,
  Wrench,
  Layers,
  Cpu,
  ShieldCheck,
  Award,
  ArrowUpRight,
  Download,
  CheckCircle2,
  TrendingUp,
  Coins,
  Building2,
  Sliders,
  DollarSign,
  ChevronRight,
  ExternalLink,
  BookOpen,
  FileText
} from 'lucide-react';
import {
  MARKETPLACE_PRODUCTS,
  ACADEMY_MODULES,
  RETROFIT_SIMULATION_CASES,
  PROCUREMENT_MATERIALS,
  SIMULATION_PACKAGES,
  ARCHOS_BUSINESS_MODELS
} from '../../data/archosMarketplaceData';
import { MarketplaceProduct, MarketplaceCategory } from '../../types/archosExpansion';

interface MarketplaceHubViewProps {
  onSpeak?: (text: string) => void;
}

export const MarketplaceHubView: React.FC<MarketplaceHubViewProps> = ({ onSpeak }) => {
  const [activeSection, setActiveSection] = useState<'MARKETPLACE' | 'ACADEMY' | 'RETROFIT' | 'PROCUREMENT' | 'BUSINESS_MODELS'>('MARKETPLACE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [purchasedProducts, setPurchasedProducts] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Retrofit comparison case
  const retrofitCase = RETROFIT_SIMULATION_CASES[0];

  const handlePurchaseOrDeploy = (product: MarketplaceProduct) => {
    setPurchasedProducts((prev) => new Set(prev).add(product.id));
    setToastMessage(`Deployed [${product.title}] directly into J.A.R.V.I.S. runtime.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredProducts =
    selectedCategory === 'ALL'
      ? MARKETPLACE_PRODUCTS
      : MARKETPLACE_PRODUCTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] text-[#f5f4f0] overflow-y-auto font-sans">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-[#09101c]/90 border-b border-[#00e5ff]/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#d4ff00]/10 border border-[#d4ff00]/40 flex items-center justify-center shadow-[0_0_15px_rgba(212,255,0,0.3)]">
            <ShoppingBag className="w-5 h-5 text-[#d4ff00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wide font-mono-tech text-[#f5f4f0]">
                ARCHOS ECOSYSTEM & MARKETPLACE
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#d4ff00]/20 text-[#d4ff00] border border-[#d4ff00]/40">
                MODULES 3 - 8 · EXPANSION SUITE
              </span>
            </div>
            <p className="text-xs text-[#8e8d88] font-mono-tech">
              Intelligence Marketplace · Academy & Certification · Legacy Retrofit · 6 Business Models
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 bg-[#050811] p-1 rounded-lg border border-[#00e5ff]/20">
          <button
            onClick={() => setActiveSection('MARKETPLACE')}
            className={`px-3 py-1 rounded text-xs font-mono-tech transition-all flex items-center gap-1.5 ${
              activeSection === 'MARKETPLACE'
                ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/50'
                : 'text-[#8e8d88] hover:text-[#f5f4f0]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>MARKETPLACE</span>
          </button>
          <button
            onClick={() => setActiveSection('ACADEMY')}
            className={`px-3 py-1 rounded text-xs font-mono-tech transition-all flex items-center gap-1.5 ${
              activeSection === 'ACADEMY'
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/50'
                : 'text-[#8e8d88] hover:text-[#f5f4f0]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>ACADEMY</span>
          </button>
          <button
            onClick={() => setActiveSection('RETROFIT')}
            className={`px-3 py-1 rounded text-xs font-mono-tech transition-all flex items-center gap-1.5 ${
              activeSection === 'RETROFIT'
                ? 'bg-[#d4ff00]/20 text-[#d4ff00] border border-[#d4ff00]/50'
                : 'text-[#8e8d88] hover:text-[#f5f4f0]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>LEGACY RETROFIT</span>
          </button>
          <button
            onClick={() => setActiveSection('PROCUREMENT')}
            className={`px-3 py-1 rounded text-xs font-mono-tech transition-all flex items-center gap-1.5 ${
              activeSection === 'PROCUREMENT'
                ? 'bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/50'
                : 'text-[#8e8d88] hover:text-[#f5f4f0]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PROCUREMENT</span>
          </button>
          <button
            onClick={() => setActiveSection('BUSINESS_MODELS')}
            className={`px-3 py-1 rounded text-xs font-mono-tech transition-all flex items-center gap-1.5 ${
              activeSection === 'BUSINESS_MODELS'
                ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/50'
                : 'text-[#8e8d88] hover:text-[#f5f4f0]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>6 BUSINESS MODELS</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-[#d4ff00]/15 border border-[#d4ff00]/60 text-xs font-mono-tech text-[#d4ff00] flex items-center justify-between shadow-[0_0_15px_rgba(212,255,0,0.3)] animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#d4ff00]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[#8e8d88] hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Content Areas */}
      <div className="p-6 space-y-6">
        {/* ========================================================================= */}
        {/* SECTION 1: ARCHOS MARKETPLACE */}
        {/* ========================================================================= */}
        {activeSection === 'MARKETPLACE' && (
          <div className="space-y-6">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'INTELLIGENCE_PRODUCTS', 'DESIGN_TEMPLATES', 'AGENT_MARKETPLACE', 'SIMULATION_PACKAGES', 'DATA_PRODUCTS'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono-tech transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/60 shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                      : 'bg-[#09101c] text-[#8e8d88] border border-[#00e5ff]/15 hover:text-white'
                  }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((prod) => {
                const isPurchased = purchasedProducts.has(prod.id);
                return (
                  <div
                    key={prod.id}
                    className="p-5 rounded-xl bg-[#09101c] border border-[#00e5ff]/20 hover:border-[#00e5ff]/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30">
                          {prod.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono-tech text-[#d4ff00] font-bold">
                          ★ {prod.ratingScore} ({prod.reviewsCount})
                        </span>
                      </div>

                      <h3 className="text-sm font-bold font-mono-tech text-[#f5f4f0] group-hover:text-[#00e5ff] transition-colors leading-snug">
                        {prod.title}
                      </h3>

                      <p className="text-xs text-[#cbd5e1] leading-relaxed line-clamp-3">
                        {prod.summary}
                      </p>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono-tech text-[#8e8d88] block uppercase">Validated Capabilities:</span>
                        <div className="flex flex-wrap gap-1">
                          {prod.capabilities.map((cap, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-[#050811] text-[9px] font-mono-tech text-[#8e8d88] border border-[#00e5ff]/10">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#00e5ff]/15 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono-tech text-[#8e8d88] block">Price ({prod.pricingModel.replace(/_/g, ' ')})</span>
                        <span className="text-base font-bold font-mono-tech text-[#d4ff00]">
                          {(prod.priceAed ?? 0).toLocaleString()} AED
                        </span>
                      </div>

                      <button
                        onClick={() => handlePurchaseOrDeploy(prod)}
                        disabled={isPurchased}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tech font-bold transition-all flex items-center gap-1.5 ${
                          isPurchased
                            ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                            : 'bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                        }`}
                      >
                        {isPurchased ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                        <span>{isPurchased ? 'DEPLOYED' : 'ACQUIRE & DEPLOY'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: ARCHOS ACADEMY & CERTIFICATION */}
        {/* ========================================================================= */}
        {activeSection === 'ACADEMY' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-[#09101c] border border-[#10b981]/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#f5f4f0] font-mono-tech flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#10b981]" />
                    ARCHOS ACADEMY & SOVEREIGN CERTIFICATION PROGRAM
                  </h2>
                  <p className="text-xs text-[#8e8d88] font-mono-tech">
                    Official UAE digital-twin curriculum, practitioner certifications, and institutional memory repositories
                  </p>
                </div>
                <span className="px-3 py-1 rounded bg-[#10b981]/15 text-[#10b981] text-xs font-mono-tech font-bold border border-[#10b981]/30">
                  5,730+ CERTIFIED PRACTITIONERS
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-3">
                {ACADEMY_MODULES.map((mod) => (
                  <div key={mod.id} className="p-5 rounded-xl bg-[#050811] border border-[#10b981]/25 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                          {mod.level.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono-tech text-[#8e8d88]">{mod.durationHours} Hours</span>
                      </div>

                      <h3 className="text-sm font-bold font-mono-tech text-[#f5f4f0]">{mod.title}</h3>
                      <p className="text-xs text-[#cbd5e1]">{mod.description}</p>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono-tech text-[#10b981] font-bold block uppercase">Curriculum Modules:</span>
                        <ul className="space-y-1 text-xs text-[#94a3b8]">
                          {mod.curriculum.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#10b981]">▸</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 rounded bg-[#09101c] border border-[#10b981]/15 text-[10px] font-mono-tech text-[#8e8d88]">
                        <strong className="text-white block mb-0.5">Credential Conferred:</strong>
                        {mod.certificationCredential} (Passing: {mod.examPassingScore}%)
                      </div>
                    </div>

                    <button className="w-full py-2 rounded-lg bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] text-xs font-mono-tech font-bold border border-[#10b981]/40 transition-all flex items-center justify-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> ENROLL PRACTITIONER SEAT
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: LEGACY RETROFIT INTELLIGENCE */}
        {/* ========================================================================= */}
        {activeSection === 'RETROFIT' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-[#09101c] border border-[#d4ff00]/30 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#f5f4f0] font-mono-tech flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-[#d4ff00]" />
                    ARCHOS LEGACY — SCAN & RETROFIT SIMULATION
                  </h2>
                  <p className="text-xs text-[#8e8d88] font-mono-tech">
                    LiDAR point cloud scan reconstruction, before/after thermal performance modeling, and net asset appreciation
                  </p>
                </div>
                <div className="text-right font-mono-tech text-xs">
                  <span className="text-[#8e8d88] block">Asset Under Analysis:</span>
                  <span className="text-sm font-bold text-[#00e5ff]">{retrofitCase.assetName}</span>
                </div>
              </div>

              {/* Before vs After Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before Retrofit */}
                <div className="p-5 rounded-xl bg-[#050811] border border-[#ef4444]/30 space-y-3">
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono-tech font-bold bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40">
                    BASELINE AS-IS (YEAR {retrofitCase.originalYearBuilt})
                  </span>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 rounded bg-[#09101c] border border-[#ef4444]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Pulse Vitality</span>
                      <span className="text-lg font-bold font-mono-tech text-[#ef4444]">{retrofitCase.beforeRetrofit.pulseScore}/100</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#09101c] border border-[#ef4444]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Annual Energy</span>
                      <span className="text-lg font-bold font-mono-tech text-white">{(retrofitCase.beforeRetrofit.annualEnergyMwh ?? 0).toLocaleString()} MWh</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#09101c] border border-[#ef4444]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Carbon Footprint</span>
                      <span className="text-lg font-bold font-mono-tech text-[#ef4444]">{(retrofitCase.beforeRetrofit.annualCarbonTonnes ?? 0).toLocaleString()} tCO₂e</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#09101c] border border-[#ef4444]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Annual OPEX</span>
                      <span className="text-lg font-bold font-mono-tech text-white">{((retrofitCase.beforeRetrofit.annualOpexAed ?? 0) / 1000000).toFixed(2)}M AED</span>
                    </div>
                  </div>
                </div>

                {/* After Retrofit */}
                <div className="p-5 rounded-xl bg-[#050811] border border-[#10b981]/30 space-y-3">
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono-tech font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                    SIMULATED POST-RETROFIT
                  </span>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 rounded bg-[#09101c] border border-[#10b981]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Pulse Vitality</span>
                      <span className="text-lg font-bold font-mono-tech text-[#10b981]">{retrofitCase.afterRetrofit.pulseScore}/100 (+14 pts)</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#09101c] border border-[#10b981]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Annual Energy</span>
                      <span className="text-lg font-bold font-mono-tech text-[#10b981]">{(retrofitCase.afterRetrofit.annualEnergyMwh ?? 0).toLocaleString()} MWh (-35%)</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#09101c] border border-[#10b981]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Carbon Footprint</span>
                      <span className="text-lg font-bold font-mono-tech text-[#10b981]">{(retrofitCase.afterRetrofit.annualCarbonTonnes ?? 0).toLocaleString()} tCO₂e (-50%)</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#09101c] border border-[#10b981]/20">
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">Asset Appreciation</span>
                      <span className="text-lg font-bold font-mono-tech text-[#d4ff00]">+{((retrofitCase.afterRetrofit.assetValuationAed - retrofitCase.beforeRetrofit.assetValuationAed) / 1000000).toFixed(0)}M AED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retrofit Opportunities Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-mono-tech text-[#f5f4f0]">
                  IDENTIFIED RETROFIT INTERVENTIONS & PAYBACK PERIODS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {retrofitCase.retrofitOpportunities.map((opp) => (
                    <div key={opp.id} className="p-3.5 rounded-lg bg-[#050811] border border-[#d4ff00]/20 space-y-2">
                      <h4 className="text-xs font-bold font-mono-tech text-[#f5f4f0]">{opp.title}</h4>
                      <div className="space-y-1 text-[11px] font-mono-tech text-[#8e8d88]">
                        <div>CAPEX: <strong className="text-white">{(opp.capexAed / 1000).toFixed(0)}k AED</strong></div>
                        <div>Annual Savings: <strong className="text-[#10b981]">{(opp.annualOpexSavedAed / 1000).toFixed(0)}k AED</strong></div>
                        <div>CO₂ Cut: <strong className="text-[#10b981]">{opp.co2ReductionTonnesPerYear} t/yr</strong></div>
                        <div>Payback: <strong className="text-[#d4ff00]">{opp.paybackPeriodMonths} Months</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: PROCUREMENT NETWORK */}
        {/* ========================================================================= */}
        {activeSection === 'PROCUREMENT' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-[#09101c] border border-[#ec4899]/30 shadow-2xl space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#f5f4f0] font-mono-tech flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#ec4899]" />
                  ARCHOS PROCUREMENT NETWORK (EPD-VERIFIED LOW-CARBON MATERIALS)
                </h2>
                <p className="text-xs text-[#8e8d88] font-mono-tech">
                  Direct procurement link to sovereign UAE suppliers with verified Environmental Product Declarations (EPD)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {PROCUREMENT_MATERIALS.map((mat) => (
                  <div key={mat.id} className="p-4 rounded-xl bg-[#050811] border border-[#ec4899]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-[#ec4899]/20 text-[#ec4899]">
                        {mat.inventoryStatus.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono-tech text-[#8e8d88]">Lead: {mat.leadTimeDays}d</span>
                    </div>

                    <h3 className="text-xs font-bold font-mono-tech text-white">{mat.name}</h3>
                    <p className="text-[11px] text-[#8e8d88]">{mat.supplier} · {mat.location}</p>

                    <div className="p-2 rounded bg-[#09101c] text-xs font-mono-tech space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#8e8d88]">Embodied Carbon:</span>
                        <span className="text-[#10b981] font-bold">{mat.embodiedCarbonKgPerUnit} kgCO₂e / {mat.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e8d88]">Unit Price:</span>
                        <span className="text-[#d4ff00] font-bold">{mat.unitPriceAed} AED / {mat.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e8d88]">Recycled Content:</span>
                        <span className="text-[#00e5ff] font-bold">{mat.circularRecycledContentPercent}%</span>
                      </div>
                    </div>

                    <button className="w-full py-1.5 rounded bg-[#ec4899]/20 hover:bg-[#ec4899]/30 text-[#ec4899] text-xs font-mono-tech font-bold border border-[#ec4899]/40 transition-all flex items-center justify-center gap-1">
                      REQUEST SOVEREIGN RFQ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: 6 BUSINESS MODELS MATRIX */}
        {/* ========================================================================= */}
        {activeSection === 'BUSINESS_MODELS' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-[#09101c] border border-[#00e5ff]/30 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#f5f4f0] font-mono-tech flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#00e5ff]" />
                    ARCHOS 6 BUSINESS MODELS MATRIX
                  </h2>
                  <p className="text-xs text-[#8e8d88] font-mono-tech">
                    The complete economic architecture of the UAE AI Operating System
                  </p>
                </div>
                <div className="text-right font-mono-tech">
                  <span className="text-xs text-[#8e8d88] block">Projected Total Platform Run-Rate</span>
                  <span className="text-lg font-bold text-[#d4ff00]">1.02B AED / Year</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ARCHOS_BUSINESS_MODELS.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-5 rounded-xl bg-[#050811] border border-[#00e5ff]/25 flex flex-col justify-between space-y-4 hover:border-[#00e5ff]/50 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
                          {bm.id}
                        </span>
                        <span className="text-xs font-mono-tech text-[#d4ff00] font-bold">
                          {bm.projectedAnnualRevenueAed}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold font-mono-tech text-[#f5f4f0]">{bm.title}</h3>
                      <p className="text-xs text-[#cbd5e1] leading-relaxed">{bm.tagline}</p>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {bm.keyMetrics.map((kpi, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-[#09101c] border border-[#00e5ff]/10 text-center">
                            <span className="text-[8px] text-[#8e8d88] font-mono-tech block truncate">{kpi.label}</span>
                            <span className="text-[11px] font-bold font-mono-tech text-[#00e5ff]">{kpi.value}</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-[#94a3b8] leading-normal pt-1">
                        {bm.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#00e5ff]/15">
                      <span className="text-[10px] font-mono-tech text-[#d4ff00] block mb-1">Pricing Mechanic:</span>
                      <p className="text-[10px] text-[#8e8d88] font-mono-tech">{bm.pricingMechanic}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
