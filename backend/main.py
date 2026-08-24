"""Compatibility entrypoint for the retired legacy runtime.

The authoritative ArchOS application lives in ``backend.app.main``.
This module intentionally contains no second FastAPI application, background
workers, authentication stack, governance implementation, or integration
execution path. Existing launch commands using ``backend.main:app`` continue
to resolve to the authoritative application during migration.
"""

from app.main import app

__all__ = ["app"]
