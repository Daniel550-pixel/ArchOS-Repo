# ULTRON / ArchOS Module System

ArchOS uses a modular AIOS model: the World Model and orchestration runtime are the core, while higher-order intelligence surfaces attach as governed capabilities.

## Flagship modules

| Module | Purpose | Boundary |
|---|---|---|
| Agent Fabric | Specialist routing, delegation and verification | Approval-aware |
| World Model | Spatial/temporal state and entity relationships | Read-first |
| Scenario Lab | Counterfactual and what-if simulation | Isolated state |
| Evidence Vault | Provenance, corroboration and chain integrity | Immutable evidence |
| Sovereign Memory | Durable context and retention policy | Explicit access |
| Autonomy Queue | Long-running workflows | Checkpoints + approval |
| System Pulse | Runtime observability | Read-only |
| Extension Mesh | Add-on and connector surface | Capability-gated |
| Causal Explorer | Causal graphs and intervention paths | Read-only |
| Decision Theater | Evidence-backed decision comparison | Read-only |
| Reality Lens | Vision, voice, gesture and spatial fusion | Permissioned input |
| Mission Replay | Temporal forensic replay | Read-only |

## Design principle

A module may expose an experience before its backend implementation is complete, but the UI must not fabricate live operational claims. `LIVE`, `READY`, and `GUARDED` describe the declared capability state, while backend health remains authoritative.

## Extension model

Future add-ons should register:

1. stable module ID
2. human-readable capability
3. required permissions
4. risk class
5. approval requirement
6. input/output contract
7. observability hooks
8. rollback semantics when actions mutate state

The extension surface must never bypass identity, policy, verification, audit, or action-gating controls.

## Experience model

The One World interface is the spatial canvas. The Command Deck is the dense systems-control surface. This separation keeps the primary experience cinematic while making advanced controls discoverable without turning the world view into a conventional dashboard.
