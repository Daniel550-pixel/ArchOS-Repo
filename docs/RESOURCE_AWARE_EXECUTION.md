# Resource-Aware Execution

## Purpose

ArchOS should treat compute, memory, storage bandwidth, latency, and model residency as execution resources rather than implicit assumptions. This document defines the architectural pattern adopted from the resource-aware inference techniques studied in the Kimi K3 in C project.

ArchOS does **not** copy or embed that implementation. The goal is to generalize the engineering principle into the AIOS/JARVIS runtime.

## Core principle

> Available memory is a performance budget, not a binary prerequisite.

A capable workload should be represented by an execution profile and matched against the resources available to the runtime.

```text
Intent
  |
  v
Workload Profile
  |
  +--> memory requirement
  +--> compute requirement
  +--> storage bandwidth
  +--> latency target
  +--> context/state size
  +--> residency preference
  |
  v
Resource Planner
  |
  +--> resident execution
  +--> partial residency
  +--> streamed execution
  +--> remote execution
  +--> reduced-capability fallback
  |
  v
Policy / Authorization
  |
  v
Execution
  |
  v
Telemetry + Replay
```

## Runtime contract

The planner must return an explicit strategy. It must not silently substitute an incompatible model, tool, or execution mode.

A strategy should contain at least:

- `mode`: `resident | partial | streamed | remote | fallback`
- `memoryBudgetBytes`
- `latencyTargetMs`
- `estimatedWorkingSetBytes`
- `requiredCapabilities`
- `selectedResourceClass`
- `reason`

If no valid strategy satisfies policy and resource constraints, execution fails closed with a structured reason.

## Cache and residency model

Large reusable resources should support bounded residency and eviction rather than assuming everything can remain resident.

```text
Resource Registry
      |
      +--> hot / resident
      +--> warm / cached
      +--> cold / persistent
      |
      v
Bounded Cache
      |
      +--> admission policy
      +--> LRU/LFU-style eviction
      +--> size accounting
      +--> telemetry
```

This pattern applies beyond model weights: agent packages, embeddings, world-model tiles, simulation assets, tool metadata, and other expensive resources can use the same abstraction.

## Security requirements

Resource-aware execution must not become an authority bypass.

1. Resource planning occurs before execution.
2. Policy remains authoritative over the selected execution mode.
3. Untrusted resources are bounds-checked before allocation or decoding.
4. Resource limits are explicit and enforceable.
5. Fallbacks must be declared, not silently substituted.
6. Execution decisions are recorded for observability and replay.

## ArchOS integration points

### AIOS/JARVIS

Owns workload profiling, resource planning, strategy selection, and execution-state reporting.

### Agent runtime

Provides capability requirements and estimated resource envelopes for agent tasks.

### Model runtime

Provides model metadata, residency requirements, supported execution modes, and estimated working-set size.

### Memory subsystem

Provides bounded caches, eviction, residency accounting, and lifecycle management.

### ULTRON

Visualizes resource pressure, selected execution mode, residency, latency, and fallback state. ULTRON does not choose or authorize execution.

### Replay

Records the workload profile, resource snapshot, selected strategy, policy result, and execution outcome so a run can be reconstructed.

## Verification requirements

Resource-aware execution must be tested at explicit budget boundaries:

- sufficient resources;
- exact resource boundary;
- insufficient memory;
- insufficient compute;
- unavailable storage/streaming path;
- invalid capability request;
- policy denial;
- fallback available;
- fallback unavailable.

The test oracle should verify the selected strategy and failure reason, not merely that execution returned a value.

## What ArchOS adopts from the study

- bounded resource budgets;
- streaming as a first-class execution mode;
- explicit residency decisions;
- cache/eviction accounting;
- strict configuration validation;
- deterministic verification;
- fail-closed behavior for invalid configurations;
- performance measurements tied to resource budgets.

## What ArchOS does not adopt

- a direct copy of the Kimi K3 implementation;
- model-specific assumptions in the core runtime;
- a requirement for C99;
- hard-coded Kimi architecture details;
- replacing ArchOS's existing governance or execution contracts.
