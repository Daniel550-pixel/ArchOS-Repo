# Claude Agent Fabric

## Purpose

ArchOS is designed to use frontier language models as cognitive components inside a larger governed runtime. Claude is one of the intended model families for agentic development and reasoning; it is not the operating system itself.

This document describes the intended Claude-facing architecture without claiming that every planned agent or integration is already production-complete.

## Why a multi-agent model architecture?

Complex ArchOS tasks benefit from decomposition, independent analysis, critique, synthesis, and verification. The goal is not to multiply model calls indiscriminately. The goal is to assign different cognitive responsibilities and preserve a traceable execution path.

```text
                         JARVIS
                           │
                    TASK DECOMPOSITION
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       ARCHITECT        RESEARCH          SPECIALIST
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                        ANALYST
                           │
                           ▼
                         CRITIC
                           │
                           ▼
                      SYNTHESIS
                           │
                           ▼
                 GOVERNANCE / VERIFY
                           │
                           ▼
                      WORLD STATE
```

## Agent roles

### Architect / Planner

Breaks a user objective into bounded tasks, identifies required tools and evidence, and proposes an execution plan.

### Research / Evidence Agent

Collects and structures relevant evidence. Outputs should retain provenance so downstream reasoning can distinguish observed facts from model-generated hypotheses.

### Domain Specialist

Performs focused reasoning within a bounded domain such as finance, infrastructure, geospatial analysis, logistics, or software engineering.

### Analyst / Synthesizer

Combines agent outputs, resolves compatible findings, identifies conflicts, and produces a candidate conclusion.

### Critic / Verifier

Attempts to falsify assumptions, detect unsupported conclusions, and identify missing evidence before an output becomes actionable.

### Coding / Implementation Agent

Assists with repository changes, tests, refactors, and implementation work. Changes remain subject to repository verification and normal engineering controls.

## JARVIS remains the control plane

Model outputs do not directly become unrestricted system actions.

```text
MODEL OUTPUT
    │
    ▼
JARVIS / POLICY BOUNDARY
    │
    ├── identity
    ├── authorization
    ├── risk / approval
    ├── audit
    └── execution policy
    │
    ▼
ACTION OR STATE UPDATE
```

This separation is a core architectural property. A model can recommend an action without possessing implicit authority to execute it.

## World-model relationship

The agent fabric consumes and updates structured ArchOS state through defined service boundaries. The World Model is intended to hold entities, relationships, temporal state, evidence, and scenario state; models provide reasoning over that state rather than replacing it with opaque conversational memory.

## Causal and simulation relationship

Reasoning can produce hypotheses and candidate relationships. The causal graph and simulation layers provide separate structures for representing relationships and exploring scenarios. A model-generated explanation should not be treated as a verified causal fact merely because a model produced it.

## God's Eye relationship

God's Eye is the spatial experience layer for inspecting relevant world state and intelligence relationships. The intended flow is:

```text
Claude / agents
      │
      ▼
JARVIS + verification
      │
      ▼
World state / evidence / relationships
      │
      ▼
Causal + spatial projection
      │
      ▼
God's Eye
```

The UI should expose provenance, confidence, and active reasoning context where available rather than presenting model output as unquestionable truth.

## Why higher-capacity Claude access matters

The practical value of higher-capacity model access for ArchOS is iteration throughput. Development can require repeated cycles of repository inspection, architectural reasoning, implementation, testing, critique, and refinement. A multi-agent workflow increases the number and variety of model interactions required for a single engineering objective.

The project therefore benefits from higher usage capacity when Claude is used for substantial repository work, while retaining a provider-agnostic runtime boundary so ArchOS is not architecturally dependent on a single vendor.

## Current vs planned

**Current:** JARVIS-style orchestration, specialist-agent concepts, world-model services, governance boundaries, verification scripts, multimodal experience infrastructure, and an adaptive intelligence surface exist in the repository.

**In development / planned:** a more complete provider abstraction for model-backed agents, explicit Claude agent-role adapters, richer evidence/provenance propagation, synchronized causal/spatial visualization, and deeper multi-agent verification loops.

Keeping these states separate is intentional. Documentation should not imply implementation maturity that the code does not support.

## Engineering principles

1. **Models are components, not authorities.**
2. **Agent outputs require provenance where evidence matters.**
3. **Actions pass through governance boundaries.**
4. **Independent critique is preferred for consequential reasoning.**
5. **Provider-specific code stays behind explicit interfaces where practical.**
6. **Tests and verification are part of the agent workflow, not an afterthought.**
7. **Human oversight remains available for consequential actions.**
