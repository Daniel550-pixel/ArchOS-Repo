"""Request identity boundary for protected ArchOS operations.

This is intentionally a small bootstrap identity layer. It establishes a
verified principal from the configured administrative secret for internal
sovereign operations. Tenant identity is derived from the authenticated
principal and is never accepted from an arbitrary request header/query value.
"""

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
    "/api/ai/",
)


class IdentityMiddleware(BaseHTTPMiddleware):
    """Authenticate protected internal routes before FinOps or application code."""

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

        # The tenant is derived from the verified credential. A caller cannot
        # elevate itself by supplying X-Tenant-ID or tenant_id in the URL.
        request.state.principal = {
            "subject": "sovereign-admin",
            "role": "sovereign_operator",
            "auth_method": "admin_api_key",
        }
        request.state.tenant_id = "tenant-sovereign-dgm"
        request.state.authenticated = True

        return await call_next(request)
