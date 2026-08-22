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
- **Symptom:** Edge geometry was regenerated and replaced when topology changed.
- **Impact:** Avoidable garbage-collection pressure and frame-time spikes.
- **Resolution:** The renderer now allocates one fixed-capacity Float32 GPU buffer and reuses it across frames.

### 007 — Missing bounded graph growth
- **Symptom:** Entity relationships could grow without a strict per-node edge budget.
- **Impact:** Potential quadratic graph/render workload.
- **Resolution:** Added explicit per-node degree accounting and bounded spatial-edge insertion; authoritative core-to-module links remain exempt so every module stays connected to TON 618.

### 008 — Missing explicit LOD hierarchy
- **Symptom:** World Model entities did not have a consistent rendering-density policy.
- **Impact:** Too much geometry at distance and wasted GPU work.
- **Resolution:** Full/reduced/point LOD tiers are established around camera distance and focus.

### 009 — Central-core integration gap
- **Symptom:** The TON 618 visual core was not treated as the authoritative spatial anchor for all modules.
- **Impact:** UI could look connected without the runtime actually expressing those relationships.
- **Resolution:** Core/module relationships are represented in the spatial graph and renderer.

### 010 — Whole-object frustum culling was insufficient
- **Symptom:** The renderer's `frustumCulled` flag operated on the complete line object, not individual spatial edges.
- **Impact:** Off-screen graph segments could remain in the GPU submission when the living field was only partially visible.
- **Resolution:** Added per-edge camera-frustum filtering plus LOD pruning before draw-range submission.

### 011 — Edge buffer capacity was allocation-driven
- **Symptom:** Buffer capacity followed current edge count, causing repeated typed-array allocations as topology changed.
- **Impact:** Unnecessary allocation churn during graph rebuilds.
- **Resolution:** Fixed-capacity typed buffer is allocated once and reused with `setDrawRange`.

### 012 — Snapshot allocation churn
- **Symptom:** `SpatialEngine.tick()` reconstructed node/edge arrays and a snapshot object on every render frame.
- **Impact:** Avoidable JavaScript allocation and garbage-collection pressure directly on the 60 FPS hot path.
- **Resolution:** Snapshot arrays, metrics, and snapshot object are now persistent and updated in place; topology arrays are rebuilt only when topology changes.

### 013 — Per-frame module position allocation
- **Symptom:** Every spatial tick allocated a new `THREE.Vector3` for each animated module.
- **Impact:** Repeated short-lived allocations on the render hot path.
- **Resolution:** Added `modulePositionAtTimeInto()` and a reusable module-position scratch vector.

### 014 — Reusable entity synchronization state
- **Symptom:** Entity synchronization allocated a new `Set` on every tick.
- **Impact:** Avoidable GC pressure proportional to frame rate.
- **Resolution:** Reused a persistent entity-ID set and persistent spatial-index entry buffer.

### 015 — Docker Compose backend drift
- **Symptom:** Compose installed only a minimal subset of Python packages at container startup and launched `main:app --reload` instead of the authoritative backend runtime.
- **Impact:** Local deployment could diverge materially from CI/production and could fail when required backend modules were imported.
- **Resolution:** Compose now builds the canonical backend image, launches `app.main:app`, adds PostgreSQL, uses health-gated dependencies, and removes development reload behavior.

### 016 — Frontend API configuration was runtime-only
- **Symptom:** `VITE_API_URL` was supplied as a container environment variable after the static Vite bundle had already been built.
- **Impact:** The value could not reliably reach client code in the generated frontend.
- **Resolution:** API configuration is now a Docker build argument/environment variable at Vite build time; Compose uses the canonical `/api/v1` reverse-proxy path.

### 017 — Root and canonical frontend Docker builds diverged
- **Symptom:** The root `Dockerfile` and canonical `docker/Dockerfile.frontend` used different build assumptions and Nginx configurations.
- **Impact:** `docker build .` and Compose could produce materially different frontend containers.
- **Resolution:** Root and canonical frontend images now use the same build/runtime contract and canonical Nginx configuration.

### 018 — CI did not execute on the active feature branch
- **Symptom:** Push validation was restricted to `main` and `develop` while the spatial runtime was being developed on `feat/spatial-runtime-ton618`.
- **Impact:** Runtime changes could be pushed without automatic repository validation.
- **Resolution:** CI now runs on every branch push and additionally executes web-app, governance, A3, A4, TypeScript, build, backend, OpenAPI, and route validation.

### 019 — CI dependency-install fallback masked package-manager state
- **Symptom:** `npm ci || npm install` silently fell back because the repository carries `bun.lock` rather than a committed npm lockfile.
- **Impact:** Dependency reproducibility was obscured and CI could behave differently from container builds.
- **Resolution:** CI now uses one explicit installation path (`npm install --no-audit --no-fund`) consistent with the active package manifest/container build contract rather than masking a failed `npm ci`.

### 020 — Graph topology churn recreated stable edge objects
- **Symptom:** Every graph cadence cleared and recreated the complete edge map, even when the topology had not changed.
- **Impact:** Stable graph frames still forced snapshot-array refreshes and edge object allocation.
- **Resolution:** Graph rebuilds now retain stable edge objects, update only strength/type, and delete only stale edges; snapshot topology is marked dirty only when node/edge membership changes.

## Current target

`World Model → Spatial Runtime → TON 618 Core → Module Graph → LOD/Culling → GPU Renderer`

The runtime must preserve this as a single coherent spatial model rather than layering independent visualizations over one another.

## Remaining engineering queue

1. Typed-array entity storage for hot-path spatial data.
2. Cluster-level LOD and visibility aggregation.
3. Incremental graph updates instead of full rebuilds where possible.
4. GPU instancing for repeated module/entity visual primitives.
5. Frame-time instrumentation and adaptive quality scaling.
6. Deterministic spatial simulation for reproducible debugging.
7. Automated runtime performance benchmarks, including 4K/60 FPS targets.
8. End-to-end production deployment validation after CI completes successfully.

## Scan policy

The repository is treated as one system: frontend, spatial runtime, renderer, backend, CI, Docker, and deployment configuration are audited together. An issue is marked fixed only after the corresponding source/configuration change is committed; runtime/production claims remain pending until automated validation confirms them.
