"""Ox Alpha provider boundary for the ArchOS reasoning lane.

The provider is intentionally isolated from execution authority. Endpoint and
credentials are configuration-driven so the preview provider can change without
requiring an architectural rewrite.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings


@dataclass(frozen=True)
class OxAlphaRequest:
    role: str
    prompt: str
    system: Optional[str] = None
    model: Optional[str] = None
    max_tokens: int = 4096
    temperature: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class OxAlphaResponse:
    status: str
    role: str
    content: str
    model: str
    provider: str = "ox_alpha"
    is_real: bool = False
    execution_authority: bool = False
    error: Optional[str] = None


class OxAlphaAgentFabric:
    """Minimal OpenAI-compatible Ox Alpha adapter with a safe failure path."""

    DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
    DEFAULT_MODEL = "stealth/ox-alpha"

    async def health(self) -> Dict[str, Any]:
        configured = bool(settings.OX_ALPHA_API_KEY)
        return {
            "status": "configured" if configured else "UNCONFIGURED",
            "provider": "ox_alpha",
            "model": settings.ARCHOS_OX_ALPHA_MODEL or self.DEFAULT_MODEL,
            "execution_authority": False,
        }

    async def run(self, request: OxAlphaRequest) -> OxAlphaResponse:
        model = request.model or settings.ARCHOS_OX_ALPHA_MODEL or self.DEFAULT_MODEL
        api_key = settings.OX_ALPHA_API_KEY
        if not api_key:
            return OxAlphaResponse(
                status="UNCONFIGURED", role=request.role, content="", model=model,
                error="OX_ALPHA_API_KEY is not configured",
            )

        base_url = (settings.OX_ALPHA_BASE_URL or self.DEFAULT_BASE_URL).rstrip("/")
        messages = []
        if request.system:
            messages.append({"role": "system", "content": request.system})
        messages.append({"role": "user", "content": request.prompt})
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_tokens": request.max_tokens,
            "stream": False,
        }
        if request.temperature is not None:
            payload["temperature"] = request.temperature

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=settings.OX_ALPHA_TIMEOUT_SECONDS) as client:
                response = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
            choices = data.get("choices") or []
            content = ""
            if choices:
                content = ((choices[0].get("message") or {}).get("content") or "").strip()
            if not content:
                return OxAlphaResponse(
                    status="FAILED", role=request.role, content="", model=model,
                    error="Ox Alpha returned no textual content",
                )
            return OxAlphaResponse(
                status="SUCCESS", role=request.role, content=content, model=data.get("model", model),
                is_real=True,
            )
        except httpx.TimeoutException:
            return OxAlphaResponse(
                status="TIMEOUT", role=request.role, content="", model=model,
                error="Ox Alpha request timed out",
            )
        except httpx.HTTPStatusError as exc:
            return OxAlphaResponse(
                status="FAILED", role=request.role, content="", model=model,
                error=f"HTTP_{exc.response.status_code}",
            )
        except Exception as exc:
            return OxAlphaResponse(
                status="FAILED", role=request.role, content="", model=model,
                error=type(exc).__name__,
            )


ox_alpha_agent_fabric = OxAlphaAgentFabric()
