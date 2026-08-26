"""Governed Claude Agent Fabric API.

This endpoint exposes model-backed analysis without granting model execution
authority. Action execution remains behind the existing governance layer.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field

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
    import os
    return {
        "provider": "anthropic",
        "configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "default_model": os.getenv("ARCHOS_CLAUDE_MODEL", claude_agent_fabric.DEFAULT_MODEL),
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
