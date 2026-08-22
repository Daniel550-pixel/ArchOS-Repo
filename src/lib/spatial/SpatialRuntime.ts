export type SpatialQualityTier = 'ultra' | 'high' | 'balanced' | 'performance';

export interface SpatialRuntimeConfig {
  maxEntities?: number;
  maxVisibleEntities?: number;
  cellSize?: number;
}

export interface SpatialFrame {
  visibleCount: number;
  culledCount: number;
  tier: SpatialQualityTier;
  renderScale: number;
  lodBias: number;
}

export interface SpatialEntityInput {
  x: number;
  y: number;
  z: number;
  radius?: number;
}

const QUALITY: Record<SpatialQualityTier, { renderScale: number; lodBias: number; maxVisibleMultiplier: number }> = {
  ultra: { renderScale: 1, lodBias: 0, maxVisibleMultiplier: 1 },
  high: { renderScale: 0.9, lodBias: 0.15, maxVisibleMultiplier: 0.9 },
  balanced: { renderScale: 0.78, lodBias: 0.35, maxVisibleMultiplier: 0.72 },
  performance: { renderScale: 0.65, lodBias: 0.6, maxVisibleMultiplier: 0.55 },
};

/**
 * Allocation-light spatial state container for the ArchOS renderer.
 * Positions/radii live in contiguous typed arrays so hot-frame traversal does
 * not allocate one JS object per entity.
 */
export class SpatialRuntime {
  readonly positions: Float32Array;
  readonly radii: Float32Array;
  readonly active: Uint8Array;

  private readonly capacity: number;
  private readonly maxVisibleEntities: number;
  private readonly cellSize: number;
  private count = 0;
  private tier: SpatialQualityTier = 'high';
  private visibleIndices = new Uint32Array(0);

  constructor(config: SpatialRuntimeConfig = {}) {
    this.capacity = Math.max(1, config.maxEntities ?? 65536);
    this.maxVisibleEntities = Math.max(1, config.maxVisibleEntities ?? 16384);
    this.cellSize = Math.max(1, config.cellSize ?? 64);
    this.positions = new Float32Array(this.capacity * 3);
    this.radii = new Float32Array(this.capacity);
    this.active = new Uint8Array(this.capacity);
  }

  get size(): number {
    return this.count;
  }

  setQualityTier(tier: SpatialQualityTier): void {
    this.tier = tier;
  }

  addEntity(input: SpatialEntityInput): number {
    if (this.count >= this.capacity) return -1;
    const id = this.count++;
    const offset = id * 3;
    this.positions[offset] = input.x;
    this.positions[offset + 1] = input.y;
    this.positions[offset + 2] = input.z;
    this.radii[id] = Math.max(0.001, input.radius ?? 1);
    this.active[id] = 1;
    return id;
  }

  updateEntity(id: number, input: SpatialEntityInput): boolean {
    if (id < 0 || id >= this.count || this.active[id] === 0) return false;
    const offset = id * 3;
    this.positions[offset] = input.x;
    this.positions[offset + 1] = input.y;
    this.positions[offset + 2] = input.z;
    if (input.radius !== undefined) this.radii[id] = Math.max(0.001, input.radius);
    return true;
  }

  removeEntity(id: number): boolean {
    if (id < 0 || id >= this.count || this.active[id] === 0) return false;
    this.active[id] = 0;
    return true;
  }

  /**
   * Conservative sphere-vs-distance visibility pass. A renderer can consume
   * the returned contiguous IDs for instancing/LOD without allocating entity objects.
   */
  cullToDistance(cameraX: number, cameraY: number, cameraZ: number, maxDistance: number): SpatialFrame {
    const quality = QUALITY[this.tier];
    const visibleLimit = Math.min(
      this.maxVisibleEntities,
      Math.max(1, Math.floor(this.maxVisibleEntities * quality.maxVisibleMultiplier)),
    );

    if (this.visibleIndices.length < visibleLimit) this.visibleIndices = new Uint32Array(visibleLimit);

    const maxDistanceSq = maxDistance * maxDistance;
    let visibleCount = 0;
    let culledCount = 0;

    for (let id = 0; id < this.count; id++) {
      if (this.active[id] === 0) {
        culledCount++;
        continue;
      }

      const o = id * 3;
      const dx = this.positions[o] - cameraX;
      const dy = this.positions[o + 1] - cameraY;
      const dz = this.positions[o + 2] - cameraZ;
      const r = this.radii[id];
      const distanceSq = dx * dx + dy * dy + dz * dz;

      if (distanceSq <= maxDistanceSq + r * r && visibleCount < visibleLimit) {
        this.visibleIndices[visibleCount++] = id;
      } else {
        culledCount++;
      }
    }

    return {
      visibleCount,
      culledCount,
      tier: this.tier,
      renderScale: quality.renderScale,
      lodBias: quality.lodBias,
    };
  }

  /** Stable coarse spatial key useful for incremental cluster scheduling. */
  cellKey(id: number): string {
    if (id < 0 || id >= this.count) return '';
    const o = id * 3;
    const x = Math.floor(this.positions[o] / this.cellSize);
    const y = Math.floor(this.positions[o + 1] / this.cellSize);
    const z = Math.floor(this.positions[o + 2] / this.cellSize);
    return `${x}:${y}:${z}`;
  }

  getVisibleIndices(): Uint32Array {
    return this.visibleIndices;
  }
}

export { QUALITY as SPATIAL_QUALITY_PRESETS };
