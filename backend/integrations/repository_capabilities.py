from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from backend.integrations.ai_mainframe import mainframe_runtime


@dataclass(frozen=True)
class RepositoryCapability:
    repository: str
    capability: str
    target_domain: str
    integration_mode: str
    priority: str
    status: str


REPOSITORY_CAPABILITIES: tuple[RepositoryCapability, ...] = (
    RepositoryCapability(
        "Daniel550-pixel/FinSight-Global-AI-2",
        "financial analytics, FX, ESG, geo-risk, liquidity, regime detection, valuation",
        "financial_intelligence",
        "extract_and_normalize",
        "high",
        "audited",
    ),
    RepositoryCapability(
        "Daniel550-pixel/FinSight_Global_AI_Dashboard",
        "alerts, auth, backtesting, broker integration, deep-RL, Monte Carlo, hedging, sentiment",
        "financial_intelligence",
        "selective_extraction",
        "medium",
        "audited",
    ),
    RepositoryCapability(
        "Daniel550-pixel/AIOS-Core-Architect.",
        "configurable modules, module lifecycle, live module logs",
        "runtime_registry",
        "concept_reimplementation",
        "medium",
        "audited",
    ),
    RepositoryCapability(
        "Daniel550-pixel/AI-mainframe",
        "mainframe capability registry: orchestration, state observation, event routing, governed action",
        "mainframe_runtime",
        "integrated_native_adapter",
        "high",
        "implemented_and_integrated",
    ),
    RepositoryCapability(
        "Daniel550-pixel/FGSE",
        "JARVIS decision contract, market data, strategy/trader server, neural visualization",
        "jarvis_and_financial_experience",
        "contract_and_component_extraction",
        "high",
        "audited",
    ),
)


def list_repository_capabilities() -> list[dict[str, Any]]:
    """Return the audited external capability registry for observability and tooling."""
    capabilities = [asdict(item) for item in REPOSITORY_CAPABILITIES]
    capabilities.append(
        {
            "repository": "Daniel550-pixel/AI-mainframe",
            "capability": "|".join(item["name"] for item in mainframe_runtime.capabilities()),
            "target_domain": "mainframe_runtime",
            "integration_mode": "integrated_native_adapter",
            "priority": "high",
            "status": "runtime_available",
        }
    )
    return capabilities


def capabilities_for_domain(domain: str) -> list[dict[str, Any]]:
    normalized = domain.strip().lower()
    return [item for item in list_repository_capabilities() if item["target_domain"] == normalized]
