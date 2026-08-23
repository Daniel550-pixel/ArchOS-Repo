# ArchOS

> **An early-stage open-source AIOS / JARVIS-style software architecture for multimodal intelligence, reusable experiences, world-model services, simulation, and governed agent execution.**

ArchOS is being developed as a modular AI operating-system-style platform. The repository combines backend orchestration and intelligence services with a multimodal 3D experience layer. The project is intentionally transparent about its maturity: it is early-stage, actively developed, and does **not** currently claim large-scale adoption or production-critical status.

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
- **Public Python SDK** for integrating with JARVIS and governed-action APIs

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

## Current experience: Motion / Form

The current flagship experience module is a gesture-controlled cinematic 3D transformation interface built with React, TypeScript, Vite, Tailwind CSS, Three.js, and MediaPipe Tasks Vision.

It demonstrates the Experience Engine pattern: a reusable experience runs beneath the broader AIOS/JARVIS architecture instead of replacing it.

### Unified command interface

Voice, vision gestures, keyboard, mouse wheel, touch, and API events converge on a unified command dispatcher.

```ts
commandBus.dispatch(
  { type: 'OPEN_EXPERIENCE', payload: { id: 'kinetic-gt' } },
  'voice'
);

commandBus.dispatch(
  { type: 'SET_PROGRESS', payload: { value: 0.5 } },
  'voice'
);

commandBus.dispatch({ type: 'CLOSE_EXPERIENCE' }, 'gesture');
```

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

## Configuration and secrets

Use `.env.example` as the configuration reference. **Never commit real API keys, passwords, tokens, private keys, or other credentials.**

The repository's `.gitignore` excludes environment files while explicitly retaining `.env.example` as a safe template.

## Open-source project status

ArchOS is MIT licensed and publicly developed. It is an early-stage project, so its current adoption and contributor base are limited. The project roadmap focuses first on reproducibility, automated verification, security, stable AIOS/JARVIS interfaces, world-model contracts, multimodal experience modules, reusable integration surfaces, and an organically growing contributor ecosystem.

See [`ROADMAP.md`](ROADMAP.md) for the current direction.

## Contributing

Contributions are welcome when they improve correctness, security, maintainability, accessibility, performance, documentation, or architectural clarity.

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Security vulnerabilities should be reported according to [`SECURITY.md`](SECURITY.md), not through public issues.

## License

ArchOS is licensed under the [MIT License](LICENSE).

## Maintainer

**Daniel550-pixel** — primary project maintainer.
