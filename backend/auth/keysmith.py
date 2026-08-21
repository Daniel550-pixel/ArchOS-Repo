"""KEYSMITH rotating vault authentication and optional post-quantum wrapping."""
import os
import time
import hmac
import hashlib
import asyncio

from fastapi import APIRouter, Request, HTTPException

try:
    import jwt
except ImportError:
    jwt = None

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
except ImportError:
    AESGCM = None

try:
    from pqcrypto.kem.kyber768 import generate_keypair, encrypt, decrypt
    PQ_ALG = "ML-KEM-768 (Kyber768)"
except Exception:
    generate_keypair = None
    PQ_ALG = "UNAVAILABLE"

from ..core.secrets import secret
from ..core.event_fabric import fabric
from ..app.core.config import settings
from .webauthn import USERS

router = APIRouter(prefix="/api/v1/auth/keysmith", tags=["keysmith"])
PERIOD = 60
_PQ: dict[str, dict] = {}


def period_index() -> int:
    return int(time.time() // PERIOD)


def rolling_key(user_secret: bytes, period: int) -> bytes:
    return hmac.new(user_secret, f"archos/vault/{period}".encode(), hashlib.sha256).digest()


def code_for(user_secret: bytes, period: int) -> str:
    return rolling_key(user_secret, period).hex()[:16]


def _seal(key: bytes, pt: bytes) -> bytes:
    if not AESGCM:
        raise RuntimeError("AES-GCM provider is unavailable")
    nonce = os.urandom(12)
    return nonce + AESGCM(key[:32]).encrypt(nonce, pt, None)


def _open(key: bytes, tok: bytes) -> bytes:
    if not AESGCM or len(tok) <= 12:
        raise RuntimeError("AES-GCM provider is unavailable")
    return AESGCM(key[:32]).decrypt(tok[:12], tok[12:], None)


def pq_rewrap(username: str) -> None:
    u = USERS.get(username)
    if not u or not generate_keypair:
        return
    pk, sk = generate_keypair()
    ct, ss = encrypt(pk)
    _PQ[username] = {
        "sk": sk,
        "ct": ct,
        "wrapped": _seal(ss, u["vault_key"]),
        "period": period_index(),
    }


def pq_unwrap(username: str) -> bytes:
    st = _PQ.get(username)
    if st and generate_keypair:
        return _open(decrypt(st["ct"], st["sk"]), st["wrapped"])
    return USERS.get(username, {}).get("vault_key", b"")


async def rotation_daemon():
    while True:
        try:
            await asyncio.sleep(max(1, PERIOD - (time.time() % PERIOD) + 0.5))
            for username in list(USERS):
                pq_rewrap(username)
            await fabric.publish("KEYSMITH_ROTATED", {"period": period_index(), "alg": PQ_ALG})
        except asyncio.CancelledError:
            raise
        except Exception:
            await asyncio.sleep(5)


def _user(req: Request) -> str:
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or not jwt:
        raise HTTPException(401, "Valid bearer authentication is required")

    tok = auth.split(" ", 1)[1].strip()
    jwt_secret = secret("JWT_SECRET")
    if not jwt_secret or len(jwt_secret) < 32:
        raise HTTPException(503, "JWT_SECRET is not securely configured")
    try:
        payload = jwt.decode(tok, jwt_secret, algorithms=["HS256"])
    except Exception as exc:
        raise HTTPException(401, "Invalid authentication token") from exc

    sub = payload.get("sub")
    if not sub or sub not in USERS:
        raise HTTPException(401, "Authenticated user is not registered")
    return sub


@router.get("/tick")
async def tick(req: Request):
    u = _user(req)
    if settings.ENVIRONMENT == "production" and (not AESGCM or not generate_keypair):
        raise HTTPException(503, "KEYSMITH cryptographic providers are unavailable")
    return {
        "period": period_index(),
        "seconds_left": PERIOD - int(time.time() % PERIOD),
        "alg": PQ_ALG,
        "rotated_at": _PQ.get(u, {}).get("period", period_index()),
        "status": "ARMED",
    }


@router.post("/unlock")
async def unlock(req: Request, body: dict):
    u = _user(req)
    sec = USERS[u].get("totp_secret")
    if not sec:
        raise HTTPException(403, "KEYSMITH secret is unavailable")
    now = period_index()
    code_in = body.get("code", "")
    valid_codes = (code_for(sec, now), code_for(sec, now - 1), code_for(sec, now + 1))

    if not hmac.compare_digest(code_in, valid_codes[0]) and not hmac.compare_digest(code_in, valid_codes[1]) and not hmac.compare_digest(code_in, valid_codes[2]):
        raise HTTPException(403, "Rotating key rejected or expired")

    jwt_secret = secret("JWT_SECRET")
    if not jwt or not jwt_secret or len(jwt_secret) < 32:
        raise HTTPException(503, "JWT support is required for KEYSMITH unlock")

    unlock_tok = jwt.encode(
        {
            "sub": u,
            "vault": "unlocked",
            "keysmith_period": now,
            "exp": int(time.time()) + PERIOD,
        },
        jwt_secret,
        "HS256",
    )
    return {"unlock_token": unlock_tok, "period": now, "expires_in": PERIOD}
