// src/lib/renderer/bvh.ts
// Bounding Volume Hierarchy (BVH) with Recursive AABB Spatial Partitioning & GPU Linear Serialization

import { AABB, BVHStats, LinearBVH, RTXMesh, RTXScene } from './types';

export interface TriangleGeometry {
  v0: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
  centroid: [number, number, number];
  aabb: AABB;
  normal: [number, number, number];
  materialId: number;
  meshId: number;
  area: number;
}

export interface BVHBuildOptions {
  maxLeafSize?: number;
  maxDepth?: number;
  useSAH?: boolean;
  sahBins?: number;
  traversalCost?: number;
  intersectionCost?: number;
}

export class BVHNode {
  public aabb: AABB;
  public leftChild: BVHNode | null = null;
  public rightChild: BVHNode | null = null;
  public triangles: TriangleGeometry[] = [];
  public depth: number = 0;
  public splitAxis: number = -1;
  public splitPos: number = 0;

  constructor(aabb: AABB, depth: number = 0) {
    this.aabb = aabb;
    this.depth = depth;
  }

  public get isLeaf(): boolean {
    return this.leftChild === null && this.rightChild === null;
  }

  public get triCount(): number {
    return this.triangles.length;
  }
}

/**
 * High-Performance Bounding Volume Hierarchy (BVH) Engine
 * Performs recursive spatial splitting on mesh geometry to generate AABB nodes
 * and serializes the hierarchy into GPU-friendly Linear BVH (LBVH) buffers.
 */
export class BVH {
  public root: BVHNode | null = null;
  public totalTriangles: number = 0;
  public totalNodes: number = 0;
  public totalLeaves: number = 0;
  public maxDepth: number = 0;
  public buildTimeMs: number = 0;

  private options: Required<BVHBuildOptions>;

  constructor(options: BVHBuildOptions = {}) {
    this.options = {
      maxLeafSize: options.maxLeafSize ?? 4,
      maxDepth: options.maxDepth ?? 32,
      useSAH: options.useSAH ?? true,
      sahBins: options.sahBins ?? 16,
      traversalCost: options.traversalCost ?? 1.0,
      intersectionCost: options.intersectionCost ?? 1.5
    };
  }

  /**
   * Builds the BVH from an RTXScene containing multiple meshes & materials
   */
  public static fromScene(scene: RTXScene, options?: BVHBuildOptions): BVH {
    const bvh = new BVH(options);
    bvh.buildFromScene(scene);
    return bvh;
  }

  /**
   * Builds the BVH from an array of meshes and optional material mapping
   */
  public static fromMeshes(
    meshes: RTXMesh[],
    materialMap?: Map<string, number>,
    options?: BVHBuildOptions
  ): BVH {
    const bvh = new BVH(options);
    bvh.buildFromMeshes(meshes, materialMap);
    return bvh;
  }

  /**
   * Builds the BVH hierarchy from an RTXScene
   */
  public buildFromScene(scene: RTXScene): this {
    const materialMap = new Map<string, number>();
    if (scene.materials) {
      Object.keys(scene.materials).forEach((key, idx) => {
        materialMap.set(key, idx);
      });
    }
    return this.buildFromMeshes(scene.meshes, materialMap);
  }

  /**
   * Builds the BVH hierarchy by extracting world-space triangles and recursively splitting
   */
  public buildFromMeshes(
    meshes: RTXMesh[],
    materialMap: Map<string, number> = new Map()
  ): this {
    const startTime = performance.now();
    this.totalNodes = 0;
    this.totalLeaves = 0;
    this.maxDepth = 0;

    // 1. Extract all world-space triangles from meshes
    const triangles: TriangleGeometry[] = [];
    let meshCounter = 0;

    for (const mesh of meshes) {
      const matId = materialMap.get(mesh.materialId) ?? 0;
      const extracted = this.extractTrianglesFromMesh(mesh, matId, meshCounter++);
      triangles.push(...extracted);
    }

    this.totalTriangles = triangles.length;

    if (triangles.length === 0) {
      const emptyAABB: AABB = {
        min: [-10, 0, -10],
        max: [10, 10, 10]
      };
      this.root = new BVHNode(emptyAABB, 0);
      this.totalNodes = 1;
      this.totalLeaves = 1;
      this.buildTimeMs = performance.now() - startTime;
      return this;
    }

    // 2. Recursive spatial splitting to generate AABB node tree
    this.root = this.recursiveBuildNode(triangles, 0);
    this.buildTimeMs = Number((performance.now() - startTime).toFixed(2));

    return this;
  }

  /**
   * Core recursive splitting algorithm to partition mesh geometry into AABB child nodes
   */
  private recursiveBuildNode(
    triangles: TriangleGeometry[],
    depth: number
  ): BVHNode {
    this.totalNodes++;
    this.maxDepth = Math.max(this.maxDepth, depth);

    const nodeAABB = this.computeBounds(triangles);
    const node = new BVHNode(nodeAABB, depth);

    // Leaf termination criteria
    if (
      triangles.length <= this.options.maxLeafSize ||
      depth >= this.options.maxDepth
    ) {
      this.totalLeaves++;
      node.triangles = triangles;
      return node;
    }

    // Determine optimal split partition
    let bestSplit: { axis: number; splitPos: number; cost: number } | null = null;

    if (this.options.useSAH) {
      bestSplit = this.findBestSAHSplit(triangles, nodeAABB);
    }

    // Fallback: Longest Axis Spatial Median Split
    if (!bestSplit || bestSplit.cost >= triangles.length * this.options.intersectionCost) {
      bestSplit = this.findLongestAxisMedianSplit(triangles, nodeAABB);
    }

    if (!bestSplit) {
      this.totalLeaves++;
      node.triangles = triangles;
      return node;
    }

    // Partition triangles into left and right buckets
    const leftTris: TriangleGeometry[] = [];
    const rightTris: TriangleGeometry[] = [];

    const { axis, splitPos } = bestSplit;
    node.splitAxis = axis;
    node.splitPos = splitPos;

    for (let i = 0; i < triangles.length; i++) {
      const tri = triangles[i];
      if (tri.centroid[axis] < splitPos) {
        leftTris.push(tri);
      } else {
        rightTris.push(tri);
      }
    }

    // Degenerate partition handling
    if (leftTris.length === 0 || rightTris.length === 0) {
      const half = triangles.length >> 1;
      // Sort along axis and split down the middle
      triangles.sort((a, b) => a.centroid[axis] - b.centroid[axis]);
      const leftHalf = triangles.slice(0, half);
      const rightHalf = triangles.slice(half);

      if (leftHalf.length === 0 || rightHalf.length === 0) {
        this.totalLeaves++;
        node.triangles = triangles;
        return node;
      }

      node.leftChild = this.recursiveBuildNode(leftHalf, depth + 1);
      node.rightChild = this.recursiveBuildNode(rightHalf, depth + 1);
      return node;
    }

    // Recursively split children
    node.leftChild = this.recursiveBuildNode(leftTris, depth + 1);
    node.rightChild = this.recursiveBuildNode(rightTris, depth + 1);

    return node;
  }

  /**
   * Computes Surface Area Heuristic (SAH) across axes & spatial bins
   */
  private findBestSAHSplit(
    triangles: TriangleGeometry[],
    parentAABB: AABB
  ): { axis: number; splitPos: number; cost: number } | null {
    const parentArea = this.calculateSurfaceArea(parentAABB);
    if (parentArea <= 1e-7) return null;

    let minCost = Infinity;
    let bestAxis = 0;
    let bestSplitPos = 0;

    const numBins = this.options.sahBins;

    for (let axis = 0; axis < 3; axis++) {
      let minC = Infinity;
      let maxC = -Infinity;

      for (let i = 0; i < triangles.length; i++) {
        const c = triangles[i].centroid[axis];
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }

      const extent = maxC - minC;
      if (extent <= 1e-6) continue;

      const binCounts = new Int32Array(numBins);
      const binAABBs: AABB[] = [];
      for (let b = 0; b < numBins; b++) {
        binAABBs.push({
          min: [Infinity, Infinity, Infinity],
          max: [-Infinity, -Infinity, -Infinity]
        });
      }

      const binScale = numBins / extent;

      for (let i = 0; i < triangles.length; i++) {
        const t = triangles[i];
        let binIdx = Math.floor((t.centroid[axis] - minC) * binScale);
        binIdx = Math.max(0, Math.min(numBins - 1, binIdx));

        binCounts[binIdx]++;
        this.expandAABB(binAABBs[binIdx], t.aabb);
      }

      // Sweep from left to right
      const leftCounts = new Int32Array(numBins);
      const leftAreas = new Float32Array(numBins);
      const leftBox: AABB = {
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity]
      };
      let runningCount = 0;

      for (let b = 0; b < numBins - 1; b++) {
        runningCount += binCounts[b];
        leftCounts[b] = runningCount;
        if (binCounts[b] > 0) {
          this.expandAABB(leftBox, binAABBs[b]);
        }
        leftAreas[b] = this.calculateSurfaceArea(leftBox);
      }

      // Sweep from right to left & evaluate SAH cost
      const rightBox: AABB = {
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity]
      };
      let rightCount = 0;

      for (let b = numBins - 1; b > 0; b--) {
        rightCount += binCounts[b];
        if (binCounts[b] > 0) {
          this.expandAABB(rightBox, binAABBs[b]);
        }
        const rightArea = this.calculateSurfaceArea(rightBox);
        const lCount = leftCounts[b - 1];
        const rCount = rightCount;

        if (lCount === 0 || rCount === 0) continue;

        const cost =
          this.options.traversalCost +
          (leftAreas[b - 1] * lCount * this.options.intersectionCost +
            rightArea * rCount * this.options.intersectionCost) /
            parentArea;

        if (cost < minCost) {
          minCost = cost;
          bestAxis = axis;
          bestSplitPos = minC + (b / numBins) * extent;
        }
      }
    }

    if (!isFinite(minCost)) return null;

    return {
      axis: bestAxis,
      splitPos: bestSplitPos,
      cost: minCost
    };
  }

  /**
   * Splits geometry along the longest dimension of the parent AABB at the spatial median
   */
  private findLongestAxisMedianSplit(
    triangles: TriangleGeometry[],
    parentAABB: AABB
  ): { axis: number; splitPos: number; cost: number } {
    const dx = parentAABB.max[0] - parentAABB.min[0];
    const dy = parentAABB.max[1] - parentAABB.min[1];
    const dz = parentAABB.max[2] - parentAABB.min[2];

    let axis = 0;
    if (dy > dx && dy > dz) axis = 1;
    else if (dz > dx && dz > dy) axis = 2;

    let minC = Infinity;
    let maxC = -Infinity;

    for (let i = 0; i < triangles.length; i++) {
      const c = triangles[i].centroid[axis];
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }

    const splitPos = (minC + maxC) * 0.5;

    return {
      axis,
      splitPos,
      cost: triangles.length * this.options.intersectionCost
    };
  }

  /**
   * Flattens the hierarchical node tree into continuous GPU Float32Array buffers (LBVH)
   */
  public flatten(): LinearBVH {
    if (!this.root) {
      return {
        nodeBuffer: new Float32Array(8),
        triBuffer: new Float32Array(16),
        nodeCount: 0,
        triCount: 0,
        stats: this.getStats()
      };
    }

    const flatNodes: number[] = [];
    const orderedTriangles: TriangleGeometry[] = [];

    const flattenSubtree = (node: BVHNode): number => {
      const nodeIndex = flatNodes.length / 8;

      // Allocate 8 floats for this node
      for (let i = 0; i < 8; i++) flatNodes.push(0);

      const aabb = node.aabb;
      if (node.isLeaf) {
        const firstTriOffset = orderedTriangles.length;
        for (let i = 0; i < node.triangles.length; i++) {
          orderedTriangles.push(node.triangles[i]);
        }

        // Leaf Node packing: [min.xyz, firstTriOffset, max.xyz, triCount]
        flatNodes[nodeIndex * 8 + 0] = aabb.min[0];
        flatNodes[nodeIndex * 8 + 1] = aabb.min[1];
        flatNodes[nodeIndex * 8 + 2] = aabb.min[2];
        flatNodes[nodeIndex * 8 + 3] = firstTriOffset;

        flatNodes[nodeIndex * 8 + 4] = aabb.max[0];
        flatNodes[nodeIndex * 8 + 5] = aabb.max[1];
        flatNodes[nodeIndex * 8 + 6] = aabb.max[2];
        flatNodes[nodeIndex * 8 + 7] = node.triangles.length; // > 0
      } else {
        // Interior Node packing: [min.xyz, leftChildIdx, max.xyz, 0]
        const leftChildIdx = flattenSubtree(node.leftChild!);
        flattenSubtree(node.rightChild!);

        flatNodes[nodeIndex * 8 + 0] = aabb.min[0];
        flatNodes[nodeIndex * 8 + 1] = aabb.min[1];
        flatNodes[nodeIndex * 8 + 2] = aabb.min[2];
        flatNodes[nodeIndex * 8 + 3] = leftChildIdx;

        flatNodes[nodeIndex * 8 + 4] = aabb.max[0];
        flatNodes[nodeIndex * 8 + 5] = aabb.max[1];
        flatNodes[nodeIndex * 8 + 6] = aabb.max[2];
        flatNodes[nodeIndex * 8 + 7] = 0; // 0 denotes interior node
      }

      return nodeIndex;
    };

    flattenSubtree(this.root);

    // Build serialized 16-float triangle buffer
    const triBuffer = new Float32Array(orderedTriangles.length * 16);
    for (let i = 0; i < orderedTriangles.length; i++) {
      const t = orderedTriangles[i];
      const offset = i * 16;

      // vec4 v0_and_mat: [v0.x, v0.y, v0.z, matId]
      triBuffer[offset + 0] = t.v0[0];
      triBuffer[offset + 1] = t.v0[1];
      triBuffer[offset + 2] = t.v0[2];
      triBuffer[offset + 3] = t.materialId;

      // vec4 v1_and_mesh: [v1.x, v1.y, v1.z, meshId]
      triBuffer[offset + 4] = t.v1[0];
      triBuffer[offset + 5] = t.v1[1];
      triBuffer[offset + 6] = t.v1[2];
      triBuffer[offset + 7] = t.meshId;

      // vec4 v2_and_pad: [v2.x, v2.y, v2.z, 0]
      triBuffer[offset + 8] = t.v2[0];
      triBuffer[offset + 9] = t.v2[1];
      triBuffer[offset + 10] = t.v2[2];
      triBuffer[offset + 11] = 0;

      // vec4 normal_and_area: [nx, ny, nz, area]
      triBuffer[offset + 12] = t.normal[0];
      triBuffer[offset + 13] = t.normal[1];
      triBuffer[offset + 14] = t.normal[2];
      triBuffer[offset + 15] = t.area;
    }

    const nodeBuffer = new Float32Array(flatNodes);

    return {
      nodeBuffer,
      triBuffer,
      nodeCount: this.totalNodes,
      triCount: orderedTriangles.length,
      stats: this.getStats()
    };
  }

  public getStats(): BVHStats {
    return {
      totalTriangles: this.totalTriangles,
      nodeCount: this.totalNodes,
      leafCount: this.totalLeaves,
      maxDepth: this.maxDepth,
      buildTimeMs: this.buildTimeMs
    };
  }

  // --- Helper Methods ---

  private extractTrianglesFromMesh(
    mesh: RTXMesh,
    materialId: number,
    meshId: number
  ): TriangleGeometry[] {
    const list: TriangleGeometry[] = [];
    const v = mesh.vertices;
    const idx = mesh.indices;
    const m = mesh.transform;

    const count = idx.length / 3;

    for (let i = 0; i < count; i++) {
      const i0 = idx[i * 3 + 0];
      const i1 = idx[i * 3 + 1];
      const i2 = idx[i * 3 + 2];

      const p0 = this.transformPoint([v[i0 * 3], v[i0 * 3 + 1], v[i0 * 3 + 2]], m);
      const p1 = this.transformPoint([v[i1 * 3], v[i1 * 3 + 1], v[i1 * 3 + 2]], m);
      const p2 = this.transformPoint([v[i2 * 3], v[i2 * 3 + 1], v[i2 * 3 + 2]], m);

      const centroid: [number, number, number] = [
        (p0[0] + p1[0] + p2[0]) / 3.0,
        (p0[1] + p1[1] + p2[1]) / 3.0,
        (p0[2] + p1[2] + p2[2]) / 3.0
      ];

      const aabb: AABB = {
        min: [
          Math.min(p0[0], p1[0], p2[0]),
          Math.min(p0[1], p1[1], p2[1]),
          Math.min(p0[2], p1[2], p2[2])
        ],
        max: [
          Math.max(p0[0], p1[0], p2[0]),
          Math.max(p0[1], p1[1], p2[1]),
          Math.max(p0[2], p1[2], p2[2])
        ]
      };

      const e1: [number, number, number] = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
      const e2: [number, number, number] = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
      const cross: [number, number, number] = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0]
      ];
      const len = Math.sqrt(cross[0] * cross[0] + cross[1] * cross[1] + cross[2] * cross[2]);
      const area = len * 0.5;
      const normal: [number, number, number] =
        len > 1e-7 ? [cross[0] / len, cross[1] / len, cross[2] / len] : [0, 1, 0];

      list.push({
        v0: p0,
        v1: p1,
        v2: p2,
        centroid,
        aabb,
        normal,
        materialId,
        meshId,
        area
      });
    }

    return list;
  }

  private transformPoint(
    p: [number, number, number],
    m: Float32Array
  ): [number, number, number] {
    if (!m || m.length < 16) return p;
    const x = p[0] * m[0] + p[1] * m[4] + p[2] * m[8] + m[12];
    const y = p[0] * m[1] + p[1] * m[5] + p[2] * m[9] + m[13];
    const z = p[0] * m[2] + p[1] * m[6] + p[2] * m[10] + m[14];
    const w = p[0] * m[3] + p[1] * m[7] + p[2] * m[11] + m[15];
    const invW = Math.abs(w) > 1e-6 ? 1.0 / w : 1.0;
    return [x * invW, y * invW, z * invW];
  }

  private computeBounds(triangles: TriangleGeometry[]): AABB {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < triangles.length; i++) {
      const box = triangles[i].aabb;
      if (box.min[0] < minX) minX = box.min[0];
      if (box.min[1] < minY) minY = box.min[1];
      if (box.min[2] < minZ) minZ = box.min[2];

      if (box.max[0] > maxX) maxX = box.max[0];
      if (box.max[1] > maxY) maxY = box.max[1];
      if (box.max[2] > maxZ) maxZ = box.max[2];
    }

    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    };
  }

  private expandAABB(target: AABB, source: AABB) {
    target.min[0] = Math.min(target.min[0], source.min[0]);
    target.min[1] = Math.min(target.min[1], source.min[1]);
    target.min[2] = Math.min(target.min[2], source.min[2]);

    target.max[0] = Math.max(target.max[0], source.max[0]);
    target.max[1] = Math.max(target.max[1], source.max[1]);
    target.max[2] = Math.max(target.max[2], source.max[2]);
  }

  private calculateSurfaceArea(aabb: AABB): number {
    const dx = Math.max(0, aabb.max[0] - aabb.min[0]);
    const dy = Math.max(0, aabb.max[1] - aabb.min[1]);
    const dz = Math.max(0, aabb.max[2] - aabb.min[2]);
    return 2.0 * (dx * dy + dy * dz + dz * dx);
  }
}
