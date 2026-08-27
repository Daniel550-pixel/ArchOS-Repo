"""ArchOS multi-agent swarm registry and capability router."""
from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional, Set

from .base import Agent, AgentCapability, AgentTask, AgentResult, InterAgentMessage, RealityLevel
from .specialists import (
    PerceptionAgent,
    WorldModelAgent,
    ResearchAgent,
    ReasoningAgent,
    PlanningAgent,
    RiskAgent,
    VerificationAgent,
    ExecutionAgent,
)
from .claude_reasoning_agent import ClaudeReasoningAgent
from .ox_alpha_reasoning_agent import OxAlphaReasoningAgent
from .consensus_reasoning_agent import ConsensusReasoningAgent
from .financial_intelligence_agent import FinancialIntelligenceAgent
from .multimodal_intelligence_agent import MultimodalIntelligenceAgent
from .authoritative_world_model_agent import AuthoritativeWorldModelAgent
from .consensus import LaneAssessment, build_consensus_artifact
from app.services.event_fabric import app_event_fabric as fabric


class Swarm:
    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.messages: List[InterAgentMessage] = []
        self._lock = asyncio.Lock()

    def register(self, agent: Agent):
        if agent.id in self.agents:
            raise ValueError(f"Agent already registered: {agent.id}")
        self.agents[agent.id] = agent

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        return self.agents.get(agent_id)

    def list_agents(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "capabilities": [c.value if hasattr(c, "value") else str(c) for c in a.capabilities],
                "required_permissions": list(a.required_permissions),
                "supported_tools": list(a.supported_tools),
                "workload": round(a.workload, 2),
                "performance": round(a.performance, 2),
                "reality_default": a.reality_default.value if hasattr(a.reality_default, "value") else str(a.reality_default),
            }
            for a in self.agents.values()
        ]

    async def log_message(self, msg: InterAgentMessage):
        async with self._lock:
            self.messages.append(msg)
            if len(self.messages) > 200:
                self.messages = self.messages[-200:]
        await fabric.publish(
            "AGENT_MESSAGE",
            {
                "message_id": msg.message_id,
                "task_id": msg.task_id,
                "sender": msg.sender,
                "receiver": msg.receiver,
                "type": msg.message_type,
                "reality": msg.reality.value if hasattr(msg.reality, "value") else str(msg.reality),
                "confidence": msg.confidence,
                "correlation_id": msg.correlation_id,
            },
        )

    def eligible_agents(
        self,
        required_capabilities: Set[AgentCapability],
        required_permissions: Optional[Set[str]] = None,
    ) -> List[Agent]:
        permissions = required_permissions or set()
        return sorted(
            [
                a
                for a in self.agents.values()
                if required_capabilities.issubset(a.capabilities)
                and permissions.issubset(set(a.required_permissions))
            ],
            key=lambda a: (a.workload, -a.performance),
        )

    async def dispatch(self, agent_id: str, task: AgentTask) -> AgentResult:
        agent = self.agents.get(agent_id)
        if not agent:
            return AgentResult(agent_id, task.task_id, "FAILED", {}, RealityLevel.FALLBACK, 0.0, error="Requested agent is not registered")

        if agent_id == "execution":
            if not bool(task.payload.get("is_action_intent", False)):
                await fabric.publish("EXECUTION_SKIPPED", {"task_id": task.task_id, "reason": "NON_ACTION_INTENT", "correlation_id": task.correlation_id})
                return AgentResult(agent.id, task.task_id, "SKIPPED", {"action_state": "RESPONSE_ONLY", "governance_decision": "NOT_APPLICABLE"}, RealityLevel.OBSERVED, 1.0, "swarm:execution_gate:non_action_intent")
            if str(task.payload.get("verification_status", "UNVERIFIED")) != "VERIFIED":
                await fabric.publish("EXECUTION_BLOCKED", {"task_id": task.task_id, "reason": "VERIFICATION_REQUIRED", "verification_status": task.payload.get("verification_status", "UNVERIFIED"), "correlation_id": task.correlation_id})
                return AgentResult(agent.id, task.task_id, "DENIED", {"action_state": "BLOCKED", "governance_decision": "DENIED"}, RealityLevel.FALLBACK, 0.0, "swarm:execution_gate:verification_required", error="Execution requires VERIFIED")
            task.required_capabilities = task.required_capabilities or {AgentCapability.EXECUTION}

        if not task.required_capabilities:
            task.required_capabilities = set(agent.capabilities)
        if not agent.can_accept(task):
            return AgentResult(agent.id, task.task_id, "DENIED", {}, RealityLevel.FALLBACK, 0.0, f"{agent.id}:capability_contract_denied", error="Requested agent does not satisfy task contract")

        await fabric.publish(
            "AGENT_STARTED",
            {
                "task_id": task.task_id,
                "agent_id": agent.id,
                "agent_name": agent.name,
                "required_capabilities": [c.value for c in task.required_capabilities],
                "correlation_id": task.correlation_id,
            },
        )
        result = await agent.execute(task)
        await fabric.publish(
            "AGENT_COMPLETED",
            {
                "task_id": task.task_id,
                "agent_id": agent.id,
                "status": result.status,
                "execution_time_ms": result.execution_time_ms,
                "correlation_id": task.correlation_id,
            },
        )
        return result

    async def route(self, task: AgentTask) -> AgentResult:
        if not task.required_capabilities:
            return AgentResult("swarm", task.task_id, "DENIED", {}, RealityLevel.FALLBACK, 0.0, "swarm:missing_capability_contract", error="Capability contract is required")
        candidates = self.eligible_agents(task.required_capabilities, task.required_permissions)
        if not candidates:
            return AgentResult("swarm", task.task_id, "DENIED", {}, RealityLevel.FALLBACK, 0.0, "swarm:no_eligible_agent", error="No eligible agent")
        return await self.dispatch(candidates[0].id, task)

    async def route_reasoning_consensus(self, task: AgentTask) -> tuple[AgentResult, Dict[str, Any]]:
        """Run the independent baseline, Claude and Ox Alpha reasoning lanes concurrently."""
        lane_ids = ("baseline_reasoning", "claude_reasoning", "ox_alpha_reasoning")
        baseline = ReasoningAgent()
        baseline.id = "baseline_reasoning"
        lanes = [baseline, self.agents.get("claude_reasoning"), self.agents.get("ox_alpha_reasoning")]
        if any(agent is None for agent in lanes):
            missing = [agent_id for agent_id, agent in zip(lane_ids, lanes) if agent is None]
            result = AgentResult("reasoning_consensus", task.task_id, "FAILED", {}, RealityLevel.FALLBACK, 0.0, "consensus:missing_lane", error=f"Missing reasoning lanes: {', '.join(missing)}")
            return result, {"resolution": "ABSTAIN", "lanes": []}

        results = await asyncio.gather(*(agent.execute(task) for agent in lanes))
        assessments: List[LaneAssessment] = []
        evidence_count = sum(len(result.evidence) for result in results if result.status == "SUCCESS")
        for lane_id, result in zip(lane_ids, results):
            output = result.output or {}
            position = str(output.get("synthesis") or output.get("ox_alpha_analysis") or output.get("claude_analysis") or "").strip()
            assessments.append(
                LaneAssessment(
                    lane_id=lane_id,
                    status=result.status,
                    position=position,
                    confidence=result.confidence,
                    evidence_density=min(1.0, len(result.evidence) / 5.0),
                    reliability_score=self.agents.get(lane_id).performance if self.agents.get(lane_id) else 1.0,
                    model=str(output.get("model_route") or output.get("model") or lane_id),
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
        successful = [r for r in results if r.status == "SUCCESS"]
        best = max(successful, key=lambda r: r.confidence, default=results[0])
        output = dict(best.output or {})
        output["model_consensus"] = artifact.to_dict()
        output["reasoning_lanes"] = list(lane_ids)
        output["lane_results"] = {lane_id: result.output for lane_id, result in zip(lane_ids, results)}
        output["consensus_evidence_count"] = evidence_count
        output["consensus_resolution"] = artifact.resolution.value
        aggregate = AgentResult(
            agent_id="reasoning_consensus",
            task_id=task.task_id,
            status="SUCCESS" if successful else "FAILED",
            output=output,
            reality=best.reality,
            confidence=artifact.claims[0].confidence if artifact.claims else 0.0,
            provenance="reasoning:tri_lane_consensus",
            evidence=[f"lane:{r.agent_id}" for r in successful],
        )
        await fabric.publish(
            "MODEL_CONSENSUS_COMPLETED",
            {
                "task_id": task.task_id,
                "resolution": artifact.resolution.value,
                "agreement_score": artifact.agreement_score,
                "conflict_score": artifact.conflict_score,
                "lanes": list(lane_ids),
            },
        )
        return aggregate, artifact.to_dict()


def create_canonical_swarm() -> Swarm:
    s = Swarm()
    for agent in (
        PerceptionAgent(),
        AuthoritativeWorldModelAgent(),
        ResearchAgent(),
        ConsensusReasoningAgent(),
        ClaudeReasoningAgent(),
        OxAlphaReasoningAgent(),
        PlanningAgent(),
        RiskAgent(),
        VerificationAgent(),
        ExecutionAgent(),
        FinancialIntelligenceAgent(),
        MultimodalIntelligenceAgent(),
    ):
        s.register(agent)
    return s


swarm = create_canonical_swarm()
