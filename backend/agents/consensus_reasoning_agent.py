"""Canonical multi-lane reasoning controller for ArchOS."""
from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from .base import Agent, AgentCapability, AgentTask, AgentResult, RealityLevel
from .consensus_contracts import CanonicalPosition, EvidenceRef, LaneResult, LaneStatus, normalize_position
from .consensus_engine import build_consensus
from .runtime_registry import runtime_registry


class ConsensusReasoningAgent(Agent):
    """Fan the canonical REASONING capability into independent peer lanes."""

    def __init__(self):
        super().__init__(
            id="reasoning",
            name="Multi-Model Consensus Reasoning Specialist",
            description="Fans reasoning tasks into independent baseline, Claude and Ox Alpha lanes and emits a governed consensus artifact.",
            capabilities={AgentCapability.REASONING},
            supported_tools=["model_router", "claude_model", "ox_alpha_model", "consensus_engine"],
            reality_default=RealityLevel.INFERRED,
        )

    @staticmethod
    def _extract_canonical_position(output: dict[str, Any]) -> CanonicalPosition | None:
        """Accept only an explicit canonical field; never infer a vote from prose."""
        direct = normalize_position(output.get("canonical_position", output.get("position")))
        if direct is not None:
            return direct
        for value in output.values():
            if not isinstance(value, str) or len(value) > 12000:
                continue
            match = re.search(
                r"\"(?:canonical_position|position)\"\s*:\s*\"(affirm|negate|uncertain|abstain)\"",
                value,
                re.IGNORECASE,
            )
            if match:
                return normalize_position(match.group(1))
        return None

    @staticmethod
    def _canonical_lane_result(lane_id: str, result: AgentResult, performance: float | None = None) -> LaneResult:
        output = result.output or {}
        position = ConsensusReasoningAgent._extract_canonical_position(output)
        status_map = {
            "SUCCESS": LaneStatus.SUCCESS,
            "TIMEOUT": LaneStatus.TIMEOUT,
            "FAILED": LaneStatus.ERROR,
            "DENIED": LaneStatus.ERROR,
            "UNCONFIGURED": LaneStatus.ERROR,
        }
        status = status_map.get(str(result.status).upper(), LaneStatus.ERROR)
        evidence = tuple(
            EvidenceRef(source=f"{lane_id}:result", claim=str(item), strength=0.5)
            for item in (result.evidence or [])
        )
        return LaneResult(
            lane_id=lane_id,
            position=position,
            rationale=str(
                output.get("rationale")
                or output.get("analysis")
                or output.get("synthesis")
                or output.get("claude_analysis")
                or output.get("ox_alpha_analysis")
                or ""
            ),
            confidence=max(0.0, min(1.0, float(result.confidence or 0.0))),
            evidence=evidence,
            status=status if position is not None or status is not LaneStatus.SUCCESS else LaneStatus.ERROR,
            model=str(output.get("model_route") or lane_id),
            error=result.error if position is not None else (result.error or "Missing explicit canonical position"),
            reliability_score=performance,
        )

    async def _run(self, task: AgentTask) -> AgentResult:
        from .specialists import ReasoningAgent
        from .claude_reasoning_agent import ClaudeReasoningAgent
        from .swarm import swarm

        baseline = ReasoningAgent()
        claude = swarm.get_agent("claude_reasoning") or ClaudeReasoningAgent()
        ox_runtime = runtime_registry.get("ox_alpha_reasoning")

        if ox_runtime is None:
            return AgentResult(
                agent_id=self.id,
                task_id=task.task_id,
                status="FAILED",
                output={"consensus_resolution": "abstain", "reason": "Ox Alpha runtime is not bound in the canonical runtime registry"},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                provenance="reasoning:tri_lane_consensus:runtime_unbound",
                evidence=[],
                error="Ox Alpha runtime is not bound in the canonical runtime registry",
            )

        results = await asyncio.gather(
            baseline.execute(task),
            claude.execute(task),
            ox_runtime.execute(task),
        )
        peer_objects = [baseline, claude, ox_runtime.agent]
        lane_results = tuple(
            self._canonical_lane_result(lane_id, result, getattr(agent, "performance", None))
            for (lane_id, _), result, agent in zip(
                [("baseline_reasoning", baseline), ("claude_reasoning", claude), ("ox_alpha_reasoning", ox_runtime.agent)],
                results,
                peer_objects,
            )
        )
        artifact = build_consensus(
            task.task_id,
            task.correlation_id,
            lane_results,
            high_impact=task.risk_level.value in {"CONSEQUENTIAL", "HIGH_IMPACT"},
        )

        successful = [result for result in results if str(result.status).upper() == "SUCCESS"]
        best = max(successful, key=lambda result: result.confidence, default=results[0])
        output = dict(best.output or {})
        output["model_consensus"] = artifact.to_dict()
        output["reasoning_lanes"] = ["baseline_reasoning", "claude_reasoning", "ox_alpha_reasoning"]
        output["lane_results"] = {
            lane_id: result.output
            for lane_id, result in zip(output["reasoning_lanes"], results)
        }
        output["consensus_resolution"] = artifact.resolution.value
        output["consensus_agreement_score"] = artifact.agreement_score
        output["consensus_panel_state"] = artifact.panel_state.value
        output["proposed_position"] = artifact.proposed_position.value if artifact.proposed_position else None
        output["selected_position"] = artifact.selected_position.value if artifact.selected_position else None

        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status="SUCCESS" if successful else "FAILED",
            output=output,
            reality=best.reality,
            confidence=best.confidence if successful else 0.0,
            provenance="reasoning:tri_lane_consensus",
            evidence=[f"lane:{result.agent_id}" for result in successful],
            error=None if successful else "All reasoning lanes failed or produced no canonical position",
        )
