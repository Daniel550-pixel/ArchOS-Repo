# backend/app/middleware/cost_risk_router.py
import asyncio
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from fastapi import status

from app.services.finops_service import FinOpsService

logger = logging.getLogger(__name__)

class CostRiskMiddleware(BaseHTTPMiddleware):
    """
    FastAPI Cost/Risk Router Middleware for ArchOS Economic Intelligence & FinOps.
    
    Responsibilities:
    1. Intercepts all cognitive inference (/api/v1/jarvis/reason), simulation (/api/v1/simulation/*),
       and ingestion (/api/v1/admin/ingest) endpoints.
    2. Enforces Tenant Economic Profiles, budget caps, and token override rules.
    3. Dynamically routes requests to optimal model tiers (gemini-flash, gpt-4o, sovereign-pro).
    4. Records asynchronous telemetry matching TimescaleDB `usage_telemetry` schema.
    5. Dispatches real-time alerts on budget threshold breaches and anomalous consumption spikes.
    """
    def __init__(self, app, finops_service: FinOpsService):
        super().__init__(app)
        self.finops_service = finops_service

    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Identify protected endpoints requiring FinOps rate/cost and authority separation gating
        protected_prefixes = [
            "/api/v1/jarvis/reason",
            "/api/v1/simulation",
            "/api/v1/admin/ingest",
            "/api/ai/reason",
            "/api/ai/consensus"
        ]
        
        path = request.url.path
        is_protected = any(path.startswith(prefix) for prefix in protected_prefixes)
        
        if not is_protected:
            return await call_next(request)

        # 2. Extract Tenant ID (from Auth header, custom header, or query param)
        tenant_id = (
            request.headers.get("X-Tenant-ID") 
            or request.headers.get("x-tenant-id")
            or request.query_params.get("tenant_id")
            or "tenant-sovereign-dgm"  # Sovereign UAE default
        )

        if not tenant_id:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "status": "UNAUTHORIZED",
                    "detail": "Missing X-Tenant-ID header. FinOps authority enforcement requires verified tenant identification."
                }
            )

        # 3. Determine Operation Type & Estimate Request Cost
        operation_type = "INFERENCE"
        if "simulation" in path:
            operation_type = "SIMULATION"
        elif "ingest" in path or "storage" in path:
            operation_type = "STORAGE"

        prompt_length_estimate = int(request.headers.get("X-Estimated-Prompt-Length", "1200"))
        estimated_cost = await self.finops_service.estimate_request_cost(prompt_length_estimate, path)

        # 4. Check Economic Limits, Hard Budget Caps, and Authority Permissions
        is_allowed, error_message = await self.finops_service.check_tenant_limits(tenant_id, estimated_cost)
        
        if not is_allowed:
            logger.warning(f"Tenant [{tenant_id}] quota/rate limit reached: {error_message}. Gating request.")
            # Record economic alert for threshold violation
            asyncio.create_task(self._record_economic_alert(
                tenant_id=tenant_id,
                alert_type="BUDGET_THRESHOLD",
                threshold_value=estimated_cost,
                current_value=estimated_cost,
                metadata={"path": path, "reason": error_message}
            ))
            
            return JSONResponse(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                content={
                    "status": "QUOTA_EXCEEDED",
                    "tenant_id": tenant_id,
                    "estimated_cost_usd": round(estimated_cost, 6),
                    "estimated_cost_aed": round(estimated_cost * 3.6725, 4),
                    "detail": error_message,
                    "operation_type": operation_type
                },
                headers={
                    "X-FinOps-Status": "BLOCKED_QUOTA",
                    "X-Tenant-ID": tenant_id
                }
            )

        # 5. Determine Model Route based on tenant tier & prompt complexity
        model_route = await self.finops_service.determine_model_route(tenant_id, prompt_length_estimate)
        
        # 6. Inject Routing State for downstream handler consumption
        request.state.model_route = model_route
        request.state.tenant_id = tenant_id
        request.state.estimated_cost = estimated_cost
        request.state.operation_type = operation_type

        # 7. Process Request through inner pipeline
        start_time = datetime.utcnow()
        response = await call_next(request)
        end_time = datetime.utcnow()
        compute_seconds = max(0.01, (end_time - start_time).total_seconds())

        # 8. Add routing & FinOps observability metadata to response headers
        response.headers["X-Routed-Model"] = model_route
        response.headers["X-Tenant-ID"] = tenant_id
        response.headers["X-Estimated-Cost-USD"] = str(round(estimated_cost, 6))
        response.headers["X-Estimated-Cost-AED"] = str(round(estimated_cost * 3.6725, 4))
        response.headers["X-FinOps-Gate"] = "VERIFIED_ACTIVE"
        
        # 9. Asynchronously log usage telemetry to TimescaleDB hypertable
        if response.status_code < 400:
            estimated_tokens = max(1, int(prompt_length_estimate / 4))
            compute_units = round(estimated_tokens * 0.00025 + (compute_seconds * 0.05), 4)
            cost_aed = round(estimated_cost * 3.6725, 6)

            # Asynchronous background tasks to prevent blocking API latency
            asyncio.create_task(self._log_usage_telemetry(
                tenant_id=tenant_id,
                operation_type=operation_type,
                model_used=model_route,
                tokens_input=estimated_tokens,
                tokens_output=int(estimated_tokens * 0.35),
                compute_seconds=compute_seconds,
                cost_aed=cost_aed,
                compute_units=compute_units
            ))

        return response

    async def _log_usage_telemetry(
        self,
        tenant_id: str,
        operation_type: str,
        model_used: str,
        tokens_input: int,
        tokens_output: int,
        compute_seconds: float,
        cost_aed: float,
        compute_units: float
    ):
        """Asynchronously record telemetry into tenant repository and TimescaleDB."""
        try:
            total_tokens = tokens_input + tokens_output
            await self.finops_service.usage_repo.record_usage(
                tenant_id=tenant_id,
                tokens=total_tokens,
                compute_units=compute_units,
                cost_aed=cost_aed
            )
            
            # Anomalous consumption spike detection (> 45,000 tokens in a single operation)
            if total_tokens > 45000:
                await self._record_economic_alert(
                    tenant_id=tenant_id,
                    alert_type="ANOMALOUS_SPIKE",
                    threshold_value=45000.0,
                    current_value=float(total_tokens),
                    metadata={"model_used": model_used, "compute_seconds": compute_seconds}
                )
        except Exception as e:
            logger.error(f"Failed to log usage telemetry asynchronously: {e}")

    async def _record_economic_alert(
        self,
        tenant_id: str,
        alert_type: str,
        threshold_value: float,
        current_value: float,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Dispatches an economic alert for dashboard ingestion and audit logging."""
        logger.warning(
            f"FINOPS ECONOMIC ALERT [{alert_type}] for Tenant [{tenant_id}]: "
            f"Current={current_value}, Threshold={threshold_value}, Meta={metadata}"
        )
