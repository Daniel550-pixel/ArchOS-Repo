# ArchOS Architecture

ArchOS is an early-stage AI operating-system-style architecture combining an experience layer, J.A.R.V.I.S. orchestration, a world-model runtime, simulation and causal reasoning, governance, and a dedicated trust/security plane.

## High-level model

```text
                           ARCHOS
                              |
                +-------------+-------------+
                |                           |
            ULTRON                         JARVIS
       human experience              cognitive control
                |                           |
                +-------------+-------------+
                              |
                    INTELLIGENCE FABRIC
                              |
             +----------------+----------------+
             |                                 |
         WORLD MODEL                   CLAUDE AGENT FABRIC
             |                                 |
             +----------------+----------------+
                              |
                    CAUSAL / SIMULATION
                              |
             +----------------+----------------+
             |                                 |
            IRIS                         AIOS SECURE
      trust and integrity              defensive plane
             |                                 |
             +----------------+----------------+
                              |
                    GOVERNED ACTIONS
                              |
                        INFRASTRUCTURE
```

## Major subsystems

### 1. ULTRON Experience Engine

The frontend is organized around reusable experience modules. ULTRON is the primary human-facing shell, with motion, form, multimodal interaction, neural-field visuals, and the Intelligence Graph. God's Eye View is treated as the spatial intelligence surface rather than a replacement for the shell.

### 2. J.A.R.V.I.S. orchestration

J.A.R.V.I.S. coordinates explicit capability contracts and routes work to specialized agents. The intended multi-model roles are architect, researcher, analyst, specialist, critic, simulator, and synthesizer. Provider-specific model calls remain behind runtime adapters.

### 3. World Model and reasoning

World-model services represent entities, relationships, state, evidence, events, and temporal context. Causal and simulation services provide explanation and what-if analysis. Reality levels remain explicit: observed, inferred, predicted, simulated, or fallback.

### 4. Intelligence Graph

The Intelligence Graph is the explainability and observability surface for agent relationships. It should show which agents, evidence paths, trust signals, and policy boundaries contributed to a result without turning telemetry into execution authority.

### 5. IRIS — International Reality Integrity Platform

IRIS is ArchOS's trust plane. Its first domain contract covers hardware, operating system, identity, network, data, reality/provenance, and AI-security signals. Each normalized signal contains a score, confidence, provenance, timestamp, and optional metadata. A deterministic engine aggregates signals into a point-in-time integrity snapshot.

IRIS is a measurement system, not a claim that a score proves objective truth. Model-based correlation can augment the measurement later, but the base calculation remains deterministic and auditable.

### 6. AIOS Secure

AIOS Secure is the defensive infrastructure layer around ArchOS and its agent fabric.

- **SecureAuth** — identity and authorization boundaries.
- **SecureVault** — secret and key lifecycle boundaries.
- **AgentShield** — agent permissions, tool policy, isolation, and execution controls.
- **SecureMesh** — authenticated service-to-service communication.
- **ThreatBrain** — detection, correlation, and response recommendations.

AIOS Secure does not grant an agent authority merely because a model recommends an action. Consequential execution remains behind policy and action-gating controls.

### 7. Governance

Security-sensitive execution uses explicit identity, risk, capability, verification, and action-decision boundaries. High-impact actions can require human approval. Realtime telemetry is informational and must not become an implicit control channel.

### 8. Infrastructure

The repository includes backend services, API layers, connectors, Docker, CI workflows, environment configuration, integrity checks, and verification scripts.

## Current maturity

ArchOS is **early-stage**. The architecture is broad and actively implemented, but the project does not claim production-critical status or large-scale adoption.

## Design principles

- Modular boundaries should be explicit and testable.
- Multimodal input converges into deterministic application commands.
- AI-generated actions pass through policy and authorization controls.
- Security-sensitive components fail closed where practical.
- Observed, inferred, predicted, and simulated states are never silently conflated.
- Trust measurements remain auditable and provider-independent.
- Model providers remain replaceable behind adapters.
- Secrets never belong in source control.
- Resource ownership and cleanup must be explicit.
- Documentation distinguishes implemented functionality from architectural intent.
