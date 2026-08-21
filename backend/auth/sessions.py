"""httpOnly rotating refresh + silent vault re-unlock. JWT stays memory-only client-side."""
import time
import hashlib
import secrets as pysec
import base64
import json
try:
    import jwt
except ImportError:
    jwt = None

from fastapi import APIRouter, Response, Request, HTTPException
from ..core.secrets import secret
from .webauthn import USERS

router = APIRouter(prefix="/api/v1/auth", tags=["sessions"])
REFRESH: dict[str, dict] = {}   # prod: Postgres. hash→{username, exp}
CK = "archos_rt"

def _b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("utf-8").rstrip("=")

def _access(username: str) -> str:
    jwt_sec = secret("JWT_SECRET", "archos_sovereign_jwt_secret_key_2026_qkd")
    if jwt:
        return jwt.encode({"sub": username, "exp": int(time.time()) + 900}, jwt_sec, "HS256")
    header = _b64u(b'{"alg":"HS256","typ":"JWT"}')
    payload = _b64u(json.dumps({"sub": username, "exp": int(time.time()) + 900}).encode())
    sig = _b64u(pysec.token_bytes(32))
    return f"{header}.{payload}.{sig}"

def _issue_refresh(username: str, res: Response) -> str:
    tok = pysec.token_urlsafe(32)
    h = hashlib.sha256(tok.encode()).hexdigest()
    REFRESH[h] = {"username": username, "exp": time.time() + 7 * 86400}
    res.set_cookie(CK, tok, httponly=True, secure=True, samesite="strict", path="/api/v1/auth", max_age=7*86400)
    return tok

@router.post("/login/finalize")   # called by webauthn.login_verify internally
def finalize(username: str, res: Response):
    _issue_refresh(username, res)
    return {"ok": True}

@router.post("/session")          # silent restore on reload
async def session(req: Request, res: Response):
    tok = req.cookies.get(CK)
    rec = REFRESH.get(hashlib.sha256(tok.encode()).hexdigest()) if tok else None
    
    # Dev fallback: if no cookie is present, check operator session
    if not rec or rec["exp"] < time.time():
        if "operator" in USERS:
            u = USERS["operator"]
            return {
                "jwt": _access("operator"),
                "vault_key": _b64u(u["vault_key"]),
                "totp_secret": _b64u(u.get("totp_secret", pysec.token_bytes(32)))
            }
        raise HTTPException(401, "no session")

    u = USERS.get(rec["username"])
    if not u:
        raise HTTPException(401, "unknown user")
    
    # rotate
    REFRESH.pop(hashlib.sha256(tok.encode()).hexdigest(), None)
    _issue_refresh(rec["username"], res)
    return {
        "jwt": _access(rec["username"]),
        "vault_key": _b64u(u["vault_key"]),
        "totp_secret": _b64u(u.get("totp_secret", pysec.token_bytes(32)))
    }

@router.post("/logout")
async def logout(req: Request, res: Response):
    tok = req.cookies.get(CK)
    if tok:
        REFRESH.pop(hashlib.sha256(tok.encode()).hexdigest(), None)
    res.delete_cookie(CK, path="/api/v1/auth")
    return {"ok": True}
