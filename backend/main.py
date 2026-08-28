# Compatibility entrypoint for the authoritative ArchOS runtime.
# Re-export the canonical application object; no second runtime exists.
from app.main import app
__all__ = ["app"]
