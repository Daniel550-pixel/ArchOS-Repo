import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Coins,
  TrendingUp,
  Cpu,
  Shield,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Volume2,
  ArrowUpRight,
  Filter,
  BarChart3,
  Server,
  Lock,
  Play,
  Download,
  Key
} from 'lucide-react';
import { QuantumEncryptionVisualizer } from '../spatial/QuantumEncryptionVisualizer';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export interface TenantFinOpsItem {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise' | 'sovereign';
  status: 'ACTIVE' | 'THROTTLED' | 'SUSPENDED';
  authorityClearance: string;
  tokensUsed: number;
  maxTokens: number;
  tokenBurnPct: number;
  computeUnits: number;
  maxComputeUnits: number;
  budgetMonthlyAed: number;
  spentAed: number;
  burnRateAedHr: number;
  requestsToday: number;
  allowedModels: string[];
}

export interface FinOpsTimeseriesPoint {
  day: number;
  date: string;
  isForecast: boolean;
  totalTokens: number;
  totalSpendAed: number;
  totalComputeUnits: number;
  tenantBreakdown: Record<string, { tokens: number; spendAed: number; compute: number }>;
}

export interface FinOpsSummary {
  totalBudgetAed: number;
  currentTotalSpentAed: number;
  forecastedTotalSpentAed: number;
  budgetBurnPercent: number;
  forecastOverbudget: boolean;
  totalTokensAllocated: number;
  totalTokensBurned: number;
  totalComputeUnits: number;
  maxComputeUnits: number;
  burnRateAedHr: number;
  requestsToday: number;
}

interface FinOpsDashboardViewProps {
  onSpeak?: (text: string) => void;
}

const DEFAULT_TENANTS: TenantFinOpsItem[] = [
  {
    id: 'tenant-sovereign-dgm',
    name: 'Dubai Government Media Office (DGM)',
    tier: 'sovereign',
    status: 'ACTIVE',
    authorityClearance: 'DEFCON-1_SOVEREIGN',
    tokensUsed: 1420500,
    maxTokens: 10000000,
    tokenBurnPct: 14.2,
    computeUnits: 380.5,
    maxComputeUnits: 2000.0,
    budgetMonthlyAed: 50000.0,
    spentAed: 103.7,
    burnRateAedHr: 48.2,
    requestsToday: 1240,
    allowedModels: ['sovereign-pro', 'gemini-2.5-pro', 'gpt-4o', 'dual-consensus']
  },
  {
    id: 'tenant-dewa-grid',
    name: 'DEWA Smart Grid Intelligence',
    tier: 'sovereign',
    status: 'ACTIVE',
    authorityClearance: 'CRITICAL_INFRASTRUCTURE',
    tokensUsed: 890200,
    maxTokens: 5000000,
    tokenBurnPct: 17.8,
    computeUnits: 210.0,
    maxComputeUnits: 1000.0,
    budgetMonthlyAed: 25000.0,
    spentAed: 64.98,
    burnRateAedHr: 29.5,
    requestsToday: 890,
    allowedModels: ['sovereign-pro', 'gemini-2.5-pro', 'gpt-4o']
  },
  {
    id: 'tenant-rta-mobility',
    name: 'RTA Dubai Mobility Autonomous Fabric',
    tier: 'enterprise',
    status: 'ACTIVE',
    authorityClearance: 'CIVIC_ENTERPRISE',
    tokensUsed: 540000,
    maxTokens: 3000000,
    tokenBurnPct: 18.0,
    computeUnits: 140.2,
    maxComputeUnits: 600.0,
    budgetMonthlyAed: 15000.0,
    spentAed: 39.42,
    burnRateAedHr: 18.0,
    requestsToday: 620,
    allowedModels: ['pro', 'gemini-2.5-flash', 'gpt-4o-mini']
  },
  {
    id: 'tenant-enterprise-damac',
    name: 'DAMAC Strategic Twin Development',
    tier: 'enterprise',
    status: 'ACTIVE',
    authorityClearance: 'CIVIC_ENTERPRISE',
    tokensUsed: 412000,
    maxTokens: 2000000,
    tokenBurnPct: 20.6,
    computeUnits: 95.0,
    maxComputeUnits: 400.0,
    budgetMonthlyAed: 10000.0,
    spentAed: 30.08,
    burnRateAedHr: 14.2,
    requestsToday: 430,
    allowedModels: ['pro', 'flash', 'gpt-4o-mini']
  },
  {
    id: 'tenant-community-sandbox',
    name: 'Public Sandbox Developer Cohort',
    tier: 'free',
    status: 'ACTIVE',
    authorityClearance: 'COMMUNITY_OPEN',
    tokensUsed: 48000,
    maxTokens: 100000,
    tokenBurnPct: 48.0,
    computeUnits: 12.0,
    maxComputeUnits: 25.0,
    budgetMonthlyAed: 250.0,
    spentAed: 3.5,
    burnRateAedHr: 1.5,
    requestsToday: 85,
    allowedModels: ['flash', 'gemini-2.0-flash']
  }
];

const MODEL_COST_BENCHMARKS = [
  { model: 'Gemini 2.5 Flash', costPer1M: 0.28, latencyMs: 240, provider: 'Google AI Studio / Vertex' },
  { model: 'Gemini 2.5 Pro', costPer1M: 1.85, latencyMs: 650, provider: 'Google AI Studio / Vertex' },
  { model: 'OpenAI GPT-4o', costPer1M: 9.18, latencyMs: 820, provider: 'OpenAI Enterprise' },
  { model: 'Sovereign Pro (Air-Gapped)', costPer1M: 0.12, latencyMs: 180, provider: 'UAE On-Prem Fabric' }
];

const PIE_COLORS = ['#00e5ff', '#10b981', '#d4ff00', '#ec4899', '#8b5cf6'];

export const FinOpsDashboardView: React.FC<FinOpsDashboardViewProps> = ({ onSpeak }) => {
  const [tenants, setTenants] = useState<TenantFinOpsItem[]>(DEFAULT_TENANTS);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant-sovereign-dgm');
  const [timeseries, setTimeseries] = useState<FinOpsTimeseriesPoint[]>([]);
  const [summary, setSummary] = useState<FinOpsSummary>({
    totalBudgetAed: 100250,
    currentTotalSpentAed: 241.68,
    forecastedTotalSpentAed: 507.53,
    budgetBurnPercent: 0.24,
    forecastOverbudget: false,
    totalTokensAllocated: 20100000,
    totalTokensBurned: 3310700,
    totalComputeUnits: 837.7,
    maxComputeUnits: 4025,
    burnRateAedHr: 111.4,
    requestsToday: 3265
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'simulator' | 'policy' | 'quantum'>('overview');
  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; time: string; tenant: string; message: string; cost: number; status: 'SUCCESS' | 'THROTTLED' }>>([
    { id: '1', time: '07:41:02', tenant: 'DGM Sovereign', message: 'Dual-model consensus executed for Downtown district report', cost: 0.082, status: 'SUCCESS' },
    { id: '2', time: '07:39:15', tenant: 'DEWA Smart Grid', message: 'Photovoltaic drift analysis (Gemini 2.5 Flash)', cost: 0.014, status: 'SUCCESS' },
    { id: '3', time: '07:35:44', tenant: 'RTA Mobility', message: 'Autonomous bus network route simulation', cost: 0.038, status: 'SUCCESS' }
  ]);

  // Simulator state
  const [simTenantId, setSimTenantId] = useState<string>('tenant-sovereign-dgm');
  const [simPromptLength, setSimPromptLength] = useState<number>(4500);
  const [simEndpoint, setSimEndpoint] = useState<string>('/api/ai/reason');
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Fetch live metrics
  const fetchFinOpsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tenantsRes, analyticsRes] = await Promise.all([
        fetch('/api/finops/tenants'),
        fetch('/api/finops/analytics')
      ]);

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        if (tenantsData.tenants && Array.isArray(tenantsData.tenants)) {
          setTenants(tenantsData.tenants.map((t: any) => ({
            id: t.id || t.tenant_id || 'tenant',
            name: t.name || 'Tenant',
            tier: t.tier || 'pro',
            status: t.status || 'ACTIVE',
            authorityClearance: t.authorityClearance || t.authority_clearance || 'CIVIC_ENTERPRISE',
            tokensUsed: Number(t.tokensUsed ?? t.tokens_used ?? 0),
            maxTokens: Number(t.maxTokens ?? t.max_tokens ?? 1000000),
            tokenBurnPct: Number(t.tokenBurnPct ?? t.token_burn_pct ?? 0),
            computeUnits: Number(t.computeUnits ?? t.compute_units ?? 0),
            maxComputeUnits: Number(t.maxComputeUnits ?? t.max_compute_units ?? 1000),
            budgetMonthlyAed: Number(t.budgetMonthlyAed ?? t.budget_monthly_aed ?? 10000),
            spentAed: Number(t.spentAed ?? t.spent_aed ?? 0),
            burnRateAedHr: Number(t.burnRateAedHr ?? t.burn_rate_aed_hr ?? 0),
            requestsToday: Number(t.requestsToday ?? t.requests_today ?? 0),
            allowedModels: t.allowedModels || t.allowed_models || ['flash', 'pro']
          })));
        }
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.summary) {
          setSummary(analyticsData.summary);
        }
        if (analyticsData.timeseries && Array.isArray(analyticsData.timeseries)) {
          setTimeseries(analyticsData.timeseries);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live FinOps data, using resilient local state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinOpsData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchFinOpsData, 5000);
    return () => clearInterval(interval);
  }, [fetchFinOpsData, autoRefresh]);

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  // Trigger simulated workload burst
  const handleSimulateBurst = async () => {
    try {
      setIsSimulating(true);
      const tokenBurst = Math.floor(Math.random() * 35000) + 12000;
      const computeBurst = Number(((tokenBurst / 4000) * 0.45).toFixed(1));

      const res = await fetch('/api/finops/simulate-consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant.id,
          tokens: tokenBurst,
          computeUnits: computeBurst
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newEvent = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          tenant: activeTenant.name.split(' ')[0],
          message: `Workload burst: +${(tokenBurst).toLocaleString()} tokens (~${computeBurst} CU)`,
          cost: data.costAed || 1.82,
          status: 'SUCCESS' as const
        };
        setLiveEvents((prev) => [newEvent, ...prev.slice(0, 7)]);
        await fetchFinOpsData();

        if (onSpeak) {
          onSpeak(
            `Simulated burst processed for ${activeTenant.name}. Ingested ${tokenBurst.toLocaleString()} tokens with cost allocation of ${data.costAed} AED.`
          );
        }
      }
    } catch (err) {
      console.error('Error simulating burst:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run dry run estimate
  const handleRunEstimate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/finops/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: simTenantId,
          promptLength: simPromptLength,
          endpoint: simEndpoint
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      }
    } catch (err) {
      console.error('Estimate failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle tenant status
  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'THROTTLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/finops/tenants/${tenantId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) => (t.id === tenantId ? { ...t, status: nextStatus } : t))
        );
        if (onSpeak) {
          onSpeak(`Tenant policy updated: ${tenantId} status set to ${nextStatus}.`);
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleVoiceBriefing = () => {
    if (!onSpeak) return;
    const totalSpent = (summary.currentTotalSpentAed ?? 0).toLocaleString();
    const totalBudget = (summary.totalBudgetAed ?? 0).toLocaleString();
    const totalTokens = (summary.totalTokensBurned ?? 0).toLocaleString();
    onSpeak(
      `FinOps and Model Governance Briefing. Total UAE tenant spend stands at ${totalSpent} AED out of a monthly budget of ${totalBudget} AED. ${totalTokens} tokens burned today across ${tenants.length} registered sovereign and enterprise tenants. The Cost Risk Router is enforcing active authority separation.`
    );
  };

  // Export JSON report
  const handleExportReport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ summary, tenants, timeseries, generatedAt: new Date().toISOString() }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `UAE_FinOps_Report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Pie chart data for tenant token distribution
  const pieData = tenants.map((t) => ({
    name: t.name.split(' ')[0],
    value: t.tokensUsed
  }));

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#05080e] text-[#f5f4f0] select-none">
      {/* Top Banner & Header */}
      <div className="flex-none px-6 py-4 border-b border-[#d4ff00]/20 bg-[#09101c]/90 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4ff00]/10 border border-[#d4ff00]/50 flex items-center justify-center shadow-[0_0_12px_rgba(212,255,0,0.25)]">
              <Activity className="w-5 h-5 text-[#d4ff00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-mono-tech tracking-wide text-[#f5f4f0]">
                  FINOPS & MODEL ROUTER STUDIO
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-tech bg-[#d4ff00]/20 text-[#d4ff00] border border-[#d4ff00]/40">
                  REAL-TIME UAE MATRIX
                </span>
              </div>
              <p className="text-xs font-mono-tech text-[#8e8d88]">
                Real-Time Tenant Token Consumption · Compute Allocation · Budget Burn Velocity & Model Routing
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex flex-wrap items-center gap-2 font-mono-tech text-xs">
            {/* View Filter Tabs */}
            <div className="flex bg-[#05080e] p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#d4ff00]/20 text-[#d4ff00] font-bold border border-[#d4ff00]/40'
                    : 'text-[#8e8d88] hover:text-white'
                }`}
              >
                Overview & Matrix
              </button>
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'breakdown'
                    ? 'bg-[#00e5ff]/20 text-[#00e5ff] font-bold border border-[#00e5ff]/40'
                    : 'text-[#8e8d88] hover:text-white'
                }`}
              >
                Trends & Compute
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-[#10b981]/20 text-[#10b981] font-bold border border-[#10b981]/40'
                    : 'text-[#8e8d88] hover:text-white'
                }`}
              >
                Cost Estimator
              </button>
              <button
                onClick={() => setActiveTab('policy')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'policy'
                    ? 'bg-[#ec4899]/20 text-[#ec4899] font-bold border border-[#ec4899]/40'
                    : 'text-[#8e8d88] hover:text-white'
                }`}
              >
                Authority Policies
              </button>
              <button
                onClick={() => setActiveTab('quantum')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'quantum'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-[0_0_10px_rgba(0,229,255,0.25)]'
                    : 'text-[#8e8d88] hover:text-cyan-300'
                }`}
              >
                <Key className="w-3 h-3 text-cyan-400" />
                <span>Quantum Encryption</span>
              </button>
            </div>

            {/* Voice Narration */}
            <button
              onClick={handleVoiceBriefing}
              title="Listen to FinOps Executive Summary"
              className="p-2 rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 transition-all flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Briefing</span>
            </button>

            {/* Ingestion Burst Simulator */}
            <button
              onClick={handleSimulateBurst}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-lg border border-[#d4ff00]/50 bg-[#d4ff00]/15 text-[#d4ff00] hover:bg-[#d4ff00]/25 transition-all flex items-center gap-1.5 font-bold shadow-[0_0_8px_rgba(212,255,0,0.15)] disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Simulate Burst</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchFinOpsData()}
              disabled={isLoading}
              className="p-2 rounded-lg border border-white/10 bg-[#05080e] text-[#8e8d88] hover:text-white transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export */}
            <button
              onClick={handleExportReport}
              title="Download FinOps JSON Report"
              className="p-2 rounded-lg border border-white/10 bg-[#05080e] text-[#8e8d88] hover:text-white transition-all"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[#05080e] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[#8e8d88] text-[10px] font-mono-tech">
              <span>MONTHLY BUDGET</span>
              <Coins className="w-3 h-3 text-[#d4ff00]" />
            </div>
            <div className="text-lg font-bold font-mono-tech text-white">
              AED {(summary.totalBudgetAed ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#10b981] font-mono-tech">
              Allocated across {tenants.length} Tenants
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#05080e] border border-[#d4ff00]/30 space-y-1">
            <div className="flex items-center justify-between text-[#8e8d88] text-[10px] font-mono-tech">
              <span>CURRENT SPEND</span>
              <Activity className="w-3 h-3 text-[#d4ff00]" />
            </div>
            <div className="text-lg font-bold font-mono-tech text-[#d4ff00]">
              AED {(summary.currentTotalSpentAed ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#8e8d88] font-mono-tech">
              Burn: {(summary.budgetBurnPercent ?? 0).toFixed(2)}% of cap
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#05080e] border border-[#00e5ff]/30 space-y-1">
            <div className="flex items-center justify-between text-[#8e8d88] text-[10px] font-mono-tech">
              <span>TOKEN INGESTION</span>
              <Sparkles className="w-3 h-3 text-[#00e5ff]" />
            </div>
            <div className="text-lg font-bold font-mono-tech text-[#00e5ff]">
              {((summary.totalTokensBurned ?? 0) / 1000000).toFixed(2)}M
            </div>
            <div className="text-[10px] text-[#8e8d88] font-mono-tech">
              Cap: {((summary.totalTokensAllocated ?? 0) / 1000000).toFixed(1)}M Tokens
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#05080e] border border-[#10b981]/30 space-y-1">
            <div className="flex items-center justify-between text-[#8e8d88] text-[10px] font-mono-tech">
              <span>COMPUTE UNITS</span>
              <Cpu className="w-3 h-3 text-[#10b981]" />
            </div>
            <div className="text-lg font-bold font-mono-tech text-[#10b981]">
              {(summary.totalComputeUnits ?? 0).toFixed(1)} CU
            </div>
            <div className="text-[10px] text-[#8e8d88] font-mono-tech">
              Capacity: {summary.maxComputeUnits ?? 0} CU
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#05080e] border border-[#ec4899]/30 space-y-1">
            <div className="flex items-center justify-between text-[#8e8d88] text-[10px] font-mono-tech">
              <span>BURN VELOCITY</span>
              <TrendingUp className="w-3 h-3 text-[#ec4899]" />
            </div>
            <div className="text-lg font-bold font-mono-tech text-[#ec4899]">
              {(summary.burnRateAedHr ?? 0).toFixed(1)} AED/hr
            </div>
            <div className="text-[10px] text-[#8e8d88] font-mono-tech">
              {summary.requestsToday ?? 0} reqs / 24h
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#05080e] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[#8e8d88] text-[10px] font-mono-tech">
              <span>PROJECTED FINISH</span>
              <ArrowUpRight className="w-3 h-3 text-[#10b981]" />
            </div>
            <div className="text-lg font-bold font-mono-tech text-white">
              AED {(summary.forecastedTotalSpentAed ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#10b981] font-mono-tech font-bold">
              SAFE (Under Budget)
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* TAB 1: OVERVIEW & TENANT MATRIX */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Tenant Quota & Token Burn Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold font-mono-tech text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#d4ff00]" />
                  Active Sovereign & Enterprise Tenants
                </h2>
                <span className="text-xs font-mono-tech text-[#8e8d88]">
                  Click tenant to focus analytics
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenants.map((tenant) => {
                  const isSelected = tenant.id === selectedTenantId;
                  const isSovereign = tenant.tier === 'sovereign';
                  const isThrottled = tenant.status === 'THROTTLED';

                  return (
                    <motion.div
                      key={tenant.id}
                      onClick={() => setSelectedTenantId(tenant.id)}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#09101c] border-[#d4ff00] shadow-[0_0_15px_rgba(212,255,0,0.15)]'
                          : 'bg-[#09101c]/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono-tech uppercase mb-1 ${
                              isSovereign
                                ? 'bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/40'
                                : 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40'
                            }`}
                          >
                            {tenant.authorityClearance.replace(/_/g, ' ')}
                          </span>
                          <h3 className="font-mono-tech font-bold text-sm text-white line-clamp-1">
                            {tenant.name}
                          </h3>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTenantStatus(tenant.id, tenant.status);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold transition-all ${
                            isThrottled
                              ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 hover:bg-[#ef4444]/30'
                              : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 hover:bg-[#10b981]/30'
                          }`}
                        >
                          {tenant.status}
                        </button>
                      </div>

                      {/* Token Quota Progress */}
                      <div className="mt-3 space-y-1 font-mono-tech">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#8e8d88]">Token Ingestion</span>
                          <span className="text-white font-bold">
                            {(tenant.tokensUsed ?? 0).toLocaleString()} / {(tenant.maxTokens ?? 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-[#05080e] rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full transition-all ${
                              tenant.tokenBurnPct > 80
                                ? 'bg-[#ef4444]'
                                : tenant.tokenBurnPct > 50
                                ? 'bg-[#d4ff00]'
                                : 'bg-[#00e5ff]'
                            }`}
                            style={{ width: `${Math.min(100, tenant.tokenBurnPct ?? 0)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-[#8e8d88] pt-1">
                          <span>Burn: {tenant.tokenBurnPct ?? 0}%</span>
                          <span>Velocity: {(tenant.burnRateAedHr ?? 0).toFixed(1)} AED/h</span>
                        </div>
                      </div>

                      {/* Financial Metrics Row */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5 font-mono-tech text-[10px]">
                        <div>
                          <span className="text-[#8e8d88] block">Budget</span>
                          <span className="text-white font-bold">
                            AED {(tenant.budgetMonthlyAed ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8e8d88] block">Spent</span>
                          <span className="text-[#d4ff00] font-bold">
                            AED {(tenant.spentAed ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8e8d88] block">Compute Units</span>
                          <span className="text-[#10b981] font-bold">
                            {(tenant.computeUnits ?? 0).toFixed(1)} / {tenant.maxComputeUnits ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Allowed Model Badges */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {tenant.allowedModels.map((m) => (
                          <span
                            key={m}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono-tech bg-white/5 text-[#8e8d88] border border-white/10"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Focus Tenant Deep Dive & Live Stream */}
            <div className="space-y-4">
              {/* Active Focused Tenant Detailed Card */}
              <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/30 space-y-3 font-mono-tech">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs text-[#00e5ff] font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Focused Tenant Isolation
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00e5ff]/10 text-[#00e5ff]">
                    {activeTenant.tier.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{activeTenant.name}</h3>
                  <span className="text-xs text-[#8e8d88]">ID: {activeTenant.id}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#8e8d88]">Security Clearance:</span>
                    <span className="text-[#d4ff00] font-bold">{activeTenant.authorityClearance}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#8e8d88]">Status:</span>
                    <span
                      className={`font-bold ${
                        activeTenant.status === 'ACTIVE' ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}
                    >
                      {activeTenant.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#8e8d88]">Requests Today:</span>
                    <span className="text-white font-bold">{activeTenant.requestsToday} ops</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#8e8d88]">Cost Per 1K Tokens:</span>
                    <span className="text-[#00e5ff] font-bold">0.073 AED</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSimulateBurst}
                    disabled={isSimulating}
                    className="w-full py-2 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff] hover:bg-[#00e5ff]/25 transition-all text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Trigger AI Query on {activeTenant.name.split(' ')[0]}</span>
                  </button>
                </div>
              </div>

              {/* Live Consumption Telemetry Feed */}
              <div className="p-4 rounded-xl bg-[#09101c] border border-white/10 space-y-3 font-mono-tech">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs text-[#d4ff00] font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Live Router Ingestion Feed
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                </div>

                <div className="space-y-2">
                  {liveEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2 rounded bg-[#05080e] border border-white/5 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#00e5ff] font-bold">{evt.tenant}</span>
                        <span className="text-[#8e8d88]">{evt.time}</span>
                      </div>
                      <p className="text-white leading-tight">{evt.message}</p>
                      <div className="flex justify-between text-[9px] text-[#8e8d88] pt-0.5">
                        <span>Cost: +{evt.cost.toFixed(3)} AED</span>
                        <span className="text-[#10b981] font-bold">STATUS: {evt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantum Encryption Status Mini-Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#09101c] to-[#040e1a] border border-cyan-500/30 space-y-2.5 font-mono-tech shadow-[0_0_15px_rgba(0,229,255,0.08)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                    Quantum Lattice Security
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    NIST FIPS-203
                  </span>
                </div>
                <p className="text-[11px] text-[#8e8d88] leading-relaxed">
                  Real-time cryptographic key distribution and lattice encapsulation are active across all 5 sovereign tenant pipelines.
                </p>
                <button
                  onClick={() => setActiveTab('quantum')}
                  className="w-full py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Launch Quantum Key Visualizer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRENDS, FORECASTING & COMPUTE CHARTS */}
        {activeTab === 'breakdown' && (
          <div className="space-y-6">
            {/* 30-Day Budget Burn & Projected Finish (Recharts Area Chart) */}
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#d4ff00]/30 space-y-4 font-mono-tech">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#d4ff00]" />
                    30-Day Cumulative Budget Spend & Forecasted Trajectory
                  </h3>
                  <p className="text-xs text-[#8e8d88]">
                    Actual spend (Aug 01 - 15) vs Automated Regression Projection (Aug 16 - 30)
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#00e5ff]" />
                    <span className="text-[#8e8d88]">Actual Spend (AED)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#d4ff00]" />
                    <span className="text-[#8e8d88]">Projected Spend (AED)</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeseries}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4ff00" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#d4ff00" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#8e8d88" textAnchor="end" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#8e8d88" tick={{ fontSize: 10 }} unit=" AED" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09101c',
                        borderColor: '#00e5ff',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalSpendAed"
                      stroke="#00e5ff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#spendGrad)"
                      name="Cumulative Spend (AED)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split: Compute Unit Load & Token Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Compute Units Load */}
              <div className="p-5 rounded-xl bg-[#09101c] border border-[#10b981]/30 space-y-4 font-mono-tech">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#10b981]" />
                  Compute Unit Utilization by Date
                </h3>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeseries.slice(0, 15)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="date" stroke="#8e8d88" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#8e8d88" tick={{ fontSize: 10 }} unit=" CU" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#09101c',
                          borderColor: '#10b981',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Bar dataKey="totalComputeUnits" fill="#10b981" radius={[4, 4, 0, 0]} name="Compute Units" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Token Consumption by Tenant (Pie Chart) */}
              <div className="p-5 rounded-xl bg-[#09101c] border border-[#ec4899]/30 space-y-4 font-mono-tech">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#ec4899]" />
                  Tenant Token Consumption Share
                </h3>

                <div className="h-60 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#09101c',
                          borderColor: '#ec4899',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                        formatter={(val: any) => [`${val.toLocaleString()} tokens`, 'Consumption']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Model Benchmark Cost Efficiency Matrix */}
            <div className="p-5 rounded-xl bg-[#09101c] border border-white/10 space-y-3 font-mono-tech">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00e5ff]" />
                UAE Model Router Unit Cost Benchmarks
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-tech">
                  <thead>
                    <tr className="text-[#8e8d88] border-b border-white/10 pb-2">
                      <th className="py-2">Model Engine</th>
                      <th className="py-2">Provider Fabric</th>
                      <th className="py-2">Cost / 1M Tokens (AED)</th>
                      <th className="py-2">Latency (p50)</th>
                      <th className="py-2">Cost Efficiency Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {MODEL_COST_BENCHMARKS.map((m, idx) => (
                      <tr key={m.model} className="hover:bg-white/5 transition-all">
                        <td className="py-2.5 font-bold text-white">{m.model}</td>
                        <td className="py-2.5 text-[#8e8d88]">{m.provider}</td>
                        <td className="py-2.5 text-[#d4ff00] font-bold">AED {m.costPer1M.toFixed(2)}</td>
                        <td className="py-2.5 text-[#00e5ff]">{m.latencyMs} ms</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              idx === 3
                                ? 'bg-[#10b981]/20 text-[#10b981]'
                                : idx === 0
                                ? 'bg-[#00e5ff]/20 text-[#00e5ff]'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            Tier #{idx + 1}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE COST ESTIMATOR & ROUTER SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono-tech">
            {/* Input Controls */}
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#10b981]/30 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#10b981]" />
                FastAPI Cost Risk & Model Router Dry-Run
              </h3>
              <p className="text-xs text-[#8e8d88]">
                Simulate proposed query payloads against tenant authorization boundaries, token quotas, and automated model tiered routing.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs text-[#8e8d88] mb-1">Target Tenant</label>
                  <select
                    value={simTenantId}
                    onChange={(e) => setSimTenantId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#05080e] border border-white/20 text-white text-xs focus:border-[#10b981] focus:outline-none"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.authorityClearance})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#8e8d88] mb-1">API Endpoint / Workload Type</label>
                  <select
                    value={simEndpoint}
                    onChange={(e) => setSimEndpoint(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#05080e] border border-white/20 text-white text-xs focus:border-[#10b981] focus:outline-none"
                  >
                    <option value="/api/ai/reason">/api/ai/reason (Standard Cognitive Query)</option>
                    <option value="/api/ai/consensus">/api/ai/consensus (Dual-Model Agreement Verification)</option>
                    <option value="/api/simulation/urban-scale">/api/simulation/urban-scale (3D Twin Spatial Ingestion)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8e8d88]">Prompt Payload Length</span>
                    <span className="text-white font-bold">
                      {simPromptLength.toLocaleString()} chars (~{Math.round(simPromptLength / 4)} tokens)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="60000"
                    step="500"
                    value={simPromptLength}
                    onChange={(e) => setSimPromptLength(Number(e.target.value))}
                    className="w-full accent-[#10b981] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#8e8d88] mt-1">
                    <span>Small Brief (200 chars)</span>
                    <span>Massive Context (60k chars)</span>
                  </div>
                </div>

                <button
                  onClick={handleRunEstimate}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] hover:bg-[#10b981]/30 transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                >
                  <Zap className="w-4 h-4" />
                  <span>Execute Dry-Run Cost & Gate Estimation</span>
                </button>
              </div>
            </div>

            {/* Output Card */}
            <div className="p-5 rounded-xl bg-[#09101c] border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00e5ff]" />
                Router Decision & Cost Breakdown
              </h3>

              {simResult ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-[#05080e] border border-white/10 flex items-center justify-between">
                    <span className="text-xs text-[#8e8d88]">Authority Gate Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        simResult.isAllowed
                          ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                          : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'
                      }`}
                    >
                      {simResult.authorityGate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#05080e] border border-white/5 space-y-1">
                      <span className="text-[#8e8d88] block text-[10px]">Estimated Cost (USD)</span>
                      <span className="text-base font-bold text-white">
                        ${simResult.estimatedCostUsd}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#05080e] border border-white/5 space-y-1">
                      <span className="text-[#8e8d88] block text-[10px]">Estimated Cost (AED)</span>
                      <span className="text-base font-bold text-[#d4ff00]">
                        AED {simResult.estimatedCostAed}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#05080e] border border-white/5 space-y-1">
                      <span className="text-[#8e8d88] block text-[10px]">Estimated Ingestion</span>
                      <span className="text-base font-bold text-[#00e5ff]">
                        {simResult.estimatedTokens?.toLocaleString()} tokens
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#05080e] border border-white/5 space-y-1">
                      <span className="text-[#8e8d88] block text-[10px]">Routed Model Tier</span>
                      <span className="text-base font-bold text-[#ec4899]">
                        {simResult.routedModelTier}
                      </span>
                    </div>
                  </div>

                  {simResult.errorMessage && (
                    <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{simResult.errorMessage}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-[#8e8d88] leading-relaxed p-3 rounded-lg bg-white/5 border border-white/5">
                    <strong>Router Logic:</strong> Sovereign clearance tenants are automatically directed to dedicated on-premise air-gapped sovereign instances. Enterprise requests exceeding 12,000 characters are optimized into Gemini 2.5 Flash shards.
                  </div>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center text-center p-6 text-[#8e8d88]">
                  <Sliders className="w-8 h-8 text-[#8e8d88] mb-2 opacity-50" />
                  <p className="text-xs">Adjust query parameters on the left and trigger the dry-run estimator.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUTHORITY POLICIES & AIR-GAPPED ISOLATION */}
        {activeTab === 'policy' && (
          <div className="space-y-6 font-mono-tech">
            <div className="p-5 rounded-xl bg-[#09101c] border border-[#ec4899]/30 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#ec4899]" />
                Zero-Trust Authority Separation & Isolation Matrix
              </h3>
              <p className="text-xs text-[#8e8d88]">
                Strict tenant sandboxing prevents cross-tenant prompt leakage, enforce sovereign data residency within UAE borders, and automatically throttles non-conforming callers.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#05080e] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-[#ec4899] font-bold text-xs">
                    <Shield className="w-4 h-4" />
                    DEFCON-1 Sovereign Tier
                  </div>
                  <p className="text-[11px] text-[#8e8d88] leading-relaxed">
                    Reserved exclusively for Dubai Government Media Office & Prime Minister Office systems. Dedicated air-gapped GPU clusters with zero third-party telemetry export.
                  </p>
                  <div className="pt-1 text-[10px] text-white">
                    <strong>Monthly Quota:</strong> 10M Tokens / 2,000 CU
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#05080e] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-[#d4ff00] font-bold text-xs">
                    <Server className="w-4 h-4" />
                    Critical Infrastructure Tier
                  </div>
                  <p className="text-[11px] text-[#8e8d88] leading-relaxed">
                    DEWA, RTA, and Civil Defense networks. Encrypted local pipelines with hardware security module (HSM) session token verification.
                  </p>
                  <div className="pt-1 text-[10px] text-white">
                    <strong>Monthly Quota:</strong> 5M Tokens / 1,000 CU
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#05080e] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-[#00e5ff] font-bold text-xs">
                    <Zap className="w-4 h-4" />
                    Civic Enterprise & Sandbox
                  </div>
                  <p className="text-[11px] text-[#8e8d88] leading-relaxed">
                    Commercial developers (DAMAC, Emaar) and public sandboxes. Gated by real-time token rate-limiting and budget cap exhaustion locks.
                  </p>
                  <div className="pt-1 text-[10px] text-white">
                    <strong>Monthly Quota:</strong> 1M - 3M Tokens / 400 - 600 CU
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Visualizer in Policy View */}
            <div className="pt-2">
              <QuantumEncryptionVisualizer onSpeak={onSpeak} />
            </div>
          </div>
        )}

        {/* TAB 5: DEDICATED QUANTUM ENCRYPTION VISUALIZER LAYER */}
        {activeTab === 'quantum' && (
          <div className="space-y-6">
            <QuantumEncryptionVisualizer onSpeak={onSpeak} />
          </div>
        )}
      </div>
    </div>
  );
};
