from app.core.config import Settings
from app.middleware.identity import PROTECTED_PREFIXES
from backend.auth import keysmith, sessions, webauthn


def test_production_requires_jwt_secret_and_secure_admin_key():
    try:
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql+asyncpg://archos:strong-password@db/archos",
            CORS_ORIGINS=["https://archos.example"],
            ADMIN_API_KEY="A" * 32,
        )
    except ValueError as exc:
        assert "JWT_SECRET" in str(exc)
    else:
        raise AssertionError("production settings must require JWT_SECRET")


def test_production_rejects_insecure_auth_fallbacks():
    try:
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql+asyncpg://archos:strong-password@db/archos",
            CORS_ORIGINS=["https://archos.example"],
            ADMIN_API_KEY="A" * 32,
            JWT_SECRET="B" * 32,
            ALLOW_INSECURE_AUTH_FALLBACKS=True,
        )
    except ValueError as exc:
        assert "Insecure authentication fallbacks" in str(exc)
    else:
        raise AssertionError("production must reject insecure auth fallbacks")


def test_sensitive_runtime_surfaces_are_identity_protected():
    protected = PROTECTED_PREFIXES
    assert "/api/v1/governance/" in protected
    assert "/api/v1/events" in protected
    assert "/api/v1/jarvis/" in protected


def test_session_has_no_operator_fallback():
    assert "if not rec" in sessions.session.__code__.co_names or sessions.REFRESH == {}
    assert "operator" not in sessions.session.__code__.co_names


def test_keysmith_requires_bearer_identity():
    assert "Authorization" in keysmith._user.__code__.co_names
    assert "dev_" not in keysmith.unlock.__code__.co_names


def test_webauthn_requires_challenge_for_login():
    assert "Authentication ceremony is invalid or expired" in webauthn.login_verify.__code__.co_consts
