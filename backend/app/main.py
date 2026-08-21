from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import router as api_router
from app.workers.scheduler import scheduler
from app.middleware.cost_risk_router import CostRiskMiddleware
from app.services.finops_service import FinOpsService, TenantUsageRepository

# Initialize Singleton FinOps Usage Repository & Service
usage_repo = TenantUsageRepository()
finops_service = FinOpsService(usage_repo)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: start background news ingestion scheduler
    scheduler.start()
    yield
    # Shutdown: stop scheduler cleanly
    scheduler.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sovereign UAE News Intelligence & FinOps Authority Router for UAE World Model & AIOS runtime.",
    lifespan=lifespan
)

# Register Cost/Risk Router Middleware for authority separation and rate governance
app.add_middleware(CostRiskMiddleware, finops_service=finops_service)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "system": "UAE News Intelligence & FinOps Foundation Layer",
        "status": "OPERATIONAL",
        "finops_router": "ACTIVE",
        "authority_separation": "ENFORCED",
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
