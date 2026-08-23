# ArchOS Python SDK

The ArchOS Python SDK provides a small, typed client for the externally consumable ArchOS runtime APIs. It is intentionally thin: identity, policy evaluation, governance, verification, and execution remain authoritative on the ArchOS server.

## Install locally

```bash
cd sdk/python
python -m pip install .
```

## Example

```python
from archos_sdk import ArchOSClient

with ArchOSClient("http://localhost:8000", token="YOUR_TOKEN") as archos:
    print(archos.health())

    result = archos.ask("Inspect the current runtime health and summarize anomalies.")
    print(result.task_id, result.verification_status)

    decision = archos.submit_action(
        actor="operator",
        agent="ops-agent",
        target="runtime",
        requested_operation="read_health",
        risk_level="LOW_RISK",
        provenance="operator-request",
    )
    print(decision.action_id, decision.decision)
```

## Design boundary

The SDK never bypasses the server-side Action Gate. Applications submit intent; ArchOS performs identity, policy, risk, approval, audit, and execution decisions.

See `../../ARCHITECTURE.md` and the API's `/docs` endpoint for the current runtime contract.

## Stability

The `0.1.x` SDK is an early public contract. Breaking changes will be documented in release notes before the project reaches `1.0.0`.
