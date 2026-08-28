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
        """Delegate consensus routing to the canonical consensus controller."""
        controller = self.agents.get("reasoning")
        if not isinstance(controller, ConsensusReasoningAgent):
            result = AgentResult(
                "reasoning_consensus",
                task.task_id,
                "FAILED",
                {},
                RealityLevel.FALLBACK,
                0.0,
                "consensus:missing_controller",
                error="Canonical consensus reasoning controller is not registered",
            )
            return result, {"resolution": "ABSTAIN", "lanes": []}

        result = await controller.execute(task)
        artifact = (result.output or {}).get("model_consensus", {})
        return result, artifact


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
