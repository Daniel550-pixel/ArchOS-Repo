# ArchOS Integration Contract

ArchOS is intended to be consumed as a platform as well as run as a complete application. This document defines the first public integration boundary.

## Stable boundary

External applications should integrate through the HTTP API or the Python SDK. They should not import private backend modules such as governance internals, runtime bridges, database implementations, or Action Gate classes directly.

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
        ├── World Model reads
        └── Execution
```

## Current capabilities

| Capability | Endpoint | SDK |
|---|---|---|
| Runtime health | `GET /api/v1/health/runtime` | `health()` |
| JARVIS request | `POST /api/v1/jarvis/ask` | `ask()` |
| World Model entity query | `GET /api/v1/world-model/query/{entity_id}` | `query_entity()` |
| Governed action submission | `POST /api/v1/governance/actions` | `submit_action()` |
| Governed action approval | `POST /api/v1/governance/actions/{id}/approve` | `approve_action()` |

### World Model contract

`query_entity()` is a read-only integration surface over the authoritative World Model. Consumers may provide:

- `at` for a point-in-time query;
- `observation_start` and `observation_end` for an observation window;
- `X-Request-Id` for caller-side correlation.

The response preserves the entity, observations, observation count, effective confidence, and the raw server response. Consumers must treat server-provided confidence and provenance as data, not as permission to execute an external side effect.

### Governance contract

External applications submit **intent**, not authority. A governed action is evaluated against server-side identity, policy and risk controls. Consequential and high-impact actions can enter an approval state. Only the server-side governance path can approve an action.

The Python SDK deliberately does not expose the private `ActionGate` implementation as a client-side execution primitive. This keeps the security boundary authoritative on the ArchOS server.

The OpenAPI document exposed by FastAPI at `/docs` is the executable API reference for the deployed runtime.

## Security boundary

The SDK cannot grant authority. It only submits requests. Server-side identity, policy, risk, approval and execution remain authoritative. Applications must never assume that a client-side `decision` is sufficient permission to perform an external side effect.

## Compatibility policy

- `sdk/python` follows semantic-versioning intent beginning at `0.1.x`.
- New optional response fields may be added without breaking consumers.
- Existing fields should not be removed during `0.x` without a migration note.
- Breaking API changes must update the integration document and SDK tests together.
- Internal backend modules are not part of the public compatibility contract.

## Why this boundary exists

A reusable AIOS needs a small contract that external developers can depend on without understanding the entire repository. Keeping the SDK thin and the security model server-authoritative allows ArchOS internals to evolve while preserving a meaningful integration surface.
