import * as THREE from 'three';
import { SPATIAL_MODULES, type SpatialModule } from './SpatialRuntime';

export type WorldModelEntityKind = 'city' | 'facility' | 'route' | 'event' | 'agent' | 'metric' | 'unknown';

export type WorldModelEntity = {
  id: string;
  label: string;
  kind: WorldModelEntityKind;
  position?: [number, number, number];
  activity?: number;
  radius?: number;
  moduleId?: string;
  metadata?: Record<string, unknown>;
};

export type SpatialEntity = Omit<WorldModelEntity, 'position' | 'activity' | 'moduleId' | 'radius'> & {
  position: THREE.Vector3;
  activity: number;
  moduleId: string;
  radius: number;
};

const DEFAULT_MODULE = SPATIAL_MODULES[0];

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return hash >>> 0;
}

function moduleForEntity(entity: WorldModelEntity): SpatialModule {
  if (entity.moduleId) return SPATIAL_MODULES.find((m) => m.id === entity.moduleId) ?? DEFAULT_MODULE;
  const index = stableHash(entity.id) % SPATIAL_MODULES.length;
  return SPATIAL_MODULES[index];
}

export function projectWorldEntity(entity: WorldModelEntity, index = 0): SpatialEntity {
  const module = moduleForEntity(entity);
  const hash = stableHash(entity.id);
  const theta = ((hash % 360) * Math.PI) / 180;
  const radius = 1.25 + ((hash >>> 8) % 180) / 100;
  const vertical = (((hash >>> 16) % 100) / 100 - .5) * 1.1;
  const moduleAnchor = new THREE.Vector3(Math.cos(module.angle) * module.radius, 0, Math.sin(module.angle) * module.radius);
  const position = entity.position
    ? new THREE.Vector3(...entity.position)
    : moduleAnchor.clone().multiplyScalar(.72).add(new THREE.Vector3(Math.cos(theta) * radius, vertical, Math.sin(theta) * radius));

  return {
    id: entity.id,
    label: entity.label,
    kind: entity.kind,
    metadata: entity.metadata,
    position,
    activity: THREE.MathUtils.clamp(entity.activity ?? module.activity, 0, 1),
    radius: Math.max(.8, entity.radius ?? 1),
    moduleId: module.id,
  };
}

export function projectWorldEntities(entities: WorldModelEntity[]): SpatialEntity[] {
  return entities.map(projectWorldEntity);
}

export function spatialEntitiesToModuleActivity(entities: SpatialEntity[]): Map<string, number> {
  const buckets = new Map<string, { total: number; count: number }>();
  for (const entity of entities) {
    const bucket = buckets.get(entity.moduleId) ?? { total: 0, count: 0 };
    bucket.total += entity.activity;
    bucket.count += 1;
    buckets.set(entity.moduleId, bucket);
  }
  return new Map([...buckets.entries()].map(([id, bucket]) => [id, bucket.total / bucket.count]));
}

export function createDemoWorldModel(): WorldModelEntity[] {
  return [
    { id: 'uae-dubai', label: 'DUBAI', kind: 'city', moduleId: 'world-model', activity: .96 },
    { id: 'uae-abu-dhabi', label: 'ABU DHABI', kind: 'city', moduleId: 'world-model', activity: .91 },
    { id: 'uae-jebel-ali', label: 'JEBEL ALI', kind: 'facility', moduleId: 'integrations', activity: .88 },
    { id: 'uae-global-trade', label: 'GLOBAL TRADE FLOW', kind: 'route', moduleId: 'vision', activity: .79 },
    { id: 'uae-policy', label: 'POLICY STATE', kind: 'event', moduleId: 'governance', activity: .93 },
    { id: 'uae-simulation', label: '2071 SIMULATION', kind: 'metric', moduleId: 'simulation', activity: .82 },
    { id: 'uae-ai-agent', label: 'AIOS ACTIVE AGENT', kind: 'agent', moduleId: 'agents', activity: .9 },
  ];
}
