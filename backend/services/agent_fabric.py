"""Role-aware multi-model delegation policy for ArchOS/J.A.R.V.I.S.

This module plans cognitive roles; it does not grant execution authority.
Execution remains exclusively behind the existing governance/action gate.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass(frozen=True)
class AgentRoleSpec:
    role: str
    objective: str
    preferred_provider: str
    capability: str
    parallelizable: bool
    verification_required: bool = True


ROLE_CATALOG: dict[str, AgentRoleSpec] = {
    "architect": AgentRoleSpec("architect", "decompose the objective and define the investigation plan", "anthropic", "PLANNING", False),
    "researcher": AgentRoleSpec("researcher", "collect and normalize relevant evidence", "archos", "RESEARCH", True),
    "analyst": AgentRoleSpec("analyst", "reason over evidence and identify causal relationships", "anthropic", "REASONING", True),
    "specialist": AgentRoleSpec("specialist", "apply domain-specific analytical constraints", "anthropic", "REASONING", True),
    "critic": AgentRoleSpec("critic", "challenge assumptions, contradictions and unsupported conclusions", "anthropic", "VERIFICATION", True),
    "simulator": AgentRoleSpec("simulator", "evaluate counterfactual or scenario outcomes", "archos", "PLANNING", True),
    "synthesizer": AgentRoleSpec("synthesizer", "produce a traceable final intelligence product", "anthropic", "REASONING", False),
}


def build_delegation_plan(*, query: str, domain: str, is_action_intent: bool = False, context: dict[str, Any] | None = None) -> dict[str, Any]:
    """Create a deterministic role plan from intent metadata.

    The plan is advisory metadata consumed by J.A.R.V.I.S.; it cannot invoke tools
    or execute actions. Domain routing stays deliberately conservative.
    """
    normalized_domain = (domain or "GENERAL_INTELLIGENCE").upper()
    roles = ["architect", "researcher", "analyst"]

    if normalized_domain in {"FINANCE", "FINANCIAL", "ECONOMICS", "ECONOMIC"}:
        roles.append("specialist")
    if normalized_domain in {"LOGISTICS", "INFRASTRUCTURE", "GEOSPATIAL", "CLIMATE", "SCENARIO"}:
        roles.extend(["specialist", "simulator"])
    if len(query.strip()) > 180 or is_action_intent:
        roles.append("critic")
    roles.append("synthesizer")

    # Preserve order while removing duplicates.
    roles = list(dict.fromkeys(roles))
    specs = [asdict(ROLE_CATALOG[r]) for r in roles]

    return {
        "version": "1.0",
        "strategy": "role_aware_multi_model",
        "domain": normalized_domain,
        "roles": specs,
        "parallel_groups": [
            [r["role"] for r in specs if r["parallelizable"]],
        ],
        "execution_authority": False,
        "governance_required_for_actions": bool(is_action_intent),
        "provenance": "archos:agent_fabric:delegation_policy",
    }
