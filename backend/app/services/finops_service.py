# backend/app/services/finops_service.py
from typing import Dict, Optional, Tuple, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Repository interface for multi-tenant token and compute unit tracking
class TenantUsageRepository:
    def __init__(self):
        # In-memory storage for tenant usage metrics and limits (backed by TimescaleDB/PostgreSQL in production)
        self._tenant_usage: Dict[str, Dict[str, float]] = {
            "tenant-sovereign-dgm": {"tokens_used": 1420500, "compute_units": 380.5, "burn_rate_aed_hr": 48.2, "requests_today": 1240},
            "tenant-dewa-grid": {"tokens_used": 890200, "compute_units": 210.0, "burn_rate_aed_hr": 29.5, "requests_today": 890},
            "tenant-rta-mobility": {"tokens_used": 540000, "compute_units": 140.2, "burn_rate_aed_hr": 18.0, "requests_today": 620},
            "tenant-enterprise-damac": {"tokens_used": 412000, "compute_units": 95.0, "burn_rate_aed_hr": 14.2, "requests_today": 430},
            "tenant-community-sandbox": {"tokens_used": 48000, "compute_units": 12.0, "burn_rate_aed_hr": 1.5, "requests_today": 85}
        }
        self._tenant_limits: Dict[str, Dict[str, Any]] = {
            "tenant-sovereign-dgm": {
                "name": "Dubai Government Media Office (DGM)",
                "tier": "sovereign",
                "max_tokens": 10000000,
                "max_compute_units": 2000.0,
                "budget_monthly_aed": 50000.0,
                "allowed_models": ["sovereign-pro", "gemini-2.5-pro", "gpt-4o", "dual-consensus"],
                "status": "ACTIVE",
                "authority_clearance": "DEFCON-1_SOVEREIGN"
            },
            "tenant-dewa-grid": {
                "name": "DEWA Smart Grid Intelligence",
                "tier": "sovereign",
                "max_tokens": 5000000,
                "max_compute_units": 1000.0,
                "budget_monthly_aed": 25000.0,
                "allowed_models": ["sovereign-pro", "gemini-2.5-pro", "gpt-4o"],
                "status": "ACTIVE",
                "authority_clearance": "CRITICAL_INFRASTRUCTURE"
            },
            "tenant-rta-mobility": {
                "name": "RTA Dubai Mobility Autonomous Fabric",
                "tier": "enterprise",
                "max_tokens": 3000000,
                "max_compute_units": 600.0,
                "budget_monthly_aed": 15000.0,
                "allowed_models": ["pro", "gemini-2.5-flash", "gpt-4o-mini"],
                "status": "ACTIVE",
                "authority_clearance": "CIVIC_ENTERPRISE"
            },
            "tenant-enterprise-damac": {
                "name": "DAMAC Strategic Twin Development",
                "tier": "enterprise",
                "max_tokens": 2000000,
                "max_compute_units": 400.0,
                "budget_monthly_aed": 10000.0,
                "allowed_models": ["pro", "flash", "gpt-4o-mini"],
                "status": "ACTIVE",
                "authority_clearance": "CIVIC_ENTERPRISE"
            },
            "tenant-community-sandbox": {
                "name": "Public Sandbox Developer Cohort",
                "tier": "free",
                "max_tokens": 100000,
                "max_compute_units": 25.0,
                "budget_monthly_aed": 250.0,
                "allowed_models": ["flash", "gemini-2.0-flash"],
                "status": "ACTIVE",
                "authority_clearance": "COMMUNITY_OPEN"
            }
        }

    async def get_current_usage(self, tenant_id: str) -> Dict[str, float]:
        """Query for current token/compute usage metrics."""
        return self._tenant_usage.get(tenant_id, {"tokens_used": 0.0, "compute_units": 0.0, "burn_rate_aed_hr": 0.0, "requests_today": 0})

    async def get_tenant_limits(self, tenant_id: str) -> Dict[str, Any]:
        """Query tenant subscription and quota limits."""
        return self._tenant_limits.get(tenant_id, {
            "name": f"Tenant {tenant_id}",
            "tier": "free",
            "max_tokens": 100000,
            "max_compute_units": 20.0,
            "budget_monthly_aed": 200.0,
            "allowed_models": ["flash"],
            "status": "ACTIVE",
            "authority_clearance": "COMMUNITY_OPEN"
        })

    async def record_usage(self, tenant_id: str, tokens: int, compute_units: float, cost_aed: float):
        """Atomically increment tenant usage counters."""
        if tenant_id not in self._tenant_usage:
            self._tenant_usage[tenant_id] = {"tokens_used": 0.0, "compute_units": 0.0, "burn_rate_aed_hr": 0.0, "requests_today": 0}
        self._tenant_usage[tenant_id]["tokens_used"] += tokens
        self._tenant_usage[tenant_id]["compute_units"] += compute_units
        self._tenant_usage[tenant_id]["requests_today"] += 1
        self._tenant_usage[tenant_id]["burn_rate_aed_hr"] = round(cost_aed * 60, 2)

    async def list_all_tenants(self) -> List[Dict[str, Any]]:
        """List all active tenant profiles with live usage vs quotas."""
        tenants = []
        for tid, limits in self._tenant_limits.items():
            usage = self._tenant_usage.get(tid, {"tokens_used": 0, "compute_units": 0, "burn_rate_aed_hr": 0, "requests_today": 0})
            token_burn_pct = round((usage.get("tokens_used", 0) / max(limits.get("max_tokens", 1), 1)) * 100, 1)
            spent_aed = round(usage.get("tokens_used", 0) * 0.000073, 2) # ~AED conversion
            tenants.append({
                "tenant_id": tid,
                "name": limits.get("name"),
                "tier": limits.get("tier"),
                "status": limits.get("status"),
                "authority_clearance": limits.get("authority_clearance"),
                "tokens_used": usage.get("tokens_used", 0),
                "max_tokens": limits.get("max_tokens", 0),
                "token_burn_pct": token_burn_pct,
                "compute_units": usage.get("compute_units", 0),
                "max_compute_units": limits.get("max_compute_units", 0),
                "budget_monthly_aed": limits.get("budget_monthly_aed", 0),
                "spent_aed": spent_aed,
                "burn_rate_aed_hr": usage.get("burn_rate_aed_hr", 0),
                "requests_today": usage.get("requests_today", 0),
                "allowed_models": limits.get("allowed_models", [])
            })
        return tenants


class FinOpsService:
    def __init__(self, usage_repo: TenantUsageRepository):
        self.usage_repo = usage_repo

    async def estimate_request_cost(self, prompt_length: int, endpoint: str) -> float:
        """
        Estimates the cost of an incoming request based on prompt length and endpoint type.
        1 token ≈ 4 characters. Blended baseline token cost = $0.00002.
        """
        estimated_tokens = max(1, prompt_length / 4)
        
        # Dual-Model Consensus endpoint performs parallel verification with 2.2x compute multiplier
        if "consensus" in endpoint or "reason" in endpoint:
            cost_per_token = 0.000044
        elif "simulation" in endpoint:
            cost_per_token = 0.000065
        else:
            cost_per_token = 0.00002

        return estimated_tokens * cost_per_token

    async def check_tenant_limits(self, tenant_id: str, estimated_cost: float) -> Tuple[bool, Optional[str]]:
        """
        Checks if the tenant has sufficient budget/limits for the estimated cost.
        Returns (is_allowed, error_message).
        """
        usage = await self.usage_repo.get_current_usage(tenant_id)
        limits = await self.usage_repo.get_tenant_limits(tenant_id)

        # Check token quota limits
        estimated_tokens = estimated_cost / 0.00002
        current_tokens = usage.get("tokens_used", 0)
        max_tokens = limits.get("max_tokens", float('inf'))

        if current_tokens + estimated_tokens > max_tokens:
            return False, f"Tenant token quota exceeded ({int(current_tokens):,} / {int(max_tokens):,} tokens used)."

        # Check compute quota limits
        if usage.get("compute_units", 0) >= limits.get("max_compute_units", float('inf')):
            return False, "Tenant compute capacity limit reached for current billing cycle."

        # Check authority status
        if limits.get("status") != "ACTIVE":
            return False, f"Tenant account is currently {limits.get('status')}. Access restricted."

        return True, None

    async def determine_model_route(self, tenant_id: str, prompt_length: int) -> str:
        """
        Determines which model tier to route the request to based on tenant tier, 
        prompt complexity, and authority separation policies.
        """
        limits = await self.usage_repo.get_tenant_limits(tenant_id)
        tenant_tier = limits.get("tier", "free")

        if tenant_tier == "sovereign":
            # Sovereign tier routes to dedicated high-capacity sovereign enclave
            return "sovereign-pro"
        elif tenant_tier == "enterprise":
            # Enterprise routes to Pro unless prompt length is massive (>12,000 chars)
            if prompt_length > 12000:
                return "flash"
            return "pro"
        else:
            # Free / Community always routes to high-speed Flash tier
            return "flash"
