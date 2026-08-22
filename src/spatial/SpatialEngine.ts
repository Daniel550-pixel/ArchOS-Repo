import * as THREE from 'three';
import { SPATIAL_MODULES, modulePositionAtTime, normalizedActivity, type SpatialModule } from './SpatialRuntime';
import type { SpatialEntity } from './WorldModelSpatialBridge';

export type SpatialNode = {
  id: string;
  kind: 'module' | 'entity';
  moduleId: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  activity: number;
  radius: number;
};

export type SpatialEdge = {
  id: string;
  source: string;
  target: string;
  strength: number;
  kind: 'module-core' | 'entity-module' | 'entity-entity';
};

export type SpatialSnapshot = {
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  moduleActivity: Map<string, number>;
};

const CORE = new THREE.Vector3(0, 0, 0);

export class SpatialEngine {
  private nodes = new Map<string, SpatialNode>();
  private edges: SpatialEdge[] = [];
  private entities: SpatialEntity[] = [];
  private readonly moduleNodes = new Map<string, SpatialNode>();
  private lastTime = 0;

  constructor() {
    for (const module of SPATIAL_MODULES) {
      const position = modulePositionAtTime(module, 0);
      this.moduleNodes.set(module.id, {
        id: `module:${module.id}`,
        kind: 'module',
        moduleId: module.id,
        position: position.clone(),
        velocity: new THREE.Vector3(),
        activity: module.activity,
        radius: 0.14 + module.activity * 0.045,
      });
    }
    this.rebuildEdges();
  }

  setEntities(entities: SpatialEntity[]) {
    this.entities = entities;
    for (const node of this.moduleNodes.values()) this.nodes.set(node.id, node);
    const live = new Set<string>();
    for (const entity of entities) {
      const id = `entity:${entity.id}`;
      live.add(id);
      const existing = this.nodes.get(id);
      if (existing) {
        existing.position.lerp(entity.position, 0.12);
        existing.activity = entity.activity;
        existing.radius = 0.025 + entity.activity * 0.035;
      } else {
        this.nodes.set(id, {
          id,
          kind: 'entity',
          moduleId: entity.moduleId,
          position: entity.position.clone(),
          velocity: new THREE.Vector3(),
          activity: entity.activity,
          radius: 0.025 + entity.activity * 0.035,
        });
      }
    }
    for (const [id, node] of this.nodes) {
      if (node.kind === 'entity' && !live.has(id)) this.nodes.delete(id);
    }
    this.rebuildEdges();
  }

  tick(time: number, dt: number) {
    const delta = Math.min(0.05, Math.max(0, dt || time - this.lastTime || 0.016));
    this.lastTime = time;

    for (const module of SPATIAL_MODULES) {
      const node = this.moduleNodes.get(module.id);
      if (!node) continue;
      const target = modulePositionAtTime(module, time);
      node.velocity.copy(target).sub(node.position).multiplyScalar(Math.min(1, delta * 4));
      node.position.add(node.velocity);
      node.activity = normalizedActivity(module, time);
    }

    for (const entity of this.entities) {
      const node = this.nodes.get(`entity:${entity.id}`);
      if (!node) continue;
      const target = entity.position;
      const phase = time * (0.08 + entity.activity * 0.08) + entity.id.length;
      const orbit = new THREE.Vector3(Math.cos(phase) * 0.025, Math.sin(phase * 1.7) * 0.018, Math.sin(phase) * 0.025);
      target.clone().add(orbit);
      node.velocity.copy(target).sub(node.position).multiplyScalar(Math.min(1, delta * 6));
      node.position.add(node.velocity);
    }
  }

  getModulePosition(id: string) {
    return this.moduleNodes.get(id)?.position ?? CORE;
  }

  getNode(id: string) {
    return this.nodes.get(id);
  }

  getSnapshot(): SpatialSnapshot {
    const nodes = [...this.nodes.values()];
    const moduleActivity = new Map<string, { total: number; count: number }>();
    for (const node of nodes.filter((n) => n.kind === 'entity')) {
      const bucket = moduleActivity.get(node.moduleId) ?? { total: 0, count: 0 };
      bucket.total += node.activity;
      bucket.count += 1;
      moduleActivity.set(node.moduleId, bucket);
    }
    return {
      nodes,
      edges: this.edges,
      moduleActivity: new Map([...moduleActivity.entries()].map(([id, v]) => [id, v.count ? v.total / v.count : 0])),
    };
  }

  private rebuildEdges() {
    const edges: SpatialEdge[] = [];
    for (const module of SPATIAL_MODULES) {
      edges.push({ id: `core:${module.id}`, source: 'core', target: `module:${module.id}`, strength: module.activity, kind: 'module-core' });
    }
    for (const entity of this.entities) {
      edges.push({ id: `module:${entity.id}`, source: `module:${entity.moduleId}`, target: `entity:${entity.id}`, strength: entity.activity, kind: 'entity-module' });
    }
    const active = this.entities.filter((entity) => entity.activity >= 0.72);
    for (let i = 0; i < active.length; i += 1) {
      const a = active[i];
      const b = active[(i + 1) % active.length];
      if (!b || a.id === b.id) continue;
      edges.push({ id: `flow:${a.id}:${b.id}`, source: `entity:${a.id}`, target: `entity:${b.id}`, strength: Math.min(a.activity, b.activity) * 0.65, kind: 'entity-entity' });
    }
    this.edges = edges;
  }
}

export function worldToScreenDistance(camera: THREE.Camera, position: THREE.Vector3, viewportHeight: number) {
  const projected = position.clone().project(camera);
  return Math.abs(projected.z) * viewportHeight;
}

export function spatialLod(distance: number) {
  if (distance < 900) return 'full' as const;
  if (distance < 1800) return 'reduced' as const;
  return 'point' as const;
}

export function spatialModuleById(id: string): SpatialModule | undefined {
  return SPATIAL_MODULES.find((module) => module.id === id);
}
