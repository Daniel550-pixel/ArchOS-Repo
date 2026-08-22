import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Vector3 } from 'three';
import { SpatialEngine, type SpatialEdge } from './SpatialEngine';
import type { SpatialEntity } from './WorldModelSpatialBridge';

function EdgeField({ engine, edges }: { engine: SpatialEngine; edges: SpatialEdge[] }) {
  const geometry = useMemo(() => new BufferGeometry(), []);
  const material = useMemo(() => new LineBasicMaterial({ color: '#9bdcff', transparent: true, opacity: 0.055, blending: AdditiveBlending }), []);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useFrame(({ clock }) => {
    const vertices: number[] = [];
    for (const edge of edges) {
      const source = edge.source === 'core' ? new Vector3(0, 0, 0) : engine.getNode(edge.source)?.position;
      const target = engine.getNode(edge.target)?.position;
      if (!source || !target) continue;
      vertices.push(source.x, source.y, source.z, target.x, target.y, target.z);
    }
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.computeBoundingSphere();
    material.opacity = 0.028 + (Math.sin(clock.elapsedTime * 0.9) * 0.5 + 0.5) * 0.035;
  });

  return <lineSegments geometry={geometry} material={material} />;
}

export function SpatialEngineLayer({ entities }: { entities: SpatialEntity[] }) {
  const engine = useMemo(() => new SpatialEngine(), []);
  const edges = useRef<SpatialEdge[]>([]);

  useEffect(() => {
    engine.setEntities(entities);
    edges.current = engine.getSnapshot().edges;
  }, [engine, entities]);

  useFrame(({ clock }) => {
    engine.tick(clock.elapsedTime);
    edges.current = engine.getSnapshot().edges;
  });

  return <EdgeField engine={engine} edges={edges.current} />;
}
