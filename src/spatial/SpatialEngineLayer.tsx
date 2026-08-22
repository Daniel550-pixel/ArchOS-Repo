import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
} from 'three';
import { SpatialEngine, type SpatialEdge } from './SpatialEngine';
import type { SpatialEntity } from './WorldModelSpatialBridge';

const MAX_EDGE_VERTICES = 4096 * 2;

export function SpatialEngineLayer({ entities }: { entities: SpatialEntity[] }) {
  const engine = useMemo(
    () => new SpatialEngine({ spatialCadenceMs: 120, graphCadenceMs: 240, maxEdgesPerNode: 8 }),
    [],
  );
  const geometry = useMemo(() => new BufferGeometry(), []);
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
  const lastEdgeCount = useRef(-1);
  const edgesRef = useRef<SpatialEdge[]>([]);

  useEffect(() => {
    engine.setEntities(entities);
  }, [engine, entities]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(({ clock }) => {
    const snapshot = engine.tick(clock.elapsedTime, entities);
    edgesRef.current = snapshot.edges;

    if (snapshot.metrics.edges !== lastEdgeCount.current) {
      const vertices = new Float32Array(
        Math.min(snapshot.edges.length * 6, MAX_EDGE_VERTICES * 3),
      );
      let offset = 0;

      for (const edge of snapshot.edges) {
        const source = engine.getNode(edge.source);
        const target = engine.getNode(edge.target);
        if (!source || !target || offset + 6 > vertices.length) continue;
        vertices[offset++] = source.position.x;
        vertices[offset++] = source.position.y;
        vertices[offset++] = source.position.z;
        vertices[offset++] = target.position.x;
        vertices[offset++] = target.position.y;
        vertices[offset++] = target.position.z;
      }

      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      geometry.setDrawRange(0, offset / 3);
      geometry.attributes.position.needsUpdate = true;
      lastEdgeCount.current = snapshot.metrics.edges;
    } else {
      const position = geometry.getAttribute('position') as Float32BufferAttribute | undefined;
      if (!position) return;

      let offset = 0;
      for (const edge of edgesRef.current) {
        const source = engine.getNode(edge.source);
        const target = engine.getNode(edge.target);
        if (!source || !target || offset + 6 > position.array.length) continue;
        position.array[offset++] = source.position.x;
        position.array[offset++] = source.position.y;
        position.array[offset++] = source.position.z;
        position.array[offset++] = target.position.x;
        position.array[offset++] = target.position.y;
        position.array[offset++] = target.position.z;
      }
      position.needsUpdate = true;
    }

    material.opacity = 0.028 + (Math.sin(clock.elapsedTime * 0.9) * 0.5 + 0.5) * 0.035;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled />;
}
