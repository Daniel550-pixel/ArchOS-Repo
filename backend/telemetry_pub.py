import asyncio
import json
import time
import math
import random
import paho.mqtt.client as mqtt


async def run_publisher():
    c = mqtt.Client()
    try:
        c.connect("localhost", 1883)
    except Exception as e:
        print(f"[Telemetry Pub] Connecting in loop: {e}")

    t = 0
    print("[ArchOS] Publishing telemetry stream to archos/b4471/telemetry...")
    while True:
        t += 1
        payload = {
            "ts": time.time(),
            "strain_mpa": round(140.0 + math.sin(t / 10) * 4 + random.uniform(-0.5, 0.5), 2),
            "accel_ms2": round(0.012 + random.uniform(-0.002, 0.002), 4),
            "chiller_dt_c": round(4.8 + math.sin(t / 20) * 0.6, 2),
            "power_mw": round(8.4 + math.sin(t / 15) * 0.5, 2)
        }
        try:
            c.publish("archos/b4471/telemetry", json.dumps(payload))
        except Exception:
            pass
        await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(run_publisher())

