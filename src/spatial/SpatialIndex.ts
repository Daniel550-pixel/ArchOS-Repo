import * as THREE from 'three';

export type SpatialIndexEntry = {
  id: string;
  position: THREE.Vector3;
  activity: number;
  moduleId: string;
};

export type SpatialNeighbor = {
  id: string;
  distance: number;
  strength: number;
};

/**
 * Uniform-grid spatial hash for bounded-radius queries.
 * Keeps entity relationship discovery O(n) for rebuilds instead of O(n²).
 */
export class SpatialHashIndex {
  private readonly cellSize: number;
  private readonly cells = new Map<string, SpatialIndexEntry[]>();
  private readonly cellScratch = new Set<string>();

  constructor(cellSize = 0.35) {
    this.cellSize = Math.max(0.01, cellSize);
  }

  clear() {
    this.cells.clear();
  }

  insert(entry: SpatialIndexEntry) {
    const key = this.keyFor(entry.position);
    const bucket = this.cells.get(key);
    if (bucket) bucket.push(entry);
    else this.cells.set(key, [entry]);
  }

  rebuild(entries: Iterable<SpatialIndexEntry>) {
    this.clear();
    for (const entry of entries) this.insert(entry);
  }

  queryRadius(center: THREE.Vector3, radius: number, limit = 24): SpatialNeighbor[] {
    const radiusSq = radius * radius;
    const candidates: SpatialNeighbor[] = [];
    const minX = Math.floor((center.x - radius) / this.cellSize);
    const maxX = Math.floor((center.x + radius) / this.cellSize);
    const minY = Math.floor((center.y - radius) / this.cellSize);
    const maxY = Math.floor((center.y + radius) / this.cellSize);
    const minZ = Math.floor((center.z - radius) / this.cellSize);
    const maxZ = Math.floor((center.z + radius) / this.cellSize);

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          const bucket = this.cells.get(`${x}:${y}:${z}`);
          if (!bucket) continue;
          for (const entry of bucket) {
            const distanceSq = center.distanceToSquared(entry.position);
            if (distanceSq === 0 || distanceSq > radiusSq) continue;
            const distance = Math.sqrt(distanceSq);
            candidates.push({
              id: entry.id,
              distance,
              strength: entry.activity * Math.max(0, 1 - distance / radius),
            });
          }
        }
      }
    }

    candidates.sort((a, b) => b.strength - a.strength);
    return candidates.slice(0, Math.max(1, limit));
  }

  queryModuleNeighborhood(center: THREE.Vector3, radius = 1.1, limit = 64) {
    return this.queryRadius(center, radius, limit);
  }

  private keyFor(position: THREE.Vector3) {
    return `${Math.floor(position.x / this.cellSize)}:${Math.floor(position.y / this.cellSize)}:${Math.floor(position.z / this.cellSize)}`;
  }
}
