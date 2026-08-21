from __future__ import annotations

from typing import Any

from app.services.event_fabric import app_event_fabric
from backend.integrations.modbus_gateway import last_state, write_registers
from backend.integrations.osm import tallest_buildings
from backend.integrations.pulse import pulse


class IntegrationRuntime:
    """Authoritative adapter for external data and building-control integrations.

    Reads are explicitly observational. Writes are never exposed here as an
    ungoverned operation; callers must pass them through GovernanceBridge.
    """

    async def modbus_state(self) -> dict[str, Any]:
        state = last_state()
        await app_event_fabric.publish(
            "integration.modbus.observed",
            {"source": state.get("source"), "reality": state.get("reality")},
            source="integration.modbus",
        )
        return state

    async def modbus_write(self, updates: dict[str, Any]) -> dict[str, Any]:
        result = write_registers(updates)
        await app_event_fabric.publish(
            "integration.modbus.write_completed",
            {
                "success": result.get("success"),
                "read_back_verified": result.get("read_back_verified"),
                "reality": result.get("reality"),
            },
            source="integration.modbus",
        )
        return result

    async def pulse_dataset(self, slug: str) -> dict[str, Any] | None:
        data = await pulse.dataset(slug)
        await app_event_fabric.publish(
            "integration.pulse.dataset_fetched",
            {"slug": slug, "authenticated": data is not None},
            source="integration.dubai_pulse",
        )
        return data

    async def pulse_fallback(self, topic: str) -> dict[str, Any]:
        data = await pulse.fallback(topic)
        await app_event_fabric.publish(
            "integration.pulse.fallback_used",
            {"topic": topic, "source": data.get("source")},
            source="integration.dubai_pulse",
        )
        return data

    async def buildings(self) -> list[dict[str, Any]]:
        data = await tallest_buildings()
        await app_event_fabric.publish(
            "integration.osm.buildings_observed",
            {"count": len(data), "source": "openstreetmap_overpass"},
            source="integration.osm",
        )
        return data


integration_runtime = IntegrationRuntime()
