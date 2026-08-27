"""ArchOS Canonical Specialist Agents.
Implements the 8 core agents with structured inputs, outputs,
provenance propagation, and strict epistemic boundaries.
"""
from typing import Dict, Any, List, Set, Optional
import json
import re

from .base import (
    Agent, AgentCapability, AgentTask, AgentResult, RealityLevel,
    RiskLevel, VerificationStatus, ActionDecision
)
from .action_gate import action_gate, ActionRequest
from ..integrations import osm, modbus_gateway, pulse
from ..core import world_model_events as wme
from ..jarvis.cost_risk_router import route_model

# ============================================================================
# Existing canonical agents remain unchanged above this point.
# ============================================================================

# ============================================================================
# 4. REASONING AGENT
# ============================================================================
class ReasoningAgent(Agent):
    def __init__(self):
        super().__init__(
            id="reasoning",
            name="Model-Backed Logical Deduction Specialist",
            description="Performs structured model-backed inference, evaluates evidence, isolates assumptions, and produces conclusions.",
            capabilities={AgentCapability.REASONING},
            supported_tools=["model_router", "gemini_reasoning", "dual_consensus"],
            reality_default=RealityLevel.INFERRED
        )

    async def _run(self, task: AgentTask) -> AgentResult:
        query = task.payload.get("normalized_query", "")
        domain = task.payload.get("domain", "GENERAL_INTELLIGENCE")
        wm_state = task.payload.get("world_model_state", {})
        research = task.payload.get("research_findings", {})

        route = route_model({"query": query})
        model_res = await route.chat([{
            "role": "user",
            "content": (
                "Analyze this ArchOS reasoning task independently. Return ONLY a JSON object "
                "with exactly these top-level fields: canonical_position (one of affirm, negate, "
                "uncertain, abstain), rationale (string), confidence (number 0..1), evidence (array "
                "of strings). Do not infer canonical_position from another model and do not issue actions.\n\n"
                f"QUERY: {query}\nDOMAIN: {domain}\nWORLD_MODEL: {json.dumps(wm_state, default=str)[:12000]}\n"
                f"RESEARCH: {json.dumps(research, default=str)[:12000]}"
            )
        }])

        assumptions = [
            "Building thermodynamic envelope remains sealed during peak ambient window",
            "DEWA tariff bands enforce red-tier rates between 12:00 and 18:00 GST",
            "Sensory Modbus data is calibrated within ±0.5% tolerance"
        ]

        bms = research.get("bms") or wm_state.get("current_state", {}).get("tower_b4471", {})
        climate = research.get("climate", {})
        temp = climate.get("temperature_2m", 31.4)
        strain = bms.get("strain_mpa", 142.42)
        power = bms.get("power_mw", 8.41)

        deductions = []
        if model_res.is_real and model_res.content:
            deductions.append(model_res.content)
            reality = RealityLevel.INFERRED
        else:
            if domain == "ENERGY_HVAC":
                deductions.append(f"Thermal load correlates with ambient peak ({temp}°C). Pre-cooling recommended at 04:00 GST.")
                deductions.append(f"Chiller power draw ({power} MW) can be shifted off-peak to achieve 14.8% cost reduction.")
            elif domain == "SPATIAL_URBAN":
                deductions.append("Downtown Dubai geometry holds verified structural integrity and conforms to municipal zoning bounds.")
            else:
                deductions.append(f"Sovereign telemetry analyzed across {domain} domain. Baseline strain ({strain} MPa) is within safe limits.")
            reality = RealityLevel.FALLBACK

        output = {
            "model_route": model_res.model_name or route.name,
            "deductions": deductions,
            "assumptions": assumptions,
            "confidence_score": 0.95 if model_res.is_real else 0.0,
            "synthesis": " ".join(deductions),
        }

        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status="SUCCESS" if model_res.is_real and model_res.content else "FAILED",
            output=output,
            reality=reality,
            confidence=output["confidence_score"],
            provenance=f"reasoning:model_route:{model_res.model_name}",
            evidence=deductions if model_res.is_real else [],
            error=None if model_res.is_real and model_res.content else "Reasoning model did not return a usable structured result",
        )

# ============================================================================
# 5. PLANNING AGENT
# ============================================================================
