# ARCHOS Authority Map

Status: Phase A discovery artifact
Branch: feature/archos-real-consensus-architecture

This is the mechanical decision table for subsequent migrations. It records the
as-built structure observed in the repository, not the aspirational architecture.

## Authority table

| Concept | Current authority | Observed competing implementation / projection | Consumer / reachability evidence | Verdict | Migration action |
|---|---|---|---|---|---|
| Agent base execution | backend/agents/base.py | Specialist agents | Specialist agents inherit the base execution lifecycle | AUTHORITATIVE | Keep; contract-test |
| Agent task/result primitives | backend/agents/base.py | app/api/agents.py transport task record | API layer maintains a separate task projection | AUTHORITATIVE | Keep execution contract; prevent API state from becoming second engine |
| Runtime adapter contract | backend/agents/runtime_adapter.py | Provider-specific adapters | Ox Alpha adapter and in-process adapter implement the boundary | AUTHORITATIVE | Keep; adapter contract tests |
| Runtime registry | backend/agents/runtime_registry.py | Swarm agent catalog | Startup binding consumes registry/runtime bindings | AUTHORITATIVE | Keep; reconcile startup bindings |
| Executable agent catalog | backend/agents/swarm.py | API registration metadata | Canonical swarm is bound during application lifespan | AUTHORITATIVE | Keep; remove duplicated routing logic |
| Consensus position contract | backend/agents/consensus_contracts.py | LaneAssessment.position in consensus.py/swarm | Legacy swarm still constructs/consumes the old shape | CONTESTED | Introduce typed Position at boundary; delete legacy position |
| Consensus artifact | backend/agents/consensus_contracts.py | backend/agents/consensus.py | Hardened contract exists but legacy artifact builder remains | CONTESTED | New engine becomes authority; legacy builder deleted after caller migration |
| Consensus decision engine | backend/agents/consensus_engine.py | consensus.py + Swarm.route_reasoning_consensus() | Swarm still owns orchestration/decision behavior | CONTESTED | Delegate old public path to engine, migrate callers, then delete duplicate |
| Consensus reasoning controller | backend/agents/consensus_reasoning_agent.py | Swarm consensus route | Both contain consensus orchestration responsibilities | CONTESTED | Agent becomes thin controller over engine |
| Ox Alpha reasoning lane | backend/agents/ox_alpha_reasoning_agent.py | app.services.ox_alpha_agent_fabric | Dedicated reasoning lane exists | AUTHORITATIVE | Keep |
| Ox Alpha provider adapter | backend/agents/ox_alpha_runtime_adapter.py | Direct provider paths require audit | Dedicated adapter exists; startup selection is incomplete | AUTHORITATIVE | Bind adapter through runtime registry; audit direct calls |
| Claude reasoning lane | backend/agents/claude_reasoning_agent.py | app.services.claude_agent_fabric | Dedicated reasoning lane exists | AUTHORITATIVE | Keep; normalize result contract |
| Verification implementation | backend/agents/verification.py | API invocation path | API invokes verifier directly; downstream contract requires migration | CONTESTED | Define VerificationArtifact + single service boundary |
| Evidence ledger | backend/agents/evidence_ledger.py | Persistence/chain layers | In-process ledger is distinct from DB persistence | AUTHORITATIVE | Keep responsibilities separate |
| Evidence persistence | backend/agents/evidence_persistence.py | Evidence ledger | DB persistence is a separate concern | AUTHORITATIVE | Keep |
| Action governance | backend/agents/action_gate.py | app/services/governance_bridge.py | Bridge delegates application-facing governance | AUTHORITATIVE | ActionGate remains sole mutation authorization point |
| JARVIS runtime | backend/jarvis/runtime.py | app/services/jarvis_runtime_bridge.py | Bridge is application-facing boundary | AUTHORITATIVE | Keep runtime; keep bridge thin |
| Event fabric | app/services/event_fabric.py | Other event/logging paths | Full producer census remains open | CONTESTED | Complete producer census; designate one event contract |
| FastAPI application | backend/app/main.py | backend/main.py | backend/main.py now re-exports canonical app | AUTHORITATIVE | Keep; compatibility entrypoint only |
| API task lifecycle | backend/app/api/agents.py | AgentTask lifecycle | API task record uses string states separate from execution object | CONTESTED | Convert to projection of canonical task state |
| World-model state | backend/agents/world_model_runtime.py | backend/app/api/world_model.py + related services | Multiple layers participate | CONTESTED | Trace mutations/reads; designate one state authority |
| Frontend runtime state | src/store/archosStore.ts | src/store.ts + service-local state | Multiple state surfaces | CONTESTED | Choose one canonical store |
| Frontend runtime contracts | src/types/archosRuntimeContracts.ts | src/types/index.ts and other types | Multiple type surfaces | CONTESTED | Consolidate domain contracts |
| Cross-stack events | src/types/archosEvents.ts + backend event fabric | Transport-specific representations | Frontend/backend representations are separate | CONTESTED | Define versioned event envelope |
| Simulation | src/services/simulation/simulationEngine.ts | Backend simulation APIs/agents | Cross-stack responsibility split | CONTESTED | Define simulation authority/API boundary |
| Spatial intelligence | src/services/spatial/* | Backend spatial/world-model components | Cross-stack implementation split | CONTESTED | Designate backend/domain authority; frontend becomes projection |
| Security fabric | src/services/security/securityFabric.ts | Backend auth/keysmith/security middleware | Cross-stack security responsibilities | CONTESTED | Backend policy authority; frontend is defense-in-depth |
| Configuration | Multiple backend/frontend configuration surfaces | Environment/config modules | Full census not complete | CONTESTED | Inventory before changing |
| Memory/state | Multiple agent/runtime stores | Task/API/runtime-local state | Full census not complete | CONTESTED | Inventory before changing |

## Mechanical decision rules

### AUTHORITATIVE
Keep the implementation. New code must depend on it through its public contract.

### CONTESTED
No new implementation may be added. First trace callers and designate one authority.

### USURPER
Migrate its callers to the authority and delete the implementation.

## Critical migration queue

1. Designate consensus_engine.py as the consensus decision authority.
2. Make consensus_reasoning_agent.py a thin controller over that engine.
3. Replace live LaneAssessment construction with typed Position and LaneResult.
4. Bind Ox Alpha through OxAlphaRuntimeAdapter at canonical startup.
5. Define VerificationArtifact and one verification boundary.
6. Reconcile all execution preconditions with ActionGate.
7. Complete task/world-model/event/spatial/simulation/security/configuration/memory censuses.
8. Freeze the resulting authority map as a CI-checked baseline.

## Phase A status

PARTIAL. The deterministic census script exists at scripts/architecture_inventory.py
and CI is configured to publish architecture-inventory.json. The repository connector
does not expose a successful execution result for that new workflow on this branch,
so this table must not be described as a complete machine-generated consumer census.

The table is instead the verified architectural assessment from direct repository
inspection. The missing machine-generated census is an execution/infrastructure gap,
not evidence to invent counts.

## Phase B entry criteria

Do not begin broad replacement until:
- consensus authority is designated;
- Position, LaneResult, ConsensusArtifact, and VerificationArtifact are finalized;
- Ox Alpha startup binding uses OxAlphaRuntimeAdapter;
- all live consensus callers are enumerated;
- legacy consensus deletion is assigned to a dedicated PR;
- verification and ActionGate boundaries are explicit;
- the frozen evaluation corpus exists.
