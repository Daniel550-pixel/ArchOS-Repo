"""Governed model-fabric API for ArchOS and its JARVIS runtime."""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.claude_agent_fabric import ClaudeAgentRequest, claude_agent_fabric

router = APIRouter(prefix="/claude", tags=["claude-agent-fabric"])


class ClaudeRequest(BaseModel):
    role: str = Field(min_length=1, max_length=80)
    prompt: str = Field(min_length=1, max_length=12000)
    system: str | None = Field(default=None, max_length=8000)
    model: str | None = Field(default=None, max_length=120)
    max_tokens: int = Field(default=2048, ge=128, le=8192)
    metadata: dict = Field(default_factory=dict)


@router.get("/status")
async def claude_status():
    active_provider = "omniroute" if settings.OMNIROUTE_ENABLED else "anthropic"
    return {
        "provider": active_provider,
        "configured": (
            bool(settings.OMNIROUTE_API_KEY)
            if settings.OMNIROUTE_ENABLED
            else bool(settings.ANTHROPIC_API_KEY)
        ),
        "omniroute": {
            "enabled": settings.OMNIROUTE_ENABLED,
            "base_url": settings.OMNIROUTE_BASE_URL,
            "model": settings.OMNIROUTE_MODEL,
            "api_key_configured": bool(settings.OMNIROUTE_API_KEY),
            "fallback_to_anthropic": settings.OMNIROUTE_FALLBACK_TO_ANTHROPIC,
        },
        "anthropic_fallback_configured": bool(settings.ANTHROPIC_API_KEY),
        "default_model": settings.OMNIROUTE_MODEL if settings.OMNIROUTE_ENABLED else settings.ARCHOS_CLAUDE_MODEL,
        "execution_authority": False,
        "governance_boundary": "JARVIS_AND_GOVERNANCE",
    }


@router.post("/run")
async def run_claude(request: ClaudeRequest):
    result = await claude_agent_fabric.run(
        ClaudeAgentRequest(
            role=request.role,
            prompt=request.prompt,
            system=request.system,
            model=request.model,
            max_tokens=request.max_tokens,
            metadata=request.metadata,
        )
    )
    return {
        "status": result.status,
        "role": result.role,
        "provider": result.provider,
        "model": result.model,
        "content": result.content,
        "is_real": result.is_real,
        "execution_authority": result.execution_authority,
        "error": result.error,
    }
