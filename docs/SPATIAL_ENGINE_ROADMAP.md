# Spatial Engine Iteration Roadmap

## Performance track

- [x] Cache/reuse snapshot topology arrays on stable frames.
- [ ] Move hot-path entity position/radius/activity data to typed arrays.
- [x] Add allocation-free module motion updates.
- [x] Add reusable spatial-index entry storage.
- [x] Add camera-frustum culling before render submission.
- [ ] Add cluster-level LOD and visibility aggregation.
- [ ] Add GPU instancing for repeated primitives.
- [ ] Add adaptive quality based on measured frame time.

## Graph track

- [ ] Replace avoidable full graph rebuilds with incremental topology updates.
- [x] Preserve bounded degree and deterministic edge selection.
- [x] Add module-to-core relationship weights and activity propagation.

## Spatial reasoning track

- [ ] Add hierarchical spatial partitioning above the current hash.
- [ ] Add temporal interpolation for moving entities.
- [ ] Add deterministic simulation snapshots.
- [ ] Add focused-region streaming for dense areas.

## Rendering track

- [x] Persistent GPU edge buffer.
- [ ] Instanced module/entity rendering.
- [x] Frustum + distance/LOD edge culling.
- [ ] Multi-resolution World Model representation.
- [x] TON 618 core remains the authoritative visual/spatial anchor.

## Infrastructure track

- [x] Align Docker Compose with the authoritative backend runtime.
- [x] Add health-gated PostgreSQL dependency for local orchestration.
- [x] Make frontend API configuration explicit at build time.
- [x] Unify root and canonical frontend container build paths.
- [x] Execute CI on every branch push.

## Validation track

- [ ] TypeScript validation confirmed by CI.
- [ ] Production build validation confirmed by CI.
- [ ] Runtime smoke test confirmed by CI.
- [ ] Verify no duplicate UI layer is mounted over the canonical interface.
- [ ] Verify all modules resolve to spatial graph nodes.
- [x] Verify renderer consumes one spatial snapshot.
- [ ] Verify 4K viewport scaling without proportional entity-count explosion.
- [ ] Add automated spatial performance benchmark suite.

## Rule

Every optimization must improve the underlying runtime, not merely hide workload behind visual effects. The World Model remains one coherent spatial system.
