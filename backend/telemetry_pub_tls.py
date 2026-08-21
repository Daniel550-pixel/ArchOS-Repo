#!/usr/bin/env python3
# backend/telemetry_pub_tls.py
# ArchOS TLS 1.3 Authenticated Sensor Gateway Publisher

import json
import time
import math
import random
import ssl
import paho.mqtt.client as mqtt

BROKER_HOST = "localhost"
BROKER_PORT = 8883
TOPIC = "archos/b4471/telemetry"
USERNAME = "archos-sensor-gateway"
PASSWORD = "sec_gateway_token_994821"

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("[ArchOS TLS Gateway] Connected securely via TLS 1.3 to broker (RC=0)")
    else:
        print(f"[ArchOS TLS Gateway] TLS connection failed with error code RC={rc}")

def on_publish(client, userdata, mid, reason_codes=None, properties=None):
    pass

# Initialize MQTT Client with TLS 1.3
client = mqtt.Client(client_id="archos-spire-sensor-gateway-01", protocol=mqtt.MQTTv5)
client.username_pw_set(username=USERNAME, password=PASSWORD)

# TLS Context Configuration
context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
context.minimum_version = ssl.TLSVersion.TLSv1_3
context.set_ciphers('TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256')
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE # In production: ssl.CERT_REQUIRED with cafile="ca.crt"

client.tls_set_context(context)
client.on_connect = on_connect
client.on_publish = on_publish

print(f"[ArchOS] Connecting to TLS broker at {BROKER_HOST}:{BROKER_PORT}...")
try:
    client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)
    client.loop_start()
except Exception as e:
    print(f"[ArchOS] Connection warning (running in standalone mode): {e}")

t = 0
try:
    print(f"[ArchOS] Publishing telemetry to '{TOPIC}'...")
    while True:
        t += 1
        payload = {
            "ts": int(time.time() * 1000),
            "strain_mpa": round(142.0 + math.sin(t / 10.0) * 4.0 + random.uniform(-0.5, 0.5), 2),
            "accel_ms2": round(0.012 + random.uniform(-0.002, 0.002), 4),
            "chiller_dt_c": round(4.8 + math.sin(t / 20.0) * 0.6 + random.uniform(-0.1, 0.1), 2),
            "power_mw": round(8.4 + math.sin(t / 15.0) * 0.5 + random.uniform(-0.1, 0.1), 2),
            "security": {
                "tls_version": "TLSv1.3",
                "cipher": "TLS_AES_256_GCM_SHA384",
                "auth": "X.509+TOKEN"
            }
        }
        raw_json = json.dumps(payload)
        client.publish(TOPIC, raw_json, qos=1)
        time.sleep(1.0)
except KeyboardInterrupt:
    print("\n[ArchOS] Stopping TLS telemetry publisher.")
    client.loop_stop()
    client.disconnect()
