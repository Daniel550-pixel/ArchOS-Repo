import inspect

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
    assert "/api/v1/governance/" in PROTECTED_PREFIXES
    assert "/api/v1/events" in PROTECTED_PREFIXES
    assert "/api/v1/jarvis/" in PROTECTED_PREFIXES


def test_session_has_no_operator_fallback():
    source = inspect.getsource(sessions.session)
    assert 'if "operator" in USERS' not in source
    assert 'raise HTTPException(401, "No session")' in source


def test_keysmith_has_no_development_unlock_bypass():
    user_source = inspect.getsource(keysmith._user)
    unlock_source = inspect.getsource(keysmith.unlock)
    assert 'Authorization' in user_source
    assert 'dev_' not in unlock_source
    assert 'Valid bearer authentication is required' in user_source


def test_webauthn_requires_real_authentication_verification():
    source = inspect.getsource(webauthn.login_verify)
    assert 'Authentication ceremony is invalid or expired' in source
    assert 'WebAuthn authentication verification failed' in source
    assert 'except Exception:' not in source
