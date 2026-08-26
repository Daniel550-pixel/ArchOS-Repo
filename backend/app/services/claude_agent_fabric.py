"""Claude Agent Fabric provider boundary for ArchOS.

Provider access stays behind a narrow typed seam. Models never receive
execution authority; JARVIS and governance remain the control plane.
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
    """Minimal Anthropic adapter for governed ArchOS agent roles."""

    DEFAULT_MODEL = "claude-sonnet-4-6"

    async def run(self, request: ClaudeAgentRequest) -> ClaudeAgentResponse:
        model = request.model or settings.ARCHOS_CLAUDE_MODEL or self.DEFAULT_MODEL
        if not settings.ANTHROPIC_API_KEY:
            return ClaudeAgentResponse(
                status="UNCONFIGURED", role=request.role, content="", model=model,
                error="ANTHROPIC_API_KEY is not configured",
            )
        try:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = await client.messages.create(
                model=model,
                max_tokens=request.max_tokens,
                system=request.system or "You are a governed ArchOS specialist agent. Return evidence-aware analysis only.",
                messages=[{"role": "user", "content": request.prompt}],
            )
            text = "\n".join(
                block.text for block in response.content
                if getattr(block, "type", None) == "text"
            )
            return ClaudeAgentResponse(
                status="SUCCESS", role=request.role, content=text, model=model,
                is_real=True,
            )
        except Exception as exc:
            return ClaudeAgentResponse(
                status="FAILED", role=request.role, content="", model=model,
                error=type(exc).__name__,
            )


claude_agent_fabric = ClaudeAgentFabric()
