# ArchOS

> **An early-stage open-source AIOS / JARVIS-style software architecture for multimodal intelligence, reusable experiences, world-model services, simulation, governed agent execution, and spatial intelligence.**

ArchOS is an actively developed experimental AI operating-system architecture. It combines a backend intelligence runtime with a multimodal experience layer, governed action execution, world-state services, causal/simulation primitives, and a 3D interaction surface.

The project is intentionally transparent about maturity: **ArchOS is early-stage software, not a production-critical national system, and does not claim large-scale adoption.** The goal is to build and verify the architectural foundations incrementally.

## Why ArchOS exists

Most AI applications expose a model through a chat box. ArchOS explores a different abstraction: an operating-system-style runtime where user intent can be decomposed into governed work, specialist agents can contribute evidence and reasoning, world state can persist across interactions, and the resulting intelligence can be surfaced through spatial and interactive experiences.

The long-term architecture is:

```text
                              ARCHOS
                                 │
                              JARVIS
                                 │
                        AGENT / MODEL FABRIC
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
          Research            Reasoning           Coding
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 │
                            WORLD STATE
                                 │
                    ┌────────────┴────────────┐
                    │                         │
               CAUSAL FABRIC             SIMULATION
                    │                         │
                    └────────────┬────────────┘
                                 │
                       SPATIAL INTELLIGENCE
                                 │
                          GOD'S EYE / UI
```

This is an architectural direction, not a claim that every box above is already production-complete.

## What is currently here

- JARVIS-style agent orchestration and specialist agents
- Agent swarm and world-model runtime components
- Action-gating and governance-oriented middleware
- World-model, causal-graph, scenario, and simulation APIs
- React + TypeScript experience layer
- Three.js / React Three Fiber 3D rendering
- MediaPipe-based hand-vision interaction
- Voice, vision, gesture, keyboard, mouse, touch, and API command inputs
- Docker and GitHub Actions infrastructure
- Project-specific linting, E2E, governance, and architecture verification commands
- A public Python SDK for integrating with JARVIS and governed-action APIs
- An adaptive experience/HUD layer for surfacing live intelligence-session state

## Claude's role in the architecture

Claude is intended to be a **cognitive/model layer inside ArchOS, not the operating system itself**.

The current design is provider-agnostic at the runtime boundary so that orchestration, governance, memory, world state, and UI do not become hard-coded to a single model vendor. Where Claude is used, the intended workload is agentic development and reasoning such as:

```text
User objective
     │
     ▼
JARVIS intent / task decomposition
     │
     ├── Architect / planner
     ├── Research / evidence agent
     ├── Domain specialist agents
     ├── Analyst / synthesizer
     ├── Critic / verifier
     └── Coding / implementation agent
     │
     ▼
Governance + verification
     │
     ▼
World state / causal state / simulation
     │
     ▼
Human-facing experience
```

This separation is deliberate: models provide reasoning capability; ArchOS owns orchestration, state, policy, execution boundaries, and experience composition.

See [`docs/CLAUDE_AGENT_FABRIC.md`](docs/CLAUDE_AGENT_FABRIC.md) for the current design, intended workloads, and development rationale.

## Spatial intelligence and God's Eye

ArchOS is evolving toward a spatial intelligence experience in which the user can inspect **what is happening, why it is happening, and which agents/evidence contributed to the conclusion**.

The intended relationship is:

```text
WORLD MODEL
    │
    ├── entity / relationship state
    ├── temporal state
    ├── evidence
    └── scenario state
            │
            ▼
     INTELLIGENCE GRAPH
            │
            ├── causal relationships
            ├── evidence paths
            ├── agent activity
            └── confidence / verification
            │
            ▼
       GOD'S EYE VIEW
```

God's Eye is therefore treated as a **spatial intelligence surface**, rather than as a standalone decorative 3D map. The integration is being developed incrementally and must remain consistent with the repository's licensing and attribution requirements.

The Intelligence Fabric now exposes three views over the same graph contract:

- **Agent Flow** — orchestration, delegation, critique, simulation, and synthesis.
- **Causal Fabric** — relationships connecting world state and reasoning toward a conclusion.
- **Evidence Path** — provenance-oriented paths from research and evidence into analysis.

Selecting a node exposes its role, status, confidence metadata, provenance, and relationship counts. Confidence is explanatory metadata, not proof; evidence and causal state remain distinct from model-generated reasoning.

## Architecture

```text
                         ARCHOS
                           │
              ┌────────────┴────────────┐
              │                         │
        EXPERIENCE ENGINE          INTELLIGENCE RUNTIME
              │                         │
       Motion / Form             JARVIS Orchestrator
       3D Experiences            Specialist Agents
       Voice / Vision            Agent Swarm
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

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the detailed architectural model and boundaries.

## Public integration surface

ArchOS is being developed as a platform, not only as a standalone UI. The first public integration surface is the Python SDK under [`sdk/python`](sdk/python), which provides a thin typed client for the JARVIS and governed-action APIs.

```python
from archos_sdk import ArchOSClient

with ArchOSClient("http://localhost:8000", token="YOUR_TOKEN") as archos:
    health = archos.health()
    result = archos.ask("Inspect the current runtime health and summarize anomalies.")
    decision = archos.submit_action(
        actor="operator",
        agent="ops-agent",
        target="runtime",
        requested_operation="read_health",
    )
```

The SDK intentionally does **not** bypass server-side identity, policy, risk, approval, audit, or execution controls. See [`sdk/python/README.md`](sdk/python/README.md) and [`docs/INTEGRATION.md`](docs/INTEGRATION.md).

## Current flagship experience: Motion / Form

The current flagship experience module is a gesture-controlled cinematic 3D transformation interface built with React, TypeScript, Vite, Tailwind CSS, Three.js, and MediaPipe Tasks Vision.

It demonstrates the Experience Engine pattern: a reusable experience runs beneath the broader AIOS/JARVIS architecture instead of replacing it.

### Unified command interface

Voice, vision gestures, keyboard, mouse wheel, touch, and API events converge on a unified command dispatcher.

### Optical gesture interaction

The vision pipeline uses MediaPipe hand landmarks with normalized hand scale, pinch-distance mapping, exponential smoothing, palm-hold activation, and trigger cooldowns. The current implementation maps normalized hand geometry to an exploded-view timeline.

### Fallback and accessibility

When camera/vision input is unavailable, the experience provides slider, mouse/trackpad, keyboard, and layer-selection controls. Reduced-motion behavior follows `prefers-reduced-motion`.

### Resource lifecycle

Camera tracks, MediaPipe/WebAssembly resources, animation loops, and DOM listeners are explicitly cleaned up when the experience is unmounted or gesture mode is disabled.

## Quick start

Requirements depend on the active backend/frontend paths. For the current Node-based experience:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm start
```

For the backend, install `backend/requirements.txt` and run the authoritative FastAPI application exposed through `backend.main:app`.

## Verification

The repository includes explicit verification entry points for the web application, governance, architecture/fabric layers, memory, temporal control, world state, simulation, mission control, and ULTRON experience behavior. Run the checks relevant to the component you change before considering an implementation complete.

```bash
npm run lint
npm run test:webapp
npm run test:governance
npm run test:a3
npm run test:a4
```

Additional focused verification commands are listed in `package.json`.

## Configuration and secrets

Use `.env.example` as the configuration reference. **Never commit real API keys, passwords, tokens, private keys, or other credentials.**

The repository's `.gitignore` excludes environment files while explicitly retaining `.env.example` as a safe template.

## Open-source project status

ArchOS is MIT licensed and publicly developed. It is an early-stage project with a limited contributor base. The roadmap prioritizes reproducibility, automated verification, security, stable AIOS/JARVIS interfaces, world-model contracts, multimodal experiences, reusable integration surfaces, and an organically growing contributor ecosystem.

See [`ROADMAP.md`](ROADMAP.md) for the current direction.

## Contributing

Contributions are welcome when they improve correctness, security, maintainability, accessibility, performance, documentation, or architectural clarity.

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Security vulnerabilities should be reported according to [`SECURITY.md`](SECURITY.md), not through public issues.

## License

ArchOS is licensed under the [MIT License](LICENSE).

## Maintainer

**Daniel550-pixel** — primary project maintainer.
