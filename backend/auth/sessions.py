"""httpOnly rotating refresh sessions for authenticated ArchOS users."""
import time
import hashlib
import secrets as pysec
import base64

try:
    import jwt
except ImportError:
    jwt = None

from fastapi import APIRouter, Response, Request, HTTPException
from ..core.secrets import secret
from .webauthn import USERS

router = APIRouter(prefix="/api/v1/auth", tags=["sessions"])
REFRESH: dict[str, dict] = {}
CK = "archos_rt"
REFRESH_TTL = 7 * 86400
ACCESS_TTL = 15 * 60


def _b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("utf-8").rstrip("=")


def _jwt_secret() -> str:
    value = secret("JWT_SECRET")
    if not value or len(value) < 32 or not jwt:
        raise HTTPException(503, "JWT session security is unavailable")
    return value


def _access(username: str) -> str:
    return jwt.encode(
        {"sub": username, "iat": int(time.time()), "exp": int(time.time()) + ACCESS_TTL},
        _jwt_secret(),
        "HS256",
    )


def _issue_refresh(username: str, res: Response) -> None:
    tok = pysec.token_urlsafe(48)
    h = hashlib.sha256(tok.encode()).hexdigest()
    REFRESH[h] = {"username": username, "exp": time.time() + REFRESH_TTL}
    res.set_cookie(
        CK,
        tok,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/api/v1/auth",
        max_age=REFRESH_TTL,
    )


@router.post("/login/finalize")
def finalize(username: str, res: Response):
    if username not in USERS:
        raise HTTPException(401, "Unknown authenticated user")
    _issue_refresh(username, res)
    return {"ok": True}


@router.post("/session")
async def session(req: Request, res: Response):
    tok = req.cookies.get(CK)
    if not tok:
        raise HTTPException(401, "No session")

    token_hash = hashlib.sha256(tok.encode()).hexdigest()
    rec = REFRESH.pop(token_hash, None)
    if not rec or rec["exp"] < time.time():
        raise HTTPException(401, "Session expired or revoked")

    username = rec["username"]
    u = USERS.get(username)
    if not u:
        raise HTTPException(401, "Unknown user")

    _issue_refresh(username, res)
    return {
        "jwt": _access(username),
        "vault_key": _b64u(u["vault_key"]),
    }


@router.post("/logout")
async def logout(req: Request, res: Response):
    tok = req.cookies.get(CK)
    if tok:
        REFRESH.pop(hashlib.sha256(tok.encode()).hexdigest(), None)
    res.delete_cookie(CK, path="/api/v1/auth")
    return {"ok": True}
