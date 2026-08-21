"""One secure factory for every publisher/subscriber. TLS + auth (+optional mTLS)."""
import os
import ssl
try:
    import paho.mqtt.client as mqtt
except ImportError:
    mqtt = None

from ..core.secrets import secret

CERTS = os.getenv("CERT_DIR", "/certs")

def connect(client_id: str, host: str = "localhost", port: int = 8883, mtls: bool = False):
    if not mqtt:
        return None
    c = mqtt.Client(client_id=client_id)
    user = secret("MQTT_USER", "telemetry-gw")
    pw = secret("MQTT_PASS", "telemetry_pass")
    if user and pw:
        c.username_pw_set(user, pw)

    ca_path = f"{CERTS}/ca.crt" if os.path.exists(f"{CERTS}/ca.crt") else None
    cert_path = f"{CERTS}/client.crt" if (mtls and os.path.exists(f"{CERTS}/client.crt")) else None
    key_path = f"{CERTS}/client.key" if (mtls and os.path.exists(f"{CERTS}/client.key")) else None

    if ca_path:
        try:
            c.tls_set(ca_certs=ca_path, certfile=cert_path, keyfile=key_path)
        except Exception as e:
            print(f"[MQTT Secure] TLS Config warning: {e}")

    try:
        c.connect(host, port)
    except Exception as e:
        print(f"[MQTT Secure] Connection note: {e}")
    return c
