import asyncio
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .jarvis import runtime
from .core import event_fabric, cert_monitor
from .agents.swarm import swarm
from .agents.base import Agent, AgentCapability
from .agents import night_shift
from .integrations import modbus_gateway, pulse
from .auth.webauthn import router as auth_router
from .auth.sessions import router as sessions_router
from .auth.keysmith import router as keysmith_router, rotation_daemon
from .core import world_model_events as wme
from .core.observability import instrument, metrics_response, ops_status

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Launch cert watchdog, telemetry, KEYSMITH 60s PQ rotation, and Night Shift autonomous watcher
    asyncio.create_task(cert_monitor.watch())
    asyncio.create_task(rotation_daemon())
    asyncio.create_task(night_shift.loop())
    yield

app = FastAPI(title="ArchOS 2.0 Sovereign AIOS Enclave", lifespan=lifespan)

# Observability HTTP instrumentation middleware
@app.middleware("http")
async def obs_middleware(request: Request, call_next):
    return await instrument(app, request, call_next)

app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(keysmith_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def healthz():
    return {"ok": True, "enclave": "ARCHOS_2_0", "status": "OPERATIONAL"}

@app.get("/metrics")
async def metrics():
    return metrics_response()

@app.get("/api/v1/ops/status")
async def get_ops():
    return ops_status()

# Temporal World Model
@app.get("/api/v1/wm/{entity_id}/history")
async def wm_hist(entity_id: str):
    return wme.history(entity_id)

@app.get("/api/v1/wm/{entity_id}/as_of")
async def wm_asof(entity_id: str, ts: str):
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        dt = datetime.utcnow()
    return wme.as_of(entity_id, dt)

@app.post("/api/v1/jarvis/ask")
async def ask(q: dict):
    return await runtime.run(q)

@app.get("/api/v1/bms/status")
async def bms():
    return modbus_gateway.last_state()

@app.get("/api/v1/pulse/query")
async def pq(topic: str = "macro", dataset: str = ""):
    if pulse.enabled and dataset:
        return {"source": "dubai_pulse", "data": await pulse.dataset(dataset)}
    return await pulse.fallback(topic)

@app.get("/api/v1/jarvis/brief/latest")
async def brief_latest():
    if night_shift.BRIEFINGS:
        return night_shift.BRIEFINGS[-1]
    # Compose first briefing if none exists yet
    watch = await night_shift.gather_watch()
    return await night_shift.compose(watch)

@app.post("/api/v1/jarvis/brief")
async def brief_now():
    return await night_shift.compose(await night_shift.gather_watch())

@app.get("/api/v1/agents")
async def get_agents():
    return {"agents": swarm.list_agents()}

@app.post("/api/v1/jarvis/orchestrate")
async def orchestrate_jarvis(q: dict):
    return await runtime.run(q)

@app.get("/api/v1/governance/action-gate")
async def get_action_gate():
    return await runtime.get_action_gate_status()

@app.post("/api/v1/governance/approve")
async def approve_governed_action(body: dict):
    action_id = body.get("action_id", "")
    approver = body.get("approver", "operator")
    return await runtime.approve_action(action_id, approver)

@app.get("/api/v1/governance/audit")
async def get_governance_audit():
    from .core.governance import AUDIT
    return {"audit_trail": AUDIT[-100:]}

@app.websocket("/ws/events")
async def ws(w):
    await event_fabric.fabric.connect(w)

