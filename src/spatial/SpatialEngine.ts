import * as THREE from 'three';
import {
  CORE_ID,
  SPATIAL_MODULES,
  modulePositionAtTimeInto,
  normalizedActivity,
} from './SpatialRuntime';
import { SpatialHashIndex } from './SpatialIndex';
import type { SpatialEntity } from './WorldModelSpatialBridge';

export type SpatialNode = {
  id: string;
  kind: 'core' | 'module' | 'entity';
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
  type: 'core' | 'spatial';
};

export type SpatialMetrics = {
  nodes: number;
  edges: number;
  activeNodes: number;
  fullLod: number;
  reducedLod: number;
  pointLod: number;
  spatialRebuilds: number;
  graphRebuilds: number;
};

export type SpatialSnapshot = {
  time: number;
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  metrics: SpatialMetrics;
  focusedNode: string | null;
};

type EngineOptions = {
  spatialCadenceMs?: number;
  graphCadenceMs?: number;
  maxEdgesPerNode?: number;
  propagationIterations?: number;
  propagationFactor?: number;
  neighborRadius?: number;
  cellSize?: number;
};

const DEFAULTS: Required<EngineOptions> = {
  spatialCadenceMs: 120,
  graphCadenceMs: 240,
  maxEdgesPerNode: 8,
  propagationIterations: 2,
  propagationFactor: 0.22,
  neighborRadius: 5.5,
  cellSize: 1.5,
};

export class SpatialEngine {
  private readonly nodes = new Map<string, SpatialNode>();
  private readonly edges = new Map<string, SpatialEdge>();
  private readonly index: SpatialHashIndex;
  private readonly options: Required<EngineOptions>;
  private readonly scratch = new THREE.Vector3();
  private readonly modulePositionScratch = new THREE.Vector3();
  private readonly previousPositions = new Map<string, THREE.Vector3>();
  private readonly incomingEntityIds = new Set<string>();
  private readonly indexEntries: Array<{ id: string; position: THREE.Vector3; activity: number; moduleId: string }> = [];
  private readonly snapshotNodes: SpatialNode[] = [];
  private readonly snapshotEdges: SpatialEdge[] = [];
  private readonly snapshotMetrics: SpatialMetrics = {
    nodes: 0,
    edges: 0,
    activeNodes: 0,
    fullLod: 0,
    reducedLod: 0,
    pointLod: 0,
    spatialRebuilds: 0,
    graphRebuilds: 0,
  };
  private readonly snapshotCache: SpatialSnapshot = {
    time: 0,
    nodes: this.snapshotNodes,
    edges: this.snapshotEdges,
    metrics: this.snapshotMetrics,
    focusedNode: null,
  };
  private focusedNode: string | null = null;
  private pendingEntities: SpatialEntity[] = [];
  private topologyDirty = true;
  private lastSpatialRebuild = -Infinity;
  private lastGraphRebuild = -Infinity;
  private spatialRebuilds = 0;
  private graphRebuilds = 0;

  constructor(options: EngineOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
    this.index = new SpatialHashIndex(this.options.cellSize);
    this.ensureCore();
  }

  setEntities(entities: SpatialEntity[]): void {
    this.pendingEntities = entities;
    this.snapshotCache.time = 0;
  }

  tick(time: number, entities: SpatialEntity[] = this.pendingEntities): SpatialSnapshot {
    this.pendingEntities = entities;
    this.syncEntities(entities);
    this.updateMotion(time);

    if (time - this.lastSpatialRebuild >= this.options.spatialCadenceMs) {
      this.rebuildSpatialIndex();
      this.lastSpatialRebuild = time;
      this.spatialRebuilds += 1;
    }

    if (time - this.lastGraphRebuild >= this.options.graphCadenceMs) {
      this.rebuildGraph();
      this.lastGraphRebuild = time;
      this.graphRebuilds += 1;
      this.propagateActivity();
    }

    this.updateLod();
    return this.snapshot(time);
  }

  getSnapshot(): SpatialSnapshot {
    return this.snapshotCache;
  }

  getNode(id: string): SpatialNode | undefined {
    return this.nodes.get(id);
  }

  setFocus(id: string | null): void {
    this.focusedNode = id && this.nodes.has(id) ? id : null;
    this.snapshotCache.focusedNode = this.focusedNode;
  }

  getFocusId(): string | null {
    return this.focusedNode;
  }

  private ensureCore(): void {
    this.nodes.set('core', {
      id: 'core',
      kind: 'core',
      moduleId: CORE_ID,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(),
      activity: 1,
      propagatedActivity: 1,
      radius: 7,
      lod: 'full',
    });
  }

  private syncEntities(entities: SpatialEntity[]): void {
    this.incomingEntityIds.clear();

    for (const entity of entities) {
      const id = `entity:${entity.id}`;
      this.incomingEntityIds.add(id);
      const existing = this.nodes.get(id);
      if (existing) {
        existing.moduleId = entity.moduleId;
        existing.activity = THREE.MathUtils.clamp(entity.activity, 0, 1);
        existing.radius = Math.max(0.8, entity.radius ?? 1);
        existing.position.copy(entity.position);
      } else {
        this.nodes.set(id, {
          id,
          kind: 'entity',
          moduleId: entity.moduleId,
          position: entity.position.clone(),
          velocity: new THREE.Vector3(),
          activity: THREE.MathUtils.clamp(entity.activity, 0, 1),
          propagatedActivity: THREE.MathUtils.clamp(entity.activity, 0, 1),
          radius: Math.max(0.8, entity.radius ?? 1),
          lod: 'reduced',
        });
        this.topologyDirty = true;
      }
    }

    for (const [id, node] of this.nodes) {
      if (node.kind === 'entity' && !this.incomingEntityIds.has(id)) {
        this.nodes.delete(id);
        this.previousPositions.delete(id);
        this.topologyDirty = true;
      }
    }

    if (this.focusedNode && !this.nodes.has(this.focusedNode)) {
      this.focusedNode = null;
      this.snapshotCache.focusedNode = null;
    }
  }

  private updateMotion(time: number): void {
    const core = this.nodes.get('core');
    if (core) {
      core.position.set(0, 0, 0);
      core.velocity.set(0, 0, 0);
      core.activity = 1;
    }

    for (const node of this.nodes.values()) {
      if (node.kind !== 'entity') continue;
      const previous = this.previousPositions.get(node.id);
      if (previous) node.velocity.copy(node.position).sub(previous);
      else node.velocity.set(0, 0, 0);
      if (previous) previous.copy(node.position);
      else this.previousPositions.set(node.id, node.position.clone());
    }

    for (const module of SPATIAL_MODULES) {
      const id = `module:${module.id}`;
      const position = modulePositionAtTimeInto(module, time, this.modulePositionScratch);
      const activity = normalizedActivity(module, time);
      const existing = this.nodes.get(id);

      if (existing) {
        this.scratch.copy(position).sub(existing.position);
        existing.velocity.copy(this.scratch);
        existing.position.copy(position);
        existing.activity = activity;
      } else {
        this.nodes.set(id, {
          id,
          kind: 'module',
          moduleId: module.id,
          position: position.clone(),
          velocity: new THREE.Vector3(),
          activity,
          propagatedActivity: activity,
          radius: 4,
          lod: 'full',
        });
        this.topologyDirty = true;
      }
    }
  }

  private rebuildSpatialIndex(): void {
    this.indexEntries.length = 0;
    for (const node of this.nodes.values()) {
      this.indexEntries.push({
        id: node.id,
        position: node.position,
        activity: node.activity,
        moduleId: node.moduleId,
      });
    }
    this.index.rebuild(this.indexEntries);
  }

  private rebuildGraph(): void {
    this.edges.clear();
    const core = this.nodes.get('core');
    if (!core) this.ensureCore();

    for (const module of SPATIAL_MODULES) {
      const id = `module:${module.id}`;
      const node = this.nodes.get(id);
      if (!node) continue;
      const strength = THREE.MathUtils.clamp(0.55 + node.activity * 0.45, 0, 1);
      this.edges.set(`core::${id}`, {
        id: `core::${id}`,
        source: 'core',
        target: id,
        strength,
        type: 'core',
      });
    }

    for (const node of this.nodes.values()) {
      if (node.kind === 'core') continue;
      const nearby = this.index.queryRadius(node.position, this.options.neighborRadius, this.options.maxEdgesPerNode + 1);

      for (const neighbor of nearby) {
        if (neighbor.id === node.id || neighbor.id === 'core') continue;
        const other = this.nodes.get(neighbor.id);
        if (!other) continue;
        const a = node.id < other.id ? node.id : other.id;
        const b = node.id < other.id ? other.id : node.id;
        const id = `${a}::${b}`;
        if (this.edges.has(id)) continue;
        this.edges.set(id, {
          id,
          source: a,
          target: b,
          strength: THREE.MathUtils.clamp(neighbor.strength, 0, 1),
          type: 'spatial',
        });
      }
    }
    this.topologyDirty = true;
  }

  private propagateActivity(): void {
    for (const node of this.nodes.values()) node.propagatedActivity = node.activity;

    for (let iteration = 0; iteration < this.options.propagationIterations; iteration += 1) {
      for (const edge of this.edges.values()) {
        const source = this.nodes.get(edge.source);
        const target = this.nodes.get(edge.target);
        if (!source || !target) continue;
        const transfer = edge.strength * this.options.propagationFactor;
        const sourceValue = source.propagatedActivity;
        const targetValue = target.propagatedActivity;
        source.propagatedActivity = Math.min(1, Math.max(sourceValue, sourceValue + targetValue * transfer));
        target.propagatedActivity = Math.min(1, Math.max(targetValue, targetValue + sourceValue * transfer));
      }
    }
  }

  private updateLod(): void {
    const focus = this.focusedNode ? this.nodes.get(this.focusedNode) : this.nodes.get('core');
    if (!focus) return;

    for (const node of this.nodes.values()) {
      if (node.kind === 'core' || node.kind === 'module') {
        node.lod = 'full';
        continue;
      }
      const distance = node.position.distanceTo(focus.position);
      node.lod = distance < 5 ? 'full' : distance < 11 ? 'reduced' : 'point';
    }
  }

  private snapshot(time: number): SpatialSnapshot {
    if (this.topologyDirty) {
      this.snapshotNodes.length = 0;
      this.snapshotEdges.length = 0;
      for (const node of this.nodes.values()) this.snapshotNodes.push(node);
      for (const edge of this.edges.values()) this.snapshotEdges.push(edge);
      this.topologyDirty = false;
    }

    let activeNodes = 0;
    let fullLod = 0;
    let reducedLod = 0;
    let pointLod = 0;

    for (const node of this.nodes.values()) {
      if (node.propagatedActivity > 0.5) activeNodes += 1;
      if (node.lod === 'full') fullLod += 1;
      else if (node.lod === 'reduced') reducedLod += 1;
      else pointLod += 1;
    }

    this.snapshotMetrics.nodes = this.nodes.size;
    this.snapshotMetrics.edges = this.edges.size;
    this.snapshotMetrics.activeNodes = activeNodes;
    this.snapshotMetrics.fullLod = fullLod;
    this.snapshotMetrics.reducedLod = reducedLod;
    this.snapshotMetrics.pointLod = pointLod;
    this.snapshotMetrics.spatialRebuilds = this.spatialRebuilds;
    this.snapshotMetrics.graphRebuilds = this.graphRebuilds;
    this.snapshotCache.time = time;
    this.snapshotCache.focusedNode = this.focusedNode;
    return this.snapshotCache;
  }
}
