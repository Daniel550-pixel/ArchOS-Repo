// src/services/spatial/SpatialBVHTree.ts
// High-performance Bounding Volume Hierarchy (BVH) for UAE World Model spatial raycasting

import { Vector3D, Ray3D, BoundingBox3D, SpatialEntityNode, RaycastHit, BVHNode } from './types';

export class SpatialBVHTree {
  private root: BVHNode | null = null;
  private maxLeafEntities = 2;

  constructor(entities: SpatialEntityNode[] = []) {
    if (entities.length > 0) {
      this.build(entities);
    }
  }

  public build(entities: SpatialEntityNode[]): void {
    if (!entities || entities.length === 0) {
      this.root = null;
      return;
    }
    this.root = this.buildNode([...entities]);
  }

  private buildNode(entities: SpatialEntityNode[]): BVHNode {
    const bounds = this.computeBounds(entities);

    if (entities.length <= this.maxLeafEntities) {
      return {
        bounds,
        entities,
        isLeaf: true
      };
    }

    // Determine the axis with the largest extent
    const extentX = bounds.max.x - bounds.min.x;
    const extentY = bounds.max.y - bounds.min.y;
    const extentZ = bounds.max.z - bounds.min.z;

    let splitAxis: 'x' | 'y' | 'z' = 'x';
    if (extentY > extentX && extentY > extentZ) {
      splitAxis = 'y';
    } else if (extentZ > extentX && extentZ > extentY) {
      splitAxis = 'z';
    }

    // Sort entities by centroid along the split axis
    entities.sort((a, b) => {
      const cA = a.bounds.center ? a.bounds.center[splitAxis] : (a.bounds.min[splitAxis] + a.bounds.max[splitAxis]) / 2;
      const cB = b.bounds.center ? b.bounds.center[splitAxis] : (b.bounds.min[splitAxis] + b.bounds.max[splitAxis]) / 2;
      return cA - cB;
    });

    const mid = Math.floor(entities.length / 2);
    const leftEntities = entities.slice(0, mid);
    const rightEntities = entities.slice(mid);

    // Fallback if mid split fails
    if (leftEntities.length === 0 || rightEntities.length === 0) {
      return {
        bounds,
        entities,
        isLeaf: true
      };
    }

    return {
      bounds,
      left: this.buildNode(leftEntities),
      right: this.buildNode(rightEntities),
      entities: [],
      isLeaf: false
    };
  }

  private computeBounds(entities: SpatialEntityNode[]): BoundingBox3D {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const e of entities) {
      minX = Math.min(minX, e.bounds.min.x);
      minY = Math.min(minY, e.bounds.min.y);
      minZ = Math.min(minZ, e.bounds.min.z);
      maxX = Math.max(maxX, e.bounds.max.x);
      maxY = Math.max(maxY, e.bounds.max.y);
      maxZ = Math.max(maxZ, e.bounds.max.z);
    }

    const min = { x: minX, y: minY, z: minZ };
    const max = { x: maxX, y: maxY, z: maxZ };
    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };
    const radius = Math.sqrt(
      Math.pow((maxX - minX) / 2, 2) +
      Math.pow((maxY - minY) / 2, 2) +
      Math.pow((maxZ - minZ) / 2, 2)
    );

    return { min, max, center, radius };
  }

  /**
   * Ray-AABB intersection via optimized Slab method
   */
  public intersectRayBox(ray: Ray3D, box: BoundingBox3D): { hit: boolean; tMin: number; tMax: number } {
    let tmin = -Infinity;
    let tmax = Infinity;

    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];

    for (const axis of axes) {
      const origin = ray.origin[axis];
      const dir = ray.direction[axis];
      const bmin = box.min[axis];
      const bmax = box.max[axis];

      if (Math.abs(dir) < 1e-6) {
        // Ray is parallel to slab
        if (origin < bmin || origin > bmax) {
          return { hit: false, tMin: 0, tMax: 0 };
        }
      } else {
        const invD = 1.0 / dir;
        let t1 = (bmin - origin) * invD;
        let t2 = (bmax - origin) * invD;

        if (t1 > t2) {
          const temp = t1;
          t1 = t2;
          t2 = temp;
        }

        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);

        if (tmin > tmax || tmax < 0) {
          return { hit: false, tMin: 0, tMax: 0 };
        }
      }
    }

    return { hit: true, tMin: Math.max(0, tmin), tMax: tmax };
  }

  /**
   * Traverse the BVH tree and return sorted raycast hits
   */
  public raycast(ray: Ray3D, maxDistance: number = 1000): RaycastHit[] {
    if (!this.root) return [];

    const hits: RaycastHit[] = [];
    this.traverseRay(this.root, ray, maxDistance, hits);

    // Sort hits from closest to farthest
    hits.sort((a, b) => a.distance - b.distance);
    return hits;
  }

  private traverseRay(node: BVHNode, ray: Ray3D, maxDist: number, hits: RaycastHit[]): void {
    const boxHit = this.intersectRayBox(ray, node.bounds);
    if (!boxHit.hit || boxHit.tMin > maxDist) {
      return;
    }

    if (node.isLeaf) {
      for (const entity of node.entities) {
        const entHit = this.intersectRayBox(ray, entity.bounds);
        if (entHit.hit && entHit.tMin <= maxDist) {
          // Calculate hit surface point & normal
          const hitPoint: Vector3D = {
            x: ray.origin.x + ray.direction.x * entHit.tMin,
            y: ray.origin.y + ray.direction.y * entHit.tMin,
            z: ray.origin.z + ray.direction.z * entHit.tMin
          };

          const normal = this.computeBoxNormal(hitPoint, entity.bounds);

          hits.push({
            entityId: entity.id,
            entityName: entity.name,
            entityClass: entity.entityClass,
            distance: entHit.tMin,
            point: hitPoint,
            normal,
            isMovable: entity.isMovable,
            isSelectable: entity.isSelectable,
            node: entity
          });
        }
      }
      return;
    }

    if (node.left) {
      this.traverseRay(node.left, ray, maxDist, hits);
    }
    if (node.right) {
      this.traverseRay(node.right, ray, maxDist, hits);
    }
  }

  /**
   * Tolerant cone raycasting (generous radius for gesture-based hovering)
   */
  public coneCast(ray: Ray3D, coneAngleDeg: number = 5.0, maxDistance: number = 1000): RaycastHit[] {
    const hits = this.raycast(ray, maxDistance);
    if (hits.length > 0) return hits;

    // Expand bounding boxes slightly for cone tolerance
    const toleranceOffset = Math.tan((coneAngleDeg * Math.PI) / 180) * 50;
    const expandedHits: RaycastHit[] = [];

    const testAllEntities = (node: BVHNode) => {
      if (node.isLeaf) {
        for (const entity of node.entities) {
          const expandedBox: BoundingBox3D = {
            min: {
              x: entity.bounds.min.x - toleranceOffset,
              y: entity.bounds.min.y - toleranceOffset,
              z: entity.bounds.min.z - toleranceOffset
            },
            max: {
              x: entity.bounds.max.x + toleranceOffset,
              y: entity.bounds.max.y + toleranceOffset,
              z: entity.bounds.max.z + toleranceOffset
            }
          };

          const boxHit = this.intersectRayBox(ray, expandedBox);
          if (boxHit.hit && boxHit.tMin <= maxDistance) {
            const hitPoint: Vector3D = {
              x: ray.origin.x + ray.direction.x * boxHit.tMin,
              y: ray.origin.y + ray.direction.y * boxHit.tMin,
              z: ray.origin.z + ray.direction.z * boxHit.tMin
            };
            expandedHits.push({
              entityId: entity.id,
              entityName: entity.name,
              entityClass: entity.entityClass,
              distance: boxHit.tMin,
              point: hitPoint,
              normal: { x: 0, y: 1, z: 0 },
              isMovable: entity.isMovable,
              isSelectable: entity.isSelectable,
              node: entity
            });
          }
        }
        return;
      }
      if (node.left) testAllEntities(node.left);
      if (node.right) testAllEntities(node.right);
    };

    if (this.root) {
      testAllEntities(this.root);
    }

    expandedHits.sort((a, b) => a.distance - b.distance);
    return expandedHits;
  }

  private computeBoxNormal(point: Vector3D, box: BoundingBox3D): Vector3D {
    const eps = 0.01;
    if (Math.abs(point.x - box.min.x) < eps) return { x: -1, y: 0, z: 0 };
    if (Math.abs(point.x - box.max.x) < eps) return { x: 1, y: 0, z: 0 };
    if (Math.abs(point.y - box.min.y) < eps) return { x: 0, y: -1, z: 0 };
    if (Math.abs(point.y - box.max.y) < eps) return { x: 0, y: 1, z: 0 };
    if (Math.abs(point.z - box.min.z) < eps) return { x: 0, y: 0, z: -1 };
    if (Math.abs(point.z - box.max.z) < eps) return { x: 0, y: 0, z: 1 };
    return { x: 0, y: 1, z: 0 };
  }
}
