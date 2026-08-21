"""Cert expiry watchdog → Event Fabric."""
import asyncio
import socket
import ssl
import time

async def watch(host="localhost", ports=(443, 8883, 9002), warn_days=14):
    from .event_fabric import fabric
    while True:
        for port in ports:
            try:
                ctx = ssl.create_default_context()
                try:
                    ctx.load_verify_locations("/certs/ca.crt")
                except Exception:
                    pass
                with socket.create_connection((host, port), timeout=5) as s:
                    with ctx.wrap_socket(s, server_hostname=host) as ss:
                        peer_cert = ss.getpeercert()
                        if peer_cert and "notAfter" in peer_cert:
                            exp = ssl.cert_time_to_seconds(peer_cert["notAfter"])
                            days = (exp - time.time()) / 86400
                            if days < warn_days:
                                await fabric.publish("CERT_EXPIRING", {
                                    "host": host,
                                    "port": port,
                                    "days": round(days, 1)
                                })
            except Exception as e:
                # Silently catch or publish diagnostics during development
                pass
        await asyncio.sleep(3600)
