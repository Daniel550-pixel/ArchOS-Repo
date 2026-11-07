"""Provider-neutral model gateway for the governed ArchOS/JARVIS reasoning lane.

OmniRoute is an optional OpenAI-compatible gateway. When disabled, the
existing direct Anthropic integration is unchanged. Model output never gains
execution authority; JARVIS and the governance boundary remain authoritative.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from app.core.config import settings


@dataclass(frozen=True)
class ClaudeAgentRequest:
    role: str
    prompt: str
    system: Optional[str] = None
    model: Optional[str] = None
    max_tokens: int = 2048
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ClaudeAgentResponse:
    status: str
    role: str
    content: str
    model: str
    provider: str = "anthropic"
    is_real: bool = False
    execution_authority: bool = False
    error: Optional[str] = None


class ClaudeAgentFabric:
    """Routes governed reasoning through OmniRoute or the legacy Anthropic path."""

    DEFAULT_MODEL = "claude-sonnet-4-6"
    DEFAULT_SYSTEM = "You are a governed ArchOS specialist agent. Return evidence-aware analysis only."

    async def _run_omniroute(self, request: ClaudeAgentRequest) -> ClaudeAgentResponse:
        model = request.model or settings.OMNIROUTE_MODEL or "auto"
        if not settings.OMNIROUTE_API_KEY:
            return ClaudeAgentResponse(
                status="UNCONFIGURED", role=request.role, content="", model=model,
                provider="omniroute", error="OMNIROUTE_API_KEY is not configured",
            )
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.OMNIROUTE_API_KEY,
                base_url=settings.OMNIROUTE_BASE_URL.rstrip("/"),
                timeout=settings.OMNIROUTE_TIMEOUT_SECONDS,
                max_retries=0,
            )
            response = await client.chat.completions.create(
                model=model,
                max_tokens=request.max_tokens,
                messages=[
                    {"role": "system", "content": request.system or self.DEFAULT_SYSTEM},
                    {"role": "user", "content": request.prompt},
                ],
                extra_headers={
                    "X-ArchOS-Role": request.role,
                    "X-ArchOS-Request-Source": "jarvis-agent-fabric",
                },
            )
            content = response.choices[0].message.content or ""
            actual_model = response.model or model
            return ClaudeAgentResponse(
                status="SUCCESS", role=request.role, content=content,
                model=actual_model, provider="omniroute", is_real=True,
            )
        except Exception as exc:
            return ClaudeAgentResponse(
                status="FAILED", role=request.role, content="", model=model,
                provider="omniroute", error=type(exc).__name__,
            )

    async def _run_anthropic(self, request: ClaudeAgentRequest, *, fallback_error: str | None = None) -> ClaudeAgentResponse:
        model = request.model or settings.ARCHOS_CLAUDE_MODEL or self.DEFAULT_MODEL
        if not settings.ANTHROPIC_API_KEY:
            return ClaudeAgentResponse(
                status="UNCONFIGURED", role=request.role, content="", model=model,
                provider="anthropic",
                error=fallback_error or "ANTHROPIC_API_KEY is not configured",
            )
        try:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = await client.messages.create(
                model=model,
                max_tokens=request.max_tokens,
                system=request.system or self.DEFAULT_SYSTEM,
                messages=[{"role": "user", "content": request.prompt}],
            )
            content = "\n".join(
                block.text for block in response.content
                if getattr(block, "type", None) == "text"
            )
            return ClaudeAgentResponse(
                status="FALLBACK_SUCCESS" if fallback_error else "SUCCESS",
                role=request.role, content=content, model=model,
                provider="anthropic", is_real=True,
                error=fallback_error,
            )
        except Exception as exc:
            return ClaudeAgentResponse(
                status="FAILED", role=request.role, content="", model=model,
                provider="anthropic", error=type(exc).__name__,
            )

    async def run(self, request: ClaudeAgentRequest) -> ClaudeAgentResponse:
        if not settings.OMNIROUTE_ENABLED:
            return await self._run_anthropic(request)

        routed = await self._run_omniroute(request)
        if routed.is_real:
            return routed

        if settings.OMNIROUTE_FALLBACK_TO_ANTHROPIC and settings.ANTHROPIC_API_KEY:
            return await self._run_anthropic(
                request,
                fallback_error=f"OmniRoute unavailable ({routed.error or routed.status}); used direct Anthropic fallback",
            )
        return routed


claude_agent_fabric = ClaudeAgentFabric()
