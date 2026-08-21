// src/lib/renderer/bvh/BVHBuilder.ts
// High-Performance Surface Area Heuristic (SAH) Bounding Volume Hierarchy Builder for GPU & CPU

import {
  AABB,
  BVHStats,
  FlatBVHTriangle,
  LinearBVH,
  RTXMaterial,
  RTXMesh,
  RTXScene
} from '../types';

export interface BuildTriangle {
  v0: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
  centroid: [number, number, number];
  min: [number, number, number];
  max: [number, number, number];
  normal: [number, number, number];
  materialId: number;
  meshId: number;
  area: number;
}

interface TempBVHNode {
  aabb: AABB;
  left: TempBVHNode | null;
  right: TempBVHNode | null;
  firstTri: number;
  triCount: number; // 0 if interior
  depth: number;
}

export interface BVHBuilderOptions {
  maxLeafSize?: number;
  binCount?: number;
  traversalCost?: number;
  intersectionCost?: number;
}

export class BVHBuilder {
  private static readonly DEFAULT_OPTIONS: Required<BVHBuilderOptions> = {
    maxLeafSize: 4,
    binCount: 16,
    traversalCost: 1.0,
    intersectionCost: 1.5
  };

  /**
   * Builds an optimized Linear BVH from a collection of meshes and material palette
   */
  public static buildFromScene(scene: RTXScene, options?: BVHBuilderOptions): LinearBVH {
    const startTime = performance.now();
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // 1. Extract all triangles in world space
    const materialMap = new Map<string, number>();
    Object.keys(scene.materials).forEach((matKey, idx) => {
      materialMap.set(matKey, idx);
    });

    const triangles: BuildTriangle[] = [];
    let meshIdCounter = 0;

    for (const mesh of scene.meshes) {
      const matIdx = materialMap.get(mesh.materialId) ?? 0;
      const meshTris = this.extractMeshTriangles(mesh, matIdx, meshIdCounter++);
      triangles.push(...meshTris);
    }

    if (triangles.length === 0) {
      // Empty dummy fallback BVH
      const dummyAABB: AABB = { min: [-100, 0, -100], max: [100, 100, 100] };
      const nodeBuffer = new Float32Array(8);
      nodeBuffer[0] = dummyAABB.min[0];
      nodeBuffer[1] = dummyAABB.min[1];
      nodeBuffer[2] = dummyAABB.min[2];
      nodeBuffer[3] = 0; // firstTri
      nodeBuffer[4] = dummyAABB.max[0];
      nodeBuffer[5] = dummyAABB.max[1];
      nodeBuffer[6] = dummyAABB.max[2];
      nodeBuffer[7] = 0; // triCount = 0

      return {
        nodeBuffer,
        triBuffer: new Float32Array(16),
        nodeCount: 1,
        triCount: 0,
        stats: {
          totalTriangles: 0,
          nodeCount: 1,
          leafCount: 1,
          maxDepth: 1,
          buildTimeMs: performance.now() - startTime,
          sahCost: 0
        }
      };
    }

    // 2. Build SAH Binary Tree
    let maxDepth = 0;
    let totalNodes = 0;
    let totalLeaves = 0;

    const buildNode = (
      start: number,
      count: number,
      depth: number
    ): TempBVHNode => {
      totalNodes++;
      maxDepth = Math.max(maxDepth, depth);

      const nodeAABB = this.computeBounds(triangles, start, count);

      // Leaf termination condition
      if (count <= opts.maxLeafSize || depth >= 32) {
        totalLeaves++;
        return {
          aabb: nodeAABB,
          left: null,
          right: null,
          firstTri: start,
          triCount: count,
          depth
        };
      }

      // 3. Find optimal split using Surface Area Heuristic (SAH)
      const split = this.findBestSAHSplit(triangles, start, count, nodeAABB, opts);

      if (!split || split.cost >= count * opts.intersectionCost) {
        // Splitting does not reduce cost; make it a leaf
        totalLeaves++;
        return {
          aabb: nodeAABB,
          left: null,
          right: null,
          firstTri: start,
          triCount: count,
          depth
        };
      }

      // Partition triangles around split axis and position
      const mid = this.partitionTriangles(
        triangles,
        start,
        count,
        split.axis,
        split.splitPos
      );

      // Handle degenerate splits where one side is empty
      if (mid === start || mid === start + count) {
        // Fallback to spatial median split
        const fallbackMid = start + (count >> 1);
        this.quickSelect(triangles, start, count, fallbackMid, split.axis);

        const leftChild = buildNode(start, fallbackMid - start, depth + 1);
        const rightChild = buildNode(fallbackMid, start + count - fallbackMid, depth + 1);

        return {
          aabb: nodeAABB,
          left: leftChild,
          right: rightChild,
          firstTri: 0,
          triCount: 0,
          depth
        };
      }

      const leftChild = buildNode(start, mid - start, depth + 1);
      const rightChild = buildNode(mid, start + count - mid, depth + 1);

      return {
        aabb: nodeAABB,
        left: leftChild,
        right: rightChild,
        firstTri: 0,
        triCount: 0,
        depth
      };
    };

    const root = buildNode(0, triangles.length, 1);

    // 4. Flatten tree into Linear BVH GPU format (LBVH)
    const flatNodes: number[] = [];
    const orderedTriangles: BuildTriangle[] = [];

    const flattenTree = (node: TempBVHNode): number => {
      const nodeIndex = flatNodes.length / 8;

      // Reserve space for current node (8 floats)
      for (let i = 0; i < 8; i++) flatNodes.push(0);

      const aabb = node.aabb;
      const isLeaf = node.triCount > 0;

      if (isLeaf) {
        const firstTriOffset = orderedTriangles.length;
        for (let i = 0; i < node.triCount; i++) {
          orderedTriangles.push(triangles[node.firstTri + i]);
        }

        // Write Leaf Node: [min.xyz, firstTriOffset, max.xyz, triCount]
        flatNodes[nodeIndex * 8 + 0] = aabb.min[0];
        flatNodes[nodeIndex * 8 + 1] = aabb.min[1];
        flatNodes[nodeIndex * 8 + 2] = aabb.min[2];
        flatNodes[nodeIndex * 8 + 3] = firstTriOffset;

        flatNodes[nodeIndex * 8 + 4] = aabb.max[0];
        flatNodes[nodeIndex * 8 + 5] = aabb.max[1];
        flatNodes[nodeIndex * 8 + 6] = aabb.max[2];
        flatNodes[nodeIndex * 8 + 7] = node.triCount; // > 0
      } else {
        // Interior node: recursively flatten children
        const leftChildIdx = flattenTree(node.left!);
        flattenTree(node.right!); // Right child is sequentially adjacent or traversed via leftChildIdx + 1

        // Write Interior Node: [min.xyz, leftChildIdx, max.xyz, 0]
        flatNodes[nodeIndex * 8 + 0] = aabb.min[0];
        flatNodes[nodeIndex * 8 + 1] = aabb.min[1];
        flatNodes[nodeIndex * 8 + 2] = aabb.min[2];
        flatNodes[nodeIndex * 8 + 3] = leftChildIdx;

        flatNodes[nodeIndex * 8 + 4] = aabb.max[0];
        flatNodes[nodeIndex * 8 + 5] = aabb.max[1];
        flatNodes[nodeIndex * 8 + 6] = aabb.max[2];
        flatNodes[nodeIndex * 8 + 7] = 0; // 0 denotes inner node
      }

      return nodeIndex;
    };

    flattenTree(root);

    // 5. Serialize triangles into Float32Array (16 floats per triangle)
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
    const buildTimeMs = performance.now() - startTime;

    return {
      nodeBuffer,
      triBuffer,
      nodeCount: totalNodes,
      triCount: orderedTriangles.length,
      stats: {
        totalTriangles: orderedTriangles.length,
        nodeCount: totalNodes,
        leafCount: totalLeaves,
        maxDepth,
        buildTimeMs: Number(buildTimeMs.toFixed(2))
      }
    };
  }

  /**
   * Extracts transformed world-space triangles from an RTXMesh
   */
  private static extractMeshTriangles(
    mesh: RTXMesh,
    materialId: number,
    meshId: number
  ): BuildTriangle[] {
    const triangles: BuildTriangle[] = [];
    const v = mesh.vertices;
    const idx = mesh.indices;
    const m = mesh.transform;

    const numTriangles = idx.length / 3;

    for (let i = 0; i < numTriangles; i++) {
      const i0 = idx[i * 3 + 0];
      const i1 = idx[i * 3 + 1];
      const i2 = idx[i * 3 + 2];

      const p0 = this.transformPoint([v[i0 * 3], v[i0 * 3 + 1], v[i0 * 3 + 2]], m);
      const p1 = this.transformPoint([v[i1 * 3], v[i1 * 3 + 1], v[i1 * 3 + 2]], m);
      const p2 = this.transformPoint([v[i2 * 3], v[i2 * 3 + 1], v[i2 * 3 + 2]], m);

      // Centroid
      const centroid: [number, number, number] = [
        (p0[0] + p1[0] + p2[0]) / 3.0,
        (p0[1] + p1[1] + p2[1]) / 3.0,
        (p0[2] + p1[2] + p2[2]) / 3.0
      ];

      // AABB
      const min: [number, number, number] = [
        Math.min(p0[0], p1[0], p2[0]),
        Math.min(p0[1], p1[1], p2[1]),
        Math.min(p0[2], p1[2], p2[2])
      ];
      const max: [number, number, number] = [
        Math.max(p0[0], p1[0], p2[0]),
        Math.max(p0[1], p1[1], p2[1]),
        Math.max(p0[2], p1[2], p2[2])
      ];

      // Face normal & area
      const e1: [number, number, number] = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
      const e2: [number, number, number] = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
      const cross: [number, number, number] = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0]
      ];
      const len = Math.sqrt(cross[0] * cross[0] + cross[1] * cross[1] + cross[2] * cross[2]);
      const area = len * 0.5;
      const normal: [number, number, number] = len > 1e-6
        ? [cross[0] / len, cross[1] / len, cross[2] / len]
        : [0, 1, 0];

      triangles.push({
        v0: p0,
        v1: p1,
        v2: p2,
        centroid,
        min,
        max,
        normal,
        materialId,
        meshId,
        area
      });
    }

    return triangles;
  }

  private static transformPoint(p: [number, number, number], m: Float32Array): [number, number, number] {
    if (!m || m.length < 16) return p;
    // Standard Column-Major 4x4 matrix multiply
    const x = p[0] * m[0] + p[1] * m[4] + p[2] * m[8] + m[12];
    const y = p[0] * m[1] + p[1] * m[5] + p[2] * m[9] + m[13];
    const z = p[0] * m[2] + p[1] * m[6] + p[2] * m[10] + m[14];
    const w = p[0] * m[3] + p[1] * m[7] + p[2] * m[11] + m[15];
    const invW = Math.abs(w) > 1e-6 ? 1.0 / w : 1.0;
    return [x * invW, y * invW, z * invW];
  }

  private static computeBounds(triangles: BuildTriangle[], start: number, count: number): AABB {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = start; i < start + count; i++) {
      const t = triangles[i];
      if (t.min[0] < minX) minX = t.min[0];
      if (t.min[1] < minY) minY = t.min[1];
      if (t.min[2] < minZ) minZ = t.min[2];

      if (t.max[0] > maxX) maxX = t.max[0];
      if (t.max[1] > maxY) maxY = t.max[1];
      if (t.max[2] > maxZ) maxZ = t.max[2];
    }

    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    };
  }

  private static surfaceArea(aabb: AABB): number {
    const dx = Math.max(0, aabb.max[0] - aabb.min[0]);
    const dy = Math.max(0, aabb.max[1] - aabb.min[1]);
    const dz = Math.max(0, aabb.max[2] - aabb.min[2]);
    return 2.0 * (dx * dy + dy * dz + dz * dx);
  }

  /**
   * Evaluates Surface Area Heuristic (SAH) across axes and bins to find the minimal cost partition
   */
  private static findBestSAHSplit(
    triangles: BuildTriangle[],
    start: number,
    count: number,
    parentAABB: AABB,
    opts: Required<BVHBuilderOptions>
  ): { axis: number; splitPos: number; cost: number } | null {
    const parentArea = this.surfaceArea(parentAABB);
    if (parentArea <= 1e-6) return null;

    let bestCost = Infinity;
    let bestAxis = 0;
    let bestSplitPos = 0;

    const numBins = opts.binCount;

    for (let axis = 0; axis < 3; axis++) {
      // Find centroid bounds along axis
      let cMin = Infinity;
      let cMax = -Infinity;

      for (let i = start; i < start + count; i++) {
        const c = triangles[i].centroid[axis];
        if (c < cMin) cMin = c;
        if (c > cMax) cMax = c;
      }

      if (cMax - cMin <= 1e-6) continue;

      // Initialize bins
      const binCounts = new Int32Array(numBins);
      const binAABBs: AABB[] = [];
      for (let b = 0; b < numBins; b++) {
        binAABBs.push({
          min: [Infinity, Infinity, Infinity],
          max: [-Infinity, -Infinity, -Infinity]
        });
      }

      const scale = numBins / (cMax - cMin);

      for (let i = start; i < start + count; i++) {
        const t = triangles[i];
        let binIdx = Math.floor((t.centroid[axis] - cMin) * scale);
        binIdx = Math.max(0, Math.min(numBins - 1, binIdx));

        binCounts[binIdx]++;
        const bBox = binAABBs[binIdx];
        bBox.min[0] = Math.min(bBox.min[0], t.min[0]);
        bBox.min[1] = Math.min(bBox.min[1], t.min[1]);
        bBox.min[2] = Math.min(bBox.min[2], t.min[2]);

        bBox.max[0] = Math.max(bBox.max[0], t.max[0]);
        bBox.max[1] = Math.max(bBox.max[1], t.max[1]);
        bBox.max[2] = Math.max(bBox.max[2], t.max[2]);
      }

      // Sweep from left and right to compute prefix and suffix areas
      const leftCounts = new Int32Array(numBins);
      const leftAreas = new Float32Array(numBins);
      const leftBox: AABB = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      let accumCount = 0;

      for (let b = 0; b < numBins - 1; b++) {
        accumCount += binCounts[b];
        leftCounts[b] = accumCount;

        const bBox = binAABBs[b];
        if (binCounts[b] > 0) {
          leftBox.min[0] = Math.min(leftBox.min[0], bBox.min[0]);
          leftBox.min[1] = Math.min(leftBox.min[1], bBox.min[1]);
          leftBox.min[2] = Math.min(leftBox.min[2], bBox.min[2]);

          leftBox.max[0] = Math.max(leftBox.max[0], bBox.max[0]);
          leftBox.max[1] = Math.max(leftBox.max[1], bBox.max[1]);
          leftBox.max[2] = Math.max(leftBox.max[2], bBox.max[2]);
        }
        leftAreas[b] = this.surfaceArea(leftBox);
      }

      const rightBox: AABB = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      let rightCount = 0;

      for (let b = numBins - 1; b > 0; b--) {
        rightCount += binCounts[b];
        const bBox = binAABBs[b];
        if (binCounts[b] > 0) {
          rightBox.min[0] = Math.min(rightBox.min[0], bBox.min[0]);
          rightBox.min[1] = Math.min(rightBox.min[1], bBox.min[1]);
          rightBox.min[2] = Math.min(rightBox.min[2], bBox.min[2]);

          rightBox.max[0] = Math.max(rightBox.max[0], bBox.max[0]);
          rightBox.max[1] = Math.max(rightBox.max[1], bBox.max[1]);
          rightBox.max[2] = Math.max(rightBox.max[2], bBox.max[2]);
        }
        const rightArea = this.surfaceArea(rightBox);
        const lCount = leftCounts[b - 1];
        const rCount = rightCount;

        if (lCount === 0 || rCount === 0) continue;

        const cost =
          opts.traversalCost +
          (leftAreas[b - 1] * lCount * opts.intersectionCost +
            rightArea * rCount * opts.intersectionCost) /
            parentArea;

        if (cost < bestCost) {
          bestCost = cost;
          bestAxis = axis;
          bestSplitPos = cMin + (b / numBins) * (cMax - cMin);
        }
      }
    }

    if (!isFinite(bestCost)) return null;

    return {
      axis: bestAxis,
      splitPos: bestSplitPos,
      cost: bestCost
    };
  }

  /**
   * Partitions triangles array in-place such that triangles with centroid[axis] < splitPos come first
   */
  private static partitionTriangles(
    triangles: BuildTriangle[],
    start: number,
    count: number,
    axis: number,
    splitPos: number
  ): number {
    let left = start;
    let right = start + count - 1;

    while (left <= right) {
      if (triangles[left].centroid[axis] < splitPos) {
        left++;
      } else {
        const temp = triangles[left];
        triangles[left] = triangles[right];
        triangles[right] = temp;
        right--;
      }
    }

    return left;
  }

  /**
   * QuickSelect median algorithm for fallback balanced partitions
   */
  private static quickSelect(
    triangles: BuildTriangle[],
    start: number,
    count: number,
    k: number,
    axis: number
  ) {
    let left = start;
    let right = start + count - 1;

    while (left < right) {
      const pivotIdx = left + Math.floor(Math.random() * (right - left + 1));
      const pivotVal = triangles[pivotIdx].centroid[axis];

      // Swap pivot to end
      const tempP = triangles[pivotIdx];
      triangles[pivotIdx] = triangles[right];
      triangles[right] = tempP;

      let storeIdx = left;
      for (let i = left; i < right; i++) {
        if (triangles[i].centroid[axis] < pivotVal) {
          const temp = triangles[i];
          triangles[i] = triangles[storeIdx];
          triangles[storeIdx] = temp;
          storeIdx++;
        }
      }

      const tempFinal = triangles[storeIdx];
      triangles[storeIdx] = triangles[right];
      triangles[right] = tempFinal;

      if (storeIdx === k) {
        return;
      } else if (storeIdx < k) {
        left = storeIdx + 1;
      } else {
        right = storeIdx - 1;
      }
    }
  }

  /**
   * CPU-side fast Ray-BVH intersection for verification & testing
   */
  public static intersectRay(
    bvh: LinearBVH,
    origin: [number, number, number],
    dir: [number, number, number],
    maxDist: number = 1e30
  ): { hit: boolean; t: number; normal: [number, number, number]; matId: number } | null {
    const nodes = bvh.nodeBuffer;
    const tris = bvh.triBuffer;
    if (nodes.length === 0 || tris.length === 0) return null;

    let closestT = maxDist;
    let hitNormal: [number, number, number] = [0, 1, 0];
    let hitMat = 0;
    let hasHit = false;

    // Fast Traversal Stack
    const stack = new Int32Array(64);
    let stackPtr = 0;
    stack[stackPtr++] = 0; // Root node index 0

    const invDir = [
      Math.abs(dir[0]) > 1e-8 ? 1.0 / dir[0] : (dir[0] >= 0 ? 1e8 : -1e8),
      Math.abs(dir[1]) > 1e-8 ? 1.0 / dir[1] : (dir[1] >= 0 ? 1e8 : -1e8),
      Math.abs(dir[2]) > 1e-8 ? 1.0 / dir[2] : (dir[2] >= 0 ? 1e8 : -1e8)
    ];

    while (stackPtr > 0) {
      const nodeIdx = stack[--stackPtr];
      const offset = nodeIdx * 8;

      const minX = nodes[offset + 0];
      const minY = nodes[offset + 1];
      const minZ = nodes[offset + 2];
      const leftOrFirst = nodes[offset + 3];

      const maxX = nodes[offset + 4];
      const maxY = nodes[offset + 5];
      const maxZ = nodes[offset + 6];
      const triCount = Math.round(nodes[offset + 7]);

      // AABB Slab Test
      const tx1 = (minX - origin[0]) * invDir[0];
      const tx2 = (maxX - origin[0]) * invDir[0];
      let tmin = Math.min(tx1, tx2);
      let tmax = Math.max(tx1, tx2);

      const ty1 = (minY - origin[1]) * invDir[1];
      const ty2 = (maxY - origin[1]) * invDir[1];
      tmin = Math.max(tmin, Math.min(ty1, ty2));
      tmax = Math.min(tmax, Math.max(ty1, ty2));

      const tz1 = (minZ - origin[2]) * invDir[2];
      const tz2 = (maxZ - origin[2]) * invDir[2];
      tmin = Math.max(tmin, Math.min(tz1, tz2));
      tmax = Math.min(tmax, Math.max(tz1, tz2));

      if (tmax < Math.max(0.0, tmin) || tmin > closestT) {
        continue;
      }

      if (triCount > 0) {
        // Leaf node: intersect triangles
        const firstTri = Math.round(leftOrFirst);
        for (let i = 0; i < triCount; i++) {
          const tOff = (firstTri + i) * 16;
          const v0 = [tris[tOff + 0], tris[tOff + 1], tris[tOff + 2]];
          const matId = Math.round(tris[tOff + 3]);
          const v1 = [tris[tOff + 4], tris[tOff + 5], tris[tOff + 6]];
          const v2 = [tris[tOff + 8], tris[tOff + 9], tris[tOff + 10]];

          // Möller-Trumbore ray-triangle intersection
          const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
          const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

          const pvec = [
            dir[1] * e2[2] - dir[2] * e2[1],
            dir[2] * e2[0] - dir[0] * e2[2],
            dir[0] * e2[1] - dir[1] * e2[0]
          ];
          const det = e1[0] * pvec[0] + e1[1] * pvec[1] + e1[2] * pvec[2];
          if (Math.abs(det) < 1e-8) continue;
          const invDet = 1.0 / det;

          const tvec = [origin[0] - v0[0], origin[1] - v0[1], origin[2] - v0[2]];
          const u = (tvec[0] * pvec[0] + tvec[1] * pvec[1] + tvec[2] * pvec[2]) * invDet;
          if (u < 0.0 || u > 1.0) continue;

          const qvec = [
            tvec[1] * e1[2] - tvec[2] * e1[1],
            tvec[2] * e1[0] - tvec[0] * e1[2],
            tvec[0] * e1[1] - tvec[1] * e1[0]
          ];
          const v = (dir[0] * qvec[0] + dir[1] * qvec[1] + dir[2] * qvec[2]) * invDet;
          if (v < 0.0 || u + v > 1.0) continue;

          const t = (e2[0] * qvec[0] + e2[1] * qvec[1] + e2[2] * qvec[2]) * invDet;
          if (t > 0.001 && t < closestT) {
            closestT = t;
            hitNormal = [tris[tOff + 12], tris[tOff + 13], tris[tOff + 14]];
            hitMat = matId;
            hasHit = true;
          }
        }
      } else {
        // Interior node: push children
        const leftChild = Math.round(leftOrFirst);
        stack[stackPtr++] = leftChild + 1; // right child
        stack[stackPtr++] = leftChild;     // left child
      }
    }

    if (!hasHit) return null;

    return {
      hit: true,
      t: closestT,
      normal: hitNormal,
      matId: hitMat
    };
  }
}
