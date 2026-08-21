"""Modbus-TCP BMS adapter.

The authoritative application calls these functions through IntegrationRuntime.
No synthetic telemetry is returned when the BMS is unavailable.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

REGISTERS = (
    ("strain_mpa", 0, 0.1),
    ("accel_ms2", 1, 0.001),
    ("chiller_dt_c", 2, 0.1),
    ("power_mw", 3, 0.1),
    ("supply_temp_c", 4, 0.1),
    ("flow_lps", 5, 0.1),
)

STATE_FILE = Path(os.getenv("BMS_STATE_FILE", "bms_state.json"))


def _client():
    from pymodbus.client import ModbusTcpClient
    return ModbusTcpClient(
        os.getenv("PLC_HOST", "localhost"),
        port=int(os.getenv("PLC_PORT", "5020")),
        timeout=2,
    )


def last_state() -> dict:
    """Return cached observed state, or an explicit unavailable state."""
    try:
        if STATE_FILE.exists():
            data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            source = str(data.get("source", ""))
            data["reality"] = "EMULATED" if "localhost" in source else "OBSERVED"
            return data
    except (OSError, ValueError, TypeError):
        pass
    return {"status": "unavailable", "reality": "UNAVAILABLE", "source": "modbus"}


def write_registers(updates: dict[str, float]) -> dict:
    """Write registers and verify them by reading the physical endpoint back."""
    if not updates:
        raise ValueError("updates must not be empty")
    unknown = sorted(set(updates) - {name for name, _, _ in REGISTERS})
    if unknown:
        raise ValueError(f"unsupported registers: {unknown}")

    client = _client()
    host = os.getenv("PLC_HOST", "localhost")
    port = int(os.getenv("PLC_PORT", "5020"))
    if not client.connect():
        client.close()
        raise ConnectionError(f"Modbus endpoint unavailable: {host}:{port}")

    try:
        for name, reg_idx, scale in REGISTERS:
            if name in updates:
                result = client.write_register(reg_idx, int(round(float(updates[name]) / scale)))
                if result.isError():
                    raise RuntimeError(f"Modbus write failed for {name}")

        readback = client.read_holding_registers(address=0, count=len(REGISTERS))
        if readback.isError():
            raise RuntimeError("Modbus read-back failed")

        state = {"ts": time.time(), "source": f"modbus://{host}:{port}", "reality": "EMULATED" if "localhost" in host else "OBSERVED"}
        for (name, _, scale), raw in zip(REGISTERS, readback.registers):
            state[name] = round(raw * scale, 3)

        verified = all(abs(state[name] - float(value)) <= 0.01 for name, value in updates.items())
        state["read_back_verified"] = verified
        if not verified:
            raise RuntimeError("Modbus read-back verification failed")

        try:
            STATE_FILE.write_text(json.dumps(state), encoding="utf-8")
        except OSError:
            pass

        return {
            "success": True,
            "read_back_verified": True,
            "updated_state": state,
            "execution_state": "EXECUTED",
            "reality": state["reality"],
            "timestamp": state["ts"],
        }
    finally:
        client.close()
