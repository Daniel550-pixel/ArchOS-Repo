# ArchOS Integration Contract

ArchOS is intended to be consumed as a platform as well as run as a complete application. This document defines the first public integration boundary.

## Stable boundary

External applications should integrate through the HTTP API or the Python SDK. They should not import private backend modules such as governance internals, runtime bridges, database implementations, or action-gate classes directly.

```text
External application
        │
        ▼
   ArchOS API / SDK
        │
        ├── Identity
        ├── Policy
        ├── Risk evaluation
        ├── Approval
        ├── Audit
        ├── Verification
        └── Execution
```

## Current capabilities

| Capability | Endpoint | SDK |
|---|---|---|
| Runtime health | `GET /api/v1/health/runtime` | `health()` |
| JARVIS request | `POST /api/v1/jarvis/ask` | `ask()` |
| Governed action submission | `POST /api/v1/governance/actions` | `submit_action()` |
| Governed action approval | `POST /api/v1/governance/actions/{id}/approve` | `approve_action()` |

The OpenAPI document exposed by FastAPI at `/docs` is the executable API reference for the deployed runtime.

## Security boundary

The SDK cannot grant authority. It only submits requests. Server-side identity, policy, risk, approval and execution remain authoritative. Applications must never assume that a client-side `decision` is sufficient permission to perform an external side effect.

## Compatibility policy

- `sdk/python` follows semantic-versioning intent beginning at `0.1.x`.
- New optional response fields may be added without breaking consumers.
- Existing fields should not be removed during `0.x` without a migration note.
- Breaking API changes must update the integration document and SDK tests together.

## Why this boundary exists

A reusable AIOS needs a small contract that external developers can depend on without understanding the entire repository. Keeping the SDK thin and the security model server-authoritative allows ArchOS internals to evolve while preserving a meaningful integration surface.
