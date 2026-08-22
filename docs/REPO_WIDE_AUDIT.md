# ArchOS Repository-Wide Audit

## Active branch

`feat/spatial-runtime-ton618`

## Executed engineering passes

### Pass 1 — repository stabilization

- Snapshot allocation churn reduced in the spatial hot path.
- Per-frame module-position allocations reduced.
- Repeated entity synchronization allocations reduced.
- Stable graph edge object churn reduced.
- Per-node spatial degree enforcement corrected.
- Backend Docker Compose runtime drift corrected.
- PostgreSQL service/health dependency added to local orchestration.
- Frontend Vite API configuration moved to a build-safe path.
- Root/canonical frontend Docker build divergence corrected.
- CI feature-branch push coverage corrected.
- CI dependency-install fallback removed where it could mask package-manager state.

### Pass 2 — frame-time control

- Deterministic spatial benchmark harness added.
- `npm run bench:spatial` added.
- Frame-time adaptive quality controller added with hysteresis.
- Quality tiers: Ultra / High / Balanced / Performance.

### Pass 3 — spatial runtime foundation

- Added `SpatialRuntime`: contiguous `Float32Array` position/radius storage and `Uint8Array` activity state.
- Added allocation-light distance culling returning reusable `Uint32Array` visible IDs.
- Added stable coarse spatial cell keys for incremental cluster scheduling.
- Added `FrameQualityController` as the frame-time governor.
- Added `src/lib/spatial/index.ts` as the public spatial-engine API.

## Engineering contract

The spatial runtime is designed to feed the existing renderer without requiring one JavaScript object per entity per frame. The quality governor reacts to measured frame time and uses hysteresis; it never fabricates GPU measurements.

A 4K/60 FPS claim remains **unverified until browser/GPU timing is collected on the actual rendering path**.

## Remaining high-value work

1. Wire `SpatialRuntime` into the active renderer's entity lifecycle.
2. Add frustum-plane culling in addition to distance culling.
3. Add cluster-level LOD scheduling.
4. Add GPU instancing for repeated geometry.
5. Add incremental graph mutation buffers.
6. Add deterministic simulation snapshots.
7. Add browser-side GPU timing benchmark and automated regression thresholds.
8. Validate WebGPU and WebGL2 fallback paths on production hardware.
