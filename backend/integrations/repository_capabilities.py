from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


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
    RepositoryCapability(
        "Daniel550-pixel/NetworkLab",
        "web application health, network diagnostics, Wi-Fi profile inventory, service recovery telemetry",
        "infrastructure_intelligence",
        "read_only_local_health_adapter",
        "high",
        "planned",
    ),
    RepositoryCapability(
        "Daniel550-pixel/Airpods-4-Coding-Space",
        "Windows Bluetooth device presence, audio endpoints, AirPods connection telemetry",
        "device_intelligence",
        "read_only_local_device_adapter",
        "high",
        "planned",
    ),
    RepositoryCapability(
        "Daniel550-pixel/Universal-SaaS-Solutions",
        "customer operations, SaaS pricing, quote workflows, tax-aware commercial analytics",
        "business_intelligence",
        "read_only_business_data_adapter",
        "medium",
        "planned",
    ),
    RepositoryCapability(
        "Daniel550-pixel/School-Files-Vault",
        "document inventory, project evidence, metadata, searchable knowledge sources",
        "knowledge_intelligence",
        "read_only_document_index_adapter",
        "high",
        "planned",
    ),
    RepositoryCapability(
        "Daniel550-pixel/Project-Fortress",
        "application security posture, local service diagnostics, dependency and configuration checks",
        "security_intelligence",
        "read_only_security_posture_adapter",
        "high",
        "planned",
    ),
)


def list_repository_capabilities() -> list[dict[str, Any]]:
    """Return the repository capability registry for observability and tooling."""
    return [asdict(item) for item in REPOSITORY_CAPABILITIES]


def capabilities_for_domain(domain: str) -> list[dict[str, Any]]:
    normalized = domain.strip().lower()
    return [item for item in list_repository_capabilities() if item["target_domain"] == normalized]
