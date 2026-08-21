from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import httpx

from app.services.event_fabric import app_event_fabric
from app.services.integration_runtime import integration_runtime

logger = logging.getLogger(__name__)

DUBAI_TZ = ZoneInfo("Asia/Dubai")


class NightShiftRuntime:
    """Authoritative autonomous watch and morning-briefing worker.

    The worker owns exactly one cancellable asyncio task. It performs
    observational reads only; physical writes remain behind the governance
    boundary. Missing external data is represented as unavailable rather than
    replaced with fabricated telemetry.
    """

    def __init__(self) -> None:
        self._running = False
        self._task: asyncio.Task[None] | None = None
        self._lock = asyncio.Lock()
        self.last_watch: dict[str, Any] | None = None
        self.last_briefing: dict[str, Any] | None = None
        self.last_run_at: datetime | None = None
        self.last_status = "IDLE"

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop(), name="night-shift")
        logger.info("Night Shift runtime started")

    async def stop(self) -> None:
        self._running = False
        task = self._task
        self._task = None
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info("Night Shift runtime stopped")

    async def gather_watch(self) -> dict[str, Any]:
        climate: dict[str, Any] = {"status": "unavailable"}
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    "https://api.open-meteo.com/v1/forecast"
                    "?latitude=25.2048&longitude=55.2708"
                    "&current=temperature_2m,wind_speed_10m,relative_humidity_2m"
                )
                response.raise_for_status()
                climate = response.json().get("current", {})
        except (httpx.HTTPError, ValueError) as exc:
            await app_event_fabric.publish(
                "night_shift.climate_unavailable",
                {"error": type(exc).__name__},
                source="night_shift",
            )

        try:
            buildings = await integration_runtime.buildings()
            city = {
                "count": len(buildings),
                "source": "openstreetmap_overpass",
            }
        except Exception as exc:
            city = {"status": "unavailable"}
            await app_event_fabric.publish(
                "night_shift.city_data_unavailable",
                {"error": type(exc).__name__},
                source="night_shift",
            )

        try:
            bms = await integration_runtime.modbus_state()
        except Exception as exc:
            bms = {"status": "unavailable"}
            await app_event_fabric.publish(
                "night_shift.bms_unavailable",
                {"error": type(exc).__name__},
                source="night_shift",
            )

        return {
            "ts": datetime.now(DUBAI_TZ).isoformat(),
            "city": city,
            "climate": climate,
            "bms": bms,
        }

    async def compose(self, watch: dict[str, Any]) -> dict[str, Any]:
        text: str | None = None
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                from openai import AsyncOpenAI

                client = AsyncOpenAI(api_key=api_key)
                response = await client.chat.completions.create(
                    model=os.getenv("NIGHT_SHIFT_MODEL", "gpt-4o-mini"),
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are J.A.R.V.I.S. Produce a concise, factual UAE operations "
                                "morning briefing. Never invent missing telemetry."
                            ),
                        },
                        {
                            "role": "user",
                            "content": json.dumps(watch, ensure_ascii=False),
                        },
                    ],
                )
                text = response.choices[0].message.content
            except Exception as exc:
                await app_event_fabric.publish(
                    "night_shift.briefing_ai_unavailable",
                    {"error": type(exc).__name__},
                    source="night_shift",
                )

        if not text:
            climate = watch.get("climate", {})
            city = watch.get("city", {})
            bms = watch.get("bms", {})
            text = (
                "UAE morning operations briefing. "
                f"Climate status: {climate.get('status', 'observed')}. "
                f"City observations: {city.get('count', 'unavailable')}. "
                f"BMS status: {bms.get('status', bms.get('reality', 'observed'))}."
            )

        brief = {
            "id": f"brief-{int(time.time())}",
            "ts": watch["ts"],
            "text": text,
            "watch": watch,
        }
        self.last_briefing = brief
        await app_event_fabric.publish(
            "night_shift.briefing_ready",
            {"id": brief["id"]},
            source="night_shift",
        )
        return brief

    async def run_once(self) -> dict[str, Any]:
        async with self._lock:
            self.last_status = "RUNNING"
            self.last_run_at = datetime.now(DUBAI_TZ)
            try:
                watch = await self.gather_watch()
                self.last_watch = watch
                brief = await self.compose(watch)
                self.last_status = "SUCCESS"
                return brief
            except asyncio.CancelledError:
                self.last_status = "CANCELLED"
                raise
            except Exception as exc:
                self.last_status = "FAILED"
                await app_event_fabric.publish(
                    "night_shift.failed",
                    {"error": type(exc).__name__},
                    source="night_shift",
                )
                raise

    async def _loop(self) -> None:
        while self._running:
            try:
                now = datetime.now(DUBAI_TZ)
                target = now.replace(hour=7, minute=0, second=0, microsecond=0)
                if target <= now:
                    target += timedelta(days=1)
                await asyncio.sleep((target - now).total_seconds())
                if self._running:
                    await self.run_once()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.exception("Night Shift cycle failed: %s", exc)
                await asyncio.sleep(300)

    def status(self) -> dict[str, Any]:
        return {
            "running": self._running,
            "status": self.last_status,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "task_alive": bool(self._task and not self._task.done()),
        }


night_shift_runtime = NightShiftRuntime()
