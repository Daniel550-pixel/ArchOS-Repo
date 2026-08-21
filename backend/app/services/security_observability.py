from __future__ import annotations

import json
import logging
import socket
import ssl
import time
import uuid

from fastapi import Request
from fastapi.responses import Response

from app.services.event_fabric import app_event_fabric

try:
    from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
except ImportError as exc:  # pragma: no cover - dependency is pinned in requirements
    raise RuntimeError("prometheus-client is required for runtime observability") from exc


REQUESTS = Counter("archos_requests_total", "Total requests processed", ["path", "status"])
LATENCY = Histogram("archos_request_seconds", "Request latency in seconds", ["path"])
LOG = logging.getLogger("archos")
LOG.setLevel(logging.INFO)
REQUEST_COUNTER = 0


async def instrument(request: Request, call_next):
    global REQUEST_COUNTER
    REQUEST_COUNTER += 1
    request_id = request.headers.get("X-Request-Id", uuid.uuid4().hex)
    started = time.monotonic()
    try:
        response = await call_next(request)
    except Exception as exc:
        LOG.error(json.dumps({"rid": request_id, "path": request.url.path, "error": type(exc).__name__}))
        await app_event_fabric.publish(
            "request.failed",
            {"request_id": request_id, "path": request.url.path, "error": type(exc).__name__},
            source="observability",
        )
        raise

    duration = time.monotonic() - started
    response.headers["X-Request-Id"] = request_id
    REQUESTS.labels(path=request.url.path, status=response.status_code).inc()
    LATENCY.labels(path=request.url.path).observe(duration)
    LOG.info(json.dumps({
        "rid": request_id,
        "path": request.url.path,
        "status": response.status_code,
        "ms": round(duration * 1000, 1),
    }))
    return response


def metrics_response() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


def cert_days(host: str = "localhost", port: int = 443) -> float | None:
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, port), timeout=3) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as tls_sock:
                cert = tls_sock.getpeercert()
                if not cert or "notAfter" not in cert:
                    return None
                expire_ts = ssl.cert_time_to_seconds(cert["notAfter"])
                return round((expire_ts - time.time()) / 86400, 1)
    except (OSError, ssl.SSLError, ValueError):
        return None


def ops_status() -> dict:
    return {
        "requests": REQUEST_COUNTER,
        "cert_days": cert_days(),
        "ts": time.time(),
        "edge_waf": "EXTERNAL_BOUNDARY",
        "rate_limiting": "APPLICATION_POLICY",
        "csp": "APPLICATION_BOUNDARY",
    }


async def certificate_watchdog(
    host: str = "localhost",
    ports: tuple[int, ...] = (443, 8883, 9002),
    warn_days: int = 14,
    interval_seconds: int = 3600,
) -> None:
    while True:
        try:
            for port in ports:
                days = cert_days(host, port)
                if days is not None and days < warn_days:
                    await app_event_fabric.publish(
                        "security.certificate_expiring",
                        {"host": host, "port": port, "days": days},
                        source="security",
                    )
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            await app_event_fabric.publish(
                "security.certificate_check_failed",
                {"host": host, "error": type(exc).__name__},
                source="security",
            )
        await asyncio.sleep(interval_seconds)
