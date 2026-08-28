# ARCHOS Authority Map

Status: Phase A discovery artifact
Branch: feature/archos-real-consensus-architecture
Rule: this document records as-built authority; it is not an aspirational architecture specification.

## Authority verdicts

| Concept | Authoritative module | Duplicates / competing paths | Verdict |
|---|---|---|---|
| Agent base contract | backend/agents/base.py | Specialist agents subclass Agent | AUTHORITATIVE |
| Agent capability / task / result primitives | backend/agents/base.py | API request schemas mirror parts of the contract | AUTHORITATIVE; API schemas are transport DTOs |
| Runtime adapter boundary | backend/agents/runtime_adapter.py | Provider-specific adapters; in-process adapter | AUTHORITATIVE |
| Runtime adapter registry | backend/agents/runtime_registry.py | Swarm remains the agent catalog | AUTHORITATIVE for runtime bindings |
| Canonical executable agent catalog | backend/agents/swarm.py | API _registry is a registration/metadata registry | AUTHORITATIVE for execution |
| Consensus typed contract | backend/agents/consensus_contracts.py | backend/agents/consensus.py defines legacy artifacts | CONTESTED |
| Consensus decision engine | backend/agents/consensus_engine.py | backend/agents/consensus.py and inline legacy logic in swarm.py | CONTESTED |
| Consensus reasoning controller | backend/agents/consensus_reasoning_agent.py | swarm.route_reasoning_consensus contains orchestration logic | CONTESTED |
| Ox Alpha reasoning lane | backend/agents/ox_alpha_reasoning_agent.py | app.services.ox_alpha_agent_fabric is provider-facing runtime | AUTHORITATIVE lane; provider boundary separate |
| Ox Alpha runtime adapter | backend/agents/ox_alpha_runtime_adapter.py | none identified | AUTHORITATIVE |
| Claude reasoning lane | backend/agents/claude_reasoning_agent.py | app.services.claude_agent_fabric is provider-facing runtime | AUTHORITATIVE lane; provider boundary separate |
| Verification agent/result verification | backend/agents/verification.py | app/api/agents.py invokes verifier directly | CONTESTED boundary; implementation appears centralized |
| Evidence ledger | backend/agents/evidence_ledger.py | evidence persistence / chain provide separate persistence responsibilities | AUTHORITATIVE for in-process evidence ledger |
| Evidence persistence | backend/agents/evidence_persistence.py | evidence ledger | AUTHORITATIVE for PostgreSQL persistence |
| Action governance / execution gate | backend/agents/action_gate.py | app/services/governance_bridge.py is an app-layer facade | AUTHORITATIVE gate; bridge is adapter |
| JARVIS runtime | backend/jarvis/runtime.py | app/services/jarvis_runtime_bridge.py | AUTHORITATIVE legacy runtime; bridge is app boundary |
| App-facing JARVIS boundary | app/services/jarvis_runtime_bridge.py | direct legacy imports must be eliminated from app layer | AUTHORITATIVE app adapter |
| Event fabric | app/services/event_fabric.py | legacy/other event mechanisms require further discovery | AUTHORITATIVE app event boundary, discovery still required |
| FastAPI application | backend/app/main.py | backend/main.py compatibility entrypoint | AUTHORITATIVE |
| Agent API task lifecycle | backend/app/api/agents.py | AgentTask in base.py is execution contract | CONTESTED: API lifecycle state is in-memory and separate from AgentTask |
| World model runtime | backend/agents/world_model_runtime.py | app/api/world_model.py and related services | CONTESTED; exact authority requires call-site census |
| Frontend runtime state | src/store/archosStore.ts | src/store.ts and service-local state | CONTESTED; call-site census required |
| Frontend runtime contracts | src/types/archosRuntimeContracts.ts | src/types/index.ts and other domain types | CONTESTED; reconcile after backend spine |
| Event contract | src/types/archosEvents.ts + backend EventFabric | multiple transport representations | CONTESTED across frontend/backend |
| Simulation engine | src/services/simulation/simulationEngine.ts | backend simulation APIs/agents | CONTESTED across frontend/backend |
| Spatial intelligence | src/services/spatial/* + backend spatial/world-model components | multiple spatial implementations | CONTESTED |
| Security fabric | src/services/security/securityFabric.ts | backend auth/keysmith/security middleware | CONTESTED across frontend/backend |

## Confirmed behavioral findings

### Execution boundary

Agent.execute() is the common base execution boundary. It converts timeout and unexpected exceptions into typed AgentResult failures instead of allowing them to escape the agent lifecycle. This is a strong existing contract and should be retained.

### Runtime binding

backend/app/main.py binds the canonical swarm during application lifespan using bind_canonical_swarm(). The generic registry currently binds agents to InProcessRuntimeAdapter. Ox Alpha has a dedicated OxAlphaRuntimeAdapter, but the startup binder does not yet select it for Ox Alpha. This is a material integration gap.

### Consensus duplication

Four consensus paths are currently present:

1. backend/agents/consensus_contracts.py — hardened typed contracts.
2. backend/agents/consensus_engine.py — hardened deterministic engine.
3. backend/agents/consensus.py — older artifact builder.
4. Swarm.route_reasoning_consensus() — legacy orchestration and LaneAssessment construction.

This is a confirmed contested concept. No new consensus implementation should be added.

### Canonical-position migration gap

The Ox Alpha lane emits a structured position, but Swarm.route_reasoning_consensus() still extracts prose-like fields into legacy LaneAssessment.position. Therefore the typed canonical position has not yet become the sole runtime path.

Claude similarly emits JSON-oriented instructions but the swarm legacy extraction still treats its synthesis text as the position.

### API task lifecycle

app/api/agents.py maintains a separate _tasks dictionary with string lifecycle states while AgentTask and AgentResult define the execution contract. This is not necessarily wrong—the API record is a transport/application lifecycle projection—but it must not become a second authoritative task state machine.

### Governance

ActionGate is the authoritative governance/execution gate. GovernanceBridge is an application adapter and should remain thin. The swarm also contains an execution precondition that blocks execution unless verification is VERIFIED; this must be reconciled with ActionGate so there is one authoritative mutation policy.

### Application entrypoint

backend/app/main.py owns the FastAPI application. backend/main.py is a compatibility entrypoint and now re-exports the canonical application object.

## Phase A unresolved discovery

The following require a complete import/call-site census before being designated:

- task lifecycle
- world-model state
- frontend/backend event contract
- spatial authority
- simulation authority
- security authority across frontend and backend
- configuration authority
- memory/state authority
- direct provider-call paths
- all duplicate enums/string states

## Non-negotiable migration rules

1. One concept gets one authoritative type.
2. Legacy shapes may be adapted, but may not become new consumers.
3. Deprecated implementations require an identified deletion PR.
4. No new consensus logic is permitted while consensus is contested.
5. Provider calls remain behind runtime/provider adapters.
6. Agents propose; governance authorizes; execution performs.
7. Verification is independent of model agreement.
8. Failed lanes never count as votes.
9. Audit events must preserve actor, task/correlation identity, and provenance.
10. Discovery findings override aspirational documentation.

## Next Phase A gate

Before Phase B is declared complete, generate the full backend import graph and class/definition consumer census, then update every CONTESTED row with concrete callers and an explicit authority verdict.
