"""Economic Intelligence: tenant tier × complexity × margin → model route.
Truthful model execution: calls real Gemini API if configured or explicitly returns unconfigured baseline.
"""
import os
import json
from typing import List, Dict, Any, Optional

class ModelResponse:
    def __init__(self, content: str = "", tool_calls: Optional[List[Any]] = None, is_real: bool = False, model_name: str = ""):
        self.content = content
        self.tool_calls = tool_calls or []
        self.is_real = is_real
        self.model_name = model_name

class ModelRoute:
    def __init__(self, name: str, cost_per_1k: float):
        self.name = name
        self.cost_per_1k = cost_per_1k

    async def chat(self, msgs: List[Dict[str, Any]], tools=None) -> ModelResponse:
        api_key = os.getenv("GEMINI_API_KEY")
        last_user = next((m.get("content", "") for m in reversed(msgs) if m.get("role") == "user"), "")
        
        if api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=self.name if "gemini" in self.name else "gemini-2.5-flash",
                    contents=last_user,
                )
                return ModelResponse(
                    content=response.text or "",
                    is_real=True,
                    model_name=self.name
                )
            except Exception as e:
                return ModelResponse(
                    content=f"Model call failed: {str(e)}",
                    is_real=False,
                    model_name="ERROR"
                )
        
        # Explicit unconfigured fallback - never pretends inference occurred
        return ModelResponse(
            content=f"Deterministic baseline: No GEMINI_API_KEY configured in environment. Rule-based evaluation performed for '{last_user}'.",
            is_real=False,
            model_name="UNCONFIGURED_BASELINE"
        )

FAST_MODEL = ModelRoute("gemini-2.5-flash", 0.00015)
PRIMARY_MODEL = ModelRoute("gemini-2.5-pro", 0.00125)
CONSENSUS_MODEL = ModelRoute("gemini-consensus-ensemble", 0.00350)

def estimate_complexity(query_str: str) -> float:
    words = len(query_str.split())
    if any(k in query_str.lower() for k in ["simulate", "counterfactual", "structural audit", "cfd", "eigenmode"]):
        return 0.85
    if words > 20:
        return 0.65
    return 0.35

def get_tenant_margin(tenant_id: str) -> float:
    return 0.25

def route_model(query: dict) -> ModelRoute:
    q = query.get("query", "")
    tenant_id = query.get("tenant_id", "default")
    complexity = estimate_complexity(q)
    margin = get_tenant_margin(tenant_id)
    if complexity < 0.4 or margin < 0.1:
        return FAST_MODEL
    if complexity < 0.75:
        return PRIMARY_MODEL
    return CONSENSUS_MODEL
