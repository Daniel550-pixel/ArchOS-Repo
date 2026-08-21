// src/services/spatial/SpatialRaycaster.ts
// Spatial Raycasting engine connecting UAE World Model entities with physical/virtual input streams

import { Vector3D, Ray3D, SpatialEntityNode, RaycastHit, BoundingBox3D } from './types';
import { SpatialBVHTree } from './SpatialBVHTree';
import { worldModelGraphService } from '../archos/worldModelGraphService';
import { CanonicalWorldModelEntity } from '../../types/archosWorldModel';

export class SpatialRaycaster {
  private bvhTree: SpatialBVHTree;
  private entityNodesMap: Map<string, SpatialEntityNode> = new Map();
  private lastHitEntityId: string | null = null;
  private hitCounter: number = 0;
  private readonly hysteresisFrames: number = 2; // Anti-jitter frames

  constructor() {
    this.bvhTree = new SpatialBVHTree();
    this.syncWithWorldModel();

    // Subscribe to World Model graph updates
    worldModelGraphService.subscribe((_entities) => {
      this.syncWithWorldModel();
    });
  }

  /**
   * Synchronizes CanonicalWorldModelEntity items into 3D SpatialEntityNodes and builds the BVH index
   */
  public syncWithWorldModel(): void {
    const worldEntities = worldModelGraphService.getEntities();
    const spatialNodes: SpatialEntityNode[] = [];
    this.entityNodesMap.clear();

    worldEntities.forEach((entity, index) => {
      const node = this.convertEntityToSpatialNode(entity, index);
      spatialNodes.push(node);
      this.entityNodesMap.set(entity.id, node);
    });

    this.bvhTree.build(spatialNodes);
  }

  /**
   * Converts a Canonical entity into a 3D bounding volume
   */
  private convertEntityToSpatialNode(entity: CanonicalWorldModelEntity, fallbackIndex: number): SpatialEntityNode {
    // Determine 3D coordinates based on location or default radial ring
    let x = (entity.location.longitude - 55.27) * 1000;
    let z = (entity.location.latitude - 25.20) * 1000;
    let y = entity.geometry.elevationMslMeters || 0;

    // Normalize coordinates for readable 3D scene scale if standard GPS offset is too vast
    if (isNaN(x) || Math.abs(x) > 500) {
      const angle = (fallbackIndex / 10) * Math.PI * 2;
      const radius = 60 + (fallbackIndex % 3) * 30;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = (fallbackIndex % 5) * 10;
    }

    const height = Math.max(10, entity.attributes.totalHeightMeters || entity.geometry.heightMeters || 40);
    const radius = Math.max(10, entity.geometry.boundingRadiusMeters || 25);

    const bounds: BoundingBox3D = {
      min: { x: x - radius, y: y, z: z - radius },
      max: { x: x + radius, y: y + height, z: z + radius },
      center: { x, y: y + height / 2, z },
      radius: Math.sqrt(radius * radius + (height / 2) * (height / 2))
    };

    const isMovable = entity.entityClass === 'COMPONENT' || entity.entityClass === 'SYSTEM' || entity.lifecycleState === 'DESIGN';
    const isSelectable = true;

    return {
      id: entity.id,
      name: entity.name,
      arabicName: entity.arabicName,
      entityClass: entity.entityClass,
      bounds,
      worldPosition: { x, y, z },
      isMovable,
      isSelectable,
      metadata: {
        canonicalCode: entity.canonicalCode,
        vitalityScore: entity.currentState.vitalityScore,
        lifecycleState: entity.lifecycleState,
        epistemologicalTag: entity.epistemologicalTag
      }
    };
  }

  /**
   * Casts a 3D ray into the World Model and returns the primary hit entity
   */
  public castRay(ray: Ray3D, maxDistance: number = 2000): RaycastHit | null {
    const hits = this.bvhTree.coneCast(ray, 4.0, maxDistance);
    if (hits.length === 0) {
      this.hitCounter = 0;
      this.lastHitEntityId = null;
      return null;
    }

    const primaryHit = hits[0];

    // Apply hysteresis to prevent rapid hovering flickering
    if (primaryHit.entityId === this.lastHitEntityId) {
      this.hitCounter++;
    } else {
      this.hitCounter = 1;
      this.lastHitEntityId = primaryHit.entityId;
    }

    return primaryHit;
  }

  /**
   * Helper to construct a 3D ray from 2D screen / Normalized Hand Landmark coordinates (0..1)
   */
  public screenToWorldRay(
    screenX: number,
    screenY: number,
    cameraPosition: Vector3D = { x: 0, y: 80, z: 220 },
    cameraTarget: Vector3D = { x: 0, y: 20, z: 0 },
    fovDeg: number = 60
  ): Ray3D {
    // Map normalized screen coordinates (0..1) to NDC (-1..1)
    const ndcX = (screenX - 0.5) * 2;
    const ndcY = -(screenY - 0.5) * 2;

    const fovRad = (fovDeg * Math.PI) / 180;
    const aspect = 16 / 9;

    // Calculate camera basis vectors
    const forward = this.normalize({
      x: cameraTarget.x - cameraPosition.x,
      y: cameraTarget.y - cameraPosition.y,
      z: cameraTarget.z - cameraPosition.z
    });

    const worldUp: Vector3D = { x: 0, y: 1, z: 0 };
    const right = this.normalize(this.cross(forward, worldUp));
    const up = this.cross(right, forward);

    const halfHeight = Math.tan(fovRad / 2);
    const halfWidth = halfHeight * aspect;

    const direction = this.normalize({
      x: forward.x + right.x * ndcX * halfWidth + up.x * ndcY * halfHeight,
      y: forward.y + right.y * ndcX * halfWidth + up.y * ndcY * halfHeight,
      z: forward.z + right.z * ndcX * halfWidth + up.z * ndcY * halfHeight
    });

    return {
      origin: cameraPosition,
      direction
    };
  }

  public getEntityNode(id: string): SpatialEntityNode | undefined {
    return this.entityNodesMap.get(id);
  }

  public getAllNodes(): SpatialEntityNode[] {
    return Array.from(this.entityNodesMap.values());
  }

  private normalize(v: Vector3D): Vector3D {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  private cross(a: Vector3D, b: Vector3D): Vector3D {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }
}

export const spatialRaycaster = new SpatialRaycaster();
