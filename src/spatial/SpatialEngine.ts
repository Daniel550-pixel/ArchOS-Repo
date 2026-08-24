import { toSpatialPosition, type SpatialEntity, type SpatialPosition } from './WorldModelSpatialBridge';

export interface SpatialNode {
  id: string;
  position: SpatialPosition;
  radius: number;
}

export interface SpatialEdge {
  source: string;
  target: string;
}

export interface SpatialSnapshot {
  nodes: SpatialNode[];
  edges: SpatialEdge[];
}

export class SpatialEngine {
  private nodes = new Map<string, SpatialNode>();
  private edges: SpatialEdge[] = [];

  setEntities(entities: readonly SpatialEntity[]): void {
    this.nodes.clear();
    for (const entity of entities) {
      if (!entity.id) continue;
      this.nodes.set(entity.id, { id: entity.id, position: toSpatialPosition(entity), radius: Number(entity.radius ?? 1) });
    }
    this.rebuildEdges();
  }

  getNode(id: string): SpatialNode | undefined {
    return this.nodes.get(id);
  }

  getSnapshot(): SpatialSnapshot {
    return { nodes: [...this.nodes.values()], edges: [...this.edges] };
  }

  tick(time: number): void {
    if (!Number.isFinite(time)) return;
    // Spatial animation is intentionally deterministic and bounded; world state remains authoritative.
    for (const node of this.nodes.values()) {
      node.position.y += Math.sin(time * 0.15 + node.position.x + node.position.z) * 0.0001;
    }
  }

  private rebuildEdges(): void {
    const ids = [...this.nodes.keys()];
    this.edges = ids.slice(0, 128).map((id, index) => ({ source: index === 0 ? 'core' : ids[index - 1], target: id }));
  }
}
