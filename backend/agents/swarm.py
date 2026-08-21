"""ArchOS Multi-Agent Swarm Registry & Inter-Agent Router.
Manages specialist agent registration, capability routing,
bounded concurrency, and inter-agent message tracking.
"""
from typing import Dict, Set, Any, List, Optional
import asyncio
from datetime import datetime, timezone

from .base import Agent, AgentCapability, AgentTask, AgentResult, InterAgentMessage, RealityLevel
from .specialists import (
    PerceptionAgent,
    WorldModelAgent,
    ResearchAgent,
    ReasoningAgent,
    PlanningAgent,
    RiskAgent,
    VerificationAgent,
    ExecutionAgent
)
from ..core.event_fabric import fabric

class Swarm:
    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.messages: List[InterAgentMessage] = []
        self._lock = asyncio.Lock()

    def register(self, a: Agent):
        self.agents[a.id] = a

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        return self.agents.get(agent_id)

    def list_agents(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "capabilities": [c.value if hasattr(c, "value") else str(c) for c in a.capabilities],
                "supported_tools": a.supported_tools,
                "workload": round(a.workload, 2),
                "performance": round(a.performance, 2),
                "reality_default": a.reality_default.value if hasattr(a.reality_default, "value") else str(a.reality_default)
            }
            for a in self.agents.values()
        ]

    async def log_message(self, msg: InterAgentMessage):
        async with self._lock:
            self.messages.append(msg)
            if len(self.messages) > 200:
                self.messages = self.messages[-200:]
        try:
            await fabric.publish("AGENT_MESSAGE", {
                "message_id": msg.message_id,
                "task_id": msg.task_id,
                "sender": msg.sender,
                "receiver": msg.receiver,
                "type": msg.message_type,
                "reality": msg.reality.value if hasattr(msg.reality, "value") else str(msg.reality),
                "confidence": msg.confidence
            })
        except Exception:
            pass

    async def dispatch(self, agent_id: str, task: AgentTask) -> AgentResult:
        agent = self.agents.get(agent_id)
        if not agent:
            return AgentResult(
                agent_id=agent_id,
                task_id=task.task_id,
                status="FAILED",
                output={},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                error=f"Agent '{agent_id}' is not registered in Sovereign Swarm."
            )

        try:
            await fabric.publish("AGENT_STARTED", {
                "task_id": task.task_id,
                "agent_id": agent.id,
                "agent_name": agent.name
            })
        except Exception:
            pass

        res = await agent.execute(task)

        try:
            await fabric.publish("AGENT_COMPLETED", {
                "task_id": task.task_id,
                "agent_id": agent.id,
                "status": res.status,
                "execution_time_ms": res.execution_time_ms
            })
        except Exception:
            pass

        return res

def create_canonical_swarm() -> Swarm:
    s = Swarm()
    s.register(PerceptionAgent())
    s.register(WorldModelAgent())
    s.register(ResearchAgent())
    s.register(ReasoningAgent())
    s.register(PlanningAgent())
    s.register(RiskAgent())
    s.register(VerificationAgent())
    s.register(ExecutionAgent())
    return s

swarm = create_canonical_swarm()
