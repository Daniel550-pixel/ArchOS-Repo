"""Canonical World Model entity and provenance contracts."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Mapping, Optional, Tuple
from datetime import datetime


class DataFreshness(str, Enum):
    LIVE = "live"
    RECENT = "recent"
    DELAYED = "delayed"
    HISTORICAL = "historical"
    RECONSTRUCTED = "reconstructed"
    SIMULATED = "simulated"
    UNKNOWN = "unknown"


class ProvenanceType(str, Enum):
    DIRECT = "direct"
    DERIVED = "derived"
    FUSED = "fused"
    RECONSTRUCTED = "reconstructed"
    SIMULATED = "simulated"


@dataclass(frozen=True)
class ProvenanceRecord:
    source_id: str
    source_type: str
    observed_at: str
    ingested_at: str
    processing_method: str
    provenance_type: ProvenanceType
    confidence: float
    parent_source_ids: Tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.source_id.strip():
            raise ValueError("source_id is required")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence must be between 0 and 1")
        _timestamp(self.observed_at)
        _timestamp(self.ingested_at)


@dataclass(frozen=True)
class WorldModelEntity:
    entity_id: str
    entity_type: str
    latitude: float
    longitude: float
    world_model_version: str
    observed_at: str
    freshness: DataFreshness
    confidence: float
    provenance: Tuple[ProvenanceRecord, ...]
    state: Mapping[str, object]
    relationships: Tuple[str, ...] = ()
    geometry: Optional[Mapping[str, object]] = None

    def __post_init__(self) -> None:
        if not self.entity_id.strip() or not self.entity_type.strip():
            raise ValueError("entity_id and entity_type are required")
        if not -90.0 <= self.latitude <= 90.0:
            raise ValueError("latitude must be between -90 and 90")
        if not -180.0 <= self.longitude <= 180.0:
            raise ValueError("longitude must be between -180 and 180")
        if not self.world_model_version.strip():
            raise ValueError("world_model_version is required")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence must be between 0 and 1")
        _timestamp(self.observed_at)
        if not self.provenance:
            raise ValueError("at least one provenance record is required")

    @property
    def latest_provenance(self) -> ProvenanceRecord:
        return max(self.provenance, key=lambda record: record.ingested_at)

    def is_trustworthy(self, minimum_confidence: float = 0.7) -> bool:
        return self.confidence >= minimum_confidence and self.freshness is not DataFreshness.UNKNOWN


def _timestamp(value: str) -> None:
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"invalid ISO-8601 timestamp: {value}") from exc
