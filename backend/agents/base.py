"""ArchOS specialist-agent contracts and execution boundaries."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Set, Dict, Any, List, Optional
import uuid
import time
import asyncio
from datetime import datetime, timezone


class AgentCapability(str, Enum):
    PERCEPTION = "PERCEPTION"
    WORLD_MODEL = "WORLD_MODEL"
    REASONING = "REASONING"
    PLANNING = "PLANNING"
    VERIFICATION = "VERIFICATION"
    RISK_ASSESSMENT = "RISK_ASSESSMENT"
    RESEARCH = "RESEARCH"
    EXECUTION = "EXECUTION"
    COMMUNICATION = "COMMUNICATION"


class RealityLevel(str, Enum):
    OBSERVED = "OBSERVED"
    INFERRED = "INFERRED"
    PREDICTED = "PREDICTED"
    SIMULATED = "SIMULATED"
    EMULATED = "EMULATED"
    FALLBACK = "FALLBACK"


class RiskLevel(str, Enum):
    READ_ONLY = "READ_ONLY"
    LOW_RISK = "LOW_RISK"
    CONSEQUENTIAL = "CONSEQUENTIAL"
    HIGH_IMPACT = "HIGH_IMPACT"


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    REJECTED = "REJECTED"


class ActionDecision(str, Enum):
    ALLOWED = "ALLOWED"
    DENIED = "DENIED"
    REQUIRES_APPROVAL = "REQUIRES_APPROVAL"


@dataclass
class AgentTask:
    task_id: str
    intent: str
    payload: Dict[str, Any]
    actor: str = "operator"
    tenant_id: str = "uae-sovereign"
    correlation_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    timeout_sec: float = 30.0
    required_capabilities: Set[AgentCapability] = field(default_factory=set)
    required_permissions: Set[str] = field(default_factory=set)
    risk_level: RiskLevel = RiskLevel.READ_ONLY
    verification_required: bool = True


@dataclass
class AgentResult:
    agent_id: str
    task_id: str
    status: str
    output: Dict[str, Any]
    reality: RealityLevel = RealityLevel.INFERRED
    confidence: float = 1.0
    provenance: str = ""
    evidence: List[str] = field(default_factory=list)
    execution_time_ms: float = 0.0
    error: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class InterAgentMessage:
    message_id: str = field(default_factory=lambda: f"msg-{uuid.uuid4().hex[:12]}")
    task_id: str = ""
    sender: str = ""
    receiver: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    message_type: str = "DATA_EXCHANGE"
    payload: Dict[str, Any] = field(default_factory=dict)
    provenance: str = ""
    confidence: float = 1.0
    reality: RealityLevel = RealityLevel.INFERRED
    correlation_id: str = ""


@dataclass
class Agent:
    id: str
    name: str
    description: str
    capabilities: Set[AgentCapability]
    required_permissions: List[str] = field(default_factory=list)
    supported_tools: List[str] = field(default_factory=list)
    timeout_sec: float = 15.0
    workload: float = 0.0
    performance: float = 1.0
    reality_default: RealityLevel = RealityLevel.INFERRED

    def can_accept(self, task: AgentTask) -> bool:
        """Return whether this agent satisfies the task's declared capability contract."""
        if task.required_capabilities and not task.required_capabilities.issubset(self.capabilities):
            return False
        if task.required_permissions and not task.required_permissions.issubset(set(self.required_permissions)):
            return False
        return True

    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute only after the swarm has validated the capability contract."""
        if not self.can_accept(task):
            return AgentResult(
                agent_id=self.id,
                task_id=task.task_id,
                status="DENIED",
                output={},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                provenance=f"{self.id}:capability_contract_denied",
                error="Agent does not satisfy the task capability/permission contract",
            )

        start = time.time()
        self.workload = min(1.0, self.workload + 0.2)
        try:
            res = await asyncio.wait_for(
                self._run(task), timeout=min(task.timeout_sec, self.timeout_sec)
            )
            res.execution_time_ms = round((time.time() - start) * 1000, 2)
            self.performance = min(1.0, self.performance * 0.98 + 0.02)
            return res
        except asyncio.TimeoutError:
            self.performance = max(0.2, self.performance - 0.1)
            return AgentResult(
                agent_id=self.id,
                task_id=task.task_id,
                status="TIMEOUT",
                output={},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                provenance=f"{self.id}:execution_timeout",
                execution_time_ms=round((time.time() - start) * 1000, 2),
                error=f"Agent {self.id} timed out after {self.timeout_sec}s",
            )
        except Exception:
            self.performance = max(0.2, self.performance - 0.05)
            return AgentResult(
                agent_id=self.id,
                task_id=task.task_id,
                status="FAILED",
                output={},
                reality=RealityLevel.FALLBACK,
                confidence=0.0,
                provenance=f"{self.id}:exception",
                execution_time_ms=round((time.time() - start) * 1000, 2),
                error="Agent execution failed",
            )
        finally:
            self.workload = max(0.0, self.workload - 0.2)

    async def _run(self, task: AgentTask) -> AgentResult:
        """Internal execution method to be overridden by specialist implementations."""
        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status="SUCCESS",
            output={"result": "ok"},
            reality=self.reality_default,
            confidence=self.performance,
            provenance=f"{self.id}:base",
        )
