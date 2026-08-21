from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.endpoints import router as api_router
from app.api.world_model import router as world_model_router
from app.api.simulation import router as simulation_router
from app.workers.scheduler import scheduler
from app.middleware.identity import IdentityMiddleware
from app.middleware.cost_risk_router import CostRiskMiddleware
from app.services.finops_service import FinOpsService, TenantUsageRepository
from app.core.database import close_database

usage_repo = TenantUsageRepository()
finops_service = FinOpsService(usage_repo)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    try:
        yield
    finally:
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
    ],
)

app.include_router(api_router, prefix=settings.API_PREFIX)
app.include_router(world_model_router, prefix=settings.API_PREFIX)
app.include_router(simulation_router)


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
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
