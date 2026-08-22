# ArchOS Repository-Wide Audit

## Scope

Audit pass covering the active TON 618 branch across spatial runtime, renderer, World Model bridge, frontend containerization, backend orchestration, CI, and production configuration consistency.

## Fixed in prior pass

- Snapshot allocation churn in the spatial hot path.
- Per-frame module-position allocations.
- Repeated entity synchronization allocations.
- Stable graph edge object churn.
- True per-node spatial degree enforcement.
- Backend Docker Compose runtime drift.
- Missing PostgreSQL service/health dependency in local orchestration.
- Frontend Vite API configuration being supplied after static build time.
- Root/canonical frontend Docker build divergence.
- CI not running on feature-branch pushes.
- CI dependency-install fallback masking package-manager state.

## Latest engineering pass

- Added frame-time adaptive spatial quality control with Ultra/High/Balanced/Performance tiers.
- Added deterministic spatial benchmark harness.
- Exposed the benchmark through `npm run bench:spatial`.
- Preserved the existing WebGPU/WebGL2 renderer architecture and TON 618 world-model topology.

## Performance contract

The controller targets 60 FPS (16.67 ms/frame) and adapts resolution, LOD, and effect quality only after sustained frame-time evidence. It does not fabricate GPU FPS measurements.

## Validation

Automated GitHub Actions validation remains the production gate. CPU benchmark results do not constitute GPU 4K/60 FPS proof; browser/GPU timing must be measured on the actual rendering path.

## Next implementation layer

- Typed-array entity state in the spatial runtime.
- Cluster-level LOD and frustum-aware scheduling.
- Incremental graph mutation buffers.
- GPU instancing for repeated spatial entities.
- Deterministic simulation snapshots.
- Browser-side 4K/60 FPS benchmark with GPU timing where supported.
