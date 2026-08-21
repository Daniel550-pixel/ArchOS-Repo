export interface TenantUsageMetrics {
  tokensUsed: number;
  computeUnits: number;
  burnRateAedHr: number;
  requestsToday: number;
}

export interface TenantLimitConfig {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise' | 'sovereign';
  maxTokens: number;
  maxComputeUnits: number;
  budgetMonthlyAed: number;
  allowedModels: string[];
  status: 'ACTIVE' | 'THROTTLED' | 'SUSPENDED';
  authorityClearance: 'COMMUNITY_OPEN' | 'CIVIC_ENTERPRISE' | 'CRITICAL_INFRASTRUCTURE' | 'DEFCON-1_SOVEREIGN';
}

export interface TenantFinOpsState extends TenantLimitConfig {
  tokensUsed: number;
  tokenBurnPct: number;
  computeUnits: number;
  spentAed: number;
  burnRateAedHr: number;
  requestsToday: number;
}

class TenantUsageRepository {
  private usageMap: Map<string, TenantUsageMetrics> = new Map([
    ["tenant-sovereign-dgm", { tokensUsed: 1420500, computeUnits: 380.5, burnRateAedHr: 48.2, requestsToday: 1240 }],
    ["tenant-dewa-grid", { tokensUsed: 890200, computeUnits: 210.0, burnRateAedHr: 29.5, requestsToday: 890 }],
    ["tenant-rta-mobility", { tokensUsed: 540000, computeUnits: 140.2, burnRateAedHr: 18.0, requestsToday: 620 }],
    ["tenant-enterprise-damac", { tokensUsed: 412000, computeUnits: 95.0, burnRateAedHr: 14.2, requestsToday: 430 }],
    ["tenant-community-sandbox", { tokensUsed: 48000, computeUnits: 12.0, burnRateAedHr: 1.5, requestsToday: 85 }]
  ]);

  private limitsMap: Map<string, TenantLimitConfig> = new Map([
    ["tenant-sovereign-dgm", {
      id: "tenant-sovereign-dgm",
      name: "Dubai Government Media Office (DGM)",
      tier: "sovereign",
      maxTokens: 10000000,
      maxComputeUnits: 2000.0,
      budgetMonthlyAed: 50000.0,
      allowedModels: ["sovereign-pro", "gemini-2.5-pro", "gpt-4o", "dual-consensus"],
      status: "ACTIVE",
      authorityClearance: "DEFCON-1_SOVEREIGN"
    }],
    ["tenant-dewa-grid", {
      id: "tenant-dewa-grid",
      name: "DEWA Smart Grid Intelligence",
      tier: "sovereign",
      maxTokens: 5000000,
      maxComputeUnits: 1000.0,
      budgetMonthlyAed: 25000.0,
      allowedModels: ["sovereign-pro", "gemini-2.5-pro", "gpt-4o"],
      status: "ACTIVE",
      authorityClearance: "CRITICAL_INFRASTRUCTURE"
    }],
    ["tenant-rta-mobility", {
      id: "tenant-rta-mobility",
      name: "RTA Dubai Mobility Autonomous Fabric",
      tier: "enterprise",
      maxTokens: 3000000,
      maxComputeUnits: 600.0,
      budgetMonthlyAed: 15000.0,
      allowedModels: ["pro", "gemini-2.5-flash", "gpt-4o-mini"],
      status: "ACTIVE",
      authorityClearance: "CIVIC_ENTERPRISE"
    }],
    ["tenant-enterprise-damac", {
      id: "tenant-enterprise-damac",
      name: "DAMAC Strategic Twin Development",
      tier: "enterprise",
      maxTokens: 2000000,
      maxComputeUnits: 400.0,
      budgetMonthlyAed: 10000.0,
      allowedModels: ["pro", "flash", "gpt-4o-mini"],
      status: "ACTIVE",
      authorityClearance: "CIVIC_ENTERPRISE"
    }],
    ["tenant-community-sandbox", {
      id: "tenant-community-sandbox",
      name: "Public Sandbox Developer Cohort",
      tier: "free",
      maxTokens: 100000,
      maxComputeUnits: 25.0,
      budgetMonthlyAed: 250.0,
      allowedModels: ["flash", "gemini-2.0-flash"],
      status: "ACTIVE",
      authorityClearance: "COMMUNITY_OPEN"
    }]
  ]);

  public getCurrentUsage(tenantId: string): TenantUsageMetrics {
    return this.usageMap.get(tenantId) || { tokensUsed: 0, computeUnits: 0, burnRateAedHr: 0, requestsToday: 0 };
  }

  public getTenantLimits(tenantId: string): TenantLimitConfig {
    return this.limitsMap.get(tenantId) || {
      id: tenantId,
      name: `Tenant ${tenantId}`,
      tier: 'free',
      maxTokens: 100000,
      maxComputeUnits: 20.0,
      budgetMonthlyAed: 200.0,
      allowedModels: ["flash"],
      status: "ACTIVE",
      authorityClearance: "COMMUNITY_OPEN"
    };
  }

  public recordUsage(tenantId: string, tokens: number, computeUnits: number, costAed: number): void {
    const current = this.getCurrentUsage(tenantId);
    this.usageMap.set(tenantId, {
      tokensUsed: current.tokensUsed + tokens,
      computeUnits: current.computeUnits + computeUnits,
      burnRateAedHr: Number((costAed * 60).toFixed(2)),
      requestsToday: current.requestsToday + 1
    });
  }

  public setTenantStatus(tenantId: string, status: 'ACTIVE' | 'THROTTLED' | 'SUSPENDED'): boolean {
    const limits = this.limitsMap.get(tenantId);
    if (!limits) return false;
    limits.status = status;
    this.limitsMap.set(tenantId, limits);
    return true;
  }

  public listAllTenants(): TenantFinOpsState[] {
    const results: TenantFinOpsState[] = [];
    for (const [id, limits] of this.limitsMap.entries()) {
      const usage = this.getCurrentUsage(id);
      const tokenBurnPct = Number(((usage.tokensUsed / Math.max(limits.maxTokens, 1)) * 100).toFixed(1));
      const spentAed = Number((usage.tokensUsed * 0.000073).toFixed(2));
      results.push({
        ...limits,
        tokensUsed: usage.tokensUsed,
        tokenBurnPct,
        computeUnits: usage.computeUnits,
        spentAed,
        burnRateAedHr: usage.burnRateAedHr,
        requestsToday: usage.requestsToday
      });
    }
    return results;
  }

  public getTimeseriesAnalytics() {
    const tenants = this.listAllTenants();
    const days = 30;
    const currentDay = 15; // Mid-month for 2026 August
    const history: Array<{
      day: number;
      date: string;
      isForecast: boolean;
      totalTokens: number;
      totalSpendAed: number;
      totalComputeUnits: number;
      tenantBreakdown: Record<string, { tokens: number; spendAed: number; compute: number }>;
    }> = [];

    let cumSpend = 0;
    let cumTokens = 0;
    let cumCompute = 0;

    for (let d = 1; d <= days; d++) {
      const isForecast = d > currentDay;
      const dateStr = `Aug ${d.toString().padStart(2, '0')}`;
      
      const dayFactor = 0.8 + (Math.sin(d / 3) * 0.25) + (d / 35);
      const dailyTokens = Math.round(115000 * dayFactor);
      const dailySpend = Number((dailyTokens * 0.000073).toFixed(2));
      const dailyCompute = Number((18.5 * dayFactor).toFixed(1));

      cumSpend = isForecast ? cumSpend + dailySpend : Number((dailySpend * d * 0.95).toFixed(2));
      cumTokens = isForecast ? cumTokens + dailyTokens : Math.round(dailyTokens * d * 0.95);
      cumCompute = isForecast ? cumCompute + dailyCompute : Number((dailyCompute * d * 0.9).toFixed(1));

      const breakdown: Record<string, { tokens: number; spendAed: number; compute: number }> = {};
      tenants.forEach(t => {
        const share = t.tier === 'sovereign' ? 0.45 : t.tier === 'enterprise' ? 0.22 : 0.05;
        breakdown[t.id] = {
          tokens: Math.round(dailyTokens * share),
          spendAed: Number((dailySpend * share).toFixed(2)),
          compute: Number((dailyCompute * share).toFixed(1))
        };
      });

      history.push({
        day: d,
        date: dateStr,
        isForecast,
        totalTokens: isForecast ? cumTokens : Math.min(cumTokens, 3300000),
        totalSpendAed: isForecast ? cumSpend : Math.min(cumSpend, 241.0),
        totalComputeUnits: isForecast ? cumCompute : Math.min(cumCompute, 837.7),
        tenantBreakdown: breakdown
      });
    }

    return history;
  }
}

export class FinOpsService {
  public usageRepo: TenantUsageRepository;

  constructor(usageRepo = new TenantUsageRepository()) {
    this.usageRepo = usageRepo;
  }

  public estimateRequestCost(promptLength: number, endpoint: string): number {
    const estimatedTokens = Math.max(1, promptLength / 4);
    let costPerToken = 0.00002;
    if (endpoint.includes("consensus") || endpoint.includes("reason")) {
      costPerToken = 0.000044;
    } else if (endpoint.includes("simulation")) {
      costPerToken = 0.000065;
    }
    return estimatedTokens * costPerToken;
  }

  public checkTenantLimits(tenantId: string, estimatedCost: number): { isAllowed: boolean; errorMessage: string | null } {
    const usage = this.usageRepo.getCurrentUsage(tenantId);
    const limits = this.usageRepo.getTenantLimits(tenantId);

    const estimatedTokens = estimatedCost / 0.00002;
    if (usage.tokensUsed + estimatedTokens > limits.maxTokens) {
      return {
        isAllowed: false,
        errorMessage: `Tenant token quota exceeded (${usage.tokensUsed.toLocaleString()} / ${limits.maxTokens.toLocaleString()} tokens used).`
      };
    }

    if (usage.computeUnits >= limits.maxComputeUnits) {
      return {
        isAllowed: false,
        errorMessage: `Tenant compute capacity limit reached for current billing cycle (${usage.computeUnits.toFixed(1)} / ${limits.maxComputeUnits.toFixed(1)} units).`
      };
    }

    if (limits.status !== "ACTIVE") {
      return {
        isAllowed: false,
        errorMessage: `Tenant status is '${limits.status}'. Access restricted.`
      };
    }

    return { isAllowed: true, errorMessage: null };
  }

  public determineModelRoute(tenantId: string, promptLength: number): string {
    const limits = this.usageRepo.getTenantLimits(tenantId);
    if (limits.tier === 'sovereign') {
      return 'sovereign-pro';
    } else if (limits.tier === 'enterprise') {
      if (promptLength > 12000) return 'flash';
      return 'pro';
    } else {
      return 'flash';
    }
  }
}

export const finopsService = new FinOpsService();
