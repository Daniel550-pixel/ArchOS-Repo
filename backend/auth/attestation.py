import os

ALLOWED = {u.strip() for u in os.getenv("ALLOWED_AAGUIDS", "").split(",") if u.strip()}

def enforce(aaguid):
    if not ALLOWED:
        return  # dev permissive
    if not aaguid or str(aaguid) not in ALLOWED:
        raise PermissionError("Authenticator not in FIDO-certified UAE Sovereign allowlist")
