"""Request identity boundary for protected ArchOS operations."""

import hmac
from typing import Optional

from fastapi import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings


PROTECTED_PREFIXES = (
    "/api/v1/jarvis/",
    "/api/v1/simulation/",
    "/api/v1/admin/",
    "/api/v1/governance/",
    "/api/v1/events",
    "/api/v1/ops/status",
    "/api/ai/",
)


class IdentityMiddleware(BaseHTTPMiddleware):
    """Authenticate protected internal routes before application code."""

    @staticmethod
    def _is_protected(path: str) -> bool:
        return any(path.startswith(prefix) for prefix in PROTECTED_PREFIXES)

    @staticmethod
    def _extract_token(request: Request) -> Optional[str]:
        explicit = request.headers.get("X-Admin-Key")
        if explicit:
            return explicit
        authorization = request.headers.get("Authorization")
        if authorization and authorization.lower().startswith("bearer "):
            return authorization[7:].strip()
        return None

    async def dispatch(self, request: Request, call_next):
        if not self._is_protected(request.url.path):
            return await call_next(request)

        configured_secret = settings.ADMIN_API_KEY
        supplied_token = self._extract_token(request)
        if not configured_secret or not supplied_token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "status": "UNAUTHORIZED",
                    "detail": "Authenticated sovereign credentials are required.",
                },
            )

        if not hmac.compare_digest(supplied_token, configured_secret):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "status": "UNAUTHORIZED",
                    "detail": "Invalid sovereign credentials.",
                },
            )

        request.state.principal = {
            "subject": "sovereign-admin",
            "role": "sovereign_operator",
            "auth_method": "admin_api_key",
        }
        request.state.tenant_id = "tenant-sovereign-dgm"
        request.state.authenticated = True
        return await call_next(request)
