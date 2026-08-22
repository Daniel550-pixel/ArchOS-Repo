import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Frustum,
  LineBasicMaterial,
  Matrix4,
  Vector3,
} from 'three';
import { SpatialEngine, type SpatialEdge } from './SpatialEngine';
import type { SpatialEntity } from './WorldModelSpatialBridge';

const MAX_EDGES = 4096;
const MAX_POSITION_FLOATS = MAX_EDGES * 6;

export function SpatialEngineLayer({ entities }: { entities: SpatialEntity[] }) {
  const engine = useMemo(
    () => new SpatialEngine({ spatialCadenceMs: 120, graphCadenceMs: 240, maxEdgesPerNode: 8 }),
    [],
  );
  const geometry = useMemo(() => {
    const value = new BufferGeometry();
    value.setAttribute('position', new Float32BufferAttribute(new Float32Array(MAX_POSITION_FLOATS), 3));
    return value;
  }, []);
  const material = useMemo(
    () => new LineBasicMaterial({
      color: '#9bdcff',
      transparent: true,
      opacity: 0.055,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [],
  );
  const edgesRef = useRef<SpatialEdge[]>([]);
  const frustum = useMemo(() => new Frustum(), []);
  const projectionView = useMemo(() => new Matrix4(), []);
  const sourceWorld = useMemo(() => new Vector3(), []);
  const targetWorld = useMemo(() => new Vector3(), []);

  useEffect(() => {
    engine.setEntities(entities);
  }, [engine, entities]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(({ clock, camera }) => {
    const snapshot = engine.tick(clock.elapsedTime, entities);
    edgesRef.current = snapshot.edges;

    projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projectionView);

    const position = geometry.getAttribute('position') as Float32BufferAttribute;
    let offset = 0;
    let visibleEdges = 0;

    for (const edge of edgesRef.current) {
      if (visibleEdges >= MAX_EDGES || offset + 6 > position.array.length) break;

      const source = engine.getNode(edge.source);
      const target = engine.getNode(edge.target);
      if (!source || !target) continue;

      // Individual edge culling prevents the single living-field object from
      // forcing the GPU to process off-screen graph segments.
      sourceWorld.copy(source.position);
      targetWorld.copy(target.position);
      const sourceVisible = frustum.containsPoint(sourceWorld);
      const targetVisible = frustum.containsPoint(targetWorld);
      if (!sourceVisible && !targetVisible) continue;

      // Distance/LOD pruning keeps distant World Model connections sparse while
      // preserving the TON 618 core and module network at full detail.
      if (source.lod === 'point' && target.lod === 'point') continue;

      position.array[offset++] = source.position.x;
      position.array[offset++] = source.position.y;
      position.array[offset++] = source.position.z;
      position.array[offset++] = target.position.x;
      position.array[offset++] = target.position.y;
      position.array[offset++] = target.position.z;
      visibleEdges += 1;
    }

    geometry.setDrawRange(0, offset / 3);
    position.needsUpdate = true;
    material.opacity = 0.028 + (Math.sin(clock.elapsedTime * 0.9) * 0.5 + 0.5) * 0.035;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled />;
}
