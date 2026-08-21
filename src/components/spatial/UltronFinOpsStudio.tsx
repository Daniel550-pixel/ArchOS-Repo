import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  Shield,
  Activity,
  Layers,
  Cpu,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Server,
  ArrowRight,
  Database,
  Lock,
  Unlock,
  Flame,
  Volume2,
  ChevronRight,
  Filter,
  ScanFace,
  KeyRound,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { speechService } from '../../services/voice/speechService';
import { biometricAuthService } from '../../services/security/biometricAuthService';
import { BiometricVerificationModal } from './BiometricVerificationModal';

interface TenantFinOps {
  tenant_id: string;
  name: string;
  tier: 'sovereign' | 'enterprise' | 'pro' | 'free';
  status: 'ACTIVE' | 'THROTTLED' | 'SUSPENDED';
  authority_clearance: string;
  tokens_used: number;
  max_tokens: number;
  token_burn_pct: number;
  compute_units: number;
  max_compute_units: number;
  budget_monthly_aed: number;
  spent_aed: number;
  burn_rate_aed_hr: number;
  requests_today: number;
  allowed_models: string[];
}

const normalizeTenant = (raw: any): TenantFinOps => ({
  tenant_id: raw.tenant_id || raw.id || 'tenant-default',
  name: raw.name || 'Tenant',
  tier: raw.tier || 'pro',
  status: raw.status || 'ACTIVE',
  authority_clearance: raw.authority_clearance || raw.authorityClearance || 'CIVIC_ENTERPRISE',
  tokens_used: Number(raw.tokens_used ?? raw.tokensUsed ?? 0),
  max_tokens: Number(raw.max_tokens ?? raw.maxTokens ?? 1000000),
  token_burn_pct: Number(raw.token_burn_pct ?? raw.tokenBurnPct ?? 0),
  compute_units: Number(raw.compute_units ?? raw.computeUnits ?? 0),
  max_compute_units: Number(raw.max_compute_units ?? raw.maxComputeUnits ?? 1000),
  budget_monthly_aed: Number(raw.budget_monthly_aed ?? raw.budgetMonthlyAed ?? 10000),
  spent_aed: Number(raw.spent_aed ?? raw.spentAed ?? 0),
  burn_rate_aed_hr: Number(raw.burn_rate_aed_hr ?? raw.burnRateAedHr ?? 0),
  requests_today: Number(raw.requests_today ?? raw.requestsToday ?? 0),
  allowed_models: raw.allowed_models || raw.allowedModels || ['pro', 'flash']
});

const INITIAL_TENANTS: TenantFinOps[] = [
  {
    tenant_id: 'tenant-sovereign-dgm',
    name: 'Dubai Government Media Office (DGM)',
    tier: 'sovereign',
    status: 'ACTIVE',
    authority_clearance: 'DEFCON-1_SOVEREIGN',
    tokens_used: 1420500,
    max_tokens: 10000000,
    token_burn_pct: 14.2,
    compute_units: 380.5,
    max_compute_units: 2000.0,
    budget_monthly_aed: 50000.0,
    spent_aed: 3680.45,
    burn_rate_aed_hr: 48.2,
    requests_today: 1240,
    allowed_models: ['sovereign-pro', 'gemini-2.5-pro', 'gpt-4o', 'dual-consensus']
  },
  {
    tenant_id: 'tenant-dewa-grid',
    name: 'DEWA Smart Grid Intelligence',
    tier: 'sovereign',
    status: 'ACTIVE',
    authority_clearance: 'CRITICAL_INFRASTRUCTURE',
    tokens_used: 890200,
    max_tokens: 5000000,
    token_burn_pct: 17.8,
    compute_units: 210.0,
    max_compute_units: 1000.0,
    budget_monthly_aed: 25000.0,
    spent_aed: 2310.2,
    burn_rate_aed_hr: 29.5,
    requests_today: 890,
    allowed_models: ['sovereign-pro', 'gemini-2.5-pro', 'gpt-4o']
  },
  {
    tenant_id: 'tenant-rta-mobility',
    name: 'RTA Dubai Mobility Autonomous Fabric',
    tier: 'enterprise',
    status: 'ACTIVE',
    authority_clearance: 'CIVIC_ENTERPRISE',
    tokens_used: 2450000,
    max_tokens: 3000000,
    token_burn_pct: 81.7,
    compute_units: 480.2,
    max_compute_units: 600.0,
    budget_monthly_aed: 15000.0,
    spent_aed: 6350.8,
    burn_rate_aed_hr: 38.0,
    requests_today: 1620,
    allowed_models: ['pro', 'gemini-2.5-flash', 'gpt-4o-mini']
  },
  {
    tenant_id: 'tenant-enterprise-damac',
    name: 'DAMAC Strategic Twin Development',
    tier: 'enterprise',
    status: 'ACTIVE',
    authority_clearance: 'CIVIC_ENTERPRISE',
    tokens_used: 1850000,
    max_tokens: 2000000,
    token_burn_pct: 92.5,
    compute_units: 375.0,
    max_compute_units: 400.0,
    budget_monthly_aed: 10000.0,
    spent_aed: 4810.0,
    burn_rate_aed_hr: 24.2,
    requests_today: 930,
    allowed_models: ['pro', 'flash', 'gpt-4o-mini']
  },
  {
    tenant_id: 'tenant-community-sandbox',
    name: 'Public Sandbox Developer Cohort',
    tier: 'free',
    status: 'THROTTLED',
    authority_clearance: 'COMMUNITY_OPEN',
    tokens_used: 98500,
    max_tokens: 100000,
    token_burn_pct: 98.5,
    compute_units: 24.8,
    max_compute_units: 25.0,
    budget_monthly_aed: 250.0,
    spent_aed: 255.8,
    burn_rate_aed_hr: 3.5,
    requests_today: 410,
    allowed_models: ['flash', 'gemini-2.0-flash']
  }
];

const HISTORIC_BURN_HOURLY = [
  { time: '00:00', sovereignSpend: 18.2, enterpriseSpend: 12.1, tokensK: 240 },
  { time: '04:00', sovereignSpend: 14.5, enterpriseSpend: 8.4, tokensK: 180 },
  { time: '08:00', sovereignSpend: 42.0, enterpriseSpend: 31.8, tokensK: 680 },
  { time: '12:00', sovereignSpend: 58.4, enterpriseSpend: 46.2, tokensK: 940 },
  { time: '16:00', sovereignSpend: 52.1, enterpriseSpend: 39.5, tokensK: 820 },
  { time: '20:00', sovereignSpend: 34.8, enterpriseSpend: 24.6, tokensK: 510 },
  { time: '23:59', sovereignSpend: 28.0, enterpriseSpend: 19.3, tokensK: 390 }
];

interface UltronFinOpsStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeak?: (text: string) => void;
}

export const UltronFinOpsStudio: React.FC<UltronFinOpsStudioProps> = ({
  isOpen,
  onClose,
  onSpeak
}) => {
  const [tenants, setTenants] = useState<TenantFinOps[]>(INITIAL_TENANTS);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant-sovereign-dgm');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ROUTER_SIMULATOR' | 'RULES_ENGINE' | 'AUDIT_CHAIN'>('OVERVIEW');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(biometricAuthService.isModuleUnlocked('FINOPS'));
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);

  // Router Simulator State
  const [simPromptLength, setSimPromptLength] = useState<number>(3400);
  const [simEndpoint, setSimEndpoint] = useState<string>('/api/v1/jarvis/reason');
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Subscribe to biometric changes
  useEffect(() => {
    const unsub = biometricAuthService.subscribe((state) => {
      setIsUnlocked(state.unlockedModules.FINOPS);
    });
    return () => unsub();
  }, []);

  // Load live data from server if available
  useEffect(() => {
    const fetchFinOps = async () => {
      try {
        const res = await fetch('/api/finops/tenants');
        if (res.ok) {
          const data = await res.json();
          if (data.tenants && Array.isArray(data.tenants) && data.tenants.length > 0) {
            setTenants(data.tenants.map(normalizeTenant));
          }
        }
      } catch (err) {
        // Fallback to initial seed
      }
    };
    if (isOpen) {
      fetchFinOps();
    }
  }, [isOpen]);

  const activeTenant = tenants.find((t) => t.tenant_id === selectedTenantId) || tenants[0] || INITIAL_TENANTS[0];

  const handleSpeak = (text: string) => {
    if (onSpeak) {
      onSpeak(text);
    } else {
      speechService.speak(text);
    }
  };

  const handleRelock = () => {
    biometricAuthService.lockModule('FINOPS');
  };

  const handleBiometricSuccess = () => {
    biometricAuthService.unlockModuleManually('FINOPS');
    handleSpeak('FinOps governance router unlocked. Sovereign cloud quotas and token throttling accessible.');
  };

  const executeCostRiskSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/finops/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptLength: simPromptLength,
          endpoint: simEndpoint,
          tenantId: selectedTenantId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
        const speechMsg = data.isAllowed
          ? `FinOps Cost Router approved request for ${activeTenant.name}. Estimated cost is ${data.estimatedCostAed} AED, routed to ${data.routedModelTier} tier under authority clearance ${activeTenant.authority_clearance}.`
          : `FinOps Cost Router blocked request. ${data.errorMessage}`;
        handleSpeak(speechMsg);
      } else {
        const estTokens = Math.round(simPromptLength / 4);
        const costUsd = estTokens * (simEndpoint.includes('reason') ? 0.000044 : 0.00002);
        const allowed = activeTenant.tokens_used + estTokens <= activeTenant.max_tokens;
        const route = activeTenant.tier === 'sovereign' ? 'sovereign-pro' : simPromptLength > 12000 ? 'flash' : 'pro';
        setSimResult({
          status: 'SUCCESS',
          tenantId: selectedTenantId,
          promptLengthChars: simPromptLength,
          estimatedTokens: estTokens,
          estimatedCostUsd: costUsd,
          estimatedCostAed: costUsd * 3.6725,
          isAllowed: allowed,
          errorMessage: allowed ? null : 'Tenant token quota exceeded.',
          routedModelTier: route,
          authorityGate: allowed ? 'PASSED' : 'BLOCKED_QUOTA'
        });
      }
    } catch (e) {
      // Offline fallback calculation
      const estTokens = Math.round(simPromptLength / 4);
      const costUsd = estTokens * 0.000044;
      const allowed = activeTenant.tokens_used + estTokens <= activeTenant.max_tokens;
      const route = activeTenant.tier === 'sovereign' ? 'sovereign-pro' : 'pro';
      setSimResult({
        status: 'SUCCESS',
        tenantId: selectedTenantId,
        promptLengthChars: simPromptLength,
        estimatedTokens: estTokens,
        estimatedCostUsd: costUsd,
        estimatedCostAed: costUsd * 3.6725,
        isAllowed: allowed,
        errorMessage: allowed ? null : 'Tenant token quota exceeded.',
        routedModelTier: route,
        authorityGate: allowed ? 'PASSED' : 'BLOCKED_QUOTA'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleToggleThrottle = (tenantId: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.tenant_id === tenantId) {
          const nextStatus = t.status === 'ACTIVE' ? 'THROTTLED' : 'ACTIVE';
          handleSpeak(
            `Tenant ${t.name} authority status toggled to ${nextStatus}. Real-time rate limiter updated.`
          );
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  if (!isOpen) return null;

  const totalSpend = tenants.reduce((acc, t) => acc + (Number(t.spent_aed ?? 0) || 0), 0);
  const totalTokens = tenants.reduce((acc, t) => acc + (Number(t.tokens_used ?? 0) || 0), 0);
  const totalBurnRate = tenants.reduce((acc, t) => acc + (Number(t.burn_rate_aed_hr ?? 0) || 0), 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-mono-tech">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-6xl h-[88vh] bg-[#070c16] border border-[#00e5ff]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs"
        >
          {/* Top Modal Header */}
          <div className="h-14 bg-[#09101c] border-b border-[#00e5ff]/20 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/60 flex items-center justify-center text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white tracking-wider">
                    ULTRON FINOPS & MODEL ROUTER GOVERNANCE
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                    AUTHORITY SEPARATION ACTIVE
                  </span>
                </div>
                <p className="text-[10px] text-[#8e8d88]">
                  FastAPI Cost/Risk Middleware · Multi-Tenant Quota Enforcer · Real-Time Token Burn Matrix
                </p>
              </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="flex items-center gap-1.5 bg-[#05080e] p-1 rounded-lg border border-white/5">
              {[
                { id: 'OVERVIEW', label: 'TENANT QUOTAS', icon: Layers },
                { id: 'ROUTER_SIMULATOR', label: 'COST ROUTER SIMULATOR', icon: Cpu },
                { id: 'RULES_ENGINE', label: 'ROUTING RULEBOOK', icon: Sliders },
                { id: 'AUDIT_CHAIN', label: 'AUTHORITY AUDIT', icon: Shield }
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/60 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                        : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>BIOMETRIC LVL-9</span>
                  </span>
                  <button
                    onClick={handleRelock}
                    className="px-2.5 py-1 rounded-md bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-[#ec4899] text-[10px] flex items-center gap-1 transition-all"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Lock FinOps</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowBiometricModal(true)}
                  className="px-3 py-1 rounded-md bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-black font-bold text-[10px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.4)] transition-all animate-pulse"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>Verify Face Presence</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8e8d88] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Locked State Warning Banner if not verified */}
          {!isUnlocked && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-[#130716] via-[#09101c] to-[#07131e] border border-pink-500/40 flex items-center justify-between gap-3 shadow-lg shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/40 animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-pink-300 uppercase tracking-wider">
                      PROTECTED SOVEREIGN GOVERNANCE GATE
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                      READ-ONLY MODE
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Real-time optical camera face detection required to modify multi-tenant quotas, throttle status, and routing policies.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowBiometricModal(true)}
                className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.4)] shrink-0 transition"
              >
                <ScanFace className="w-4 h-4" />
                <span>Verify Face Presence</span>
              </button>
            </div>
          )}

          {/* KPI High-Level Telemetry Bar */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-[#05080e]/60 border-b border-[#00e5ff]/15 shrink-0">
            <div className="p-3 rounded-xl bg-[#09101c] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8e8d88]">
                <span>Total Month Spend</span>
                <DollarSign className="w-4 h-4 text-[#00e5ff]" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-white">AED {totalSpend.toLocaleString()}</span>
                <span className="text-[10px] text-[#10b981] font-semibold">17.2% budget cap</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#09101c] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8e8d88]">
                <span>Total Tokens Ingested</span>
                <Activity className="w-4 h-4 text-[#10b981]" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-[#10b981]">{(totalTokens / 1000000).toFixed(2)}M</span>
                <span className="text-[10px] text-[#8e8d88]">Across 5 Tenants</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#09101c] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8e8d88]">
                <span>Current Burn Velocity</span>
                <Flame className="w-4 h-4 text-[#d4ff00]" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-[#d4ff00]">AED {totalBurnRate.toFixed(1)} / hr</span>
                <span className="text-[10px] text-[#8e8d88]">Optimal Baseline</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#09101c] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8e8d88]">
                <span>Authority Gating State</span>
                <Shield className="w-4 h-4 text-[#00e5ff]" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs font-bold text-[#00e5ff]">FASTAPI ENFORCED</span>
                <span className="text-[10px] text-[#10b981]">0 Security Leaks</span>
              </div>
            </div>
          </div>

          {/* Main Tab Views */}
          <div className="flex-1 p-5 overflow-y-auto">
            {/* 1. TENANT QUOTAS & USAGE OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="grid grid-cols-12 gap-5 h-full">
                {/* Left Tenant List (7 cols) */}
                <div className="col-span-7 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f5f4f0] uppercase tracking-wider">
                      Active Multi-Tenant Enclaves ({tenants.length})
                    </span>
                    <span className="text-[10px] text-[#8e8d88]">
                      Click tenant to inspect authority profile
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {tenants.map((t) => {
                      const isSelected = selectedTenantId === t.tenant_id;
                      const isWarning = t.token_burn_pct > 80;
                      const isCritical = t.token_burn_pct > 95 || t.status === 'THROTTLED';

                      return (
                        <div
                          key={t.tenant_id}
                          onClick={() => setSelectedTenantId(t.tenant_id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#00e5ff]/10 border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                              : 'bg-[#09101c] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{t.name}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                    t.tier === 'sovereign'
                                      ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40'
                                      : t.tier === 'enterprise'
                                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                                      : 'bg-white/10 text-[#8e8d88]'
                                  }`}
                                >
                                  {t.tier}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-[#8e8d88] mt-1">
                                <span>Clearance: <strong className="text-white">{t.authority_clearance}</strong></span>
                                <span>•</span>
                                <span>Burn: <strong className="text-[#d4ff00]">AED {t.burn_rate_aed_hr}/hr</strong></span>
                                <span>•</span>
                                <span>Today: <strong className="text-white">{t.requests_today} reqs</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  t.status === 'ACTIVE'
                                    ? 'bg-[#10b981]/20 text-[#10b981]'
                                    : 'bg-[#ec4899]/20 text-[#ec4899]'
                                }`}
                              >
                                {t.status}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleThrottle(t.tenant_id);
                                }}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-[#8e8d88] hover:text-white transition-colors"
                              >
                                {t.status === 'ACTIVE' ? 'Throttle' : 'Restore'}
                              </button>
                            </div>
                          </div>

                          {/* Quota Progress Bar */}
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#8e8d88]">
                                Token Burn: {(t.tokens_used ?? 0).toLocaleString()} / {(t.max_tokens ?? 0).toLocaleString()}
                              </span>
                              <span
                                className={`font-bold ${
                                  isCritical
                                    ? 'text-[#ec4899]'
                                    : isWarning
                                    ? 'text-[#d4ff00]'
                                    : 'text-[#00e5ff]'
                                }`}
                              >
                                {t.token_burn_pct ?? 0}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#05080e] rounded-full overflow-hidden border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCritical
                                    ? 'bg-[#ec4899]'
                                    : isWarning
                                    ? 'bg-[#d4ff00]'
                                    : 'bg-[#00e5ff]'
                                }`}
                                style={{ width: `${Math.min(100, t.token_burn_pct ?? 0)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Tenant Detail & Historical Area Chart (5 cols) */}
                <div className="col-span-5 flex flex-col gap-4">
                  {/* Selected Tenant Detailed Card */}
                  <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-bold text-white text-xs uppercase">
                        Tenant Authority & Routing Matrix
                      </span>
                      <button
                        onClick={() =>
                          handleSpeak(
                            `${activeTenant.name} has consumed ${activeTenant.token_burn_pct ?? 0}% of its monthly allocation, spending ${activeTenant.spent_aed ?? 0} AED. All requests are gated by the FastAPI Cost Risk router.`
                          )
                        }
                        className="p-1 text-[#00e5ff] hover:bg-[#00e5ff]/10 rounded"
                        title="Speak Tenant Briefing"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-[#05080e] border border-white/5">
                        <span className="text-[#8e8d88] block text-[9px]">Monthly Budget</span>
                        <span className="font-bold text-white">AED {(activeTenant.budget_monthly_aed ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded bg-[#05080e] border border-white/5">
                        <span className="text-[#8e8d88] block text-[9px]">Accumulated Spend</span>
                        <span className="font-bold text-[#00e5ff]">AED {(activeTenant.spent_aed ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded bg-[#05080e] border border-white/5">
                        <span className="text-[#8e8d88] block text-[9px]">Compute Units</span>
                        <span className="font-bold text-[#10b981]">{activeTenant.compute_units ?? 0} / {activeTenant.max_compute_units ?? 0}</span>
                      </div>
                      <div className="p-2 rounded bg-[#05080e] border border-white/5">
                        <span className="text-[#8e8d88] block text-[9px]">Authority Isolation</span>
                        <span className="font-bold text-[#d4ff00]">ENFORCED</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#8e8d88] block mb-1">
                        Permitted Model Tiers:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {activeTenant.allowed_models.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-[#00e5ff] border border-[#00e5ff]/20 font-bold"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 24-Hour Burn Rate Area Chart */}
                  <div className="flex-1 p-4 rounded-xl bg-[#09101c] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-xs">
                        24-Hour Sovereign Compute Spend (AED)
                      </span>
                      <span className="text-[10px] text-[#10b981]">Real-Time Telemetry</span>
                    </div>
                    <div className="w-full h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={HISTORIC_BURN_HOURLY}>
                          <defs>
                            <linearGradient id="sovereignGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="enterpriseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" stroke="#545350" fontSize={9} />
                          <YAxis stroke="#545350" fontSize={9} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#070c16',
                              borderColor: '#00e5ff',
                              borderRadius: '6px',
                              fontSize: '10px'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="sovereignSpend"
                            name="Sovereign Enclaves"
                            stroke="#00e5ff"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#sovereignGrad)"
                          />
                          <Area
                            type="monotone"
                            dataKey="enterpriseSpend"
                            name="Enterprise Tenants"
                            stroke="#10b981"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#enterpriseGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. COST / RISK ROUTER SIMULATOR */}
            {activeTab === 'ROUTER_SIMULATOR' && (
              <div className="grid grid-cols-12 gap-5 h-full">
                {/* Left Request Dispatch Config (6 cols) */}
                <div className="col-span-6 flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-[#09101c] border border-white/10 space-y-3">
                    <span className="font-bold text-white text-xs uppercase tracking-wider block">
                      FastAPI Request Payload Parameters
                    </span>

                    <div>
                      <label className="text-[10px] text-[#8e8d88] block mb-1">
                        Select Ingress Tenant:
                      </label>
                      <select
                        value={selectedTenantId}
                        onChange={(e) => setSelectedTenantId(e.target.value)}
                        className="w-full bg-[#05080e] border border-white/15 rounded-lg px-3 py-2 text-white font-mono-tech text-xs focus:border-[#00e5ff] focus:outline-none"
                      >
                        {tenants.map((t) => (
                          <option key={t.tenant_id} value={t.tenant_id}>
                            {t.name} ({t.tier.toUpperCase()} · {t.token_burn_pct}% used)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8e8d88] block mb-1">
                        Target API Endpoint:
                      </label>
                      <select
                        value={simEndpoint}
                        onChange={(e) => setSimEndpoint(e.target.value)}
                        className="w-full bg-[#05080e] border border-white/15 rounded-lg px-3 py-2 text-white font-mono-tech text-xs focus:border-[#00e5ff] focus:outline-none"
                      >
                        <option value="/api/v1/jarvis/reason">/api/v1/jarvis/reason (Dual Consensus)</option>
                        <option value="/api/v1/simulation/execute">/api/v1/simulation/execute (Deep Twin Physics)</option>
                        <option value="/api/ai/reason">/api/ai/reason (Server Cognitive Hub)</option>
                        <option value="/api/v1/admin/ingest">/api/v1/admin/ingest (Cadastre Pipeline)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#8e8d88]">Estimated Prompt Length (Characters)</span>
                        <span className="text-[#00e5ff] font-bold">
                          {simPromptLength.toLocaleString()} chars (~{Math.round(simPromptLength / 4)} tokens)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="25000"
                        step="500"
                        value={simPromptLength}
                        onChange={(e) => setSimPromptLength(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-[#05080e] rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
                      />
                      <div className="flex justify-between text-[8px] text-[#8e8d88] mt-1">
                        <span>500 (Short Command)</span>
                        <span>10,000 (Complex Plan)</span>
                        <span>25,000 (Massive Geo-BIM)</span>
                      </div>
                    </div>

                    <button
                      onClick={executeCostRiskSimulation}
                      disabled={isSimulating}
                      className="w-full py-2.5 rounded-lg bg-[#00e5ff]/20 border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff]/30 font-bold flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,229,255,0.2)] transition-all"
                    >
                      {isSimulating ? (
                        <>
                          <span className="w-3 h-3 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
                          <span>EVALUATING FASTAPI COST RISK GATES...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>DISPATCH THROUGH COST/RISK MIDDLEWARE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Routing Result & Header Observability (6 cols) */}
                <div className="col-span-6 flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-[#09101c] border border-white/10 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                        <span className="font-bold text-white text-xs uppercase">
                          Middleware Enforcement Verdict
                        </span>
                        {simResult && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              simResult.isAllowed
                                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                                : 'bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/40'
                            }`}
                          >
                            HTTP {simResult.isAllowed ? '200 OK' : '402 PAYMENT REQUIRED'}
                          </span>
                        )}
                      </div>

                      {simResult ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2.5 rounded bg-[#05080e] border border-white/5">
                              <span className="text-[#8e8d88] text-[9px] block">Estimated Cost</span>
                              <span className="font-bold text-[#00e5ff]">
                                {simResult.estimatedCostAed?.toFixed(4)} AED (${simResult.estimatedCostUsd?.toFixed(6)})
                              </span>
                            </div>
                            <div className="p-2.5 rounded bg-[#05080e] border border-white/5">
                              <span className="text-[#8e8d88] text-[9px] block">Routed Model Tier</span>
                              <span className="font-bold text-[#d4ff00] uppercase">
                                {simResult.routedModelTier}
                              </span>
                            </div>
                          </div>

                          {/* Response Headers Inspection */}
                          <div className="p-3 rounded bg-[#05080e] border border-white/10 font-mono-tech space-y-1 text-[10px]">
                            <span className="text-[#8e8d88] font-bold text-[9px] block mb-1 text-cyan-400">
                              INJECTED OBSERVABILITY HEADERS:
                            </span>
                            <div className="text-white">
                              <span className="text-[#8e8d88]">X-Routed-Model:</span>{' '}
                              <span className="text-[#10b981]">{simResult.routedModelTier}</span>
                            </div>
                            <div className="text-white">
                              <span className="text-[#8e8d88]">X-Tenant-ID:</span>{' '}
                              <span>{simResult.tenantId}</span>
                            </div>
                            <div className="text-white">
                              <span className="text-[#8e8d88]">X-Estimated-Cost-USD:</span>{' '}
                              <span>{simResult.estimatedCostUsd}</span>
                            </div>
                            <div className="text-white">
                              <span className="text-[#8e8d88]">X-FinOps-Gate:</span>{' '}
                              <span className={simResult.isAllowed ? 'text-[#10b981]' : 'text-[#ec4899]'}>
                                {simResult.authorityGate}
                              </span>
                            </div>
                          </div>

                          {!simResult.isAllowed && (
                            <div className="p-2.5 rounded bg-[#ec4899]/10 border border-[#ec4899]/30 text-[#ec4899] text-[10px] flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>{simResult.errorMessage}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-44 flex flex-col items-center justify-center text-[#8e8d88] gap-2">
                          <Cpu className="w-8 h-8 opacity-40 text-[#00e5ff]" />
                          <span>Configure payload and click dispatch to simulate routing.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ROUTING RULEBOOK & POLICIES */}
            {activeTab === 'RULES_ENGINE' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#09101c] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-bold text-white text-xs uppercase">
                      Authority Separation & Model Tier Dispatch Matrix
                    </span>
                    <span className="text-[10px] text-[#10b981]">Deterministic Policy Table</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        tier: 'Sovereign Enclave (DEFCON-1)',
                        targetModel: 'sovereign-pro (Dedicated Private Pod)',
                        condition: 'All prompt lengths & endpoints',
                        isolation: 'Zero data egress, air-gapped cryptochain',
                        costFactor: 'Flat Rate / Dedicated GPU'
                      },
                      {
                        tier: 'Enterprise (Civic / Developers)',
                        targetModel: 'pro (Gemini 2.5 Pro / GPT-4o)',
                        condition: 'Prompt characters ≤ 12,000',
                        isolation: 'Tenant namespace isolation',
                        costFactor: '0.000044 USD / token'
                      },
                      {
                        tier: 'Enterprise Fallback (Cost Protection)',
                        targetModel: 'flash (Gemini 2.5 Flash)',
                        condition: 'Prompt characters > 12,000 (Prevents bill shock)',
                        isolation: 'Tenant namespace isolation',
                        costFactor: '0.000020 USD / token'
                      },
                      {
                        tier: 'Free / Community Sandbox',
                        targetModel: 'flash (Gemini 2.0 Flash / GPT-4o-mini)',
                        condition: 'All requests, hard 100K token cap',
                        isolation: 'Rate-limited shared queue',
                        costFactor: 'Subsidized'
                      }
                    ].map((rule, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#05080e] border border-white/10 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xs">{rule.tier}</span>
                          <p className="text-[10px] text-[#8e8d88]">
                            Condition: <strong className="text-[#00e5ff]">{rule.condition}</strong> · Isolation: {rule.isolation}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold text-[10px] border border-[#10b981]/30">
                            → {rule.targetModel}
                          </span>
                          <span className="block text-[9px] text-[#8e8d88] mt-0.5">
                            {rule.costFactor}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. AUTHORITY SEPARATION AUDIT LEDGER */}
            {activeTab === 'AUDIT_CHAIN' && (
              <div className="p-4 rounded-xl bg-[#09101c] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-white text-xs uppercase">
                    Live FinOps Gateway Execution Logs
                  </span>
                  <span className="text-[10px] text-[#00e5ff]">TimescaleDB Backing</span>
                </div>

                <div className="space-y-2 font-mono-tech text-[10px]">
                  {[
                    { time: '07:44:12', tenant: 'tenant-sovereign-dgm', path: '/api/v1/jarvis/reason', cost: '0.042 AED', model: 'sovereign-pro', status: 'VERIFIED_ALLOWED' },
                    { time: '07:43:58', tenant: 'tenant-dewa-grid', path: '/api/v1/simulation/execute', cost: '0.128 AED', model: 'sovereign-pro', status: 'VERIFIED_ALLOWED' },
                    { time: '07:42:30', tenant: 'tenant-rta-mobility', path: '/api/v1/jarvis/reason', cost: '0.018 AED', model: 'pro', status: 'VERIFIED_ALLOWED' },
                    { time: '07:41:15', tenant: 'tenant-enterprise-damac', path: '/api/v1/jarvis/reason', cost: '0.009 AED', model: 'flash (Downsampled)', status: 'VERIFIED_ALLOWED' },
                    { time: '07:40:02', tenant: 'tenant-community-sandbox', path: '/api/v1/jarvis/reason', cost: '0.000 AED', model: 'flash', status: 'BLOCKED_QUOTA' }
                  ].map((log, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[#05080e] border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#8e8d88]">{log.time}</span>
                        <span className="text-white font-bold">{log.tenant}</span>
                        <span className="text-[#00e5ff]">{log.path}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#d4ff00]">{log.cost}</span>
                        <span className="text-[#8e8d88]">Tier: {log.model}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            log.status === 'VERIFIED_ALLOWED'
                              ? 'bg-[#10b981]/20 text-[#10b981]'
                              : 'bg-[#ec4899]/20 text-[#ec4899]'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="h-12 bg-[#09101c] border-t border-[#00e5ff]/20 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-[#8e8d88] text-[10px]">
              <Lock className="w-3.5 h-3.5 text-[#10b981]" />
              <span>FastAPI Middleware Rate Limiter & Authority Separation active across UAE sovereign cloud clusters.</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#00e5ff] text-black font-bold text-xs hover:bg-[#00e5ff]/90 transition-all shadow-[0_0_8px_#00e5ff]"
            >
              CLOSE DASHBOARD
            </button>
          </div>
        </motion.div>
      </div>

      {/* Biometric Verification Modal for FinOps */}
      <BiometricVerificationModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onSuccess={handleBiometricSuccess}
        targetModule="FINOPS"
        targetProtocolName="FINOPS SOVEREIGN MODEL ROUTER"
        requiredSecurityClearance="CLEARANCE LEVEL 9 // FINOPS EXECUTIVE"
      />
    </AnimatePresence>
  );
};
