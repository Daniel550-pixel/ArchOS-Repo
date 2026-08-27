"""Canonical multi-lane reasoning controller for ArchOS.

J.A.R.V.I.S. dispatches one REASONING capability. This controller fans the
request into independent peer lanes, normalizes their typed results, and
emits a consensus artifact. Models never receive execution authority.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from .base import Agent, AgentCapability, AgentTask, AgentResult, RealityLevel
from .consensus_contracts import EvidenceRef, LaneResult, LaneStatus
from .consensus_engine import build_consensus


class ConsensusReasoningAgent(Agent):
    def __init__(self):
        super().__init__(
            id="reasoning",
            name="Multi-Model Consensus Reasoning Specialist",
            description="Fans reasoning tasks into independent baseline, Claude and Ox Alpha lanes and emits a typed consensus artifact.",
            capabilities={AgentCapability.REASONING},
            supported_tools=["model_router", "claude_model", "ox_alpha_model", "consensus_engine"],
            reality_default=RealityLevel.INFERRED,
        )

    @staticmethod
    def _canonical_lane_result(lane_id: str, result: AgentResult, performance: float | None = None) -> LaneResult:
        output: dict[str, Any] = result.output or {}
        position = output.get("position")
        if not position:
            # Compatibility fallback for old lanes. New lanes should always emit
            # a canonical position field; free-form analysis is never the preferred
            # consensus key.
            position = output.get("canonical_position")

        evidence = tuple(
            EvidenceRef(source=str(item), claim=str(item), strength=1.0, reality_grounded=False)
            for item in (result.evidence or [])
        )
        status_map = {
            "SUCCESS": LaneStatus.SUCCESS,
            "TIMEOUT": LaneStatus.TIMEOUT,
            "FAILED": LaneStatus.ERROR,
            "DENIED": LaneStatus.ERROR,
        }
        status = status_map.get(result.status, LaneStatus.ERROR)
        return LaneResult(
            lane_id=lane_id,
            position=str(position).strip() if position else None,
            rationale=str(output.get("rationale") or output.get("analysis") or output.get("synthesis") or ""),
            confidence=max(0.0, min(1.0, float(result.confidence or 0.0))),
            evidence=evidence,
            status=status,
            model=str(output.get("model_route") or lane_id),
            error=result.error,
            reliability_score=performance,
        )

    async def _run(self, task: AgentTask) -> AgentResult:
        # Lazy imports prevent a module cycle during canonical swarm construction.
        from .specialists import ReasoningAgent
        from .claude_reasoning_agent import ClaudeReasoningAgent
        from .ox_alpha_reasoning_agent import OxAlphaReasoningAgent
        from .swarm import swarm

        # Temporary compatibility boundary: baseline must not resolve the canonical
        # "reasoning" capability because this controller owns that capability.
        peers = [
            ("baseline_reasoning", ReasoningAgent()),
            ("claude_reasoning", swarm.get_agent("claude_reasoning") or ClaudeReasoningAgent()),
            ("ox_alpha_reasoning", swarm.get_agent("ox_alpha_reasoning") or OxAlphaReasoningAgent()),
        ]

        # Agent.execute() already converts lane exceptions/timeouts into typed
        # AgentResult values. return_exceptions=False is therefore safe here and
        # preserves the invariant that consensus receives one result per lane.
        results = await asyncio.gather(*(agent.execute(task) for _, agent in peers))
        lane_results = tuple(
            self._canonical_lane_result(
                lane_id,
                result,
                getattr(agent, "performance", None),
            )
            for (lane_id, agent), result in zip(peers, results)
        )

        artifact = build_consensus(
            task_id=task.task_id,
            decision_id=task.correlation_id,
            lanes=lane_results,
            high_impact=task.risk_level.value in {"CONSEQUENTIAL", "HIGH_IMPACT"},
        )

        successful = [r for r in results if r.status == "SUCCESS"]
        best = max(successful, key=lambda result: result.confidence, default=results[0])
        output = dict(best.output or {})
        output["model_consensus"] = artifact.to_dict()
        output["reasoning_lanes"] = [lane_id for lane_id, _ in peers]
        output["lane_results"] = {lane_id: result.output for (lane_id, _), result in zip(peers, results)}
        output["consensus_resolution"] = artifact.resolution.value
        output["consensus_agreement_score"] = artifact.agreement_score
        output["consensus_panel_state"] = artifact.panel_state.value
        output["selected_position"] = artifact.selected_position

        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status="SUCCESS" if successful else "FAILED",
            output=output,
            reality=best.reality,
            confidence=best.confidence if successful else 0.0,
            provenance="reasoning:tri_lane_consensus",
            evidence=[f"lane:{result.agent_id}" for result in successful],
            error=None if successful else "All reasoning lanes failed",
        )
