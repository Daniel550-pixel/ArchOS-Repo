"""Public Agent Fabric contract with mandatory cross-agent verification."""
from datetime import datetime, timezone
from typing import Any
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.agents.base import AgentCapability, AgentTask, RiskLevel
from backend.agents.swarm import swarm
from backend.agents.verification import agent_result_verifier
from backend.agents.evidence_ledger import evidence_ledger
from app.services.event_fabric import app_event_fabric as fabric

router = APIRouter(prefix="/agents", tags=["agents"])
_registry: dict[str, dict[str, Any]] = {}
_tasks: dict[str, dict[str, Any]] = {}

class AgentCapabilityContract(BaseModel):
    name: AgentCapability
    description: str = Field(default="", max_length=2000)
    input_schema: dict[str, Any] = Field(default_factory=dict)
    output_schema: dict[str, Any] = Field(default_factory=dict)

class AgentRegistration(BaseModel):
    agent_id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    version: str = Field(min_length=1, max_length=64)
    description: str = Field(default="", max_length=2000)
    capabilities: list[AgentCapabilityContract] = Field(default_factory=list)
    required_permissions: list[str] = Field(default_factory=list)
    supported_tools: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    timeout_sec: float = Field(default=15.0, gt=0, le=300)

class AgentTaskRequest(BaseModel):
    intent: str = Field(min_length=1, max_length=4000)
    payload: dict[str, Any] = Field(default_factory=dict)
    actor: str = "operator"
    tenant_id: str = "uae-sovereign"
    required_capabilities: list[AgentCapability] = Field(default_factory=list)
    required_permissions: list[str] = Field(default_factory=list)
    risk_level: RiskLevel = RiskLevel.READ_ONLY
    verification_required: bool = True
    timeout_sec: float = Field(default=30.0, gt=0, le=300)

@router.post("/register", status_code=201)
async def register_agent(request: AgentRegistration):
    agent_id = request.agent_id or f"agent-{uuid.uuid4().hex[:12]}"
    if agent_id in _registry:
        raise HTTPException(status_code=409, detail="Agent already registered")
    record = request.model_dump()
    record.update({"agent_id": agent_id, "status": "REGISTERED", "registered_at": datetime.now(timezone.utc).isoformat()})
    _registry[agent_id] = record
    await fabric.publish("AGENT_REGISTERED", {"agent_id": agent_id, "name": request.name, "version": request.version, "capabilities": [c.name.value for c in request.capabilities]}, source="agent_fabric")
    return record

@router.get("")
async def list_agents():
    return {"agents": list(_registry.values()), "count": len(_registry)}

@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    agent = _registry.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.post("/{agent_id}/tasks", status_code=202)
async def submit_agent_task(agent_id: str, request: AgentTaskRequest):
    agent = _registry.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    available = {cap["name"] for cap in agent["capabilities"]}
    required = {cap.value for cap in request.required_capabilities}
    if required and not required.issubset(available):
        raise HTTPException(status_code=422, detail="Registered agent does not satisfy required capabilities")
    required_permissions = set(request.required_permissions)
    if required_permissions and not required_permissions.issubset(set(agent["required_permissions"])):
        raise HTTPException(status_code=403, detail="Agent does not satisfy required permissions")
    if swarm.get_agent(agent_id) is None:
        raise HTTPException(status_code=409, detail="Agent has no executable runtime binding")

    task = AgentTask(task_id=f"task-{uuid.uuid4().hex[:12]}", intent=request.intent, payload=request.payload, actor=request.actor, tenant_id=request.tenant_id, timeout_sec=request.timeout_sec, required_capabilities=set(request.required_capabilities), required_permissions=required_permissions, risk_level=request.risk_level, verification_required=request.verification_required)
    _tasks[task.task_id] = {"task_id": task.task_id, "agent_id": agent_id, "intent": task.intent, "status": "RUNNING", "correlation_id": task.correlation_id, "risk_level": task.risk_level.value, "verification_required": task.verification_required, "created_at": task.created_at}
    await fabric.publish("AGENT_TASK_ACCEPTED", {"task_id": task.task_id, "agent_id": agent_id, "correlation_id": task.correlation_id}, source="agent_fabric")

    result = await swarm.dispatch(agent_id, task)
    entry = await evidence_ledger.record_result(task, result)
    corroborating = await evidence_ledger.corroborating(task, result)
    report = agent_result_verifier.verify(task, result, corroborating)
    final_status = report.status.value
    _tasks[task.task_id].update({"status": result.status, "result": result.output, "confidence": result.confidence, "reality": result.reality.value, "provenance": result.provenance, "evidence": result.evidence, "execution_time_ms": result.execution_time_ms, "error": result.error, "evidence_entry_id": entry.entry_id, "verification": {"status": final_status, "confidence": report.confidence, "checks": list(report.checks), "reasons": list(report.reasons), "corroborated": bool(report.evidence and report.evidence.corroborated), "sources": list(report.evidence.sources) if report.evidence else []}})
    await fabric.publish("AGENT_RESULT_VERIFIED", {"task_id": task.task_id, "agent_id": agent_id, "verification_status": final_status, "confidence": report.confidence, "corroborated": bool(report.evidence and report.evidence.corroborated), "correlation_id": task.correlation_id}, source="verification")
    return _tasks[task.task_id]

@router.get("/tasks/{task_id}")
async def get_agent_task(task_id: str):
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/evidence/{task_id}")
async def get_task_evidence(task_id: str):
    return {"task_id": task_id, "entries": await evidence_ledger.history(task_id)}
