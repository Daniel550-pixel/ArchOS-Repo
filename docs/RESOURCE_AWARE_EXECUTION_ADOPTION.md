# Resource-Aware Execution Adoption Record

**Status:** Adopted as an architectural direction for Phase 7.

## Source pattern studied

The external Kimi K3 in C project demonstrates resource-aware inference through compressed representations, bounded residency, streaming, explicit memory budgets, strict validation, and deterministic verification. ArchOS uses these as general engineering patterns rather than importing model-specific implementation details.

## Decision matrix

| Pattern | ArchOS decision | Target subsystem |
| --- | --- | --- |
| Memory ladder | Adopt | AIOS resource planner |
| Streaming | Adopt | Model/resource runtime |
| Bounded cache | Adopt | Memory subsystem |
| Explicit residency | Adopt | Runtime scheduler |
| Strict configuration validation | Adopt | Contracts/policy |
| Fail-closed invalid configuration | Adopt | Execution gate |
| Deterministic verification | Adopt | CI + replay |
| Performance/resource telemetry | Adopt | Observability + ULTRON |
| Model-specific K3 kernels | Do not adopt | N/A |
| C99 implementation | Do not adopt | N/A |
| K3-specific tensor layout | Do not adopt | N/A |

## Architectural consequence

AIOS should eventually expose a resource-planning boundary between intent resolution and execution. The boundary must be typed, observable, policy-controlled, and replayable.

```text
Intent
  -> Plan
  -> Resource Profile
  -> Resource Strategy
  -> Policy Decision
  -> Execution
  -> Trace
```

This is intentionally a design contract first. Phase 7 implementation should introduce the runtime primitives only after their interfaces and verification requirements are established.
