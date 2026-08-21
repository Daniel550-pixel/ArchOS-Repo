"""ArchOS agent package bootstrap.

The World Model capability is rebound here so every consumer of the canonical
swarm receives the PostgreSQL-backed temporal authority rather than the legacy
in-memory specialist implementation.
"""

from .authoritative_world_model_agent import AuthoritativeWorldModelAgent
from .swarm import swarm

# Replace the legacy World Model specialist in the singleton registry before
# any orchestrator can route a WORLD_MODEL task.
swarm.agents["world_model"] = AuthoritativeWorldModelAgent()

__all__ = ["swarm", "AuthoritativeWorldModelAgent"]
