import * as THREE from 'three';

export type SpatialModule = {
  id: string;
  label: string;
  angle: number;
  radius: number;
  color: string;
  activity: number;
  tier: 1 | 2 | 3;
};

export type SpatialEngineState = {
  enabled: boolean;
  quality: 'balanced' | 'high' | 'ultra';
  selectedModule: string | null;
  time: number;
  fps: number;
  dpr: number;
};

export const CORE_ID = 'ultron-core';

export const SPATIAL_MODULES: SpatialModule[] = [
  { id: 'world-model', label: 'WORLD MODEL', angle: -1.48, radius: 3.35, color: '#ffb45c', activity: .96, tier: 1 },
  { id: 'aios', label: 'AIOS', angle: -.98, radius: 3.15, color: '#ffd28a', activity: .92, tier: 1 },
  { id: 'agents', label: 'AGENT FABRIC', angle: -.48, radius: 3.5, color: '#77d9ff', activity: .86, tier: 1 },
  { id: 'spatial', label: 'SPATIAL INTELLIGENCE', angle: -.05, radius: 3.8, color: '#8ee8ff', activity: .9, tier: 1 },
  { id: 'temporal', label: 'TEMPORAL INTELLIGENCE', angle: .38, radius: 3.45, color: '#9fc5ff', activity: .72, tier: 2 },
  { id: 'simulation', label: 'SIMULATION', angle: .82, radius: 3.65, color: '#d2a8ff', activity: .81, tier: 1 },
  { id: 'causal', label: 'CAUSAL GRAPH', angle: 1.25, radius: 3.2, color: '#ff9bcf', activity: .68, tier: 2 },
  { id: 'fiscal', label: 'FISCAL INTELLIGENCE', angle: 1.68, radius: 3.55, color: '#ffd166', activity: .78, tier: 2 },
  { id: 'governance', label: 'GOVERNANCE', angle: 2.1, radius: 3.3, color: '#a8ffcf', activity: .94, tier: 1 },
  { id: 'security', label: 'SECURITY', angle: 2.52, radius: 3.7, color: '#7ce6ff', activity: .98, tier: 1 },
  { id: 'memory', label: 'MEMORY', angle: 2.95, radius: 3.25, color: '#b9b6ff', activity: .83, tier: 2 },
  { id: 'vision', label: 'VISION', angle: 3.38, radius: 3.55, color: '#7fffd4', activity: .89, tier: 1 },
  { id: 'integrations', label: 'INTEGRATIONS', angle: 3.82, radius: 3.25, color: '#8dc7ff', activity: .76, tier: 3 },
  { id: 'voice', label: 'VOICE', angle: 4.25, radius: 3.65, color: '#ffb0c8', activity: .61, tier: 3 },
  { id: 'experience', label: 'EXPERIENCE', angle: 4.72, radius: 3.4, color: '#ffc48c', activity: .88, tier: 1 },
];

export function modulePosition(module: SpatialModule, y = 0): THREE.Vector3 {
  return new THREE.Vector3(Math.cos(module.angle) * module.radius, y, Math.sin(module.angle) * module.radius);
}

export function createSpatialScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#010206');
  scene.fog = new THREE.FogExp2('#010206', .011);
  return scene;
}

export function getModuleById(id: string): SpatialModule | undefined {
  return SPATIAL_MODULES.find((module) => module.id === id);
}

export function normalizedActivity(module: SpatialModule, time: number): number {
  const wave = Math.sin(time * (1.1 + module.activity) + module.angle * 3.0) * .5 + .5;
  return THREE.MathUtils.clamp(module.activity * (.78 + wave * .22), 0, 1);
}

export function modulePositionAtTime(module: SpatialModule, time: number): THREE.Vector3 {
  const orbit = Math.sin(time * .035 + module.angle) * .08;
  const radius = module.radius + orbit;
  return new THREE.Vector3(Math.cos(module.angle) * radius, Math.sin(time * .28 + module.angle) * .08, Math.sin(module.angle) * radius);
}

export function createEngineState(): SpatialEngineState {
  return { enabled: true, quality: 'high', selectedModule: null, time: 0, fps: 60, dpr: 2 };
}
