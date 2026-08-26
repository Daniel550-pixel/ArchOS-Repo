"""IRIS — International Reality Integrity Platform.

Pure domain primitives for measuring integrity signals inside ArchOS.
IRIS is intentionally separated from transport, model providers, and UI.
"""

from .models import IntegritySignal, IntegrityDomain, IntegritySnapshot
from .engine import RealityIntegrityEngine
from .policy import IntegrityPolicy, IntegrityDecision

__all__ = [
    "IntegritySignal",
    "IntegrityDomain",
    "IntegritySnapshot",
    "RealityIntegrityEngine",
    "IntegrityPolicy",
    "IntegrityDecision",
]
