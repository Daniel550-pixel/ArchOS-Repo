"""ArchOS multi-agent swarm registry and capability router."""
from typing import Dict, Set, Any, List, Optional
import asyncio

from .base import Agent, AgentCapability, AgentTask, AgentResult, InterAgentMessage, RealityLevel
from .specialists import (
    PerceptionAgent, WorldModelAgent, ResearchAgent, ReasoningAgent,
    PlanningAgent, RiskAgent, VerificationAgent, ExecutionAgent,
)
from .authoritative_world_model_agent import AuthoritativeWorldModelAgent
from app.services.event_fabric import app_event_fabric as fabric


class Swarm:
    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.messages: List[InterAgentMessage] = []
        self._lock = asyncio.Lock()

    def register(self, agent: Agent):
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
        await fabric.publish("AGENT_MESSAGE", {
            "message_id": msg.message_id,
            "task_id": msg.task_id,
            "sender": msg.sender,
            "receiver": msg.receiver,
            "type": msg.message_type,
            "reality": msg.reality.value if hasattr(msg.reality, "value") else str(msg.reality),
            "confidence": msg.confidence,
            "correlation_id": msg.correlation_id,
        })

    def eligible_agents(
        self,
        required_capabilities: Set[AgentCapability],
        required_permissions: Optional[Set[str]] = None,
    ) -> List[Agent]:
        permissions = required_permissions or set()
        candidates = [
            agent for agent in self.agents.values()
            if required_capabilities.issubset(agent.capabilities)
            and permissions.issubset(set(agent.required_permissions))
        ]
        return sorted(candidates, key=lambda a: (a.workload, -a.performance))

    async def dispatch(self, agent_id: str, task: AgentTask) -> AgentResult:
        """Dispatch only through the agent's declared contract and hard execution gates."""
        agent = self.agents.get(agent_id)
        if not agent:
            return AgentResult(
                agent_id=agent_id,
                task_id=task.task_id,
                status="FAILED",
                output={},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                error="Requested agent is not registered",
            )

        # Execution is a privileged capability. The orchestrator may construct
        # a response task for every request, but the execution agent must never
        # be invoked for a non-action intent and must never execute an action
        # whose verification certificate is not VERIFIED.
        if agent_id == "execution":
            is_action = bool(task.payload.get("is_action_intent", False))
            verification_status = str(task.payload.get("verification_status", "UNVERIFIED"))

            if not is_action:
                await fabric.publish("EXECUTION_SKIPPED", {
                    "task_id": task.task_id,
                    "reason": "NON_ACTION_INTENT",
                    "correlation_id": task.correlation_id,
                })
                return AgentResult(
                    agent_id=agent.id,
                    task_id=task.task_id,
                    status="SKIPPED",
                    output={
                        "action_state": "RESPONSE_ONLY",
                        "governance_decision": "NOT_APPLICABLE",
                    },
                    reality=RealityLevel.OBSERVED,
                    confidence=1.0,
                    provenance="swarm:execution_gate:non_action_intent",
                )

            if verification_status != "VERIFIED":
                await fabric.publish("EXECUTION_BLOCKED", {
                    "task_id": task.task_id,
                    "reason": "VERIFICATION_REQUIRED",
                    "verification_status": verification_status,
                    "correlation_id": task.correlation_id,
                })
                return AgentResult(
                    agent_id=agent.id,
                    task_id=task.task_id,
                    status="DENIED",
                    output={
                        "action_state": "BLOCKED",
                        "governance_decision": "DENIED",
                        "reason": "Execution requires a VERIFIED certificate",
                    },
                    reality=RealityLevel.FALLBACK,
                    confidence=0.0,
                    provenance="swarm:execution_gate:verification_required",
                    error="Execution blocked because verification is not VERIFIED",
                )

            task.required_capabilities = task.required_capabilities or {AgentCapability.EXECUTION}

        # Existing named dispatches identify a concrete specialist. Bind legacy
        # calls to that agent's immutable capability set so they cannot execute
        # through a mismatched agent. New call sites should declare capabilities
        # explicitly and use route().
        if not task.required_capabilities:
            task.required_capabilities = set(agent.capabilities)

        if not agent.can_accept(task):
            return AgentResult(
                agent_id=agent.id,
                task_id=task.task_id,
                status="DENIED",
                output={},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                provenance=f"{agent.id}:capability_contract_denied",
                error="Requested agent does not satisfy task contract",
            )

        await fabric.publish("AGENT_STARTED", {
            "task_id": task.task_id,
            "agent_id": agent.id,
            "agent_name": agent.name,
            "required_capabilities": [c.value for c in task.required_capabilities],
            "correlation_id": task.correlation_id,
        })
        result = await agent.execute(task)
        await fabric.publish("AGENT_COMPLETED", {
            "task_id": task.task_id,
            "agent_id": agent.id,
            "status": result.status,
            "execution_time_ms": result.execution_time_ms,
            "correlation_id": task.correlation_id,
        })
        return result

    async def route(self, task: AgentTask) -> AgentResult:
        """Select the best eligible agent from the declared capability contract."""
        if not task.required_capabilities:
            return AgentResult(
                agent_id="swarm",
                task_id=task.task_id,
                status="DENIED",
                output={},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                provenance="swarm:missing_capability_contract",
                error="Capability contract is required for routed dispatch",
            )
        candidates = self.eligible_agents(task.required_capabilities, task.required_permissions)
        if not candidates:
            return AgentResult(
                agent_id="swarm",
                task_id=task.task_id,
                status="DENIED",
                output={},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                provenance="swarm:no_eligible_agent",
                error="No registered agent satisfies the requested capability contract",
            )
        return await self.dispatch(candidates[0].id, task)


def create_canonical_swarm() -> Swarm:
    swarm_instance = Swarm()
    swarm_instance.register(PerceptionAgent())
    swarm_instance.register(AuthoritativeWorldModelAgent())
    swarm_instance.register(ResearchAgent())
    swarm_instance.register(ReasoningAgent())
    swarm_instance.register(PlanningAgent())
    swarm_instance.register(RiskAgent())
    swarm_instance.register(VerificationAgent())
    swarm_instance.register(ExecutionAgent())
    return swarm_instance


swarm = create_canonical_swarm()
