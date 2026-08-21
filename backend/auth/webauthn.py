"""WebAuthn registration/authentication and JWT session issuance."""
import base64
import json
import time
import secrets as pysec

try:
    import jwt
except ImportError:
    jwt = None

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from webauthn import (
        generate_registration_options,
        verify_registration_response,
        generate_authentication_options,
        verify_authentication_response,
        options_to_json,
    )
    from webauthn.helpers import (
        parse_registration_credential_json,
        parse_authentication_credential_json,
    )
    from webauthn.helpers.structs import (
        AuthenticatorSelectionCriteria,
        ResidentKeyRequirement,
        UserVerificationRequirement,
        AuthenticatorAttachment,
        PublicKeyCredentialDescriptor,
    )
except ImportError:
    generate_registration_options = None
    verify_registration_response = None
    generate_authentication_options = None
    verify_authentication_response = None
    options_to_json = None
    parse_registration_credential_json = None
    parse_authentication_credential_json = None
    AuthenticatorSelectionCriteria = None
    ResidentKeyRequirement = None
    UserVerificationRequirement = None
    AuthenticatorAttachment = None
    PublicKeyCredentialDescriptor = None

from ..core.secrets import secret
from ..app.core.config import settings

RP_NAME = settings.WEBAUTHN_RP_NAME
RP_ID = settings.WEBAUTHN_RP_ID
ORIGIN = settings.WEBAUTHN_ORIGIN
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

CHALLENGES: dict[str, bytes] = {}
USERS: dict[str, dict] = {}


class UserReq(BaseModel):
    username: str


class CredReq(BaseModel):
    username: str
    credential: dict


def _require_webauthn() -> None:
    if not all((generate_registration_options, verify_registration_response,
                generate_authentication_options, verify_authentication_response,
                options_to_json, parse_registration_credential_json,
                parse_authentication_credential_json)):
        if not settings.ALLOW_INSECURE_AUTH_FALLBACKS:
            raise HTTPException(503, "WebAuthn security provider is unavailable")


def _jwt_secret() -> str:
    value = secret("JWT_SECRET")
    if not value or len(value) < 32:
        raise HTTPException(503, "JWT_SECRET is not securely configured")
    return value


@router.post("/register/options")
async def reg_options(body: UserReq):
    _require_webauthn()
    if not generate_registration_options:
        raise HTTPException(503, "WebAuthn security provider is unavailable")

    user_id = USERS.get(body.username, {}).get("user_id", pysec.token_bytes(16))
    opts = generate_registration_options(
        rp_name=RP_NAME,
        rp_id=RP_ID,
        user_name=body.username,
        user_id=user_id,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.REQUIRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
    )
    CHALLENGES[body.username] = opts.challenge
    return json.loads(options_to_json(opts))


@router.post("/register/verify")
async def reg_verify(body: CredReq):
    _require_webauthn()
    ch = CHALLENGES.pop(body.username, None)
    if not ch:
        raise HTTPException(400, "No active registration challenge")
    if not verify_registration_response or not parse_registration_credential_json:
        raise HTTPException(503, "WebAuthn security provider is unavailable")

    try:
        ver = verify_registration_response(
            credential=parse_registration_credential_json(json.dumps(body.credential)),
            expected_challenge=ch,
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            require_user_verification=True,
        )
    except Exception as exc:
        raise HTTPException(400, "WebAuthn registration verification failed") from exc

    USERS[body.username] = {
        "user_id": USERS.get(body.username, {}).get("user_id", pysec.token_bytes(16)),
        "cred_id": ver.credential_id,
        "public_key": ver.credential_public_key,
        "sign_count": ver.sign_count,
        "vault_key": pysec.token_bytes(32),
        "totp_secret": pysec.token_bytes(32),
    }
    return {"ok": True}


@router.post("/login/options")
async def login_options(body: UserReq):
    _require_webauthn()
    u = USERS.get(body.username)
    if not u:
        raise HTTPException(404, "User is not registered")
    if not generate_authentication_options or not PublicKeyCredentialDescriptor:
        raise HTTPException(503, "WebAuthn security provider is unavailable")

    opts = generate_authentication_options(
        rp_id=RP_ID,
        user_verification=UserVerificationRequirement.REQUIRED,
        allow_credentials=[PublicKeyCredentialDescriptor(id=u["cred_id"])],
    )
    CHALLENGES[body.username] = opts.challenge
    return json.loads(options_to_json(opts))


@router.post("/login/verify")
async def login_verify(body: CredReq):
    _require_webauthn()
    u = USERS.get(body.username)
    ch = CHALLENGES.pop(body.username, None)
    if not u or not ch:
        raise HTTPException(401, "Authentication ceremony is invalid or expired")
    if not verify_authentication_response or not parse_authentication_credential_json:
        raise HTTPException(503, "WebAuthn security provider is unavailable")

    try:
        ver = verify_authentication_response(
            credential=parse_authentication_credential_json(json.dumps(body.credential)),
            expected_challenge=ch,
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            credential_public_key=u["public_key"],
            credential_current_sign_count=u["sign_count"],
            require_user_verification=True,
        )
    except Exception as exc:
        raise HTTPException(401, "WebAuthn authentication verification failed") from exc

    u["sign_count"] = ver.new_sign_count
    attachment = body.credential.get("authenticatorAttachment", "platform")
    token = jwt.encode(
        {"sub": body.username, "iat": int(time.time()), "exp": int(time.time()) + 3600},
        _jwt_secret(),
        algorithm="HS256",
    ) if jwt else None
    if not token:
        raise HTTPException(503, "JWT support is required for authentication")

    vault_key_b64u = base64.urlsafe_b64encode(u["vault_key"]).decode("utf-8").rstrip("=")
    return {
        "jwt": token,
        "vault_key": vault_key_b64u,
        "biometric": attachment == "platform",
        "user_verified": True,
    }
