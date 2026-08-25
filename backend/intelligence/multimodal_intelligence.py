"""Provider-neutral multimodal intelligence contracts promoted from Obsidian-AI."""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

@dataclass(frozen=True)
class GroundingReference:
    uri: str
    title: str = ""
    source: str = ""

@dataclass(frozen=True)
class MultimodalRequest:
    prompt: str
    media_mime_type: str | None = None
    media_base64: str | None = None
    mode: str = "analysis"
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@dataclass(frozen=True)
class MultimodalResult:
    text: str
    mode: str
    confidence: float
    grounding: tuple[GroundingReference, ...] = ()
    provenance: str = "archos.multimodal"
    reality: str = "INFERRED"

class MultimodalProvider:
    """Adapter contract. Concrete providers must return ArchOS-native results."""
    async def generate(self, request: MultimodalRequest) -> MultimodalResult: raise NotImplementedError
    async def ground(self, request: MultimodalRequest) -> MultimodalResult: raise NotImplementedError
    async def analyze_media(self, request: MultimodalRequest) -> MultimodalResult: raise NotImplementedError
