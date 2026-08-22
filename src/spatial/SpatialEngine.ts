import * as THREE from 'three';
import { SPATIAL_MODULES, modulePositionAtTime, normalizedActivity, type SpatialModule } from './SpatialRuntime';
import { SpatialHashIndex } from './SpatialIndex';
import type { SpatialEntity } from './WorldModelSpatialBridge';

export type SpatialNode = {
  id: string;
  kind: 'module' | 'entity';
  moduleId: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  activity: number;
  propagatedActivity: number;
  radius: number;
  lod: 'full' | 'reduced' | 'point';
};

export type SpatialEdge = {
  id: string;
  source: string;
  target: string;
  strength: number;
  kind: 'module-core' | 'entity-module' | 'entity-entity';
};

export type SpatialTemporalState = 'historical' | 'current' | 'simulated';

export type SpatialRuntimeMetrics = {
  nodes: number;
  edges: number;
  activeNodes: number;
  fullDetailNodes: number;
  reducedDetailNodes: number;
  pointNodes: number;
  focusedNode: string | null;
};

export type SpatialSnapshot = {
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  moduleActivity: Map<string, number>;
  temporalState: SpatialTemporalState;
  time: number;
  metrics: SpatialRuntimeMetrics;
};

const CORE = new THREE.Vector3(0, 0, 0);
const TMP_TARGET = new THREE.Vector3();

export class SpatialEngine {
  private nodes = new Map<string, SpatialNode>();
  private edges: SpatialEdge[] = [];
  private entities: SpatialEntity[] = [];
  private readonly moduleNodes = new Map<string, SpatialNode>();
  private readonly index = new SpatialHashIndex(0.32);
  private lastTime = 0;
  private temporalState: SpatialTemporalState = 'current';
  private temporalOffset = 0;
  private focusId: string | null = null;

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
        propagatedActivity: module.activity,
        radius: 0.14 + module.activity * 0.045,
        lod: 'full',
      });
    }
    this.syncNodes();
    this.rebuildEdges();
  }

  setEntities(entities: SpatialEntity[]) {
    this.entities = entities;
    this.syncNodes();
    this.rebuildEdges();
  }

  setTemporalState(state: SpatialTemporalState, offset = 0) {
    this.temporalState = state;
    this.temporalOffset = offset;
  }

  setFocus(id: string | null) {
    this.focusId = id;
  }

  getFocusId() {
    return this.focusId;
  }

  tick(time: number, dt: number, camera?: THREE.Camera, viewportHeight = 1080) {
    const delta = Math.min(0.05, Math.max(0, dt || time - this.lastTime || 0.016));
    this.lastTime = time;
    const worldTime = time + this.temporalOffset;
    const temporalScale = this.temporalState === 'historical' ? 0.35 : this.temporalState === 'simulated' ? 1.6 : 1;

    for (const module of SPATIAL_MODULES) {
      const node = this.moduleNodes.get(module.id);
      if (!node) continue;
      const target = modulePositionAtTime(module, worldTime * temporalScale);
      node.velocity.copy(target).sub(node.position).multiplyScalar(Math.min(1, delta * 4));
      node.position.add(node.velocity);
      node.activity = normalizedActivity(module, worldTime * temporalScale);
      node.propagatedActivity = node.activity;
    }

    for (const entity of this.entities) {
      const node = this.nodes.get(`entity:${entity.id}`);
      if (!node) continue;
      const phase = worldTime * (0.08 + entity.activity * 0.08) + entity.id.length;
      const target = TMP_TARGET.copy(entity.position).add(new THREE.Vector3(
        Math.cos(phase * temporalScale) * 0.025,
        Math.sin(phase * temporalScale * 1.7) * 0.018,
        Math.sin(phase * temporalScale) * 0.025,
      ));
      node.velocity.copy(target).sub(node.position).multiplyScalar(Math.min(1, delta * 6));
      node.position.add(node.velocity);
      node.activity = THREE.MathUtils.lerp(node.activity, entity.activity, Math.min(1, delta * 3));
      node.radius = 0.025 + node.activity * 0.035;
    }

    this.rebuildEntityIndex();
    this.rebuildEdges();
    this.propagateActivity();

    if (camera) {
      for (const node of this.nodes.values()) {
        const distance = worldToScreenDistance(camera, node.position, viewportHeight);
        node.lod = spatialLod(distance);
      }
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
      bucket.total += node.propagatedActivity;
      bucket.count += 1;
      moduleActivity.set(node.moduleId, bucket);
    }

    const metrics: SpatialRuntimeMetrics = {
      nodes: nodes.length,
      edges: this.edges.length,
      activeNodes: nodes.filter((node) => node.activity >= 0.72).length,
      fullDetailNodes: nodes.filter((node) => node.lod === 'full').length,
      reducedDetailNodes: nodes.filter((node) => node.lod === 'reduced').length,
      pointNodes: nodes.filter((node) => node.lod === 'point').length,
      focusedNode: this.focusId,
    };

    return {
      nodes,
      edges: this.edges,
      moduleActivity: new Map([...moduleActivity.entries()].map(([id, value]) => [id, value.count ? value.total / value.count : 0])),
      temporalState: this.temporalState,
      time: this.lastTime + this.temporalOffset,
      metrics,
    };
  }

  private syncNodes() {
    for (const node of this.moduleNodes.values()) this.nodes.set(node.id, node);
    const live = new Set(this.entities.map((entity) => `entity:${entity.id}`));

    for (const entity of this.entities) {
      const id = `entity:${entity.id}`;
      const existing = this.nodes.get(id);
      if (existing) {
        existing.position.lerp(entity.position, 0.12);
        existing.activity = entity.activity;
        existing.propagatedActivity = Math.max(existing.propagatedActivity, entity.activity);
        existing.radius = 0.025 + entity.activity * 0.035;
      } else {
        this.nodes.set(id, {
          id,
          kind: 'entity',
          moduleId: entity.moduleId,
          position: entity.position.clone(),
          velocity: new THREE.Vector3(),
          activity: entity.activity,
          propagatedActivity: entity.activity,
          radius: 0.025 + entity.activity * 0.035,
          lod: 'full',
        });
      }
    }

    for (const [id, node] of this.nodes) {
      if (node.kind === 'entity' && !live.has(id)) this.nodes.delete(id);
    }
  }

  private rebuildEntityIndex() {
    this.index.rebuild(this.entities.map((entity) => ({
      id: `entity:${entity.id}`,
      position: this.nodes.get(`entity:${entity.id}`)?.position ?? entity.position,
      activity: entity.activity,
      moduleId: entity.moduleId,
    })));
  }

  private propagateActivity() {
    for (const node of this.moduleNodes.values()) node.propagatedActivity = node.activity;
    for (const node of this.nodes.values()) {
      if (node.kind === 'entity') node.propagatedActivity = node.activity;
    }

    for (const edge of this.edges) {
      if (edge.kind !== 'entity-module') continue;
      const source = this.nodes.get(edge.source);
      const target = this.nodes.get(edge.target);
      if (!source || !target) continue;
      source.propagatedActivity = Math.max(source.propagatedActivity, target.propagatedActivity * edge.strength);
    }

    for (const edge of this.edges) {
      if (edge.kind !== 'entity-entity') continue;
      const source = this.nodes.get(edge.source);
      const target = this.nodes.get(edge.target);
      if (!source || !target) continue;
      const flow = Math.max(source.propagatedActivity, target.propagatedActivity) * edge.strength;
      source.propagatedActivity = Math.max(source.propagatedActivity, flow);
      target.propagatedActivity = Math.max(target.propagatedActivity, flow);
    }
  }

  private rebuildEdges() {
    const edges: SpatialEdge[] = SPATIAL_MODULES.map((module) => ({
      id: `core:${module.id}`,
      source: 'core',
      target: `module:${module.id}`,
      strength: module.activity,
      kind: 'module-core',
    }));

    for (const entity of this.entities) {
      edges.push({
        id: `module:${entity.id}`,
        source: `module:${entity.moduleId}`,
        target: `entity:${entity.id}`,
        strength: entity.activity,
        kind: 'entity-module',
      });
    }

    const entityNodes = this.entities.map((entity) => this.nodes.get(`entity:${entity.id}`)).filter(Boolean) as SpatialNode[];
    for (const node of entityNodes) {
      const neighbors = this.index.queryRadius(node.position, 0.85, 6);
      for (const neighbor of neighbors) {
        if (node.id >= neighbor.id) continue;
        const target = this.nodes.get(neighbor.id);
        if (!target || target.moduleId === node.moduleId && neighbor.distance > 0.5) continue;
        const strength = Math.min(node.activity, target.activity) * neighbor.strength;
        if (strength < 0.08) continue;
        edges.push({
          id: `flow:${node.id}:${neighbor.id}`,
          source: node.id,
          target: neighbor.id,
          strength: Math.min(1, strength),
          kind: 'entity-entity',
        });
      }
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
