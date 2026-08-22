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
};

const DEFAULTS: Required<EngineOptions> = {
  spatialCadenceMs: 120,
  graphCadenceMs: 240,
  maxEdgesPerNode: 8,
  propagationIterations: 2,
  propagationFactor: 0.22,
};

export class SpatialEngine {
  private readonly nodes = new Map<string, SpatialNode>();
  private readonly edges = new Map<string, SpatialEdge>();
  private readonly index = new SpatialHashIndex(120);
  private readonly options: Required<EngineOptions>;
  private readonly scratch = new THREE.Vector3();
  private readonly previousPositions = new Map<string, THREE.Vector3>();
  private focusedNode: string | null = null;
  private lastSpatialRebuild = -Infinity;
  private lastGraphRebuild = -Infinity;
  private spatialRebuilds = 0;
  private graphRebuilds = 0;

  constructor(options: EngineOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  tick(time: number, entities: SpatialEntity[] = []): SpatialSnapshot {
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

  setFocus(id: string | null): void {
    this.focusedNode = id && this.nodes.has(id) ? id : null;
  }

  getFocusId(): string | null {
    return this.focusedNode;
  }

  private syncEntities(entities: SpatialEntity[]): void {
    const incoming = new Set<string>();

    for (const entity of entities) {
      const id = `entity:${entity.id}`;
      incoming.add(id);
      const existing = this.nodes.get(id);
      if (existing) {
        existing.moduleId = entity.moduleId;
        existing.activity = normalizedActivity(entity.activity ?? 0);
        existing.radius = Math.max(0.8, entity.radius ?? 1);
      } else {
        this.nodes.set(id, {
          id,
          kind: 'entity',
          moduleId: entity.moduleId,
          position: new THREE.Vector3(entity.position.x, entity.position.y, entity.position.z),
          velocity: new THREE.Vector3(),
          activity: normalizedActivity(entity.activity ?? 0),
          propagatedActivity: normalizedActivity(entity.activity ?? 0),
          radius: Math.max(0.8, entity.radius ?? 1),
          lod: 'full',
        });
      }
    }

    for (const [id, node] of this.nodes) {
      if (node.kind === 'entity' && !incoming.has(id)) {
        this.nodes.delete(id);
        this.previousPositions.delete(id);
      }
    }

    if (this.focusedNode && !this.nodes.has(this.focusedNode)) this.focusedNode = null;
  }

  private updateMotion(time: number): void {
    for (const node of this.nodes.values()) {
      if (node.kind === 'module') continue;
      const previous = this.previousPositions.get(node.id);
      if (previous) {
        node.velocity.set(node.position.x - previous.x, node.position.y - previous.y, node.position.z - previous.z);
      } else {
        node.velocity.set(0, 0, 0);
      }
      this.previousPositions.set(node.id, node.position.clone());
    }

    for (const module of SPATIAL_MODULES) {
      const id = `module:${module.id}`;
      const position = modulePositionAtTime(module, time);
      const existing = this.nodes.get(id);
      if (existing) {
        this.scratch.copy(position).sub(existing.position);
        existing.velocity.copy(this.scratch);
        existing.position.copy(position);
        existing.activity = normalizedActivity(module.activity);
      } else {
        this.nodes.set(id, {
          id,
          kind: 'module',
          moduleId: module.id,
          position: position.clone(),
          velocity: new THREE.Vector3(),
          activity: normalizedActivity(module.activity),
          propagatedActivity: normalizedActivity(module.activity),
          radius: 4,
          lod: 'full',
        });
      }
    }
  }

  private rebuildSpatialIndex(): void {
    this.index.clear();
    for (const node of this.nodes.values()) this.index.insert(node.id, node.position);
  }

  private rebuildGraph(): void {
    this.edges.clear();
    const radius = this.index.getCellSize() * 1.75;

    for (const node of this.nodes.values()) {
      const nearby = this.index.queryRadius(node.position, radius);
      const candidates: Array<{ id: string; strength: number }> = [];

      for (const id of nearby) {
        if (id === node.id) continue;
        const other = this.nodes.get(id);
        if (!other) continue;
        const distance = node.position.distanceTo(other.position);
        if (distance > radius) continue;
        const strength = (1 / (1 + distance)) * (0.25 + 0.75 * Math.max(node.activity, other.activity));
        candidates.push({ id, strength });
      }

      candidates.sort((a, b) => b.strength - a.strength);
      for (const candidate of candidates.slice(0, this.options.maxEdgesPerNode)) {
        const a = node.id < candidate.id ? node.id : candidate.id;
        const b = node.id < candidate.id ? candidate.id : node.id;
        const id = `${a}::${b}`;
        if (!this.edges.has(id)) {
          this.edges.set(id, { id, source: a, target: b, strength: candidate.strength });
        }
      }
    }
  }

  private propagateActivity(): void {
    for (const node of this.nodes.values()) node.propagatedActivity = node.activity;

    for (let iteration = 0; iteration < this.options.propagationIterations; iteration += 1) {
      const next = new Map<string, number>();
      for (const node of this.nodes.values()) next.set(node.id, node.propagatedActivity);

      for (const edge of this.edges.values()) {
        const source = this.nodes.get(edge.source);
        const target = this.nodes.get(edge.target);
        if (!source || !target) continue;
        const transfer = Math.min(1, edge.strength) * this.options.propagationFactor;
        next.set(target.id, Math.max(next.get(target.id) ?? 0, target.propagatedActivity + source.propagatedActivity * transfer));
        next.set(source.id, Math.max(next.get(source.id) ?? 0, source.propagatedActivity + target.propagatedActivity * transfer));
      }

      for (const node of this.nodes.values()) node.propagatedActivity = Math.min(1, next.get(node.id) ?? node.activity);
    }
  }

  private updateLod(): void {
    const focus = this.focusedNode ? this.nodes.get(this.focusedNode) : undefined;
    for (const node of this.nodes.values()) {
      if (!focus) {
        node.lod = node.kind === 'module' ? 'full' : 'reduced';
        continue;
      }
      const distance = node.position.distanceTo(focus.position);
      node.lod = distance < 250 ? 'full' : distance < 650 ? 'reduced' : 'point';
    }
  }

  private snapshot(time: number): SpatialSnapshot {
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

    return {
      time,
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
      focusedNode: this.focusedNode,
      metrics: {
        nodes: this.nodes.size,
        edges: this.edges.size,
        activeNodes,
        fullLod,
        reducedLod,
        pointLod,
        spatialRebuilds: this.spatialRebuilds,
        graphRebuilds: this.graphRebuilds,
      },
    };
  }
}
