# ArchOS Architecture

ArchOS is an early-stage open-source AI operating-system-style architecture. The repository combines an AIOS/JARVIS orchestration layer with reusable experiences, multimodal interaction, world-model services, simulation, governance controls, and infrastructure.

## High-level model

```text
                         ARCHOS
                           │
              ┌────────────┴────────────┐
              │                         │
        EXPERIENCE LAYER          INTELLIGENCE RUNTIME
              │                         │
       Motion / Form             JARVIS Orchestrator
       3D Experiences            Specialist Agents
       Voice / Vision            Agent Fabric
       Gesture Input             World Model Runtime
              │                         │
              └────────────┬────────────┘
                           │
                    UNIFIED COMMAND BUS
                           │
              ┌────────────┼────────────┐
              │            │            │
           APIs       Simulation    World Model
              │            │            │
              └────────────┼────────────┘
                           │
                 Governance / Security
                           │
                     Infrastructure
```

## Major subsystems

### 1. Experience Engine

The frontend is designed around reusable experience modules rather than a single monolithic interface. The current Motion / Form experience demonstrates the pattern with React, TypeScript, Vite, Tailwind CSS, Three.js, and multimodal input. ULTRON is the cinematic experience shell for surfacing intelligence-session state.

### 2. Multimodal interaction

Voice, vision gestures, keyboard, mouse, touch, and API events converge through a unified command interface. The Motion / Form module uses MediaPipe Tasks Vision for hand-landmark tracking and normalized gesture interaction.

### 3. JARVIS orchestration

The backend contains an orchestration layer responsible for coordinating agents and routing work to specialized capabilities. The repository includes a JARVIS orchestrator, specialist agents, swarm infrastructure, action gating, and world-model runtime components.

### 4. World model and reasoning services

The backend exposes world-model, causal-graph, scenario-planning, scenario-execution, scenario-intelligence, and simulation APIs. These services provide the basis for state representation, analysis, and what-if workflows.

### 5. Explainable Intelligence Fabric

The Intelligence Fabric is the observable bridge between agent reasoning and the human-facing experience. It separates three views over the same underlying graph:

```text
AGENT FLOW       CAUSAL FABRIC       EVIDENCE PATH
    │                 │                   │
    └─────────────────┼───────────────────┘
                      ▼
               WORLD / GRAPH STATE
                      │
                      ▼
                 ULTRON / UI
```

The current `ArchosIntelligenceGraph` experience provides:

- role-aware agent nodes for orchestration, planning, research, analysis, specialization, critique, simulation, synthesis, world state, and evidence;
- active/inactive link visibility;
- three analytical modes: agent flow, causal fabric, and evidence path;
- node-level confidence and provenance metadata;
- upstream/downstream relationship inspection;
- animated active-link telemetry for live visual feedback;
- an inspector that distinguishes model reasoning from evidence and governed execution.

The component is intentionally data-driven: production adapters can supply real runtime nodes and edges without changing the visual contract. Model output is not itself treated as causal truth; causal relationships remain a separate ArchOS representation that can be verified, challenged, or simulated.

### 6. Governance and action control

Security-sensitive execution is designed around explicit controls rather than unrestricted model output. The architecture includes action-gating and middleware components for identity, risk, routing, and governance-related behavior.

### 7. Infrastructure

The repository includes Docker, CI workflows, environment configuration, backend services, API layers, connectors, and project-specific verification scripts.

## Current maturity

ArchOS is **early-stage**. The architecture is broad and actively implemented, but the project does not currently claim large-scale adoption, a large external contributor community, or production-critical status. These are future goals, not current facts.

## Design principles

- Modular over monolithic where boundaries are meaningful.
- Explicit interfaces between experiences, orchestration, and infrastructure.
- Multimodal input should converge into deterministic application commands.
- AI-generated actions should pass through policy and authorization controls.
- Security-sensitive components should fail closed where practical.
- Reasoning, evidence, and causal state must remain distinguishable.
- Confidence is metadata, not proof.
- Provenance should follow evidence through the reasoning pipeline.
- Resource ownership and cleanup must be explicit, especially for camera, WebAssembly, animation loops, and event listeners.
- Documentation should distinguish implemented functionality from architectural intent.

## Related documentation

- `README.md` — current Motion / Form experience and development instructions.
- `docs/CLAUDE_AGENT_FABRIC.md` — multi-model agent roles and provider boundary.
- `CONTRIBUTING.md` — contribution workflow and engineering expectations.
- `SECURITY.md` — security reporting and security principles.
- `LICENSE` — MIT license.
