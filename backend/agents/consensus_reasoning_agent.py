"""Consensus reasoning agent that occupies the canonical REASONING slot.

J.A.R.V.I.S. continues to dispatch one capability, while this agent fans the
reasoning task out to independent peer lanes and returns a typed consensus
artifact. No lane receives execution authority.
"""
from __future__ import annotations

import asyncio
from typing import List

from .base import Agent, AgentCapability, AgentTask, AgentResult, RealityLevel
from .consensus import LaneAssessment, build_consensus_artifact


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

    async def _run(self, task: AgentTask) -> AgentResult:
        # Lazy imports avoid a module-cycle during canonical swarm construction.
        from .specialists import ReasoningAgent
        from .claude_reasoning_agent import ClaudeReasoningAgent
        from .ox_alpha_reasoning_agent import OxAlphaReasoningAgent
        from .swarm import swarm

        # The baseline is intentionally instantiated as a peer, not routed through
        # the canonical "reasoning" slot, which is this consensus agent itself.
        peers = [
            ("baseline_reasoning", ReasoningAgent()),
            ("claude_reasoning", swarm.get_agent("claude_reasoning") or ClaudeReasoningAgent()),
            ("ox_alpha_reasoning", swarm.get_agent("ox_alpha_reasoning") or OxAlphaReasoningAgent()),
        ]
        results = await asyncio.gather(*(agent.execute(task) for _, agent in peers))

        assessments: List[LaneAssessment] = []
        successful = []
        for lane_id, result in zip((p[0] for p in peers), results):
            if result.status == "SUCCESS":
                successful.append(result)
            output = result.output or {}
            position = str(
                output.get("synthesis")
                or output.get("claude_analysis")
                or output.get("ox_alpha_analysis")
                or ""
            ).strip()
            assessments.append(
                LaneAssessment(
                    lane_id=lane_id,
                    status=result.status,
                    position=position,
                    confidence=result.confidence,
                    evidence_density=min(1.0, len(result.evidence) / 5.0),
                    reliability_score=1.0 if lane_id == "baseline_reasoning" else swarm.get_agent(lane_id).performance,
                    model=str(output.get("model_route") or lane_id),
                    error=result.error,
                )
            )

        artifact = build_consensus_artifact(
            task_id=task.task_id,
            decision_id=task.correlation_id,
            lane_results=assessments,
            claim="Independent reasoning position for the normalized ArchOS task.",
            high_impact=task.risk_level.value in {"CONSEQUENTIAL", "HIGH_IMPACT"},
        )

        best = max(successful, key=lambda result: result.confidence, default=results[0])
        output = dict(best.output or {})
        output["model_consensus"] = artifact.to_dict()
        output["reasoning_lanes"] = [lane_id for lane_id, _ in peers]
        output["lane_results"] = {lane_id: result.output for (lane_id, _), result in zip(peers, results)}
        output["consensus_resolution"] = artifact.resolution.value
        output["consensus_agreement_score"] = artifact.agreement_score
        output["consensus_conflict_score"] = artifact.conflict_score

        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status="SUCCESS" if successful else "FAILED",
            output=output,
            reality=best.reality,
            confidence=artifact.claims[0].confidence if artifact.claims else 0.0,
            provenance="reasoning:tri_lane_consensus",
            evidence=[f"lane:{result.agent_id}" for result in successful],
            error=None if successful else "All reasoning lanes failed",
        )
