import { Vector3 } from 'three';
import type { SpatialEntity } from './WorldModelSpatialBridge';

export interface SpatialEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
  kind?: string;
}

export interface SpatialNode {
  id: string;
  name: string;
  position: Vector3;
  targetPosition: Vector3;
  velocity: Vector3;
  type: string;
}

export class SpatialEngine {
  private nodes = new Map<string, SpatialNode>();
  private edges: SpatialEdge[] = [];

  setEntities(entities: SpatialEntity[]): void {
    const nextNodes = new Map<string, SpatialNode>();
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      let pos = new Vector3(0, 0, 0);
      if (Array.isArray(e.position) && e.position.length === 3) {
        pos = new Vector3(e.position[0], e.position[1], e.position[2]);
      } else if (e.position && typeof e.position === 'object' && 'x' in e.position) {
        pos = new Vector3(e.position.x, e.position.y, e.position.z);
      } else if (e.coordinates && e.coordinates.length === 2) {
        const lat = e.coordinates[0];
        const lon = e.coordinates[1];
        const rad = 25;
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        pos = new Vector3(
          -rad * Math.sin(phi) * Math.cos(theta),
          rad * Math.cos(phi),
          rad * Math.sin(phi) * Math.sin(theta)
        );
      } else {
        const phi = Math.acos(-1 + (2 * i) / Math.max(1, entities.length));
        const theta = Math.sqrt(entities.length * Math.PI) * phi;
        const radius = 15;
        pos = new Vector3(
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi)
        );
      }

      const existing = this.nodes.get(e.id);
      if (existing) {
        existing.targetPosition.copy(pos);
        nextNodes.set(e.id, existing);
      } else {
        nextNodes.set(e.id, {
          id: e.id,
          name: e.name || e.id,
          position: pos.clone(),
          targetPosition: pos.clone(),
          velocity: new Vector3(0, 0, 0),
          type: e.type || 'ENTITY',
        });
      }
    }
    this.nodes = nextNodes;
    this.recomputeEdges();
  }

  private recomputeEdges(): void {
    const nodeIds = Array.from(this.nodes.keys());
    const newEdges: SpatialEdge[] = [];
    for (const id of nodeIds) {
      newEdges.push({ id: `core-${id}`, source: 'core', target: id });
    }
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < Math.min(nodeIds.length, i + 3); j++) {
        newEdges.push({
          id: `${nodeIds[i]}-${nodeIds[j]}`,
          source: nodeIds[i],
          target: nodeIds[j],
        });
      }
    }
    this.edges = newEdges;
  }

  getNode(id: string): SpatialNode | undefined {
    return this.nodes.get(id);
  }

  getSnapshot(): { nodes: SpatialNode[]; edges: SpatialEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
    };
  }

  tick(elapsedTime: number): void {
    for (const node of this.nodes.values()) {
      node.position.lerp(node.targetPosition, 0.1);
      node.position.y += Math.sin(elapsedTime * 1.5 + node.position.x * 0.5) * 0.002;
    }
  }
}
