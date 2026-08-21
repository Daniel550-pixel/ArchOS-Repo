// src/lib/renderer/bvh/architecturalMeshes.ts
// Parametric UAE Architectural & BIM Mesh Generators for ArchOS Path Tracing Benchmarks

import { RTXMaterial, RTXMesh, RTXScene } from '../types';

export function createIdentityMatrix(): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
}

export function createTranslationMatrix(x: number, y: number, z: number): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ]);
}

/**
 * Generates a cylindrical or cone frustum mesh
 */
export function generateCylinder(
  radiusBottom: number,
  radiusTop: number,
  height: number,
  segments: number = 32,
  yOffset: number = 0
): { vertices: Float32Array; indices: Uint32Array } {
  const vertices: number[] = [];
  const indices: number[] = [];

  // Bottom center
  const bottomCenterIdx = 0;
  vertices.push(0, yOffset, 0);

  // Top center
  const topCenterIdx = 1;
  vertices.push(0, yOffset + height, 0);

  const startBottom = 2;
  const startTop = startBottom + segments;

  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // Bottom ring
    vertices.push(cos * radiusBottom, yOffset, sin * radiusBottom);
  }

  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // Top ring
    vertices.push(cos * radiusTop, yOffset + height, sin * radiusTop);
  }

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;

    // Bottom cap
    indices.push(bottomCenterIdx, startBottom + next, startBottom + i);

    // Top cap
    indices.push(topCenterIdx, startTop + i, startTop + next);

    // Side quad
    const b0 = startBottom + i;
    const b1 = startBottom + next;
    const t0 = startTop + i;
    const t1 = startTop + next;

    indices.push(b0, t0, b1);
    indices.push(b1, t0, t1);
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices)
  };
}

/**
 * Generates a Torus (Museum of the Future style)
 */
export function generateTorus(
  majorRadius: number = 3.5,
  minorRadius: number = 1.2,
  majorSegments: number = 36,
  minorSegments: number = 20,
  flattenY: number = 0.6
): { vertices: Float32Array; indices: Uint32Array } {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= majorSegments; j++) {
    const u = (j / majorSegments) * Math.PI * 2;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);

    for (let i = 0; i <= minorSegments; i++) {
      const v = (i / minorSegments) * Math.PI * 2;
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);

      const x = (majorRadius + minorRadius * cosV) * cosU;
      const y = minorRadius * sinV * flattenY;
      const z = (majorRadius + minorRadius * cosV) * sinU;

      vertices.push(x, y + 2.5, z);
    }
  }

  for (let j = 0; j < majorSegments; j++) {
    for (let i = 0; i < minorSegments; i++) {
      const row1 = j * (minorSegments + 1);
      const row2 = (j + 1) * (minorSegments + 1);

      const i0 = row1 + i;
      const i1 = row1 + i + 1;
      const i2 = row2 + i + 1;
      const i3 = row2 + i;

      indices.push(i0, i1, i2);
      indices.push(i0, i2, i3);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices)
  };
}

/**
 * Generates an architectural 3D Box/Building Slab
 */
export function generateBox(
  w: number,
  h: number,
  d: number,
  cx: number = 0,
  cy: number = 0,
  cz: number = 0
): { vertices: Float32Array; indices: Uint32Array } {
  const hw = w * 0.5, hh = h * 0.5, hd = d * 0.5;
  const vertices = new Float32Array([
    // Front
    cx - hw, cy - hh, cz + hd,
    cx + hw, cy - hh, cz + hd,
    cx + hw, cy + hh, cz + hd,
    cx - hw, cy + hh, cz + hd,
    // Back
    cx - hw, cy - hh, cz - hd,
    cx - hw, cy + hh, cz - hd,
    cx + hw, cy + hh, cz - hd,
    cx + hw, cy - hh, cz - hd,
    // Top
    cx - hw, cy + hh, cz - hd,
    cx - hw, cy + hh, cz + hd,
    cx + hw, cy + hh, cz + hd,
    cx + hw, cy + hh, cz - hd,
    // Bottom
    cx - hw, cy - hh, cz - hd,
    cx + hw, cy - hh, cz - hd,
    cx + hw, cy - hh, cz + hd,
    cx - hw, cy - hh, cz + hd,
    // Right
    cx + hw, cy - hh, cz - hd,
    cx + hw, cy + hh, cz - hd,
    cx + hw, cy + hh, cz + hd,
    cx + hw, cy - hh, cz + hd,
    // Left
    cx - hw, cy - hh, cz - hd,
    cx - hw, cy - hh, cz + hd,
    cx - hw, cy + hh, cz + hd,
    cx - hw, cy + hh, cz - hd
  ]);

  const indices = new Uint32Array([
    0, 1, 2, 0, 2, 3,       // Front
    4, 5, 6, 4, 6, 7,       // Back
    8, 9, 10, 8, 10, 11,    // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23  // Left
  ]);

  return { vertices, indices };
}

/**
 * Creates the Full Dubai Creek Tower Complex with tensile stayed cable network & podium
 */
export function buildDubaiCreekTowerComplex(): RTXScene {
  const meshes: RTXMesh[] = [];

  // 1. Spire Tapered Central Column (Titanium Gold)
  const coreSpire = generateCylinder(1.2, 0.25, 9.0, 32, 0.0);
  meshes.push({
    id: 'spire_core',
    name: 'Dubai Creek Spire Core',
    vertices: coreSpire.vertices,
    indices: coreSpire.indices,
    materialId: 'titaniumGold',
    transform: createIdentityMatrix()
  });

  // 2. Observation Pod & Floating Atrium (Sovereign Glass)
  const pod = generateCylinder(2.4, 1.8, 1.6, 32, 4.5);
  meshes.push({
    id: 'observation_pod',
    name: 'Sky Observation Pod',
    vertices: pod.vertices,
    indices: pod.indices,
    materialId: 'sovereignGlass',
    transform: createIdentityMatrix()
  });

  // 3. Tensile Stay-Cable Lattice Network (Cable Steel)
  const cableVerts: number[] = [];
  const cableIdx: number[] = [];
  const cableCount = 28;
  const perimeterRadius = 5.8;

  for (let i = 0; i < cableCount; i++) {
    const theta = (i / cableCount) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    const baseIdx = cableVerts.length / 3;
    // Ground anchor point
    cableVerts.push(cos * perimeterRadius, 0.0, sin * perimeterRadius);
    // Spire attachment point
    cableVerts.push(cos * 0.4, 7.8, sin * 0.4);
    // Offset point for cable thickness
    cableVerts.push(cos * perimeterRadius + 0.08, 0.0, sin * perimeterRadius + 0.08);

    cableIdx.push(baseIdx, baseIdx + 1, baseIdx + 2);
  }

  meshes.push({
    id: 'stay_cables',
    name: 'Tensile Cable Stay Network',
    vertices: new Float32Array(cableVerts),
    indices: new Uint32Array(cableIdx),
    materialId: 'steelCable',
    transform: createIdentityMatrix()
  });

  // 4. Ground Plaza & Perimeter Tier Slabs (Sandstone & Marble)
  const groundPlaza = generateBox(28, 0.2, 28, 0, -0.1, 0);
  meshes.push({
    id: 'ground_plaza',
    name: 'Grand Plaza Slab',
    vertices: groundPlaza.vertices,
    indices: groundPlaza.indices,
    materialId: 'sandstoneMarble',
    transform: createIdentityMatrix()
  });

  // 5. Perimeter Solar Photovoltaic Shading Array
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = 7.5;
    const px = Math.cos(angle) * dist;
    const pz = Math.sin(angle) * dist;

    const panel = generateBox(2.2, 0.08, 1.6, 0, 0, 0);
    meshes.push({
      id: `solar_canopy_${i}`,
      name: `Solar Canopy Sector ${i + 1}`,
      vertices: panel.vertices,
      indices: panel.indices,
      materialId: 'solarPV',
      transform: createTranslationMatrix(px, 1.2, pz)
    });
  }

  const materials: Record<string, RTXMaterial> = {
    titaniumGold: {
      name: '24K Sovereign Titanium Gold',
      albedo: [0.98, 0.84, 0.38],
      roughness: 0.12,
      metallic: 0.88,
      emissive: [0, 0, 0]
    },
    sovereignGlass: {
      name: 'Structural Dielectric Glazing',
      albedo: [0.2, 0.85, 0.95],
      roughness: 0.03,
      metallic: 0.2,
      emissive: [0.03, 0.12, 0.18],
      transmission: 0.92,
      ior: 1.52
    },
    steelCable: {
      name: 'High-Tensile Galvanized Steel',
      albedo: [0.75, 0.78, 0.82],
      roughness: 0.28,
      metallic: 0.95,
      emissive: [0, 0, 0]
    },
    sandstoneMarble: {
      name: 'Hajar Desert Sandstone Marble',
      albedo: [0.88, 0.82, 0.72],
      roughness: 0.65,
      metallic: 0.04,
      emissive: [0, 0, 0]
    },
    solarPV: {
      name: 'Bifacial Solar Photovoltaic',
      albedo: [0.08, 0.14, 0.24],
      roughness: 0.18,
      metallic: 0.8,
      emissive: [0.01, 0.03, 0.06]
    }
  };

  return {
    meshes,
    materials,
    lights: [
      {
        type: 'directional',
        position: [15, 25, 10],
        direction: [-0.5, -1.0, -0.3],
        intensity: 2.5,
        color: [1.0, 0.95, 0.88]
      }
    ],
    camera: {
      position: [0, 4.5, 12.0],
      target: [0, 3.5, 0],
      fov: 55,
      aspect: 16 / 9
    }
  };
}

/**
 * Creates Museum of the Future Torus Benchmark Scene
 */
export function buildMuseumOfFutureComplex(): RTXScene {
  const meshes: RTXMesh[] = [];

  // Torus Shell
  const torus = generateTorus(3.8, 1.3, 44, 24, 0.7);
  meshes.push({
    id: 'torus_shell',
    name: 'Calligraphic Torus Structure',
    vertices: torus.vertices,
    indices: torus.indices,
    materialId: 'stainlessSteel',
    transform: createIdentityMatrix()
  });

  // Podium base
  const podium = generateBox(16, 0.8, 16, 0, 0.4, 0);
  meshes.push({
    id: 'green_podium',
    name: 'Botanical Podium Hill',
    vertices: podium.vertices,
    indices: podium.indices,
    materialId: 'terraceStone',
    transform: createIdentityMatrix()
  });

  const materials: Record<string, RTXMaterial> = {
    stainlessSteel: {
      name: 'Architectural Stainless Steel Facade',
      albedo: [0.92, 0.93, 0.95],
      roughness: 0.14,
      metallic: 0.92,
      emissive: [0, 0, 0]
    },
    terraceStone: {
      name: 'Landscaped Terraced Granite',
      albedo: [0.55, 0.62, 0.52],
      roughness: 0.72,
      metallic: 0.05,
      emissive: [0, 0, 0]
    }
  };

  return {
    meshes,
    materials,
    lights: [
      {
        type: 'directional',
        position: [14, 20, 12],
        direction: [-0.6, -1.0, -0.4],
        intensity: 2.2,
        color: [1.0, 0.96, 0.9]
      }
    ],
    camera: {
      position: [0, 3.8, 11.0],
      target: [0, 2.5, 0],
      fov: 50,
      aspect: 16 / 9
    }
  };
}
