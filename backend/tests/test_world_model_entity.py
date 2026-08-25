import pytest

from app.core.world_model_entity import (
    DataFreshness,
    ProvenanceRecord,
    ProvenanceType,
    WorldModelEntity,
)


def provenance(confidence: float = 0.95) -> ProvenanceRecord:
    return ProvenanceRecord(
        source_id="opensky:abc123",
        source_type="telemetry",
        observed_at="2026-08-25T21:00:00+00:00",
        ingested_at="2026-08-25T21:00:05+00:00",
        processing_method="direct_ingestion",
        provenance_type=ProvenanceType.DIRECT,
        confidence=confidence,
    )


def entity() -> WorldModelEntity:
    return WorldModelEntity(
        entity_id="aircraft:abc123",
        entity_type="aircraft",
        latitude=25.2048,
        longitude=55.2708,
        world_model_version="uae-world-v1.0.0",
        observed_at="2026-08-25T21:00:00+00:00",
        freshness=DataFreshness.LIVE,
        confidence=0.95,
        provenance=(provenance(),),
        state={"altitude_m": 10000},
    )


def test_entity_preserves_provenance_and_version() -> None:
    item = entity()
    assert item.world_model_version == "uae-world-v1.0.0"
    assert item.latest_provenance.source_id == "opensky:abc123"
    assert item.is_trustworthy()


def test_invalid_coordinates_are_rejected() -> None:
    with pytest.raises(ValueError, match="latitude"):
        WorldModelEntity(
            entity_id="x",
            entity_type="x",
            latitude=91,
            longitude=55,
            world_model_version="v1",
            observed_at="2026-08-25T21:00:00+00:00",
            freshness=DataFreshness.LIVE,
            confidence=1,
            provenance=(provenance(),),
            state={},
        )


def test_unknown_freshness_is_not_trustworthy() -> None:
    item = WorldModelEntity(
        entity_id="x",
        entity_type="x",
        latitude=0,
        longitude=0,
        world_model_version="v1",
        observed_at="2026-08-25T21:00:00+00:00",
        freshness=DataFreshness.UNKNOWN,
        confidence=1,
        provenance=(provenance(),),
        state={},
    )
    assert not item.is_trustworthy()
