"""Zero-trust. Intelligence recommends; authority acts. Immutable audit."""
from functools import wraps
from typing import List, Dict, Any

AUDIT: List[Dict[str, Any]] = []

def requires_authority(level: str):
    def deco(fn):
        @wraps(fn)
        async def wrapper(ctx, *a, **kw):
            AUDIT.append({
                "actor": getattr(ctx, "identity", "anonymous"),
                "action": fn.__name__,
                "level": level
            })
            if level == "CONSEQUENTIAL" and not getattr(ctx, "human_approved", False):
                raise PermissionError("Human approval required for consequential action")
            return await fn(ctx, *a, **kw)
        return wrapper
    return deco
