from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.event_fabric import app_event_fabric
from app.services.governance_bridge import governance_bridge
from app.services.integration_runtime import integration_runtime
from backend.agents.action_gate import ActionRequest
from backend.agents.base import RiskLevel

router = APIRouter(prefix="/integrations", tags=["Sovereign Integrations"])


class ModbusWriteRequest(BaseModel):
    actor: str
    agent: str = "integration-orchestrator"
    target: str = "building-management-system"
    task_id: str = ""
    provenance: str = ""
    updates: dict[str, float] = Field(default_factory=dict)


class IntegrationActionApproval(BaseModel):
    approver: str


@router.get("/modbus/state")
async def modbus_state():
    return await integration_runtime.modbus_state()


@router.post("/modbus/writes")
async def submit_modbus_write(request: ModbusWriteRequest):
    if not request.updates:
        raise HTTPException(status_code=400, detail="At least one register update is required")

    action = ActionRequest(
        actor=request.actor,
        agent=request.agent,
        task_id=request.task_id,
        target=request.target,
        requested_operation="MODBUS_WRITE",
        risk_level=RiskLevel.HIGH_IMPACT,
        required_authority="OPERATOR_CLEARANCE",
        provenance=request.provenance or "integration.modbus",
        payload={"updates": request.updates},
    )
    decision = await governance_bridge.evaluate_and_submit(action)
    await app_event_fabric.publish(
        "integration.modbus.write_requested",
        {"action_id": action.action_id, "decision": decision.value, "target": request.target},
        source="integration.modbus",
    )
    return {
        "action_id": action.action_id,
        "decision": decision.value,
        "approval_state": action.approval_state,
        "policy_decision": action.policy_decision.value,
    }


@router.post("/modbus/writes/{action_id}/approve")
async def approve_modbus_write(action_id: str, request: IntegrationActionApproval):
    approved = await governance_bridge.approve(action_id, request.approver)
    if not approved:
        raise HTTPException(status_code=403, detail="Modbus write approval rejected")
    return {"action_id": action_id, "approved": True}


@router.post("/modbus/writes/{action_id}/execute")
async def execute_modbus_write(action_id: str):
    action = governance_bridge.get_action(action_id)
    if action is None:
        raise HTTPException(status_code=404, detail="Governed integration action not found")
    if action.requested_operation != "MODBUS_WRITE":
        raise HTTPException(status_code=409, detail="Action is not a Modbus write")
    if action.policy_decision.value != "ALLOWED":
        raise HTTPException(status_code=403, detail="ActionGate has not allowed execution")

    updates = action.payload.get("updates", {})
    result = await governance_bridge.execute(action, lambda: integration_runtime.modbus_write(updates))
    await app_event_fabric.publish(
        "integration.modbus.write_executed",
        {"action_id": action_id, "status": result.get("status")},
        source="integration.modbus",
    )
    return result


@router.get("/pulse/{slug}")
async def pulse_dataset(slug: str):
    data = await integration_runtime.pulse_dataset(slug)
    if data is not None:
        return {"source": "dubai_pulse", "authenticated": True, "data": data}
    return {"source": "dubai_pulse", "authenticated": False, "data": None}


@router.get("/pulse/fallback/{topic}")
async def pulse_fallback(topic: str):
    return await integration_runtime.pulse_fallback(topic)


@router.get("/osm/buildings")
async def osm_buildings():
    return {"source": "openstreetmap_overpass", "items": await integration_runtime.buildings()}
