# ArchOS Spatial Engine — Fixed Issue Log

## Purpose

This document records defects found and repaired during the TON 618 spatial-runtime iteration. It is intentionally cumulative so future iterations do not reintroduce the same failures.

## Fixed issues

### 001 — Spatial engine / renderer API drift
- **Symptom:** `SpatialEngineLayer` expected the older temporal-state API while the spatial runtime had moved to snapshot-based state.
- **Impact:** Type/runtime incompatibility between the engine and renderer.
- **Resolution:** Unified renderer consumption around the spatial snapshot contract and restored required compatibility accessors.

### 002 — Spatial hash contract mismatch
- **Symptom:** Renderer/runtime integration used methods/properties that did not match the active `SpatialHashIndex` implementation.
- **Impact:** Spatial queries and rebuild paths could fail at compile time or runtime.
- **Resolution:** Updated integration to the actual spatial-index contract.

### 003 — Activity normalization signature mismatch
- **Symptom:** `normalizedActivity()` was invoked without the required temporal context.
- **Impact:** Activity propagation could not be evaluated consistently.
- **Resolution:** All activity normalization now receives the appropriate module/time context.

### 004 — World Model entity radius assumption
- **Symptom:** Spatial rendering relied on an entity radius property that was not guaranteed by the World Model contract.
- **Impact:** Invalid geometry/LOD calculations.
- **Resolution:** Spatial radius is now explicitly derived/stored by the spatial runtime.

### 005 — Excessive render-loop computation
- **Symptom:** Spatial index and graph work competed with the frame renderer.
- **Impact:** Unnecessary CPU pressure and reduced headroom for 4K/60 FPS.
- **Resolution:** Render, spatial-index, and graph cadences are separated.

### 006 — Repeated GPU geometry allocation
- **Symptom:** Edge geometry could be regenerated unnecessarily during graph changes.
- **Impact:** Garbage collection pressure and frame-time spikes.
- **Resolution:** Persistent GPU buffers are reused and updated only when topology changes.

### 007 — Missing bounded graph growth
- **Symptom:** Entity relationships could grow without a strict per-node edge budget.
- **Impact:** Potential quadratic graph/render workload.
- **Resolution:** Edge count is bounded per node before GPU upload.

### 008 — Missing explicit LOD hierarchy
- **Symptom:** World Model entities did not have a consistent rendering-density policy.
- **Impact:** Too much geometry at distance and wasted GPU work.
- **Resolution:** Full/reduced/point LOD tiers are established around camera distance and focus.

### 009 — Central-core integration gap
- **Symptom:** The TON 618 visual core was not treated as the authoritative spatial anchor for all modules.
- **Impact:** UI could look connected without the runtime actually expressing those relationships.
- **Resolution:** Core/module relationships are represented in the spatial graph and renderer.

## Current target

`World Model → Spatial Runtime → TON 618 Core → Module Graph → LOD/Culling → GPU Renderer`

The runtime must preserve this as a single coherent spatial model rather than layering independent visualizations over one another.

## Next iteration queue

1. Typed-array entity storage for hot-path spatial data.
2. Camera-frustum culling before GPU submission.
3. Cluster-level LOD for large World Model populations.
4. Incremental graph updates instead of full rebuilds where possible.
5. GPU instancing for repeated module/entity visual primitives.
6. Frame-time instrumentation and adaptive quality scaling.
7. Deterministic spatial simulation for reproducible debugging.
8. Automated TypeScript/build validation after every runtime change.
