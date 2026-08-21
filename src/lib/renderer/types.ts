// src/lib/renderer/types.ts
// Type definitions for ArchOS RTX / Software Path Tracing Engine

export interface AABB {
  min: [number, number, number];
  max: [number, number, number];
}

export interface FlatBVHNode {
  min: [number, number, number];
  leftChildOrFirstTri: number;
  max: [number, number, number];
  triCount: number; // 0 for inner node, >0 for leaf node
}

export interface FlatBVHTriangle {
  v0: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
  normal: [number, number, number];
  materialId: number;
  meshId: number;
}

export interface BVHStats {
  totalTriangles: number;
  nodeCount: number;
  leafCount: number;
  maxDepth: number;
  buildTimeMs: number;
  sahCost?: number;
}

export interface LinearBVH {
  nodeBuffer: Float32Array; // 8 floats per node: [min.x, min.y, min.z, leftChild, max.x, max.y, max.z, triCount]
  triBuffer: Float32Array;  // 16 floats per triangle: [v0.xyz, matId, v1.xyz, meshId, v2.xyz, 0, norm.xyz, area]
  nodeCount: number;
  triCount: number;
  stats: BVHStats;
}

export interface RTXMesh {
  id: string;
  name?: string;
  vertices: Float32Array;
  indices: Uint32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  materialId: string;
  transform: Float32Array; // 4x4 matrix
}

export interface RTXMaterial {
  name?: string;
  albedo: [number, number, number];
  roughness: number;
  metallic: number;
  emissive: [number, number, number];
  transmission?: number;
  ior?: number;
}

export interface RTXLight {
  type: 'point' | 'directional' | 'area';
  position: [number, number, number];
  direction?: [number, number, number];
  intensity: number;
  color: [number, number, number];
}

export interface RTXCamera {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  aspect: number;
}

export interface RTXScene {
  meshes: RTXMesh[];
  materials: Record<string, RTXMaterial>;
  lights: RTXLight[];
  camera: RTXCamera;
  environment?: {
    skyColor: [number, number, number];
    groundColor: [number, number, number];
    sunIntensity: number;
  };
  bvh?: LinearBVH;
}

export interface RTXSettings {
  maxSamples: number;
  resolutionScale: number; // 0.5 = half res, 1.0 = native
  enableTemporal: boolean;
  adaptiveSampling: boolean;
  noiseThreshold: number;
  maxBounces?: number;
  sunElevation?: number;
  sunAzimuth?: number;
  useBVH?: boolean;
  bvhMaxLeafSize?: number;
}

export interface RTXRenderState {
  samplesRendered: number;
  fps: number;
  isFallback: boolean;
  error: string | null;
  convergencePct?: number;
  renderTimeMs?: number;
  bvhStats?: BVHStats | null;
}

