from contextlib import asynccontextmanager
import asyncio
import json

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.config import settings
from app.api.endpoints import router as api_router
from app.api.world_model import router as world_model_router
from app.api.simulation import router as simulation_router
from app.api.scenario_intelligence import router as scenario_intelligence_router
from app.api.causal_graph import router as causal_graph_router
from app.api.scenario_execution import router as scenario_execution_router
from app.api.scenario_planner import router as scenario_planner_router
from app.api.scenario_orchestrator import router as scenario_orchestrator_router
from app.api.integrations import router as integrations_router
from app.workers.scheduler import scheduler
from app.middleware.identity import IdentityMiddleware
from app.middleware.cost_risk_router import CostRiskMiddleware
from app.services.finops_service import FinOpsService, TenantUsageRepository
from app.services.jarvis_runtime_bridge import jarvis_runtime_bridge
from app.services.governance_bridge import governance_bridge
from app.services.event_fabric import app_event_fabric
from app.services.security_observability import instrument, metrics_response, ops_status, certificate_watchdog
from app.services.night_shift import night_shift_runtime
from backend.agents.action_gate import ActionRequest
from backend.agents.base import RiskLevel
from backend.auth import webauthn as webauthn_runtime
from backend.auth import keysmith as keysmith_runtime
from backend.auth.webauthn import router as auth_router
from backend.auth.sessions import router as sessions_router
from backend.auth.keysmith import router as keysmith_router, rotation_daemon
from app.core.database import close_database

usage_repo = TenantUsageRepository()
finops_service = FinOpsService(usage_repo)


def validate_security_runtime() -> None:
    if settings.ENVIRONMENT != "production":
        return
    if not settings.JWT_SECRET or len(settings.JWT_SECRET) < 32:
        raise RuntimeError("Production JWT_SECRET is not configured")
    if not webauthn_runtime.verify_registration_response or not webauthn_runtime.verify_authentication_response:
        raise RuntimeError("Production WebAuthn verification provider is unavailable")
    if not keysmith_runtime.AESGCM or not keysmith_runtime.generate_keypair:
        raise RuntimeError("Production KEYSMITH cryptographic providers are unavailable")


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_security_runtime()
    scheduler.start()
    night_shift_runtime.start()
    rotation_task = asyncio.create_task(rotation_daemon())
    certificate_task = asyncio.create_task(certificate_watchdog())
    await app_event_fabric.publish(
        "runtime.started",
        {"version": settings.VERSION, "environment": settings.ENVIRONMENT},
        source="app",
    )
    try:
        yield
    finally:
        for task in (rotation_task, certificate_task):
            task.cancel()
        for task in (rotation_task, certificate_task):
            try:
                await task
            except asyncio.CancelledError:
                pass
        await night_shift_runtime.stop()
        await app_event_fabric.publish("runtime.stopping", source="app")
        scheduler.stop()
        if settings.DATABASE_URL:
            await close_database()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Sovereign UAE News Intelligence & FinOps Authority Router "
        "for UAE World Model & AIOS runtime."
    ),
    lifespan=lifespan,
)


@app.middleware("http")
async def observability_middleware(request, call_next):
    return await instrument(request, call_next)


app.add_middleware(CostRiskMiddleware, finops_service=finops_service)
app.add_middleware(IdentityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=bool(settings.CORS_ORIGINS),
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Admin-Key",
        "X-Estimated-Prompt-Length",
        "X-Request-Id",
    ],
)

app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(keysmith_router)
app.include_router(api_router, prefix=settings.API_PREFIX)
app.include_router(world_model_router, prefix=settings.API_PREFIX)
app.include_router(simulation_router)
app.include_router(scenario_intelligence_router)
app.include_router(causal_graph_router)
app.include_router(scenario_execution_router)
app.include_router(scenario_planner_router)
app.include_router(scenario_orchestrator_router)
app.include_router(integrations_router, prefix=settings.API_PREFIX)


class JarvisRequest(BaseModel):
    query: str
    actor: str = "operator"
    tenant_id: str = "uae-sovereign"


class ActionSubmitRequest(BaseModel):
    actor: str
    agent: str
    task_id: str = ""
    target: str
    requested_operation: str
    risk_level: str = "LOW_RISK"
    required_authority: str = "OPERATOR_CLEARANCE"
    provenance: str = ""
    payload: dict = {}


class ActionApprovalRequest(BaseModel):
    approver: str


@app.post("/api/v1/jarvis/ask")
async def jarvis_ask(request: JarvisRequest):
    try:
        result = await jarvis_runtime_bridge.run(request.model_dump())
        await app_event_fabric.publish(
            "jarvis.completed",
            {"task_id": result.get("task_id"), "verification_status": result.get("verification_status")},
            source="jarvis",
        )
        return result
    except Exception as exc:
        await app_event_fabric.publish("jarvis.failed", {"error": type(exc).__name__}, source="jarvis")
        raise HTTPException(status_code=500, detail="JARVIS runtime execution failed") from exc


@app.get("/api/v1/governance/actions")
async def governance_actions():
    return {"pending": governance_bridge.pending(), "history": governance_bridge.history()}


@app.post("/api/v1/governance/actions")
async def submit_governed_action(request: ActionSubmitRequest):
    try:
        risk_level = RiskLevel(request.risk_level)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid risk_level") from exc
    action = ActionRequest(
        actor=request.actor,
        agent=request.agent,
        task_id=request.task_id,
        target=request.target,
        requested_operation=request.requested_operation,
        risk_level=risk_level,
        required_authority=request.required_authority,
        provenance=request.provenance,
        payload=request.payload,
    )
    decision = await governance_bridge.evaluate_and_submit(action)
    await app_event_fabric.publish(
        "governance.action_evaluated",
        {"action_id": action.action_id, "decision": decision.value, "risk_level": risk_level.value},
        source="governance",
    )
    return {
        "action_id": action.action_id,
        "decision": decision.value,
        "approval_state": action.approval_state,
        "policy_decision": action.policy_decision.value,
    }


@app.post("/api/v1/governance/actions/{action_id}/approve")
async def approve_governed_action(action_id: str, request: ActionApprovalRequest):
    approved = await governance_bridge.approve(action_id, request.approver)
    if not approved:
        raise HTTPException(status_code=403, detail="Action approval rejected")
    await app_event_fabric.publish(
        "governance.action_approved",
        {"action_id": action_id, "approver": request.approver},
        source="governance",
    )
    return {"action_id": action_id, "approved": True}


@app.get("/api/v1/events")
async def event_history(limit: int = 100):
    try:
        return {"events": await app_event_fabric.history(limit)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/v1/events/stream")
async def event_stream(request: Request):
    """Stream canonical Event Fabric events to UI clients over SSE."""
    queue = await app_event_fabric.subscribe(max_queue=100)

    async def generate():
        try:
            yield ": connected\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    payload = json.dumps(event, separators=(",", ":"), default=str)
                    yield f"id: {event['event_id']}\ndata: {payload}\n\n"
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"
        finally:
            await app_event_fabric.unsubscribe(queue)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/metrics")
async def metrics():
    return metrics_response()


@app.get("/api/v1/ops/status")
async def get_ops_status():
    return ops_status()


@app.get("/api/v1/night-shift/status")
async def night_shift_status():
    return night_shift_runtime.status()


@app.post("/api/v1/night-shift/run")
async def run_night_shift():
    try:
        return await night_shift_runtime.run_once()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Night Shift execution failed") from exc


@app.get("/api/v1/health/runtime")
async def runtime_health():
    return {
        "status": "operational",
        "version": settings.VERSION,
        "components": {
            "world_model": "active",
            "simulation": "active",
            "causal_graph": "active",
            "jarvis": "bridged",
            "governance": "bridged",
            "event_fabric": "active",
            "webauthn": "active",
            "sessions": "active",
            "keysmith": "active",
            "certificate_watchdog": "active",
            "observability": "active",
            "integration_runtime": "active",
            "dubai_pulse": "available",
            "modbus_bms": "governed",
            "osm": "available",
            "night_shift": "active",
        },
    }


@app.get("/")
async def root():
    return {
        "system": "UAE News Intelligence & FinOps Foundation Layer",
        "status": "OPERATIONAL",
        "finops_router": "ACTIVE",
        "authority_separation": "ENFORCED",
        "identity_boundary": "ACTIVE",
        "world_model": "PERSISTENT_POSTGRESQL",
        "simulation_engine": "ISOLATED_BRANCHES",
        "scenario_intelligence": "CAUSAL_PROPAGATION",
        "causal_knowledge_graph": "TEMPORAL_POSTGRESQL",
        "scenario_execution": "AUDITABLE_END_TO_END",
        "scenario_planner": "JARVIS_INTENT_TO_PLAN",
        "scenario_orchestrator": "PLAN_TO_EXECUTION_GUARDED",
        "jarvis_runtime": "BRIDGED",
        "governance_runtime": "BRIDGED",
        "event_fabric": "CANONICAL",
        "event_stream": "SSE",
        "security_runtime": "WEBAUTHN_KEYSMITH",
        "certificate_monitor": "ACTIVE",
        "observability": "ACTIVE",
        "integration_runtime": "ACTIVE",
        "dubai_pulse": "ADAPTER",
        "modbus_bms": "GOVERNED_WRITE_PATH",
        "osm": "ADAPTER",
        "night_shift": "AUTHORITATIVE",
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
