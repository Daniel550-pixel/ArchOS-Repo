import asyncio

import pytest

from app.services.night_shift import NightShiftRuntime


@pytest.mark.asyncio
async def test_night_shift_run_once_preserves_unavailable_data(monkeypatch):
    runtime = NightShiftRuntime()

    async def fake_watch():
        return {
            "ts": "2026-08-21T07:00:00+04:00",
            "city": {"status": "unavailable"},
            "climate": {"status": "unavailable"},
            "bms": {"status": "unavailable"},
        }

    monkeypatch.setattr(runtime, "gather_watch", fake_watch)
    result = await runtime.run_once()

    assert runtime.last_status == "SUCCESS"
    assert result["watch"]["climate"]["status"] == "unavailable"
    assert result["watch"]["bms"]["status"] == "unavailable"
    assert "unavailable" in result["text"]


@pytest.mark.asyncio
async def test_night_shift_start_and_stop_are_cancellable(monkeypatch):
    runtime = NightShiftRuntime()

    async def fake_loop():
        await asyncio.sleep(3600)

    monkeypatch.setattr(runtime, "_loop", fake_loop)
    runtime.start()
    assert runtime.status()["running"] is True
    assert runtime.status()["task_alive"] is True

    await runtime.stop()
    assert runtime.status()["running"] is False
    assert runtime.status()["task_alive"] is False
